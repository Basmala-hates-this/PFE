import React, { useRef } from "react";
import "../styles/guide.css";
import { useNavigate } from "react-router-dom";

import dash from "../photos/dash.jpg";
import join from "../photos/join.jpg";
import req from "../photos/req.jpg";
import roomChat from "../photos/roomchat.jpg";
import subj from "../photos/subj.jpg";
import profile from "../photos/profile.jpg";
import actionBtns from "../photos/actionbtns.jpg";
import edit from "../photos/edit.jpg";

export default function Guide() {
      const navigate = useNavigate();

  
  const sections = {
    overview: useRef(null),
    dashboard: useRef(null),
    rooms: useRef(null),
    actions: useRef(null),
    roles: useRef(null),
    interaction: useRef(null),
    account: useRef(null),
    navigation: useRef(null),
    quickstart: useRef(null),
    faq: useRef(null),
    contact : useRef(null),
  };

  const scrollTo = (key) => {
    sections[key].current.scrollIntoView({ behavior: "smooth" });
  };

  return (


    <div className="guide-container">
      {/* Sidebar */}
      <aside className="guide-nav">
        <h2>StudyBuddy Guide</h2>
        <ul>
          <li  style={{backgroundColor:"#0859d38d",borderColor:"#08d3d38d"}} onClick={() => navigate("/dashboard")}>← Back To Dashboard</li>
          <li onClick={() => scrollTo("overview")}>Overview</li>
          <li onClick={() => scrollTo("dashboard")}>Dashboard</li>
          <li onClick={() => scrollTo("rooms")}>Rooms</li>
          <li onClick={() => scrollTo("actions")}>Actions</li>
          <li onClick={() => scrollTo("roles")}>Roles</li>
          <li onClick={() => scrollTo("interaction")}>Interaction</li>
          <li onClick={() => scrollTo("account")}>Account</li>
          <li onClick={() => scrollTo("navigation")}>Navigation</li>
          <li onClick={() => scrollTo("quickstart")}>Quick Start</li>
          {/* <li onClick={() => scrollTo("faq")}>FAQ</li> */}
           <li onClick={() => scrollTo("contact")}>Contact Us</li>
        </ul>
      </aside>

      {/* Content */}
      <main className="guide-content">

        {/* Overview */}
        <section ref={sections.overview}>
          <h1>Overview</h1>
          <p>StudyBuddy is a platform designed to organize discussions, track actions, and manage structured interactions inside purpose specific rooms.</p>
          <ul>
            <li>Create or join rooms</li>
            <li>Participate in discussions</li>
            <li>Track actions and decisions</li>
            <li>Interact with users</li>
          </ul>
        </section>

        {/* Dashboard */}
        <section ref={sections.dashboard}>
          <h1>Dashboard</h1>
          <p>Your main control center. Use it to navigate across StudyBuddy.</p>
          <ol>
            <li>Use sidebar for navigation and quick actions</li>
            <li>Select a feature</li>
            <li>Interact with content</li>
          </ol>
          <img src={dash} alt="Dashboard" />

          

        </section>
          {/* Actions */}
        <section ref={sections.actions}>
          <h1>Stat Cards</h1>
          <p>Stat cards track events and decisions inside the platform.could be accessed from the profile.</p>
          <ul>
            <li>View history</li>
            <li>Track user activity</li>
            <li>Understand changes</li>
          </ul>
          <img src={profile} alt="Profile" />
          <p>Clicking on the stat cards will show you the details of the action and the related discussion.</p>

          <p>another useful thing is the action sidebar</p>
          <img src={actionBtns} alt="sidebar" />
         


        </section>


        {/* Rooms */}
        <section ref={sections.rooms}>
          <h1>Rooms</h1>
          <p>Rooms are spaces where discussions happen.</p>
          <ul>
            <li>Join or leave rooms</li>
            <li>Request Some Rooms</li>
            <li>Start or participate in discussions</li>
            <li>View related actions</li>
          </ul>
          
          <img src={join} alt="Join Room" />
          <img src={req} alt="Request Room" />
          <img src={roomChat} alt="Room Chat" />
          <img src={subj} alt="Subject Room" />
        </section>

      
        {/* Roles */}
        <section ref={sections.roles}>
          <h1>Roles & Permissions</h1>
          <p>Roles define what users can do.</p>
          <ul>
            <li>User</li>
            <li>Admin</li>
            <li>SupperAdmin</li>
          </ul>
        </section>

        {/* Interaction */}
        <section ref={sections.interaction}>
          <h1>User Interaction</h1>
          <p>Users interact through discussions and actions.</p>
          <p>Engage in discussions, make decisions, and track outcomes.
            <p>try posting,commenting,voting,searching</p>
          </p>
        </section>

        {/* Account */}
        <section ref={sections.account}>
          <h1> Edit Account</h1>
          <p>Edit your profile and personalize your identity in this platform.</p>
          <img src={edit} alt="edit" />
        </section>

        {/* Navigation */}
        <section ref={sections.navigation}>
          <h1>Navigation Tips</h1>
          <ul>
            <li>Use sidebar navigation</li>
            <li>Return to dashboard if lost</li>
            <li>Use this guide anytime</li>
          </ul>
        </section>

        {/* Quick Start */}
        <section ref={sections.quickstart}>
          <h1>Quick Start</h1>
          <ol>
            <li>Open Dashboard</li>
            <li>Go to Rooms</li>
            <li>Join a Room</li>
            <li>Start interacting</li>
          </ol>
        </section>

     
        {/* <section ref={sections.faq}>
          <h1>FAQ</h1>
          <p><strong>I'm lost</strong> → Go to Dashboard</p>
          <p><strong>Where is history?</strong> → Actions</p>
          <p><strong>Why can't I do something?</strong> → Role restrictions</p>
        </section> */}
        <section ref={sections.contact}> <h1>Contact Us</h1>
          <p><strong>Study Buddy mail:</strong><a className="mail" href="mailto:studdybuddy1403@gmail.com">studdybuddy1403@gmail.com</a></p>
          <p><strong>SupperAdmin 1:</strong>   <a className="mail" href="mailto:laoaribasmala75@gmail.com">laoaribasmala75@gmail.com</a></p>
          <p><strong>SupperAdmin 2:</strong>   <a className="mail" href="mailto:sarahbennoura87@gmail.com">sarahbennoura87@gmail.com</a></p>

        </section>

      </main>
    </div>
  );
}