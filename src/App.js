import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import ProtectedRoute from "./routes/ProtectedRoute";
import { Navigate } from 'react-router-dom'; // ✅ For redirects
import Logout from './pages/Logout'; // ✅ Your new Logout component



import OAuthSuccess from './pages/OAuthSuccess'; // adjust path if needed

const isLoggedIn = () => {
  return !!localStorage.getItem("user_email");
};

const App = () => {
  return (
    <Router>
      <Routes>

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />

        {/* Logout just clears user and redirects */}
        <Route path="/logout" element={<Logout />} />

        {/* Protected Routes */}
        <Route path="/" element={isLoggedIn() ? <MainLayout><Dashboard /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={isLoggedIn() ? <MainLayout><Dashboard /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/profile" element={isLoggedIn() ? <MainLayout><ProfilePage /></MainLayout> : <Navigate to="/login" />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
