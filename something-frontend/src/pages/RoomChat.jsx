import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Cat from "../photos/Cat.jpg";
import { useTranslation } from "react-i18next";
import i18n from "../i18n/index.js";
import "../styles/chat.css"; // Import the CSS file

import { Copy } from "lucide-react";
import api from "../api/axios.js";

import { io } from "socket.io-client";
import CallRoom from "../components/CallRoom";

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

  //calls....i hate me
  const [callActive, setCallActive] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isCallHost, setIsCallHost] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null); // { hostId, hostName }
  const [guestSocketId, setGuestSocketId] = useState(null);
  const [speakerInvite, setSpeakerInvite] = useState(null); // { roomId, fromHostId }
  const socketRef = useRef(null);
  const [audienceList, setAudienceList] = useState([]); // { userId, displayName, socketId }

  //better late then never
  const [messagesCursor, setMessagesCursor] = useState(null);
  const [messagesHasMore, setMessagesHasMore] = useState(true);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const messagesAreaRef = useRef(null);
  const loadMoreMessagesRef = useRef(null);
  const isInitialLoad = useRef(true);
  const prependingRef = useRef(false);
  const MESSAGES_LIMIT = 30;


  const isFetchingRef = useRef(false); 
  const messagesCursorRef = useRef(null);
const messagesHasMoreRef = useRef(true);

const [isWatching, setIsWatching] = useState(false);
const [callTargets, setCallTargets] = useState(null);
const [peerNames, setPeerNames] = useState({});

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


  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await api.get(
          `/rooms/${roomId}/messages?limit=${MESSAGES_LIMIT}`,
        );
        const { messages: fetched, nextCursor, hasMore } = response.data;
        setMessages(fetched);
        setMessagesCursor(nextCursor);
        setMessagesHasMore(hasMore);
        isInitialLoad.current = true;
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };
    fetchMessages();

    const socket = io(
      import.meta.env.VITE_BACKEND_URL || "http://localhost:5000",
      {
        auth: { token: localStorage.getItem("token") },
      },
    );
    socketRef.current = socket; // ← save ref

    socket.emit("join_room", roomId);

    socket.on("new_message", (message) => {
      setMessages((prev) => [...prev, message]);
    });
    socket.on("message_deleted", (messageId) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });
    socket.on("message_edited", (updated) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m)),
      );
    });

    // ── call events ──────────────────────────────────────────
    socket.on("call:incoming", ({ hostId, hostName }) => {
      setIncomingCall({ hostId, hostName });
      setCallActive(true);
    });
    
    socket.on("call:active", ({ hostId, hostName }) => {
  setCallActive(true);
  setIncomingCall({ hostId, hostName });   //  this is what shows the Watch button
});

    socket.on("call:ended", () => {
  setCallActive(false);
  setIsInCall(false);
  setIsCallHost(false);
  setIncomingCall(null);
  setGuestSocketId(null);
  setSpeakerInvite(null);
  setIsWatching(false);      
  setCallTargets(null);      
});
    socket.on("call:speaker_invite", (data) => setSpeakerInvite(data));
    socket.on("call:speaker_accepted", ({ mode }) => {
      setIsInCall(true);
    });
    socket.on("call:started", () => {
      setIsInCall(true);
      setCallActive(true);
    });

    socket.on("call:guest_ready", ({ guestSocketId }) => {
      setGuestSocketId(guestSocketId);
      setIsInCall(true);
    });

    socket.on("call:audience_joined", ({ userId, displayName, socketId }) => {
      setAudienceList((prev) => {
        if (prev.find((u) => u.socketId === socketId)) return prev;
        return [...prev, { userId, displayName, socketId }];
      });
    });
   socket.on("call:speaker_joined", ({ userId, displayName, socketId }) => {
  setAudienceList((prev) => prev.filter((u) => u.userId !== userId));
  setPeerNames((prev) => ({ ...prev, [socketId]: displayName }));
});

    socket.on("call:audience_left", ({ socketId }) => {
      setAudienceList((prev) => prev.filter((u) => u.socketId !== socketId));
    });

    socket.on("call:call_targets", (targets) => {
  setCallTargets(targets);
});

    return () => {
      socket.emit("leave_room", roomId);
      socket.disconnect();
    };
  }, [roomId]);

  // scroll to bottom when new messages arrive
  // useEffect(() => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });//u've bin hit by..u've been struck by..a smooth....i lost it...not even that big of a fan of mj...
  // }, [messages]);
  useEffect(() => {
    const container = messagesAreaRef.current;
    if (!container) return;

    if (isInitialLoad.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      isInitialLoad.current = false;
      return;
    }

    if (prependingRef.current) return; // scroll already handled by loadMoreMessages

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = distanceFromBottom < 150;

    if (nearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setShowJumpToBottom(false);
      setUnseenCount(0);
    } else {
      setShowJumpToBottom(true);
      setUnseenCount((c) => c + 1);
    }
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




//   useEffect(() => {
//     if (!loadMoreMessagesRef.current || !messagesAreaRef.current) return;

//     const observer = new IntersectionObserver(
//       (entries) => {
//         if (entries[0].isIntersecting) {
//           loadMoreMessages();
//         }
//       },
//       { root: messagesAreaRef.current, threshold: 0.1 },
//     );

//     observer.observe(loadMoreMessagesRef.current);
//     return () => observer.disconnect();
//   }, [messagesCursor, messagesHasMore]);
// keep refs in sync with state
useEffect(() => {
  messagesCursorRef.current = messagesCursor;
  messagesHasMoreRef.current = messagesHasMore;
}, [messagesCursor, messagesHasMore]);

// build the observer ONCE — never tear down/rebuild on cursor change
useEffect(() => {
  if (!loadMoreMessagesRef.current || !messagesAreaRef.current) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        loadMoreMessages();
      }
    },
    { root: messagesAreaRef.current, threshold: 0.1 },
  );

  observer.observe(loadMoreMessagesRef.current);
  return () => observer.disconnect();
}, []);

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
        headers: { "Content-Type": "multipart/form-data" },
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
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
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
      const response = await api.patch(`/rooms/messages/${messageId}`, {
        content: editContent,
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? response.data : m)),
      );
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
        api.get(`/users/${currentUser.id}/following`),
      ]);

      const merged = [...followersRes.data, ...followingRes.data];
      const unique = merged.filter(
        (u, index, self) => index === self.findIndex((x) => x.id === u.id),
      );
      const notYetMembers = unique.filter(
        (u) => !memberDetails.some((m) => m.id === u.id),
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
      const invited = followList.find((u) => u.id === inviteeId);
      setMemberDetails((prev) => [...prev, { ...invited, role: "member" }]);
      setFollowList((prev) => prev.filter((u) => u.id !== inviteeId));
      setRoom((prev) => ({
        ...prev,
        members: { length: prev.members.length + 1 },
      }));
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
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          setAudioBlob(blob);
          stream.getTracks().forEach((t) => t.stop()); // release mic
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
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAudioBlob(null);
    } catch (err) {
      console.error("Failed to send audio:", err);
    }
  };

  const handleStartCall = () => {
    const socket = socketRef.current;
    if (!socket) return;
    setIsCallHost(true);
    socket.emit("call:start", {
      roomId,
      userId: currentUser.id,
      displayName: currentUser.username,
    });
  };

 const loadMoreMessages = async () => {
  if (!messagesHasMoreRef.current || isFetchingRef.current || !messagesCursorRef.current) return;
  isFetchingRef.current = true;
  setLoadingMoreMessages(true);

  const cursor = messagesCursorRef.current;
  const container = messagesAreaRef.current;
  const prevScrollHeight = container?.scrollHeight || 0;
  const prevScrollTop = container?.scrollTop || 0;

  try {
    const res = await api.get(
      `/rooms/${roomId}/messages?limit=${MESSAGES_LIMIT}&cursorCreatedAt=${encodeURIComponent(cursor.createdAt)}&cursorId=${cursor.id}`,
    );
    const { messages: older, nextCursor, hasMore } = res.data;

    prependingRef.current = true;
    setMessages((prev) => [...older, ...prev]);
    setMessagesCursor(nextCursor);
    setMessagesHasMore(hasMore);

    requestAnimationFrame(() => {
      if (container) {
        const newScrollHeight = container.scrollHeight;
        container.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
      }
      prependingRef.current = false;
    });
  } catch (err) {
    console.error("Failed to load more messages:", err);
    prependingRef.current = false;
  } finally {
    isFetchingRef.current = false;
    setLoadingMoreMessages(false);
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
        <button
          onClick={() => navigate("/dashboard")}
          className="roomchat-back-button"
        >
          ←
        </button>
        <div>
          <h2 className="roomchat-room-name">#{room?.name}</h2>
          <small className="roomchat-room-stats">{`${room?.members?.length} ${t("roomChat.members")}`}</small>
        </div>
        <button onClick={handleLeaveRoom} className="roomchat-leave-button">
          {t("roomChat.leaveRoom")}
        </button>
        <button
          onClick={callActive ? null : handleStartCall}
          className="roomchat-admin-button"
          style={{
            color: callActive ? "#27ae60" : "inherit",
            border: callActive ? "1px solid #27ae60" : "none",
          }}
          title={callActive ? "Call in progress" : "Start a call"}
        >
          {callActive ? "📞 Live" : "📞"}
        </button>
        {isAdmin && (
          <div className="roomchat-admin-actions">
            <button
              onClick={() => setShowMembers(true)}
              className="roomchat-admin-button"
            >
              {t("roomChat.membersBtn")}
            </button>
            <button
              onClick={() => {
                const newName = prompt(t("roomChat.renamePrompt"));
                if (newName) {
                  api
                    .patch(`/rooms/private/${roomId}/rename`, { name: newName })
                    .then(() =>
                      setRoom((prev) => ({ ...prev, name: newName })),
                    );
                }
              }}
              className="roomchat-admin-button"
            >
              {t("roomChat.rename")}
            </button>
            <button
              onClick={() => {
                if (window.confirm(t("roomChat.deleteRoomConfirm"))) {
                  api
                    .delete(`/rooms/private/${roomId}`)
                    .then(() => navigate("/profile"));
                }
              }}
              className="roomchat-admin-button-danger"
            >
              {t("roomChat.deleteRoom")}
            </button>
            {room?.passKey && (
              <div
                style={{
                  padding: "8px 12px",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "8px",
                  marginBottom: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <small style={{ opacity: 0.6 }}>{t("roomChat.passkey")}</small>
                <code
                  style={{
                    background: "rgba(255,255,255,0)",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    letterSpacing: "2px",
                    color: "var(--text-main)",
                    fontSize: "14px",
                    fontWeight: "bold",
                    userSelect: "all",
                    fontFamily:
                      '"OCR-A", "Courier New", "JetBrains Mono", monospace',
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
                >
                  <Copy size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* ── end header ── */}

      {/* ── body: split when in call, full otherwise ── */}
      <div
        className= {callActive && (isInCall || isWatching) ? "roomchat-body-split" : ""}
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: callActive && (isInCall || isWatching)? "row" : "column",
        }}
      >
        {/* call panel */}
        {callActive && (isInCall || isWatching) && (
          <div className="roomchat-call-panel">
            <CallRoom
  socket={socketRef.current}
  roomId={roomId}
  userId={currentUser.id}
  displayName={currentUser.username}
  role={isCallHost ? "host" : isInCall ? "speaker" : "audience"}
  callTargets={callTargets}
  peerNames={peerNames}
  onEnd={() => {
    setIsInCall(false);
    setCallActive(false);
    setIsCallHost(false);
    setGuestSocketId(null);
    setIsWatching(false);   
    setCallTargets(null);   
  }}
/>
            {/* audience list below the video panel */}
            {isCallHost && (
              <div className="callroom-audience-panel">
                <small className="callroom-audience-panel-title">
                  👥 Audience{" "}
                  {audienceList.length > 0
                    ? `(${audienceList.length})`
                    : "(empty)"}
                </small>
                {audienceList.length === 0 ? (
                  <p className="callroom-audience-empty">No one watching yet</p>
                ) : (
                  audienceList.map((u) => (
                    <div key={u.socketId} className="callroom-audience-item">
                      <span>👤 {u.displayName}</span>
                      <button
                        className="callroom-audience-invite-btn"
                        onClick={() => {
                          socketRef.current.emit("call:invite_speaker", {
                            roomId,
                            targetSocketId: u.socketId,
                          });
                        }}
                      >
                        🎙️ Invite to speak
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
        {/* chat panel */}
        <div
          className={
            callActive && (isInCall || isWatching)
              ? "roomchat-chat-panel"
              : "roomchat-chat-panel-full"
          }
        >
          {/* audience banner */}
          {callActive && !isInCall && !isWatching &&(
            <div className="callroom-audience-banner">
              <span>📞 A call is live in this room</span>
              {speakerInvite && (
                <button
                  className="callroom-audience-join-btn"
                  onClick={() => {
                    socketRef.current.emit("call:accept_speaker", {
                      roomId,
                      userId: currentUser.id,
                      displayName: currentUser.username,
                    });
                  }}
                >
                  Join as speaker
                </button>
              )}
            </div>
          )}

          {/* messages */}
          <div className="roomchat-messages-area" ref={messagesAreaRef}>
            {messagesHasMore && (
              <div
                ref={loadMoreMessagesRef}
                style={{
                  textAlign: "center",
                  padding: "10px",
                  opacity: 0.5,
                  fontSize: "12px",
                }}
              >
                {loadingMoreMessages ? "..." : ""}
              </div>
            )}
            {messages.length === 0 ? (
              <p className="roomchat-no-messages">{t("roomChat.noMessages")}</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`roomchat-message-wrapper ${msg.senderId === currentUser?.id ? "roomchat-message-right" : "roomchat-message-left"}`}
                >
                  {msg.replyTo && (
                    <div className="roomchat-reply-preview">
                      ↩{" "}
                      {messages.find((m) => m.id === msg.replyTo)
                        ?.authorUsername
                        ? `@${messages.find((m) => m.id === msg.replyTo).authorUsername}: ${messages.find((m) => m.id === msg.replyTo).content?.slice(0, 50)}...`
                        : t("roomChat.replyingToDeleted")}
                    </div>
                  )}
                  <div
                    className={`roomchat-message-bubble ${msg.senderId === currentUser?.id ? "roomchat-message-bubble-right" : "roomchat-message-bubble-left"}`}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "4px",
                      }}
                    >
                      <img
                        src={msg.profilePicUrl}
                        alt="pfp"
                        onError={(e) => {
                          e.target.src = Cat;
                        }}
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                      <small className="roomchat-message-author">
                        @{msg.authorUsername}
                      </small>
                    </div>
                    {editingMessage?.id === msg.id ? (
                      <div>
                        <input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="roomchat-edit-input"
                        />
                        <div className="roomchat-edit-actions">
                          <button
                            onClick={() => handleEditMessage(msg.id)}
                            className="roomchat-edit-save"
                          >
                            {t("roomChat.save")}
                          </button>
                          <button
                            onClick={() => setEditingMessage(null)}
                            className="roomchat-edit-cancel"
                          >
                            {t("roomChat.cancel")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="roomchat-message-content">{msg.content}</p>
                    )}
                    {msg.attachment &&
                      (isImage(msg.attachment) ? (
                        <img
                          src={msg.attachment}
                          alt="attachment"
                          className="roomchat-message-attachment"
                        />
                      ) : isVideo(msg.attachment) ? (
                        <video
                          controls
                          style={{
                            maxWidth: "200px",
                            borderRadius: "8px",
                            marginTop: "6px",
                          }}
                        >
                          <source src={msg.attachment} />
                        </video>
                      ) : isAudio(msg.attachment) ? (
                        <audio
                          controls
                          style={{ marginTop: "6px", maxWidth: "250px" }}
                        >
                          <source src={msg.attachment} />
                        </audio>
                      ) : (
                        <a
                          href={msg.attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="roomchat-message-file-link"
                        >
                          {t("roomChat.openFile")}
                        </a>
                      ))}
                    {/* <small className="roomchat-message-timestamp">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </small> */}
                    <small className="roomchat-message-timestamp">
  {new Date(msg.createdAt).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}
</small>
                    {msg.isEdited && (
                      <small className="roomchat-message-edited">
                        {" "}
                        {t("roomChat.edited")}
                      </small>
                    )}
                  </div>
                  <div className="roomchat-message-actions">
                    <button
                      onClick={() => setReplyTo(msg)}
                      className="roomchat-action-button"
                    >
                      {t("roomChat.reply")}
                    </button>
                    {msg.senderId === currentUser?.id && (
                      <>
                        <button
                          onClick={() => {
                            setEditingMessage(msg);
                            setEditContent(msg.content);
                          }}
                          className="roomchat-action-button"
                        >
                          {t("roomChat.edit")}
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="roomchat-action-button-danger"
                        >
                          {t("roomChat.delete")}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── end messages ── */}

          {showJumpToBottom && (
            <button
              onClick={() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                setShowJumpToBottom(false);
                setUnseenCount(0);
              }}
              style={{
                position: "absolute",
                bottom: "80px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "#6476af",
                color: "white",
                border: "none",
                borderRadius: "20px",
                padding: "8px 16px",
                cursor: "pointer",
                fontSize: "13px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                zIndex: 10,
              }}
            >
              ↓{" "}
              {unseenCount > 0
                ? `${unseenCount} new`
                : t("roomChat.jumpToBottom", "Jump to latest")}
            </button>
          )}

          {/* reply bar */}
          {replyTo && (
            <div className="roomchat-reply-bar">
              <small className="roomchat-reply-text">
                {t("roomChat.replyingTo")} @{replyTo.authorUsername}:{" "}
                {replyTo.content?.slice(0, 50)}...
              </small>
              <button
                onClick={() => setReplyTo(null)}
                className="roomchat-reply-close"
              >
                ✕
              </button>
            </div>
          )}

          {/* input area */}
          <div className="roomchat-input-area">
            <input
              type="file"
              id="attachmentInput"
              accept="image/*,.pdf,.doc,.docx,.txt,.zip,video/*"
              className="roomchat-file-input"
              onChange={(e) => setAttachment(e.target.files[0])}
            />
            <button
              onClick={() => document.getElementById("attachmentInput").click()}
              className="roomchat-attach-button"
            >
              📎
            </button>
            <button
              onClick={handleToggleRecording}
              className="roomchat-attach-button"
              style={{ color: isRecording ? "#e74c3c" : "inherit" }}
              title={isRecording ? "Stop recording" : "Record voice message"}
            >
              {isRecording ? "⏹️" : "🎤"}
            </button>
            {audioBlob && !isRecording && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  flex: 1,
                }}
              >
                <audio
                  controls
                  src={URL.createObjectURL(audioBlob)}
                  style={{ height: "32px", flex: 1 }}
                />
                <button
                  onClick={handleSendAudio}
                  className="roomchat-send-button"
                >
                  Send
                </button>
                <button
                  onClick={() => setAudioBlob(null)}
                  className="roomchat-action-button-danger"
                >
                  ✕
                </button>
              </div>
            )}
            {!audioBlob && (
              <>
                {attachment && (
                  <small className="roomchat-attachment-name">
                    {attachment.name}
                  </small>
                )}
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder={t("roomChat.placeholder")}
                  className="roomchat-message-input"
                />
                <button
                  onClick={handleSendMessage}
                  className="roomchat-send-button"
                >
                  {t("roomChat.send")}
                </button>
              </>
            )}
          </div>
          {/* ── end input area ── */}
        </div>
        {/* ── end chat panel ── */}
      </div>
      {/* ── end body ── */}

      {/* incoming call banner — outside body, fixed position */}
      {incomingCall && !isInCall && (
        <div className="callroom-incoming-banner">
          <span>📞</span>
          <div className="callroom-incoming-text">
            <strong>{incomingCall.hostName} is live</strong>
            <small>Join the audience to watch</small>
          </div>
          <button
            className="callroom-incoming-accept"
            onClick={() => {
              socketRef.current.emit("call:join_audience", {
                roomId,
                userId: currentUser.id,
                displayName: currentUser.username,
              });
              setIsWatching(true); 
              setIncomingCall(null);
            }}
          >
            Watch
          </button>
          <button
            className="callroom-incoming-decline"
            onClick={() => setIncomingCall(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      {/* Speaker invite popup — appears over everything */}
      {speakerInvite && !isInCall && (
        <div className="callroom-incoming-banner" style={{ bottom: "80px" }}>
          {" "}
          {/* stack above the watch banner if both show */}
          <span>🎙️</span>
          <div className="callroom-incoming-text">
            <strong>You've been invited to speak</strong>
            <small>The host wants to hear you</small>
          </div>
          <button
            className="callroom-incoming-accept"
            onClick={() => {
              socketRef.current.emit("call:accept_speaker", {
                roomId,
                userId: currentUser.id,
                displayName: currentUser.username,
              });
              setSpeakerInvite(null);
            }}
          >
            Accept
          </button>
          <button
            className="callroom-incoming-decline"
            onClick={() => setSpeakerInvite(null)}
          >
            Decline
          </button>
        </div>
      )}

      {/* members modal — outside body, fixed overlay */}
      {showMembers && (
        <div
          className="roomchat-modal-overlay"
          onClick={() => {
            setShowMembers(false);
            setShowInvite(false);
          }}
        >
          <div className="roomchat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="roomchat-modal-header">
              <h3 className="roomchat-modal-title">{`${t("roomChat.membersTitle")} (${room?.members?.length})`}</h3>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <button
                  onClick={() => {
                    if (!showInvite) openInvite();
                    else setShowInvite(false);
                  }}
                  className="roomchat-admin-button"
                  style={{ fontSize: "12px" }}
                >
                  {showInvite ? "← Back" : "+ Invite"}
                </button>
                <button
                  onClick={() => {
                    setShowMembers(false);
                    setShowInvite(false);
                  }}
                  className="roomchat-modal-close"
                >
                  ✕
                </button>
              </div>
            </div>
            {memberDetails.map((member) => (
              <div key={member.id} className="roomchat-member-item">
                <div className="roomchat-member-info">
                  <span className="roomchat-member-avatar">👤</span>
                  <span className="roomchat-member-username">
                    @{member.username}
                  </span>
                  {room?.admins?.includes(member.id) && (
                    <small className="roomchat-admin-badge">
                      {t("roomChat.admin")}
                    </small>
                  )}
                </div>
                {!room?.admins?.includes(member.id) &&
                  member.id !== currentUser?.id && (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              t("roomChat.makeAdminConfirm", {
                                username: member.username,
                              }),
                            )
                          ) {
                            api
                              .patch(
                                `/rooms/private/${roomId}/admin/${member.id}`,
                                {},
                              )
                              .then(() => {
                                api
                                  .get(`/rooms/${roomId}`)
                                  .then((r) => setRoom(r.data));
                                api
                                  .get(`/rooms/${roomId}/members`)
                                  .then((r) => setMemberDetails(r.data));
                                alert(
                                  t("roomChat.makeAdminSuccess", {
                                    username: member.username,
                                  }),
                                );
                              })
                              .catch((err) =>
                                alert(
                                  err.response?.data?.message ||
                                    "Something went wrong.",
                                ),
                              );
                          }
                        }}
                        className="roomchat-make-admin-button"
                      >
                        {t("roomChat.makeAdmin")}
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remove @${member.username} from the room?`,
                            )
                          ) {
                            api
                              .delete(
                                `/rooms/private/${roomId}/members/${member.id}`,
                              )
                              .then(() => {
                                setMemberDetails((prev) =>
                                  prev.filter((m) => m.id !== member.id),
                                );
                                setRoom((prev) => ({
                                  ...prev,
                                  members: { length: prev.members.length - 1 },
                                }));
                              })
                              .catch((err) =>
                                alert(
                                  err.response?.data?.message ||
                                    "Something went wrong.",
                                ),
                              );
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
              <div
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                  marginTop: "10px",
                  paddingTop: "10px",
                }}
              >
                <small style={{ opacity: 0.5 }}>Your connections</small>
                {followList.length === 0 ? (
                  <p style={{ opacity: 0.4, fontSize: "12px" }}>
                    No one left to invite
                  </p>
                ) : (
                  followList.map((user) => (
                    <div
                      key={user.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                      }}
                    >
                      <span>👤 @{user.username}</span>
                      <button
                        onClick={() => handleInvite(user.id)}
                        className="roomchat-make-admin-button"
                      >
                        Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
