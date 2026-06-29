import { useEffect, useRef } from "react";
import useWebRTC from "./useWebRTC";

export default function CallRoom({
  socket, roomId, userId, displayName,
  isHost, guestSocketId, onEnd,
}) {
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const initializedRef = useRef(false); // ← guard double-init

  const {
    localStream, remoteStream,
    isMuted, isCamOff, isScreenSharing,
    startMedia, callGuest,
    handleOffer, handleAnswer, handleIceCandidate,
    toggleMute, toggleCam, toggleScreenShare,
    cleanup,
  } = useWebRTC({ socket, roomId, userId, displayName, isHost });

  // bind streams
  useEffect(() => {
    if (localVideoRef.current && localStream)
      localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream)
      remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  // register socket listeners ONCE on mount
  useEffect(() => {
    socket.on("call:offer",         handleOffer);
    socket.on("call:answer",        handleAnswer);
    socket.on("call:ice_candidate", handleIceCandidate);

    return () => {
      socket.off("call:offer",         handleOffer);
      socket.off("call:answer",        handleAnswer);
      socket.off("call:ice_candidate", handleIceCandidate);
      cleanup();
    };
  }, []); // ← empty: register once, stable refs from useCallback handle the rest

  // start media on mount (both host and guest need their camera)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    startMedia();
  }, []);

  // host: call the guest once guestSocketId arrives
  useEffect(() => {
    if (isHost && guestSocketId) {
      callGuest(guestSocketId);
    }
  }, [guestSocketId]); // ← only re-runs when a new guest is ready

  const handleEnd = () => {
    socket.emit(isHost ? "call:end" : "call:leave", { roomId });
    cleanup();
    onEnd();
  };

  return (
    <div className="callroom-root">
      <div className="callroom-videos">
        <div className="callroom-video-wrapper">
          <video ref={localVideoRef} autoPlay muted playsInline className="callroom-video" />
          <span className="callroom-video-label">{displayName} {isHost ? "👑" : ""} (You)</span>
        </div>
        <div className="callroom-video-wrapper">
          {remoteStream ? (
            <>
              <video ref={remoteVideoRef} autoPlay playsInline className="callroom-video" />
              <span className="callroom-video-label">Guest</span>
            </>
          ) : (
            <div className="callroom-waiting">
              <span>⏳</span>
              <p>{isHost ? "Waiting for guest to join..." : "Connecting..."}</p>
            </div>
          )}
        </div>
      </div>

      <div className="callroom-controls">
        <button onClick={toggleMute}        className={`callroom-ctrl-btn ${isMuted        ? "callroom-ctrl-active" : ""}`}>{isMuted        ? "🔇" : "🎙️"}</button>
        <button onClick={toggleCam}         className={`callroom-ctrl-btn ${isCamOff       ? "callroom-ctrl-active" : ""}`}>{isCamOff       ? "📵" : "📷"}</button>
        <button onClick={toggleScreenShare} className={`callroom-ctrl-btn ${isScreenSharing? "callroom-ctrl-active" : ""}`}>{isScreenSharing? "🖥️✓" : "🖥️"}</button>
        <button onClick={handleEnd} className="callroom-ctrl-btn callroom-ctrl-end">
          📵 {isHost ? "End" : "Leave"}
        </button>
      </div>
    </div>
  );
}