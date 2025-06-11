
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "../components/StatCard";
import LineChartPanel from "../components/LineChartPanel";
import { generateChartData } from "../utils/fakeData";

import { Link } from 'react-router-dom';
import MainLayout from "../layouts/MainLayout";

import HealthCard from "../components/HealthCard";

import HealthChart from "../components/HealthChart";
import { FaHeartbeat, FaTint, FaLungs } from "react-icons/fa";

import api from "../api/axios";
import axios from "axios";

const heartRateData = [
  { time: "10 AM", value: 76 },
  { time: "11 AM", value: 78 },
  { time: "12 PM", value: 82 },
  { time: "1 PM", value: 79 },
  { time: "2 PM", value: 77 },
];

const bpData = [
  { time: "10 AM", value: 120 },
  { time: "11 AM", value: 118 },
  { time: "12 PM", value: 121 },
  { time: "1 PM", value: 119 },
  { time: "2 PM", value: 122 },
];

const spo2Data = [
  { time: "10 AM", value: 96 },
  { time: "11 AM", value: 97 },
  { time: "12 PM", value: 98 },
  { time: "1 PM", value: 96 },
  { time: "2 PM", value: 97 },
];


const Dashboard = () => {
  const heartRateData = generateChartData("HR");
  const spo2Data = generateChartData("SpO2");
  const bpData = generateChartData("BP");

  const [latest, setLatest] = useState({});
  const [history, setHistory] = useState({
    heart_rate: [],
    blood_pressure: [],
    spo2: [],
  });

  const [healthData, setHealthData] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    const email = localStorage.getItem("user_email");
    if (!email) navigate("/login");
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [latestRes, historyRes] = await Promise.all([
          api.get("/healthdata/latest"),
          api.get("/healthdata/history"),
        ]);
        setLatest(latestRes.data);
        setHistory(historyRes.data);
      } catch (err) {
        console.error("Error fetching health data:", err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchGoogleHealthData = async () => {
      const email = localStorage.getItem("user_email");
      if (!email) return;

      try {
        const res = await axios.get("http://localhost:8000/google/health-data", {
          params: { user_email: email },
        });

        console.log("Google Fit data:", res.data);
        // setLatest(res.data); // if needed
      } catch (err) {
        console.error("Failed to fetch Google Fit health data", err);
      }
    };

    fetchGoogleHealthData();
  }, []);

  return (


    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Health Dashboard</h1>



      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <LineChartPanel title="Heart Rate Over Time" data={heartRateData} color="#ef4444" />
        <LineChartPanel title="Blood Pressure Trend" data={bpData} color="#3b82f6" />
        <LineChartPanel title="SpO₂ Trend" data={spo2Data} color="#10b981" />
      </div>



      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">

        <HealthCard
          title="Heart Rate"
          value={healthData?.heart_rate ?? "N/A"}
          unit="bpm"
          icon={<FaHeartbeat />}
          color="bg-red-500"
        />
        <HealthCard
          title="Blood Pressure"
          value={healthData?.blood_pressure ?? "N/A"}
          unit="mmHg"
          icon={<FaTint />}
          color="bg-blue-500"
        />
        <HealthCard
          title="SpO2"
          value={healthData?.spo2 ?? "N/A"}
          unit="%"
          icon={<FaLungs />}
          color="bg-green-500"
        />
      </div>

    </div>

  );
};




export default Dashboard;
