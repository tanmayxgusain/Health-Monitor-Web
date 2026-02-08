// /src/components/PersonalizedAnomalyCard.jsx

import React from "react";

const PersonalizedAnomalyCard = ({ data }) => {
  const isAlert = data.status === "alert";

  return (
    <div
      className={`rounded-lg border p-4 ${
        isAlert
          ? "bg-red-50 border-red-200"
          : "bg-green-50 border-green-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">
          Anomaly Summary ({data.date})
        </h2>
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            isAlert
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {isAlert ? "⚠️ Alert" : "✅ Normal"}
        </span>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm">
        <div className="text-gray-600">Total Records</div>
        <div className="font-semibold">{data.total_records}</div>

        <div className="text-gray-600">Anomalies</div>
        <div className="font-semibold">{data.anomalies}</div>

        <div className="text-gray-600">Percent Anomalies</div>
        <div className="font-semibold">
          {data.percent_anomalies}%
        </div>

        <div className="text-gray-600">Status</div>
        <div className="font-semibold">
          {isAlert ? "⚠️ Alert" : "✅ Normal"}
        </div>
      </div>

      {/* Note */}
      <div className="mt-3 pt-3 border-t text-sm text-gray-700">
        {data.note}
      </div>
    </div>
  );
};

export default PersonalizedAnomalyCard;

