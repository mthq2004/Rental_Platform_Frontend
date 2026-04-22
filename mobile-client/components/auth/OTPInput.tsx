import { TextInput, View } from "react-native";

interface OTPInputProps {
  otp: string[];
  otpInputs: React.MutableRefObject<(TextInput | null)[]>;
  handleOtpChange: (text: string, index: number) => void;
  handleOtpKeyPress: (e: any, index: number) => void;
}

const OTPInput  = ({ otp, otpInputs, handleOtpChange, handleOtpKeyPress }: OTPInputProps) => (
  <View className="flex-row items-center gap-2 mb-8">
    {otp.map((digit, index) => (
      <TextInput
        key={index}
        ref={(ref) => {
          otpInputs.current[index] = ref;
        }}
        className={`h-14 flex-1 border-2 rounded-xl text-center text-xl font-semibold ${digit
            ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
            : 'border-gray-300 bg-gray-50 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
          }`}
        style={{ maxWidth: 56 }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        returnKeyType={index === otp.length - 1 ? 'done' : 'next'}
        blurOnSubmit={false}
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