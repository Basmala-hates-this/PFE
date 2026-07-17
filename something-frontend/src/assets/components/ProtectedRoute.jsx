import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("currentUser");
  const guestToken = localStorage.getItem("guestToken");
  const location = useLocation();

  if (!token && !guestToken) {
    return <Navigate to="/login" />;
  }

  // guests can only access dashboard
  if (guestToken && !token && location.pathname !== "/dashboard" && location.pathname !== "/search") {
    return <Navigate to="/dashboard" />;
  }

  return children; 
}