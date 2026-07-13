import { useState, useCallback, useEffect, useRef, useImperativeHandle } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useStore from '@/store/use-store';
import { RecipeSheet } from '@/components/recipe-sheet';
import type { Dish } from '@/data/dishes';

type DishCardProps = {
  dish: Dish;
  sheetRef: React.MutableRefObject<(() => void) | null>;
  onSheetStateChange?: (open: boolean) => void;
};

export function DishCard({ dish, sheetRef, onSheetStateChange }: DishCardProps) {
  const [sheetVisible, setSheetVisible] = useState(false);

  const openSheet = useCallback(() => {
    setSheetVisible(true);
    onSheetStateChange?.(true);
  }, [onSheetStateChange]);

  const closeSheet = useCallback(() => {
    setSheetVisible(false);
    onSheetStateChange?.(false);
  }, [onSheetStateChange]);

  useImperativeHandle(sheetRef, () => openSheet);

  const addFavorite = useStore((s) => s.addFavorite);
  const removeFavorite = useStore((s) => s.removeFavorite);
  const showToast = useStore((s) => s.showToast);
  const favorite = useStore((s) => s.favorites.some((d) => d.id === dish.id));

  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    cardOpacity.setValue(0);
    Animated.timing(cardOpacity, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [dish.id]);

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

  return (
    <>
      <Animated.View style={[styles.card, { opacity: cardOpacity }]}>
        <View style={[styles.hero, { backgroundColor: themeColor }]}>
          <Text style={styles.heroEmoji}>{dish.emoji || '\uD83C\uDF7D\uFE0F'}</Text>
          <TouchableOpacity onPress={handleFavorite} style={styles.favBtn} activeOpacity={0.7}>
            <Ionicons
              name={favorite ? 'heart' : 'heart-outline'}
              size={20}
              color={favorite ? '#7A4623' : 'rgba(255,255,255,0.8)'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
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
        </View>
      </Animated.View>

      <RecipeSheet visible={sheetVisible} dish={dish} onClose={closeSheet} />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F0EDE4',
    marginHorizontal: 20,
    overflow: 'hidden',
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
  body: { padding: 20 },
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
});
