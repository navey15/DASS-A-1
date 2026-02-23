# Felicity Event Management System

A comprehensive MERN stack application for managing events, registrations, and participant interactions for Felicity - the annual fest at Haldia Institute of Technology.

## 📋 Project Overview

This system handles:
- **Participant Management**: Registration, event browsing, registrations, feedback
- **Organizer Features**: Event creation, participant management, analytics, payment approval
- **Admin Features**: Organizer management, system oversight, password reset approvals
- **Real-time Discussion Forums**: Event-based communication
- **Team Registrations**: Hackathon and team-based event support
- **Merchandise Management**: T-shirt sales and stock management

## 🏗️ Architecture

### Backend (Node.js + Express + MongoDB)
```
backend/
├── config/          # Database configuration
├── controllers/     # Business logic
├── middleware/      # Authentication, validation, error handling
├── models/          # MongoDB schemas
├── routes/          # API endpoints
├── utils/           # Helper functions
├── index.js         # Server entry point
└── seed.js          # Database seeding script
```

### Frontend (React)
```
frontend/
├── components/      # Reusable UI components
├── context/         # React Context (Auth, Theme)
├── pages/           # Page components
├── services/        # API service layer
└── src/             # Main React app files
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

#### 1. Clone the repository
```bash
cd <project-root>
```

#### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file (already created)
# Make sure MongoDB is running

# Seed the database with sample data
npm run seed

# Start development server
npm run dev
```

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies (already done)
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# Start development server
npm start
```

## 🔑 Default Credentials (After Seeding)

### Admin
- **Email**: admin@felicity.com
- **Password**: Admin@123456

> Organizers are no longer pre-seeded. Sign in as admin and create organizer accounts from the dashboard.

### Participants
1. **John Doe (IIITH Student)**
   - Email: john.doe@iiith.edu
   - Password: John@123456

2. **Jane Smith (External)**
   - Email: jane.smith@gmail.com
   - Password: Jane@123456

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints
- `POST /auth/register/participant` - Register new participant
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user
- `PUT /auth/profile` - Update profile
- `PUT /auth/change-password` - Change password
- `POST /auth/logout` - Logout

### Events Endpoints
- `GET /events` - Get all events (with filters)
- `GET /events/:id` - Get event details
- `GET /events/trending` - Get trending events
- `GET /events/followed` - Get followed clubs' events
- `GET /events/recommended` - Get recommended events

### Registrations Endpoints
- `POST /registrations/:eventId` - Register for event
- `GET /registrations/my-events` - Get user's registrations
- `DELETE /registrations/:registrationId` - Cancel registration
- `POST /registrations/join-team` - Join team with invite code

### Organizer Endpoints
- `POST /organizer/events` - Create event
- `GET /organizer/events` - Get organizer's events
- `PUT /organizer/events/:id` - Update event
- `POST /organizer/events/:id/publish` - Publish event
- `GET /organizer/events/:id/registrations` - Get event registrations
- `GET /organizer/events/:id/analytics` - Get event analytics
- `POST /organizer/events/:eventId/attendance/:registrationId` - Mark attendance

### Admin Endpoints
- `POST /admin/organizers` - Create organizer
- `GET /admin/organizers` - Get all organizers
- `GET /admin/statistics` - Get system statistics
- `GET /admin/password-requests` - Get password reset requests
- `POST /admin/password-requests/:id/approve` - Approve reset request

### Discussion Endpoints
- `GET /discussions/:eventId` - Get event discussions
- `POST /discussions/:eventId` - Post discussion
- `POST /discussions/:discussionId/reply` - Reply to discussion

### Feedback Endpoints
- `POST /feedback/:eventId` - Submit feedback
- `GET /feedback/:eventId` - Get event feedback

## 🎨 Features by Role

### Participant
- ✅ Browse and search events
- ✅ Filter by type, eligibility, date
- ✅ Register for events
- ✅ Team registration for hackathons
- ✅ View registration history
- ✅ Submit feedback after events
- ✅ Follow clubs/organizers
- ✅ Participate in discussions
- ✅ Get personalized recommendations

### Organizer
- ✅ Create and manage events
- ✅ Draft/Publish workflow
- ✅ Custom registration forms
- ✅ Merchandise event management
- ✅ View participant lists
- ✅ Mark attendance
- ✅ Approve/reject payments
- ✅ View analytics and statistics
- ✅ Export registration data
- ✅ Manage discussions

### Admin
- ✅ Create organizer accounts
- ✅ Manage organizers
- ✅ View system statistics
- ✅ Approve password reset requests
- ✅ View all participants
- ✅ Monitor all events

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation with express-validator
- MongoDB injection prevention
- CORS configuration
- Environment variable protection

## 📊 Database Models

### User
- Supports 3 roles: participant, organizer, admin
- Role-specific fields
- Password reset functionality
- Preferences and followed clubs

### Event
- Normal and Merchandise types
- Custom registration forms
- Team registration support
- Registration limits and deadlines
- Draft/Published status workflow

### Registration
- Event-participant relationship
- Team registration data
- Payment information
- Attendance tracking
- QR code generation ready

### Discussion
- Event-based forums
- Nested replies
- Pin functionality
- Organizer announcements

### Feedback
- 1-5 star rating
- Anonymous option
- Post-event only

## 🛠️ Development

### Running Tests
```bash
# Backend tests (to be implemented)
cd backend
npm test

# Frontend tests (to be implemented)
cd frontend
npm test
```

### Code Structure Best Practices
- **Controllers**: Handle business logic
- **Services**: API communication layer
- **Middleware**: Reusable request processing
- **Models**: Data structure and validation
- **Components**: Reusable UI elements
- **Pages**: Route-based components

## 📝 Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/felicity_events
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=admin@felicity.com
ADMIN_PASSWORD=Admin@123456
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## 🚢 Deployment

### Backend Deployment (Heroku/Railway/Render)
1. Set environment variables
2. Ensure MongoDB Atlas connection
3. Deploy using platform CLI or Git integration

### Frontend Deployment (Vercel/Netlify)
1. Build the app: `npm run build`
2. Set REACT_APP_API_URL to production backend URL
3. Deploy build folder

## 🤝 Contributing

1. Follow the existing code structure
2. Write clean, documented code
3. Test thoroughly before committing
4. Follow naming conventions
5. Keep components modular and reusable

## 📄 License

This project is developed for Felicity - IIITH's annual fest.

## 👥 Team

Developed by the Felicity Tech Team

## 📞 Support

For issues or questions, contact the development team.

---

**Happy Coding! 🎉**
