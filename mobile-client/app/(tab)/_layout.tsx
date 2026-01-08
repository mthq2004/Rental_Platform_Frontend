import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '@/utils/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1F2937',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 65,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.05,
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
          tabBarActiveTintColor: '#1F2937',
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
        options={{
          title: 'Đăng tin',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.postButtonContainer}>
              <View style={styles.postButton}>
                <Ionicons name="add" size={28} color={focused ? '#000' : color} />
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
  // Container cho vòng cung
  arcContainer: {
    position: 'absolute',
    top: -20,
    width: 70,
    height: 35,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  arcTop: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: -35,
    left: 0,
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
    borderColor: '#FFFFFF',
    zIndex: 1,
  },
});