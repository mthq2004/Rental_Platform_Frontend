import React, { useState, useCallback } from 'react';
import { View, StyleSheet, GestureResponderEvent } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    runOnJS,
    Easing,
} from 'react-native-reanimated';

// ─── Cấu hình hiệu ứng (Tinh chỉnh nhỏ gọn hơn) ────────────────────────
const RIPPLE_SIZE = 30;           // Nhỏ hơn (cũ là 50)
const RIPPLE_DURATION = 400;
const PARTICLE_COUNT = 5;         // Giảm số lượng hạt để bớt rối
const PARTICLE_SIZE = 5;          // Hạt nhỏ li ti (cũ là 8)
const PARTICLE_SPREAD = 25;       // Tỏa ra phạm vi hẹp (cũ là 40)
const PARTICLE_DURATION = 400;

// ─── Màu sắc chủ đạo Xanh Biển (Ocean Blue) ──────────────────────────
const PARTICLE_COLORS = [
    '#0077b6', // Blue Sapphire
    '#00b4d8', // Sky Blue
    '#90e0ef', // Light Cyan
    '#0096c7', // Pacific Blue
    '#48cae4', // Turquoise
];

const generateParticleAngles = (count: number) => {
    const angles: number[] = [];
    const step = (2 * Math.PI) / count;
    for (let i = 0; i < count; i++) {
        angles.push(step * i + (Math.random() - 0.5) * 0.4);
    }
    return angles;
};

// ─── Component Ripple ───────────────────────────────────────────────
const RippleEffect = ({ x, y, onComplete }: { x: number; y: number; onComplete: () => void }) => {
    const scale = useSharedValue(0.5);
    const opacity = useSharedValue(0.6);

    React.useEffect(() => {
        scale.value = withTiming(1.8, {
            duration: RIPPLE_DURATION,
            easing: Easing.out(Easing.quad),
        });
        opacity.value = withTiming(0, {
            duration: RIPPLE_DURATION,
        }, () => {
            runOnJS(onComplete)();
        });
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        left: x - RIPPLE_SIZE / 2,
        top: y - RIPPLE_SIZE / 2,
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return <Animated.View pointerEvents="none" style={[styles.ripple, animatedStyle]} />;
};

// ─── Component Particle ─────────────────────────────────────────────
const ParticleEffect = ({ x, y, angle, color, delay }: any) => {
    const progress = useSharedValue(0);
    const opacity = useSharedValue(1);

    const targetX = Math.cos(angle) * PARTICLE_SPREAD;
    const targetY = Math.sin(angle) * PARTICLE_SPREAD;

    React.useEffect(() => {
        progress.value = withDelay(delay, withTiming(1, { duration: PARTICLE_DURATION, easing: Easing.out(Easing.cubic) }));
        opacity.value = withDelay(delay, withTiming(0, { duration: PARTICLE_DURATION }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        left: x - PARTICLE_SIZE / 2 + targetX * progress.value,
        top: y - PARTICLE_SIZE / 2 + targetY * progress.value,
        transform: [{ scale: 1 - progress.value }],
        opacity: opacity.value,
    }));

    return <Animated.View pointerEvents="none" style={[styles.particle, { backgroundColor: color }, animatedStyle]} />;
};

// ─── Component chính ─────────────────────────────────────────────────
const ClickEffect = ({ children }: { children: React.ReactNode }) => {
    const [effects, setEffects] = useState<any[]>([]);

    const handleTouch = useCallback((e: GestureResponderEvent) => {
        const { pageX, pageY } = e.nativeEvent;
        const id = Date.now() + Math.random();
        const angles = generateParticleAngles(PARTICLE_COUNT);
        setEffects((prev) => [...prev, { id, x: pageX, y: pageY, angles }]);
    }, []);

    const removeEffect = useCallback((id: number) => {
        setEffects((prev) => prev.filter((e) => e.id !== id));
    }, []);

    return (
        <View style={styles.container} onTouchStart={handleTouch}>
            {children}
            {effects.map((effect) => (
                <React.Fragment key={effect.id}>
                    <RippleEffect x={effect.x} y={effect.y} onComplete={() => removeEffect(effect.id)} />
                    {effect.angles.map((angle: number, index: number) => (
                        <ParticleEffect
                            key={`${effect.id}-${index}`}
                            x={effect.x}
                            y={effect.y}
                            angle={angle}
                            color={PARTICLE_COLORS[index % PARTICLE_COLORS.length]}
                            delay={index * 20}
                        />
                    ))}
                </React.Fragment>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    ripple: {
        position: 'absolute',
        width: RIPPLE_SIZE,
        height: RIPPLE_SIZE,
        borderRadius: RIPPLE_SIZE / 2,
        borderWidth: 1.5,
        borderColor: '#00b4d8',
        backgroundColor: 'rgba(144, 224, 239, 0.2)',
        zIndex: 9999,
    },
    particle: {
        position: 'absolute',
        width: PARTICLE_SIZE,
        height: PARTICLE_SIZE,
        borderRadius: PARTICLE_SIZE / 2,
        zIndex: 9999,
    },
});

export default ClickEffect;