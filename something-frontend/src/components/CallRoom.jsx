import { useEffect, useRef } from "react";
import useWebRTC from "./useWebRTC";
import "../styles/callRoom.css";

export default function CallRoom({
  socket, roomId, userId, displayName,
  role,          // 'host' | 'speaker' | 'audience'
  callTargets,   // { speakers: [socketId,...], viewers: [socketId,...] } — only set once, for a newly-promoted speaker
  peerNames,     // { [socketId]: displayName } — optional, for labeling remote tiles
  onEnd,
}) {
  const localVideoRef  = useRef(null);
  const initializedRef = useRef(false);
  const becamespeakerRef = useRef(false);

  const {
    localStream, screenStream,
    isMuted, isCamOff, isScreenSharing,
    peers,
    startMedia, becomeSpeaker, addViewer,
    handleOffer, handleAnswer, handleIceCandidate, handlePeerLeft,
    handleRemoteCamStatus, handleRemoteScreenStatus,
    toggleMute, toggleCam, toggleScreenShare,
    cleanup,
  } = useWebRTC({ socket, roomId, userId, displayName, isHost: role === "host" });

  const isPublisher = role === "host" || role === "speaker";

  // local preview: camera or screen share, whichever is active — only relevant for publishers
  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = isScreenSharing ? screenStream : localStream;
    }
  }, [isScreenSharing, screenStream, localStream]);

  // register socket listeners ONCE on mount
  useEffect(() => {
    socket.on("call:offer",         handleOffer);
    socket.on("call:answer",        handleAnswer);
    socket.on("call:ice_candidate", handleIceCandidate);
    socket.on("call:peer_left",     handlePeerLeft);

    // only publishers ever receive this (server scopes it to call.participants)
    socket.on("call:viewer_joined", ({ viewerSocketId }) => addViewer(viewerSocketId));

    socket.on("call:cam_status", handleRemoteCamStatus);
    socket.on("call:screen_share_started", ({ socketId }) =>
      handleRemoteScreenStatus({ socketId, isScreenSharing: true })
    );
    socket.on("call:screen_share_stopped", ({ socketId }) =>
      handleRemoteScreenStatus({ socketId, isScreenSharing: false })
    );

    return () => {
      socket.off("call:offer",         handleOffer);
      socket.off("call:answer",        handleAnswer);
      socket.off("call:ice_candidate", handleIceCandidate);
      socket.off("call:peer_left",     handlePeerLeft);
      socket.off("call:viewer_joined");
      socket.off("call:cam_status",    handleRemoteCamStatus);
      socket.off("call:screen_share_started");
      socket.off("call:screen_share_stopped");
      cleanup();
    };
  }, []); // register once — stable refs from useCallback handle the rest

  // host: acquire media immediately (they're a publisher from the moment the call starts)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    if (role === "host") startMedia();
  }, [role]);

  // newly-promoted speaker: connect out to everyone once the server tells us who's there.
  // callTargets is captured by the PARENT (RoomChat) at the top level and passed down as a
  // prop — NOT listened for inside this component — because this component only mounts
  // *because* the promotion happened, so a listener registered here could miss the event
  // if it arrives before this effect runs.
  useEffect(() => {
    if (role === "speaker" && callTargets && !becamespeakerRef.current) {
      becamespeakerRef.current = true;
      becomeSpeaker(callTargets);
    }
  }, [role, callTargets]);

  const handleEnd = () => {
    socket.emit(role === "host" ? "call:end" : "call:leave", { roomId });
    cleanup();
    onEnd();
  };

  const showLocalAvatar = isCamOff && !isScreenSharing;

  return (
    <div className="callroom-root">
      <div className="callroom-videos">
        {isPublisher && (
          <div className="callroom-video-wrapper">
            {showLocalAvatar ? (
              <div className="callroom-avatar">
                <span>{displayName?.[0]?.toUpperCase()}</span>
              </div>
            ) : (
              <video ref={localVideoRef} autoPlay muted playsInline className="callroom-video mirrored" />
            )}
            <span className="callroom-video-label">
              {displayName} {role === "host" ? "👑" : ""} (You)
            </span>
          </div>
        )}

        {peers.map(({ socketId, stream, isCamOff: peerCamOff }) => (
          <PeerTile
            key={socketId}
            stream={stream}
            isCamOff={peerCamOff}
            label={peerNames?.[socketId] || "Speaker"}
          />
        ))}

        {peers.length === 0 && (
          <div className="callroom-video-wrapper callroom-waiting-wrapper">
            <div className="callroom-waiting">
              <span>⏳</span>
              <p>
                {role === "host" && "Waiting for someone to join..."}
                {role === "speaker" && "Connecting..."}
                {role === "audience" && "Waiting for the host to connect..."}
              </p>
            </div>
          </div>
        )}
      </div>

      {isPublisher ? (
        <div className="callroom-controls">
          <button onClick={toggleMute}        className={`callroom-ctrl-btn ${isMuted        ? "callroom-ctrl-active" : ""}`}>{isMuted        ? "🔇" : "🎙️"}</button>
          <button onClick={toggleCam}         className={`callroom-ctrl-btn ${isCamOff       ? "callroom-ctrl-active" : ""}`}>{isCamOff       ? "📵" : "📷"}</button>
          <button onClick={toggleScreenShare} className={`callroom-ctrl-btn ${isScreenSharing? "callroom-ctrl-active" : ""}`}>{isScreenSharing? "🖥️✓" : "🖥️"}</button>
          <button onClick={handleEnd} className="callroom-ctrl-btn callroom-ctrl-end">
            📵 {role === "host" ? "End" : "Leave"}
          </button>
        </div>
      ) : (
        <div className="callroom-controls">
          <button onClick={handleEnd} className="callroom-ctrl-btn callroom-ctrl-end">
            📵 Stop watching
          </button>
        </div>
      )}
    </div>
  );
}

// small internal component so remote tiles get their own <video> + ref, since
// hooks can't be called in a .map() callback directly
function PeerTile({ stream, isCamOff, label }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="callroom-video-wrapper">
      {isCamOff ? (
        <div className="callroom-avatar">
          <span>{label?.[0]?.toUpperCase() || "?"}</span>
        </div>
      ) : (
        <video ref={videoRef} autoPlay playsInline className="callroom-video" />
      )}
      <span className="callroom-video-label">{label}</span>
    </div>
  );
}