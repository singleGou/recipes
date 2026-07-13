import { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useStore from '@/store/use-store';
import type { Dish } from '@/data/dishes';

function AddDishModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');
  const addCustomDish = useStore((s) => s.addCustomDish);
  const showToast = useStore((s) => s.showToast);

  const handleSave = useCallback(() => {
    if (!name.trim()) return Alert.alert('提示', '请输入菜名');
    if (!ingredients.trim()) return Alert.alert('提示', '请输入食材');
    if (!steps.trim()) return Alert.alert('提示', '请输入做法步骤');
    addCustomDish({
      name: name.trim(),
      description: '我的拿手菜',
      ingredients: ingredients.split(',').map((s) => s.trim()).filter(Boolean),
      steps: steps.split('\n').map((s) => s.trim()).filter(Boolean),
      tags: ['拿手菜'],
      emoji: '\uD83D\uDC68\u200D\uD83C\uDF73',
      color: '#7A8470',
    });
    showToast('新增拿手菜成功');
    setName('');
    setIngredients('');
    setSteps('');
    onClose();
  }, [name, ingredients, steps, addCustomDish, showToast, onClose]);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>新增拿手菜</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color="#8A8478" />
            </TouchableOpacity>
          </View>
          <Text style={modalStyles.label}>菜名</Text>
          <TextInput
            style={modalStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="如：可乐鸡翅"
            placeholderTextColor="#B0A99A"
          />
          <Text style={modalStyles.label}>食材（逗号分隔）</Text>
          <TextInput
            style={modalStyles.input}
            value={ingredients}
            onChangeText={setIngredients}
            placeholder="如：鸡翅, 可乐, 姜"
            placeholderTextColor="#B0A99A"
          />
          <Text style={modalStyles.label}>做法步骤（每行一步）</Text>
          <TextInput
            style={[modalStyles.input, modalStyles.stepsInput]}
            value={steps}
            onChangeText={setSteps}
            placeholder="鸡翅划刀焯水&#10;煎至两面金黄&#10;..."
            placeholderTextColor="#B0A99A"
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity style={modalStyles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={modalStyles.saveBtnText}>保存</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(27,27,27,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#F0EDE4',
    padding: 24,
    paddingBottom: 40,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  title: { fontSize: 18, fontWeight: '400', color: '#1B1B1B', fontFamily: 'Georgia' },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: '#7A8470',
    marginBottom: 8,
    marginTop: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D5CFC4',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1B1B1B',
    backgroundColor: '#E8E4D9',
  },
  stepsInput: { height: 110, paddingTop: 12 },
  saveBtn: {
    backgroundColor: '#1B1B1B',
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: { color: '#F0EDE4', fontSize: 14, fontWeight: '500', letterSpacing: 0.5 },
});

function DishItem({ dish, onDelete }: { dish: Dish; onDelete: () => void }) {
  return (
    <View style={itemStyles.item}>
      <View style={[itemStyles.emojiBox, { backgroundColor: (dish.color || '#E8E4D9') + '20' }]}>
        <Text style={itemStyles.emoji}>{dish.emoji || '\uD83C\uDF7D\uFE0F'}</Text>
      </View>
      <View style={itemStyles.info}>
        <Text style={itemStyles.name}>{dish.name}</Text>
        <Text style={itemStyles.ingPreview} numberOfLines={1}>
          {dish.ingredients?.slice(0, 4).join(' \u00B7 ')}
          {dish.ingredients && dish.ingredients.length > 4 ? ` +${dish.ingredients.length - 4}` : ''}
        </Text>
      </View>
      <TouchableOpacity style={itemStyles.delBtn} onPress={onDelete}>
        <Ionicons name="trash-outline" size={16} color="#8A8478" />
      </TouchableOpacity>
    </View>
  );
}

const itemStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0EDE4',
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#D5CFC4',
  },
  emojiBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  emoji: { fontSize: 24 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '400', color: '#1B1B1B', marginBottom: 4, fontFamily: 'Georgia' },
  ingPreview: { fontSize: 12, color: '#8A8478' },
  delBtn: { padding: 10 },
});

type Section = { title: string; data: Dish[]; type: 'favorite' | 'custom' };

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);

  const favorites = useStore((s) => s.favorites);
  const customDishes = useStore((s) => s.customDishes);
  const removeFavorite = useStore((s) => s.removeFavorite);
  const removeCustomDish = useStore((s) => s.removeCustomDish);
  const showToast = useStore((s) => s.showToast);

  const sections: Section[] = [
    { title: '收藏的菜', data: favorites, type: 'favorite' },
    { title: '我的拿手菜', data: customDishes, type: 'custom' },
  ];

  const handleDelete = useCallback(
    (dishId: number, type: 'favorite' | 'custom') => {
      Alert.alert('确认删除', '确定要删除这道菜吗？', [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            type === 'favorite' ? removeFavorite(dishId) : removeCustomDish(dishId);
            showToast('已删除');
          },
        },
      ]);
    },
    [removeFavorite, removeCustomDish, showToast]
  );

  const renderSection = ({ item: section }: { item: Section }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {section.title}
          <Text style={styles.countText}> {section.data.length}</Text>
        </Text>
        {section.type === 'custom' && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={18} color="#7A8470" />
            <Text style={styles.addBtnText}>新增</Text>
          </TouchableOpacity>
        )}
      </View>
      {section.data.length === 0 ? (
        <View style={styles.emptyRow}>
          <Text style={styles.emptyText}>
            {section.type === 'favorite' ? '还没有收藏的菜' : '点击上方新增拿手菜'}
          </Text>
        </View>
      ) : (
        section.data.map((dish) => (
          <DishItem key={dish.id} dish={dish} onDelete={() => handleDelete(dish.id, section.type)} />
        ))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sections}
        keyExtractor={(item) => item.title}
        renderItem={renderSection}
        showsVerticalScrollIndicator
        contentContainerStyle={{
          paddingTop: insets.top + 40,
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.badge}>我的菜单</Text>
            <Text style={styles.title}>我的菜单</Text>
            <Text style={styles.subtitle}>收藏与拿手菜，一页搞定</Text>
          </View>
        }
      />
      <AddDishModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8E4D9' },
  header: { paddingBottom: 20 },
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
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '400', color: '#1B1B1B', fontFamily: 'Georgia' },
  countText: { fontSize: 12, color: '#8A8478' },
  addBtn: { flexDirection: 'row', alignItems: 'center' },
  addBtnText: { fontSize: 12, color: '#7A8470', fontWeight: '500', marginLeft: 2 },
  emptyRow: {
    backgroundColor: '#F0EDE4',
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D5CFC4',
  },
  emptyText: { fontSize: 13, color: '#8A8478' },
});
