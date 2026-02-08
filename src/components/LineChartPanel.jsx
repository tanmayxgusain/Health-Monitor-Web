
// import React, { useMemo } from "react";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
//   CartesianGrid,
//   ResponsiveContainer,
// } from "recharts";

// import { formatToIST } from "../utils/time";

// const LineChartPanel = ({ data, title, color }) => {
//   const formattedData = useMemo(() => {
//     if (!data || data.length === 0) return [];

//     return [...data]
//       .filter((d) => d?.timestamp || d?.time)
//       .map((d) => {
//         const ts = d.timestamp || d.time;
//         const epoch = new Date(ts).getTime();

//         // Coerce possible string numbers to actual numbers (important for BP)
//         const systolic =
//           d.systolic === null || d.systolic === undefined ? undefined : Number(d.systolic);
//         const diastolic =
//           d.diastolic === null || d.diastolic === undefined ? undefined : Number(d.diastolic);
//         const value =
//           d.value === null || d.value === undefined ? undefined : Number(d.value);

//         return {
//           ...d,
//           epoch,
//           systolic,
//           diastolic,
//           value,
//         };
//       })
//       .sort((a, b) => a.epoch - b.epoch);
//   }, [data]);

//   if (!formattedData.length) {
//     return (
//       <div className="bg-white rounded-2xl p-4 shadow-md w-full text-center">
//         <h3 className="text-md font-semibold text-gray-700 mb-2">{title}</h3>
//         <p className="text-sm text-gray-400">No data available</p>
//       </div>
//     );
//   }

//   // ✅ Detect BP by checking ANY row (not just the first one)
//   const hasSystolic = formattedData.some((d) => d.systolic !== undefined && !Number.isNaN(d.systolic));
//   const hasDiastolic = formattedData.some((d) => d.diastolic !== undefined && !Number.isNaN(d.diastolic));
//   const hasValue = formattedData.some((d) => d.value !== undefined && !Number.isNaN(d.value));

//   return (
//     <div className="bg-white rounded-2xl p-4 shadow-md w-full">
//       <h3 className="text-md font-semibold text-gray-700 mb-2">{title}</h3>

//       <ResponsiveContainer width="100%" height={200}>
//         <LineChart data={formattedData}>
//           <CartesianGrid strokeDasharray="3 3" />

//           <XAxis
//             dataKey="epoch"
//             type="number"
//             domain={["dataMin", "dataMax"]}
//             tickFormatter={(epoch) => formatToIST(new Date(epoch).toISOString())}
//           />

//           <YAxis />

//           <Tooltip
//             labelFormatter={(epoch) => formatToIST(new Date(epoch).toISOString())}
//           />

//           {/* Blood Pressure */}
//           {hasSystolic && (
//             <Line
//               type="monotone"
//               dataKey="systolic"
//               stroke="#f87171"
//               strokeWidth={2}
//               name="Systolic"
//               dot={false}
//               connectNulls
//             />
//           )}
//           {hasDiastolic && (
//             <Line
//               type="monotone"
//               dataKey="diastolic"
//               stroke="#60a5fa"
//               strokeWidth={2}
//               name="Diastolic"
//               dot={false}
//               connectNulls
//             />
//           )}

//           {/* Normal single-value metrics */}
//           {!hasSystolic && !hasDiastolic && hasValue && (
//             <Line
//               type="monotone"
//               dataKey="value"
//               stroke={color || "#10b981"}
//               strokeWidth={2}
//               dot={false}
//               name={title}
//               connectNulls
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
  Customized,
} from "recharts";

import { formatToIST } from "../utils/time";

// ---- helpers ----
const MS_MIN = 60 * 1000;
const MS_HOUR = 60 * MS_MIN;

const floorToHour = (ms) => Math.floor(ms / MS_HOUR) * MS_HOUR;
const ceilToHour = (ms) => Math.ceil(ms / MS_HOUR) * MS_HOUR;

const buildTicks = (minEpoch, maxEpoch, stepHours = 4) => {
  const start = floorToHour(minEpoch);
  const end = ceilToHour(maxEpoch);
  const step = stepHours * MS_HOUR;

  const ticks = [];
  for (let t = start; t <= end; t += step) ticks.push(t);
  return ticks;
};

// ---- BP vertical connector layer (BP only) ----
const BPVerticalConnectors = (props) => {
  const { xAxisMap, yAxisMap, data } = props;

  // Safely grab the first X/Y axis scales (single chart case)
  const xAxisKey = Object.keys(xAxisMap || {})[0];
  const yAxisKey = Object.keys(yAxisMap || {})[0];
  const xScale = xAxisMap?.[xAxisKey]?.scale;
  const yScale = yAxisMap?.[yAxisKey]?.scale;

  if (!xScale || !yScale || !Array.isArray(data)) return null;

  return (
    <g>
      {data.map((d, idx) => {
        const epoch = d?.epoch;
        const sys = d?.systolic;
        const dia = d?.diastolic;

        if (!Number.isFinite(epoch) || !Number.isFinite(sys) || !Number.isFinite(dia)) {
          return null;
        }

        const x = xScale(epoch);
        const y1 = yScale(sys);
        const y2 = yScale(dia);

        // If scale returns NaN for any reason, skip
        if (![x, y1, y2].every((v) => Number.isFinite(v))) return null;

        return (
          <line
            key={`bp-conn-${idx}`}
            x1={x}
            x2={x}
            y1={y1}
            y2={y2}
            stroke="rgba(100, 116, 139, 0.28)" // subtle slate, translucent
            strokeWidth={2}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
};

const LineChartPanel = ({ data, title, color }) => {
  const { chartData, ticks, isBP, hasSystolic, hasDiastolic, hasValue } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        chartData: [],
        ticks: [],
        isBP: false,
        hasSystolic: false,
        hasDiastolic: false,
        hasValue: false,
      };
    }

    // 1) Normalize + sort
    const normalized = [...data]
      .filter((d) => d?.timestamp || d?.time)
      .map((d) => {
        // const ts = d.timestamp || d.time;
        // const epoch = new Date(ts).getTime();

        const ts = d.timestamp ?? d.time;
        const epoch = typeof ts === "number" ? ts : Number(ts);


        const systolic =
          d.systolic === null || d.systolic === undefined ? undefined : Number(d.systolic);
        const diastolic =
          d.diastolic === null || d.diastolic === undefined ? undefined : Number(d.diastolic);
        const value = d.value === null || d.value === undefined ? undefined : Number(d.value);

        return { ...d, epoch, systolic, diastolic, value };
      })
      .sort((a, b) => a.epoch - b.epoch);

    const hasS = normalized.some((d) => Number.isFinite(d.systolic));
    const hasD = normalized.some((d) => Number.isFinite(d.diastolic));
    const hasV = normalized.some((d) => Number.isFinite(d.value));
    // const bp = hasS || hasD;
    const bp = hasS && hasD; // require both to consider it BP


    // 2) Gap-aware breaks (non-BP only)
    const GAP_THRESHOLD = 60 * MS_MIN; // break if gap > 60 minutes (single-day view)
    let withGaps = normalized;

    if (!bp) {
      const out = [];
      for (let i = 0; i < normalized.length; i++) {
        const cur = normalized[i];
        out.push(cur);

        const next = normalized[i + 1];
        if (next) {
          const gap = next.epoch - cur.epoch;
          if (gap > GAP_THRESHOLD) {
            out.push({
              epoch: cur.epoch + 1, // tiny offset
              value: null, // null breaks the line
            });
          }
        }
      }
      withGaps = out;
    }

    // 3) Fixed-ish ticks (regular time markers)
    const minEpoch = normalized[0]?.epoch ?? Date.now();
    const maxEpoch = normalized[normalized.length - 1]?.epoch ?? Date.now();

    // const tickList = buildTicks(minEpoch, maxEpoch, 4); // every 4 hours (clean on most screens)
    const rangeMs = maxEpoch - minEpoch;
    const stepHours =
      rangeMs <= 6 * MS_HOUR ? 1 :   // <= 6 hours range → tick every hour
        rangeMs <= 24 * MS_HOUR ? 4 :  // <= 24 hours → every 4 hours
          12;                            // bigger → every 12 hours

    const tickList = buildTicks(minEpoch, maxEpoch, stepHours);


    return {
      chartData: withGaps,
      ticks: tickList,
      isBP: bp,
      hasSystolic: hasS,
      hasDiastolic: hasD,
      hasValue: hasV,
    };
  }, [data]);

  if (!chartData.length) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-md w-full text-center">
        <h3 className="text-md font-semibold text-gray-700 mb-2">{title}</h3>
        <p className="text-sm text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-md w-full">
      <h3 className="text-md font-semibold text-gray-700 mb-2">{title}</h3>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="epoch"
            type="number"
            domain={["dataMin", "dataMax"]}
            ticks={ticks}
            interval={0}
            minTickGap={20}
            allowDuplicatedCategory={false}

            // tickFormatter={(epoch) => formatToIST(new Date(epoch).toISOString())}
            tickFormatter={(epoch) => formatToIST(epoch)}

          />

          <YAxis />

          {/* <Tooltip
            // labelFormatter={(epoch) => formatToIST(new Date(epoch).toISOString())}
            labelFormatter={(epoch) => formatToIST(epoch)}

            formatter={(val, name) => {
              if (val === null || val === undefined) return ["--", name];
              return [val, name];
            }}
          /> */}

          {isBP ? (
            <Tooltip
              isAnimationActive={false}
              labelFormatter={(epoch) => formatToIST(epoch)}
              content={({ active, label, payload }) => {
                if (!active) return null;

                const systolic = payload?.find((p) => p.dataKey === "systolic")?.value;
                const diastolic = payload?.find((p) => p.dataKey === "diastolic")?.value;

                return (
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md">
                    <div className="text-xs text-gray-500 mb-1">{formatToIST(label)}</div>

                    <div className="text-sm text-gray-700">
                      <span className="font-semibold">Systolic:</span>{" "}
                      {Number.isFinite(systolic) ? systolic : "--"}
                    </div>

                    <div className="text-sm text-gray-700">
                      <span className="font-semibold">Diastolic:</span>{" "}
                      {Number.isFinite(diastolic) ? diastolic : "--"}
                    </div>
                  </div>
                );
              }}
            />
          ) : (
            <Tooltip
              labelFormatter={(epoch) => formatToIST(epoch)}
              formatter={(val, name) => {
                if (val === null || val === undefined) return ["--", name];
                return [val, name];
              }}
            />
          )}



          {/* ✅ BP-only vertical connectors (range band) */}
          {isBP && <Customized component={BPVerticalConnectors} />}

          {/* BP: dots only (no horizontal connecting line) */}
          {isBP && hasSystolic && (
            <Line
              type="monotone"
              dataKey="systolic"
              name="Systolic"
              stroke="transparent"
              dot={{ r: 3, fill: "#f87171" }}
              activeDot={{ r: 5 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          )}

          {isBP && hasDiastolic && (
            <Line
              type="monotone"
              dataKey="diastolic"
              name="Diastolic"
              stroke="transparent"
              dot={{ r: 3, fill: "#60a5fa" }}
              activeDot={{ r: 5 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          )}

          {/* Non-BP metrics: line with gap breaks */}
          {/* {!isBP && hasValue && (
            <Line
              type="monotone"
              dataKey="value"
              name={title}
              stroke={color || "#10b981"}
              strokeWidth={2}
              dot={false}
              // dot={/heart\s*rate|spo2|spo₂|oxygen|o2/i.test(title) ? { r: 3 } : false}
              // activeDot={{ r: 6 }}

              connectNulls={false}
              isAnimationActive={false}
            />
          )} */}

          {!isBP && hasValue && (() => {
            const showDots = /heart\s*rate|hr\b|spo2|spo₂|oxygen|o2/i.test(title);
            return (
              <Line
                type="monotone"
                dataKey="value"
                name={title}
                stroke={color || "#10b981"}
                strokeWidth={2}
                dot={showDots ? { r: 3 } : false}
                activeDot={{ r: 6 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            );
          })()}


        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChartPanel;
