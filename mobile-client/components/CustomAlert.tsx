import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Animated,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react-native';

interface CustomAlertProps {
  visible: boolean;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning' | 'confirm';
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  isDark?: boolean;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  type = 'info',
  onClose,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Hủy',
  isDark = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 15,
          mass: 1,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: '#10b981',
          iconBgClass: isDark ? 'bg-green-900' : 'bg-green-100',
          primaryBgClass: 'bg-green-500',
        };
      case 'error':
        return {
          icon: AlertCircle,
          iconColor: '#ef4444',
          iconBgClass: isDark ? 'bg-red-900' : 'bg-red-100',
          primaryBgClass: 'bg-red-500',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: '#f59e0b',
          iconBgClass: isDark ? 'bg-yellow-900' : 'bg-yellow-100',
          primaryBgClass: 'bg-yellow-500',
        };
      case 'confirm':
        return {
          icon: Info,
          iconColor: '#3b82f6',
          iconBgClass: isDark ? 'bg-blue-900' : 'bg-blue-100',
          primaryBgClass: 'bg-blue-500',
        };
      default: // info
        return {
          icon: Info,
          iconColor: '#3b82f6',
          iconBgClass: isDark ? 'bg-blue-900' : 'bg-blue-100',
          primaryBgClass: 'bg-blue-500',
        };
    }
  };

  const config = getConfig();
  const IconComponent = config.icon;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          className="flex-1 justify-center items-center px-5 bg-black/60"
          style={{ opacity: opacityAnim }}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              className={`w-full max-w-[340px] rounded-3xl p-6 ${
                isDark ? 'bg-gray-800' : 'bg-white'
              }`}
              style={{
                transform: [{ scale: scaleAnim }],
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              {/* Close Button */}
              <TouchableOpacity
                onPress={onClose}
                className="absolute top-4 right-4 z-10 p-1"
                activeOpacity={0.7}
              >
                <X size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
              </TouchableOpacity>

              {/* Icon */}
              <View
                className={`w-20 h-20 rounded-full justify-center items-center self-center mb-5 ${config.iconBgClass}`}
              >
                <IconComponent size={40} color={config.iconColor} />
              </View>

              {/* Title */}
              {title && (
                <Text
                  className={`text-[22px] font-bold text-center mb-3 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {title}
                </Text>
              )}

              {/* Message */}
              <Text
                className={`text-[15px] leading-[22px] text-center mb-6 ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                {message}
              </Text>

              {/* Buttons */}
              <View className="flex-row gap-3">
                {type === 'confirm' && (
                  <TouchableOpacity
                    onPress={onClose}
                    className={`flex-1 py-3.5 rounded-xl justify-center items-center border-2 ${
                      isDark
                        ? 'border-gray-600 bg-gray-900'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                    activeOpacity={0.8}
                  >
                    <Text
                      className={`text-base font-semibold ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      {cancelText}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleConfirm}
                  className={`flex-1 py-3.5 rounded-xl justify-center items-center ${config.primaryBgClass}`}
                  activeOpacity={0.8}
                >
                  <Text className="text-white text-base font-semibold">
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default CustomAlert;