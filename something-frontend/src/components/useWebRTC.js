import { useRef, useState, useCallback, useMemo } from "react";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function useWebRTC({ socket, roomId, userId, displayName, isHost }) {
  const [localStream, setLocalStream]     = useState(null);
  const [screenStream, setScreenStream]   = useState(null);
  const [isMuted, setIsMuted]             = useState(false);
  const [isCamOff, setIsCamOff]           = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const [remoteStreams, setRemoteStreams]     = useState(new Map());
  const [remoteCamOff, setRemoteCamOff]       = useState(new Map());
  const [remoteScreenSharing, setRemoteScreenSharing] = useState(new Map());

  const peersRef        = useRef(new Map());
  const localStreamRef  = useRef(null);
  const screenTrackRef  = useRef(null);

  const peers = useMemo(() => {
    return Array.from(remoteStreams.entries()).map(([socketId, stream]) => ({
      socketId,
      stream,
      isCamOff: remoteCamOff.get(socketId) ?? true,
      isScreenSharing: remoteScreenSharing.get(socketId) ?? false,
    }));
  }, [remoteStreams, remoteCamOff, remoteScreenSharing]);

  const startMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    stream.getVideoTracks().forEach((t) => { t.enabled = false; });
    localStreamRef.current = stream;
    setLocalStream(stream);
    setIsCamOff(true);
    return stream;
  }, []);

  const createPeerConnection = useCallback((targetSocketId) => {
    const existing = peersRef.current.get(targetSocketId);
    if (existing) existing.close();

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current.set(targetSocketId, pc);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) =>
        pc.addTrack(track, localStreamRef.current)
      );
    }

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit("call:ice_candidate", { roomId, candidate, targetSocketId });
      }
    };

    const remote = new MediaStream();
    pc.ontrack = ({ track }) => {
      remote.addTrack(track);
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.set(targetSocketId, new MediaStream(remote.getTracks()));
        return next;
      });
    };

    return pc;
  }, [socket, roomId]);

  const removePeer = useCallback((socketId) => {
    peersRef.current.get(socketId)?.close();
    peersRef.current.delete(socketId);
    setRemoteStreams((prev) => { const next = new Map(prev); next.delete(socketId); return next; });
    setRemoteCamOff((prev) => { const next = new Map(prev); next.delete(socketId); return next; });
    setRemoteScreenSharing((prev) => { const next = new Map(prev); next.delete(socketId); return next; });
  }, []);

  const callPeer = useCallback(async (targetSocketId) => {
    const pc = createPeerConnection(targetSocketId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("call:offer", { roomId, offer, targetSocketId });
  }, [socket, roomId, createPeerConnection]);

  const becomeSpeaker = useCallback(async ({ speakers = [], viewers = [] } = {}) => {
    await startMedia();
    for (const speakerSocketId of speakers) await callPeer(speakerSocketId);
    for (const viewerSocketId of viewers) await callPeer(viewerSocketId);
  }, [startMedia, callPeer]);

  const addViewer = useCallback(async (viewerSocketId) => {
    await callPeer(viewerSocketId);
  }, [callPeer]);

  const handleOffer = useCallback(async ({ offer, fromSocketId }) => {
    const pc = createPeerConnection(fromSocketId);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("call:answer", { roomId, answer, targetSocketId: fromSocketId });
  }, [socket, roomId, createPeerConnection]);

  const handleAnswer = useCallback(async ({ answer, fromSocketId }) => {
    await peersRef.current.get(fromSocketId)?.setRemoteDescription(new RTCSessionDescription(answer));
  }, []);

  const handleIceCandidate = useCallback(async ({ candidate, fromSocketId }) => {
    try {
      await peersRef.current.get(fromSocketId)?.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.error("ICE error:", e);
    }
  }, []);

  const handlePeerLeft = useCallback(({ socketId }) => {
    removePeer(socketId);
  }, [removePeer]);

  const handleRemoteCamStatus = useCallback(({ socketId, isCamOff: off }) => {
    setRemoteCamOff((prev) => new Map(prev).set(socketId, off));
  }, []);

  const handleRemoteScreenStatus = useCallback(({ socketId, isScreenSharing: sharing }) => {
    setRemoteScreenSharing((prev) => new Map(prev).set(socketId, sharing));
  }, []);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsMuted((prev) => !prev);
  }, []);

  const toggleCam = useCallback(() => {
    if (!localStreamRef.current) return;
    let nextOff;
    localStreamRef.current.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
      nextOff = !t.enabled;
    });
    setIsCamOff(nextOff);
    socket.emit("call:cam_status", { roomId, isCamOff: nextOff });
  }, [socket, roomId]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      screenTrackRef.current?.stop();
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      for (const pc of peersRef.current.values()) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender && camTrack) await sender.replaceTrack(camTrack);
      }
      setIsScreenSharing(false);
      setScreenStream(null);
      socket.emit("call:screen_share_stopped", { roomId });
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = stream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        for (const pc of peersRef.current.values()) {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) await sender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => toggleScreenShare();
        setIsScreenSharing(true);
        setScreenStream(stream);
        socket.emit("call:screen_share_started", { roomId });
      } catch (e) {
        console.error("Screen share failed:", e);
      }
    }
  }, [isScreenSharing, socket, roomId]);

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenTrackRef.current?.stop();
    for (const pc of peersRef.current.values()) pc.close();
    peersRef.current.clear();

    localStreamRef.current = null;
    screenTrackRef.current = null;

    setLocalStream(null);
    setScreenStream(null);
    setIsScreenSharing(false);
    setRemoteStreams(new Map());
    setRemoteCamOff(new Map());
    setRemoteScreenSharing(new Map());
  }, []);

  return {
    localStream, screenStream,
    isMuted, isCamOff, isScreenSharing,
    peers,

    startMedia,
    becomeSpeaker,
    addViewer,

    handleOffer, handleAnswer, handleIceCandidate, handlePeerLeft,
    handleRemoteCamStatus, handleRemoteScreenStatus,

    toggleMute, toggleCam, toggleScreenShare,
    cleanup,
  };
}