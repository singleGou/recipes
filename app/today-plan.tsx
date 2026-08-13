import { useEffect, useMemo } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import useStore from '@/store/use-store';

type GroceryItem = {
  name: string;
  dishNames: string[];
};

export default function TodayPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const todayMenu = useStore((state) => state.todayMenu);
  const clearTodayMenu = useStore((state) => state.clearTodayMenu);
  const rolloverTodayMenu = useStore((state) => state.rolloverTodayMenu);

  useEffect(() => {
    rolloverTodayMenu();
  }, [rolloverTodayMenu]);

  const groceries = useMemo(() => {
    const groceryMap = new Map<string, GroceryItem>();

    todayMenu.forEach((dish) => {
      dish.ingredients.forEach((ingredient) => {
        const name = ingredient.trim();
        const key = name.toLocaleLowerCase();
        const existing = groceryMap.get(key);

        if (existing) {
          if (!existing.dishNames.includes(dish.name)) existing.dishNames.push(dish.name);
          return;
        }

        groceryMap.set(key, { name, dishNames: [dish.name] });
      });
    });

    return Array.from(groceryMap.values());
  }, [todayMenu]);

  const confirmClear = () => {
    Alert.alert('清空今日菜单', '确定清空已经选好的菜吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '清空',
        style: 'destructive',
        onPress: () => {
          clearTodayMenu();
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={planStyles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          planStyles.content,
          { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 48 },
        ]}>
        <View style={planStyles.topBar}>
          <TouchableOpacity
            style={planStyles.iconButton}
            onPress={() => router.back()}
            activeOpacity={0.72}>
            <Ionicons name="arrow-back" size={20} color="#1B1B1B" />
          </TouchableOpacity>
          {todayMenu.length > 0 && (
            <TouchableOpacity onPress={confirmClear} activeOpacity={0.7}>
              <Text style={planStyles.clearText}>清空菜单</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={planStyles.eyebrow}>{"TODAY'S TABLE"}</Text>
        <Text style={planStyles.title}>今天就做这些</Text>
        <Text style={planStyles.subtitle}>
          {todayMenu.length > 0
            ? `${todayMenu.length} 道菜，食材与步骤已经替你归拢好`
            : '还没有选菜，回去抽几张喜欢的吧'}
        </Text>

        {todayMenu.length === 0 ? (
          <View style={planStyles.emptyState}>
            <View style={planStyles.emptyPlate}>
              <Ionicons name="restaurant-outline" size={32} color="#7A8470" />
            </View>
            <Text style={planStyles.emptyTitle}>餐桌还空着</Text>
            <TouchableOpacity
              style={planStyles.primaryButton}
              onPress={() => router.back()}
              activeOpacity={0.82}>
              <Text style={planStyles.primaryButtonText}>继续抽菜</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={planStyles.menuGrid}>
              {todayMenu.map((dish, index) => (
                <View key={dish.id} style={planStyles.menuDish}>
                  <View
                    style={[
                      planStyles.menuDishColor,
                      { backgroundColor: dish.color || '#7A8470' },
                    ]}>
                    <Text style={planStyles.menuDishEmoji}>{dish.emoji || '🍽️'}</Text>
                    <Text style={planStyles.menuDishNumber}>
                      {String(index + 1).padStart(2, '0')}
                    </Text>
                  </View>
                  <Text style={planStyles.menuDishName} numberOfLines={1}>{dish.name}</Text>
                </View>
              ))}
            </View>

            <View style={planStyles.sectionHeader}>
              <Text style={planStyles.sectionNumber}>01</Text>
              <View>
                <Text style={planStyles.sectionTitle}>采购清单</Text>
                <Text style={planStyles.sectionHint}>{groceries.length} 种食材，重复项已合并</Text>
              </View>
            </View>

            <View style={planStyles.groceryList}>
              {groceries.map((item) => (
                <View key={item.name} style={planStyles.groceryRow}>
                  <View style={planStyles.checkbox} />
                  <View style={planStyles.groceryInfo}>
                    <Text style={planStyles.groceryName}>{item.name}</Text>
                    {item.dishNames.length > 1 && (
                      <Text style={planStyles.groceryUse} numberOfLines={1}>
                        共用于 {item.dishNames.length} 道菜
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            <View style={planStyles.sectionHeader}>
              <Text style={planStyles.sectionNumber}>02</Text>
              <View>
                <Text style={planStyles.sectionTitle}>备菜顺序</Text>
                <Text style={planStyles.sectionHint}>先统一备料，再按菜单逐道烹饪</Text>
              </View>
            </View>

            <View style={planStyles.prepList}>
              <View style={planStyles.prepRow}>
                <View style={planStyles.prepMarker}><Text style={planStyles.prepMarkerText}>A</Text></View>
                <View style={planStyles.prepCopy}>
                  <Text style={planStyles.prepTitle}>先把全部食材取齐</Text>
                  <Text style={planStyles.prepBody}>按采购清单核对，调味料与主料分开放置。</Text>
                </View>
              </View>
              {todayMenu.map((dish, index) => (
                <View key={dish.id} style={planStyles.prepRow}>
                  <View style={planStyles.prepMarker}>
                    <Text style={planStyles.prepMarkerText}>{index + 1}</Text>
                  </View>
                  <View style={planStyles.prepCopy}>
                    <Text style={planStyles.prepTitle}>准备「{dish.name}」</Text>
                    <Text style={planStyles.prepBody}>{dish.ingredients.join(' · ')}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={planStyles.sectionHeader}>
              <Text style={planStyles.sectionNumber}>03</Text>
              <View>
                <Text style={planStyles.sectionTitle}>完整做法</Text>
                <Text style={planStyles.sectionHint}>按选菜顺序逐道完成</Text>
              </View>
            </View>

            {todayMenu.map((dish, dishIndex) => (
              <View key={dish.id} style={planStyles.recipeBlock}>
                <View style={planStyles.recipeHeader}>
                  <View
                    style={[
                      planStyles.recipeEmojiBox,
                      { backgroundColor: `${dish.color || '#7A8470'}22` },
                    ]}>
                    <Text style={planStyles.recipeEmoji}>{dish.emoji || '🍽️'}</Text>
                  </View>
                  <View style={planStyles.recipeHeading}>
                    <Text style={planStyles.recipeKicker}>第 {dishIndex + 1} 道</Text>
                    <Text style={planStyles.recipeName}>{dish.name}</Text>
                  </View>
                </View>
                {dish.steps.map((step, stepIndex) => (
                  <View key={stepIndex} style={planStyles.stepRow}>
                    <Text style={planStyles.stepNumber}>
                      {String(stepIndex + 1).padStart(2, '0')}
                    </Text>
                    <Text style={planStyles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            ))}

            <TouchableOpacity
              style={planStyles.secondaryButton}
              onPress={() => router.back()}
              activeOpacity={0.8}>
              <Ionicons name="add" size={17} color="#1B1B1B" />
              <Text style={planStyles.secondaryButtonText}>继续加菜</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const planStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8E4D9' },
  content: { paddingHorizontal: 22 },
  topBar: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  iconButton: {
    width: 44,
    height: 44,
    marginLeft: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: { color: '#8A8478', fontSize: 12 },
  eyebrow: {
    color: '#7A8470',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2.4,
  },
  title: {
    marginTop: 8,
    color: '#1B1B1B',
    fontSize: 32,
    fontFamily: 'Georgia',
    letterSpacing: -0.6,
  },
  subtitle: { marginTop: 7, color: '#8A8478', fontSize: 14, lineHeight: 21 },
  emptyState: { alignItems: 'center', paddingTop: 90 },
  emptyPlate: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: '#D5CFC4',
    backgroundColor: '#F0EDE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { marginTop: 18, color: '#3D3A35', fontSize: 17, fontFamily: 'Georgia' },
  primaryButton: {
    minWidth: 144,
    minHeight: 48,
    marginTop: 24,
    backgroundColor: '#1B1B1B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#F0EDE4', fontSize: 13, fontWeight: '600' },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 28 },
  menuDish: { width: '31.5%', backgroundColor: '#F0EDE4', paddingBottom: 10 },
  menuDishColor: { height: 72, alignItems: 'center', justifyContent: 'center' },
  menuDishEmoji: { fontSize: 34 },
  menuDishNumber: {
    position: 'absolute',
    top: 7,
    left: 8,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 9,
    fontWeight: '700',
  },
  menuDishName: {
    marginTop: 9,
    paddingHorizontal: 9,
    color: '#1B1B1B',
    fontSize: 12,
    fontFamily: 'Georgia',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 38,
    marginBottom: 16,
    paddingBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#CFC8BA',
  },
  sectionNumber: {
    width: 38,
    color: '#7A8470',
    fontSize: 12,
    fontFamily: 'Georgia',
  },
  sectionTitle: { color: '#1B1B1B', fontSize: 18, fontFamily: 'Georgia' },
  sectionHint: { marginTop: 3, color: '#8A8478', fontSize: 11 },
  groceryList: { flexDirection: 'row', flexWrap: 'wrap' },
  groceryRow: {
    width: '50%',
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  checkbox: { width: 14, height: 14, borderWidth: 1, borderColor: '#9D9688', marginRight: 9 },
  groceryInfo: { flex: 1 },
  groceryName: { color: '#3D3A35', fontSize: 13 },
  groceryUse: { marginTop: 2, color: '#9D9688', fontSize: 9 },
  prepList: { gap: 16 },
  prepRow: { flexDirection: 'row', alignItems: 'flex-start' },
  prepMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1B1B1B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  prepMarkerText: { color: '#F0EDE4', fontSize: 11, fontFamily: 'Georgia' },
  prepCopy: { flex: 1, paddingTop: 1 },
  prepTitle: { color: '#1B1B1B', fontSize: 14, fontWeight: '600' },
  prepBody: { marginTop: 4, color: '#8A8478', fontSize: 12, lineHeight: 19 },
  recipeBlock: { backgroundColor: '#F0EDE4', marginBottom: 12, padding: 18 },
  recipeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  recipeEmojiBox: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  recipeEmoji: { fontSize: 28 },
  recipeHeading: { marginLeft: 13 },
  recipeKicker: { color: '#7A8470', fontSize: 9, letterSpacing: 1.2 },
  recipeName: { marginTop: 3, color: '#1B1B1B', fontSize: 18, fontFamily: 'Georgia' },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 13 },
  stepNumber: { width: 30, color: '#7A8470', fontSize: 10, fontFamily: 'Georgia' },
  stepText: { flex: 1, color: '#4B473F', fontSize: 13, lineHeight: 21 },
  secondaryButton: {
    minHeight: 50,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: '#1B1B1B',
  },
  secondaryButtonText: { color: '#1B1B1B', fontSize: 13, fontWeight: '600' },
});
