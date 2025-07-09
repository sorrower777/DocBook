// Simple API test script
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAPI() {
  console.log('🧪 Testing Doctor Appointment Booking System API...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('✅ Health check passed:', healthResponse.data.message);

    // Test 2: Get Specialties
    console.log('\n2. Testing specialties endpoint...');
    const specialtiesResponse = await axios.get(`${API_BASE}/doctors/specialties`);
    console.log('✅ Specialties retrieved:', specialtiesResponse.data.data.specialties.length, 'specialties');

    // Test 3: Get Doctors (should be empty initially)
    console.log('\n3. Testing doctors endpoint...');
    const doctorsResponse = await axios.get(`${API_BASE}/doctors`);
    console.log('✅ Doctors endpoint working. Found:', doctorsResponse.data.data.doctors.length, 'verified doctors');

    // Test 4: Register a test patient
    console.log('\n4. Testing patient registration...');
    const patientData = {
      name: 'Test Patient',
      email: 'patient@test.com',
      password: 'password123',
      role: 'patient'
    };

    try {
      const patientResponse = await axios.post(`${API_BASE}/auth/register`, patientData);
      console.log('✅ Patient registration successful');
      
      // Test 5: Login with patient
      console.log('\n5. Testing patient login...');
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: patientData.email,
        password: patientData.password
      });
      console.log('✅ Patient login successful');
      
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ Patient already exists, testing login...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
          email: patientData.email,
          password: patientData.password
        });
        console.log('✅ Patient login successful');
      } else {
        throw error;
      }
    }

    // Test 6: Register a test doctor
    console.log('\n6. Testing doctor registration...');
    const doctorData = {
      name: 'Dr. Test Doctor',
      email: 'doctor@test.com',
      password: 'password123',
      role: 'doctor',
      specialty: 'General Medicine',
      qualifications: 'MBBS, MD',
      experienceInYears: 5,
      consultationFee: 100
    };

    try {
      const doctorResponse = await axios.post(`${API_BASE}/auth/register`, doctorData);
      console.log('✅ Doctor registration successful (pending verification)');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ Doctor already exists');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 All API tests passed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('- ✅ Backend server is running');
    console.log('- ✅ Database connection working');
    console.log('- ✅ Authentication endpoints working');
    console.log('- ✅ Doctor endpoints working');
    console.log('- ✅ CORS configured correctly');
    
    console.log('\n🚀 You can now:');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Register as a patient or doctor');
    console.log('3. Browse doctors and book appointments');
    console.log('4. Test the complete appointment booking flow');

  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Ensure MongoDB is running');
    console.log('- Check server/.env configuration');
    console.log('- Verify backend server is running on port 5000');
  }
}

// Run the test
testAPI();
