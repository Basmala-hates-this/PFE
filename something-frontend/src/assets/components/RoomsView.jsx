// src/assets/components/RoomsView.jsx
import React, { useState } from "react";
import axios from "axios";
import "../../styles/pallette.css";
import "../../styles/roomv.css";



export default function RoomsView({ 
  userRooms, 
  setUserRooms,
  subjectRoomsData, 
  subjectRoomsLoading, 
  fetchSubjectRooms, 
  handleJoinSubjectRoom, 
  handleCreateAndJoinSubjectRoom, 
  handleLeaveSubjectRoom, 
  handleRequestSubjectRoom, 
  requestMajor, 
  setRequestMajor, 
  requestSubject, 
  setRequestSubject, 
  requestFeedback, 
  requestLoading,
  t 
}) {
  const [activeSubTab, setActiveSubTab] = useState("my-rooms");
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomPassKey, setRoomPassKey] = useState("");
  const [useGeneratedKey, setUseGeneratedKey] = useState(true);
  const [roomFeedback, setRoomFeedback] = useState("");
  const [roomLoading, setRoomLoading] = useState(false);
  const [joinPassKey, setJoinPassKey] = useState("");
  const [joinFeedback, setJoinFeedback] = useState("");
  
  // New state for search and filter
  const [roomSearchQuery, setRoomSearchQuery] = useState("");
  const [selectedMajorFilter, setSelectedMajorFilter] = useState("all");

  const privateRooms = userRooms.filter(r => r.type === "private");
  const otherRooms = userRooms.filter(r => r.type !== "private");

  // Get unique majors for filter dropdown
  const uniqueMajors = [...new Set(subjectRoomsData.map(item => item.major))];

  // Filter subject rooms data based on search and major filter
  const filteredSubjectRooms = subjectRoomsData
    .map(majorGroup => {
      // First filter by major if selected
      if (selectedMajorFilter !== "all" && majorGroup.major !== selectedMajorFilter) {
        return null;
      }
      
      // Filter rooms by search query
      const filteredRooms = majorGroup.rooms.filter(room =>
        room.name.toLowerCase().includes(roomSearchQuery.toLowerCase())
      );
      
      // Filter available subjects by search query
      const filteredAvailable = majorGroup.available.filter(subject =>
        subject.toLowerCase().includes(roomSearchQuery.toLowerCase())
      );
      
      // Only return the major group if it has matching rooms or available subjects
      if (filteredRooms.length === 0 && filteredAvailable.length === 0 && roomSearchQuery !== "") {
        return null;
      }
      
      return {
        ...majorGroup,
        rooms: filteredRooms,
        available: filteredAvailable
      };
    })
    .filter(group => group !== null);

  const handleCreatePrivateRoom = async () => {
    setRoomLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post("http://localhost:5000/api/rooms/private", {
        name: roomName, 
        passKey: useGeneratedKey ? null : roomPassKey, 
        invitedUsers: []
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setRoomFeedback(`Room created! Passkey: ${response.data.passKey}`);
      
      const roomsRes = await axios.get("http://localhost:5000/api/rooms/my-rooms", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (setUserRooms) setUserRooms(roomsRes.data);
      
      setTimeout(() => setShowCreateRoom(false), 2000);
    } catch (err) {
      setRoomFeedback(err.response?.data?.message || "Error");
    } finally {
      setRoomLoading(false);
    }
  };

  const handleJoinPrivateRoom = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post("http://localhost:5000/api/rooms/private/join", 
        { passKey: joinPassKey }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJoinFeedback(response.data.message);
      
      const roomsRes = await axios.get("http://localhost:5000/api/rooms/my-rooms", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (setUserRooms) setUserRooms(roomsRes.data);
      
      setTimeout(() => setShowJoinRoom(false), 2000);
    } catch (err) {
      setJoinFeedback(err.response?.data?.message || "Error");
    }
  };

  return (
    <div className="rooms-view">
      {/* Sub-tabs */}
      <div className="rooms-subtabs">
        <button 
          className={`subtab ${activeSubTab === "my-rooms" ? "active" : ""}`} 
          onClick={() => setActiveSubTab("my-rooms")}
        >
          📁 {t?.('dashboard.rooms.myRooms') || "My Rooms"}
        </button>
        <button 
          className={`subtab ${activeSubTab === "browse" ? "active" : ""}`} 
          onClick={() => { setActiveSubTab("browse"); fetchSubjectRooms(); }}
        >
          🔍 {t?.('dashboard.rooms.browse') || "Browse Rooms"}
        </button>
      </div>

      {/* MY ROOMS TAB */}
      {activeSubTab === "my-rooms" && (
        <div className="my-rooms-content">
          <div className="rooms-actions-bar" style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
            <button 
              onClick={() => setShowCreateRoom(true)} 
              className="create-room-btn" 
              style={{ padding: "10px 20px", background: "#6476af", border: "none", borderRadius: "8px", color: "white", cursor: "pointer" }}
            >
              + {t?.('profile.sidebar.createRoom') || "Create Private Room"}
            </button>
            <button 
              onClick={() => setShowJoinRoom(true)} 
              className="join-room-btn" 
              style={{ padding: "10px 20px", background: "rgba(100,118,175,0.3)", border: "1px solid #6476af", borderRadius: "8px", cursor: "pointer" }}
            >
              🔑 {t?.('profile.sidebar.joinRoom') || "Join Private Room"}
            </button>
          </div>

          {userRooms.length === 0 ? (
            <p className="empty-rooms" style={{ textAlign: "center", opacity: 0.6, padding: "40px" }}>
              {t?.('profile.myRoomsModal.noRooms') || "You haven't joined any rooms yet. Browse rooms to get started!"}
            </p>
          ) : (
            <>
              {otherRooms.length > 0 && (
                <div className="rooms-section">
                  <h3 style={{ marginBottom: "12px", fontSize: "1rem", color: "var(--accent)" }}>
                     {t?.('dashboard.rooms.joinedRooms') || "Your Rooms"}
                  </h3>
                  {otherRooms.map(room => (
                    <div key={room.id} className="room-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--bg-panel)", borderRadius: "8px", marginBottom: "8px" }}>
                      <div className="room-info" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <strong>{room.name}</strong>
                        <span className="room-type-badge" style={{ background: "var(--accent)", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", color: "white" }}>{room.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {privateRooms.length > 0 && (
                <div className="rooms-section">
                  <h3 style={{ marginBottom: "12px", fontSize: "1rem", color: "var(--accent)" }}>
                    🔒 {t?.('dashboard.rooms.privateRooms') || "Private Rooms"}
                  </h3>
                  {privateRooms.map(room => (
                    <div key={room.id} className="room-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--bg-panel)", borderRadius: "8px", marginBottom: "8px" }}>
                      <div className="room-info" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <strong>{room.name}</strong>
                        <span className="room-type-badge private" style={{ background: "#c0392b", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", color: "white" }}>private</span>
                      </div>
                      <button 
                        onClick={() => window.location.href = `/rooms/${room.id}`} 
                        className="open-chat-btn" 
                        style={{ padding: "6px 12px", background: "var(--accent)", border: "none", borderRadius: "6px", color: "white", cursor: "pointer" }}
                      >
                        💬 {t?.('profile.myRoomsModal.openChat') || "Open Chat"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* BROWSE ROOMS TAB with Search and Filter */}
      {activeSubTab === "browse" && (
        <div className="browse-rooms-content">
          {/* Search and Filter Bar */}
          <div className="browse-search-bar" style={{ 
            display: "flex", 
            gap: "12px", 
            marginBottom: "24px",
            flexWrap: "wrap"
          }}>
            {/* Search Input */}
            <div style={{ flex: 2, minWidth: "200px" }}>
              <input
                type="text"
                placeholder={t?.('dashboard.browseRooms.searchPlaceholder') || "Search rooms or subjects..."}
                value={roomSearchQuery}
                onChange={(e) => setRoomSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.1)",
                  color: "var(--text-main)",
                  fontSize: "14px"
                }}
              />
            </div>
            
            {/* Major Filter Dropdown */}
            <div style={{ flex: 1, minWidth: "150px" }}>
              <select
                value={selectedMajorFilter}
                onChange={(e) => setSelectedMajorFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.1)",
                  color: "var(--text-main)",
                  fontSize: "14px",
                  cursor: "pointer"
                }}
              >
                <option value="all">{t?.('dashboard.browseRooms.allMajors') || "All Majors"}</option>
                {uniqueMajors.map(major => (
                  <option key={major} value={major}>{major}</option>
                ))}
              </select>
            </div>
            
            {/* Clear Filters Button */}
            {(roomSearchQuery || selectedMajorFilter !== "all") && (
              <button
                onClick={() => {
                  setRoomSearchQuery("");
                  setSelectedMajorFilter("all");
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  background: "rgba(100,118,175,0.3)",
                  border: "1px solid #6476af",
                  color: "var(--text-main)",
                  cursor: "pointer",
                  fontSize: "13px"
                }}
              >
                {t?.('dashboard.browseRooms.clearFilters') || "Clear Filters"}
              </button>
            )}
          </div>

          {subjectRoomsLoading ? (
            <p style={{ textAlign: "center", padding: "40px" }}>Loading available rooms...</p>
          ) : filteredSubjectRooms.length === 0 ? (
            <p style={{ textAlign: "center", opacity: 0.6, padding: "40px" }}>
              {roomSearchQuery || selectedMajorFilter !== "all" 
                ? (t?.('dashboard.browseRooms.noResults') || "No matching rooms found.")
                : (t?.('dashboard.browseRooms.noRooms') || "No subject rooms available.")}
            </p>
          ) : (
            filteredSubjectRooms.map(({ major, majorId, rooms, available }) => (
              <div key={major} className="major-section" style={{ marginBottom: "24px", padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>
                <h4 className="major-title" style={{ margin: "0 0 12px", color: "#6476af", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "6px" }}>{major}</h4>
                
                {rooms.map((room) => (
                  <div key={room.id} className="joined-room-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", marginBottom: "6px", background: "rgba(100,118,175,0.2)", borderRadius: "8px" }}>
                    <span>✓ {room.name}</span>
                    <button 
                      onClick={() => handleLeaveSubjectRoom(room.id)} 
                      className="leave-room-btn" 
                      style={{ padding: "4px 12px", background: "transparent", border: "1px solid #fc0c0c", borderRadius: "6px", color: "#fc0c0c", cursor: "pointer", fontSize: "11px" }}
                    >
                      {t?.('dashboard.browseRooms.leave') || "Leave"}
                    </button>
                  </div>
                ))}
                
                {available.map((subject) => (
                  <div key={subject} className="available-room-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", marginBottom: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                    <span>{subject}</span>
                    <button 
                      onClick={() => handleCreateAndJoinSubjectRoom(major, majorId, subject)} 
                      className="join-room-btn" 
                      style={{ padding: "4px 12px", background: "#6476af", border: "none", borderRadius: "6px", color: "white", cursor: "pointer", fontSize: "11px" }}
                    >
                      {t?.('dashboard.browseRooms.join') || "Join"}
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}

          {/* Request Subject Form */}
          <div className="request-section" style={{ marginTop: "30px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <h4 style={{ margin: "0 0 12px", opacity: 0.7, fontSize: "13px" }}>
              {t?.('dashboard.browseRooms.requestTitle') || "Can't find a subject? Request it!"}
            </h4>
            <select 
              className="major-select" 
              value={requestMajor} 
              onChange={(e) => { setRequestMajor(e.target.value); }}
              style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              <option value="">{t?.('dashboard.browseRooms.selectMajor') || "Select your major"}</option>
              {subjectRoomsData.map(({ major, majorId }) => (
                <option key={major} value={majorId}>{major}</option>
              ))}
            </select>
            <input 
              type="text" 
              placeholder={t?.('dashboard.browseRooms.subjectPlaceholder') || "Subject name (e.g., Calculus II)"} 
              value={requestSubject} 
              onChange={(e) => { setRequestSubject(e.target.value); }}
              style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}
            />
            {requestFeedback && (
              <p style={{ marginBottom: "10px", color: requestFeedback.includes("notified") ? "#27ae60" : "#e74c3c" }}>
                {requestFeedback}
              </p>
            )}
            <button 
              onClick={handleRequestSubjectRoom} 
              disabled={!requestMajor || !requestSubject.trim() || requestLoading}
              style={{ padding: "10px 20px", background: "#6476af", border: "none", borderRadius: "8px", color: "white", cursor: "pointer", opacity: !requestMajor || !requestSubject.trim() ? 0.5 : 1 }}
            >
              {requestLoading ? (t?.('dashboard.browseRooms.sending') || "Sending...") : (t?.('dashboard.browseRooms.sendRequest') || "Send Request")}
            </button>
          </div>
        </div>
      )}

      {/* Create Room Modal (same as before) */}
      {showCreateRoom && (
        <div className="modal-overlay" onClick={() => setShowCreateRoom(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h3 style={{ margin: 0 }}>{t?.('profile.createRoomModal.title') || "Create Private Room"}</h3>
              <button onClick={() => setShowCreateRoom(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>
            <input 
              type="text" 
              placeholder={t?.('profile.createRoomModal.roomNamePlaceholder') || "Room name"} 
              value={roomName} 
              onChange={e => setRoomName(e.target.value)} 
              style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px" }} 
            />
            <label style={{ display: "block", marginBottom: "10px" }}>
              <input type="checkbox" checked={useGeneratedKey} onChange={() => setUseGeneratedKey(!useGeneratedKey)} /> 
              {t?.('profile.createRoomModal.generateKey') || "Auto-generate passkey"}
            </label>
            {!useGeneratedKey && (
              <input 
                type="text" 
                placeholder={t?.('profile.createRoomModal.passKeyPlaceholder') || "Passkey (max 8 chars)"} 
                maxLength={8} 
                value={roomPassKey} 
                onChange={e => setRoomPassKey(e.target.value)} 
                style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px" }} 
              />
            )}
            {roomFeedback && <p style={{ color: roomFeedback.includes("created") ? "#27ae60" : "#e74c3c", marginBottom: "10px" }}>{roomFeedback}</p>}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowCreateRoom(false)} style={{ padding: "8px 16px", background: "#555", border: "none", borderRadius: "6px", color: "white", cursor: "pointer" }}>
                {t?.('profile.createRoomModal.cancel') || "Cancel"}
              </button>
              <button 
                onClick={handleCreatePrivateRoom} 
                disabled={!roomName.trim() || roomLoading} 
                style={{ padding: "8px 16px", background: "#6476af", border: "none", borderRadius: "6px", color: "white", cursor: "pointer" }}
              >
                {roomLoading ? (t?.('profile.createRoomModal.creating') || "Creating...") : (t?.('profile.createRoomModal.create') || "Create Room")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Room Modal (same as before) */}
      {showJoinRoom && (
        <div className="modal-overlay" onClick={() => setShowJoinRoom(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h3 style={{ margin: 0 }}>{t?.('profile.joinRoomModal.title') || "Join Private Room"}</h3>
              <button onClick={() => setShowJoinRoom(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>
            <input 
              type="text" 
              placeholder={t?.('profile.joinRoomModal.passkeyPlaceholder') || "Enter 8-character passkey"} 
              maxLength={8} 
              value={joinPassKey} 
              onChange={e => setJoinPassKey(e.target.value)} 
              style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px" }} 
            />
            {joinFeedback && <p style={{ color: joinFeedback.includes("Welcome") ? "#27ae60" : "#e74c3c", marginBottom: "10px" }}>{joinFeedback}</p>}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowJoinRoom(false)} style={{ padding: "8px 16px", background: "#555", border: "none", borderRadius: "6px", color: "white", cursor: "pointer" }}>
                {t?.('profile.joinRoomModal.cancel') || "Cancel"}
              </button>
              <button 
                onClick={handleJoinPrivateRoom} 
                disabled={joinPassKey.length !== 8} 
                style={{ padding: "8px 16px", background: "#6476af", border: "none", borderRadius: "6px", color: "white", cursor: "pointer" }}
              >
                {t?.('profile.joinRoomModal.join') || "Join Room"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}