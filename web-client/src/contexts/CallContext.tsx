"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { App } from "antd";
import socketService from "@/services/chat.socket";
import { useSocket } from "@/contexts/ChatSocketContext";
import { useAppSelector } from "@/stores/hooks";

export type CallType = "VOICE" | "VIDEO";
export type CallStatus = "idle" | "incoming" | "outgoing" | "active";

export type CallParticipant = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

type CallState = {
  status: CallStatus;
  callId: string | null;
  callType: CallType | null;
  isCaller: boolean;
  conversationId?: string;
  participant?: CallParticipant;
};

type StartCallPayload = {
  conversationId: string;
  calleeId: string;
  callType: CallType;
  participantName?: string;
  participantAvatar?: string | null;
};

type CallContextValue = {
  callState: CallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callDurationSec: number;
  networkQuality: "good" | "ok" | "poor" | "unknown";
  startCall: (payload: StartCallPayload) => Promise<void>;
  acceptCall: () => void;
  rejectCall: () => void;
  cancelCall: () => void;
  endCall: () => void;
};

const CallContext = createContext<CallContextValue | null>(null);

export const useCall = () => {
  const ctx = useContext(CallContext);
  if (!ctx) {
    throw new Error("useCall must be used within CallProvider");
  }
  return ctx;
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { message } = App.useApp();
  const { isConnected } = useSocket();
  const conversations = useAppSelector((state) => state.conversation.conversations);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingRemoteDescriptionRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);

  const conversationsRef = useRef(conversations);
  const callStateRef = useRef<CallState>({
    status: "idle",
    callId: null,
    callType: null,
    isCaller: false,
  });
  const callStartedAtRef = useRef<number | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callDurationSec, setCallDurationSec] = useState(0);
  const [networkQuality, setNetworkQuality] = useState<
    "good" | "ok" | "poor" | "unknown"
  >("unknown");
  const [callState, setCallState] = useState<CallState>({
    status: "idle",
    callId: null,
    callType: null,
    isCaller: false,
  });

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const getParticipantFromConversation = (conversationId?: string, fallbackId?: string) => {
    if (!conversationId) {
      return fallbackId ? { id: fallbackId, name: "Người dùng" } : undefined;
    }

    const conversation = conversationsRef.current.find(
      (item) => item.id === conversationId
    );

    if (!conversation) {
      return fallbackId ? { id: fallbackId, name: "Người dùng" } : undefined;
    }

    return {
      id: conversation.participant.id,
      name: conversation.participant.fullName || "Người dùng",
      avatarUrl: conversation.participant.avatarUrl,
    };
  };

  const cleanupCall = (notify = false) => {
    const activeCallId = callStateRef.current.callId;
    if (notify && activeCallId) {
      socketService.emit("call:end", { callId: activeCallId, reason: "ended" });
    }

    peerRef.current?.close();
    peerRef.current = null;

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;

    setLocalStream(null);
    setRemoteStream(null);
    pendingRemoteDescriptionRef.current = null;
    pendingIceRef.current = [];
    callStartedAtRef.current = null;
    setCallDurationSec(0);
    setNetworkQuality("unknown");
    setCallState({ status: "idle", callId: null, callType: null, isCaller: false });
  };

  const ensureLocalStream = async (type: CallType) => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "VIDEO",
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  };

  const createPeerConnection = (callId: string) => {
    if (peerRef.current) return peerRef.current;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.emit("call:ice", { callId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        // Wrap in a new MediaStream reference so React always detects a change
        // and re-runs effects/callback-refs even when the same MediaStream object
        // gets new tracks added (e.g., audio track first, then video track)
        const fresh = new MediaStream(stream.getTracks());
        setRemoteStream(fresh);
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current as MediaStream);
      });
    }

    peerRef.current = pc;

    if (pendingRemoteDescriptionRef.current) {
      pc.setRemoteDescription(pendingRemoteDescriptionRef.current).then(() => {
        pendingRemoteDescriptionRef.current = null;
      });
    }

    pendingIceRef.current.forEach((candidate) => {
      pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => undefined);
    });
    pendingIceRef.current = [];

    return pc;
  };

  const startCall = async (payload: StartCallPayload) => {
    if (!payload?.calleeId || !payload?.conversationId || !payload?.callType) {
      message.warning("Không đủ thông tin để gọi");
      return;
    }

    if (!socketService.isConnected()) {
      message.warning("Socket chưa sẵn sàng, vui lòng thử lại");
      return;
    }

    try {
      await ensureLocalStream(payload.callType);
    } catch (err) {
      message.error("Không thể truy cập mic/camera");
      return;
    }

    setCallState({
      status: "outgoing",
      callId: null,
      callType: payload.callType,
      isCaller: true,
      conversationId: payload.conversationId,
      participant: {
        id: payload.calleeId,
        name: payload.participantName || "Người dùng",
        avatarUrl: payload.participantAvatar || null,
      },
    });

    socketService.emit("call:invite", {
      conversationId: payload.conversationId,
      calleeId: payload.calleeId,
      callType: payload.callType,
    });
  };

  const acceptCall = async () => {
    const current = callStateRef.current;
    if (!current.callId || !current.callType) return;

    try {
      await ensureLocalStream(current.callType);
      createPeerConnection(current.callId);
      socketService.emit("call:accept", { callId: current.callId });
      setCallState((prev) => ({ ...prev, status: "active" }));
    } catch (err) {
      message.error("Không thể truy cập mic/camera");
      socketService.emit("call:reject", { callId: current.callId, reason: "media_denied" });
      cleanupCall();
    }
  };

  const rejectCall = () => {
    const current = callStateRef.current;
    if (!current.callId) return cleanupCall();
    socketService.emit("call:reject", { callId: current.callId, reason: "rejected" });
    cleanupCall();
  };

  const cancelCall = () => {
    const current = callStateRef.current;
    if (!current.callId) return cleanupCall();
    socketService.emit("call:cancel", { callId: current.callId });
    cleanupCall();
  };

  const endCall = () => {
    cleanupCall(true);
  };

  useEffect(() => {
    if (callState.status !== "active") {
      return;
    }

    if (!callStartedAtRef.current) {
      callStartedAtRef.current = Date.now();
    }

    const timerId = window.setInterval(() => {
      if (!callStartedAtRef.current) return;
      const elapsed = Math.floor((Date.now() - callStartedAtRef.current) / 1000);
      setCallDurationSec(elapsed);
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [callState.status]);

  useEffect(() => {
    if (callState.status !== "active") {
      return;
    }

    const statsInterval = window.setInterval(async () => {
      const pc = peerRef.current;
      if (!pc) return;

      try {
        const stats = await pc.getStats();
        let rttMs: number | null = null;
        let lossRatio: number | null = null;

        stats.forEach((report) => {
          if (report.type === "candidate-pair" && report.state === "succeeded") {
            if (typeof report.currentRoundTripTime === "number") {
              rttMs = report.currentRoundTripTime * 1000;
            }
          }

          if (report.type === "inbound-rtp" && report.kind === "audio") {
            const received = report.packetsReceived || 0;
            const lost = report.packetsLost || 0;
            if (received + lost > 0) {
              lossRatio = lost / (received + lost);
            }
          }
        });

        if (rttMs === null && lossRatio === null) {
          setNetworkQuality("unknown");
          return;
        }

        const rtt = rttMs ?? 0;
        const loss = lossRatio ?? 0;

        if (rtt < 150 && loss < 0.02) {
          setNetworkQuality("good");
        } else if (rtt < 300 && loss < 0.05) {
          setNetworkQuality("ok");
        } else {
          setNetworkQuality("poor");
        }
      } catch (err) {
        setNetworkQuality("unknown");
      }
    }, 2000);

    return () => window.clearInterval(statsInterval);
  }, [callState.status]);

  useEffect(() => {
    if (!isConnected) return;

    const onIncoming = (payload: { callId: string; fromUserId: string; conversationId: string; callType: CallType }) => {
      const participant = getParticipantFromConversation(payload.conversationId, payload.fromUserId);
      setCallState({
        status: "incoming",
        callId: payload.callId,
        callType: payload.callType,
        isCaller: false,
        conversationId: payload.conversationId,
        participant,
      });
    };

    const onOutgoing = (payload: { callId: string; toUserId: string; conversationId: string; callType: CallType }) => {
      const existing = callStateRef.current;
      const participant = existing.participant || getParticipantFromConversation(payload.conversationId, payload.toUserId);
      setCallState({
        status: "outgoing",
        callId: payload.callId,
        callType: payload.callType,
        isCaller: true,
        conversationId: payload.conversationId,
        participant,
      });
    };

    const onAccepted = async (payload: { callId: string }) => {
      const current = callStateRef.current;
      if (!current.isCaller || current.callId !== payload.callId || !current.callType) return;
      try {
        await ensureLocalStream(current.callType);
        const pc = createPeerConnection(payload.callId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketService.emit("call:offer", { callId: payload.callId, sdp: offer });
        setCallState((prev) => ({ ...prev, status: "active" }));
      } catch (err) {
        message.error("Không thể bắt đầu cuộc gọi");
        cleanupCall();
      }
    };

    const onRejected = (payload: { callId: string }) => {
      if (callStateRef.current.callId !== payload.callId) return;
      message.info("Cuộc gọi bị từ chối");
      cleanupCall();
    };

    const onCanceled = (payload: { callId: string }) => {
      if (callStateRef.current.callId !== payload.callId) return;
      message.info("Cuộc gọi đã bị hủy");
      cleanupCall();
    };

    const onMissed = (payload: { callId: string }) => {
      if (callStateRef.current.callId !== payload.callId) return;
      message.info("Người nhận không trả lời");
      cleanupCall();
    };

    const onEnded = (payload: { callId: string }) => {
      if (callStateRef.current.callId !== payload.callId) return;
      cleanupCall();
    };

    const onOffer = async (payload: { callId: string; fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
      const current = callStateRef.current;
      if (current.callId !== payload.callId || current.isCaller) return;
      const sdp = payload.sdp;
      if (!peerRef.current) {
        pendingRemoteDescriptionRef.current = sdp;
      }

      try {
        await ensureLocalStream(current.callType || "VOICE");
        const pc = createPeerConnection(payload.callId);
        if (pc.signalingState !== "stable") return;
        if (!pc.remoteDescription) {
          await pc.setRemoteDescription(sdp);
        }
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketService.emit("call:answer", { callId: payload.callId, sdp: answer });
      } catch (err) {
        message.error("Không thể nhận cuộc gọi");
        cleanupCall();
      }
    };

    const onAnswer = async (payload: { callId: string; fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
      const current = callStateRef.current;
      if (current.callId !== payload.callId || !current.isCaller) return;
      const pc = peerRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(payload.sdp);
    };

    const onIce = async (payload: { callId: string; fromUserId: string; candidate: RTCIceCandidateInit }) => {
      if (callStateRef.current.callId !== payload.callId) return;
      if (!peerRef.current) {
        pendingIceRef.current.push(payload.candidate);
        return;
      }
      try {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (err) {
        // ignore invalid candidate
      }
    };

    const onError = (payload: { code?: string; message?: string }) => {
      message.error(payload?.message || "Có lỗi khi thực hiện cuộc gọi");
      cleanupCall();
    };

    socketService.on("call:incoming", onIncoming);
    socketService.on("call:outgoing", onOutgoing);
    socketService.on("call:accepted", onAccepted);
    socketService.on("call:rejected", onRejected);
    socketService.on("call:canceled", onCanceled);
    socketService.on("call:missed", onMissed);
    socketService.on("call:ended", onEnded);
    socketService.on("call:offer", onOffer);
    socketService.on("call:answer", onAnswer);
    socketService.on("call:ice", onIce);
    socketService.on("call:error", onError);

    return () => {
      socketService.off("call:incoming", onIncoming);
      socketService.off("call:outgoing", onOutgoing);
      socketService.off("call:accepted", onAccepted);
      socketService.off("call:rejected", onRejected);
      socketService.off("call:canceled", onCanceled);
      socketService.off("call:missed", onMissed);
      socketService.off("call:ended", onEnded);
      socketService.off("call:offer", onOffer);
      socketService.off("call:answer", onAnswer);
      socketService.off("call:ice", onIce);
      socketService.off("call:error", onError);
    };
  }, [isConnected]);

  const value: CallContextValue = {
    callState,
    localStream,
    remoteStream,
    callDurationSec,
    networkQuality,
    startCall,
    acceptCall,
    rejectCall,
    cancelCall,
    endCall,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
