import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import socketService from '@/services/chat.socket';
import { useAppSelector } from '@/store/hook';
import { Alert, Vibration } from 'react-native';
import { useSocket } from '@/contexts/ChatSocketContext';

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
    callStartedAtRef.current = null;
    setCallDurationSec(0);
    setIsMicMuted(false);
    setIsSpeakerOn(false);
    setIsVideoOff(false);
    setCallState({ status: 'idle', callId: null, callType: null, isCaller: false });
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

  const acceptCall = () => {
    const current = callStateRef.current;
    if (!current.callId || !current.callType) return;
    socketService.emit('call:accept', { callId: current.callId });
    setCallState((prev) => ({ ...prev, status: 'active' }));
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
  const toggleMic = () => setIsMicMuted((v) => !v);
  const toggleSpeaker = () => setIsSpeakerOn((v) => !v);
  const toggleVideo = () => setIsVideoOff((v) => !v);

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
    const onAccepted = (p: any) => {
      const current = callStateRef.current;
      if (!current.isCaller) return;
      if (current.callId && current.callId !== p.callId) return;
      setCallState((prev) => ({ ...prev, callId: p.callId, status: 'active' }));
    };
    const onRejected = (p: any) => { const cid = callStateRef.current.callId; if (cid && cid !== p.callId) return; cleanupCall(); };
    const onCanceled = (p: any) => { const cid = callStateRef.current.callId; if (cid && cid !== p.callId) return; cleanupCall(); };
    const onMissed = (p: any) => { const cid = callStateRef.current.callId; if (cid && cid !== p.callId) return; cleanupCall(); };
    const onEnded = (p: any) => { const cid = callStateRef.current.callId; if (cid && cid !== p.callId) return; cleanupCall(); };
    const onError = (p: any) => { Alert.alert('Lỗi cuộc gọi', p?.message || 'Có lỗi xảy ra'); cleanupCall(); };

    socketService.on('call:incoming', onIncoming);
    socketService.on('call:outgoing', onOutgoing);
    socketService.on('call:accepted', onAccepted);
    socketService.on('call:rejected', onRejected);
    socketService.on('call:canceled', onCanceled);
    socketService.on('call:missed', onMissed);
    socketService.on('call:ended', onEnded);
    socketService.on('call:error', onError);

    return () => {
      socketService.off('call:incoming', onIncoming);
      socketService.off('call:outgoing', onOutgoing);
      socketService.off('call:accepted', onAccepted);
      socketService.off('call:rejected', onRejected);
      socketService.off('call:canceled', onCanceled);
      socketService.off('call:missed', onMissed);
      socketService.off('call:ended', onEnded);
      socketService.off('call:error', onError);
    };
  }, [isConnected]);

  return (
    <CallContext.Provider value={{
      callState, callDurationSec, isMicMuted, isSpeakerOn, isVideoOff,
      startCall, acceptCall, rejectCall, cancelCall, endCall,
      toggleMic, toggleSpeaker, toggleVideo,
    }}>
      {children}
    </CallContext.Provider>
  );
};
