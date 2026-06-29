import { useRef, useState, useEffect } from "react";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function useWebRTC({ socket, roomId, userId, displayName, isHost }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteSocketId, setRemoteSocketId] = useState(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenTrackRef = useRef(null);

  // ── start local media ──────────────────────────────────────────────
  const startMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  };

  // ── create peer connection ─────────────────────────────────────────
  const createPC = (stream, targetSocketId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // add local tracks
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    // ICE candidates
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit("call:ice_candidate", {
          roomId,
          candidate,
          targetSocketId,
        });
      }
    };

    // remote stream
    const remote = new MediaStream();
    pc.ontrack = ({ track }) => {
      remote.addTrack(track);
      setRemoteStream(new MediaStream(remote.getTracks()));
    };

    return pc;
  };

  // ── host: initiate call to guest ───────────────────────────────────
  const callGuest = async (guestSocketId) => {
    setRemoteSocketId(guestSocketId);
    const stream = localStreamRef.current || await startMedia();
    const pc = createPC(stream, guestSocketId);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("call:offer", { roomId, offer, targetSocketId: guestSocketId });
  };

  // ── guest: handle incoming offer ───────────────────────────────────
  const handleOffer = async ({ offer, fromSocketId }) => {
    setRemoteSocketId(fromSocketId);
    const stream = localStreamRef.current || await startMedia();
    const pc = createPC(stream, fromSocketId);

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("call:answer", { roomId, answer, targetSocketId: fromSocketId });
  };

  // ── host: handle answer from guest ────────────────────────────────
  const handleAnswer = async ({ answer }) => {
    await pcRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
  };

  // ── both: handle ICE candidates ───────────────────────────────────
  const handleIceCandidate = async ({ candidate }) => {
    try {
      await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.error("ICE error:", e);
    }
  };

  // ── toggle mute ───────────────────────────────────────────────────
  const toggleMute = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((prev) => !prev);
  };

  // ── toggle camera ─────────────────────────────────────────────────
  const toggleCam = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsCamOff((prev) => !prev);
  };

  // ── screen share ──────────────────────────────────────────────────
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // stop screen share, revert to camera
      screenTrackRef.current?.stop();
      const camTrack = localStreamRef.current.getVideoTracks()[0];
      const sender = pcRef.current
        ?.getSenders()
        .find((s) => s.track?.kind === "video");
      if (sender && camTrack) await sender.replaceTrack(camTrack);
      setIsScreenSharing(false);
      socket.emit("call:screen_share_stopped", { roomId });
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        const sender = pcRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(screenTrack);

        screenTrack.onended = () => toggleScreenShare();
        setIsScreenSharing(true);
        socket.emit("call:screen_share_started", { roomId });
      } catch (e) {
        console.error("Screen share failed:", e);
      }
    }
  };

  // ── cleanup ───────────────────────────────────────────────────────
  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setIsScreenSharing(false);
  };

  return {
    localStream,
    remoteStream,
    isMuted,
    isCamOff,
    isScreenSharing,
    remoteSocketId,
    startMedia,
    callGuest,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    toggleMute,
    toggleCam,
    toggleScreenShare,
    cleanup,
  };
}