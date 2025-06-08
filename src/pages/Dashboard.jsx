import React from "react";
import StatCard from "../components/StatCard";
import LineChartPanel from "../components/LineChartPanel";
import { generateChartData } from "../utils/fakeData";

import { Link } from 'react-router-dom';
import MainLayout from "../layouts/MainLayout";

const Dashboard = () => {
  const heartRateData = generateChartData("HR");
  const spo2Data = generateChartData("SpO2");
  const bpData = generateChartData("BP");

  return (
    <MainLayout>

      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Health Dashboard</h1>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Heart Rate" value="78" unit="bpm" color="border-red-500" />
          <StatCard title="Blood Pressure" value="122/84" unit="mmHg" color="border-blue-500" />
          <StatCard title="SpO₂" value="96" unit="%" color="border-green-500" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LineChartPanel title="Heart Rate Over Time" data={heartRateData} color="#ef4444" />
          <LineChartPanel title="Blood Pressure Trend" data={bpData} color="#3b82f6" />
          <LineChartPanel title="SpO₂ Trend" data={spo2Data} color="#10b981" />
        </div>

        {/* Link to Profile */}
        <Link to="/profile" className="text-blue-600 underline">Go to Profile Page</Link>

      </div>
    </MainLayout>
  );
};


{/* Link to Profile */}
<Link to="/profile" className="text-blue-600 underline">Go to Profile Page</Link>


export default Dashboard;
