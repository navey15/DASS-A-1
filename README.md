# Felicity Event Management System
## Design & Analysis of Software Systems - Assignment 1

A comprehensive MERN stack application for managing university fest events, registrations, and participant interactions.

---

## 🛠 Technology Stack & Libraries

### **Backend (Node.js + Express + MongoDB)**
| Library | Purpose & Justification |
| :--- | :--- |
| **Express.js** | Minimalist web framework for building robust REST APIs. Chosen for its middleware ecosystem (Auth, Validation). |
| **MongoDB (Mongoose)** | NoSQL database. Chosen for its flexible schema design, essential for handling diverse event types (Workshops, Hackathons, Merchandise) and dynamic registration forms. |
| **tesseract.js** | OCR library. Used for analyzing text from uploaded images. |
| **bcryptjs** | Password hashing. Essential security requirement to never store plaintext passwords. |
| **jsonwebtoken** | Stateless authentication. Enables secure API access without server-side session storage. |
| **multer** | Middleware for `multipart/form-data`. Crucial for handling image uploads (Payment Proofs, Chat files, Profile pictures) securely. |
| **socket.io** | Real-time bidirectional communication. Used to implement the **Team Chat** feature. |
| **nodemailer** | Email service. Used for sending registration confirmations and reset tokens. |
| **axios** | Promise-based HTTP client. Used for verifying ReCAPTCHA tokens with Google servers. |
| **cors** | Cross-Origin Resource Sharing. Enables the frontend (Vercel) to communicate with the backend (Render). |
| **qrcode** | QR Code generation. Used to generate unique check-in codes for confirmed participants. |

### **Frontend (React)**
| Library | Purpose & Justification |
| :--- | :--- |
| **React** | Component-based UI library. Facilitates reusability (Cards, Forms, Navbars) and efficient state management. |
| **react-router-dom** | Declarative routing. Handles protected routes (Admin/Organizer only) and navigation. |
| **axios** | HTTP client. Simplifies API requests and interceptors for attaching JWT tokens automatically. |
| **socket.io-client** | Client-side library for connecting to the real-time chat server. |
| **react-google-recaptcha** | Component wrapper for Google ReCAPTCHA v2. simplfies integration for Bot Protection. |
| **chart.js / react-chartjs-2** | Data visualization. Used in Organizer Analytics to display registration trends and revenue. |
| **bootstrap / react-bootstrap** | CSS Framework. Accelerates UI development with responsive grid and pre-built components. |
| **moment** | Date manipulation. Used for formatting event dates and countdowns. |

---

## 🚀 Implemented Advanced Features

### **Tier A: Core Advanced Features**

#### **1. Hackathon Team Registration**
*   **Description**: Enables participants to form teams, invite members via code, and register as a group.
*   **Design Choices**: Adopted a "Leader-Centric" model where the creator becomes the team leader. Invite codes were chosen over email invites for simplicity and to prevent spam.
*   **Technical Decisions**: 
    *   Implemented atomic checks in `registrationController`: A team is only "Confirmed" when all members join AND constraints (size min/max) are met.
    *   Used MongoDB nested schemas (`team.teamMembers`) to keep team data localized to the registration document.

#### **2. Merchandise Payment Approval Workflow**
*   **Description**: A manual verification system where users upload payment screenshots, and Organizers approve/reject them.
*   **Design Choices**: Decided against a payment gateway to simulate real-world "college fest" scenarios where UPI/Cash is common. Users upload proof, status becomes `Pending`.
*   **Technical Decisions**: 
    *   Used `multer` to store proof images with unique timestamps.
    *   State Machine approach: `Pending` -> `Approved` (Decrements Stock, Generates QR) OR `Rejected` (Resets status, notifies user).

### **Tier B: Real-Time & Communication**

#### **1. Organizer Password Reset Workflow**
*   **Description**: Organizers cannot reset their own passwords; they must request a reset from the Admin.
*   **Design Choices**: Centralized security model. Organizers are high-privilege accounts; allowing self-service resets increases takeover risk. Admin acts as the gatekeeper.
*   **Technical Decisions**:
    *   Created `PasswordResetRequest` model to track request status (`Pending`, `Approved`, `Rejected`).
    *   Admin dashboard fetches pending requests; approval triggers a secure random password generation sent via email or displayed to Admin.

#### **2. Team Chat**
*   **Description**: Real-time chat room for confirmed hackathon team members.
*   **Design Choices**: Chat is scoped strictly to the `TeamID`. Only accepted members can join the socket room.
*   **Technical Decisions**:
    *   **Socket.io Namespaces/Rooms**: Each team joins a unique room `team_<teamId>`.
    *   **Persistence**: Messages are stored in MongoDB (`Message` model) so history is available upon page reload.
    *   **Typing Indicators**: Broadcasted `typing` events to room members for better UX.

### **Tier C: Integration & Enhancements**

#### **1. Bot Protection (Google ReCAPTCHA)**
*   **Description**: Integration of Google ReCAPTCHA v2 on Login and Registration forms.
*   **Design Choices**: Selected "Checkbox" (v2) over invisible (v3) to provide clear user feedback during high-traffic registration periods.
*   **Technical Decisions**:
    *   **Dual Validation**: Frontend ensures the checkbox is clicked before submit. Backend (`middleware/verifyCaptcha`) verifies the token with Google API before processing the request.



---

## 💻 Setup & Installation (Local Development)

### Prerequisites
- Node.js (v14+)
- MongoDB (Local or Atlas Connection String)

### 1. Backend Setup
```bash
cd backend
npm install

# Create .env file with the following:
PORT=5000
MONGO_URI=mongodb://localhost:27017/felicity
JWT_SECRET=your_super_secret_key
RECAPTCHA_SECRET_KEY=your_google_secret_key
FRONTEND_URL=http://localhost:3000

# Seed Database (Optional - creates Admin & Sample Data)
npm run seed

# Start Server
npm start
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Create .env file:
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_RECAPTCHA_SITE_KEY=your_google_site_key

# Start Application
npm start
```

The application will launch at `http://localhost:3000`.

### 3. Default Credentials (from Seed)
*   **Admin**: `admin@felicity.com` / `Admin@123456`
*   **Organizer**: `music_club@felicity.com` / `Music@123`
*   **Participant**: `monica@example.com` / `Password@123`

---

## 🌍 Deployment

See `deployment.txt` for detailed instructions on deploying to Render (Backend) and Vercel (Frontend).


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
-  Browse and search events
-  Filter by type, eligibility, date
-  Register for events
-  Team registration for hackathons
-  View registration history
-  Submit feedback after events
-  Follow clubs/organizers
-  Participate in discussions
-  Get personalized recommendations

### Organizer
-  Create and manage events
-  Draft/Publish workflow
-  Custom registration forms
-  Merchandise event management
-  View participant lists
-  Mark attendance
-  Approve/reject payments
-  View analytics and statistics
-  Export registration data
-  Manage discussions

### Admin
-  Create organizer accounts
-  Manage organizers
-  View system statistics
-  Approve password reset requests
-  View all participants
-  Monitor all events

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

