import logo2 from "../photos/logo2.png"
 import "../styles/welcome.css"
 
export default function Welcome(){
  return (
  <div className="home-container">
    <img src={logo2} alt="Logo" className="logo"/>

    <h1 className="welcome">Welcome <span className="wave">👋</span></h1>
    <p className="quote">Perfection is overrated. Persistence builds better stories.Join us and we can Learn, Teach and Build — Together....</p>
    <div className="buttons">
      <button id="guestBtn">Continue as Guest</button>
      <button id="createBtn">Create Account</button>
      <button id="loginBtn">Login</button>
    </div>
  </div>
    );}
