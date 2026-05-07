import { Text, View, TouchableOpacity, FlatList, Alert, RefreshControl } from 'react-native';
import React, { useCallback, useRef, useState } from 'react';
import ChatHeader from './ChatHeader';
import ChatListItem from './ChatListItem';
import { Conversation } from '@/types/conversation.type';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import { Feather, Ionicons } from '@expo/vector-icons';
import TagModal from './TagModal';
import { getAllCustomerCategories, addConversationToCategory } from '@/store/slices/customer-category.slice';
import { fetchConversations, archiveConversation, deleteConversation } from '@/store/slices/conversation.slice';
import { useColorScheme } from 'nativewind';
import { router } from 'expo-router';

interface ChatListProps {
  onSelectChat: (conversation: Conversation) => void;
}

type TabKey = 'all' | 'unread' | 'ai' | 'users';

const SWIPE_ACTION_WIDTH = 80;

const ChatList: React.FC<ChatListProps> = ({ onSelectChat }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchText, setSearchText] = useState('');
  const { conversations, loading } = useAppSelector(state => state.conversation);
  const [refreshing, setRefreshing] = useState(false);
  const [tagModalVisible, setTagModalVisible] = useState(false)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const dispatch = useAppDispatch()
  const { customerCategories } = useAppSelector(state => state.customerCategory)
  const [initialCategoryIds, setInitialCategoryIds] = useState<string[]>([]);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const swipeableRefs = useRef<Map<string, Swipeable | null>>(new Map());
  const currentlyOpenId = useRef<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchConversations()).unwrap(),
        dispatch(getAllCustomerCategories()).unwrap()
      ]);
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  const closeCurrentSwipeable = () => {
    if (currentlyOpenId.current) {
      swipeableRefs.current.get(currentlyOpenId.current)?.close();
      currentlyOpenId.current = null;
    }
  };

  const handleSwipeOpen = (id: string) => {
    if (currentlyOpenId.current && currentlyOpenId.current !== id) {
      swipeableRefs.current.get(currentlyOpenId.current)?.close();
    }
    currentlyOpenId.current = id;
  };

  const handleArchive = (id: string) => {
    closeCurrentSwipeable();
    dispatch(archiveConversation(id));
  };

  const handleDelete = (id: string) => {
    closeCurrentSwipeable();
    Alert.alert(
      'Xóa hội thoại',
      'Bạn có chắc muốn xóa cuộc trò chuyện này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteConversation(id));
          },
        },
      ]
    );
  };

  const handleOpenTagModal = (conversation: Conversation) => {
    closeCurrentSwipeable();

    setSelectedConversationId(conversation.id);

    const currentIds = conversation.categories?.map(cat => cat.id) || [];
    setInitialCategoryIds(currentIds);

    setTagModalVisible(true);
  };

  const renderRightActions = (conversation: Conversation) => {
    return (
      <View
        style={{
          width: SWIPE_ACTION_WIDTH * 3,
          flexDirection: 'row',
        }}
      >
        <RectButton
          style={{
            flex: 1,
            backgroundColor: '#3B82F6',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => handleOpenTagModal(conversation)}
        >
          <View style={{ alignItems: 'center' }}>
            <Feather name="tag" size={22} color="white" />
            <Text
              style={{
                color: 'white',
                fontSize: 12,
                fontWeight: '600',
                marginTop: 6,
              }}
            >
              Gắn thẻ
            </Text>
          </View>
        </RectButton>

        <RectButton
          style={{
            flex: 1,
            backgroundColor: '#6B7280',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => handleArchive(conversation.id)}
        >
          <View style={{ alignItems: 'center' }}>
            <Feather name="archive" size={22} color="white" />
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '600', marginTop: 6 }}>
              Ẩn
            </Text>
          </View>
        </RectButton>

        <RectButton
          style={{
            flex: 1,
            backgroundColor: '#EF4444',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => handleDelete(conversation.id)}
        >
          <View style={{ alignItems: 'center' }}>
            <Feather name="trash-2" size={22} color="white" />
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '600', marginTop: 6 }}>
              Xóa
            </Text>
          </View>
        </RectButton>
      </View>
    )
  }

  const filteredConversations = conversations?.filter((conv) => {
    const matchesSearch = conv.participant?.fullName
      ?.toLowerCase()
      .includes(searchText.toLowerCase());
    return matchesSearch;
  });

  const unreadCount = conversations?.filter((c) => c.unreadCount > 0).length || 0;

  const tabs: { key: TabKey; label: string; badge?: number }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'unread', label: 'Chưa đọc', badge: unreadCount > 0 ? unreadCount : undefined },
    { key: 'ai', label: 'AI Chat' },
    { key: 'users', label: 'Người dùng' },
  ];

  // Filter conversations based on active tab
  const displayedConversations = filteredConversations?.filter((conv) => {
    if (activeTab === 'unread') return conv.unreadCount > 0;
    if (activeTab === 'users') return true; // All are user conversations
    if (activeTab === 'ai') return false;   // AI tab shows only AI section
    return true; // 'all' tab
  });

  const showAISection = activeTab === 'all' || activeTab === 'ai';
  const showUserSection = activeTab !== 'ai';

  if (loading && conversations.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-background-dark">
        <Text className="text-gray-500 dark:text-gray-400">Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#19191a' : '#f9fafb' }}>
      <ChatHeader title="Tin nhắn" onSearch={setSearchText} />

      {/* ── Tabs ── */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderBottomWidth: 0.5,
          borderBottomColor: isDark ? '#374151' : '#e5e7eb',
        }}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              paddingVertical: 12,
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: activeTab === tab.key ? '600' : '400',
                  color: activeTab === tab.key
                    ? '#185FA5'
                    : isDark ? '#9ca3af' : '#6b7280',
                }}
              >
                {tab.label}
              </Text>
              {tab.badge && (
                <View
                  style={{
                    minWidth: 16, height: 16,
                    borderRadius: 8,
                    backgroundColor: '#ef4444',
                    alignItems: 'center', justifyContent: 'center',
                    paddingHorizontal: 4,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '600', color: '#fff' }}>{tab.badge}</Text>
                </View>
              )}
            </View>
            {activeTab === tab.key && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 16, right: 16,
                  height: 2,
                  backgroundColor: '#185FA5',
                  borderTopLeftRadius: 2,
                  borderTopRightRadius: 2,
                }}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Content ── */}
      <FlatList
        data={showUserSection ? displayedConversations : []}
        onScrollBeginDrag={closeCurrentSwipeable}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#185FA5']}
            tintColor={isDark ? '#fff' : '#185FA5'}
          />
        }
        ListHeaderComponent={
          showAISection ? (
            <View>
              {/* Section Label: Trợ lý AI */}
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: isDark ? '#9ca3af' : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                  paddingHorizontal: 16,
                  paddingTop: 14,
                  paddingBottom: 6,
                }}
              >
                Trợ lý AI
              </Text>

              {/* AI Chat Item */}
              <TouchableOpacity
                onPress={() => router.push('/(chat)/AIChat')}
                activeOpacity={0.6}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  borderBottomWidth: 0.5,
                  borderBottomColor: isDark ? '#374151' : '#f3f4f6',
                }}
              >
                {/* AI Avatar */}
                <View
                  style={{
                    width: 48, height: 48, borderRadius: 24,
                    backgroundColor: isDark ? '#1e3a5f' : '#e0f2fe',
                    borderWidth: 1.5,
                    borderColor: isDark ? '#3b82f6' : '#93c5fd',
                    alignItems: 'center', justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="flash" size={22} color="#3b82f6" />
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: isDark ? '#f1f5f9' : '#1a1a1a' }}>
                      Trợ lý AI
                    </Text>
                    <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280' }}>Vừa xong</Text>
                  </View>
                  <Text
                    numberOfLines={1}
                    style={{ fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280' }}
                  >
                    Tìm kiếm BĐS, tư vấn thuê nhà, giải đáp thắc mắc...
                  </Text>
                </View>

                {/* Badge & Label */}
                <View style={{ alignItems: 'flex-end', gap: 4, marginLeft: 8 }}>
                  <View
                    style={{
                      paddingHorizontal: 8, paddingVertical: 2,
                      borderRadius: 6,
                      backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#e0f2fe',
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '600', color: '#3b82f6' }}>AI</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Section Label: Hội thoại */}
              {showUserSection && (
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: isDark ? '#9ca3af' : '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                    paddingHorizontal: 16,
                    paddingTop: 14,
                    paddingBottom: 6,
                  }}
                >
                  Hội thoại gần đây
                </Text>
              )}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Swipeable
            ref={(ref) => { swipeableRefs.current.set(item.id, ref); }}
            friction={2}
            rightThreshold={40}
            overshootRight={false}
            renderRightActions={() => renderRightActions(item)}
            onSwipeableOpen={() => handleSwipeOpen(item.id)}
          >
            <ChatListItem
              conversation={item}
              onPress={(conv) => {
                closeCurrentSwipeable();
                onSelectChat(conv);
              }}
            />
          </Swipeable>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          !showAISection ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color="#d1d5db" />
              <Text style={{ color: '#9ca3af', marginTop: 12, fontSize: 14 }}>
                {activeTab === 'unread' ? 'Không có tin nhắn chưa đọc' : 'Không có hội thoại nào'}
              </Text>
            </View>
          ) : null
        }
      />

      <TagModal
        visible={tagModalVisible}
        categories={customerCategories}
        selectedConversationId={selectedConversationId}
        initialSelectedIds={initialCategoryIds}
        onClose={() => setTagModalVisible(false)}
        onConfirm={(selectedIds) => {
          if (!selectedConversationId) return;

          dispatch(addConversationToCategory({
            conversationId: selectedConversationId,
            categoryIds: selectedIds
          }))
        }}
      />
    </View>
  )
};

export default ChatList;