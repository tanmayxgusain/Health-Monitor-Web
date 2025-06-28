import React, { useState } from "react";
import HealthCard from "./HealthCard";
import Dashboard from "../pages/Dashboard";
import { iconMap } from "../pages/Dashboard"; // Adjust path as needed



const GroupedHealthCards = ({ averageMetrics, period}) => {
  const groups = {
    Vitals: ["heart_rate", "blood_pressure", "spo2"],
    Activity: ["steps", "distance", "calories"],
    Lifestyle: ["sleep", "stress"]
  };

  const [openGroup, setOpenGroup] = useState("Vitals");

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([groupName, keys]) => (
        <div key={groupName} className="bg-white rounded shadow p-4">
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() =>
              setOpenGroup(openGroup === groupName ? null : groupName)
            }
          >
            <h3 className="text-lg font-semibold">{groupName}</h3>
            <span>{openGroup === groupName ? "▲" : "▼"}</span>
          </div>

          {openGroup === groupName && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {keys.map((key) => {
                const meta = iconMap[key];
                if (!meta) return null;
                const value = averageMetrics[key] ?? "--";
                return (
                  <HealthCard
                    // key={key}
                    key={`${key}-${period}`}
                    title={meta.title}
                    value={value}
                    unit={meta.unit}
                    icon={meta.icon}
                    color={meta.color}
                  />
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default GroupedHealthCards;
