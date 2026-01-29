// /src/components/PersonalizedAnomalyCard.jsx

import React from "react";

const PersonalizedAnomalyCard = ({ data }) => {
  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h2 className="text-xl font-semibold mb-2">Anomaly Summary ({data.date})</h2>
      <p>Total Records: {data.total_records}</p>
      <p>Anomalies: {data.anomalies}</p>
      <p>Percent Anomalies: {data.percent_anomalies}%</p>
      <p>Status: {data.status === "alert" ? "⚠️ Alert" : "✅ Normal"}</p>
      <p>{data.note}</p>
    </div>
  );
};

export default PersonalizedAnomalyCard;
