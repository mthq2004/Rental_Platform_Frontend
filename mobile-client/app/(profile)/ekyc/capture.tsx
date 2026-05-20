import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  Image, Alert, ActivityIndicator, Dimensions, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useColorScheme } from 'nativewind';
import {
  CreditCard, Camera, User, Zap,
  ChevronRight, Check, Shield, Lock,
  AlertTriangle, Clock, CheckCircle2, ShieldCheck
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { extractOcr, verifyFace, saveForAdmin } from '@/store/slices/kyc.slice';
import { getProfile } from '@/store/slices/auth.slice';
import { Toast } from '@/components/Notification';

const { width: SW, height: SH } = Dimensions.get('window');

// CCCD ratio 85.60 x 53.98mm ≈ 1.586:1
const CARD_W = SW * 0.85;
const CARD_H = CARD_W / 1.586;
// Selfie: oval
const OVAL_W = SW * 0.78;
const OVAL_H = OVAL_W * 1.4;

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_CFG: Record<number, { title: string; sub: string; hint: string; icon: any }> = {
  2: { title: 'Mặt trước CCCD', sub: 'BƯỚC 2/5', hint: 'Đặt mặt trước CCCD vào khung hình', icon: CreditCard },
  3: { title: 'Mặt sau CCCD', sub: 'BƯỚC 3/5', hint: 'Đặt mặt sau CCCD vào khung hình', icon: CreditCard },
  4: { title: 'Ảnh khuôn mặt', sub: 'BƯỚC 4/5', hint: 'Đưa khuôn mặt vào khung hình', icon: User },
};

export default function EkycCaptureScreen() {
  const isDark = useColorScheme().colorScheme === 'dark';
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef = useRef<any>(null);
  const [step, setStep] = useState<Step>(1);
  const [imgs, setImgs] = useState<{ front: string | null; back: string | null; selfie: string | null }>({
    front: null, back: null, selfie: null,
  });
  
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [capturing, setCapturing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [localKycData, setLocalKycData] = useState<any>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const showToast = (m: string, t = 'success') => setToast({ visible: true, message: m, type: t });
  const hideToast = () => setToast((p) => ({ ...p, visible: false }));

  // Automatically trigger sequential verification when arriving at Step 5
  useEffect(() => {
    if (step === 5) {
      runVerification();
    }
  }, [step]);

  const runVerification = async () => {
    if (!imgs.front || !imgs.back || !imgs.selfie) {
      showToast('Vui lòng hoàn tất việc chụp ảnh các bước', 'error');
      setStep(1);
      return;
    }
    setVerifying(true);
    setVerifyError(null);
    try {
      // 1. Call extractOcr
      const ocrFormData = new FormData();
      ocrFormData.append('files', { uri: imgs.back, name: `back_${Date.now()}.jpg`, type: 'image/jpeg' } as any);
      ocrFormData.append('files', { uri: imgs.front, name: `front_${Date.now()}.jpg`, type: 'image/jpeg' } as any);

      const ocrResponse = await dispatch(extractOcr(ocrFormData)).unwrap();
      const kycId = ocrResponse?.kycDocumentId || ocrResponse?.data?.kycDocumentId;

      if (!kycId) {
        throw new Error('Không thể nhận diện thông tin trên thẻ. Vui lòng chụp lại rõ nét hơn.');
      }

      // 2. Call verifyFace
      const faceResponse = await dispatch(verifyFace({ selfieUri: imgs.selfie, kycId })).unwrap();
      
      setLocalKycData(faceResponse);
      
      // 3. Refresh user profile
      await dispatch(getProfile()).unwrap();

      if (faceResponse?.status === 'verified') {
        showToast('Xác thực eKYC thành công!', 'success');
      } else if (faceResponse?.status === 'in_review') {
        showToast('KYC đang được quản trị viên thẩm định', 'info');
      } else {
        showToast(faceResponse?.rejectionReason || 'Xác thực thất bại', 'error');
      }
    } catch (err: any) {
      console.error('eKYC Error:', err);
      setVerifyError(typeof err === 'string' ? err : err.message || 'Xác thực eKYC thất bại.');
      setLocalKycData({ status: 'failed', score: 0 });
    } finally {
      setVerifying(false);
    }
  };

  const handleSendToAdmin = async () => {
    const kycId = localKycData?.kycDocumentId || localKycData?.data?.kycDocumentId;
    if (!kycId) {
      showToast('Không tìm thấy mã hồ sơ KYC để gửi.', 'error');
      return;
    }
    setVerifying(true);
    try {
      await dispatch(saveForAdmin(kycId)).unwrap();
      await dispatch(getProfile()).unwrap();
      setLocalKycData((prev: any) => ({ ...prev, status: 'in_review' }));
      showToast('Gửi yêu cầu thành công!', 'success');
    } catch (err: any) {
      showToast(typeof err === 'string' ? err : 'Gửi yêu cầu thất bại.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleRetry = () => {
    setLocalKycData(null);
    setVerifyError(null);
    setImgs((prev) => ({ ...prev, selfie: null }));
    setStep(4);
  };

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });
      setImgs((p) => ({ ...p, [key]: photo.uri }));
    } catch (e) {
      showToast('Chụp ảnh thất bại', 'error');
    }
    setCapturing(false);
  };

  const handleNext = () => {
    if (step >= 2 && step <= 4 && !curImg) {
      showToast('Vui lòng chụp ảnh trước', 'error');
      return;
    }
    if (step < 5) {
      setStep((p) => (p + 1) as Step);
    }
  };

  const handleRetake = () => setImgs((p) => ({ ...p, [key]: null }));

  // Dynamic variables for camera steps (Steps 2, 3, 4)
  const cfg = step >= 2 && step <= 4 ? STEP_CFG[step] : null;
  const key = step === 2 ? 'front' : step === 3 ? 'back' : 'selfie';
  const curImg = step >= 2 && step <= 4 ? imgs[key] : null;
  const isSelfie = step === 4;
  const frameW = isSelfie ? OVAL_W : CARD_W;
  const frameH = isSelfie ? OVAL_H : CARD_H;

  // Permission screen
  if (!permission?.granted && step >= 2 && step <= 4) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="light-content" />
        <Shield size={48} color="#0d9488" />
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 16 }}>Cấp quyền Camera</Text>
        <Text style={{ color: '#9ca3af', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 }}>
          Ứng dụng cần quyền truy cập camera để chụp ảnh xác thực danh tính.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={[S.ctaBtn, { marginTop: 24, paddingHorizontal: 24, flex: 0 }]}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Cho phép truy cập</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: '#6b7280' }}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── STEP 1: PERSONAL INFORMATION SUMMARY ──────────────────────────────────
  if (step === 1) {
    return (
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={S.step1Header}>
          <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#374151'} />
          </TouchableOpacity>
          <Text style={[S.step1Title, { color: isDark ? '#FFF' : '#111827' }]}>Thông tin cá nhân</Text>
          <Shield size={22} color="#0d9488" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}>
          <Text className="text-gray-500 dark:text-gray-400 text-sm mt-3 leading-5">
            Hệ thống sẽ đối chiếu thông tin trích xuất từ thẻ căn cước với các thông tin hồ sơ hiện tại của bạn.
          </Text>

          <View style={[S.infoCard, { backgroundColor: isDark ? '#1f2937' : '#FFF', borderColor: isDark ? '#374151' : '#f3f4f6' }]}>
            <View style={S.infoRow}>
              <Text style={S.infoLabel}>Họ và tên</Text>
              <Text style={[S.infoValue, { color: isDark ? '#FFF' : '#111827' }]}>{user?.fullName || 'Chưa cập nhật'}</Text>
            </View>
            <View style={S.infoDivider} />
            <View style={S.infoRow}>
              <Text style={S.infoLabel}>Số điện thoại</Text>
              <Text style={[S.infoValue, { color: isDark ? '#FFF' : '#111827' }]}>{user?.phone || 'Chưa cập nhật'}</Text>
            </View>
            <View style={S.infoDivider} />
            <View style={S.infoRow}>
              <Text style={S.infoLabel}>Email</Text>
              <Text style={[S.infoValue, { color: isDark ? '#FFF' : '#111827' }]}>{user?.email || 'Chưa cập nhật'}</Text>
            </View>
            <View style={S.infoDivider} />
            <View style={S.infoRow}>
              <Text style={S.infoLabel}>Ngày sinh</Text>
              <Text style={[S.infoValue, { color: isDark ? '#FFF' : '#111827' }]}>{user?.dateOfBirth || 'Chưa cập nhật'}</Text>
            </View>
          </View>

          <View style={[S.shieldCard, { backgroundColor: isDark ? '#111827' : '#F6F9FF', borderColor: '#DCE8FF' }]}>
            <Shield size={18} color="#0d9488" style={{ marginTop: 2 }} />
            <Text style={{ flex: 1, fontSize: 13, color: isDark ? '#9ca3af' : '#4b5563', lineHeight: 18 }}>
              Thông tin cá nhân của bạn được mã hóa hoàn toàn và chỉ phục vụ duy nhất cho mục đích định danh tài khoản.
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleNext}
            style={[S.ctaBtn, { marginTop: 40, backgroundColor: '#0d9488' }]}
            activeOpacity={0.85}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Bắt đầu xác thực</Text>
            <ChevronRight size={20} color="#fff" />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── STEP 5: AI KYC ANALYSIS & OCR RESULT REVIEW ───────────────────────────
  if (step === 5) {
    const score = localKycData?.score ?? localKycData?.similarity ?? (localKycData ? 0 : 0);
    const hasFlags = Array.isArray(localKycData?.flags) && localKycData.flags.length > 0;
    
    return (
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} className="flex-1 bg-background dark:bg-background-dark">
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        
        {/* Full screen loader when calling APIs */}
        {verifying && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(17,24,39,0.95)' : 'rgba(255,255,255,0.95)', zIndex: 10000, justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#0d9488" />
            <Text style={{ color: isDark ? '#FFF' : '#111827', fontSize: 18, fontWeight: '700', marginTop: 20 }}>Đang phân tích AI KYC...</Text>
            <Text style={{ color: '#6b7280', fontSize: 13, marginTop: 8, paddingHorizontal: 40, textAlign: 'center', lineHeight: 18 }}>
              Hệ thống đang trích xuất thông tin OCR và đối sánh khuôn mặt. Vui lòng không đóng ứng dụng.
            </Text>
          </View>
        )}

        <View style={S.step1Header}>
          <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#374151'} />
          </TouchableOpacity>
          <Text style={[S.step1Title, { color: isDark ? '#FFF' : '#111827' }]}>Kết quả xác thực</Text>
          <Shield size={22} color="#0d9488" />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
          
          {/* A. SUCCESS STATE */}
          {localKycData?.status === 'verified' && (
            <View style={{ alignItems: 'center', marginTop: 10 }}>
              <View style={[S.resultIconOuter, { backgroundColor: '#e6f4ea' }]}>
                <CheckCircle2 size={56} color="#10b981" />
              </View>
              <Text style={[S.resultTitle, { color: isDark ? '#FFF' : '#111827' }]}>Xác thực thành công!</Text>
              <Text style={S.resultSub}>Hồ sơ của bạn đã được đối sánh tự động và được phê duyệt.</Text>
            </View>
          )}

          {/* B. IN REVIEW STATE */}
          {localKycData?.status === 'in_review' && (
            <View style={{ alignItems: 'center', marginTop: 10 }}>
              <View style={[S.resultIconOuter, { backgroundColor: '#fff7ed' }]}>
                <Clock size={56} color="#f97316" />
              </View>
              <Text style={[S.resultTitle, { color: isDark ? '#FFF' : '#111827' }]}>Hồ sơ đang chờ duyệt</Text>
              <Text style={S.resultSub}>Hồ sơ đang được chuyển sang chế độ quản trị viên thẩm định thủ công.</Text>
            </View>
          )}

          {/* C. FAILED STATE */}
          {localKycData?.status === 'failed' && (
            <View style={{ marginTop: 10 }}>
              <View style={[S.failedCard, { borderColor: '#fca5a5', backgroundColor: isDark ? '#450a0a' : '#fef2f2' }]}>
                <AlertTriangle size={24} color="#ef4444" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 16 }}>Xác thực không thành công</Text>
                  <Text style={{ color: isDark ? '#fca5a5' : '#b91c1c', fontSize: 13, marginTop: 4, lineHeight: 18 }}>
                    {verifyError || 'Hệ thống nhận diện AI không thể xác minh thông tin. Ảnh có thể bị mờ, lóa sáng hoặc không khớp.'}
                  </Text>
                  {score > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#ef4444' }}>Độ khớp khuôn mặt: </Text>
                      <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                        <Text style={{ color: '#b91c1c', fontWeight: '800', fontSize: 12 }}>{Math.round(score)}%</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Extracted Details Box */}
          <Text style={S.sectionTitle}>THÔNG TIN TRÍCH XUẤT OCR</Text>
          <View style={[S.infoCard, { backgroundColor: isDark ? '#1f2937' : '#FFF', borderColor: isDark ? '#374151' : '#f3f4f6' }]}>
            <View style={S.infoRow}>
              <Text style={S.infoLabel}>Họ và tên</Text>
              <Text style={[S.infoValue, { color: isDark ? '#FFF' : '#111827' }]}>{localKycData?.fullName || '—'}</Text>
            </View>
            <View style={S.infoDivider} />
            <View style={S.infoRow}>
              <Text style={S.infoLabel}>Số định danh (ID)</Text>
              <Text style={[S.infoValue, { color: isDark ? '#FFF' : '#111827' }]}>{localKycData?.idNumber || '—'}</Text>
            </View>
            <View style={S.infoDivider} />
            <View style={S.infoRow}>
              <Text style={S.infoLabel}>Ngày sinh</Text>
              <Text style={[S.infoValue, { color: isDark ? '#FFF' : '#111827' }]}>{localKycData?.dob || '—'}</Text>
            </View>
            <View style={S.infoDivider} />
            <View style={S.infoRow}>
              <Text style={S.infoLabel}>Giới tính</Text>
              <Text style={[S.infoValue, { color: isDark ? '#FFF' : '#111827' }]}>{localKycData?.gender || '—'}</Text>
            </View>
          </View>

          {/* System Flags Warning */}
          {hasFlags && (
            <View style={S.flagBox}>
              <Text style={{ color: '#b45309', fontWeight: '700', fontSize: 13 }}>Cảnh báo hệ thống:</Text>
              <Text style={{ color: '#b45309', fontSize: 12, marginTop: 2 }}>{localKycData.flags.join(', ')}</Text>
            </View>
          )}

          {/* Image Previews */}
          <Text style={S.sectionTitle}>HÌNH ẢNH HỒ SƠ</Text>
          <View style={S.previewRowContainer}>
            <View style={S.miniPreviewWrap}>
              <Text style={S.miniPreviewTitle}>Mặt trước</Text>
              {imgs.front && <Image source={{ uri: imgs.front }} style={S.miniPreview} />}
            </View>
            <View style={S.miniPreviewWrap}>
              <Text style={S.miniPreviewTitle}>Mặt sau</Text>
              {imgs.back && <Image source={{ uri: imgs.back }} style={S.miniPreview} />}
            </View>
            <View style={S.miniPreviewWrap}>
              <Text style={S.miniPreviewTitle}>Selfie</Text>
              {imgs.selfie && <Image source={{ uri: imgs.selfie }} style={S.miniPreview} />}
            </View>
          </View>

          {/* ───────────────── BUTTON ACTIONS ───────────────── */}
          
          {/* Successful Flow Action */}
          {localKycData?.status === 'verified' && (
            <TouchableOpacity
              onPress={() => router.replace('/(profile)/ekyc/success')}
              style={[S.ctaBtn, { marginTop: 30, backgroundColor: '#0d9488' }]}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Hoàn tất</Text>
              <CheckCircle2 size={20} color="#fff" />
            </TouchableOpacity>
          )}

          {/* In Review Flow Action */}
          {localKycData?.status === 'in_review' && (
            <TouchableOpacity
              onPress={() => router.navigate('/(tab)')}
              style={[S.ctaBtn, { marginTop: 30, backgroundColor: '#f97316' }]}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Quay về trang chủ</Text>
            </TouchableOpacity>
          )}

          {/* Failed Flow Action */}
          {localKycData?.status === 'failed' && (
            <View style={{ marginTop: 30, gap: 12 }}>
              <TouchableOpacity
                onPress={handleRetry}
                style={[S.ctaBtn, { backgroundColor: '#0d9488' }]}
                activeOpacity={0.85}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Kiểm tra & Thử lại</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleSendToAdmin}
                style={[S.outlineBtn, { borderColor: isDark ? '#374151' : '#d1d5db' }]}
                activeOpacity={0.85}
              >
                <Text style={[S.outlineBtnText, { color: isDark ? '#FFF' : '#374151' }]}>Gửi quản trị viên duyệt thủ công</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
        <Toast visible={toast.visible} message={toast.message} type={toast.type} duration={3000} onHide={hideToast} />
      </SafeAreaView>
    );
  }

  // ─── CAMERA CAPTURE STEPS (STEPS 2, 3, 4) ──────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Camera View or Captured Photo Preview */}
      {curImg ? (
        <Image source={{ uri: curImg }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={isSelfie ? 'front' : 'back'}
        />
      )}

      {/* Overlay mask — transparent bounding box / oval layout */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Top overlay */}
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />

        {/* Middle bounding row */}
        <View style={{ flexDirection: 'row', height: frameH }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
          {/* Bounding box for card or oval for selfie */}
          <View style={{
            width: frameW, height: frameH,
            borderWidth: 2.5, borderColor: curImg ? '#14b8a6' : '#0d9488',
            borderRadius: isSelfie ? frameW : 14,
            backgroundColor: 'transparent',
          }}>
            {/* Corners markers for identity cards */}
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

      {/* Camera UI: Header with progression tracking */}
      <SafeAreaView edges={['top']} style={S.headerWrap}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          height: 60,
          zIndex: 1000
        }}>
          <View style={{ zIndex: 10 }}>
            <TouchableOpacity
              onPress={() => step > 2 ? setStep((p) => (p - 1) as Step) : setStep(1)}
              style={S.backBtn}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={{
            position: 'absolute',
            left: 0, right: 0, top: 0, bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 5,
            pointerEvents: 'none'
          }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: -0.3 }}>eKYC Identity</Text>
            <Text style={{ color: '#0d9488', fontSize: 11, fontWeight: '600', marginTop: 2 }}>{cfg?.sub}</Text>
          </View>
          
          <View style={{ zIndex: 10 }}>
            <Shield size={22} color="#0d9488" />
          </View>
        </View>

        {/* Step progress bar indicator */}
        <View style={S.progressBar}>
          <View style={[S.progressFill, { width: `${(step / 5) * 100}%` }]} />
        </View>
      </SafeAreaView>

      {/* Guide hint text */}
      <View style={S.hintWrap}>
        <View style={S.hintBadge}>
          {cfg && <cfg.icon size={14} color="#0d9488" />}
          <Text style={S.hintText}>{cfg?.hint}</Text>
        </View>
      </View>

      {/* Bottom controls panel */}
      <SafeAreaView edges={['bottom']} style={S.bottomWrap}>
        {curImg ? (
          <View style={S.bottomInner}>
            <View style={S.previewBadge}>
              <Check size={16} color="#0d9488" />
              <Text style={{ color: '#0d9488', fontWeight: '600', marginLeft: 6, fontSize: 13 }}>Ảnh chụp đã sẵn sàng</Text>
            </View>
            <View style={S.actionRow}>
              <TouchableOpacity onPress={handleRetake} style={S.retakeBtn}>
                <Camera size={20} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 8 }}>Chụp lại</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNext} style={S.ctaBtn}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, marginRight: 4 }}>
                  {step === 4 ? 'Xác minh ngay' : 'Tiếp tục'}
                </Text>
                <ChevronRight size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={S.bottomInner}>
            <Text style={{ color: '#d1d5db', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
              {cfg?.hint}
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

        {/* Encryption footer details */}
        <View style={S.secFooter}>
          <Shield size={12} color="#6b7280" />
          <Text style={{ color: '#6b7280', fontSize: 10, fontWeight: '600', letterSpacing: 1, marginLeft: 6 }}>
            SECURE & ENCRYPTED
          </Text>
        </View>
      </SafeAreaView>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} duration={3000} onHide={hideToast} />
    </View>
  );
}

const S = StyleSheet.create({
  // Step 1 styles
  step1Header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  step1Title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  infoCard: {
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  infoLabel: {
    color: '#8b96a5',
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  shieldCard: {
    flexDirection: 'row',
    marginTop: 20,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },

  // Step 5 specific result styles
  resultIconOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  resultSub: {
    color: '#6b7280',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 30,
    marginTop: 6,
    lineHeight: 18,
  },
  failedCard: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: 1.5,
    marginTop: 24,
    marginBottom: 8,
  },
  flagBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fcd34d',
    backgroundColor: '#fffbeb',
    padding: 12,
    marginTop: 14,
  },
  previewRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  miniPreviewWrap: {
    width: (SW - 60) / 3,
    alignItems: 'center',
  },
  miniPreviewTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 6,
  },
  miniPreview: {
    width: '100%',
    height: 70,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  outlineBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  outlineBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },

  // Original Camera UI elements preserved & consolidated
  headerWrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
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
  ctaBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: '#0d9488', gap: 8 },
  captureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 30 },
  sideBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  placeholderSideBtn: { width: 50, height: 50 },
  shutterBtn: { width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)', justifyContent: 'center', alignItems: 'center' },
  shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff' },
  secFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: '#14b8a6' },
});
