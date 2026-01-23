import { CheckCircle, Clock, Shield } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

interface VerificationCardProps {
  status: 'verified' | 'pending' | 'unverified';
  onVerify: () => void;
}

const VerificationCard = ({ status, onVerify }: VerificationCardProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconBgColor: 'bg-green-100',
          iconColor: '#10b981',
          title: 'Tài khoản đã xác minh',
          subtitle: 'CCCD đã được xác thực',
          buttonText: 'Xem chi tiết',
          buttonBg: 'bg-green-500',
          Icon: CheckCircle,
        };
      case 'pending':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconBgColor: 'bg-yellow-100',
          iconColor: '#f59e0b',
          title: 'Đang chờ xác minh',
          subtitle: 'CCCD đang được xem xét',
          buttonText: 'Kiểm tra trạng thái',
          buttonBg: 'bg-yellow-500',
          Icon: Clock,
        };
      default:
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconBgColor: 'bg-blue-100',
          iconColor: '#3b82f6',
          title: 'Xác minh danh tính',
          subtitle: 'Tăng độ tin cậy với CCCD',
          buttonText: 'Xác minh ngay',
          buttonBg: 'bg-blue-500',
          Icon: Shield,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View className={`${config.bgColor} ${config.borderColor} border-2 rounded-2xl p-4 mb-4 mx-4`}>
      <View className="flex-row items-center mb-3">
        <View className={`${config.iconBgColor} rounded-full p-2.5 mr-3`}>
          <config.Icon size={24} color={config.iconColor} />
        </View>
        <View className="flex-1">
          <Text className="text-gray-900 font-bold text-base">{config.title}</Text>
          <Text className="text-gray-600 text-sm mt-0.5">{config.subtitle}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={onVerify}
        className={`${config.buttonBg} py-3 rounded-xl`}
        activeOpacity={0.8}
      >
        <Text className="text-center text-white font-semibold text-sm">
          {config.buttonText}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default VerificationCard;