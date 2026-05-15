# Brahmani Jewellers - Premium Showcase Website

A full-stack modern web application for a luxury jewellery brand.

## Features
- **Royal Aesthetic**: Dark theme with gold and maroon accents.
- **Live Rates**: Dynamic Gold (22K, 24K) and Silver rates with auto-refresh.
- **Jewellery Gallery**: High-quality showcase with category filters and lightbox view.
- **Admin Panel**: Secure JWT-based portal to update rates and manage the gallery.
- **Responsive**: Fully optimized for mobile, tablet, and desktop.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose).
- **Storage**: Cloudinary (for high-quality images).
- **Authentication**: JSON Web Token (JWT).

## Setup Instructions

### Backend
1. Go to the `server` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and add your credentials:
   - `MONGODB_URI`: Your MongoDB Atlas URL.
   - `JWT_SECRET`: A secure random string.
   - `CLOUDINARY_*`: Your Cloudinary account details.
4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend
1. Go to the `client` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Design Palette
- **Gold**: #D4AF37
- **Maroon**: #3B0A0A
- **Black**: #0A0A0A
- **Fonts**: Playfair Display (Serif), Inter (Sans-serif)
