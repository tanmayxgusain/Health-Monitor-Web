// import React, { useMemo } from "react";
// import {
//   LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
// } from "recharts";

// import { formatToIST } from "../utils/time";

// const LineChartPanel = ({ data, title, color }) => {
//   if (!data || data.length === 0) {
//     return (
//       <div className="bg-white rounded-2xl p-4 shadow-md w-full text-center">
//         <h3 className="text-md font-semibold text-gray-700 mb-2">{title}</h3>
//         <p className="text-sm text-gray-400">No data available</p>
//       </div>
//     );
//   }





//   const formattedData = data.map((d) => {
//     const time = formatToIST(d.timestamp || d.time);  // use timestamp if available
//     return { ...d, time };
//   });






//   return (
//     <div className="bg-white rounded-2xl p-4 shadow-md w-full">
//       <h3 className="text-md font-semibold text-gray-700 mb-2">{title}</h3>
//       <ResponsiveContainer width="100%" height={200}>
//         <LineChart data={formattedData}>
//           <CartesianGrid strokeDasharray="3 3" />
//           <XAxis dataKey="time" />
//           <YAxis />
//           <Tooltip />
//           labelFormatter={(label) => {
//             console.log("[🕒 Tooltip Label]", label);
//             return label;
//           }}

//           {formattedData[0]?.systolic !== undefined && (
//             <Line
//               type="monotone"
//               dataKey="systolic"
//               stroke="#f87171"
//               strokeWidth={2}
//               name="Systolic"
//             />
//           )}
//           {formattedData[0]?.diastolic !== undefined && (
//             <Line
//               type="monotone"
//               dataKey="diastolic"
//               stroke="#60a5fa"
//               strokeWidth={2}
//               name="Diastolic"
//             />
//           )}
//           {formattedData[0]?.value !== undefined && (
//             <Line
//               type="monotone"
//               dataKey="value"
//               stroke={color || "#10b981"}
//               strokeWidth={2}
//             />
//           )}

//         </LineChart>
//       </ResponsiveContainer>
//     </div>
//   );
// };

// export default LineChartPanel;


import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import { formatToIST } from "../utils/time";

const LineChartPanel = ({ data, title, color }) => {
  const formattedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return [...data]
      .filter((d) => d?.timestamp || d?.time)
      .map((d) => {
        const ts = d.timestamp || d.time;
        const epoch = new Date(ts).getTime();

        // Coerce possible string numbers to actual numbers (important for BP)
        const systolic =
          d.systolic === null || d.systolic === undefined ? undefined : Number(d.systolic);
        const diastolic =
          d.diastolic === null || d.diastolic === undefined ? undefined : Number(d.diastolic);
        const value =
          d.value === null || d.value === undefined ? undefined : Number(d.value);

        return {
          ...d,
          epoch,
          systolic,
          diastolic,
          value,
        };
      })
      .sort((a, b) => a.epoch - b.epoch);
  }, [data]);

  if (!formattedData.length) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-md w-full text-center">
        <h3 className="text-md font-semibold text-gray-700 mb-2">{title}</h3>
        <p className="text-sm text-gray-400">No data available</p>
      </div>
    );
  }

  // ✅ Detect BP by checking ANY row (not just the first one)
  const hasSystolic = formattedData.some((d) => d.systolic !== undefined && !Number.isNaN(d.systolic));
  const hasDiastolic = formattedData.some((d) => d.diastolic !== undefined && !Number.isNaN(d.diastolic));
  const hasValue = formattedData.some((d) => d.value !== undefined && !Number.isNaN(d.value));

  return (
    <div className="bg-white rounded-2xl p-4 shadow-md w-full">
      <h3 className="text-md font-semibold text-gray-700 mb-2">{title}</h3>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="epoch"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(epoch) => formatToIST(new Date(epoch).toISOString())}
          />

          <YAxis />

          <Tooltip
            labelFormatter={(epoch) => formatToIST(new Date(epoch).toISOString())}
          />

          {/* Blood Pressure */}
          {hasSystolic && (
            <Line
              type="monotone"
              dataKey="systolic"
              stroke="#f87171"
              strokeWidth={2}
              name="Systolic"
              dot={false}
              connectNulls
            />
          )}
          {hasDiastolic && (
            <Line
              type="monotone"
              dataKey="diastolic"
              stroke="#60a5fa"
              strokeWidth={2}
              name="Diastolic"
              dot={false}
              connectNulls
            />
          )}

          {/* Normal single-value metrics */}
          {!hasSystolic && !hasDiastolic && hasValue && (
            <Line
              type="monotone"
              dataKey="value"
              stroke={color || "#10b981"}
              strokeWidth={2}
              dot={false}
              name={title}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChartPanel;
