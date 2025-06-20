import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";



// const HealthChart = ({ title, data, dataKey, color }) => {
//   return (
//     <div className="bg-white p-4 rounded-2xl shadow-md w-full">
//       <h3 className="text-lg font-semibold mb-2">{title}</h3>
//       <ResponsiveContainer width="100%" height={200}>
//         <LineChart data={data}>
//           <CartesianGrid strokeDasharray="3 3" />
//           <XAxis dataKey="time" />
//           <YAxis />
//           <Tooltip />
//           <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} />
//         </LineChart>
//       </ResponsiveContainer>
//     </div>
//   );
// };

const HealthChart = ({ data, color = "#ef4444", metric = "Heart Rate" }) => {
  const hasData = data && data.length > 0;

  return (
    <div className="w-full h-64 bg-white rounded-xl shadow p-4">
      <h3 className="text-lg font-semibold mb-2 text-gray-700">Daily {metric} Chart</h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={hasData ? data : [{ timestamp: "", value: 0 }]}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Tooltip />
          {hasData ? (
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
      {!hasData && (
        <p className="text-center text-sm text-gray-500">No data available</p>
      )}
    </div>
  );
};

export default HealthChart;
