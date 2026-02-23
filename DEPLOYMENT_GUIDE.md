# Felicity Event Management System - Deployment Guide

## 📦 Deployment Overview

This guide covers deploying the Felicity Event Management System to production environments.

## 🎯 Deployment Architecture

```
Frontend (Vercel/Netlify) → Backend API (Railway/Render) → MongoDB Atlas
```

## 🗄️ Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster

### Step 2: Configure Database
1. Click "Connect" on your cluster
2. Add your IP address to whitelist (or allow from anywhere: 0.0.0.0/0)
3. Create a database user with password
4. Get your connection string

Example connection string:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/felicity_events?retryWrites=true&w=majority
```

### Step 3: Seed Production Database
```bash
cd backend
# Update .env with production MONGO_URI
npm run seed
```

## 🚀 Backend Deployment

### Option 1: Railway (Recommended)

#### Step 1: Prepare Backend
1. Ensure all dependencies are in `package.json`
2. Create `.gitignore` for `/node_modules` and `.env`

#### Step 2: Deploy to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Add environment variables
railway variables set MONGO_URI="your_mongodb_atlas_uri"
railway variables set JWT_SECRET="your_production_jwt_secret"
railway variables set NODE_ENV="production"
railway variables set FRONTEND_URL="your_frontend_url"

# Deploy
railway up
```

#### Step 3: Get Backend URL
Railway will provide a URL like: `https://your-app.up.railway.app`

### Option 2: Render

#### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/felicity-backend.git
git push -u origin main
```

#### Step 2: Deploy on Render
1. Go to [Render](https://render.com/)
2. Create new "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: felicity-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

#### Step 3: Add Environment Variables
In Render dashboard, add:
```
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_production_jwt_secret_min_32_chars
JWT_EXPIRE=7d
NODE_ENV=production
PORT=10000
FRONTEND_URL=your_frontend_url_when_deployed
```

## 🎨 Frontend Deployment

### Option 1: Vercel (Recommended)

#### Step 1: Prepare Frontend
```bash
cd frontend

# Create production .env
echo "REACT_APP_API_URL=https://your-backend-url.com/api" > .env.production
```

#### Step 2: Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# When prompted, select:
# - Set up and deploy: Yes
# - Which scope: Your account
# - Link to existing project: No
# - Project name: felicity-frontend
# - Directory: ./
# - Override settings: No

# Deploy to production
vercel --prod
```

### Option 2: Netlify

#### Step 1: Build the App
```bash
cd frontend
npm run build
```

#### Step 2: Deploy to Netlify
1. Go to [Netlify](https://netlify.com/)
2. Drag and drop the `build` folder
3. Or connect GitHub repository for continuous deployment

#### Step 3: Configure Environment
In Netlify dashboard → Site settings → Environment variables:
```
REACT_APP_API_URL=https://your-backend-url.com/api
```

#### Step 4: Configure Redirects
Create `frontend/public/_redirects`:
```
/*    /index.html   200
```

## 🔐 Post-Deployment Security

### 1. Update CORS Settings
In `backend/index.js`:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || "https://your-frontend-domain.com",
  credentials: true
}));
```

### 2. Secure Environment Variables
- Never commit `.env` files
- Use strong JWT_SECRET (min 32 characters)
- Rotate secrets regularly
- Use environment-specific variables

### 3. MongoDB Security
- Enable IP whitelist
- Use strong passwords
- Enable connection encryption
- Regular backups

## 📊 Monitoring & Maintenance

### Backend Monitoring
- Check Railway/Render logs regularly
- Set up error tracking (e.g., Sentry)
- Monitor API response times
- Watch database connection issues

### Frontend Monitoring
- Check Vercel/Netlify build logs
- Monitor console errors
- Track user analytics (Google Analytics)

## 🔄 Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        run: |
          npm install -g vercel
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## 🧪 Testing Deployment

### 1. API Health Check
```bash
curl https://your-backend-url.com/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "database": "connected"
}
```

### 2. Test Authentication
```bash
curl -X POST https://your-backend-url.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@felicity.com","password":"Admin@123456"}'
```

### 3. Frontend Testing
1. Visit your frontend URL
2. Try registering a new account
3. Test login with seeded credentials
4. Browse events
5. Test role-based routing

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Database connection failed
- **Solution**: Check MongoDB Atlas IP whitelist, verify connection string

**Problem**: JWT authentication errors
- **Solution**: Ensure JWT_SECRET is set and consistent

**Problem**: CORS errors
- **Solution**: Verify FRONTEND_URL matches actual frontend domain

### Frontend Issues

**Problem**: API calls failing
- **Solution**: Check REACT_APP_API_URL is correct, verify CORS settings

**Problem**: Routes not working after refresh
- **Solution**: Configure `_redirects` file (Netlify) or `vercel.json` (Vercel)

**Problem**: Environment variables not working
- **Solution**: Rebuild after changing env vars, ensure REACT_APP_ prefix

## 📈 Scaling Considerations

### Database Scaling
- Upgrade MongoDB Atlas tier as needed
- Implement database indexes for frequently queried fields
- Consider read replicas for heavy read operations

### Backend Scaling
- Railway/Render auto-scales based on traffic
- Consider adding Redis for caching
- Implement rate limiting for API endpoints

### Frontend Scaling
- Vercel/Netlify have global CDN
- Implement lazy loading for routes
- Optimize images and assets

## 💾 Backup Strategy

### Database Backups
- MongoDB Atlas provides automatic backups
- Export critical data regularly
- Test restoration procedures

### Code Backups
- Use Git for version control
- Tag releases: `git tag v1.0.0`
- Maintain separate branches for dev/staging/prod

## 🔒 SSL/HTTPS

Both Railway/Render and Vercel/Netlify provide automatic SSL certificates. No additional configuration needed!

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- [ ] Update dependencies monthly: `npm update`
- [ ] Review and rotate secrets quarterly
- [ ] Check error logs weekly
- [ ] Monitor database performance
- [ ] Review user feedback

### Emergency Contacts
- Database Issues: MongoDB Atlas Support
- Backend Hosting: Railway/Render Support
- Frontend Hosting: Vercel/Netlify Support

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database seeded with initial data
- [ ] CORS settings updated
- [ ] Security review completed

### Deployment
- [ ] MongoDB Atlas cluster created
- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] API health check passing
- [ ] Test login with admin credentials

### Post-Deployment
- [ ] All routes working correctly
- [ ] Authentication flow tested
- [ ] Role-based access verified
- [ ] Mobile responsiveness checked
- [ ] Performance benchmarks met
- [ ] Error tracking configured
- [ ] Documentation updated

---

**Congratulations! Your Felicity Event Management System is now live! 🎉**
