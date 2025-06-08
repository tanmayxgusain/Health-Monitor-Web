// src/components/Sidebar.jsx

import React from "react";
import { NavLink } from "react-router-dom";
import { FaTachometerAlt, FaUser, FaSignOutAlt } from "react-icons/fa";

const Sidebar = () => {
  const linkClasses = ({ isActive }) =>
    `flex items-center space-x-3 px-4 py-2 rounded-lg transition-all ${
      isActive
        ? "bg-blue-500 text-white"
        : "text-gray-700 hover:bg-blue-100 hover:text-blue-600"
    }`;

  return (
    <aside className="w-64 h-screen bg-white shadow-md p-4">
      <h2 className="text-2xl font-bold text-blue-600 mb-6">HealthApp</h2>
      <nav className="flex flex-col space-y-2">
        <NavLink to="/" className={linkClasses}>
          <FaTachometerAlt />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/profile" className={linkClasses}>
          <FaUser />
          <span>Profile</span>
        </NavLink>
        <NavLink to="/logout" className={linkClasses}>
          <FaSignOutAlt />
          <span>Logout</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
