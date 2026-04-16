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
import PublicProfile from "./pages/PublicProfile.jsx";

import ConnectionsPage from "./pages/ConnectionsPage.jsx";

import AdminPanel from "./pages/AdminPanel.jsx";
import SuperAdminPanel from "./pages/Superadminpanel.jsx";

import ReorientationPage from "./pages/ReorientationPage";
import CorrectInputsPage from "./pages/CorrectInputsPage";

import Guide from "./pages/Guide.jsx";

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
        <Route path="/users/:userId" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
        <Route path="/connections/:userId" element={<ProtectedRoute><ConnectionsPage /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
        <Route path="/superadmin" element={<ProtectedRoute><SuperAdminPanel /></ProtectedRoute>} />

        <Route path="/reorientation" element={<ReorientationPage />} />
        <Route path="/correct-inputs" element={<CorrectInputsPage />} />
        <Route path="/guide" element={<Guide />} />

      </Routes>
            </RegistrationProvider>
    </Router>
   
    
  );
}

export default App;
