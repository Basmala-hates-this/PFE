import logo2 from "../photos/logo2.png"
 import "../styles/welcome.css"
 import { useNavigate } from "react-router-dom";


export default function Welcome(){
  const navigate = useNavigate();
  return (
    <div id="body0">
  <div className="home-container">
    <img src={logo2} alt="Logo" className="logo"/>

    <h1 className="welcome">Welcome <span className="wave">👋</span></h1>
    <p className="quote">Perfection is overrated. Persistence builds better stories.Join us and we can Learn, Teach and Build — Together....</p>
    <div className="buttons">
      <button id="guestBtn"  onClick={() => navigate("/dashboard")}>Continue as Guest</button>
      <button id="createBtn" onClick={() => navigate("/info")}>Create Account</button>
      <button id="loginBtn"  onClick={() => navigate("/login")}>Login</button>
    </div>
  </div>
  </div>
    );}
