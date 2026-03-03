import { Text, View, TouchableOpacity, FlatList, Alert, Modal, Pressable } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import ChatHeader from './ChatHeader';
import ChatListItem from './ChatListItem';
import { Conversation } from '@/types/conversation.type';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import TagModal from './TagModal';
import { CustomerCategory } from '@/types/customer-category.type';
import { addConversationToCategory, getAllCustomerCategories } from '@/store/slices/customer-category.slice';

interface ChatListProps {
  onSelectChat: (conversation: Conversation) => void;
}

const SWIPE_ACTION_WIDTH = 80;

const ChatList: React.FC<ChatListProps> = ({ onSelectChat }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [searchText, setSearchText] = useState('');
  const { conversations, loading } = useAppSelector(state => state.conversation);
  const [tagModalVisible, setTagModalVisible] = useState(false)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const dispatch = useAppDispatch()
  const { customerCategories } = useAppSelector(state => state.customerCategory)
  const [initialCategoryIds, setInitialCategoryIds] = useState<string[]>([]);

  const swipeableRefs = useRef<Map<string, Swipeable | null>>(new Map());
  const currentlyOpenId = useRef<string | null>(null);

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
    // dispatch(archiveConversation(id))
    console.log('Archive:', id);
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
            // dispatch(deleteConversation(id))
          },
        },
      ]
    );
  };

  const handleOpenTagModal = (conversation: Conversation) => {
    closeCurrentSwipeable();

    setSelectedConversationId(conversation.id);

    const currentIds = conversation.categories?.map(cat => cat.id) || [];
    console.log("heonj: ", currentIds);

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

  const filteredConversations = conversations.filter((conv) => {
    const matchesTab = activeTab === 'all' || conv.unreadCount > 0;
    const matchesSearch = conv.participant.id
      .toLowerCase()
      .includes(searchText.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const unreadCount = conversations.filter((c) => c.unreadCount > 0).length;

  return (
    <View className="flex-1 bg-gray-50">
      <ChatHeader title="Liên hệ" onSearch={setSearchText} />

      <View className="flex-row bg-white border-b border-gray-200">
        <TouchableOpacity
          className={`flex-1 py-3 ${activeTab === 'all' ? 'border-b-2 border-blue-500' : ''}`}
          onPress={() => setActiveTab('all')}
        >
          <Text
            className={`text-center text-base font-medium ${activeTab === 'all' ? 'text-blue-500' : 'text-gray-600'
              }`}
          >
            Tất cả
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-3 flex-row justify-center items-center ${activeTab === 'unread' ? 'border-b-2 border-blue-500' : ''
            }`}
          onPress={() => setActiveTab('unread')}
        >
          <Text
            className={`text-center text-base font-medium ${activeTab === 'unread' ? 'text-blue-500' : 'text-gray-600'
              }`}
          >
            Chưa đọc
          </Text>
          {unreadCount > 0 && (
            <View className="bg-red-500 rounded-full w-5 h-5 items-center justify-center ml-2">
              <Text className="text-white text-xs font-bold">{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredConversations}
        // Khi scroll list → đóng swipeable đang mở
        onScrollBeginDrag={closeCurrentSwipeable}
        renderItem={({ item }) => (
          <Swipeable
            ref={(ref) => { swipeableRefs.current.set(item.id, ref); }}
            friction={2}               // cảm giác kéo tự nhiên hơn
            rightThreshold={40}        // kéo 40px là snap ra
            overshootRight={false}     // không cho kéo quá
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
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-500">Không có hội thoại nào</Text>
          </View>
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
  );
};

export default ChatList;