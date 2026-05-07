import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { fetchArchivedConversations, archiveConversation, deleteConversation } from '@/store/slices/conversation.slice';
import ChatListItem from '@/components/chat/ChatListItem';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

const HiddenConversations = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { archivedConversations, loading } = useAppSelector(state => state.conversation);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    dispatch(fetchArchivedConversations());
  }, [dispatch]);

  const handleUnarchive = (id: string) => {
    dispatch(archiveConversation(id));
  };

  const handleDelete = (id: string) => {
    dispatch(deleteConversation(id));
  };

  const renderRightActions = (id: string) => (
    <View style={{ flexDirection: 'row', width: 160 }}>
      <RectButton
        style={{ flex: 1, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' }}
        onPress={() => handleUnarchive(id)}
      >
        <Feather name="eye" size={22} color="white" />
        <Text style={{ color: 'white', fontSize: 12, marginTop: 4 }}>Hiện</Text>
      </RectButton>
      <RectButton
        style={{ flex: 1, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' }}
        onPress={() => handleDelete(id)}
      >
        <Feather name="trash-2" size={22} color="white" />
        <Text style={{ color: 'white', fontSize: 12, marginTop: 4 }}>Xóa</Text>
      </RectButton>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#19191a' : '#f9fafb' }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 16, 
        paddingVertical: 12,
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        borderBottomWidth: 0.5,
        borderBottomColor: isDark ? '#374151' : '#e5e7eb',
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#f9fafb' : '#111827'} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: isDark ? '#f9fafb' : '#111827' }}>Hội thoại bị ẩn</Text>
      </View>

      <FlatList
        data={archivedConversations}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Swipeable
            friction={2}
            rightThreshold={40}
            renderRightActions={() => renderRightActions(item.id)}
          >
            <ChatListItem 
              conversation={item} 
              onPress={(conv) => router.push({
                pathname: '/(chat)/ChatDetail',
                params: {
                  id: conv.id,
                  participantId: conv.participant.id,
                  avatar: conv.participant.avatarUrl || '',
                  name: conv.participant.fullName
                }
              })} 
            />
          </Swipeable>
        )}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 }}>
            <Ionicons name="eye-off-outline" size={64} color="#d1d5db" />
            <Text style={{ color: '#9ca3af', marginTop: 16, fontSize: 16 }}>Không có hội thoại nào bị ẩn</Text>
          </View>
        }
        refreshing={loading}
        onRefresh={() => dispatch(fetchArchivedConversations())}
      />
    </SafeAreaView>
  );
};

export default HiddenConversations;
