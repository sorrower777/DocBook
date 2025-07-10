# 🚀 Deployment Guide - Fix Localhost Issue

## The Problem
Your Vercel deployment is making requests to `localhost` because the environment variable `REACT_APP_API_URL` is hardcoded to `http://localhost:5000/api`.

## ✅ Solution Steps

### Step 1: Deploy Your Backend First

**Option A: Railway (Recommended)**
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Deploy the `server` folder
4. Set environment variables:
   ```
   MONGO_URI=your-mongodb-connection-string
   JWT_SECRET=your-jwt-secret
   NODE_ENV=production
   CLIENT_URL=https://your-vercel-app.vercel.app
   ```
5. Get your Railway URL (e.g., `https://your-app.railway.app`)

**Option B: Render**
1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect your repository, select `server` folder
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add environment variables (same as above)

**Option C: Heroku**
1. Install Heroku CLI
2. Create new app: `heroku create your-app-name`
3. Set environment variables: `heroku config:set MONGO_URI=...`
4. Deploy: `git push heroku main`

### Step 2: Configure Vercel Environment Variables

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project

2. **Add Environment Variable**
   - Go to Settings → Environment Variables
   - Add new variable:
     ```
     Name: REACT_APP_API_URL
     Value: https://your-backend-domain.com/api
     ```
   - Apply to: Production, Preview, Development

3. **Example Values:**
   ```
   # If using Railway:
   REACT_APP_API_URL=https://your-app.railway.app/api
   
   # If using Render:
   REACT_APP_API_URL=https://your-app.onrender.com/api
   
   # If using Heroku:
   REACT_APP_API_URL=https://your-app.herokuapp.com/api
   ```

### Step 3: Redeploy Your Frontend

1. **Trigger New Deployment**
   - In Vercel dashboard, go to Deployments
   - Click "Redeploy" on latest deployment
   - OR push a new commit to trigger auto-deployment

2. **Verify Environment Variables**
   - Check deployment logs
   - Look for: "API Base URL: https://your-backend-domain.com/api"

### Step 4: Update Backend CORS Settings

Make sure your backend allows requests from your Vercel domain:

```javascript
// In server/server.js
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'https://your-vercel-app.vercel.app',  // Add your Vercel URL
  'https://doc-book-app.vercel.app'      // Your current Vercel URL
];
```

## 🔍 How to Debug

### Check if Environment Variables are Working

1. **Open Browser Console** on your deployed site
2. **Look for API URL logs**:
   ```
   API Base URL: https://your-backend-domain.com/api
   ```
3. **If still showing localhost**, environment variable not set correctly

### Check Network Tab

1. **Open Developer Tools** → Network tab
2. **Try to login or make API call**
3. **Check request URL** - should go to your production backend, not localhost

### Common Issues

**Issue**: Still seeing localhost requests
**Solution**: 
- Verify environment variable is set in Vercel dashboard
- Redeploy after setting environment variables
- Check variable name is exactly `REACT_APP_API_URL`

**Issue**: CORS errors
**Solution**:
- Add your Vercel URL to backend CORS allowedOrigins
- Redeploy backend after updating CORS

**Issue**: 404 errors on API calls
**Solution**:
- Verify backend is deployed and running
- Check backend URL is accessible
- Ensure API routes are working

## 📋 Quick Checklist

- [ ] Backend deployed to Railway/Render/Heroku
- [ ] Backend environment variables set
- [ ] Backend CORS updated with Vercel URL
- [ ] Vercel environment variable `REACT_APP_API_URL` set
- [ ] Frontend redeployed on Vercel
- [ ] Tested API calls in browser console
- [ ] Verified no localhost requests in Network tab

## 🎯 Expected Result

After following these steps:
- ✅ API calls go to your production backend
- ✅ No more localhost requests
- ✅ Authentication works
- ✅ All features function properly
- ✅ Socket.io connects to production server

## 🆘 Need Help?

If you're still seeing localhost requests:
1. Share your Vercel deployment URL
2. Share your backend deployment URL  
3. Screenshot of Vercel environment variables
4. Screenshot of browser console showing API URL

Your healthcare platform will be fully functional once the environment variables are properly configured! 🏥✨
