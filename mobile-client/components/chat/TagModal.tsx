import { CustomerCategory } from '@/types/customer-category.type';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    Pressable,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const MAX_TAG = 3;

interface TagModalProps {
    visible: boolean;
    categories: CustomerCategory[];
    selectedConversationId: string | null;
    initialSelectedIds?: string[];
    onClose: () => void;
    onConfirm: (selectedIds: string[]) => void;
}

const TagModal: React.FC<TagModalProps> = ({
    visible,
    categories,
    selectedConversationId,
    initialSelectedIds = [],
    onClose,
    onConfirm,
}) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(
        new Set(initialSelectedIds)
    );

    // Reset khi mở modal lại
    useEffect(() => {
        if (visible) {
            setSelectedIds(new Set(initialSelectedIds));
        }
    }, [visible, initialSelectedIds]);

    const toggleTag = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);

            // Nếu đã chọn → bỏ chọn
            if (next.has(id)) {
                next.delete(id);
                return next;
            }

            // Nếu chưa chọn và đã đủ 3 → không cho chọn thêm
            if (next.size >= MAX_TAG) {
                return prev;
            }

            next.add(id);
            return next;
        });
    };

    const handleConfirm = () => {
        onConfirm(Array.from(selectedIds));
        onClose();
    };

    const handleClose = () => {
        setSelectedIds(new Set(initialSelectedIds));
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <Pressable
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    justifyContent: 'flex-end',
                }}
                onPress={handleClose}
            >
                <Pressable
                    style={{
                        height: SCREEN_HEIGHT * 0.5,
                        backgroundColor: 'white',
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        overflow: 'hidden',
                    }}
                    onPress={() => {}}
                >
                    {/* Header */}
                    <View
                        style={{
                            paddingHorizontal: 20,
                            paddingTop: 20,
                            paddingBottom: 12,
                            borderBottomWidth: 1,
                            borderBottomColor: '#F3F4F6',
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 18,
                                    fontWeight: '700',
                                    color: '#111827',
                                }}
                            >
                                Gắn thẻ phân loại
                            </Text>

                            {selectedIds.size > 0 && (
                                <View
                                    style={{
                                        backgroundColor: '#EFF6FF',
                                        borderRadius: 12,
                                        paddingHorizontal: 10,
                                        paddingVertical: 3,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontSize: 13,
                                            color: '#3B82F6',
                                            fontWeight: '600',
                                        }}
                                    >
                                        {selectedIds.size} đã chọn
                                    </Text>
                                </View>
                            )}
                        </View>

                        {selectedIds.size >= MAX_TAG && (
                            <Text
                                style={{
                                    marginTop: 6,
                                    fontSize: 12,
                                    color: '#EF4444',
                                }}
                            >
                                Chỉ được chọn tối đa {MAX_TAG} thẻ
                            </Text>
                        )}
                    </View>

                    {/* Danh sách tag */}
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{
                            paddingHorizontal: 20,
                            paddingVertical: 8,
                        }}
                        showsVerticalScrollIndicator={false}
                    >
                        {categories.map((cat) => {
                            const isSelected = selectedIds.has(cat.id);
                            const isDisabled =
                                !isSelected &&
                                selectedIds.size >= MAX_TAG;

                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    onPress={() => toggleTag(cat.id)}
                                    activeOpacity={0.7}
                                    disabled={isDisabled}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: 12,
                                        paddingHorizontal: 12,
                                        marginVertical: 3,
                                        borderRadius: 12,
                                        backgroundColor: isSelected
                                            ? `${cat.color}15`
                                            : isDisabled
                                            ? '#F3F4F6'
                                            : '#F9FAFB',
                                        borderWidth: 1.5,
                                        borderColor: isSelected
                                            ? cat.color
                                            : 'transparent',
                                        opacity: isDisabled ? 0.5 : 1,
                                    }}
                                >
                                    {/* Dot màu */}
                                    <View
                                        style={{
                                            width: 14,
                                            height: 14,
                                            borderRadius: 7,
                                            backgroundColor: cat.color,
                                            marginRight: 12,
                                        }}
                                    />

                                    {/* Nội dung */}
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={{
                                                fontSize: 15,
                                                fontWeight: '600',
                                                color: '#111827',
                                            }}
                                        >
                                            {cat.name}
                                        </Text>
                                        {cat.description ? (
                                            <Text
                                                style={{
                                                    fontSize: 12,
                                                    color: '#9CA3AF',
                                                    marginTop: 2,
                                                }}
                                                numberOfLines={1}
                                            >
                                                {cat.description}
                                            </Text>
                                        ) : null}
                                    </View>

                                    {/* Số hội thoại */}
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            color: '#9CA3AF',
                                            marginRight: 10,
                                        }}
                                    >
                                        {cat.conversationCount} hội thoại
                                    </Text>

                                    {/* Checkbox */}
                                    <View
                                        style={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: 11,
                                            borderWidth: 2,
                                            borderColor: isSelected
                                                ? cat.color
                                                : '#D1D5DB',
                                            backgroundColor: isSelected
                                                ? cat.color
                                                : 'white',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {isSelected && (
                                            <Text
                                                style={{
                                                    color: 'white',
                                                    fontSize: 13,
                                                    fontWeight: '700',
                                                }}
                                            >
                                                ✓
                                            </Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Footer */}
                    <View
                        style={{
                            flexDirection: 'row',
                            padding: 16,
                            gap: 12,
                            borderTopWidth: 1,
                            borderTopColor: '#F3F4F6',
                        }}
                    >
                        <TouchableOpacity
                            onPress={handleClose}
                            style={{
                                flex: 1,
                                paddingVertical: 13,
                                borderRadius: 12,
                                borderWidth: 1.5,
                                borderColor: '#E5E7EB',
                                alignItems: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontWeight: '600',
                                    color: '#6B7280',
                                }}
                            >
                                Hủy
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleConfirm}
                            style={{
                                flex: 2,
                                paddingVertical: 13,
                                borderRadius: 12,
                                backgroundColor: '#3B82F6',
                                alignItems: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontWeight: '600',
                                    color: 'white',
                                }}
                            >
                                Xác nhận
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

export default TagModal;