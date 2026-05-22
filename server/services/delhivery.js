const https = require('https');

/**
 * Request shipment creation with Delhivery
 * @param {Object} order - Order document
 * @returns {Promise<{success: boolean, trackingId?: string, error?: any, message: string}>}
 */
const createShipment = async (order) => {
  const token = process.env.DELHIVERY_API_TOKEN;
  
  if (!token || token === 'mock_token' || token === '') {
    // Simulation Mode: generate a realistic Delhivery tracking ID (AWB)
    const mockAwb = 'DELH' + Math.floor(1000000000 + Math.random() * 9000000000);
    console.log(`[Delhivery Service] SIMULATION: Scheduled courier pickup for Order ID ${order._id}. AWB: ${mockAwb}`);
    return {
      success: true,
      trackingId: mockAwb,
      message: 'Shipment created successfully (Simulated)'
    };
  }

  // Real Integration Mode
  return new Promise((resolve) => {
    const payload = {
      shipments: [
        {
          name: order.shippingAddress.name,
          add: order.shippingAddress.address,
          pin: order.shippingAddress.pincode,
          phone: order.shippingAddress.mobile,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          country: "India",
          payment_mode: order.paymentMethod.startsWith('COD') ? 'COD' : 'Prepaid',
          cod_amount: order.paymentMethod.startsWith('COD') ? order.totalAmount.toString() : '0',
          order: order._id.toString(),
          weight: "0.2", // Default jewellery parcel weight in kg
          products_desc: "Brahmani Jewellers Elegant Ornament",
          quantity: order.items.reduce((acc, item) => acc + item.quantity, 0).toString()
        }
      ],
      pickup_location: {
        name: "Brahmani Jewellers",
        add: "Amraiwadi",
        phone: "917621967577",
        pin: "380026",
        city: "Ahmedabad",
        state: "Gujarat",
        country: "India"
      }
    };

    const postData = `format=json&data=${encodeURIComponent(JSON.stringify(payload))}`;

    const options = {
      hostname: 'track.delhivery.com',
      port: 443,
      path: '/api/cpanel/packages/json/',
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.success && json.packages && json.packages.length > 0) {
            const pkg = json.packages[0];
            if (pkg.status === 'Success') {
              resolve({
                success: true,
                trackingId: pkg.waybill,
                message: 'Shipment created successfully via Delhivery'
              });
            } else {
              resolve({
                success: false,
                error: pkg.remarks || pkg.status,
                message: 'Delhivery packaging status: ' + (pkg.remarks || pkg.status)
              });
            }
          } else {
            resolve({
              success: false,
              error: json.errors || 'API failed',
              message: 'Delhivery API failed'
            });
          }
        } catch (err) {
          resolve({
            success: false,
            error: err.message,
            message: 'Failed to parse Delhivery API response'
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        success: false,
        error: err.message,
        message: 'Delhivery connection error'
      });
    });

    req.write(postData);
    req.end();
  });
};

module.exports = { createShipment };
