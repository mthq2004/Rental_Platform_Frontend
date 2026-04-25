import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Dimensions, FlatList,
  StyleSheet, StatusBar, Image, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SW, height: SH } = Dimensions.get('window');

interface ImageItem {
  uri: string;
  width?: number;
  height?: number;
}

interface ImageGalleryViewerProps {
  visible: boolean;
  images: ImageItem[];
  initialIndex?: number;
  onClose: () => void;
}

const ImageGalleryViewer: React.FC<ImageGalleryViewerProps> = ({
  visible, images, initialIndex = 0, onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
    setCurrentIndex(idx);
  };

  const renderItem = ({ item, index }: { item: ImageItem; index: number }) => (
    <View style={st.slide}>
      {loadingMap[index] && (
        <ActivityIndicator size="large" color="#378ADD" style={st.loader} />
      )}
      <Image
        source={{ uri: item.uri }}
        style={st.image}
        resizeMode="contain"
        onLoadStart={() => setLoadingMap(m => ({ ...m, [index]: true }))}
        onLoadEnd={() => setLoadingMap(m => ({ ...m, [index]: false }))}
      />
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={st.overlay}>
        {/* Header */}
        <View style={[st.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={onClose} style={st.closeBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={st.counter}>
            {currentIndex + 1} / {images.length}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Image viewer */}
        <FlatList
          ref={flatListRef}
          data={images}
          renderItem={renderItem}
          keyExtractor={(_, i) => i.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: SW, offset: SW * index, index,
          })}
        />

        {/* Dots */}
        {images.length > 1 && images.length <= 10 && (
          <View style={[st.dots, { paddingBottom: insets.bottom + 16 }]}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[st.dot, i === currentIndex && st.dotActive]}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
};

const st = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    fontWeight: '600',
  },
  slide: {
    width: SW,
    height: SH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: SW,
    height: SH * 0.8,
  },
  loader: {
    position: 'absolute',
    zIndex: 5,
  },
  dots: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 18,
    borderRadius: 3,
  },
});

export default ImageGalleryViewer;
