# Quick Setup Guide

## Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- Git

## Quick Start

### 1. Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd client
npm install
```

### 2. Environment Setup

**Backend (.env):**
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```
MONGO_URI=mongodb://localhost:27017/doctor-appointment-system
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

**Frontend (.env):**
```bash
cd client
cp .env.example .env
```

Edit `client/.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=DocBook
```

### 3. Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**Or use MongoDB Atlas:**
- Create account at mongodb.com
- Create cluster
- Get connection string
- Update MONGO_URI in server/.env

### 4. Run the Application

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm start
```

### 5. Test the Application

1. Open http://localhost:3000
2. Register as a patient
3. Register as a doctor (will need verification)
4. Browse doctors and book appointments

## Default Test Data

You can create test accounts:

**Patient Account:**
- Email: patient@test.com
- Password: password123
- Role: Patient

**Doctor Account:**
- Email: doctor@test.com
- Password: password123
- Role: Doctor
- Specialty: General Medicine
- Experience: 5 years
- Fee: $100

## Troubleshooting

**MongoDB Connection Issues:**
- Ensure MongoDB is running
- Check connection string in .env
- Verify network access (for Atlas)

**CORS Issues:**
- Check CLIENT_URL in server/.env
- Verify API URL in client/.env

**Port Conflicts:**
- Change PORT in server/.env
- Update proxy in client/package.json

**JWT Issues:**
- Ensure JWT_SECRET is set
- Clear localStorage in browser
- Check token expiration

## Production Deployment

**Environment Variables for Production:**
```
NODE_ENV=production
MONGO_URI=<your-production-mongodb-uri>
JWT_SECRET=<strong-production-secret>
CLIENT_URL=<your-frontend-domain>
```

**Build Frontend:**
```bash
cd client
npm run build
```

**Deploy Backend:**
- Upload to Heroku/Railway/DigitalOcean
- Set environment variables
- Deploy

**Deploy Frontend:**
- Upload build folder to Netlify/Vercel
- Set REACT_APP_API_URL to production API
