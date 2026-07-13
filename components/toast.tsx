import { useEffect, useRef } from 'react';
import { StyleSheet, Text, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useStore from '@/store/use-store';

export function Toast() {
  const insets = useSafeAreaInsets();
  const toastMessage = useStore((s) => s.toastMessage);
  const toastVisible = useStore((s) => s.toastVisible);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toastVisible) {
      opacity.setValue(0);
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [toastVisible, opacity]);

  if (!toastVisible) return null;

  return (
    <Animated.View style={[styles.container, { top: insets.top + 12, opacity }]}>
      <Text style={styles.text}>{toastMessage}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 24,
    right: 24,
    backgroundColor: '#1B1B1B',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    zIndex: 9999,
  },
  text: {
    color: '#F0EDE4',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
