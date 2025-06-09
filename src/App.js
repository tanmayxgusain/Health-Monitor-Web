import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import MainLayout from "./layouts/MainLayout";




const App = () => {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          {/* future: <Route path="/profile" element={<ProfilePage />} /> */}


          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </MainLayout>
    </Router>
  );
};

export default App;
