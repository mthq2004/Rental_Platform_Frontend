import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { router } from 'expo-router';
import { useAppSelector } from '@/store/hook';
import { sendAIMessage } from '@/services/ai-chat.service';
import { AIMessage } from '@/types/ai-chat.type';
import AIPropertyCardItem from '@/components/chat/AIPropertyCardItem';

// ─── Typing Indicator ─────────────────────────────────────────
const TypingIndicator = () => {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingVertical: 8 }}>
      <View
        style={{
          width: 32, height: 32, borderRadius: 16,
          backgroundColor: '#3b82f6',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Ionicons name="flash" size={16} color="#fff" />
      </View>
      <View
        style={{
          flexDirection: 'row', gap: 5, alignItems: 'center',
          backgroundColor: 'rgba(59,130,246,0.1)',
          borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)',
          borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12,
        }}
      >
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={{
              width: 7, height: 7, borderRadius: 4,
              backgroundColor: '#3b82f6',
              transform: [{ translateY: dot }],
            }}
          />
        ))}
      </View>
    </View>
  );
};

// ─── Quick Reply Pill ─────────────────────────────────────────
const QuickReplyPill = ({ label, onPress }: { label: string; onPress: () => void }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.25)',
        marginRight: 8,
        marginBottom: 6,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: '600', color: '#3b82f6' }}>{label}</Text>
    </TouchableOpacity>
  );
};

// ─── Message Bubble ───────────────────────────────────────────
const AIMessageBubble = ({
  msg,
  onQuickReply,
  onPropertyPress,
}: {
  msg: AIMessage;
  onQuickReply: (text: string) => void;
  onPropertyPress: (slug: string) => void;
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isUser = msg.sender === 'user';

  return (
    <View
      style={{
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: 8,
        paddingHorizontal: 14,
        marginBottom: 14,
      }}
    >
      {/* Avatar */}
      {!isUser && (
        <View
          style={{
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: '#3b82f6',
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
          }}
        >
          <Ionicons name="flash" size={16} color="#fff" />
        </View>
      )}

      {/* Content Column */}
      <View style={{ maxWidth: '80%', gap: 6, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        {/* Text Bubble */}
        <View
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 18,
            ...(isUser
              ? {
                backgroundColor: '#3b82f6',
                borderBottomRightRadius: 4,
              }
              : {
                backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.18)',
                borderBottomLeftRadius: 4,
              }),
          }}
        >
          <Text
            style={{
              fontSize: 14,
              lineHeight: 20,
              color: isUser ? '#ffffff' : isDark ? '#e2e8f0' : '#0f172a',
            }}
          >
            {msg.text}
          </Text>
        </View>

        {/* Timestamp */}
        <Text style={{ fontSize: 10, color: '#94a3b8', paddingHorizontal: 4 }}>
          {msg.timestamp}
        </Text>

        {/* Property Cards */}
        {msg.properties && msg.properties.length > 0 && (
          <View style={{ gap: 8, width: '100%', minWidth: 240 }}>
            {msg.properties.map((property) => (
              <AIPropertyCardItem
                key={property.id}
                property={property}
                onPress={onPropertyPress}
              />
            ))}
          </View>
        )}

        {/* Quick Replies */}
        {msg.quickReplies && msg.quickReplies.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
            {msg.quickReplies.map((reply) => (
              <QuickReplyPill key={reply} label={reply} onPress={() => onQuickReply(reply)} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Main AI Chat Detail Component ────────────────────────────
const AIChatDetail = () => {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAppSelector((state) => state.auth);

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Xin chào! 👋 Tôi là trợ lý AI từ Digital Curator. Tôi có thể giúp bạn tìm kiếm bất động sản, tư vấn thuê nhà, hoặc giải đáp thắc mắc. Hãy hỏi tôi bất cứ điều gì!',
      quickReplies: ['Tìm phòng trọ', 'Tìm căn hộ Hà Nội', 'Hỏi về hợp đồng', 'Cần hỗ trợ'],
      timestamp: 'Vừa xong',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [hasNewMessageWhileScrolled, setHasNewMessageWhileScrolled] = useState(false);
  const prevMessagesLength = useRef(messages.length);
  const flatListRef = useRef<FlatList>(null);

  const getTimestamp = () => {
    const now = new Date();
    return `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const scrollToEnd = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'user') {
        scrollToEnd();
      } else if (showScrollToBottom) {
        setHasNewMessageWhileScrolled(true);
      } else {
        scrollToEnd();
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages, showScrollToBottom, scrollToEnd]);

  useEffect(() => {
    if (loading && !showScrollToBottom) {
      scrollToEnd();
    }
  }, [loading, showScrollToBottom, scrollToEnd]);

  const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: any) => {
    const paddingToBottom = 150;
    return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
  };

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMessage: AIMessage = {
        id: Date.now().toString(),
        sender: 'user',
        text: text.trim(),
        timestamp: getTimestamp(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setLoading(true);

      try {
        const data = await sendAIMessage(user?.id || `guest-${Date.now()}`, text.trim());

        const aiResponse: AIMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.answer,
          timestamp: getTimestamp(),
        };

        if (data.properties && data.properties.length > 0) {
          aiResponse.properties = data.properties;
          aiResponse.quickReplies = ['Tìm thêm khu vực khác', 'Xem tất cả kết quả'];
        } else {
          const lower = text.toLowerCase();
          if (lower.includes('tìm') || lower.includes('phòng') || lower.includes('căn hộ')) {
            aiResponse.quickReplies = ['Dưới 5 triệu', 'Quận Cầu Giấy', 'Căn hộ full nội thất'];
          }
        }

        setMessages((prev) => [...prev, aiResponse]);
      } catch {
        const fallback: AIMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'Xin lỗi, AI service chưa kết nối được. Vui lòng thử lại sau!',
          timestamp: getTimestamp(),
          quickReplies: ['Thử lại'],
        };
        setMessages((prev) => [...prev, fallback]);
      } finally {
        setLoading(false);
      }
    },
    [user, loading]
  );

  const handlePropertyPress = useCallback((slug: string) => {
    router.push(`/(post)/property-detail?id=${slug}`);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
      {/* ── Header ── */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 16,
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#334155' : '#e2e8f0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
              <Ionicons name="arrow-back" size={24} color={isDark ? '#e2e8f0' : '#334155'} />
            </TouchableOpacity>

            {/* AI Avatar with ring */}
            <View style={{ position: 'relative', width: 40, height: 40 }}>
              <View
                style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: '#3b82f6',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 2, borderColor: '#93c5fd',
                }}
              >
                <Ionicons name="flash" size={20} color="#fff" />
              </View>
              {/* Online dot */}
              <View
                style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 12, height: 12, borderRadius: 6,
                  backgroundColor: '#22c55e',
                  borderWidth: 2, borderColor: isDark ? '#1e293b' : '#ffffff',
                }}
              />
            </View>

            <View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: isDark ? '#f1f5f9' : '#0f172a' }}>
                Trợ lý AI
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' }} />
                <Text style={{ fontSize: 11, color: '#22c55e', fontWeight: '500' }}>Đang trực tuyến</Text>
              </View>
            </View>
          </View>

          {/* Status pills */}
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <View
              style={{
                paddingHorizontal: 8, paddingVertical: 3,
                borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.1)',
                borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)',
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: '700', color: '#3b82f6', letterSpacing: 0.3 }}>AI</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Messages ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -Math.max(insets.bottom, 0) : 0}
      >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: 16 }}
            renderItem={({ item }) => (
              <AIMessageBubble
                msg={item}
                onQuickReply={handleSend}
                onPropertyPress={handlePropertyPress}
              />
            )}
            ListFooterComponent={loading ? <TypingIndicator /> : null}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onScroll={(e) => {
              if (e.nativeEvent.contentSize.height > 0) {
                if (!isCloseToBottom(e.nativeEvent)) {
                  setShowScrollToBottom(true);
                } else {
                  setShowScrollToBottom(false);
                  setHasNewMessageWhileScrolled(false);
                }
              }
            }}
            scrollEventThrottle={16}
          />

          {showScrollToBottom && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                scrollToEnd();
                setHasNewMessageWhileScrolled(false);
              }}
              style={{
                position: 'absolute',
                bottom: 80,
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

        {/* ── Input ── */}
        <View
          style={{
            paddingHorizontal: 14,
            paddingTop: 10,
            paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 8) : 8,
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderTopWidth: 1,
            borderTopColor: isDark ? '#334155' : '#e2e8f0',
          }}
        >
          {/* Powered by */}
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase' }}>
              ✦ Powered by Real Estate AI ✦
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: isDark ? '#334155' : '#f1f5f9',
                borderRadius: 24,
                paddingHorizontal: 16,
                paddingVertical: Platform.OS === 'ios' ? 10 : 6,
                borderWidth: 1,
                borderColor: isDark ? '#475569' : '#e2e8f0',
              }}
            >
              <TextInput
                placeholder="Nhập tin nhắn..."
                placeholderTextColor="#94a3b8"
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => handleSend(input)}
                returnKeyType="send"
                multiline
                maxLength={1000}
                style={{
                  fontSize: 14,
                  color: isDark ? '#f1f5f9' : '#0f172a',
                  maxHeight: 100,
                }}
              />
            </View>

            <TouchableOpacity
              onPress={() => handleSend(input)}
              disabled={!input.trim() || loading}
              activeOpacity={0.7}
              style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: input.trim() && !loading ? '#3b82f6' : isDark ? '#475569' : '#e2e8f0',
                alignItems: 'center', justifyContent: 'center',
                shadowColor: input.trim() ? '#3b82f6' : 'transparent',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.35,
                shadowRadius: 6,
                elevation: input.trim() ? 4 : 0,
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
    </View>
  );
};

export default AIChatDetail;
