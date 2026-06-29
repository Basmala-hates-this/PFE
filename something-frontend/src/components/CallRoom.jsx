import { useEffect, useRef } from "react";
import useWebRTC from "./useWebRTC";

export default function CallRoom({
  socket,
  roomId,
  userId,
  displayName,
  isHost,
  guestSocketId,     // set when host invites someone
  onEnd,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const {
    localStream,
    remoteStream,
    isMuted,
    isCamOff,
    isScreenSharing,
    startMedia,
    callGuest,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    toggleMute,
    toggleCam,
    toggleScreenShare,
    cleanup,
  } = useWebRTC({ socket, roomId, userId, displayName, isHost });

  // ── bind streams to video elements ────────────────────────────────
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // ── on mount: start media, register socket listeners ──────────────
  useEffect(() => {
    const init = async () => {
      await startMedia();
      // host calls guest once media is ready
      if (isHost && guestSocketId) {
        callGuest(guestSocketId);
      }
    };
    init();

    socket.on("call:offer", handleOffer);
    socket.on("call:answer", handleAnswer);
    socket.on("call:ice_candidate", handleIceCandidate);
    socket.on("call:screen_share_started", ({ socketId }) => {
      // visual indicator handled via remoteStream track replacement
    });

    return () => {
      socket.off("call:offer", handleOffer);
      socket.off("call:answer", handleAnswer);
      socket.off("call:ice_candidate", handleIceCandidate);
      cleanup();
    };
  }, [guestSocketId]);

  // ── end call ──────────────────────────────────────────────────────
  const handleEnd = () => {
    if (isHost) {
      socket.emit("call:end", { roomId });
    } else {
      socket.emit("call:leave", { roomId });
    }
    cleanup();
    onEnd();
  };

  return (
    <div className="callroom-root">
      {/* videos */}
      <div className="callroom-videos">
        <div className="callroom-video-wrapper">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="callroom-video"
          />
          <span className="callroom-video-label">
            {displayName} {isHost ? "👑" : ""} (You)
          </span>
        </div>

        <div className="callroom-video-wrapper">
          {remoteStream ? (
            <>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="callroom-video"
              />
              <span className="callroom-video-label">Guest</span>
            </>
          ) : (
            <div className="callroom-waiting">
              <span>⏳</span>
              <p>Waiting for guest to join...</p>
            </div>
          )}
        </div>
      </div>

      {/* controls */}
      <div className="callroom-controls">
        <button
          onClick={toggleMute}
          className={`callroom-ctrl-btn ${isMuted ? "callroom-ctrl-active" : ""}`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? "🔇" : "🎙️"}
        </button>

        <button
          onClick={toggleCam}
          className={`callroom-ctrl-btn ${isCamOff ? "callroom-ctrl-active" : ""}`}
          title={isCamOff ? "Turn camera on" : "Turn camera off"}
        >
          {isCamOff ? "📵" : "📷"}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`callroom-ctrl-btn ${isScreenSharing ? "callroom-ctrl-active" : ""}`}
          title={isScreenSharing ? "Stop sharing" : "Share screen"}
        >
          {isScreenSharing ? "🖥️✓" : "🖥️"}
        </button>

        <button
          onClick={handleEnd}
          className="callroom-ctrl-btn callroom-ctrl-end"
          title={isHost ? "End call for everyone" : "Leave call"}
        >
          📵 {isHost ? "End" : "Leave"}
        </button>
      </div>
    </div>
  );
}