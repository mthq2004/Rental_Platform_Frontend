import { router, Tabs } from 'expo-router';
import { View, StyleSheet, Platform, useColorScheme } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, useThemeColors } from '@/utils/colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.current.text,
        tabBarInactiveTintColor: colors.current.textInactive,
        tabBarStyle: {
          backgroundColor: colors.current.background,
          borderTopWidth: 1,
          borderTopColor: colors.current.border,
          height: Platform.OS === 'ios' ? 88 : 65,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          elevation: 0,
          shadowColor: isDark ? '#000' : '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: isDark ? 0.3 : 0.05,
          shadowRadius: 3,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '400',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons 
                name="home" 
                size={24} 
                color={focused ? COLORS.primary : color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="my-post"
        options={{
          title: 'Quản lý tin',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons 
                name="bookmark-outline" 
                size={24} 
                color={focused ? COLORS.primary : color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="create-post"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/(post)/choose-property-type');
          },
        }}
        options={{
          title: 'Đăng tin',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.postButtonContainer}>
              <View style={[
                styles.postButton,
                { borderColor: colors.current.background }
              ]}>
                <Ionicons name="add" size={28} color="#FFFFFF" />
              </View>
            </View>
          ),
          tabBarLabel: 'Đăng tin',
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons 
                name="chatbubble-ellipses-outline" 
                size={24} 
                color={focused ? COLORS.primary : color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons 
                name="person-circle-outline" 
                size={24} 
                color={focused ? COLORS.primary : color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  postButtonContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    top: -20,
  },
  postButton: {
    width: 45,
    height: 45,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    borderWidth: 4,
    zIndex: 1,
  },
});