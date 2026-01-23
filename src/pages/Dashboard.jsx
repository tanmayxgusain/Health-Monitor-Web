
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import axios from "axios";


import PeriodSelector from "../components/PeriodSelector";



import LineChartPanel from "../components/LineChartPanel";

import GroupedHealthCards from "../components/GroupedHealthCards";



import SleepChart from "../components/SleepChart";


import InsightsPanel from "../components/InsightsPanel";
import ActivityChart from "../components/ActivityChart";
import AnomalyCard from "../components/AnomalyCard";


const formatDuration = (hours) => {
  if (!hours || hours === "--") return "--";
  return `${parseFloat(hours).toFixed(1)} hrs`;
};



const Dashboard = () => {
  const [period, setPeriod] = useState("Today");
  const [customStart, setCustomStart] = useState(null);
  

  const selectedDate = (() => {
    const now = new Date();
    const offsetMs = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + offsetMs);

    if (period === "Today") {
      return istNow.toISOString().split("T")[0];
    } else if (period === "Yesterday") {
      istNow.setDate(istNow.getDate() - 1);
      return istNow.toISOString().split("T")[0];
    } else if (period === "Custom" && customStart) {
      return customStart;
    }
    return null;
  })();



  const navigate = useNavigate();
  const email = localStorage.getItem("user_email");

  const [heartRateData, setHeartRateData] = useState("--");
  const [bpData, setBpData] = useState("--");
  const [spo2Data, setSpo2Data] = useState("--");
  const [sleepSessions, setSleepSessions] = useState([]);
  const [userName, setUserName] = useState("");
  const [activityLogs, setActivityLogs] = useState([]);



  const [history, setHistory] = useState({
    heart_rate: [],
    blood_pressure: [],
    spo2: [],
    steps: [],
    distance: [],
    calories: [],
    sleep: [],
    stress: [],
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

  const [aiInsight, setAiInsight] = useState(null);
  const [insights, setInsights] = useState([]);

  

  // ✅ Integer sum – use for steps, calories
  const getSumInt = (data) => {
    if (!data || data.length === 0) return "--";
    const sum = data.reduce((acc, val) => acc + (val.value || 0), 0);
    return Math.round(sum);
  };
  // ✅ Float sum – use for distance, sleep (raw)
  const getSumFloat = (data) => {
    if (!data || data.length === 0) return 0;
    return data.reduce((acc, val) => acc + (val.value || val.duration_hours || 0), 0);
  };
  




  

  const getSleepDurationSum = (sessions) => {
    if (!sessions || sessions.length === 0) return 0;
    return sessions.reduce((acc, session) => acc + (session.duration_hours || 0), 0);
  };








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
      // await axios.post("http://localhost:8000/google/sync", {
      await axios.post("https://health-monitor-djcv.onrender.com/google/sync", {
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


  



  useEffect(() => {
    if (!email) navigate("/login");
  }, []);


  

  useEffect(() => {
    const fetchHealthData = async () => {
      if (!email) return;

      // Reset state
      setHistory({
        heart_rate: [],
        spo2: [],
        blood_pressure: [],
        steps: [],
        distance: [],
        calories: [],
        sleep: [],
        stress: [],
      });

      setAverageMetrics({
        heart_rate: "--",
        spo2: "--",
        blood_pressure: "--",
        steps: "--",
        distance: "--",
        calories: "--",
        sleep: "--",
        stress: "--",
      });

      // Determine period
      const today = new Date();
      let startDate;
      try {
        // const sleepSessionRes = await axios.get("http://localhost:8000/sleep-sessions", {
        const sleepSessionRes = await axios.get("https://health-monitor-djcv.onrender.com/sleep-sessions", {
          params: {
            user_email: email,
            days: 60
          }
        });
        setSleepSessions(sleepSessionRes.data.sleep_sessions); // ⬅ Make sure you’ve defined this state

        if (period === "Today") {


          


          // Convert to IST (UTC+5:30)
          const now = new Date();
          const offsetMs = 5.5 * 60 * 60 * 1000; // 5:30 in milliseconds
          const istNow = new Date(now.getTime() + offsetMs);
          const startDate = istNow.toISOString().split("T")[0];



          // const res = await axios.get("http://localhost:8000/healthdata/history", {
          const res = await axios.get("https://health-monitor-djcv.onrender.com/healthdata/history", {
            params: {
              user_email: email,
              start_date: startDate,
              end_date: startDate,
            }
          });

          const data = res.data;
          console.log("Fetched history data:", data);
          console.log("[🚦 Dashboard] period:", period, "→ startDate:", startDate);

          console.log("[🩸 BP Raw from DB]", history.blood_pressure);



          // Set chart data
          setHistory({
            heart_rate: data.heart_rate || [],
            spo2: data.spo2 || [],
            blood_pressure: data.blood_pressure || [],
            sleep: data.sleep || [],
            stress: data.stress || [],
            steps: data.steps || [],
            distance: data.distance || [],
            calories: data.calories || [],

          });


          // Compute average

          setAverageMetrics({
            heart_rate: data.heart_rate?.length ? getAverage(data.heart_rate) : "--",
            spo2: data.spo2?.length ? getAverage(data.spo2) : "--",
            blood_pressure: data.blood_pressure?.length ? getAverageBP(data.blood_pressure) : "--",
            stress: data.stress?.length ? getAverage(data.stress) : "--",
            steps: data.steps?.length ? getSumInt(data.steps) : "--",
            calories: data.calories?.length ? getSumInt(data.calories) : "--",
            // distance: data.distance?.length ? getSum(data.distance) : "--",
            distance: data.distance?.length ? getSumFloat(data.distance).toFixed(2) : "--",

            

            sleep: (() => {
              const IST_OFFSET = 5.5 * 60 * 60 * 1000;

              // Treat selected startDate as IST midnight
              const targetIST = new Date(startDate + "T00:00:00+05:30");
              const nextIST = new Date(targetIST.getTime() + 24 * 60 * 60 * 1000);

              const filteredSleepSessions = sleepSessionRes.data.sleep_sessions.filter(session => {
                const sessionStart = new Date(session.start_time); // UTC from backend
                const sessionEnd = new Date(session.end_time);     // UTC from backend

                return sessionStart < nextIST && sessionEnd > targetIST;
              });

              console.log(`🛌 Filtered sessions for ${startDate}`, filteredSleepSessions);
              console.log("Sleep sessions received:", sleepSessions);


              return filteredSleepSessions.length
                ? formatDuration(getSumFloat(filteredSleepSessions))
                : "--";
            })(),





          });




        } else {
          let startDate;
          if (period === "Yesterday") {

            

            const now = new Date();
            const offsetMs = 5.5 * 60 * 60 * 1000;
            const istNow = new Date(now.getTime() + offsetMs);
            istNow.setDate(istNow.getDate() - 1);
            startDate = istNow.toISOString().split("T")[0];



          } else if (period === "Custom") {
            if (!customStart) return;
            // startDate = new Date(customStart).toISOString().split("T")[0];
            startDate = customStart;
          }


          // const res = await axios.get("http://localhost:8000/healthdata/history", {
          const res = await axios.get("https://health-monitor-djcv.onrender.com/healthdata/history", {
            params: {
              user_email: email,
              start_date: startDate,
              end_date: startDate, // single date for 1-day data
            },
          });

          const data = res.data;
          

          setHistory({
            heart_rate: data.heart_rate || [],
            spo2: data.spo2 || [],
            blood_pressure: data.blood_pressure || [],
            steps: data.steps || [],
            distance: data.distance || [],
            calories: data.calories || [],
            sleep: data.sleep || [],
            stress: data.stress || [],
          });

          setAverageMetrics({
            heart_rate: data.heart_rate?.length ? getAverage(data.heart_rate) : "--",
            spo2: data.spo2?.length ? getAverage(data.spo2) : "--",
            blood_pressure: data.blood_pressure?.length ? getAverageBP(data.blood_pressure) : "--",
            steps: getSumInt(data.steps),
            distance: getSumFloat(data.distance),
            calories: getSumInt(data.calories),
            stress: getAverage(data.stress),
            

            sleep: (() => {
              const IST_OFFSET = 5.5 * 60 * 60 * 1000;

              // Treat selected startDate as IST midnight
              const targetIST = new Date(startDate + "T00:00:00+05:30");
              const nextIST = new Date(targetIST.getTime() + 24 * 60 * 60 * 1000);

              const filteredSleepSessions = sleepSessionRes.data.sleep_sessions.filter(session => {
                const sessionStart = new Date(session.start_time); // UTC from backend
                const sessionEnd = new Date(session.end_time);     // UTC from backend

                return sessionStart < nextIST && sessionEnd > targetIST;
              });

              console.log(`🛌 Filtered sessions for ${startDate}`, filteredSleepSessions);
              console.log("Sleep sessions received:", sleepSessions);


              return filteredSleepSessions.length
                ? formatDuration(getSumFloat(filteredSleepSessions))
                : "--";
            })(),







          });
        }
        // 🟨 Fetch Sleep Sessions for bar chart (7-day graph)

      } catch (err) {
        console.error("History DB fetch error:", err);
      }

      // Fetch activity logs
      try {
        // const actRes = await axios.get("http://localhost:8000/activity-logs", {
        const actRes = await axios.get("https://health-monitor-djcv.onrender.com/activity-logs", {
          params: {
            user_email: email,
            days: 7
          }
        });
        setActivityLogs(actRes.data || []);
      } catch (err) {
        console.error("Failed to fetch activity logs:", err);
      }

    };

    fetchHealthData();
  }, [period, customStart]);





  

  useEffect(() => {
    const fetchUserName = async () => {
      if (!email) return;

      try {
        // const res = await axios.get(`http://localhost:8000/users/profile?email=${email}`);
        const res = await axios.get(`https://health-monitor-djcv.onrender.com/users/profile?email=${email}`);
        const userData = res.data;
        setUserName(userData.name || "User");  // fallback to "User"
      } catch (err) {
        console.error("Failed to fetch user name:", err);
      }
    };

    fetchUserName();
  }, []);


  useEffect(() => {
    const fetchInsights = async () => {
      const email = localStorage.getItem("user_email");
      // const res = await axios.get(`http://localhost:8000/ai/insights?user_email=${email}`);
      const res = await axios.get(`https://health-monitor-djcv.onrender.com/ai/insights?user_email=${email}`);
      setInsights(res.data.insights || []);
    };

    fetchInsights();
  }, []);











  return (


    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between bg-white shadow p-4 rounded">
        <h1 className="text-xl font-bold text-green-700">Smart Health Monitor</h1>
        <p className="text-sm text-gray-500">Welcome, {userName}</p>
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

      

      <AnomalyCard email={email} selectedDate={selectedDate} />

      <InsightsPanel insights={insights} />






      {/* Health Cards */}

      <GroupedHealthCards averageMetrics={averageMetrics} period={period} />






      {/* Charts */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LineChartPanel title="Heart Rate Trend" data={history.heart_rate} unit="bpm" />
        <LineChartPanel title="SpO₂ Trend" data={history.spo2} unit="%" />
        

        <LineChartPanel
          title="Blood Pressure Trend"
          data={history.blood_pressure.map((d) => ({
            systolic: d.systolic,
            diastolic: d.diastolic,
            timestamp: d.timestamp,  // ⬅️ keep raw ISO timestamp
          }))}
          color="red"
        />




        {/* <LineChartPanel title="Sleep Trend" data={history.sleep} unit="hrs" /> */}
        <LineChartPanel title="Stress Trend" data={history.stress} unit="level" />
      </div>

      <SleepChart sleepSessions={sleepSessions} />
      <ActivityChart data={activityLogs} />


      <div className="min-h-[40px] text-center">
        <p className="text-sm text-gray-500 mt-2">Last updated at: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default Dashboard;


