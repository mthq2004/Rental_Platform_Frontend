import { Text } from "react-native";

const SectionHeader = ({ title }: { title: string }) => (
  <Text className="text-foreground dark:text-foreground-dark text-xs font-bold uppercase tracking-wider px-4 mb-2 mt-4">
    {title}
  </Text>
);

export default SectionHeader;