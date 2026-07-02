import { useRef, useState, useCallback } from "react";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function useWebRTC({ socket, roomId, userId, displayName, isHost }) {
  const [localStream, setLocalStream]     = useState(null);
  const [remoteStream, setRemoteStream]   = useState(null);
  const [isMuted, setIsMuted]             = useState(false);
  const [isCamOff, setIsCamOff]           = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const pcRef           = useRef(null);
  const localStreamRef  = useRef(null);
  const screenTrackRef  = useRef(null);
  const remoteSocketRef = useRef(null); // ← ref instead of state, no re-render needed

  const [screenStream, setScreenStream] = useState(null);

  const startMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current; // ← guard: don't double-start
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const createPC = useCallback((stream, targetSocketId) => {
    if (pcRef.current) {           // ← guard: don't double-create
      pcRef.current.close();
    }
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit("call:ice_candidate", { roomId, candidate, targetSocketId });
      }
    };

    const remote = new MediaStream();
    pc.ontrack = ({ track }) => {
      remote.addTrack(track);
      setRemoteStream(new MediaStream(remote.getTracks()));
    };

    return pc;
  }, [socket, roomId]);

  const callGuest = useCallback(async (guestSocketId) => {
    remoteSocketRef.current = guestSocketId;
    const stream = await startMedia();
    const pc = createPC(stream, guestSocketId);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("call:offer", { roomId, offer, targetSocketId: guestSocketId });
  }, [socket, roomId, startMedia, createPC]);

  const handleOffer = useCallback(async ({ offer, fromSocketId }) => {
    remoteSocketRef.current = fromSocketId;
    const stream = await startMedia();
    const pc = createPC(stream, fromSocketId);

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("call:answer", { roomId, answer, targetSocketId: fromSocketId });
  }, [socket, roomId, startMedia, createPC]);

  const handleAnswer = useCallback(async ({ answer }) => {
    await pcRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
  }, []);

  const handleIceCandidate = useCallback(async ({ candidate }) => {
    try {
      await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.error("ICE error:", e);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsMuted((prev) => !prev);
  }, []);

  const toggleCam = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsCamOff((prev) => !prev);
  }, []);

 const toggleScreenShare = useCallback(async () => {
  if (isScreenSharing) {
    screenTrackRef.current?.stop();
    const camTrack = localStreamRef.current?.getVideoTracks()[0];
    const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === "video");
    if (sender && camTrack) await sender.replaceTrack(camTrack);
    setIsScreenSharing(false);
    setScreenStream(null);              // ← clear it
    socket.emit("call:screen_share_stopped", { roomId });
  } else {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = stream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;
      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(screenTrack);
      screenTrack.onended = () => toggleScreenShare();
      setIsScreenSharing(true);
      setScreenStream(stream);          // ← store it
      socket.emit("call:screen_share_started", { roomId });
    } catch (e) {
      console.error("Screen share failed:", e);
    }
  }
}, [isScreenSharing, socket, roomId]);

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current = null;
    screenTrackRef.current = null;
    remoteSocketRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setIsScreenSharing(false);
  }, []);

  return {
    localStream, remoteStream,
    isMuted, isCamOff, isScreenSharing,
    startMedia, callGuest,
    handleOffer, handleAnswer, handleIceCandidate,
    toggleMute, toggleCam, toggleScreenShare,
    cleanup,screenStream,
  };
}