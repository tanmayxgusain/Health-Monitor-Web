import React, { useState } from "react";
import HealthCard from "./HealthCard";
import Dashboard from "../pages/Dashboard";
import { iconMap } from "../constants/iconMap";
import { healthGroups } from "../constants/healthGroups";




const GroupedHealthCards = ({ averageMetrics, period }) => {


  const [openGroup, setOpenGroup] = useState("Vitals");

  return (
    <div className="space-y-4">
      {Object.entries(healthGroups).map(([groupName, keys]) => (
        <div key={groupName} className="bg-white rounded shadow p-4">
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() =>
              setOpenGroup(openGroup === groupName ? null : groupName)
            }
            role="button"
            aria-expanded={openGroup === groupName}
            tabIndex={0}
          >
            <h3 className="text-lg font-semibold">{groupName}</h3>
            <span className="transition-transform duration-300 transform">
              {openGroup === groupName ? "▲" : "▼"}
            </span>
          </div>

          {openGroup === groupName && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {keys.map((key) => {
                const meta = iconMap[key];
                if (!meta) return null;

                let value = averageMetrics[key] ?? "--";
                // let unit = meta.unit;
                let unit = key === "sleep" && typeof value === "string" && value.includes("h") ? "" : meta.unit;


                // Special formatting for blood pressure
                if (key === "blood_pressure" && value && value.systolic && value.diastolic) {
                  value = `${value.systolic}/${value.diastolic}`;
                  unit = "mmHg";
                }

                return (
                  <HealthCard
                    key={`${key}-${period}`}
                    title={meta.title}
                    value={value}
                    unit={unit}
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
