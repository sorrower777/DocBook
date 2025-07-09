# Doctor Appointment Booking System

A complete MERN stack application for booking doctor appointments with three user roles: Patient, Doctor, and Admin.

## 🚀 Features

### For Patients
- Browse and search verified doctors by specialty
- View detailed doctor profiles with availability
- Book appointments with real-time slot availability
- Manage appointments (view, cancel)
- Patient dashboard with appointment history

### For Doctors
- Complete profile management
- Set availability schedules
- Manage appointment requests (confirm/cancel)
- View patient information and appointment details
- Doctor dashboard with appointment overview

### System Features
- JWT-based authentication
- Role-based access control
- Real-time appointment slot management
- Responsive design with Tailwind CSS
- Input validation and error handling

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Context API** - State management

## 📁 Project Structure

```
doctor-appointment-system/
├── server/                 # Backend
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── server.js          # Server entry point
│   └── package.json
├── client/                # Frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React Context
│   │   ├── services/      # API services
│   │   └── App.js
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd doctor-appointment-system
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   
   # Create environment file
   cp .env.example .env
   
   # Edit .env with your configuration
   # MONGO_URI=mongodb://localhost:27017/doctor-appointment-system
   # JWT_SECRET=your-super-secret-jwt-key
   # PORT=5000
   ```

3. **Frontend Setup**
   ```bash
   cd ../client
   npm install
   
   # Create environment file
   cp .env.example .env
   
   # Edit .env if needed
   # REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start the Application**
   
   **Backend (Terminal 1):**
   ```bash
   cd server
   npm run dev
   ```
   
   **Frontend (Terminal 2):**
   ```bash
   cd client
   npm start
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Doctor Endpoints
- `GET /api/doctors` - Get all verified doctors
- `GET /api/doctors/:id` - Get single doctor profile
- `GET /api/doctors/specialties` - Get available specialties
- `PUT /api/doctors/profile` - Update doctor profile (Doctor only)
- `PUT /api/doctors/availability` - Update availability (Doctor only)

### Appointment Endpoints
- `GET /api/appointments/available-slots/:doctorId` - Get available slots
- `POST /api/appointments/book` - Book appointment (Patient only)
- `GET /api/appointments/my-appointments` - Get user's appointments
- `PATCH /api/appointments/:id/cancel` - Cancel appointment (Patient only)
- `PATCH /api/appointments/:id/status` - Update appointment status (Doctor only)

## 👥 User Roles

### Patient
- Can register and login
- Browse and search doctors
- Book appointments
- View and cancel their appointments

### Doctor
- Can register (requires admin verification)
- Manage profile and availability
- View and manage appointment requests
- Update appointment status

### Admin (Future Enhancement)
- Verify doctor accounts
- Manage system users
- View system analytics

## 🔐 Authentication Flow

1. Users register with email, password, and role
2. JWT token is generated upon successful login
3. Token is stored in localStorage
4. Protected routes require valid JWT token
5. Role-based access control restricts certain features

## 🎨 UI/UX Features

- Responsive design for all screen sizes
- Clean and modern interface
- Loading states and error handling
- Form validation
- Success/error notifications
- Intuitive navigation

## 🧪 Testing

To test the application:

1. **Register as a Patient**
   - Go to /register
   - Select "Patient" role
   - Fill in details and register

2. **Register as a Doctor**
   - Go to /register
   - Select "Doctor" role
   - Fill in medical details
   - Note: Doctor accounts need verification

3. **Book an Appointment**
   - Browse doctors on homepage
   - Click "Book Now" on a doctor
   - Select date and time slot
   - Submit booking

4. **Manage Appointments**
   - Patients: View in Patient Dashboard
   - Doctors: Manage in Doctor Dashboard

## 🚀 Deployment

### Backend Deployment (Heroku/Railway)
1. Set environment variables
2. Deploy to your preferred platform
3. Update CORS settings for production

### Frontend Deployment (Netlify/Vercel)
1. Build the React app: `npm run build`
2. Deploy the build folder
3. Update API URL in environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the console for error messages
2. Verify environment variables are set correctly
3. Ensure MongoDB is running
4. Check API endpoints are accessible

## 🔮 Future Enhancements

- Admin panel for user management
- Email notifications
- Payment integration
- Video consultation feature
- Mobile app
- Advanced search filters
- Doctor ratings and reviews
