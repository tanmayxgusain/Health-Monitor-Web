import React from "react";
import ConnectedDeviceCard from "../components/ConnectedDeviceCard";

const ProfilePage = () => {
  const user = {
    name: "Tanmay Gusain",
    email: "tanmay@example.com",
    avatar: "https://i.pravatar.cc/150?img=56",
  };

  const devices = [
    {
      name: "Fitbit Versa 4",
      type: "Smartwatch",
      logo: "https://logodownload.org/wp-content/uploads/2020/07/fitbit-logo.png",
      connected: true,
    },
    {
      name: "Samsung Galaxy Watch",
      type: "Smartwatch",
      logo: "https://cdn-icons-png.flaticon.com/512/5968/5968381.png",
      connected: false,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>

      <div className="bg-white rounded-2xl p-6 shadow-md flex items-center space-x-6">
        <img
          src={user.avatar}
          alt="avatar"
          className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
        />
        <div>
          <h2 className="text-xl font-semibold text-gray-700">{user.name}</h2>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Connected Devices</h3>
        <div className="space-y-3">
          {devices.map((device, index) => (
            <ConnectedDeviceCard key={index} device={device} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
