import React from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from "recharts";

const LineChartPanel = ({ data, title, color }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-md w-full text-center">
        <h3 className="text-md font-semibold text-gray-700 mb-2">{title}</h3>
        <p className="text-sm text-gray-400">No data available</p>
      </div>
    );
  }

  // Determine if BP by checking for 'systolic' key
  const isBP = data[0]?.systolic !== undefined;

  console.log(`[🩸 BP Chart] Final data for chart (${title}):`, data);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-md w-full">
      <h3 className="text-md font-semibold text-gray-700 mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />

          {/* Handle both systolic and diastolic if available */}
          {data[0]?.systolic !== undefined && (
            <Line type="monotone" dataKey="systolic" stroke="#f87171" strokeWidth={2} name="Systolic" />
          )}
          {data[0]?.diastolic !== undefined && (
            <Line type="monotone" dataKey="diastolic" stroke="#60a5fa" strokeWidth={2} name="Diastolic" />
          )}

          {/* Fallback for general value */}
          {data[0]?.value !== undefined && (
            <Line type="monotone" dataKey="value" stroke={color || "#10b981"} strokeWidth={2} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChartPanel;
