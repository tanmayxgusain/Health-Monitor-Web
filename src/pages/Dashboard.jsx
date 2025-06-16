
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaHeartbeat, FaTint, FaLungs, FaBed, FaShoePrints,FaFireAlt } from "react-icons/fa";
import axios from "axios";
import api from "../api/axios";

import PeriodSelector from "../components/PeriodSelector";
import HealthCard from "../components/HealthCard";

import StatCard from "../components/StatCard";
import LineChartPanel from "../components/LineChartPanel";
import { Link } from 'react-router-dom';
import MainLayout from "../layouts/MainLayout";
import HealthChart from "../components/HealthChart";

const iconMap = {
  heart_rate: { icon: <FaHeartbeat />, unit: "bpm", color: "bg-red-500", title: "Heart Rate" },
  blood_pressure: { icon: <FaTint />, unit: "mmHg", color: "bg-blue-500", title: "Blood Pressure" },
  spo2: { icon: <FaLungs />, unit: "%", color: "bg-green-500", title: "SpO₂" },
  sleep: { icon: <FaBed />, unit: "hrs", color: "bg-indigo-500", title: "Sleep" },
  activity: { icon: <FaShoePrints />, unit: "", color: "bg-yellow-600", title: "Activity" },
  steps: { icon: <FaShoePrints />, unit: "steps", color: "bg-orange-500", title: "Steps" },
  calories: { icon: <FaFireAlt />, unit: "kcal", color: "bg-pink-600", title: "Calories" },
  distance: { icon: <FaShoePrints />, unit: "km", color: "bg-purple-600", title: "Distance" },
};

const Dashboard = () => {
  const [period, setPeriod] = useState("Today");
  // Add these states
  const [customStart, setCustomStart] = useState(null);
  const [customEnd, setCustomEnd] = useState(null);
  const [healthData, setHealthData] = useState({ });
  const [availableMetrics, setAvailableMetrics] = useState({});
  const navigate = useNavigate();
  const email = localStorage.getItem("user_email");

  const [heartRateData, setHeartRateData] = useState("--");
  const [bpData, setBpData] = useState("--");
  const [spo2Data, setSpo2Data] = useState("--");

  const [latest, setLatest] = useState({});
  const [history, setHistory] = useState({
    heart_rate: [],
    blood_pressure: [],
    spo2: [],
  });

  

  useEffect(() => {
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
    if (!email) return;

    // const getPeriodRange = () => {
    //   const today = new Date();
    //   let start, end;

    //   if (period === "Today") {
    //     start = new Date(today.setHours(0, 0, 0, 0));
    //     end = new Date();
    //   } else if (period === "Yesterday") {
    //     const y = new Date(today.setDate(today.getDate() - 1));
    //     start = new Date(y.setHours(0, 0, 0, 0));
    //     end = new Date(y.setHours(23, 59, 59, 999));
    //   } else {
    //     return null;
    //   }

    //   return {
    //     start_time: start.toISOString(),
    //     end_time: end.toISOString(),
    //   };
    // };

    const fetchData = async () => {
      let range;

      if (period === "Custom") {
        if (!customStart || !customEnd) return;
        range = {
          start_date: customStart,
          end_date: customEnd,
        };
      } else {
        range = { period: period.toLowerCase() };
      }

      try {
        const res = await axios.get("http://localhost:8000/google/health-data", {
          params: { user_email: email, ...range }
        });

        const data = res.data;
        console.log("Fetched health data:", data);


        const latestMetrics = {};

        const hr = data.heart_rate.at(-1)?.value || "--";
        const sp = data.spo2.at(-1)?.value || "--";
        const bp = data.blood_pressure.at(-1)
          ? `${data.blood_pressure.at(-1).systolic}/${data.blood_pressure.at(-1).diastolic}`
          : "--";

        setHeartRateData(hr);
        setSpo2Data(sp);
        setBpData(bp);
        
      } catch (err) {
        console.error("Error fetching period data:", err);
      }
    };

    fetchData();
  }, [period, customStart, customEnd]);




  return (


    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between bg-white shadow p-4 rounded">
        <h1 className="text-xl font-bold text-green-700">Smart Health Monitor</h1>
        <p className="text-sm text-gray-500">Welcome, {email}</p>
      </div>

      <h1 className="text-2xl font-bold text-gray-800">Health Dashboard</h1>




      <PeriodSelector period={period} setPeriod={setPeriod} />
      {period === "Custom" && (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div>
            <label className="block text-sm">Start Date:</label>
            <input
              type="date"
              onChange={(e) => {
                setCustomStart(e.target.value);
                setCustomEnd(""); // Reset end date if start changes
              }}
            />
          </div>
          <div>
            <label className="block text-sm">End Date:</label>
            <input
              type="date"
              value={customEnd || ""}
              onChange={(e) => setCustomEnd(e.target.value)}
              min={customStart} // Prevent choosing an earlier date
              disabled={!customStart}
            />
          </div>
        </div>
      )}







      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {Object.entries(availableMetrics).map(([key, value]) => {
          const meta = iconMap[key] || {
            title: key,
            icon: <span className="text-xl">📊</span>,
            unit: "",
            color: "bg-gray-500",
          };



          return (
            <HealthCard
              key={key}
              title={meta.title}
              value={value || "--"}
              unit={meta.unit}
              icon={meta.icon}
              color={meta.color}
            />
          );
        })}
      </div>
      <div className="min-h-[40px]">
        <p className="text-sm text-gray-500 mt-2 text-center">
          Last updated at: {new Date().toLocaleTimeString()}
        </p>

      </div>


    </div>

  );
};




export default Dashboard;
