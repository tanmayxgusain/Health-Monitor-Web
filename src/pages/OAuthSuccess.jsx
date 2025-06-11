import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

export default function OAuthSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const email = query.get("email");

    if (email) {
      // Optional: Save in state/localStorage
      localStorage.setItem("user_email", email);

      // Navigate to dashboard
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  }, [location, navigate]);

  return <div className="text-center mt-10">Logging you in...</div>;
}
