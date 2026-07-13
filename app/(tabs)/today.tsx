import { useState, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DishCard } from '@/components/dish-card';
import { dishes } from '@/data/dishes';

function getRandomDish(excludeId?: number) {
  const filtered = dishes.filter((d) => d.id !== excludeId);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const [currentDish, setCurrentDish] = useState(() => getRandomDish());
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef<(() => void) | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const handleRefresh = useCallback(() => {
    setCurrentDish((prev) => getRandomDish(prev?.id));
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 120 }}
        scrollEnabled={!sheetOpen}
        showsVerticalScrollIndicator>
        <View style={styles.header}>
          <Text style={styles.badge}>今日推荐</Text>
          <Text style={styles.title}>今天吃什么？</Text>
          <Text style={styles.subtitle}>每天一道家常美味，告别选择困难</Text>
        </View>

        {currentDish && (
          <DishCard
            dish={currentDish}
            sheetRef={sheetRef}
            onSheetStateChange={setSheetOpen}
          />
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => sheetRef.current?.()}
          activeOpacity={0.85}>
          <Text style={styles.viewBtnText}>查看做法</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shuffleBtn}
          onPress={handleRefresh}
          activeOpacity={0.85}>
          <Text style={styles.shuffleBtnText}>换一道</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8E4D9' },
  scroll: { flex: 1 },
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#E8E4D9',
    borderTopWidth: 1,
    borderTopColor: '#D5CFC4',
  },
  viewBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B1B1B',
  },
  viewBtnText: { color: '#F0EDE4', fontSize: 14, fontWeight: '500', letterSpacing: 0.5 },
  shuffleBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8E4D9',
    borderWidth: 1,
    borderColor: '#D5CFC4',
  },
  shuffleBtnText: { color: '#1B1B1B', fontSize: 14, fontWeight: '500', letterSpacing: 0.5 },
});
