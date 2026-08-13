import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DishCard } from '@/components/dish-card';
import { dishes, type Dish } from '@/data/dishes';
import useStore from '@/store/use-store';

const SWIPE_DISTANCE = 88;
const SWIPE_VELOCITY = 760;
const CARD_SPRING = { damping: 17, stiffness: 190, mass: 0.82 };

function getRandomDish(excludedIds: number[] = []): Dish | undefined {
  const filtered = dishes.filter((dish) => !excludedIds.includes(dish.id));
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function createDeck(excludedIds: number[] = [], retainedDishes: Dish[] = []): Dish[] {
  const retained = retainedDishes.filter((dish) => !excludedIds.includes(dish.id)).slice(0, 3);
  const deck = [...retained];

  while (deck.length < 3) {
    const nextDish = getRandomDish([...excludedIds, ...deck.map((dish) => dish.id)]);
    if (!nextDish) break;
    deck.push(nextDish);
  }

  return deck;
}

type DeckPosition = 'front' | 'middle' | 'back';

type DeckDishCardProps = {
  dish: Dish;
  position: DeckPosition;
  disabled: boolean;
  screenWidth: number;
  progress: SharedValue<number>;
  sheetRef: React.MutableRefObject<(() => void) | null>;
  onSheetStateChange: (open: boolean) => void;
  onThresholdChange: (reached: boolean) => void;
  onSwiped: () => void;
  choosing: boolean;
  onChoose: () => void;
};

function DeckDishCard({
  dish,
  position,
  disabled,
  screenWidth,
  progress,
  sheetRef,
  onSheetStateChange,
  onThresholdChange,
  onSwiped,
  choosing,
  onChoose,
}: DeckDishCardProps) {
  const isFront = position === 'front';
  const inactiveSheetRef = useRef<(() => void) | null>(null);

  // Each dish keeps its own motion state as it moves through the deck. The
  // middle card becomes the front card without remounting its native view.
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const thresholdReached = useSharedValue(0);
  const settling = useSharedValue(0);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(isFront && !disabled && !choosing)
        .activeOffsetX([-14, 14])
        .failOffsetY([-12, 12])
        .onUpdate((event) => {
          if (settling.value) return;

          translateX.value = event.translationX;
          translateY.value = Math.max(-12, Math.min(12, event.translationY * 0.14));
          progress.value = Math.min(Math.abs(event.translationX) / SWIPE_DISTANCE, 1);

          const reached = Math.abs(event.translationX) >= SWIPE_DISTANCE ? 1 : 0;
          if (reached !== thresholdReached.value) {
            thresholdReached.value = reached;
            runOnJS(onThresholdChange)(reached === 1);
          }
        })
        .onEnd((event) => {
          const shouldAdvance =
            Math.abs(event.translationX) >= SWIPE_DISTANCE ||
            Math.abs(event.velocityX) >= SWIPE_VELOCITY;

          if (shouldAdvance) {
            settling.value = 1;
            const direction =
              event.translationX === 0
                ? Math.sign(event.velocityX) || 1
                : Math.sign(event.translationX);

            progress.value = withTiming(1, { duration: 180 });
            translateY.value = withTiming(event.translationY * 0.35, { duration: 240 });
            translateX.value = withTiming(
              direction * (screenWidth + 180),
              { duration: 260, easing: Easing.out(Easing.cubic) },
              (finished) => {
                if (finished) {
                  // The outgoing card stays off screen until React removes it.
                  // The middle card is already visually promoted underneath.
                  runOnJS(onSwiped)();
                }
              }
            );
            return;
          }

          thresholdReached.value = 0;
          translateX.value = withSpring(0, CARD_SPRING);
          translateY.value = withSpring(0, CARD_SPRING);
          progress.value = withSpring(0, CARD_SPRING);
          runOnJS(onThresholdChange)(false);
        })
        .onFinalize(() => {
          if (settling.value) return;

          thresholdReached.value = 0;
          translateX.value = withSpring(0, CARD_SPRING);
          translateY.value = withSpring(0, CARD_SPRING);
          progress.value = withSpring(0, CARD_SPRING);
          runOnJS(onThresholdChange)(false);
        }),
    [
      disabled,
      isFront,
      choosing,
      onSwiped,
      onThresholdChange,
      progress,
      screenWidth,
      settling,
      thresholdReached,
      translateX,
      translateY,
    ]
  );

  const animatedCardStyle = useAnimatedStyle(() => {
    const deckProgress = progress.value;

    if (position === 'middle') {
      return {
        opacity: 1,
        transform: [
          { translateY: interpolate(deckProgress, [0, 1], [13, 0]) },
          { scale: interpolate(deckProgress, [0, 1], [0.96, 1]) },
          { rotateZ: `${interpolate(deckProgress, [0, 1], [-1.15, 0])}deg` },
        ],
      };
    }

    if (position === 'back') {
      return {
        opacity: interpolate(deckProgress, [0, 1], [0.7, 1]),
        transform: [
          { translateY: interpolate(deckProgress, [0, 1], [25, 13]) },
          { scale: interpolate(deckProgress, [0, 1], [0.925, 0.96]) },
          { rotateZ: `${interpolate(deckProgress, [0, 1], [1.5, -1.15])}deg` },
        ],
      };
    }

    const drag = Math.min(Math.abs(translateX.value) / SWIPE_DISTANCE, 1);
    return {
      opacity: 1,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value - drag * 7 },
        {
          rotateZ: `${interpolate(
            translateX.value,
            [-screenWidth, 0, screenWidth],
            [-11, 0, 11],
            Extrapolation.CLAMP
          )}deg`,
        },
        { scale: 1 + drag * 0.012 },
      ],
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        pointerEvents={isFront ? 'auto' : 'none'}
        style={[
          todayStyles.cardLayer,
          position === 'front' && todayStyles.topCard,
          position === 'middle' && todayStyles.middleCard,
          position === 'back' && todayStyles.backCard,
          animatedCardStyle,
        ]}>
        <DishCard
          dish={dish}
          sheetRef={isFront ? sheetRef : inactiveSheetRef}
          onSheetStateChange={isFront ? onSheetStateChange : undefined}
          actionLabel={isFront ? (choosing ? '已加入' : '加入今日菜单') : undefined}
          onAction={isFront ? onChoose : undefined}
          actionDisabled={choosing}
        />
        {isFront && choosing && (
          <View style={todayStyles.stampOverlay} pointerEvents="none">
            <View style={todayStyles.stamp}>
              <Ionicons name="checkmark" size={24} color="#F0EDE4" />
              <Text style={todayStyles.stampText}>已入盘</Text>
            </View>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

export default function TodayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const minCardHeight = useMemo(() => {
    const headerEstimate = insets.top + 140;
    const swipeHintEstimate = 138;
    return screenHeight - headerEstimate - swipeHintEstimate - insets.bottom - 60;
  }, [screenHeight, insets]);

  const [deck, setDeck] = useState<Dish[]>(() => createDeck());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [releaseReady, setReleaseReady] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const sheetRef = useRef<(() => void) | null>(null);
  const chooseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeProgress = useSharedValue(0);
  const todayMenu = useStore((state) => state.todayMenu);
  const addTodayDish = useStore((state) => state.addTodayDish);
  const removeTodayDish = useStore((state) => state.removeTodayDish);
  const rolloverTodayMenu = useStore((state) => state.rolloverTodayMenu);

  useEffect(() => {
    rolloverTodayMenu();
    return () => {
      if (chooseTimerRef.current) clearTimeout(chooseTimerRef.current);
    };
  }, [rolloverTodayMenu]);

  useEffect(() => {
    if (choosing) return;

    const selectedIds = todayMenu.map((dish) => dish.id);
    setDeck((currentDeck) => {
      const nextDeck = createDeck(selectedIds, currentDeck);
      const unchanged =
        nextDeck.length === currentDeck.length &&
        nextDeck.every((dish, index) => dish.id === currentDeck[index]?.id);
      return unchanged ? currentDeck : nextDeck;
    });
  }, [choosing, todayMenu]);

  const notifyThreshold = useCallback((reached: boolean) => {
    setReleaseReady(reached);
    if (Platform.OS === 'web') return;

    const feedback = reached
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
      : Haptics.selectionAsync();
    void feedback.catch(() => undefined);
  }, []);

  const advanceDeck = useCallback(() => {
    setDeck(([outgoing, ...remaining]) => {
      if (!outgoing) return [];
      const selectedIds = useStore.getState().todayMenu.map((dish) => dish.id);
      return createDeck([...selectedIds, outgoing.id], remaining);
    });
    setReleaseReady(false);
    setChoosing(false);
  }, []);

  const chooseCurrentDish = useCallback(() => {
    if (choosing || !deck[0]) return;

    const currentDish = deck[0];
    setChoosing(true);
    addTodayDish(currentDish);
    swipeProgress.value = withTiming(1, {
      duration: 420,
      easing: Easing.out(Easing.cubic),
    });

    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined
      );
    }

    chooseTimerRef.current = setTimeout(() => {
      advanceDeck();
      chooseTimerRef.current = null;
    }, 460);
  }, [addTodayDish, advanceDeck, choosing, deck, swipeProgress]);

  useLayoutEffect(() => {
    // Reset only after React has atomically promoted the persistent middle and
    // back card instances. The newly visible front card never jumps position.
    swipeProgress.value = 0;
  }, [deck, swipeProgress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: interpolate(swipeProgress.value, [0, 1], [18, 112], Extrapolation.CLAMP),
  }));

  const positions: DeckPosition[] = ['front', 'middle', 'back'];

  return (
    <View style={todayStyles.container}>
      <View style={[todayStyles.header, { paddingTop: insets.top + 24 }]}>
        <View style={todayStyles.eyebrowRow}>
          <Text style={todayStyles.badge}>今日推荐</Text>
          <View style={todayStyles.deckCount}>
            <View style={todayStyles.deckDot} />
            <Text style={todayStyles.deckCountText}>随手抽一张</Text>
          </View>
        </View>
        <Text style={todayStyles.title}>今天吃什么？</Text>
        <Text style={todayStyles.subtitle}>把选择交给手气，也许下一张正合胃口</Text>
      </View>

      <View style={[todayStyles.cardArea, { minHeight: minCardHeight }]}>
        {deck.length > 0 ? (
          deck.map((dish, index) => (
            <DeckDishCard
              key={dish.id}
              dish={dish}
              position={positions[index] ?? 'back'}
              disabled={sheetOpen}
              screenWidth={screenWidth}
              progress={swipeProgress}
              sheetRef={sheetRef}
              onSheetStateChange={setSheetOpen}
              onThresholdChange={notifyThreshold}
              onSwiped={advanceDeck}
              choosing={choosing && index === 0}
              onChoose={chooseCurrentDish}
            />
          ))
        ) : (
          <View style={todayStyles.deckComplete}>
            <View style={todayStyles.completePlate}>
              <Ionicons name="checkmark" size={30} color="#F0EDE4" />
            </View>
            <Text style={todayStyles.completeTitle}>今天的菜单集齐了</Text>
            <Text style={todayStyles.completeBody}>所有可选菜都已经放进餐盘</Text>
            <TouchableOpacity
              style={todayStyles.completeButton}
              onPress={() => router.push('/today-plan')}
              activeOpacity={0.82}>
              <Text style={todayStyles.completeButtonText}>查看完整方案</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={[todayStyles.menuDock, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={todayStyles.swipeHint}>
          <View style={todayStyles.progressTrack}>
            <Animated.View
              style={[
                todayStyles.progressFill,
                releaseReady && todayStyles.progressFillReady,
                progressStyle,
              ]}
            />
          </View>
          <Text style={[todayStyles.swipeHintText, releaseReady && todayStyles.swipeHintReady]}>
            {releaseReady ? '松手，看看下一道' : '左右抽一张 · 看中就加入今日菜单'}
          </Text>
        </View>

        <View style={todayStyles.dockHeader}>
          <View>
            <Text style={todayStyles.dockEyebrow}>今日菜单</Text>
            <Text style={todayStyles.dockTitle}>
              {todayMenu.length >= 5
                ? `已选 ${todayMenu.length} 道，已经很丰盛了`
                : todayMenu.length > 0
                  ? `已选 ${todayMenu.length} 道`
                  : '餐盘还是空的'}
            </Text>
          </View>
          <TouchableOpacity
            style={[todayStyles.planButton, todayMenu.length === 0 && todayStyles.planButtonDisabled]}
            disabled={todayMenu.length === 0}
            onPress={() => router.push('/today-plan')}
            activeOpacity={0.82}>
            <Text style={todayStyles.planButtonText}>生成方案</Text>
            <Ionicons name="arrow-forward" size={15} color="#F0EDE4" />
          </TouchableOpacity>
        </View>

        {todayMenu.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={todayStyles.selectedList}>
            {todayMenu.map((dish) => (
              <TouchableOpacity
                key={dish.id}
                style={todayStyles.selectedDish}
                onPress={() => removeTodayDish(dish.id)}
                activeOpacity={0.75}>
                <View
                  style={[
                    todayStyles.selectedEmoji,
                    { backgroundColor: `${dish.color || '#7A8470'}22` },
                  ]}>
                  <Text style={todayStyles.selectedEmojiText}>{dish.emoji || '🍽️'}</Text>
                </View>
                <Text style={todayStyles.selectedName} numberOfLines={1}>{dish.name}</Text>
                <Ionicons name="close" size={13} color="#8A8478" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const todayStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8E4D9' },
  header: { paddingHorizontal: 28, paddingBottom: 20 },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badge: {
    fontSize: 10,
    fontWeight: '500',
    color: '#7A8470',
    letterSpacing: 3,
  },
  deckCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deckDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#7A8470',
  },
  deckCountText: {
    color: '#8A8478',
    fontSize: 10,
    letterSpacing: 0.5,
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
    marginHorizontal: 22,
    marginBottom: 10,
    position: 'relative',
  },
  cardLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backCard: {
    zIndex: 1,
  },
  middleCard: {
    zIndex: 2,
  },
  topCard: {
    zIndex: 3,
    shadowColor: '#2A241B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.17,
    shadowRadius: 18,
    elevation: 9,
  },
  stampOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(27,27,27,0.12)',
  },
  deckComplete: {
    flex: 1,
    backgroundColor: '#F0EDE4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D5CFC4',
  },
  completePlate: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#7A8470',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeTitle: {
    marginTop: 18,
    color: '#1B1B1B',
    fontSize: 20,
    fontFamily: 'Georgia',
  },
  completeBody: {
    marginTop: 6,
    color: '#8A8478',
    fontSize: 12,
  },
  completeButton: {
    minHeight: 46,
    marginTop: 22,
    paddingHorizontal: 22,
    backgroundColor: '#1B1B1B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: {
    color: '#F0EDE4',
    fontSize: 13,
    fontWeight: '600',
  },
  stamp: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 3,
    borderColor: '#F0EDE4',
    backgroundColor: 'rgba(90,85,73,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotateZ: '-8deg' }],
  },
  stampText: {
    marginTop: 4,
    color: '#F0EDE4',
    fontFamily: 'Georgia',
    fontSize: 17,
    letterSpacing: 2,
  },
  menuDock: {
    paddingTop: 6,
    paddingHorizontal: 20,
    backgroundColor: '#E8E4D9',
  },
  swipeHint: {
    alignItems: 'center',
    minHeight: 38,
  },
  progressTrack: {
    width: 112,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#D5CFC4',
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: '#7A8470',
  },
  progressFillReady: {
    backgroundColor: '#1B1B1B',
  },
  swipeHintText: {
    fontSize: 11,
    color: '#8A8478',
    letterSpacing: 0.35,
  },
  swipeHintReady: {
    color: '#1B1B1B',
    fontWeight: '600',
  },
  dockHeader: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#D5CFC4',
    paddingTop: 10,
  },
  dockEyebrow: {
    color: '#7A8470',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  dockTitle: {
    marginTop: 2,
    color: '#1B1B1B',
    fontSize: 15,
    fontFamily: 'Georgia',
  },
  planButton: {
    minHeight: 40,
    paddingHorizontal: 15,
    backgroundColor: '#1B1B1B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  planButtonDisabled: {
    opacity: 0.32,
  },
  planButtonText: {
    color: '#F0EDE4',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedList: {
    gap: 7,
    paddingTop: 8,
    paddingBottom: 2,
  },
  selectedDish: {
    height: 36,
    maxWidth: 148,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 9,
    backgroundColor: '#F0EDE4',
    borderWidth: 1,
    borderColor: '#D5CFC4',
  },
  selectedEmoji: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedEmojiText: {
    fontSize: 17,
  },
  selectedName: {
    maxWidth: 84,
    marginHorizontal: 7,
    color: '#3D3A35',
    fontSize: 11,
  },
});
