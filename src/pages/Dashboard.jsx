
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "../components/StatCard";
import LineChartPanel from "../components/LineChartPanel";


import { Link } from 'react-router-dom';
import MainLayout from "../layouts/MainLayout";

import HealthCard from "../components/HealthCard";

import HealthChart from "../components/HealthChart";
import { FaHeartbeat, FaTint, FaLungs } from "react-icons/fa";

import api from "../api/axios";
import axios from "axios";
import PeriodSelector from "../components/PeriodSelector";




const Dashboard = () => {
  const [period, setPeriod] = useState("Today");
  const [heartRateData, setHeartRateData] = useState("--");
  const [bpData, setBpData] = useState("--");
  const [spo2Data, setSpo2Data] = useState("--");
  // Add these states
  const [customStart, setCustomStart] = useState(null);
  const [customEnd, setCustomEnd] = useState(null);


  const email = localStorage.getItem("user_email");

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
    console.log("Heart:", heartRateData);
    console.log("BP:", bpData);
    console.log("SpO2:", spo2Data);
  }, [heartRateData, bpData, spo2Data]);


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
    const email = localStorage.getItem("user_email");
    if (!email) return;

    const getPeriodRange = () => {
      const today = new Date();
      let start, end;

      if (period === "Today") {
        start = new Date(today.setHours(0, 0, 0, 0));
        end = new Date();
      } else if (period === "Yesterday") {
        const y = new Date(today.setDate(today.getDate() - 1));
        start = new Date(y.setHours(0, 0, 0, 0));
        end = new Date(y.setHours(23, 59, 59, 999));
      } else {
        return null;
      }

      return {
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      };
    };

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
        <HealthCard
          title="Heart Rate"
          value={heartRateData}
          /*value={
             heartRateData && heartRateData.length
               ? heartRateData.at(-1).value
               : "--"
           } */

          unit="bpm"
          icon={<FaHeartbeat />}
          color="bg-red-500"
        />

        <HealthCard
          title="Blood Pressure"
          value={bpData}
          /*
          value={
            bpData && bpData.length
              ? bpData.at(-1).value
              : "--"
          }
              */
          unit="mmHg"
          icon={<FaTint />}
          color="bg-blue-500"
        />

        <HealthCard
          title="SpO2"
          value={spo2Data}
          /*value={
            spo2Data && spo2Data.length
              ? spo2Data.at(-1).value
              : "--"
          }
              */
          unit="%"
          icon={<FaLungs />}
          color="bg-green-500"
        />
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
