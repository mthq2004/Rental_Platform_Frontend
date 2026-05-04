import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  Image, Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { useColorScheme } from 'nativewind';
import {
  CreditCard, Camera, User, Zap,
  ChevronRight, Check, Shield,
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { verifyKyc } from '@/store/slices/kyc.slice';
import { getProfile } from '@/store/slices/auth.slice';
import { Toast } from '@/components/Notification';

const { width: SW, height: SH } = Dimensions.get('window');

// CCCD ratio 85.60 x 53.98mm ≈ 1.586:1
const CARD_W = SW * 0.85;
const CARD_H = CARD_W / 1.586;
// Selfie: oval — mở rộng gần full màn hình
const OVAL_W = SW * 0.78;
const OVAL_H = OVAL_W * 1.4;

type Step = 1 | 2 | 3;

const STEP_CFG: Record<Step, { title: string; sub: string; hint: string; icon: any }> = {
  1: { title: 'Mặt trước CCCD', sub: 'BƯỚC 1/3', hint: 'Đặt mặt trước CCCD vào khung hình', icon: CreditCard },
  2: { title: 'Mặt sau CCCD', sub: 'BƯỚC 2/3', hint: 'Đặt mặt sau CCCD vào khung hình', icon: CreditCard },
  3: { title: 'Ảnh khuôn mặt', sub: 'BƯỚC 3/3', hint: 'Đưa khuôn mặt vào khung hình', icon: User },
};

export default function EkycCaptureScreen() {
  const isDark = useColorScheme().colorScheme === 'dark';
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((s) => s.kyc);
  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef = useRef<any>(null);
  const [step, setStep] = useState<Step>(1);
  const [imgs, setImgs] = useState<{ front: string | null; back: string | null; selfie: string | null }>({
    front: null, back: null, selfie: null,
  });
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [capturing, setCapturing] = useState(false);

  const showToast = (m: string, t = 'success') => setToast({ visible: true, message: m, type: t });
  const hideToast = () => setToast((p) => ({ ...p, visible: false }));

  const cfg = STEP_CFG[step];
  const key = step === 1 ? 'front' : step === 2 ? 'back' : 'selfie';
  const curImg = imgs[key];
  const isSelfie = step === 3;

  // Frame layout (center of screen) — used to calculate crop
  const frameW = isSelfie ? OVAL_W : CARD_W;
  const frameH = isSelfie ? OVAL_H : CARD_H;

  const cropPhoto = async (uri: string) => {
    // Get actual photo size
    const { width: pw, height: ph } = await new Promise<{ width: number; height: number }>((res) => {
      Image.getSize(uri, (w, h) => res({ width: w, height: h }));
    });

    // Camera preview fills the screen, so compute scale
    const scaleX = pw / SW;
    const scaleY = ph / SH;

    // Frame center position on screen
    const fx = (SW - frameW) / 2;
    const fy = (SH - frameH) / 2;

    const cropX = Math.max(0, Math.round(fx * scaleX));
    const cropY = Math.max(0, Math.round(fy * scaleY));
    const cropW = Math.min(pw - cropX, Math.round(frameW * scaleX));
    const cropH = Math.min(ph - cropY, Math.round(frameH * scaleY));

    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ crop: { originX: cropX, originY: cropY, width: cropW, height: cropH } }],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  };

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9, skipProcessing: false });
      const croppedUri = await cropPhoto(photo.uri);
      setImgs((p) => ({ ...p, [key]: croppedUri }));
    } catch (e) {
      showToast('Chụp ảnh thất bại', 'error');
    }
    setCapturing(false);
  };



  const handleNext = () => {
    if (!curImg) { showToast('Vui lòng chụp ảnh trước', 'error'); return; }
    if (step < 3) setStep((p) => (p + 1) as Step);
    else handleSubmit();
  };

  const handleRetake = () => setImgs((p) => ({ ...p, [key]: null }));

  const handleSubmit = async () => {
    if (!imgs.front || !imgs.back || !imgs.selfie) {
      showToast('Vui lòng hoàn tất tất cả các bước', 'error'); return;
    }
    try {
      const fd = new FormData();
      // Backend dùng FilesInterceptor('files', 3) — tất cả phải cùng field name 'files'
      // Thứ tự: selfie → back → front (giống web client)
      fd.append('files', { uri: imgs.selfie, name: `kyc_selfie_${Date.now()}.jpg`, type: 'image/jpeg' } as any);
      fd.append('files', { uri: imgs.back, name: `kyc_back_${Date.now()}.jpg`, type: 'image/jpeg' } as any);
      fd.append('files', { uri: imgs.front, name: `kyc_front_${Date.now()}.jpg`, type: 'image/jpeg' } as any);

      const response = await dispatch(verifyKyc(fd)).unwrap();
      await dispatch(getProfile()).unwrap();

      if (response?.status === "rejected") {
        showToast(response?.rejectionReason || "Hồ sơ KYC bị từ chối. Vui lòng thử lại.", 'error');
        return;
      }

      // router.replace to success screen
      router.replace('/(profile)/ekyc/success');
    } catch (err: any) {
      showToast(typeof err === 'string' ? err : 'Xác thực eKYC thất bại', 'error');
    }
  };

  // Permission screen
  if (!permission?.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="light-content" />
        <Shield size={48} color="#0d9488" />
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 16 }}>Cấp quyền Camera</Text>
        <Text style={{ color: '#9ca3af', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 }}>
          Ứng dụng cần quyền truy cập camera để chụp ảnh xác thực danh tính.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={[S.ctaBtn, { marginTop: 24 }]}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Cho phép truy cập</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: '#6b7280' }}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Camera hoặc Preview ảnh */}
      {curImg ? (
        <Image source={{ uri: curImg }} style={StyleSheet.absoluteFill} resizeMode="contain" />
      ) : (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={isSelfie ? 'front' : 'back'}
        />
      )}

      {/* Overlay mask — chỉ hiện khi chưa chụp */}
      {!curImg && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Top overlay */}
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />

          {/* Middle row */}
          <View style={{ flexDirection: 'row', height: frameH }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
            {/* Transparent hole */}
            <View style={{
              width: frameW, height: frameH,
              borderWidth: 2.5, borderColor: '#0d9488',
              borderRadius: isSelfie ? frameW : 14,
              backgroundColor: 'transparent',
            }}>
              {/* Corner markers for CCCD */}
              {!isSelfie && (
                <>
                  <View style={[S.corner, { top: -1, left: -1, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 14 }]} />
                  <View style={[S.corner, { top: -1, right: -1, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 14 }]} />
                  <View style={[S.corner, { bottom: -1, left: -1, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 14 }]} />
                  <View style={[S.corner, { bottom: -1, right: -1, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 14 }]} />
                </>
              )}
            </View>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
          </View>

          {/* Bottom overlay */}
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
        </View>
      )}

      {/* Header */}
      <SafeAreaView edges={['top']} style={S.headerWrap}>
        <View style={S.header}>
          <TouchableOpacity
            onPress={() => step > 1 ? setStep((p) => (p - 1) as Step) : router.back()}
            style={S.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Identity Verification</Text>
            <Text style={{ color: '#0d9488', fontSize: 11, fontWeight: '600', marginTop: 2 }}>{cfg.sub}</Text>
          </View>
          <Shield size={22} color="#0d9488" />
        </View>

        {/* Progress */}
        <View style={S.progressBar}>
          <View style={[S.progressFill, { width: `${(step / 3) * 100}%` }]} />
        </View>
      </SafeAreaView>

      {/* Hint text */}
      <View style={S.hintWrap}>
        <View style={S.hintBadge}>
          <cfg.icon size={14} color="#0d9488" />
          <Text style={S.hintText}>{cfg.hint}</Text>
        </View>
      </View>

      {/* Bottom controls */}
      <SafeAreaView edges={['bottom']} style={S.bottomWrap}>
        {curImg ? (
          <View style={S.bottomInner}>
            <View style={S.previewBadge}>
              <Check size={16} color="#0d9488" />
              <Text style={{ color: '#0d9488', fontWeight: '600', marginLeft: 6, fontSize: 13 }}>Ảnh đã chụp thành công</Text>
            </View>
            <View style={S.actionRow}>
              <TouchableOpacity onPress={handleRetake} style={S.retakeBtn}>
                <Camera size={20} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 8 }}>Chụp lại</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNext} disabled={loading} style={[S.ctaBtn, { opacity: loading ? 0.7 : 1 }]}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, marginRight: 4 }}>
                      {step === 3 ? 'Hoàn tất' : 'Tiếp tục'}
                    </Text>
                    <ChevronRight size={18} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={S.bottomInner}>
            <Text style={{ color: '#d1d5db', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
              {cfg.hint}
            </Text>
            <View style={S.captureRow}>
              <View style={S.placeholderSideBtn} />
              <TouchableOpacity onPress={handleCapture} disabled={capturing} style={S.shutterBtn}>
                {capturing ? (
                  <ActivityIndicator color="#0d9488" size="large" />
                ) : (
                  <View style={S.shutterInner} />
                )}
              </TouchableOpacity>
              <TouchableOpacity style={S.sideBtn}>
                <Zap size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Security */}
        <View style={S.secFooter}>
          <Shield size={12} color="#6b7280" />
          <Text style={{ color: '#6b7280', fontSize: 10, fontWeight: '600', letterSpacing: 1, marginLeft: 6 }}>
            END-TO-END ENCRYPTED
          </Text>
        </View>
      </SafeAreaView>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} duration={3000} onHide={hideToast} />
    </View>
  );
}

const S = StyleSheet.create({
  headerWrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  progressBar: { height: 3, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 20, borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: '#0d9488', borderRadius: 2 },
  hintWrap: { position: 'absolute', top: 120, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  hintBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24 },
  hintText: { color: '#fff', fontWeight: '600', fontSize: 14, marginLeft: 8 },
  bottomWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10 },
  bottomInner: { paddingHorizontal: 20, paddingBottom: 8 },
  previewBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 12 },
  retakeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)' },
  ctaBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: '#0d9488' },
  captureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 30 },
  sideBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  placeholderSideBtn: { width: 50, height: 50 },
  shutterBtn: { width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)', justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff' },
  secFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: '#14b8a6' },
});
