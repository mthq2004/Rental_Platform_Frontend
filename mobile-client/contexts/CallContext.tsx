import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import socketService from '@/services/chat.socket';
import { useAppSelector } from '@/store/hook';
import { Alert, Vibration, NativeModules } from 'react-native';
import { useSocket } from '@/contexts/ChatSocketContext';

// Safe import — WebRTC may not be available in Expo Go
let mediaDevices: any = null;
let RNMediaStream: any = null;
let RTCPeerConnection: any = null;
let RTCIceCandidate: any = null;
let RTCSessionDescription: any = null;
try {
  if (NativeModules.WebRTCModule) {
    const webrtc = require('react-native-webrtc');
    mediaDevices = webrtc.mediaDevices;
    RNMediaStream = webrtc.MediaStream;
    RTCPeerConnection = webrtc.RTCPeerConnection;
    RTCIceCandidate = webrtc.RTCIceCandidate;
    RTCSessionDescription = webrtc.RTCSessionDescription;
  }
} catch {
  // WebRTC not available
}

export type CallType = 'VOICE' | 'VIDEO';
export type CallStatus = 'idle' | 'incoming' | 'outgoing' | 'active';

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
  callDurationSec: number;
  isMicMuted: boolean;
  isSpeakerOn: boolean;
  isVideoOff: boolean;
  localStream: any;
  remoteStream: any;
  startCall: (payload: StartCallPayload) => Promise<void>;
  acceptCall: () => void;
  rejectCall: () => void;
  cancelCall: () => void;
  endCall: () => void;
  toggleMic: () => void;
  toggleSpeaker: () => void;
  toggleVideo: () => void;
};

const CallContext = createContext<CallContextValue | null>(null);

export const useCall = () => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within CallProvider');
  return ctx;
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const conversations = useAppSelector((state) => state.conversation.conversations);
  const conversationsRef = useRef(conversations);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

  const { isConnected } = useSocket();

  const callStateRef = useRef<CallState>({ status: 'idle', callId: null, callType: null, isCaller: false });
  const callStartedAtRef = useRef<number | null>(null);

  const [callDurationSec, setCallDurationSec] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callState, setCallState] = useState<CallState>({ status: 'idle', callId: null, callType: null, isCaller: false });

  // WebRTC & Media stream refs
  const peerRef = useRef<any>(null);
  const pendingRemoteDescriptionRef = useRef<any>(null);
  const pendingIceRef = useRef<any[]>([]);
  const localStreamRef = useRef<any>(null);
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);

  useEffect(() => { callStateRef.current = callState; }, [callState]);

  const getParticipant = (conversationId?: string, fallbackId?: string) => {
    if (!conversationId) return fallbackId ? { id: fallbackId, name: 'Người dùng' } : undefined;
    const conv = conversationsRef.current.find((c) => c.id === conversationId);
    if (!conv) return fallbackId ? { id: fallbackId, name: 'Người dùng' } : undefined;
    return { id: conv.participant.id, name: conv.participant.fullName || 'Người dùng', avatarUrl: conv.participant.avatarUrl };
  };

  const cleanupCall = (notify = false) => {
    const activeCallId = callStateRef.current.callId;
    if (notify && activeCallId) {
      socketService.emit('call:end', { callId: activeCallId, reason: 'ended' });
    }
    
    // Cleanup WebRTC
    peerRef.current?.close();
    peerRef.current = null;
    pendingRemoteDescriptionRef.current = null;
    pendingIceRef.current = [];

    // Stop all media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t: any) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    
    setRemoteStream(null);
    callStartedAtRef.current = null;
    setCallDurationSec(0);
    setIsMicMuted(false);
    setIsSpeakerOn(false);
    setIsVideoOff(false);
    setCallState({ status: 'idle', callId: null, callType: null, isCaller: false });
  };

  const ensureLocalStream = async (type: CallType) => {
    if (localStreamRef.current) return localStreamRef.current;
    if (!mediaDevices) return null; // WebRTC not available
    const isVideo = type === 'VIDEO';
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: isVideo ? { facingMode: 'user', width: 640, height: 480 } : false,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  };

  const createPeerConnection = (callId: string) => {
    if (peerRef.current) return peerRef.current;
    if (!RTCPeerConnection) return null; // WebRTC not available

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.onicecandidate = (event: any) => {
      if (event.candidate) {
        socketService.emit('call:ice', { callId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event: any) => {
      const [stream] = event.streams;
      if (stream) {
        setRemoteStream(stream);
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track: any) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    peerRef.current = pc;

    if (pendingRemoteDescriptionRef.current) {
      pc.setRemoteDescription(pendingRemoteDescriptionRef.current).then(() => {
        pendingRemoteDescriptionRef.current = null;
      });
    }

    pendingIceRef.current.forEach((candidate) => {
      pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    });
    pendingIceRef.current = [];

    return pc;
  };

  const startCall = async (payload: StartCallPayload) => {
    if (!payload?.calleeId || !payload?.conversationId || !payload?.callType) {
      Alert.alert('Lỗi', 'Không đủ thông tin để gọi');
      return;
    }
    if (!socketService.isConnected()) {
      Alert.alert('Lỗi', 'Socket chưa kết nối, vui lòng thử lại');
      return;
    }
    setCallState({
      status: 'outgoing', callId: null, callType: payload.callType, isCaller: true,
      conversationId: payload.conversationId,
      participant: { id: payload.calleeId, name: payload.participantName || 'Người dùng', avatarUrl: payload.participantAvatar || null },
    });
    socketService.emit('call:invite', { conversationId: payload.conversationId, calleeId: payload.calleeId, callType: payload.callType });
  };

  const acceptCall = async () => {
    const current = callStateRef.current;
    if (!current.callId || !current.callType) return;
    try {
      await ensureLocalStream(current.callType);
      createPeerConnection(current.callId);
      socketService.emit('call:accept', { callId: current.callId });
      setCallState((prev) => ({ ...prev, status: 'active' }));
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể truy cập camera/mic');
      socketService.emit('call:reject', { callId: current.callId, reason: 'media_denied' });
      cleanupCall();
    }
  };

  const rejectCall = () => {
    const current = callStateRef.current;
    if (!current.callId) return cleanupCall();
    socketService.emit('call:reject', { callId: current.callId, reason: 'rejected' });
    cleanupCall();
  };

  const cancelCall = () => {
    const current = callStateRef.current;
    if (!current.callId) return cleanupCall();
    socketService.emit('call:cancel', { callId: current.callId });
    cleanupCall();
  };

  const endCall = () => cleanupCall(true);

  const toggleMic = () => {
    setIsMicMuted((prev) => {
      const next = !prev;
      // Control actual audio tracks
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track: any) => {
          track.enabled = !next; // muted=true means track.enabled=false
        });
      }
      // Notify remote
      const callId = callStateRef.current.callId;
      if (callId) socketService.emit('call:toggle-mic', { callId, muted: next });
      return next;
    });
  };

  const toggleSpeaker = () => setIsSpeakerOn((v) => !v);

  const toggleVideo = () => {
    setIsVideoOff((prev) => {
      const next = !prev;
      // Control actual video tracks
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((track: any) => {
          track.enabled = !next; // videoOff=true means track.enabled=false
        });
      }
      // Notify remote
      const callId = callStateRef.current.callId;
      if (callId) socketService.emit('call:toggle-video', { callId, videoOff: next });
      return next;
    });
  };

  // Duration timer
  useEffect(() => {
    if (callState.status !== 'active') return;
    if (!callStartedAtRef.current) callStartedAtRef.current = Date.now();
    const id = setInterval(() => {
      if (!callStartedAtRef.current) return;
      setCallDurationSec(Math.floor((Date.now() - callStartedAtRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [callState.status]);

  // Vibrate on incoming
  useEffect(() => {
    if (callState.status === 'incoming') {
      Vibration.vibrate([0, 500, 200, 500, 200, 500], true);
      return () => Vibration.cancel();
    }
  }, [callState.status]);

  // Socket listeners
  useEffect(() => {
    if (!isConnected) return;

    const onIncoming = (p: any) => {
      const participant = getParticipant(p.conversationId, p.fromUserId);
      setCallState({ status: 'incoming', callId: p.callId, callType: p.callType, isCaller: false, conversationId: p.conversationId, participant });
    };
    const onOutgoing = (p: any) => {
      const existing = callStateRef.current;
      const participant = existing.participant || getParticipant(p.conversationId, p.toUserId);
      setCallState({ status: 'outgoing', callId: p.callId, callType: p.callType, isCaller: true, conversationId: p.conversationId, participant });
    };
    const onAccepted = async (p: any) => {
      const current = callStateRef.current;
      if (!current.isCaller) return;
      if (current.callId && current.callId !== p.callId) return;
      try {
        await ensureLocalStream(current.callType!);
        const pc = createPeerConnection(p.callId);
        if (pc) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketService.emit("call:offer", { callId: p.callId, sdp: offer });
        }
        setCallState((prev) => ({ ...prev, callId: p.callId, status: 'active' }));
      } catch (err) {
        cleanupCall();
      }
    };
    const onRejected = (p: any) => { const cid = callStateRef.current.callId; if (cid && cid !== p.callId) return; cleanupCall(); };
    const onCanceled = (p: any) => { const cid = callStateRef.current.callId; if (cid && cid !== p.callId) return; cleanupCall(); };
    const onMissed = (p: any) => { const cid = callStateRef.current.callId; if (cid && cid !== p.callId) return; cleanupCall(); };
    const onEnded = (p: any) => { const cid = callStateRef.current.callId; if (cid && cid !== p.callId) return; cleanupCall(); };
    
    // WebRTC Signaling Events
    const onOffer = async (p: any) => {
      const current = callStateRef.current;
      if (current.callId !== p.callId || current.isCaller) return;
      if (!peerRef.current) pendingRemoteDescriptionRef.current = p.sdp;
      
      try {
        await ensureLocalStream(current.callType || 'VOICE');
        const pc = createPeerConnection(p.callId);
        if (pc && pc.signalingState === 'stable' && !pc.remoteDescription) {
          await pc.setRemoteDescription(p.sdp);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketService.emit("call:answer", { callId: p.callId, sdp: answer });
        }
      } catch (err) {
        cleanupCall();
      }
    };

    const onAnswer = async (p: any) => {
      const current = callStateRef.current;
      if (current.callId !== p.callId || !current.isCaller) return;
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(p.sdp).catch(() => {});
      }
    };

    const onIce = async (p: any) => {
      if (callStateRef.current.callId !== p.callId) return;
      if (!peerRef.current) {
        pendingIceRef.current.push(p.candidate);
        return;
      }
      try {
        if (RTCIceCandidate) {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(p.candidate));
        }
      } catch (err) {}
    };

    const onError = (p: any) => { Alert.alert('Lỗi cuộc gọi', p?.message || 'Có lỗi xảy ra'); cleanupCall(); };

    socketService.on('call:incoming', onIncoming);
    socketService.on('call:outgoing', onOutgoing);
    socketService.on('call:accepted', onAccepted);
    socketService.on('call:rejected', onRejected);
    socketService.on('call:canceled', onCanceled);
    socketService.on('call:missed', onMissed);
    socketService.on('call:ended', onEnded);
    socketService.on('call:offer', onOffer);
    socketService.on('call:answer', onAnswer);
    socketService.on('call:ice', onIce);
    socketService.on('call:error', onError);

    return () => {
      socketService.off('call:incoming', onIncoming);
      socketService.off('call:outgoing', onOutgoing);
      socketService.off('call:accepted', onAccepted);
      socketService.off('call:rejected', onRejected);
      socketService.off('call:canceled', onCanceled);
      socketService.off('call:missed', onMissed);
      socketService.off('call:ended', onEnded);
      socketService.off('call:offer', onOffer);
      socketService.off('call:answer', onAnswer);
      socketService.off('call:ice', onIce);
      socketService.off('call:error', onError);
    };
  }, [isConnected]);

  return (
    <CallContext.Provider value={{
      callState, callDurationSec, isMicMuted, isSpeakerOn, isVideoOff, localStream, remoteStream,
      startCall, acceptCall, rejectCall, cancelCall, endCall,
      toggleMic, toggleSpeaker, toggleVideo,
    }}>
      {children}
    </CallContext.Provider>
  );
};
