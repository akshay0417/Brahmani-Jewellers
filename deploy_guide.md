# Brahmani Jewellers Deployment Guide 🚀

This guide explains how to make your website live for free using **MongoDB Atlas**, **Render**, and **Vercel**.

## 1. Database (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free cluster.
3. In **Network Access**, allow access from `0.0.0.0/0` (anywhere).
4. In **Database Access**, create a user and copy the password.
5. Get your **Connection String** (URI) and keep it ready.

## 2. Backend (Render.com)
1. Sign up on [Render](https://render.com/).
2. Create a new **Web Service**.
3. Connect your GitHub repository (or upload code).
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `node index.js`
6. Add **Environment Variables**:
   - `MONGODB_URI`: (Your Atlas URI)
   - `JWT_SECRET`: (Any strong random string)
   - `FRONTEND_URL`: (The URL you get from Vercel later)

## 3. Frontend (Vercel.com)
1. Sign up on [Vercel](https://vercel.com/).
2. Import your `client` folder.
3. Set **Framework Preset**: `Vite`
4. Add **Environment Variables**:
   - `VITE_API_URL`: (The URL you get from Render + `/api`)
5. Deploy!

## 4. Google Search Visibility
Once the site is live:
1. Go to [Google Search Console](https://search.google.com/search-console).
2. Add your Vercel URL.
3. Verify ownership.

---
**Need help with any specific step? Just ask!**
