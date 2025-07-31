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

👥Users Roles -->
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
- 
## 🔐 Authentication Flow

1. Users register with email, password, and role
2. JWT token is generated upon successful login
3. Token is stored in localStorage
4. Protected routes require valid JWT token
5. Role-based access control restricts certain features
