import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ALL_INGREDIENTS = [
  '鸡肉', '猪肉', '牛肉', '鸡蛋', '豆腐', '番茄',
  '土豆', '茄子', '青椒', '白菜', '花菜', '西兰花',
  '胡萝卜', '木耳', '蒜苗', '四季豆', '香菇', '青菜',
];

type IngredientsPickerProps = {
  selected: string[];
  onToggle: (item: string) => void;
};

export function IngredientsPicker({ selected, onToggle }: IngredientsPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>选择偏好食材</Text>
      <View style={styles.grid}>
        {ALL_INGREDIENTS.map((item) => {
          const isSelected = selected.includes(item);
          return (
            <TouchableOpacity
              key={item}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
              ]}
              onPress={() => onToggle(item)}
              activeOpacity={0.7}>
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  title: {
    fontSize: 10,
    fontWeight: '500',
    color: '#7A8470',
    marginBottom: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: '#E8E4D9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D5CFC4',
  },
  chipSelected: {
    backgroundColor: '#1B1B1B',
    borderColor: '#1B1B1B',
  },
  chipText: {
    fontSize: 14,
    color: '#5A5549',
    fontWeight: '400',
  },
  chipTextSelected: {
    color: '#F0EDE4',
  },
});
