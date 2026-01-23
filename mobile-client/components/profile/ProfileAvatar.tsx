import { CheckCircle, Edit } from "lucide-react-native";
import { Image, TouchableOpacity, View } from "react-native";

interface ProfileAvatarProps {
  imageUrl: string;
  onEdit: () => void;
  isVerified: boolean;
}

const ProfileAvatar = ({ imageUrl, onEdit, isVerified }: ProfileAvatarProps) => (
  <View className="items-center mb-6">
    <View className="relative">
      <Image
        source={{ uri: imageUrl }}
        className="w-28 h-28 rounded-full border-4 border-white dark:border-gray-500"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 }}
      />
      {isVerified && (
        <View className="absolute top-0 right-0 bg-blue-500 rounded-full p-1">
          <CheckCircle size={20} color="white" />
        </View>
      )}
      <TouchableOpacity
        onPress={onEdit}
        className="absolute bottom-0 right-0 bg-gray-900 rounded-full p-2.5"
        activeOpacity={0.7}
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}
      >
        <Edit size={16} color="white" />
      </TouchableOpacity>
    </View>
  </View>
);

export default ProfileAvatar;