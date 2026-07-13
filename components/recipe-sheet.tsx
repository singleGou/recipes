import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Pressable, Animated, Easing, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_MAX_H = SCREEN_H * 0.8;
import type { Dish } from '@/data/dishes';

type RecipeSheetProps = {
  visible: boolean;
  dish: Dish | null;
  onClose: () => void;
};

export function RecipeSheet({ visible, dish, onClose }: RecipeSheetProps) {
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setAnimating(true);
      translateY.setValue(SCREEN_H);
      backdropAnim.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start(() => setAnimating(false));
    } else if (mounted) {
      setAnimating(true);
      Animated.parallel([
        Animated.timing(translateY, { toValue: SCREEN_H, duration: 350, easing: Easing.in(Easing.cubic), useNativeDriver: false }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setMounted(false);
        setAnimating(false);
      });
    }
  }, [visible]);

  if (!mounted && !animating) return null;

  const backdropOpacity = backdropAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] });
  const themeColor = dish?.color || '#7A8470';

  return (
    <View style={styles.overlay} collapsable={false}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handle} />
        <View style={styles.sheetHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.colorDot, { backgroundColor: themeColor }]} />
            <Text style={styles.sheetTitle} numberOfLines={1}>{dish?.name}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#8A8478" />
          </TouchableOpacity>
        </View>

        {dish?.ingredients && (
          <View style={styles.ingSection}>
            <Text style={styles.ingLabel}>食材</Text>
            <View style={styles.ingRow}>
              {dish.ingredients.map((ing) => (
                <View key={ing} style={styles.ingChip}>
                  <Text style={styles.ingChipText}>{ing}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.stepsDivider} />

        {dish?.steps && (
          <View style={styles.stepsSection}>
            <Text style={styles.ingLabel}>步骤</Text>
          </View>
        )}

        <ScrollView
          style={styles.stepsScroll}
          showsVerticalScrollIndicator
          contentContainerStyle={styles.stepsContent}>
          {dish?.steps?.map((step, i) => (
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1B1B1B',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_MAX_H,
    backgroundColor: '#F0EDE4',
  },
  handle: {
    width: 36,
    height: 3,
    backgroundColor: '#D5CFC4',
    alignSelf: 'center',
    marginTop: 14,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D5CFC4',
  },
  headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  colorDot: { width: 6, height: 6, marginRight: 12 },
  sheetTitle: { fontSize: 16, fontWeight: '400', color: '#1B1B1B', fontFamily: 'Georgia', letterSpacing: -0.2 },
  closeBtn: { padding: 8, marginLeft: 12 },
  ingSection: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 12,
  },
  ingLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#7A8470',
    marginBottom: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  ingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ingChip: {
    backgroundColor: '#E8E4D9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#D5CFC4',
  },
  ingChipText: { fontSize: 12, color: '#5A5549' },
  stepsDivider: {
    height: 1,
    backgroundColor: '#D5CFC4',
    marginHorizontal: 24,
    marginTop: 6,
  },
  stepsSection: {
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  stepsScroll: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepsContent: {
    paddingTop: 4,
    paddingBottom: 40,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepNumber: {
    marginRight: 16,
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
