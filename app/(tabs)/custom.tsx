import { useState, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DishCard } from '@/components/dish-card';
import { IngredientsPicker } from '@/components/ingredients-picker';
import { dishes, type Dish } from '@/data/dishes';
import useStore from '@/store/use-store';

export default function CustomScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>([]);
  const [onlyCustom, setOnlyCustom] = useState(false);
  const [result, setResult] = useState<Dish | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef<(() => void) | null>(null);

  const customDishes = useStore((s) => s.customDishes);

  const toggleIngredient = useCallback((item: string) => {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }, []);

  const handleGenerate = useCallback(() => {
    const pool = onlyCustom ? customDishes : [...dishes, ...customDishes];
    if (pool.length === 0) { setResult(null); return; }
    if (selected.length > 0) {
      const scored = pool.map((d) => {
        const matchCount = d.ingredients.filter((ing) =>
          selected.some((sel) => ing.includes(sel) || sel.includes(ing))
        ).length;
        return { dish: d, score: matchCount };
      });
      const maxScore = Math.max(...scored.map((s) => s.score));
      const top = scored.filter((s) => s.score === maxScore);
      setResult(top[Math.floor(Math.random() * top.length)].dish);
    } else {
      setResult(pool[Math.floor(Math.random() * pool.length)]);
    }
  }, [selected, onlyCustom, customDishes]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ paddingTop: insets.top + 40, paddingBottom: 40 }}
      scrollEnabled={!sheetOpen}
      showsVerticalScrollIndicator>
      <View style={styles.header}>
        <Text style={styles.badge}>自定义生成</Text>
        <Text style={styles.title}>自定义生成</Text>
        <Text style={styles.subtitle}>按你的口味，智能匹配一道菜</Text>
      </View>

      <View style={styles.content}>
        <IngredientsPicker selected={selected} onToggle={toggleIngredient} />

        <View style={styles.switchRow}>
          <View style={styles.switchLeft}>
            <Text style={styles.switchText}>只看拿手菜</Text>
          </View>
          <Switch
            value={onlyCustom}
            onValueChange={setOnlyCustom}
            trackColor={{ false: '#D5CFC4', true: '#7A8470' }}
            thumbColor={onlyCustom ? '#F0EDE4' : '#F0EDE4'}
          />
        </View>

        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} activeOpacity={0.85}>
          <Text style={styles.generateBtnText}>生成推荐</Text>
        </TouchableOpacity>

        {result ? (
          <View style={styles.resultArea}>
            <Text style={styles.resultLabel}>为你推荐</Text>
            <DishCard dish={result} sheetRef={sheetRef} onSheetStateChange={setSheetOpen} />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>选择食材后点击生成推荐</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#E8E4D9' },
  header: { paddingHorizontal: 28, paddingBottom: 8 },
  badge: {
    fontSize: 10,
    fontWeight: '500',
    color: '#7A8470',
    letterSpacing: 3,
    textTransform: 'uppercase',
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
  content: { paddingHorizontal: 20, paddingTop: 12 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0EDE4',
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#D5CFC4',
  },
  switchLeft: { flexDirection: 'row', alignItems: 'center' },
  switchText: { fontSize: 14, color: '#1B1B1B', fontWeight: '400' },
  generateBtn: {
    backgroundColor: '#1B1B1B',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  generateBtnText: { color: '#F0EDE4', fontSize: 14, fontWeight: '500', letterSpacing: 0.5 },
  resultArea: { paddingBottom: 16 },
  resultLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#7A8470',
    marginBottom: 8,
    paddingLeft: 4,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#F0EDE4',
    borderWidth: 1,
    borderColor: '#D5CFC4',
  },
  emptyText: { fontSize: 13, color: '#8A8478' },
});
