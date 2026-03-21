import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Welcome from "./pages/Welcome.jsx";
import Info from "./pages/Info.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import Fin from "./pages/Fin.jsx";
import RRP from "./pages/RRP.jsx";
import Reset from "./pages/Reset.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Profile from "./pages/Profile.jsx";
import EditProfile from "./pages/EditProfile.jsx";
import { RegistrationProvider } from "./assets/components/Context.jsx";
import ProtectedRoute from "./assets/components/ProtectedRoute.jsx";
import RoomChat from "./pages/RoomChat.jsx";
import SearchPage from "./pages/SearchPage.jsx";

function App() {
  return (
    <Router>
            <RegistrationProvider>

      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/info" element={<Info />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/fin" element={<Fin />} />
        <Route path="/rrp" element={<RRP />} />
        <Route path="/reset" element={<Reset />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/rooms/:roomId" element={<ProtectedRoute><RoomChat /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />

      </Routes>
            </RegistrationProvider>
    </Router>
   
    
  );
}

export default App;
