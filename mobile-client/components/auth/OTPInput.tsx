import { TextInput, View } from "react-native";

interface OTPInputProps {
  otp: string[];
  otpInputs: React.MutableRefObject<(TextInput | null)[]>;
  handleOtpChange: (text: string, index: number) => void;
  handleOtpKeyPress: (e: any, index: number) => void;
}

const OTPInput  = ({ otp, otpInputs, handleOtpChange, handleOtpKeyPress }: OTPInputProps) => (
  <View className="flex-row justify-between mb-8">
    {otp.map((digit, index) => (
      <TextInput
        key={index}
        ref={(ref) => {
          if (ref) otpInputs.current[index] = ref;
        }}
        className={`w-12 h-14 border-2 rounded-xl text-center text-xl font-semibold ${digit
            ? 'border-blue-600 bg-blue-50 text-blue-600'
            : 'border-gray-300 bg-gray-50 text-gray-900'
          }`}
        keyboardType="number-pad"
        maxLength={1}
        value={digit}
        onChangeText={(text) => handleOtpChange(text, index)}
        onKeyPress={(e) => handleOtpKeyPress(e, index)}
        selectTextOnFocus
      />
    ))}
  </View>
);

export default OTPInput;