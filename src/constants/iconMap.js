// // src/constants/iconMap.js
// import { FaHeartbeat, FaTint, FaLungs, FaBed, FaShoePrints, FaFireAlt } from "react-icons/fa";

// export const iconMap = {
//   heart_rate: { icon: <FaHeartbeat />, unit: "bpm", color: "bg-red-500", title: "Heart Rate", group: "Vitals" },
//   blood_pressure: { icon: <FaTint />, unit: "mmHg", color: "bg-blue-500", title: "Blood Pressure", group: "Vitals" },
//   spo2: { icon: <FaLungs />, unit: "%", color: "bg-green-500", title: "SpO₂", group: "Vitals" },
//   steps: { icon: <FaShoePrints />, unit: "steps", color: "bg-orange-500", title: "Steps", group: "Activity" },
//   distance: { icon: <FaShoePrints />, unit: "km", color: "bg-purple-600", title: "Distance", group: "Activity" },
//   calories: { icon: <FaFireAlt />, unit: "kcal", color: "bg-pink-600", title: "Calories", group: "Activity" },
//   sleep: { icon: <FaBed />, unit: "hrs", color: "bg-indigo-500", title: "Sleep", group: "Lifestyle" },
//   stress: { icon: <FaLungs />, unit: "", color: "bg-yellow-700", title: "Stress", group: "Lifestyle" },
// };


import { FaHeartbeat, FaLungs, FaWalking, FaFireAlt } from "react-icons/fa";
import { MdBloodtype, MdHotel } from "react-icons/md";
import { GiBrain } from "react-icons/gi";

export const iconMap = {
  heart_rate: {
    title: "Heart Rate",
    icon: FaHeartbeat,      // ✅ COMPONENT, not JSX
    unit: "bpm",
    color: "#ef4444",
  },
  spo2: {
    title: "SpO₂",
    icon: FaLungs,
    unit: "%",
    color: "#3b82f6",
  },
  blood_pressure: {
    title: "Blood Pressure",
    icon: MdBloodtype,
    unit: "mmHg",
    color: "#f97316",
  },
  steps: {
    title: "Steps",
    icon: FaWalking,
    unit: "",
    color: "#22c55e",
  },
  calories: {
    title: "Calories",
    icon: FaFireAlt,
    unit: "kcal",
    color: "#f59e0b",
  },
  sleep: {
    title: "Sleep",
    icon: MdHotel,
    unit: "hrs",
    color: "#6366f1",
  },
  stress: {
    title: "Stress",
    icon: GiBrain,
    unit: "level",
    color: "#8b5cf6",
  },

  distance: {
    title: "Distance",
    unit: "km",
    icon: "distance", // or the actual icon component you use
    color: "text-blue-600", // match your style
  },
};
