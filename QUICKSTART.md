# 🚀 Quick Start Guide - Felicity Event Management System

## ✅ Prerequisites Check
Before starting, ensure you have:
- ✅ Node.js installed (v14 or higher)
- ✅ MongoDB installed and running locally
- ✅ npm or yarn package manager

## 📋 Quick Start Steps

### Step 1: Start MongoDB
```bash
# Start MongoDB service (Linux)
sudo systemctl start mongod

# Or start MongoDB manually
mongod --dbpath /path/to/your/data/directory
```

### Step 2: Start the Backend

Open a new terminal:
```bash
cd <project-root>/backend

# Seed the database with sample data (first time only)
npm run seed

# Start the development server
npm run dev
```

You should see:
```
╔═══════════════════════════════════════════════════╗
║   Felicity Event Management System - Backend     ║
║   Server running on port 5000                    ║
║   Environment: development                       ║
╚═══════════════════════════════════════════════════╝
```

Backend is now running at: **http://localhost:5000**

### Step 3: Start the Frontend

Open another terminal:
```bash
cd <project-root>/frontend

# Start the React development server
npm start
```

Frontend will automatically open at: **http://localhost:3000**

## 🔑 Test Credentials (After Seeding)

### 👤 Admin Account
- **Email**: admin@felicity.com
- **Password**: Admin@123456
- **Dashboard**: http://localhost:3000/admin/dashboard

> Organizer accounts are intentionally not seeded. Create them through the admin "Manage Organizers" page for clean testing.

### 👨‍🎓 Participant Accounts

**John Doe (IIITH Student):**
- **Email**: john.doe@iiith.edu
- **Password**: John@123456
- **Dashboard**: http://localhost:3000/dashboard

**Jane Smith (External):**
- **Email**: jane.smith@gmail.com
- **Password**: Jane@123456

## 🧪 Testing the System

### 1. Test Backend API
```bash
# Health check
curl http://localhost:5000/health

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@felicity.com","password":"Admin@123456"}'
```

### 2. Test Frontend
1. Go to http://localhost:3000
2. Click "Login"
3. Use any of the test credentials above
4. Explore the dashboard based on your role

## 📁 Project Structure

```
2024101082/
├── backend/                  # Node.js + Express backend
│   ├── config/              # Database configuration
│   ├── controllers/         # Business logic
│   ├── middleware/          # Auth, validation, errors
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API endpoints
│   ├── utils/              # Helper functions
│   ├── .env                # Environment variables
│   ├── index.js            # Server entry point
│   ├── seed.js             # Database seeding
│   └── package.json        # Dependencies
│
├── frontend/                # React frontend
│   ├── components/         # Reusable components
│   ├── context/           # React Context (Auth)
│   ├── pages/             # Page components
│   ├── services/          # API service layer
│   ├── src/              # Main React files
│   ├── .env              # Frontend env variables
│   └── package.json      # Dependencies
│
├── README.md             # Main documentation
└── deployment.txt        # Deployment guide
```

## 🔧 Common Commands

### Backend
```bash
cd backend

# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# Seed database
npm run seed
```

### Frontend
```bash
cd frontend

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## 🎯 Main Features to Test

### As Participant:
- ✅ Register new account
- ✅ Login and browse events
- ✅ Register for events
- ✅ View registration history
- ✅ Update profile

### As Organizer:
- ✅ Create new event
- ✅ Manage events (Draft/Published)
- ✅ View participant registrations
- ✅ Mark attendance
- ✅ View analytics

### As Admin:
- ✅ Create organizer accounts
- ✅ Manage organizers
- ✅ View system statistics
- ✅ Approve password reset requests

## 🐛 Troubleshooting

### Backend won't start
**Problem**: MongoDB connection error
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

**Problem**: Port 5000 already in use
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change PORT in backend/.env
PORT=5001
```

### Frontend won't start
**Problem**: Port 3000 already in use
- React will prompt to use another port (Y/n)
- Or kill the process: `lsof -ti:3000 | xargs kill -9`

**Problem**: API calls failing
- Check backend is running: http://localhost:5000/health
- Verify REACT_APP_API_URL in `frontend/.env`

### Database Issues
**Problem**: Need to reset database
```bash
cd backend

# Drop the database through mongo shell
mongo
use felicity_events
db.dropDatabase()
exit

# Re-seed
npm run seed
```

## 📚 API Documentation

Full API documentation available at:
- Base URL: http://localhost:5000/api
- Health Check: http://localhost:5000/health

### Main Endpoints:
- **Auth**: `/api/auth/*`
- **Events**: `/api/events/*`
- **Registrations**: `/api/registrations/*`
- **Organizer**: `/api/organizer/*`
- **Admin**: `/api/admin/*`
- **Discussions**: `/api/discussions/*`
- **Feedback**: `/api/feedback/*`
- **Users**: `/api/users/*`

## 🎨 Next Steps

### To Fully Implement:
1. **Complete UI Components**: Add full functionality to all placeholder pages
2. **API Integration**: Connect frontend components to backend services
3. **Form Validations**: Add client-side validation
4. **Error Handling**: Implement comprehensive error handling
5. **Loading States**: Add loading indicators for async operations
6. **Notifications**: Add toast notifications for user actions
7. **Image Upload**: Implement file upload for event images
8. **Search & Filters**: Complete search and filter functionality
9. **Discussion Forum**: Build real-time discussion features
10. **Analytics Dashboard**: Add charts and graphs
11. **Export Functionality**: Implement CSV export features
12. **Email Notifications**: Add email service integration
13. **Payment Gateway**: Integrate payment processing
14. **QR Code Generation**: Implement QR code for tickets
15. **Mobile Responsiveness**: Enhance mobile UI/UX

## 📞 Getting Help

- Check README.md for detailed documentation
- Review deployment.txt for deployment instructions
- Check console logs for error messages
- Inspect Network tab in browser DevTools for API issues

## ✨ Features Overview

### Core Features:
- ✅ User authentication (JWT-based)
- ✅ Role-based access control (Participant, Organizer, Admin)
- ✅ Event management (CRUD operations)
- ✅ Event registration system
- ✅ Team-based registrations
- ✅ Discussion forums
- ✅ Feedback system
- ✅ Password reset workflow
- ✅ Analytics and reporting
- ✅ Merchandise event support

### Upcoming Features:
- 🔄 Real-time notifications
- 🔄 Email notifications
- 🔄 Payment integration
- 🔄 QR code ticket generation
- 🔄 Advanced analytics with charts
- 🔄 Calendar integration
- 🔄 Bot protection (CAPTCHA)

## 🎉 Success!

If everything is working:
- ✅ Backend running on port 5000
- ✅ Frontend running on port 3000
- ✅ MongoDB connected
- ✅ Can login with test credentials
- ✅ Can navigate different dashboards

**You're ready to start developing! Happy coding! 🚀**

---

**Need help?** Refer to the comprehensive documentation in README.md or check the deployment guide in deployment.txt for production deployment steps.
