// import { useEffect, useState, useRef } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import axios from "axios";
// import Cat from "../photos/Cat.jpg";
//  import { useTranslation } from 'react-i18next';
// import i18n from '../i18n/index.js';

// export default function RoomChat() {
//   const { roomId } = useParams();
//   const navigate = useNavigate();
//   const token = localStorage.getItem("token");
//   const currentUser = JSON.parse(localStorage.getItem("currentUser"));

//   const [room, setRoom] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState("");
//   const [attachment, setAttachment] = useState(null);
//   const [replyTo, setReplyTo] = useState(null);
//   const [editingMessage, setEditingMessage] = useState(null);
//   const [editContent, setEditContent] = useState("");
//   const [isAdmin, setIsAdmin] = useState(false);
//   const messagesEndRef = useRef(null);

//   const [showMembers, setShowMembers] = useState(false); 

//   //names better then ids....
//   const [memberDetails, setMemberDetails] = useState([]);

//   const isImage = (fileUrl) => {
//   return /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);
// };

// const { t } = useTranslation();

//   ////////////////////////////////////////////////////////////////////////
//   ///////////////////////////////////////////////////////////////////////////////////
//   ///////////////////////////////////////////////////////////////////////
//   // fetch room details
// useEffect(() => {
//   const fetchRoom = async () => {
//     try {
//       const response = await axios.get(`http://localhost:5000/api/rooms/${roomId}`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       setRoom(response.data);
//       setIsAdmin(response.data.admins?.includes(currentUser?.id));
//     } catch (err) {
//       console.error("Failed to fetch room:", err);
//       navigate("/profile");
//     }
//   };
//   fetchRoom();
// }, [roomId]);

// // fetch messages + polling
// useEffect(() => {
//   const fetchMessages = async () => {
//     try {
//       const response = await axios.get(`http://localhost:5000/api/rooms/${roomId}/messages`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       setMessages(response.data);
//     } catch (err) {
//       console.error("Failed to fetch messages:", err);
//     }
//   };

//   fetchMessages();
//   const interval = setInterval(fetchMessages, 1500);//i dont know why...2 requests per second might get a little too much for the server to handel?
//   return () => clearInterval(interval);
// }, [roomId]);

// // scroll to bottom when new messages arrive
// useEffect(() => {
//   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });//u've bin hit by..u've been struck by..a smooth....i lost it...not even a fan of mj...
// }, [messages]);



// useEffect(() => {
//   if (!room?.members) return;
//   const fetchMembers = async () => {
//     try {
//       const response = await axios.get(
//         `http://localhost:5000/api/rooms/${roomId}/members`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setMemberDetails(response.data);
//     } catch (err) {
//       console.error("Failed to fetch members:", err);
//     }
//   };
//   fetchMembers();
// }, [room]);

// //////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////

// const handleSendMessage = async () => {
//   if (!newMessage.trim() && !attachment) return;
//    if (attachment && attachment.size > 20 * 1024 * 1024) {
//     return alert(t("roomChat.fileTooLarge"));
//   }
//   try {
//     const formData = new FormData();
//     if (newMessage.trim()) formData.append("content", newMessage);
//     if (attachment) formData.append("attachment", attachment);
//     if (replyTo) formData.append("replyTo", replyTo.id);

//     await axios.post(
//       `http://localhost:5000/api/rooms/${roomId}/messages`,
//       formData,
//       { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
//     );
//     setNewMessage("");
//     setAttachment(null);
//     setReplyTo(null);
//   } catch (err) {
//     console.error("Failed to send message:", err);
//   }
// };

// const handleDeleteMessage = async (messageId) => {
//   try {
//     await axios.delete(`http://localhost:5000/api/rooms/messages/${messageId}`, {
//       headers: { Authorization: `Bearer ${token}` }
//     });
//     setMessages(prev => prev.filter(m => m.id !== messageId));
//   } catch (err) {
//     console.error("Failed to delete message:", err);
//   }
// };

// const handleEditMessage = async (messageId) => {
//   try {
//     const response = await axios.patch(
//       `http://localhost:5000/api/rooms/messages/${messageId}`,
//       { content: editContent },
//       { headers: { Authorization: `Bearer ${token}` } }
//     );
//     setMessages(prev => prev.map(m => m.id === messageId ? response.data : m));
//     setEditingMessage(null);
//     setEditContent("");
//   } catch (err) {
//     console.error("Failed to edit message:", err);
//   }
// };


// const handleLeaveRoom = async () => {
//   const confirm = window.confirm(t("roomChat.leaveConfirm"));
//   if (!confirm) return;

//   try {
//     await axios.delete(`http://localhost:5000/api/rooms/${roomId}/leave`, {
//       headers: { Authorization: `Bearer ${token}` }
//     });
//     navigate("/profile");
//   } catch (err) {
//     alert(err.response?.data?.message || "Something went wrong.");
//   }
// };

// /////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////////////////////////////
// ////////////////////////////////////////////////////////////////////////
// //i dont want another style shhet nor another fight with other pages style...inline that is..if anything else..i'll add it as object here

//   return (
//     <div>
     
//   <div style={{display:"flex", flexDirection:"column", height:"100vh", background:"#1a1f35"}}>
    
//     {/* header */}
//     <div style={{padding:"15px 20px", background:"#252b45", display:"flex", alignItems:"center", gap:"15px", borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
//       <button onClick={() => navigate("/profile")} style={{background:"none", border:"none", color:"white", fontSize:"20px", cursor:"pointer"}}>←</button>
//       <div>
//         <h2 style={{margin:0, color:"white"}}>#{room?.name}</h2>
//         <small style={{color:"rgba(255,255,255,0.5)"}}>{`${room?.members?.length} ${t("roomChat.members")}`}</small>
//       </div>
//       <button
//     onClick={handleLeaveRoom}
//     style={{padding:"6px 12px", borderRadius:"6px", cursor:"pointer",marginLeft:"55%", color:"red"}}>
//     {t("roomChat.leaveRoom")}
//   </button>
//       {isAdmin && (
//         <div style={{marginLeft:"auto", display:"flex", gap:"10px"}}>
//              <button 
//                  onClick={() => setShowMembers(true)}
//                  style={{padding:"6px 12px", borderRadius:"6px", cursor:"pointer"}}>
//                  {t("roomChat.membersBtn")}
//              </button>
//           <button onClick={() => {
//             const newName = prompt(t("roomChat.renamePrompt"));
//             if (newName) {
//               axios.patch(`http://localhost:5000/api/rooms/private/${roomId}/rename`,
//                 { name: newName },
//                 { headers: { Authorization: `Bearer ${token}` } }
//               ).then(() => setRoom(prev => ({...prev, name: newName})));
//             }
//           }} style={{padding:"6px 12px", borderRadius:"6px", cursor:"pointer"}}>{t("roomChat.rename")}</button>
//           <button onClick={() => 
//           {
//             if (window.confirm(t("roomChat.deleteRoomConfirm"))) {
//               axios.delete(`http://localhost:5000/api/rooms/private/${roomId}`,
//                 { headers: { Authorization: `Bearer ${token}` } }
//               ).then(() => navigate("/profile"));
//             }
//           }} style={{padding:"6px 12px", borderRadius:"6px", cursor:"pointer", color:"red"}}>{t("roomChat.deleteRoom")}</button>
//         </div>
//       )}
//     </div>

//     {/* messages */}
//     <div style={{flex:1, overflowY:"auto", padding:"20px", display:"flex", flexDirection:"column", gap:"10px"}}>
//       {messages.length === 0 ? (
//         <p style={{color:"rgba(255,255,255,0.4)", textAlign:"center"}}>{t("roomChat.noMessages")}</p>
//       ) : (
//         messages.map(msg => (
//           <div key={msg.id} style={{display:"flex", flexDirection:"column", alignItems: msg.senderId === currentUser?.id ? "flex-end" : "flex-start"}}>
            
//             {/* reply preview */}
           
//             {msg.replyTo && (
//                 <div style={{fontSize:"11px", color:"rgba(255,255,255,0.4)", marginBottom:"4px", padding:"4px 8px", background:"rgba(255,255,255,0.05)", borderRadius:"6px", maxWidth:"60%"}}>
//                      ↩ {messages.find(m => m.id === msg.replyTo)?.authorUsername 
//                      ? `@${messages.find(m => m.id === msg.replyTo).authorUsername}: ${messages.find(m => m.id === msg.replyTo).content?.slice(0, 50)}...`
//                      : t("roomChat.replyingToDeleted")}
//                 </div>
//             )}

//             <div style={{maxWidth:"60%", padding:"10px 14px", borderRadius:"12px", background:  msg.senderId  === currentUser?.id ? "#6476af" : "#2d3350"}}>
//               <small style={{opacity:0.7, fontSize:"11px"}}>@{msg.authorUsername}</small>
              
//               {editingMessage?.id === msg.id ? (
//                 <div>
//                   <input
//                     value={editContent}
//                     onChange={(e) => setEditContent(e.target.value)}
//                     style={{width:"100%", padding:"4px", borderRadius:"4px", marginTop:"4px"}}
//                   />
//                   <div style={{display:"flex", gap:"6px", marginTop:"6px"}}>
//                     <button onClick={() => handleEditMessage(msg.id)} style={{fontSize:"11px", padding:"2px 8px", borderRadius:"4px"}}>{t("roomChat.save")}</button>
//                     <button onClick={() => setEditingMessage(null)} style={{fontSize:"11px", padding:"2px 8px", borderRadius:"4px"}}>{t("roomChat.cancel")}</button>
//                   </div>
//                 </div>
//               ) : (
//                 <p style={{margin:"4px 0 0", color:"white"}}>{msg.content}</p>
//               )}

//               {/* {msg.attachment && (
//                 <img src={msg.attachment} alt="attachment" style={{maxWidth:"200px", borderRadius:"8px", marginTop:"6px"}}/>
//               )} */}
//               {msg.attachment && (
//   isImage(msg.attachment) ? (
//     <img
//       src={msg.attachment}
//       alt="attachment"
//       style={{ maxWidth: "200px", borderRadius: "8px", marginTop: "6px" }}
//     />
//   ) : (
//     <a
//       href={msg.attachment}
//       target="_blank"
//       rel="noopener noreferrer"
//       style={{
//         display: "inline-block",
//         marginTop: "6px",
//         padding: "6px 10px",
//         background: "rgba(255,255,255,0.1)",
//         borderRadius: "6px",
//         color: "white",
//         textDecoration: "none",
//         fontSize: "12px"
//       }}
//     >
//       {t("roomChat.openFile")}
//     </a>
//   )
// )}

//               <small style={{opacity:0.5, fontSize:"10px"}}>{new Date(msg.createdAt).toLocaleTimeString()}</small>
//               {msg.isEdited && <small style={{opacity:0.4, fontSize:"10px"}}> {t("roomChat.edited")}</small>}
//             </div>

//             {/* message actions */}
//             <div style={{display:"flex", gap:"6px", marginTop:"4px"}}>
//               <button onClick={() => setReplyTo(msg)} style={{fontSize:"10px", background:"none", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer"}}>{t("roomChat.reply")}</button>
//               {msg.senderId=== currentUser?.id && (
//                 <>
//                   <button onClick={() => { setEditingMessage(msg); setEditContent(msg.content); }} style={{fontSize:"10px", background:"none", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer"}}>{t("roomChat.edit")}</button>
//                   <button onClick={() => handleDeleteMessage(msg.id)} style={{fontSize:"10px", background:"none", border:"none", color:"#fc0c0c", cursor:"pointer"}}> {t("roomChat.delete")}</button>
                 
//                 </>
//               )}
//             </div>

//           </div>
//         ))
//       )}
//       {/* <div ref={messagesEndRef} /> ....this and smooth criminal effect at the top gave me a headach at the auto scrool*/}
//     </div>

//     {/* reply preview */}
//     {replyTo && (
//       <div style={{padding:"8px 20px", background:"rgba(255,255,255,0.05)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
//         <small style={{color:"rgba(255,255,255,0.6)"}}>{t("roomChat.replyingTo")} @{replyTo.authorUsername}: {replyTo.content?.slice(0, 50)}...</small>
//         <button onClick={() => setReplyTo(null)} style={{background:"none", border:"none", color:"white", cursor:"pointer"}}>✕</button>
//       </div>
//     )}

//     {/* input area */}
//     <div style={{padding:"15px 20px", background:"#252b45", display:"flex", gap:"10px", alignItems:"center"}}>
//       <input
//         type="file"
//         id="attachmentInput"
//         // accept="image/*"
//         accept="image/*,.pdf,.doc,.docx,.txt,.zip"
//         style={{display:"none"}}
//         onChange={(e) => setAttachment(e.target.files[0])}
//       />
//       <button onClick={() => document.getElementById("attachmentInput").click()} style={{background:"none", border:"none", fontSize:"20px", cursor:"pointer"}}>📎</button>
//       {attachment && <small style={{color:"rgba(255,255,255,0.5)"}}>{attachment.name}</small>}
//       <input
//         type="text"
//         value={newMessage}
//         onChange={(e) => setNewMessage(e.target.value)}
//         onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
//         placeholder={t("roomChat.placeholder")}
//         style={{flex:1, padding:"10px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.1)", color:"white"}}
//       />
//       <button onClick={handleSendMessage} style={{padding:"10px 20px", borderRadius:"8px", background:"#6476af", border:"none", color:"white", cursor:"pointer"}}>{t("roomChat.send")}</button>
//     </div>

//   </div>


// {showMembers && (
//   <div className="modal-overlay" onClick={() => setShowMembers(false)}>
//     <div className="modal" onClick={(e) => e.stopPropagation()}>
      
//       <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"15px"}}>
//         <h3 style={{margin:0}}>{`${t("roomChat.membersTitle")} (${room?.members?.length})`}</h3>
//         <button onClick={() => setShowMembers(false)} style={{background:"none", border:"none", fontSize:"20px", cursor:"pointer"}}>✕</button>
//       </div>

//       {memberDetails.map(member => (
//   <div key={member.id} style={{padding:"10px", borderBottom:"1px solid rgba(255,255,255,0.1)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
//     <div style={{display:"flex", alignItems:"center", gap:"8px"}}>
//       <span>👤 @{member.username}</span>
//       {room?.admins?.includes(member.id) && (
//         <small style={{background:"gold", color:"black", padding:"2px 6px", borderRadius:"6px", fontSize:"11px"}}>{t("roomChat.admin")}</small>
//       )}
//     </div>
//     {!room?.admins?.includes(member.id) && member.id !== currentUser?.id && (
//       <button
//         onClick={() => {
//           if (window.confirm(t("roomChat.makeAdminConfirm", { username: member.username }))) {
//             axios.patch(
//               `http://localhost:5000/api/rooms/private/${roomId}/admin/${member.id}`,
//               {},
//               { headers: { Authorization: `Bearer ${token}` } }
//             ).then(() => {
//                   axios.get(`http://localhost:5000/api/rooms/${roomId}`, {
//                   headers: { Authorization: `Bearer ${token}` }
//                }).then(r => setRoom(r.data));
//                      axios.get(`http://localhost:5000/api/rooms/${roomId}/members`, {
//                       headers: { Authorization: `Bearer ${token}` }
//                      }).then(r => setMemberDetails(r.data));
//                    alert(t("roomChat.makeAdminSuccess", { username: member.username }));
//                 }).catch(err => alert(err.response?.data?.message || "Something went wrong."));
//                }
//         }}
//         style={{padding:"4px 10px", borderRadius:"6px", background:"gold", border:"none", color:"black", cursor:"pointer", fontSize:"12px"}}
//       >
//         {t("roomChat.makeAdmin")}
//       </button>
//     )}
//   </div>
// ))}

//     </div>
//   </div>
// )}



//     </div>
//   );
// }

import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Cat from "../photos/Cat.jpg";
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/index.js';
import "../styles/chat.css"; // Import the CSS file

export default function RoomChat() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const messagesEndRef = useRef(null);

  const [showMembers, setShowMembers] = useState(false); 

  //names better then ids....
  const [memberDetails, setMemberDetails] = useState([]);

  const isImage = (fileUrl) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);
  };

  const { t } = useTranslation();

  ////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////
  // fetch room details
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/rooms/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRoom(response.data);
        setIsAdmin(response.data.admins?.includes(currentUser?.id));
      } catch (err) {
        console.error("Failed to fetch room:", err);
        navigate("/profile");
      }
    };
    fetchRoom();
  }, [roomId]);

  // fetch messages + polling
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/rooms/${roomId}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(response.data);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 1500);//i dont know why...2 requests per second might get a little too much for the server to handel?
    return () => clearInterval(interval);
  }, [roomId]);

  // scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });//u've bin hit by..u've been struck by..a smooth....i lost it...not even a fan of mj...
  }, [messages]);



  useEffect(() => {
    if (!room?.members) return;
    const fetchMembers = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/rooms/${roomId}/members`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMemberDetails(response.data);
      } catch (err) {
        console.error("Failed to fetch members:", err);
      }
    };
    fetchMembers();
  }, [room]);

  //////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !attachment) return;
    if (attachment && attachment.size > 20 * 1024 * 1024) {
      return alert(t("roomChat.fileTooLarge"));
    }
    try {
      const formData = new FormData();
      if (newMessage.trim()) formData.append("content", newMessage);
      if (attachment) formData.append("attachment", attachment);
      if (replyTo) formData.append("replyTo", replyTo.id);

      await axios.post(
        `http://localhost:5000/api/rooms/${roomId}/messages`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );
      setNewMessage("");
      setAttachment(null);
      setReplyTo(null);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await axios.delete(`http://localhost:5000/api/rooms/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  const handleEditMessage = async (messageId) => {
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/rooms/messages/${messageId}`,
        { content: editContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => prev.map(m => m.id === messageId ? response.data : m));
      setEditingMessage(null);
      setEditContent("");
    } catch (err) {
      console.error("Failed to edit message:", err);
    }
  };


  const handleLeaveRoom = async () => {
    const confirm = window.confirm(t("roomChat.leaveConfirm"));
    if (!confirm) return;

    try {
      await axios.delete(`http://localhost:5000/api/rooms/${roomId}/leave`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate("/profile");
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
    }
  };

  /////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////
  //i dont want another style sheEt nor another fight with other pages style...inline that is..if anything else..i'll add it as object here

  return (
    <div className="roomchat-container">
      
      {/* header */}
      <div className="roomchat-header">
        <button onClick={() => navigate("/dashboard")} className="roomchat-back-button">←</button>
        <div>
          <h2 className="roomchat-room-name">#{room?.name}</h2>
          <small className="roomchat-room-stats">{`${room?.members?.length} ${t("roomChat.members")}`}</small>
        </div>
        <button
          onClick={handleLeaveRoom}
          className="roomchat-leave-button">
          {t("roomChat.leaveRoom")}
        </button>
        {isAdmin && (
          <div className="roomchat-admin-actions">
            <button 
              onClick={() => setShowMembers(true)}
              className="roomchat-admin-button">
              {t("roomChat.membersBtn")}
            </button>
            <button onClick={() => {
              const newName = prompt(t("roomChat.renamePrompt"));
              if (newName) {
                axios.patch(`http://localhost:5000/api/rooms/private/${roomId}/rename`,
                  { name: newName },
                  { headers: { Authorization: `Bearer ${token}` } }
                ).then(() => setRoom(prev => ({...prev, name: newName})));
              }
            }} className="roomchat-admin-button">{t("roomChat.rename")}</button>
            <button onClick={() => 
              {
                if (window.confirm(t("roomChat.deleteRoomConfirm"))) {
                  axios.delete(`http://localhost:5000/api/rooms/private/${roomId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                  ).then(() => navigate("/profile"));
                }
              }} className="roomchat-admin-button-danger">{t("roomChat.deleteRoom")}</button>
          </div>
        )}
      </div>

      {/* messages */}
      <div className="roomchat-messages-area">
        {messages.length === 0 ? (
          <p className="roomchat-no-messages">{t("roomChat.noMessages")}</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`roomchat-message-wrapper ${msg.senderId === currentUser?.id ? "roomchat-message-right" : "roomchat-message-left"}`}>
              
              {/* reply preview */}
              {msg.replyTo && (
                <div className="roomchat-reply-preview">
                  ↩ {messages.find(m => m.id === msg.replyTo)?.authorUsername 
                    ? `@${messages.find(m => m.id === msg.replyTo).authorUsername}: ${messages.find(m => m.id === msg.replyTo).content?.slice(0, 50)}...`
                    : t("roomChat.replyingToDeleted")}
                </div>
              )}

              <div className={`roomchat-message-bubble ${msg.senderId === currentUser?.id ? "roomchat-message-bubble-right" : "roomchat-message-bubble-left"}`}>
                <small className="roomchat-message-author">@{msg.authorUsername}</small>
                
                {editingMessage?.id === msg.id ? (
                  <div>
                    <input
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="roomchat-edit-input"
                    />
                    <div className="roomchat-edit-actions">
                      <button onClick={() => handleEditMessage(msg.id)} className="roomchat-edit-save">{t("roomChat.save")}</button>
                      <button onClick={() => setEditingMessage(null)} className="roomchat-edit-cancel">{t("roomChat.cancel")}</button>
                    </div>
                  </div>
                ) : (
                  <p className="roomchat-message-content">{msg.content}</p>
                )}

                {msg.attachment && (
                  isImage(msg.attachment) ? (
                    <img
                      src={msg.attachment}
                      alt="attachment"
                      className="roomchat-message-attachment"
                    />
                  ) : (
                    <a
                      href={msg.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="roomchat-message-file-link"
                    >
                      {t("roomChat.openFile")}
                    </a>
                  )
                )}

                <small className="roomchat-message-timestamp">{new Date(msg.createdAt).toLocaleTimeString()}</small>
                {msg.isEdited && <small className="roomchat-message-edited"> {t("roomChat.edited")}</small>}
              </div>

              {/* message actions */}
              <div className="roomchat-message-actions">
                <button onClick={() => setReplyTo(msg)} className="roomchat-action-button">{t("roomChat.reply")}</button>
                {msg.senderId === currentUser?.id && (
                  <>
                    <button onClick={() => { setEditingMessage(msg); setEditContent(msg.content); }} className="roomchat-action-button">{t("roomChat.edit")}</button>
                    <button onClick={() => handleDeleteMessage(msg.id)} className="roomchat-action-button-danger"> {t("roomChat.delete")}</button>
                  </>
                )}
              </div>

            </div>
          ))
        )}
        {/* <div ref={messagesEndRef} /> ....this and smooth criminal effect at the top gave me a headach at the auto scrool*/}
      </div>

      {/* reply preview */}
      {replyTo && (
        <div className="roomchat-reply-bar">
          <small className="roomchat-reply-text">{t("roomChat.replyingTo")} @{replyTo.authorUsername}: {replyTo.content?.slice(0, 50)}...</small>
          <button onClick={() => setReplyTo(null)} className="roomchat-reply-close">✕</button>
        </div>
      )}

      {/* input area */}
      <div className="roomchat-input-area">
        <input
          type="file"
          id="attachmentInput"
          accept="image/*,.pdf,.doc,.docx,.txt,.zip"
          className="roomchat-file-input"
          onChange={(e) => setAttachment(e.target.files[0])}
        />
        <button onClick={() => document.getElementById("attachmentInput").click()} className="roomchat-attach-button">📎</button>
        {attachment && <small className="roomchat-attachment-name">{attachment.name}</small>}
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder={t("roomChat.placeholder")}
          className="roomchat-message-input"
        />
        <button onClick={handleSendMessage} className="roomchat-send-button">{t("roomChat.send")}</button>
      </div>
       {showMembers && (
    <div className="roomchat-modal-overlay" onClick={() => setShowMembers(false)}>
      <div className="roomchat-modal" onClick={(e) => e.stopPropagation()}>
        
        <div className="roomchat-modal-header">
          <h3 className="roomchat-modal-title">{`${t("roomChat.membersTitle")} (${room?.members?.length})`}</h3>
          <button onClick={() => setShowMembers(false)} className="roomchat-modal-close">✕</button>
        </div>

        {memberDetails.map(member => (
          <div key={member.id} className="roomchat-member-item">
            <div className="roomchat-member-info">
              <span className="roomchat-member-avatar">👤</span>
              <span className="roomchat-member-username">@{member.username}</span>
              {room?.admins?.includes(member.id) && (
                <small className="roomchat-admin-badge">{t("roomChat.admin")}</small>
              )}
            </div>
            {!room?.admins?.includes(member.id) && member.id !== currentUser?.id && (
              <button
                onClick={() => {
                  if (window.confirm(t("roomChat.makeAdminConfirm", { username: member.username }))) {
                    axios.patch(
                      `http://localhost:5000/api/rooms/private/${roomId}/admin/${member.id}`,
                      {},
                      { headers: { Authorization: `Bearer ${token}` } }
                    ).then(() => {
                      axios.get(`http://localhost:5000/api/rooms/${roomId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                      }).then(r => setRoom(r.data));
                      axios.get(`http://localhost:5000/api/rooms/${roomId}/members`, {
                        headers: { Authorization: `Bearer ${token}` }
                      }).then(r => setMemberDetails(r.data));
                      alert(t("roomChat.makeAdminSuccess", { username: member.username }));
                    }).catch(err => alert(err.response?.data?.message || "Something went wrong."));
                  }
                }}
                className="roomchat-make-admin-button"
              >
                {t("roomChat.makeAdmin")}
              </button>
            )}
          </div>
        ))}

       </div>
 </div>
 )}

    </div>
  );

 


  }

