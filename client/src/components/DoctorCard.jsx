import React from 'react';
import { Link } from 'react-router-dom';

const DoctorCard = ({ doctor }) => {
  return (
    <div className="card-hover">
      <div className="flex items-start space-x-4">
        {/* Doctor Image */}
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
          {doctor.profileImage ? (
            <img 
              src={doctor.profileImage} 
              alt={doctor.user.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <span className="text-2xl font-semibold text-gray-600">
              {doctor.user.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Doctor Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            Dr. {doctor.user.name}
          </h3>
          
          <p className="text-primary-600 font-medium">
            {doctor.specialty}
          </p>
          
          <p className="text-gray-600 text-sm mt-1">
            {doctor.experience} years experience
          </p>

          <p className="text-gray-700 text-sm mt-2 line-clamp-2">
            {Array.isArray(doctor.qualifications)
              ? doctor.qualifications.join(', ')
              : doctor.qualifications}
          </p>

          {doctor.bio && (
            <p className="text-gray-600 text-sm mt-2 line-clamp-2">
              {doctor.bio}
            </p>
          )}
        </div>

        {/* Consultation Fee & Action */}
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold text-gray-900">
            ${doctor.consultationFee}
          </div>
          <div className="text-sm text-gray-500 mb-3">
            Consultation
          </div>
          
          <Link 
            to={`/doctor/${doctor._id}`}
            className="btn-primary text-sm"
          >
            Book Now
          </Link>
        </div>
      </div>
      
      {/* Availability Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Available today</span>
          </div>
          
          <div className="text-sm text-gray-500">
            Next available: Today
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorCard;
