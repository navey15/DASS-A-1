# Deployment Guide

This guide will help you deploy the Felicity EMS backend to Render and the frontend to Vercel.

## Prerequisites

- [Render Account](https://render.com/)
- [Vercel Account](https://vercel.com/)
- [MongoDB Database](https://www.mongodb.com/atlas/database) (e.g., MongoDB Atlas)

---

## 1. Backend Deployment (Render)

1.  **Create a New Web Service** on Render.
2.  Connect your GitHub repository.
3.  **Root Directory:** `backend` (Important: This tells Render to look in the backend folder).
4.  **Runtime:** Node
5.  **Build Command:** `npm install`
6.  **Start Command:** `npm start`
7.  **Environment Variables:** Add the following key-value pairs in the "Environment" tab:
    *   `NODE_ENV`: `production`
    *   `MONGO_URI`: `your_mongodb_connection_string`
    *   `JWT_SECRET`: `your_secure_jwt_secret`
    *   `FRONTEND_URL`: `https://your-vercel-frontend-url.vercel.app` (You will set this *after* deploying frontend, for now you can put a placeholder or `*` temporarily if needed for testing, but better to update it later).
8.  **Deploy:** Click "Create Web Service".

**Note on File Uploads:**
Render's free tier uses an ephemeral filesystem. Files uploaded to `uploads/` (like images) will be lost when the server restarts. For persistent file storage, consider using AWS S3, Cloudinary, or Render's persistent disk feature (paid).

---

## 2. Frontend Deployment (Vercel)

1.  **Create a New Project** on Vercel.
2.  Import your GitHub repository.
3.  **Root Directory:** Edit the root directory settings and select `frontend`.
4.  **Framework Preset:** Create React App (should be detected automatically).
5.  **Build Command:** `npm run build` (default).
6.  **Output Directory:** `build` (default).
7.  **Environment Variables:** Add the following:
    *   `REACT_APP_API_URL`: `https://your-render-backend-service.onrender.com` (Use the URL from step 1).
8.  **Deploy:** Click "Deploy".

---

## 3. Final Configuration

1.  Once the frontend is deployed and you have the Vercel URL (e.g., `https://my-app.vercel.app`), go back to your **Render Dashboard**.
2.  Update the `FRONTEND_URL` environment variable to match your *exact* Vercel URL (no trailing slash).
3.  Ensure your **MongoDB** network access allows connections from anywhere (`0.0.0.0/0`) or specifically from Render IPs (though Render IPs change, so `0.0.0.0/0` with strong password is easier).

## Troubleshooting

- **CORS Errors:** Check backend logs. Ensure `FRONTEND_URL` matches exactly (http vs https).
- **404 on Refresh:** If refreshing a page gives a 404, ensure the `vercel.json` file is present in the `frontend` root. It handles client-side routing.
