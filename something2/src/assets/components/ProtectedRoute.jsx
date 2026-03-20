import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const isGuest = localStorage.getItem("isGuest");
  if (!token && !isGuest) {
  return <Navigate to="/login" />;
}
//ehh...i tested navigating to profile via url while in guest...it worked...this is hopefully a procution...
 if (isGuest && location.pathname !== "/dashboard") {
    return <Navigate to="/dashboard" />;
  }
    return children;
}    