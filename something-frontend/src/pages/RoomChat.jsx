import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Cat from "../photos/Cat.jpg";
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/index.js';
import "../styles/chat.css"; // Import the CSS file

import { Copy } from 'lucide-react';
import api from "../api/axios.js";

import { io } from "socket.io-client";

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
  const isVideo = (fileUrl) => {
  return /\.(mp4|mov|avi|mkv|webm)$/i.test(fileUrl);
};
const isAudio = (fileUrl) => {
  return /\.(webm|ogg|mp3|wav|m4a)$/i.test(fileUrl);
};

  const { t } = useTranslation();



  const [showInvite, setShowInvite] = useState(false);
const [followList, setFollowList] = useState([]);

const [isRecording, setIsRecording] = useState(false);
const [audioBlob, setAudioBlob] = useState(null);
const mediaRecorderRef = useRef(null);
const audioChunksRef = useRef([]);

  ////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////
  // fetch room details
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        // const response = await axios.get(`http://localhost:5000/api/rooms/${roomId}`, {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        const response = await api.get(`/rooms/${roomId}`);
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
  // useEffect(() => {
  //   const fetchMessages = async () => {
  //     try {
  //       // const response = await axios.get(`http://localhost:5000/api/rooms/${roomId}/messages`, {
  //       //   headers: { Authorization: `Bearer ${token}` }
  //       // });
  //       const response = await api.get(`/rooms/${roomId}/messages`);
  //       setMessages(response.data);
  //     } catch (err) {
  //       console.error("Failed to fetch messages:", err);
  //     }
  //   };

  //   fetchMessages();
  //   const interval = setInterval(fetchMessages, 1500);//i dont know why...2 requests per second might get a little too much for the server to handel?
  //   return () => clearInterval(interval);
  // }, [roomId]);
  useEffect(() => {
  // initial fetch
  const fetchMessages = async () => {
    
    try {
      const response = await api.get(`/rooms/${roomId}/messages`);
       console.log("first message:", response.data[0]);
      setMessages(response.data);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };
  fetchMessages();

  // socket connection
  const socket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:5000", {
    auth: { token: localStorage.getItem("token") }
  });

  socket.emit("join_room", roomId);

  socket.on("new_message", (message) => {
      console.log("socket received new_message:", message);
//adding a commet so i can commit and ignore the .env for front end
    setMessages(prev => [...prev, message]);
  });

  socket.on("message_deleted", (messageId) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
  });

  socket.on("message_edited", (updated) => {
    setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
  });

  return () => {
    socket.emit("leave_room", roomId);
    socket.disconnect();
  };
}, [roomId]);

  // scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });//u've bin hit by..u've been struck by..a smooth....i lost it...not even a fan of mj...
  }, [messages]);



  useEffect(() => {
    if (!room?.members) return;
    const fetchMembers = async () => {
      try {
        // const response = await axios.get(
        //   `http://localhost:5000/api/rooms/${roomId}/members`,
        //   { headers: { Authorization: `Bearer ${token}` } }
        // );
        const response = await api.get(`/rooms/${roomId}/members`);
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

  // const handleSendMessage = async () => {
  //   if (!newMessage.trim() && !attachment) return;
  //   if (attachment && attachment.size > 20 * 1024 * 1024) {
  //     return alert(t("roomChat.fileTooLarge"));
  //   }
  //   try {
  //     const formData = new FormData();
  //     if (newMessage.trim()) formData.append("content", newMessage);
  //     if (attachment) formData.append("attachment", attachment);
  //     if (replyTo) formData.append("replyTo", replyTo.id);

  //     // await axios.post(
  //     //   `http://localhost:5000/api/rooms/${roomId}/messages`,
  //     //   formData,
  //     //   { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
  //     // );
  //     await api.post(`/rooms/${roomId}/messages`, formData, { headers: { "Content-Type": "multipart/form-data" } });
  //     setNewMessage("");
  //     setAttachment(null);
  //     setReplyTo(null);
  //   } catch (err) {
  //     console.error("Failed to send message:", err);
  //   }
  // };

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

    await api.post(`/rooms/${roomId}/messages`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    setNewMessage("");
    setAttachment(null);
    setReplyTo(null);
  } catch (err) {
    console.error("Failed to send message:", err);
  }
};

  const handleDeleteMessage = async (messageId) => {
    try {
      // await axios.delete(`http://localhost:5000/api/rooms/messages/${messageId}`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      await api.delete(`/rooms/messages/${messageId}`);
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  const handleEditMessage = async (messageId) => {
    try {
      // const response = await axios.patch(
      //   `http://localhost:5000/api/rooms/messages/${messageId}`,
      //   { content: editContent },
      //   { headers: { Authorization: `Bearer ${token}` } }
      // );
      const response = await api.patch(`/rooms/messages/${messageId}`, { content: editContent });
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
      // await axios.delete(`http://localhost:5000/api/rooms/${roomId}/leave`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      await api.delete(`/rooms/${roomId}/leave`);
      navigate("/profile");
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong.");
    }
  };



// const openInvite = async () => {
//   try {
//     const [followersRes, followingRes] = await Promise.all([
//       axios.get(`http://localhost:5000/api/users/${currentUser.id}/followers`, {
//         headers: { Authorization: `Bearer ${token}` }
//       }),
//       axios.get(`http://localhost:5000/api/users/${currentUser.id}/following`, {
//         headers: { Authorization: `Bearer ${token}` }
//       })
//     ]);

//     const merged = [...followersRes.data, ...followingRes.data];
//     const unique = merged.filter((u, index, self) => 
//       index === self.findIndex(x => x.id === u.id)
//     );

//     const notYetMembers = unique.filter(
//       u => !memberDetails.some(m => m.id === u.id)
//     );

//     setFollowList(notYetMembers);
//     setShowMembers(true);  
//     setShowInvite(true);   
//   } catch (err) {
//     console.error("Failed to fetch connections:", err);
//   }
// };
const openInvite = async () => {
  try {
    // const [followersRes, followingRes] = await Promise.all([
    //   axios.get(`http://localhost:5000/api/users/${currentUser.id}/followers`, {
    //     headers: { Authorization: `Bearer ${token}` }
    //   }),
    //   axios.get(`http://localhost:5000/api/users/${currentUser.id}/following`, {
    //     headers: { Authorization: `Bearer ${token}` }
    //   })
    // ]);
    const [followersRes, followingRes] = await Promise.all([
  api.get(`/users/${currentUser.id}/followers`),
  api.get(`/users/${currentUser.id}/following`)
]);

    const merged = [...followersRes.data, ...followingRes.data];
    const unique = merged.filter((u, index, self) => 
      index === self.findIndex(x => x.id === u.id)
    );
    const notYetMembers = unique.filter(
      u => !memberDetails.some(m => m.id === u.id)
    );

    setFollowList(notYetMembers);
    setShowInvite(true); // just toggle the panel, modal is already open
  } catch (err) {
    console.error("Failed to fetch connections:", err);
  }
};

const handleInvite = async (inviteeId) => {
  try {
    // await axios.post(
    //   `http://localhost:5000/api/rooms/private/${roomId}/invite`,
    //   { userId: inviteeId },
    //   { headers: { Authorization: `Bearer ${token}` } }
    // );
    await api.post(`/rooms/private/${roomId}/invite`, { userId: inviteeId });

    // move them from invite list to member list
    const invited = followList.find(u => u.id === inviteeId);
    setMemberDetails(prev => [...prev, { ...invited, role: 'member' }]);
    setFollowList(prev => prev.filter(u => u.id !== inviteeId));
    setRoom(prev => ({ ...prev, members: { length: prev.members.length + 1 } }));
  } catch (err) {
    alert(err.response?.data?.message || "Something went wrong.");
  }
};

const handleToggleRecording = async () => {
  if (isRecording) {
    // stop
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  } else {
    // start
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop()); // release mic
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access denied.");
      console.error(err);
    }
  }
};

const handleSendAudio = async () => {
  if (!audioBlob) return;
  try {
    const formData = new FormData();
    formData.append("attachment", audioBlob, "voice-message.webm");
    await api.post(`/rooms/${roomId}/messages`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    setAudioBlob(null);
  } catch (err) {
    console.error("Failed to send audio:", err);
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
                // axios.patch(`http://localhost:5000/api/rooms/private/${roomId}/rename`,
                //   { name: newName },
                //   { headers: { Authorization: `Bearer ${token}` } }
                // )
                api.patch(`/rooms/private/${roomId}/rename`, { name: newName })
                .then(() => setRoom(prev => ({...prev, name: newName})));
              }
            }} className="roomchat-admin-button">{t("roomChat.rename")}</button>
            <button onClick={() => 
              {
                if (window.confirm(t("roomChat.deleteRoomConfirm"))) {
                  // axios.delete(`http://localhost:5000/api/rooms/private/${roomId}`,
                  //   { headers: { Authorization: `Bearer ${token}` } }
                  // )
                  api.delete(`/rooms/private/${roomId}`)
                  .then(() => navigate("/profile"));
                }
              }} className="roomchat-admin-button-danger">{t("roomChat.deleteRoom")}</button>
              {/* <button onClick={openInvite} className="roomchat-admin-button">+ Invite</button> */}
              {/* inside the modal, below the header */}
{room?.passKey && (
  <div style={{
    padding: "8px 12px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "8px",
    marginBottom: "12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  }}>
    <small style={{opacity: 0.6}}>{t("roomChat.passkey")}</small>
    <code 
    style={{
      background: "rgba(255, 255, 255, 0)",
      padding: "2px 8px",
      borderRadius: "4px",
      letterSpacing: "2px",
      color: "var(--text-main)",
      fontSize: "14px",
      fontWeight: "bold",
      userSelect: "all",
      fontFamily: '"OCR-A", "Courier New", "JetBrains Mono", "monospace"'
    }}
    >
      {room.passKey}
    </code>
    <button
      onClick={() => {
        navigator.clipboard.writeText(room.passKey);
        alert("Passkey copied!");
      }}
      className="roomchat-admin-button"
      // style={{background:"none", border:"none", cursor:"pointer", fontSize:"16px",marginLeft:"8px"}}
    >
      <Copy size={16} />
    </button>
  </div>
)}
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
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
  <img
    src={msg.profilePicUrl }
    alt="pfp"
     onError={(e) => { e.target.src = Cat; }}
    style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }}
  />
  <small className="roomchat-message-author">@{msg.authorUsername}</small>
</div>
                
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

                {/* {msg.attachment && (
                  isImage(msg.attachment) ? (
                    <img
                      src={msg.attachment}
                      alt="attachment"
                      className="roomchat-message-attachment"
                    />
                  ): isVideo(msg.attachment) ? (
    <video
      controls
      style={{ maxWidth: "200px", borderRadius: "8px", marginTop: "6px" }}
    >
      <source src={msg.attachment} />
    </video>
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
                 */}
                 {msg.attachment && (
  isImage(msg.attachment) ? (
    <img src={msg.attachment} alt="attachment" className="roomchat-message-attachment" />
  ) : isVideo(msg.attachment) ? (
    <video controls style={{ maxWidth: "200px", borderRadius: "8px", marginTop: "6px" }}>
      <source src={msg.attachment} />
    </video>
  ) : isAudio(msg.attachment) ? (
    <audio controls style={{ marginTop: "6px", maxWidth: "250px" }}>
      <source src={msg.attachment} />
    </audio>
  ) : (
    <a href={msg.attachment} target="_blank" rel="noopener noreferrer" className="roomchat-message-file-link">
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
      {/* <div className="roomchat-input-area">
        <input
          type="file"
          id="attachmentInput"
          accept="image/*,.pdf,.doc,.docx,.txt,.zip,video/*"
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
       */}
       <div className="roomchat-input-area">
  <input
    type="file"
    id="attachmentInput"
    accept="image/*,.pdf,.doc,.docx,.txt,.zip,video/*"
    className="roomchat-file-input"
    onChange={(e) => setAttachment(e.target.files[0])}
  />
  <button onClick={() => document.getElementById("attachmentInput").click()} className="roomchat-attach-button">📎</button>

  {/* mic toggle */}
  <button
    onClick={handleToggleRecording}
    className="roomchat-attach-button"
    style={{ color: isRecording ? "#e74c3c" : "inherit" }}
    title={isRecording ? "Stop recording" : "Record voice message"}
  >
    {isRecording ? "⏹️" : "🎤"}
  </button>

  {/* audio preview + send/discard */}
  {audioBlob && !isRecording && (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
      <audio controls src={URL.createObjectURL(audioBlob)} style={{ height: "32px", flex: 1 }} />
      <button onClick={handleSendAudio} className="roomchat-send-button">Send</button>
      <button onClick={() => setAudioBlob(null)} className="roomchat-action-button-danger">✕</button>
    </div>
  )}

  {/* normal text input — hidden while previewing audio */}
  {!audioBlob && (
    <>
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
    </>
  )}
</div>
       {showMembers && (
    <div className="roomchat-modal-overlay"  onClick={() => { setShowMembers(false); setShowInvite(false); }}>
      <div className="roomchat-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* <div className="roomchat-modal-header">
          <h3 className="roomchat-modal-title">{`${t("roomChat.membersTitle")} (${room?.members?.length})`}</h3>

            <button onClick={() => { setShowMembers(false); setShowInvite(false); }} className="roomchat-modal-close">✕</button>     
         </div> */}
         <div className="roomchat-modal-header">
  <h3 className="roomchat-modal-title">{`${t("roomChat.membersTitle")} (${room?.members?.length})`}</h3>
  <div style={{display:"flex", gap:"8px", alignItems:"center"}}>
    <button 
      onClick={() => {
        if (!showInvite) openInvite(); // fetch connections only when opening
        else setShowInvite(false);
      }} 
      className="roomchat-admin-button" 
      style={{fontSize:"12px"}}>
      {showInvite ? "← Back" : "+ Invite"}
    </button>
    <button onClick={() => { setShowMembers(false); setShowInvite(false); }} className="roomchat-modal-close">✕</button>
  </div>
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
  <div style={{display:"flex", gap:"6px"}}>
    <button
      onClick={() => {
        if (window.confirm(t("roomChat.makeAdminConfirm", { username: member.username }))) {
          // axios.patch(
          //   `http://localhost:5000/api/rooms/private/${roomId}/admin/${member.id}`,
          //   {},
          //   { headers: { Authorization: `Bearer ${token}` } }
          // )
          api.patch(`/rooms/private/${roomId}/admin/${member.id}`, {}).then(() => {
            // axios.get(`http://localhost:5000/api/rooms/${roomId}`, {
            //   headers: { Authorization: `Bearer ${token}` }
            // })
            api.get(`/rooms/${roomId}`).then(r => setRoom(r.data));
            // axios.get(`http://localhost:5000/api/rooms/${roomId}/members`, {
            //   headers: { Authorization: `Bearer ${token}` }
            // })
            api.get(`/rooms/${roomId}/members`).then(r => setMemberDetails(r.data));
            alert(t("roomChat.makeAdminSuccess", { username: member.username }));
          }).catch(err => alert(err.response?.data?.message || "Something went wrong."));
        }
      }}
      className="roomchat-make-admin-button"
    >
      {t("roomChat.makeAdmin")}
    </button>

    
    <button
      onClick={() => {
        if (window.confirm(`Remove @${member.username} from the room?`)) {
          // axios.delete(
          //   `http://localhost:5000/api/rooms/private/${roomId}/members/${member.id}`,
          //   { headers: { Authorization: `Bearer ${token}` } }
          // )
          api.delete(`/rooms/private/${roomId}/members/${member.id}`).then(() => {
            setMemberDetails(prev => prev.filter(m => m.id !== member.id));
            setRoom(prev => ({
              ...prev,
              members: { length: prev.members.length - 1 }
            }));
          }).catch(err => alert(err.response?.data?.message || "Something went wrong."));
        }
      }}
      className="roomchat-remove-member-button"
    >
      {t("roomChat.removeMember")}
    </button>
  </div>
)}
            
          </div>
        ))}
          {showInvite && (
  <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: "10px", paddingTop: "10px" }}>
    <small style={{ opacity: 0.5 }}>Your connections</small>
    {followList.length === 0 
      ? <p style={{ opacity: 0.4, fontSize: "12px" }}>No one left to invite</p>
      : followList.map(user => (
          <div key={user.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
            <span>👤 @{user.username}</span>
            <button onClick={() => handleInvite(user.id)} className="roomchat-make-admin-button">
              Add
            </button>
          </div>
        ))
    }
  </div>
)}

       </div>
     
       
 </div>
 )}

    </div>
  );

 


  }

