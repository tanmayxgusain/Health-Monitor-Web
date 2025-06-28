
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaHeartbeat, FaTint, FaLungs, FaBed, FaShoePrints, FaFireAlt } from "react-icons/fa";
import axios from "axios";
import api from "../api/axios";

import PeriodSelector from "../components/PeriodSelector";
import HealthCard from "../components/HealthCard";

import StatCard from "../components/StatCard";
import LineChartPanel from "../components/LineChartPanel";
import { Link } from 'react-router-dom';
import MainLayout from "../layouts/MainLayout";
import HealthChart from "../components/HealthChart";
import GroupedHealthCards from "../components/GroupedHealthCards";


export const iconMap = {
  heart_rate: { icon: <FaHeartbeat />, unit: "bpm", color: "bg-red-500", title: "Heart Rate", group: "Vitals" },
  blood_pressure: { icon: <FaTint />, unit: "mmHg", color: "bg-blue-500", title: "Blood Pressure", group: "Vitals" },
  spo2: { icon: <FaLungs />, unit: "%", color: "bg-green-500", title: "SpO₂", group: "Vitals" },

  steps: { icon: <FaShoePrints />, unit: "steps", color: "bg-orange-500", title: "Steps", group: "Activity" },
  distance: { icon: <FaShoePrints />, unit: "km", color: "bg-purple-600", title: "Distance", group: "Activity" },
  calories: { icon: <FaFireAlt />, unit: "kcal", color: "bg-pink-600", title: "Calories", group: "Activity" },

  sleep: { icon: <FaBed />, unit: "hrs", color: "bg-indigo-500", title: "Sleep", group: "Lifestyle" },
  stress: { icon: <FaLungs />, unit: "", color: "bg-yellow-700", title: "Stress", group: "Lifestyle" },
};


const Dashboard = () => {
  const [period, setPeriod] = useState("Today");
  // Add these states
  const [customStart, setCustomStart] = useState(null);
  const [customEnd, setCustomEnd] = useState(null);
  // const [healthData, setHealthData] = useState({});

  const navigate = useNavigate();
  const email = localStorage.getItem("user_email");

  const [heartRateData, setHeartRateData] = useState("--");
  const [bpData, setBpData] = useState("--");
  const [spo2Data, setSpo2Data] = useState("--");

  // const [latest, setLatest] = useState({});
  const [history, setHistory] = useState({
    heart_rate: [],
    blood_pressure: [],
    spo2: [],
  });

  const [averageMetrics, setAverageMetrics] = useState({
  heart_rate: "--",
  spo2: "--",
  blood_pressure: "--",
  steps: "--",
  distance: "--",
  calories: "--",
  sleep: "--",
  stress: "--"
});


  const getAverage = (data) => {
    if (!data || data.length === 0) return "--";
    console.log("📈 Computing avg from:", data);

    const sum = data.reduce((acc, val) => acc + (val.value || 0), 0);
    return Math.round(sum / data.length);
  };

  const getAverageBP = (data) => {
    if (!data || data.length === 0) return "--";
    console.log("📊 Raw BP:", data);
    const systolic = Math.round(
      data.reduce((acc, val) => acc + (val.systolic || 0), 0) / data.length
    );
    const diastolic = Math.round(
      data.reduce((acc, val) => acc + (val.diastolic || 0), 0) / data.length
    );
    return `${systolic}/${diastolic}`;
  };


  const handleSync = async () => {
  try {
    await axios.post("http://localhost:8000/google/sync", {
      user_email: email,
      days_back: 7   // or 30, or whatever you want
    });
    alert("Synced successfully");
    window.location.reload();
  } catch (err) {
    alert("Sync failed");
    console.error(err);
  }
};


  // const [error, setError] = useState(null);



  useEffect(() => {
    if (!email) navigate("/login");
  }, []);


  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const [latestRes, historyRes] = await Promise.all([
  //         api.get("/healthdata/latest"),
  //         api.get("/healthdata/history"),
  //       ]);
  //       setLatest(latestRes.data);
  //       setHistory(historyRes.data);
  //     } catch (err) {
  //       console.error("Error fetching health data:", err);
  //     }
  //   };

  //   fetchData();
  // }, []);


  // useEffect(() => {

  //   const fetchHealthData = async () => {
  //     if (!email) return;
  //     let heartRate = "--";
  //     let spo2 = "--";
  //     let bp = "--";


  //     try {
  //       if (period === "Today") {
  //         const res = await axios.get("http://localhost:8000/google/health-data", {
  //           params: { user_email: email, period: "today" },
  //         });

  //         const data = res.data;
  //         heartRate = data.heart_rate?.at(-1)?.value || "--";
  //         spo2 = data.spo2?.at(-1)?.value || "--";
  //         const bpData = data.blood_pressure?.at(-1);
  //         bp = bpData ? `${bpData.systolic}/${bpData.diastolic}` : "--";

  //       } else {
  //         // History from DB
  //         let startDate, endDate;
  //         const today = new Date();

  //         if (period === "Yesterday") {
  //           const y = new Date(today.setDate(today.getDate() - 1));
  //           startDate = new Date(y.setHours(0, 0, 0, 0)).toISOString().split("T")[0];
  //           endDate = new Date(y.setHours(23, 59, 59, 999)).toISOString().split("T")[0];
  //         } else if (period === "Custom") {
  //           if (!customStart || !customEnd) return;
  //           startDate = customStart;
  //           endDate = customEnd;
  //         }

  //         const res = await axios.get("http://localhost:8000/healthdata/history", {
  //           params: {
  //             user_email: email,
  //             start_date: startDate,
  //             end_date: endDate,
  //           },
  //         });

  //         const data = res.data;
  //         heartRate = data.heart_rate?.at(-1)?.value || "--";
  //         spo2 = data.spo2?.at(-1)?.value || "--";
  //         const bpData = data.blood_pressure?.at(-1);
  //         bp = bpData ? `${bpData.systolic}/${bpData.diastolic}` : "--";
  //       }

  //       // Update cards
  //       setHeartRateData(heartRate);
  //       setSpo2Data(spo2);
  //       setBpData(bp);

  //     } catch (err) {
  //       console.error("Error fetching health data:", err);
  //     }
  //   };

  //   fetchHealthData();
  // }, [period, customStart, customEnd]);

  useEffect(() => {
    const fetchHealthData = async () => {
      if (!email) return;


      // Determine period
      const today = new Date();
      let startDate;
      setHistory({
        heart_rate: [],
        spo2: [],
        blood_pressure: [],
      });

      setAverageMetrics({
        heart_rate: "--",
        spo2: "--",
        blood_pressure: "--",
      });

      if (period === "Today") {
        startDate = today.toISOString().split("T")[0]; // YYYY-MM-DD

        try {
          const res = await axios.get("http://localhost:8000/google/health-data", {
            params: { user_email: email },
          });

          const data = res.data;
          console.log("Fetched history data:", data);
          console.log("[🚦 Dashboard] period:", period, "→ startDate:", startDate);





          // Set chart data
          setHistory({
            heart_rate: data.heart_rate || [],
            spo2: data.spo2 || [],
            blood_pressure: data.blood_pressure || [],
          });

          // Compute average
          
          setAverageMetrics({
            heart_rate: data.heart_rate?.length ? getAverage(data.heart_rate) : "--",
            spo2: data.spo2?.length ? getAverage(data.spo2) : "--",
            blood_pressure: data.blood_pressure?.length ? getAverageBP(data.blood_pressure) : "--",
          });
          console.log("🔢 Averages computed for", period, averageMetrics);

        } catch (err) {
          console.error("Google Fit fetch error:", err);
        }

      } else {
        if (period === "Yesterday") {
          // const y = new Date();
          // y.setDate(y.getDate() - 1);
          // startDate = y.toISOString().split("T")[0];
          const y = new Date();
          y.setDate(y.getDate() - 1);
          startDate = y.toISOString().split("T")[0];


        } else if (period === "Custom") {
          if (!customStart) return;
          // startDate = new Date(customStart).toISOString().split("T")[0];
          startDate = customStart;
        }

        try {
          const res = await axios.get("http://localhost:8000/healthdata/history", {
            params: {
              user_email: email,
              start_date: startDate,
              end_date: startDate, // single date for 1-day data
            },
          });

          const data = res.data;
          console.log("Fetched history data:", data);
          console.log("[🚦 Dashboard] period:", period, "→ startDate:", startDate);



          setHistory({
            heart_rate: data.heart_rate || [],
            spo2: data.spo2 || [],
            blood_pressure: data.blood_pressure || [],
          });

          setAverageMetrics({
            heart_rate: data.heart_rate?.length ? getAverage(data.heart_rate) : "--",
            spo2: data.spo2?.length ? getAverage(data.spo2) : "--",
            blood_pressure: data.blood_pressure?.length ? getAverageBP(data.blood_pressure) : "--",
          });
        } catch (err) {
          console.error("History DB fetch error:", err);
        }
      }
    };

    fetchHealthData();
  }, [period, customStart]);






  return (


    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between bg-white shadow p-4 rounded">
        <h1 className="text-xl font-bold text-green-700">Smart Health Monitor</h1>
        <p className="text-sm text-gray-500">Welcome, {email}</p>
      </div>

      <h2 className="text-2xl font-bold text-gray-800">Health Dashboard</h2>

      <button onClick={handleSync} className="text-sm px-3 py-1 bg-blue-500 text-white rounded">Sync Now</button>




      <PeriodSelector period={period} setPeriod={setPeriod} />
      {period === "Custom" && (
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div>
            <label className="block text-sm">Select Date:</label>
            <input
              type="date"
              value={customStart || ""}
              onChange={(e) => setCustomStart(e.target.value)}
              className="border rounded px-2 py-1"

            />
          </div>
        </div>
      )}

      {/* Health Cards */}

      <GroupedHealthCards averageMetrics={averageMetrics}  period={period} />


      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LineChartPanel title="Heart Rate Trend" data={history.heart_rate} unit="bpm" />
        <LineChartPanel title="SpO₂ Trend" data={history.spo2} unit="%" />
        <LineChartPanel title="Blood Pressure Trend" data={history.blood_pressure} unit="mmHg" />
      </div>

      <div className="min-h-[40px] text-center">
        <p className="text-sm text-gray-500 mt-2">Last updated at: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default Dashboard;

/* <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <HealthCard
          title="Heart Rate"
          value={heartRateData}
          unit="bpm"
          icon={<FaHeartbeat />}
          color="bg-red-500"
        />
        <HealthCard
          title="Blood Pressure"
          value={bpData}
          unit="mmHg"
          icon={<FaTint />}
          color="bg-blue-500"
        />
        <HealthCard
          title="SpO₂"
          value={spo2Data}
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


    </div >

  );
};




export default Dashboard; */
