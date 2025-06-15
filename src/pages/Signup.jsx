import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';

function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8000/auth/signup', formData);
      setMessage('Signup successful! 🎉');
      navigate("/login");
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-100 to-blue-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        {/* App Name + Tagline */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-green-700">Smart Health Monitor</h1>
          <p className="text-sm text-gray-500">Sign up to begin tracking your health</p>
        </div>

        <form onSubmit={handleSignup}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            onChange={handleChange}
            className="w-full mb-3 p-2 border border-gray-300 rounded"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full mb-3 p-2 border border-gray-300 rounded"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full mb-4 p-2 border border-gray-300 rounded"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Register
          </button>
          {message && (
            <p className="mt-3 text-center text-sm text-gray-700">{message}</p>
          )}
        </form>
      </div>
    </div>
  );

}

export default Signup;
