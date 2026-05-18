require('dotenv').config();
const nodemailer = require('nodemailer');

async function test() {
  console.log("Config:", {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_PORT == 465,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS ? '***' : 'missing'
  });

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_PORT == 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    family: 4,
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    const info = await transporter.sendMail({
      from: `"Brahmani Jewellers" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "Test Email",
      text: "This is a test email."
    });
    console.log("Success:", info.messageId);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
