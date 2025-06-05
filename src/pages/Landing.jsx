import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl md:text-5xl font-bold text-blue-800 mb-4 text-center">
        Smart IoT-Based Healthcare Monitoring
      </h1>
      <p className="text-lg text-gray-700 max-w-xl text-center mb-8">
        Monitor your health in real-time with wearable device integration, AI-driven insights,
        and secure blockchain-based data storage.
      </p>

      <div className="flex space-x-4">
        <Link
          to="/login"
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
        >
          Login
        </Link>
        <Link
          to="/signup"
          className="px-6 py-3 bg-gray-200 text-blue-600 rounded-xl hover:bg-gray-300 transition"
        >
          Sign Up
        </Link>
      </div>

      <footer className="absolute bottom-4 text-gray-500 text-sm">
        © 2025 SmartHealth Inc.
      </footer>
    </div>
  );
};

export default Landing;
