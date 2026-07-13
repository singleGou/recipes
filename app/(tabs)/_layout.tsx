import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TAB_ICON = {
  today: { focused: 'restaurant', unfocused: 'restaurant-outline', label: '今日' },
  custom: { focused: 'nutrition', unfocused: 'nutrition-outline', label: '生成' },
  menu: { focused: 'bookmark', unfocused: 'bookmark-outline', label: '菜单' },
} as const;

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const icon = TAB_ICON[route.name as keyof typeof TAB_ICON];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              activeOpacity={0.7}>
              <Ionicons
                name={(isFocused ? icon.focused : icon.unfocused) as never}
                size={20}
                color={isFocused ? '#1B1B1B' : '#B0A99A'}
              />
              <Text style={[styles.label, { color: isFocused ? '#1B1B1B' : '#B0A99A' }]}>
                {icon.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen name="today" />
      <Tabs.Screen name="custom" />
      <Tabs.Screen name="menu" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0EDE4',
    borderTopWidth: 1,
    borderTopColor: '#D5CFC4',
  },
  row: {
    flexDirection: 'row',
    height: 48,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.5,
  },
});
