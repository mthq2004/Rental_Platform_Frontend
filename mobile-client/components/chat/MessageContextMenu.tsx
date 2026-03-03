import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import {
    Heart,
    ThumbsUp,
    Laugh,
    Frown,
    Angry,
    MessageCircleReply,
    Forward,
    Copy,
    Pin,
    Bell,
    Trash2,
    Info,
    Zap,
    CheckSquare,
    Plus,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const REACTIONS = [
    { key: 'love', icon: Heart, color: '#ff3b30' },
    { key: 'like', icon: ThumbsUp, color: '#0a84ff' },
    { key: 'haha', icon: Laugh, color: '#ffd60a' },
    { key: 'sad', icon: Frown, color: '#64d2ff' },
    { key: 'angry', icon: Angry, color: '#ff453a' },
];

const ACTIONS = [
    { key: 'reply', label: 'Trả lời', icon: MessageCircleReply },
    { key: 'forward', label: 'Chuyển tiếp', icon: Forward },
    { key: 'copy', label: 'Sao chép', icon: Copy },
    { key: 'pin', label: 'Ghim', icon: Pin },
    { key: 'collect', label: 'Bộ sưu tập', icon: Plus },
    { key: 'reminder', label: 'Nhắc nhở', icon: Bell },
    { key: 'multi', label: 'Chọn nhiều', icon: CheckSquare },
    { key: 'quick', label: 'Tin nhắn nhanh', icon: Zap },
    { key: 'detail', label: 'Chi tiết', icon: Info },
    { key: 'delete', label: 'Xóa', icon: Trash2, danger: true },
];

interface Props {
    visible: boolean;
    onClose: () => void;
    onReaction: (key: string) => void;
    onAction: (key: string) => void;
    messagePreview?: React.ReactNode;
}


const MessageContextMenu: React.FC<Props> = ({
    visible,
    onClose,
    onReaction,
    onAction,
    messagePreview,
}) => {
    const backdrop = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(100)).current;

    const reactionScale = useRef(
        REACTIONS.map(() => new Animated.Value(0))
    ).current;

    useEffect(() => {
        if (visible) {
            backdrop.setValue(0);
            slide.setValue(100);
            reactionScale.forEach(v => v.setValue(0));

            Animated.parallel([
                Animated.timing(backdrop, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(slide, {
                    toValue: 0,
                    tension: 90,
                    friction: 12,
                    useNativeDriver: true,
                }),
                ...reactionScale.map((anim, i) =>
                    Animated.spring(anim, {
                        toValue: 1,
                        delay: i * 50,
                        tension: 120,
                        friction: 8,
                        useNativeDriver: true,
                    })
                ),
            ]).start();
        }
    }, [visible]);

    const rows = [];
    for (let i = 0; i < ACTIONS.length; i += 4) {
        rows.push(ACTIONS.slice(i, i + 4));
    }

    return (
        <Modal transparent visible={visible} animationType="none">
            <Animated.View
                style={{ opacity: backdrop }}
                className="absolute inset-0 bg-black/60"
            >
                <TouchableOpacity
                    className="flex-1"
                    activeOpacity={1}
                    onPress={onClose}
                />
            </Animated.View>

            <View className="flex-1 justify-end">

                {messagePreview && (
                    <Animated.View
                        style={{ opacity: backdrop }}
                        className="mx-4 mb-3 self-end max-w-[75%]"
                    >
                        {messagePreview}
                    </Animated.View>
                )}

                <Animated.View
                    style={{ transform: [{ translateY: slide }] }}
                    className={`bg-neutral-900 rounded-t-3xl pt-4 ${Platform.OS === 'ios' ? 'pb-10' : 'pb-5'
                        }`}
                >
                    <View className="flex-row justify-around px-3 pb-4">
                        {REACTIONS.map((r, i) => {
                            const Icon = r.icon;
                            return (
                                <Animated.View
                                    key={r.key}
                                    style={{ transform: [{ scale: reactionScale[i] }] }}
                                >
                                    <TouchableOpacity
                                        onPress={() => {
                                            onReaction(r.key);
                                            onClose();
                                        }}
                                        className="w-14 h-14 rounded-full bg-neutral-800 items-center justify-center"
                                    >
                                        <Icon size={26} color={r.color} />
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        })}
                    </View>

                    <View className="h-px bg-neutral-700" />

                    <View className="pt-3 px-2">
                        {rows.map((row, ri) => (
                            <View key={ri} className="flex-row">
                                {row.map(action => {
                                    const Icon = action.icon;
                                    return (
                                        <TouchableOpacity
                                            key={action.key}
                                            onPress={() => {
                                                onAction(action.key);
                                                onClose();
                                            }}
                                            style={{
                                                width: (SCREEN_WIDTH - 16) / 4,
                                            }}
                                            className="items-center py-4"
                                        >
                                            <View
                                                className={`w-14 h-14 rounded-full items-center justify-center mb-2 ${action.danger
                                                        ? 'bg-red-900/40'
                                                        : 'bg-neutral-800'
                                                    }`}
                                            >
                                                <Icon
                                                    size={22}
                                                    color={
                                                        action.danger ? '#ff453a' : '#e5e5ea'
                                                    }
                                                />
                                            </View>

                                            <Text
                                                className={`text-xs text-center ${action.danger
                                                        ? 'text-red-400'
                                                        : 'text-neutral-200'
                                                    }`}
                                            >
                                                {action.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

export default React.memo(MessageContextMenu);