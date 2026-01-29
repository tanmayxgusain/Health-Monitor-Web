// /src/pages/PersonalizedDashboard.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PersonalizedAnomalyCard from "../components/PersonalizedAnomalyCard";
import PersonalizedHealthChart from "../components/PersonalizedHealthChart";
import axios from "../api/axios";



const PersonalizedDashboard = () => {
  const [anomalyData, setAnomalyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem("user_email");

    // 🔒 Redirect to login if not logged in
    if (!email) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const res = await axios.get("/personal_anomaly", {
          params: { email },
        });
        // Handle backend informational responses
        if (res.data.status === "no_data" || res.data.status === "insufficient") {
          setMessage(res.data.message);
          setAnomalyData(null);
        } else {
          setAnomalyData(res.data);
        }
      } catch (err) {
        if (err.response?.status === 202) {
          setMessage("Personalized model is still learning your baseline data.");
        } else {
          setMessage("Failed to load personalized health insights.");
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        Personalized Health Dashboard
      </h1>

      {loading && <p>Analyzing your health data...</p>}

      {!loading && message && (
        <p className="text-gray-600">{message}</p>
      )}

      {!loading && anomalyData && (
        <>
          <PersonalizedAnomalyCard data={anomalyData} />
          <PersonalizedHealthChart />
        </>
      )}
    </div>
  );
};

export default PersonalizedDashboard;
