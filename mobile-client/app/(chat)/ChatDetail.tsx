import {
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCall } from '@/contexts/CallContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInputBar from '@/components/chat/ChatInputBar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchMessages, reactMessage, sendMessage } from '@/store/slices/message.slice';
import { Message } from '@/types/message.type';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { Conversation } from '@/types/conversation.type';
import { FlatList } from 'react-native-gesture-handler';
import { markAsRead, setCurrentConversation } from '@/store/slices/conversation.slice';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import EmojiSelector, { Categories } from "react-native-emoji-selector";
import { uploadToCloudinary } from '@/utils/uploadToCloudinary';

const ChatDetail = () => {
  const params = useLocalSearchParams<{
    id: string;
    participantId: string;
    status: string;
    name: string;
    avatar: string;
  }>();

  const dispatch = useAppDispatch()
  const { error, hasNextPage, loading, messages, nextCursor } = useAppSelector(state => state.message)
  const { onlineUsers } = useAppSelector(state => state.conversation)
  const { user } = useAppSelector(state => state.auth)
  const { startCall } = useCall();
  const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [hasNewMessageWhileScrolled, setHasNewMessageWhileScrolled] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const prevMessagesLength = useRef(messages.length);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (messages.length > prevMessagesLength.current && showScrollToBottom) {
      setHasNewMessageWhileScrolled(true);
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length]);

  useEffect(() => {
    if (showEmojiPicker) {
      Keyboard.dismiss();
    }
  }, [showEmojiPicker]);

  const isOnline =
    params.participantId
      ? onlineUsers.includes(params.participantId)
      : false;

  const conversation: Conversation = {
    id: params.id,
    status: (params.status as Conversation['status']) ?? 'ACTIVE',
    participant: { id: params.participantId, fullName: params.name, avatarUrl: params.avatar },
    lastMessage: {
      content: null,
      type: null,
      senderId: null,
      createdAt: null,
    },
    unreadCount: 0,
    isPinned: false,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  useFocusEffect(
    useCallback(() => {
      dispatch(setCurrentConversation(conversation.id));
      dispatch(markAsRead(conversation.id));

      return () => {
        dispatch(setCurrentConversation(null));
      };
    }, [conversation.id])
  );

  useEffect(() => {
    console.log("tin nhan");

    dispatch(fetchMessages({ conversationId: conversation.id }))
  }, [conversation.id])

  const flatListRef = useRef<FlatList>(null);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = async (text: string) => {
    if (!user?.id) return;

    try {
      if (selectedImages.length > 0) {
        setIsUploading(true);
        const uploadedUrls: string[] = [];
        for (const uri of selectedImages) {
          const uploadData = await uploadToCloudinary({
            uri,
            fileName: "image.jpg",
            mimeType: "image/jpeg",
            resourceType: "image",
          });
          uploadedUrls.push(uploadData.fileUrl);
        }

        dispatch(sendMessage({
          conversationId: conversation.id,
          messageType: "IMAGE",
          fileUrl: uploadedUrls[0],
          content: uploadedUrls.join(','),
          replyToId: replyingMessage?.id,
        }))
      }
      else if (selectedFile) {
        setIsUploading(true);
        const uploadData = await uploadToCloudinary({
          uri: selectedFile.uri,
          fileName: selectedFile.name,
          mimeType: selectedFile.mimeType || "application/octet-stream",
          resourceType: "auto",
        });

        dispatch(sendMessage({
          conversationId: conversation.id,
          messageType: "FILE",
          fileUrl: uploadData.fileUrl,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          mimeType: selectedFile.mimeType || undefined,
          replyToId: replyingMessage?.id,
        }))
      }
      else if (text.trim()) {
        dispatch(sendMessage({
          conversationId: conversation.id,
          content: text.trim(),
          messageType: "TEXT",
          replyToId: replyingMessage?.id,
        }))
      }

      setSelectedImages([])
      setSelectedFile(null)
      setReplyingMessage(null)
      setInputText('')
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true })

    } catch (error) {
      console.log("Send message error:", error)
    } finally {
      setIsUploading(false);
    }
  }

  const handleStartCall = (type: 'voice' | 'video') => {
    startCall({
      conversationId: params.id,
      calleeId: params.participantId,
      callType: type === 'voice' ? 'VOICE' : 'VIDEO',
      participantName: params.name,
      participantAvatar: params.avatar,
    });
  };

  const handleAction = (messageId: string, action: string) => {
    if (action === 'reply') {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        setReplyingMessage(message);
      }
    }
  }

  const handleReaction = (messageId: string, action: string) => {
    console.log("jnj: ", messageId, action);
    dispatch(reactMessage({ messageId, emoji: action }))
  }

  const handleSendImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      setSelectedImages(prev => [...prev, ...uris]);
    }
  }

  const handleSendFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      console.log("File picker error:", error);
    }
  }

  const getStatusStyle = () => {
    switch (conversation.status) {
      case 'ACTIVE':
        return { color: 'text-green-500', label: 'Đang hoạt động' };
      case 'BLOCKED':
        return { color: 'text-red-500', label: 'Đã bị chặn' };
      case 'DELETED':
        return { color: 'text-gray-400', label: 'Đã xóa' };
    }
  };

  const statusStyle = getStatusStyle();

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View
        className="bg-white dark:bg-secondary-dark px-4 py-3 border-b border-gray-200 dark:border-gray-700"
        style={{ paddingTop: insets.top + 4 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#6B7280" />
            </TouchableOpacity>

            <View className="relative mr-3">
              <Image
                source={{ uri: params.avatar }}
                className="w-10 h-10 rounded-full"
              />
              {isOnline && (
                <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-secondary-dark" />
              )}
            </View>

            <View>
              <Text className="text-base font-semibold text-gray-800 dark:text-foreground-dark">
                {params.name}
              </Text>
              {
                isOnline && <Text className={`text-xs ${statusStyle.color}`}>
                  Đang hoạt động
                </Text>
              }
            </View>
          </View>

          <View className="flex-row items-center gap-4">
            {conversation.unreadCount > 0 && (
              <View className="bg-red-500 w-6 h-6 rounded-full items-center justify-center mr-2">
                <Text className="text-white text-xs font-bold">
                  {conversation.unreadCount}
                </Text>
              </View>
            )}
            
            <TouchableOpacity onPress={() => handleStartCall('voice')}>
              <Ionicons name="call" size={22} color="#3b82f6" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => handleStartCall('video')}>
              <Ionicons name="videocam" size={26} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>
      </View>



      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -Math.max(insets.bottom, 0) : 0}
      >
        <View className="flex-1">

          <FlatList
            className="px-4"
            ref={flatListRef}
            data={messages}
            inverted
            contentContainerStyle={{ paddingTop: 8 }}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatMessage
                message={item}
                isMe={item.senderId === user?.id}
                time={formatTime(item.createdAt)}
                avatar={params.avatar}
                name={params.name}
                onAction={handleAction}
                onReaction={handleReaction}
              />
            )}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onScroll={(e) => {
              const offsetY = e.nativeEvent.contentOffset.y;
              if (offsetY > 150) {
                setShowScrollToBottom(true);
              } else {
                setShowScrollToBottom(false);
                setHasNewMessageWhileScrolled(false);
              }
            }}
            scrollEventThrottle={16}
            onEndReachedThreshold={0.2}
            onEndReached={() => {
              if (hasNextPage && !loading) {
                dispatch(
                  fetchMessages({
                    conversationId: conversation.id,
                    cursor: nextCursor,
                  })
                );
              }
            }}
          />

          {showScrollToBottom && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                setHasNewMessageWhileScrolled(false);
              }}
              style={{
                position: 'absolute',
                bottom: 80, // Above input bar
                right: 16,
                backgroundColor: '#ffffff',
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 4,
                zIndex: 10,
                borderWidth: 1,
                borderColor: '#e2e8f0'
              }}
            >
              <Ionicons name="chevron-down" size={20} color="#64748b" />
              {hasNewMessageWhileScrolled && (
                <View style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  backgroundColor: '#ef4444',
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  borderWidth: 1.5,
                  borderColor: '#ffffff',
                }} />
              )}
            </TouchableOpacity>
          )}



          {replyingMessage && (
            <View className="mx-4 mb-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border-l-4 border-blue-500">
              <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    Đang trả lời
                  </Text>
                  <Text numberOfLines={1} className="text-sm text-gray-800 dark:text-gray-200">
                    {replyingMessage.content}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => setReplyingMessage(null)}>
                  <Ionicons name="close" size={18} color="#999" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {selectedImages.length > 0 && (
            <View className="mx-4 mb-2">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {selectedImages.map((uri, index) => (
                  <View key={index} className="mr-3 relative mt-2">
                    <Image
                      source={{ uri }}
                      className="w-20 h-20 rounded-lg"
                    />
                    <TouchableOpacity 
                      onPress={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm"
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
                {/* Add more button */}
                <TouchableOpacity 
                  onPress={handleSendImage}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 items-center justify-center bg-gray-50 mr-2 mt-2"
                >
                  <Ionicons name="add" size={30} color="#9ca3af" />
                </TouchableOpacity>
              </ScrollView>
              {isUploading && (
                <Text className="text-xs text-blue-500 mt-1 ml-1">Đang tải ảnh lên...</Text>
              )}
            </View>
          )}

          {selectedFile && (
            <View className="mx-4 mb-2 p-3 bg-gray-50 rounded-xl border border-gray-200 flex-row items-center">
              <Ionicons name="document-text" size={32} color="#3b82f6" />
              <View className="flex-1 ml-3">
                <Text numberOfLines={1} className="text-sm font-medium text-gray-800">{selectedFile.name}</Text>
                <Text className="text-xs text-gray-400">{(selectedFile.size! / 1024).toFixed(1)} KB</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedFile(null)}>
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}

          <View style={{ paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 8) : 8 }}>
            <ChatInputBar
              onSendMessage={handleSendMessage}
              onSendImage={handleSendImage}
              onSendFile={handleSendFile}
              onEmojiPress={() => setShowEmojiPicker(!showEmojiPicker)}
              text={inputText}
              onTextChange={setInputText}
              canSend={selectedImages.length > 0 || !!selectedFile}
            />
          </View>

          {showEmojiPicker && (
            <View style={{ height: 300 }}>
              <EmojiSelector
                category={Categories.all}
                onEmojiSelected={emoji => {
                  setInputText(prev => prev + emoji);
                }}
                showSearchBar={false}
                columns={8}
              />
            </View>
          )}

        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ChatDetail;