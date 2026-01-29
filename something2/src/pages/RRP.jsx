import "../styles/RRP.css";

export default function RRP() {
  return (
    <div className="RRP" id="body4">  
        <form action="resetPassword.html" method="post" id="reset-form">
        <fieldset id="field5">
            <h2> Request To Reset Your Password 🔒</h2>
            <br/><br/>
            <label htmlFor="reset-email" className="email">Enter Your Registered Email:</label>
            <br/>
            <input type="email" id="reset-email" name="reset-email" placeholder="something@something.something" required />
            <br/><br/>
            <button type="submit" id="btn4">Send Reset Link</button>
            <br/><br/>
            <div id="forgotlinks">
               <a href="login.html">Back To Login </a>
               <br/><br/>
                <a href="index.html">Create A New Account</a>
           </div>
        </fieldset>
        
    </form>
    </div>
  );
}
