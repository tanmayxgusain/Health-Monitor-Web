import React from 'react';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";



const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        {/* future: <Route path="/profile" element={<ProfilePage />} /> */}

        
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </Router>
  );
};

export default App;
