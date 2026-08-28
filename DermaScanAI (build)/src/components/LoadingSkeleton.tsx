// src/components/LoadingSkeleton.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, Easing } from 'react-native';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Animated loading skeleton placeholder.
 * Renders a pulsing grey box to indicate loading content.
 */
export function SkeletonBox({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity: pulseAnim },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading content"
    />
  );
}

/**
 * Pre-built skeleton that mimics a typical card layout
 */
export function CardSkeleton() {
  return (
    <View style={styles.card} accessibilityLabel="Loading card">
      <SkeletonBox width={60} height={60} borderRadius={30} />
      <View style={styles.textGroup}>
        <SkeletonBox width="70%" height={14} />
        <SkeletonBox width="50%" height={12} style={{ marginTop: 8 }} />
      </View>
      <SkeletonBox width="100%" height={80} borderRadius={12} style={{ marginTop: 12 }} />
    </View>
  );
}

/**
 * Pre-built skeleton for list items
 */
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View accessibilityLabel="Loading list">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.listItem}>
          <SkeletonBox width={48} height={48} borderRadius={24} />
          <View style={styles.textGroup}>
            <SkeletonBox width="60%" height={14} />
            <SkeletonBox width="40%" height={12} style={{ marginTop: 6 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E0E0E0',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  textGroup: {
    flex: 1,
    marginLeft: 12,
  },
});
