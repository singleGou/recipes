import { useState, useRef, useMemo } from 'react';
import { StyleSheet, Text, View, Animated, Easing, Dimensions, PanResponder, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DishCard } from '@/components/dish-card';
import { dishes, type Dish } from '@/data/dishes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function getRandomDish(excludeId?: number) {
  const filtered = dishes.filter((d) => d.id !== excludeId);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const minCardHeight = useMemo(() => {
    const headerEstimate = insets.top + 140;
    const swipeHintEstimate = 40;
    return screenHeight - headerEstimate - swipeHintEstimate - insets.bottom - 60;
  }, [screenHeight, insets]);

  const [currentDish, setCurrentDish] = useState(() => getRandomDish());
  const [nextDish, setNextDish] = useState<Dish>(() => getRandomDish(currentDish?.id));
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef<(() => void) | null>(null);

  const frontX = useRef(new Animated.Value(0)).current;
  const backScale = useRef(new Animated.Value(0.95)).current;
  const backY = useRef(new Animated.Value(10)).current;
  const nextDishRef = useRef(nextDish);
  nextDishRef.current = nextDish;

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 15 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
    onPanResponderMove: (_, g) => frontX.setValue(g.dx),
    onPanResponderRelease: (_, g) => {
      if (Math.abs(g.dx) > 50) {
        const flyX = g.dx > 0 ? SCREEN_WIDTH * 1.2 : -SCREEN_WIDTH * 1.2;
        Animated.parallel([
          Animated.timing(frontX, {
            toValue: flyX,
            duration: 250,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(backScale, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(backY, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(() => {
          const newTop = nextDishRef.current;
          setCurrentDish(newTop);
          setNextDish(getRandomDish(newTop.id));
          requestAnimationFrame(() => {
            frontX.setValue(0);
            backScale.setValue(0.95);
            backY.setValue(10);
          });
        });
      } else {
        Animated.spring(frontX, { toValue: 0, friction: 7, tension: 80, useNativeDriver: false }).start();
      }
    },
    onPanResponderTerminate: () => {
      Animated.spring(frontX, { toValue: 0, friction: 7, tension: 80, useNativeDriver: false }).start();
    },
  })).current;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.badge}>今日推荐</Text>
        <Text style={styles.title}>今天吃什么？</Text>
        <Text style={styles.subtitle}>每天一道家常美味，告别选择困难</Text>
      </View>

      <View style={[styles.cardArea, { minHeight: minCardHeight }]}>
          <Animated.View style={[styles.backCard, { transform: [{ scale: backScale }, { translateY: backY }] }]} pointerEvents="none">
          {nextDish && <DishCard dish={nextDish} sheetRef={sheetRef} onSheetStateChange={setSheetOpen} />}
        </Animated.View>

        <Animated.View
          key={currentDish?.id}
          {...panResponder.panHandlers}
          style={[styles.topCard, { transform: [{ translateX: frontX }] }]}>
          {currentDish && (
            <DishCard dish={currentDish} sheetRef={sheetRef} onSheetStateChange={setSheetOpen} />
          )}
        </Animated.View>
      </View>

      <View style={styles.swipeHint}>
        <Text style={styles.swipeHintText}>← 左右滑动换菜 →</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8E4D9' },
  header: { paddingHorizontal: 28, paddingBottom: 24 },
  badge: {
    fontSize: 10,
    fontWeight: '500',
    color: '#7A8470',
    letterSpacing: 3,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '400',
    color: '#1B1B1B',
    letterSpacing: -0.5,
    fontFamily: 'Georgia',
  },
  subtitle: { fontSize: 14, color: '#8A8478', marginTop: 6 },
  cardArea: {
    flex: 1,
    marginHorizontal: 20,
    position: 'relative',
  },
  backCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  swipeHint: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  swipeHintText: { fontSize: 12, color: '#8A8478' },
});
