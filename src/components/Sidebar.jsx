import React from 'react';

const Sidebar = () => {
  return (
    <aside className="bg-gray-800 text-white w-64 min-h-screen p-4">
      <nav className="space-y-4">
        <a href="#" className="block hover:text-blue-400">Dashboard</a>
        <a href="#" className="block hover:text-blue-400">Profile</a>
        <a href="#" className="block hover:text-blue-400">Settings</a>
        <a href="#" className="block hover:text-blue-400">Logout</a>
      </nav>
    </aside>
  );
};

export default Sidebar;
