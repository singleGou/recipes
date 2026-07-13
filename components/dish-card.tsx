import { useState, useCallback, useRef, useImperativeHandle } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useStore from '@/store/use-store';
import type { Dish } from '@/data/dishes';

type DishCardProps = {
  dish: Dish;
  sheetRef: React.MutableRefObject<(() => void) | null>;
  onSheetStateChange?: (open: boolean) => void;
};

export function DishCard({ dish, sheetRef, onSheetStateChange }: DishCardProps) {
  const [flipped, setFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const doFlip = useCallback(() => {
    const toValue = flipped ? 0 : 1;
    setFlipped(!flipped);
    onSheetStateChange?.(!flipped);
    Animated.timing(flipAnim, {
      toValue,
      duration: 500,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [flipped, flipAnim, onSheetStateChange]);

  useImperativeHandle(sheetRef, () => doFlip);

  const addFavorite = useStore((s) => s.addFavorite);
  const removeFavorite = useStore((s) => s.removeFavorite);
  const showToast = useStore((s) => s.showToast);
  const favorite = useStore((s) => s.favorites.some((d) => d.id === dish.id));

  const handleFavorite = useCallback(() => {
    if (favorite) {
      removeFavorite(dish.id);
      showToast('已取消收藏');
    } else {
      addFavorite(dish);
      showToast('已加入收藏');
    }
  }, [dish.id, favorite, addFavorite, removeFavorite, showToast]);

  const themeColor = dish.color || '#7A8470';

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <View style={styles.card}>
      <Animated.View
        style={[
          styles.face,
          styles.front,
          { transform: [{ rotateY: frontRotate }] },
        ]}
        pointerEvents={flipped ? 'none' : 'auto'}>
        <View style={[styles.hero, { backgroundColor: themeColor }]}>
          <Text style={styles.heroEmoji}>{dish.emoji || '🍽️'}</Text>
          <TouchableOpacity onPress={handleFavorite} style={styles.favBtn} activeOpacity={0.7}>
            <Ionicons
              name={favorite ? 'heart' : 'heart-outline'}
              size={20}
              color={favorite ? '#7A4623' : 'rgba(255,255,255,0.8)'}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.frontScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.frontScrollContent}>
          <Text style={styles.dishName}>{dish.name}</Text>
          <Text style={styles.description}>{dish.description}</Text>

          <View style={styles.tagsRow}>
            {dish.tags?.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>食材</Text>
          <View style={styles.ingredientsRow}>
            {dish.ingredients?.map((ing) => (
              <View key={ing} style={styles.ingredientChip}>
                <Text style={styles.ingredientText}>{ing}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.flipBtn} onPress={doFlip} activeOpacity={0.85}>
          <Text style={styles.flipBtnText}>查看做法</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.face,
          styles.back,
          { transform: [{ rotateY: backRotate }] },
        ]}>
        <View style={[styles.backHeader, { backgroundColor: themeColor }]}>
          <TouchableOpacity onPress={doFlip} style={styles.backCloseBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color="#F0EDE4" />
          </TouchableOpacity>
          <Text style={styles.backTitle} numberOfLines={1}>{dish.name}</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.backScroll}
          showsVerticalScrollIndicator
          contentContainerStyle={styles.backScrollContent}>
          <Text style={styles.backSectionLabel}>食材</Text>
          <View style={styles.backIngredientsRow}>
            {dish.ingredients?.map((ing) => (
              <View key={ing} style={styles.backIngredientChip}>
                <Text style={styles.backIngredientText}>{ing}</Text>
              </View>
            ))}
          </View>

          <View style={styles.backDivider} />

          <Text style={styles.backSectionLabel}>做法步骤</Text>
          {dish.steps?.map((step, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{String(i + 1).padStart(2, '0')}</Text>
              </View>
              <Text style={styles.stepContent}>{step}</Text>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  face: {
    backgroundColor: '#F0EDE4',
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
    flex: 1,
  },
  front: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  back: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  hero: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: { fontSize: 72 },
  favBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frontScroll: {
    flex: 1,
  },
  frontScrollContent: {
    padding: 20,
    paddingBottom: 8,
  },
  dishName: {
    fontSize: 22,
    fontWeight: '400',
    color: '#1B1B1B',
    letterSpacing: -0.3,
    fontFamily: 'Georgia',
  },
  description: {
    fontSize: 14,
    color: '#8A8478',
    marginTop: 6,
    lineHeight: 21,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 6,
  },
  tag: {
    backgroundColor: '#E8E4D9',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: 11,
    color: '#7A8470',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#D5CFC4',
    marginTop: 14,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#7A8470',
    marginBottom: 8,
    letterSpacing: 1.5,
  },
  ingredientsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ingredientChip: {
    backgroundColor: '#E8E4D9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#D5CFC4',
  },
  ingredientText: { fontSize: 13, color: '#5A5549' },
  flipBtn: {
    marginTop: 18,
    backgroundColor: '#1B1B1B',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipBtnText: {
    color: '#F0EDE4',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backCloseBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '400',
    color: '#F0EDE4',
    fontFamily: 'Georgia',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  backScroll: {
    flex: 1,
  },
  backScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  backSectionLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#7A8470',
    marginBottom: 10,
    letterSpacing: 1.5,
  },
  backIngredientsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  backIngredientChip: {
    backgroundColor: '#E8E4D9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#D5CFC4',
  },
  backIngredientText: { fontSize: 12, color: '#5A5549' },
  backDivider: {
    height: 1,
    backgroundColor: '#D5CFC4',
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  stepNumber: {
    marginRight: 14,
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7A8470',
    fontFamily: 'Georgia',
  },
  stepContent: {
    flex: 1,
    fontSize: 15,
    color: '#3D3A35',
    lineHeight: 24,
    fontWeight: '400',
  },
});
