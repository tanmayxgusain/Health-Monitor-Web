
// /src/pages/PersonalizedDashboard.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PersonalizedAnomalyCard from "../components/PersonalizedAnomalyCard";
import PersonalizedHealthChart from "../components/PersonalizedHealthChart";
import axios from "../api/axios";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

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
        const res = await axios.get("/personal_anomaly", { params: { email } });

        if (res.data.status === "no_data" || res.data.status === "insufficient") {
          setMessage(res.data.message);
          setAnomalyData(null);
        } else {
          setMessage("");
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

  // ---------- UI helpers ----------
  const statusMeta = useMemo(() => {
    const status = anomalyData?.status;
    if (status === "alert") {
      return {
        label: "Alert",
        badge: "bg-red-100 text-red-700 border-red-200",
        card: "border-red-200",
        icon: "⚠️",
        headline: "Needs attention",
      };
    }
    return {
      label: "Normal",
      badge: "bg-green-100 text-green-700 border-green-200",
      card: "border-green-200",
      icon: "✅",
      headline: "Looks normal",
    };
  }, [anomalyData]);

  const percent = anomalyData?.percent_anomalies ?? 0;
  const anomalyColor = anomalyData?.status === "alert" ? "#ef4444" : "#22c55e";
  const donutData = useMemo(() => {
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    return [
      { name: "Anomalies", value: p },
      { name: "Normal", value: 100 - p },
    ];
  }, [percent]);

  const whatItMeansText = useMemo(() => {
    if (!anomalyData) return "";
    if (anomalyData.status === "alert") {
      return (
        "Most of today’s resting readings were different from your usual baseline. " +
        "This can happen due to stress, illness, poor sleep, unusual activity, or sensor noise. " +
        "If this continues for multiple days or you feel unwell, consider monitoring closely or consulting a professional."
      );
    }
    return (
      "Your resting readings are mostly consistent with your usual baseline. " +
      "Small variations are normal. Keep tracking regularly to maintain a reliable baseline."
    );
  }, [anomalyData]);

  const contributors = anomalyData?.top_contributors ?? [];
  const confidence = anomalyData?.data_confidence ?? null;

  return (
    <div className="p-3 sm:p-4 space-y-4">

      <div className="flex items-end justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Personalized Health Dashboard</h1>

        {!loading && anomalyData && (
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border whitespace-nowrap ${statusMeta.badge}`}>

            <span>{statusMeta.icon}</span>
            <span className="font-semibold">{statusMeta.label}</span>
            {confidence && (
              <span className="text-xs opacity-80">
                • data confidence: {confidence}
              </span>
            )}
          </div>
        )}
      </div>

      {loading && <p>Analyzing your health data...</p>}

      {!loading && message && <p className="text-gray-600">{message}</p>}

      {!loading && anomalyData && (
        <>
          {/* Row 1: Summary + Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Keep your existing text summary EXACTLY as-is in this card */}
            <div className={`bg-white rounded-lg shadow-sm p-4 border ${statusMeta.card} lg:col-span-2`}>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-gray-500">Today’s status</div>
                  <div className="text-xl font-bold flex items-center gap-2">
                    <span>{statusMeta.icon}</span>
                    <span>{statusMeta.headline}</span>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full border text-sm font-semibold ${statusMeta.badge}`}>
                  {statusMeta.label}
                </div>
              </div>

              <div className="mt-4">
                {/* TEXT BLOCK MUST REMAIN AS IT IS → we keep it inside PersonalizedAnomalyCard */}
                <PersonalizedAnomalyCard data={anomalyData} />
              </div>

              {/* Contributors */}
              {contributors.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-semibold text-gray-700 mb-2">
                    Main contributors today
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {contributors.map((c) => (
                      <span
                        key={c}
                        className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm border"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Donut chart */}
            <div className="bg-white rounded-lg shadow-sm p-4 border">
              <div className="text-sm text-gray-500">Anomaly rate</div>
              <div className="text-lg font-bold">
                {Number(percent).toFixed(2)}%
              </div>


              <div className="mt-2 h-[180px] sm:h-[220px] w-full">

                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="65%"
                      outerRadius="90%"
                      paddingAngle={2}
                      isAnimationActive={true}
                    >
                      {/* Anomalies slice */}
                      <Cell fill={anomalyColor} />

                      {/* Normal slice */}
                      <Cell fill="#e5e7eb" />
                    </Pie>
                    <Tooltip
                      formatter={(value) =>
                        typeof value === "number" ? `${value.toFixed(2)}%` : value
                      }
                    />

                  </PieChart>

                </ResponsiveContainer>
              </div>

              <div className="text-sm text-gray-600 mt-2">
                {anomalyData.status === "alert"
                  ? "High anomaly rate detected. Review trends below."
                  : "Anomaly rate is within normal range."}
              </div>
            </div>
          </div>

          {/* Row 2: Timeline/Charts */}
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="text-lg font-bold">Today’s timeline</div>
                <div className="text-sm text-gray-500">
                  Anomalies highlighted across your resting windows
                </div>
              </div>
            </div>

            {/* Pass series to chart so it can render anomaly markers / trends */}
            <div className="mt-4">
              <PersonalizedHealthChart series={anomalyData.series || []} />
            </div>
          </div>

          {/* Row 3: What it means */}
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <div className="text-lg font-bold">What does this mean?</div>
            <p className="text-gray-700 mt-2 leading-relaxed">{whatItMeansText}</p>

            <div className="mt-3 text-xs text-gray-500">
              Note: This is an automated insight based on your personal baseline. It is not a medical diagnosis.
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PersonalizedDashboard;
