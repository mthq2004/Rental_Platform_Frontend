import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Image, StyleSheet, Modal,
  Dimensions, Animated, Easing, StatusBar,
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useCall } from '@/contexts/CallContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SW } = Dimensions.get('window');

const T = {
  navy0: '#021B32', navy1: '#042C53', navy2: '#0C447C', navy3: '#185FA5',
  blue: '#378ADD', blueLight: '#B5D4F4',
  green: '#059669', red: '#C7202B',
  white: '#FFFFFF', gray400: '#9CA3AF', gray600: '#4B5563',
};

const CallOverlay = () => {
  const {
    callState, callDurationSec,
    isMicMuted, isSpeakerOn, isVideoOff,
    acceptCall, rejectCall, cancelCall, endCall,
    toggleMic, toggleSpeaker, toggleVideo,
  } = useCall();
  const insets = useSafeAreaInsets();
  const [isMinimized, setIsMinimized] = useState(false);

  // Pulse animation
  const pulseAnim = useRef(new Animated.Value(0.8)).current;
  const pulse2 = useRef(new Animated.Value(0.6)).current;
  const pulse3 = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (callState.status === 'incoming' || callState.status === 'outgoing') {
      const mk = (a: Animated.Value, d: number) => Animated.loop(Animated.sequence([
        Animated.delay(d),
        Animated.timing(a, { toValue: 1.6, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(a, { toValue: 0.8, duration: 0, useNativeDriver: true }),
      ]));
      const a1 = mk(pulseAnim, 0), a2 = mk(pulse2, 600), a3 = mk(pulse3, 1200);
      a1.start(); a2.start(); a3.start();
      return () => { a1.stop(); a2.stop(); a3.stop(); };
    }
  }, [callState.status]);

  // Wave animation
  const waveAnims = useRef(Array.from({ length: 20 }, () => new Animated.Value(6))).current;
  useEffect(() => {
    if (callState.status === 'active' && callState.callType === 'VOICE') {
      const anims = waveAnims.map((a, i) => Animated.loop(Animated.sequence([
        Animated.delay(i * 55),
        Animated.timing(a, { toValue: 36, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(a, { toValue: 6, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])));
      anims.forEach(a => a.start());
      return () => anims.forEach(a => a.stop());
    }
  }, [callState.status, callState.callType]);

  useEffect(() => { if (callState.status === 'idle') setIsMinimized(false); }, [callState.status]);

  if (callState.status === 'idle') return null;

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const p = callState.participant;
  const isVideo = callState.callType === 'VIDEO';
  const isIncoming = callState.status === 'incoming';
  const isOutgoing = callState.status === 'outgoing';
  const isActive = callState.status === 'active';
  const statusLabel = isIncoming ? 'Cuộc gọi đến' : isOutgoing ? 'Đang gọi đi...' : 'Đang trong cuộc gọi';
  const statusColor = isActive ? T.green : T.blue;

  // ── Minimized ──
  if (isMinimized) {
    return (
      <View style={[st.miniBubble, { top: insets.top + 8 }]}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => setIsMinimized(false)} style={st.miniBubbleInner}>
          <LinearGradient colors={[T.navy1, T.navy3, '#EA580C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 4 }} />
          <View style={st.miniBody}>
            <View style={{ position: 'relative' }}>
              {p?.avatarUrl ? (
                <Image source={{ uri: p.avatarUrl }} style={st.miniAvatar} />
              ) : (
                <LinearGradient colors={[T.navy3, T.navy1]} style={[st.miniAvatar, { alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: T.white }}>{p?.name?.[0]?.toUpperCase() || '?'}</Text>
                </LinearGradient>
              )}
              <View style={[st.miniDot, { backgroundColor: statusColor }]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1F2937' }} numberOfLines={1}>{p?.name ?? 'Người dùng'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor, marginRight: 4 }} />
                <Text style={{ fontSize: 12, color: T.gray400 }}>
                  {isIncoming ? 'Đang đổ chuông' : isOutgoing ? 'Đang kết nối...' : fmt(callDurationSec)}
                </Text>
              </View>
            </View>
            <Feather name="maximize-2" size={16} color={T.gray600} />
          </View>
          <View style={st.miniActions}>
            {isIncoming && (
              <>
                <TouchableOpacity style={[st.miniBtn, { backgroundColor: '#FEE2E2' }]} onPress={rejectCall}>
                  <MaterialIcons name="call-end" size={14} color={T.red} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: T.red }}>Từ chối</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[st.miniBtn, { backgroundColor: T.navy1 }]} onPress={acceptCall}>
                  <Ionicons name="call" size={14} color={T.white} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: T.white }}>Chấp nhận</Text>
                </TouchableOpacity>
              </>
            )}
            {isOutgoing && (
              <TouchableOpacity style={[st.miniBtn, { backgroundColor: '#FEE2E2' }]} onPress={cancelCall}>
                <MaterialIcons name="call-end" size={14} color={T.red} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: T.red }}>Hủy</Text>
              </TouchableOpacity>
            )}
            {isActive && (
              <TouchableOpacity style={[st.miniBtn, { backgroundColor: T.red }]} onPress={endCall}>
                <MaterialIcons name="call-end" size={13} color={T.white} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: T.white }}>Kết thúc</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Full overlay ──
  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient colors={[T.navy0, T.navy1, T.navy2]} locations={[0, 0.45, 1]} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} style={StyleSheet.absoluteFill} />

        {/* ── Top bar ── */}
        <View style={[st.topBar, { paddingTop: insets.top + 12 }]}>
          <View style={st.statusPill}>
            <View style={[st.dotLive, { backgroundColor: statusColor }]} />
            <Text style={st.statusText}>{statusLabel}</Text>
            {isVideo && <Ionicons name="videocam" size={12} color="rgba(255,255,255,0.5)" style={{ marginLeft: 4 }} />}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {isActive && (
              <TouchableOpacity style={st.topBtn} onPress={() => setIsMinimized(true)}>
                <Feather name="minimize-2" size={16} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Center ── */}
        <View style={st.center}>
          {(isIncoming || isOutgoing) && [pulseAnim, pulse2, pulse3].map((a, i) => (
            <Animated.View key={i} style={[st.pulseRing, {
              width: 130 + i * 40, height: 130 + i * 40, borderRadius: 65 + i * 20,
              transform: [{ scale: a }],
              opacity: a.interpolate({ inputRange: [0.8, 1.6], outputRange: [0.6, 0] }),
            }]} />
          ))}
          <View style={{ marginBottom: 24, position: 'relative' }}>
            {p?.avatarUrl ? (
              <Image source={{ uri: p.avatarUrl }} style={st.avatarLg} />
            ) : (
              <LinearGradient colors={[T.navy3, T.navy1]} style={[st.avatarLg, { alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 44, fontWeight: '800', color: T.white }}>{p?.name?.[0]?.toUpperCase() || '?'}</Text>
              </LinearGradient>
            )}
            <View style={[st.typeBadge, { backgroundColor: isVideo ? '#EA580C' : T.navy3 }]}>
              <Ionicons name={isVideo ? 'videocam' : 'call'} size={14} color={T.white} />
            </View>
          </View>
          <Text style={st.callerName}>{p?.name ?? 'Người dùng'}</Text>
          {isActive && (
            <View style={st.durationRow}>
              <View style={st.durationPill}>
                <Ionicons name="time-outline" size={14} color={T.blueLight} />
                <Text style={st.durationText}>{fmt(callDurationSec)}</Text>
              </View>
            </View>
          )}
          {(isOutgoing || isIncoming) && (
            <Text style={{ marginTop: 14, fontSize: 13, color: 'rgba(181,212,244,0.6)', fontWeight: '500' }}>
              {isOutgoing ? 'Đang chờ phản hồi...' : 'Nhấn chấp nhận để kết nối'}
            </Text>
          )}
          {isActive && !isVideo && (
            <View style={st.waveWrap}>
              {waveAnims.map((a, i) => <Animated.View key={i} style={[st.waveBar, { height: a }]} />)}
            </View>
          )}
        </View>

        {/* ── Bottom controls ── */}
        <View style={[st.bottom, { paddingBottom: insets.bottom + 24 }]}>
          {isIncoming && (
            <View style={st.primaryRow}>
              <PrimaryBtn icon="call-end" iconLib="material" color={T.red} label="Từ chối" onPress={rejectCall} />
              <PrimaryBtn icon="chatbubble-ellipses" color="#F3F4F6" iconColor={T.gray600} label="Nhắn tin" onPress={() => setIsMinimized(true)} />
              <PrimaryBtn icon="call" color={T.navy2} label="Chấp nhận" onPress={acceptCall} glow />
            </View>
          )}
          {isOutgoing && (
            <View style={{ alignItems: 'center' }}>
              <PrimaryBtn icon="call-end" iconLib="material" color={T.red} label="Hủy cuộc gọi" onPress={cancelCall} />
            </View>
          )}
          {isActive && (
            <View style={{ alignItems: 'center' }}>
              <View style={st.ctrlRow}>
                <CtrlBtn icon={isMicMuted ? 'mic-off' : 'mic'} active={isMicMuted} onPress={toggleMic} label={isMicMuted ? 'Bật mic' : 'Tắt mic'} />
                <CtrlBtn icon={isSpeakerOn ? 'volume-high' : 'volume-mute'} active={isSpeakerOn} onPress={toggleSpeaker} label={isSpeakerOn ? 'Loa ngoài' : 'Loa tai'} />
                {isVideo && <CtrlBtn icon={isVideoOff ? 'videocam-off' : 'videocam'} active={isVideoOff} onPress={toggleVideo} label={isVideoOff ? 'Bật cam' : 'Tắt cam'} />}
              </View>
              <TouchableOpacity style={st.endBtn} onPress={endCall}>
                <MaterialIcons name="call-end" size={26} color={T.white} />
              </TouchableOpacity>
              <Text style={{ marginTop: 10, fontSize: 12, fontWeight: '600', color: T.gray400 }}>Kết thúc</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const PrimaryBtn = ({ icon, iconLib, color, iconColor, label, onPress, glow }: any) => (
  <TouchableOpacity onPress={onPress} style={{ alignItems: 'center' }}>
    <View style={[st.primaryBtnCircle, { backgroundColor: color }, glow && st.glow]}>
      {iconLib === 'material'
        ? <MaterialIcons name={icon} size={24} color={iconColor || T.white} />
        : <Ionicons name={icon} size={24} color={iconColor || T.white} />}
    </View>
    <Text style={{ marginTop: 10, fontSize: 12, fontWeight: '600', color: T.gray400 }}>{label}</Text>
  </TouchableOpacity>
);

const CtrlBtn = ({ icon, active, onPress, label }: any) => (
  <TouchableOpacity onPress={onPress} style={{ alignItems: 'center' }}>
    <View style={[st.ctrlBtn, active && st.ctrlActive]}>
      <Ionicons name={icon} size={22} color={active ? T.blueLight : 'rgba(255,255,255,0.8)'} />
    </View>
    <Text style={{ marginTop: 6, fontSize: 11, fontWeight: '500', color: 'rgba(181,212,244,0.6)' }}>{label}</Text>
  </TouchableOpacity>
);

const st = StyleSheet.create({
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
  statusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  dotLive: { width: 7, height: 7, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  topBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', borderWidth: 1.5, borderColor: 'rgba(181,212,244,0.2)' },
  avatarLg: { width: 120, height: 120, borderRadius: 60, borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  typeBadge: { position: 'absolute', bottom: -2, right: -2, width: 32, height: 32, borderRadius: 16, borderWidth: 3, borderColor: T.navy0, alignItems: 'center', justifyContent: 'center' },
  callerName: { fontSize: 26, fontWeight: '800', color: T.white, letterSpacing: -0.5, textAlign: 'center' },
  durationRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center' },
  durationPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  durationText: { fontSize: 18, fontWeight: '700', color: T.blueLight },
  waveWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 60, marginTop: 32, gap: 4 },
  waveBar: { width: 4, borderRadius: 2, backgroundColor: T.blue, opacity: 0.7 },
  bottom: { paddingHorizontal: 24 },
  primaryRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 32 },
  primaryBtnCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  glow: { shadowColor: T.navy2, shadowOpacity: 0.5, shadowRadius: 16, elevation: 8 },
  ctrlRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 18, marginBottom: 28 },
  ctrlBtn: { width: 54, height: 54, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  ctrlActive: { backgroundColor: 'rgba(55,138,221,0.2)', borderColor: 'rgba(55,138,221,0.3)' },
  endBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: T.red, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  miniBubble: { position: 'absolute', left: 12, right: 12, zIndex: 9999 },
  miniBubbleInner: { borderRadius: 18, backgroundColor: T.white, overflow: 'hidden', elevation: 12 },
  miniBody: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  miniAvatar: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  miniDot: { position: 'absolute', bottom: 0, right: 0, width: 13, height: 13, borderRadius: 7, borderWidth: 2, borderColor: T.white },
  miniActions: { flexDirection: 'row', paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  miniBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 11, gap: 6 },
});

export default CallOverlay;
