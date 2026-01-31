import "../styles/fin.css"
// import "../scripts/confetti.js"
import confetti from "canvas-confetti";
export default function Fin() {
    
  const handleConfetti = () => {
    confetti({
      particleCount: 1100,
      spread: 200,
      origin: { y: 0.7 }
    });
  };
  return (
    <div className="fin-page" id="body3">
     <h1 id="finH1">You Have Successfully Created An Account!!✔️</h1>
    <br/><br/>
    <h3 id="finH3">Thank You For Your Registration!</h3>
    <br/><br/>
    <div id="links">
        <a href="dashboard2.1.jsx" className="fixing">🗂️Go To The Dashboard</a>
        
        <a  href="info.jsx" className="fixing">🏠back to home Page</a>

            {/* <!-- <a href="register.html" className="fixing">🧾back to regestration Page</a> --> */}
             
        <a href="login.jsx" className="fixing">🔑back To Login Page</a>
        <button  id="con" className="fixing" onClick={handleConfetti}>🎉 Celebrate Again</button> 
        {/* <a href="javascript:void(0)" onClick={handleConfetti}> 🎉 Celebrate Again </a> */}
        
    
    </div>
    
    </div>
  );
}