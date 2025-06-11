import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8000/auth/login', formData);
      console.log("Login Success", res.data);   // ✅ Log response
      setMessage('Login successful! ✅');
      localStorage.setItem("user_email", res.data.email);

      navigate('/dashboard');

    } catch (err) {
      console.error("Login failed", err); // ✅ Log error
      setMessage(err.response?.data?.detail || 'Login failed');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8000/auth/google/login';
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-80">
        <h2 className="text-xl font-bold mb-4">Login</h2>
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="w-full mb-3 p-2 border rounded"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          className="w-full mb-4 p-2 border rounded"
          required
        />
        <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
          Login
        </button>

        {/* 🔘 Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full mt-3 bg-red-600 text-white p-2 rounded hover:bg-red-700"
        >
          Login with Google
        </button>


        {message && <p className="mt-3 text-center text-sm text-gray-700">{message}</p>}
      </form>
    </div>
  );
}

export default Login;