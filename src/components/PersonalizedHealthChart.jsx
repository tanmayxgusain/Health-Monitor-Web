// /src/components/PersonalizedHealthChart.jsx

import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ScatterChart,
  Scatter,
  ReferenceArea,
} from "recharts";

// Small helper to format "2026-02-08T10:35:00+05:30" -> "10:35"
const formatTime = (isoString) => {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

// Custom tooltip for the metric chart
const MetricTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;

  return (
    <div className="bg-white border rounded shadow p-3 text-sm">
      <div className="font-semibold">{formatTime(p.timestamp)}</div>
      <div className="mt-1 space-y-1 text-gray-700">
        <div>Heart Rate: {Math.round(p.heart_rate)}</div>
        <div>SpO₂: {Math.round(p.spo2)}%</div>
        <div>BP: {Math.round(p.systolic_bp)}/{Math.round(p.diastolic_bp)}</div>
        <div className="pt-1">
          Status:{" "}
          <span className={p.is_anomaly ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
            {p.is_anomaly ? "Anomaly" : "Normal"}
          </span>
        </div>
      </div>
    </div>
  );
};

const PersonalizedHealthChart = ({ series = [] }) => {
  const [selectedMetric, setSelectedMetric] = useState("heart_rate");

  const cleaned = useMemo(() => {
    // Ensure we have a stable structure; also sort by timestamp
    const arr = Array.isArray(series) ? series : [];
    return arr
      .filter((p) => p?.timestamp)
      .slice()
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map((p) => ({
        ...p,
        t: new Date(p.timestamp).getTime(), // ✅ numeric x-axis
      }));
  }, [series]);

  const anomalyPoints = useMemo(
    () => cleaned.filter((p) => p.is_anomaly === 1),
    [cleaned]
  );

  // For a subtle background highlight of "anomaly runs"
  const anomalyRanges = useMemo(() => {
    // Build contiguous ranges where is_anomaly==1 (by adjacency in array)
    const ranges = [];
    let start = null;
    let prevWasAnomaly = false;

    for (let i = 0; i < cleaned.length; i++) {
      const cur = cleaned[i];
      const isA = cur.is_anomaly === 1;

      if (isA && !prevWasAnomaly) {
        start = cur.t;
      }

      if (!isA && prevWasAnomaly && start) {
        // end at previous point
        const end = cleaned[i - 1]?.t;
        if (end) ranges.push({ start, end });
        start = null;
      }

      prevWasAnomaly = isA;
    }

    // If we ended while still in anomaly
    if (prevWasAnomaly && start) {
      const end = cleaned[cleaned.length - 1]?.t;
      if (end) ranges.push({ start, end });
    }

    return ranges;
  }, [cleaned]);

  if (!cleaned.length) {
    return (
      <div className="text-gray-600">
        No timeline data available yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-gray-600">
          Windows: <span className="font-semibold text-gray-900">{cleaned.length}</span>{" "}
          • Anomalies: <span className="font-semibold text-gray-900">{anomalyPoints.length}</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Metric:</label>
          <select
            className="border rounded px-2 py-1 text-sm bg-white"
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
          >
            <option value="heart_rate">Heart Rate</option>
            <option value="spo2">SpO₂</option>
            <option value="systolic_bp">Systolic BP</option>
            <option value="diastolic_bp">Diastolic BP</option>
          </select>
        </div>
      </div>

      {/* 1) Timeline strip (dots) */}
      <div className="bg-gray-50 border rounded p-3">
        <div className="text-sm font-semibold text-gray-800 mb-2">
          Anomaly timeline
        </div>

        <div style={{ width: "100%", height: 90 }}>
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="t"
                type="number"
                tickFormatter={(v) => formatTime(new Date(v).toISOString())}
                domain={["dataMin", "dataMax"]}
                minTickGap={28}
                tick={{ fontSize: 11 }}
              />
              <YAxis hide domain={[0, 1]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0]?.payload;
                  if (!p) return null;
                  return (
                    <div className="bg-white border rounded shadow p-3 text-sm">
                      <div className="font-semibold">{formatTime(p.timestamp)}</div>
                      <div className="mt-1">
                        Status:{" "}
                        <span className={p.is_anomaly ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                          {p.is_anomaly ? "Anomaly" : "Normal"}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              {/* Normal points */}
              <Scatter
                data={cleaned.filter((p) => p.is_anomaly !== 1)}
                dataKey="is_anomaly"
                fill="#22c55e"   // green
              />

              {/* Anomaly points */}
              <Scatter
                data={anomalyPoints}
                dataKey="is_anomaly"
                fill="#ef4444"   // red
              />

            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 text-xs text-gray-500">
          Tip: red points indicate windows that differ from your baseline.
        </div>
      </div>

      {/* 2) Metric trend chart */}
      <div className="border rounded p-3">
        <div className="text-sm font-semibold text-gray-800 mb-2">
          Trend: {selectedMetric === "heart_rate"
            ? "Heart Rate"
            : selectedMetric === "spo2"
              ? "SpO₂"
              : selectedMetric === "systolic_bp"
                ? "Systolic BP"
                : "Diastolic BP"}
        </div>

        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={cleaned}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="t"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(v) => formatTime(new Date(v).toISOString())}
                interval="preserveStartEnd"
                minTickGap={28}
                tick={{ fontSize: 11 }}
              />

              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<MetricTooltip />} />

              {/* Highlight anomaly runs subtly */}
              {anomalyRanges.map((r, idx) => (
                <ReferenceArea
                  key={idx}
                  x1={r.start}
                  x2={r.end}
                />
              ))}

              <Line
                type="monotone"
                dataKey={selectedMetric}
                dot={false}
                strokeWidth={2}
              />

              {/* Overlay anomaly points as a scatter so they stand out */}
              <Scatter
                data={anomalyPoints}
                dataKey={selectedMetric}
                fill="#ef4444"
                shape="circle"
              />

            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 text-xs text-gray-500">
          Hover to see values for Heart Rate, SpO₂, and BP at the same time window.
        </div>
      </div>
    </div>
  );
};

export default PersonalizedHealthChart;
