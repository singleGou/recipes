import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Dish } from '@/data/dishes';

type RecipeState = {
  favorites: Dish[];
  customDishes: Dish[];
  todayMenu: Dish[];
  todayMenuDate: string;
  toastMessage: string;
  toastVisible: boolean;

  addFavorite: (dish: Dish) => void;
  removeFavorite: (dishId: number) => void;
  isFavorite: (dishId: number) => boolean;

  addCustomDish: (dish: Omit<Dish, 'id' | 'isCustom'>) => void;
  removeCustomDish: (dishId: number) => void;

  addTodayDish: (dish: Dish) => void;
  removeTodayDish: (dishId: number) => void;
  clearTodayMenu: () => void;
  rolloverTodayMenu: () => void;

  showToast: (message: string) => void;
};

function getTodayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const useStore = create<RecipeState>()(
  persist(
    (set, get) => ({
      favorites: [],
      customDishes: [],
      todayMenu: [],
      todayMenuDate: getTodayKey(),
      toastMessage: '',
      toastVisible: false,

      addFavorite: (dish) =>
        set((state) => {
          const exists = state.favorites.some((d) => d.id === dish.id);
          if (exists) return state;
          return { favorites: [...state.favorites, dish] };
        }),

      removeFavorite: (dishId) =>
        set((state) => ({
          favorites: state.favorites.filter((d) => d.id !== dishId),
        })),

      isFavorite: (dishId) => get().favorites.some((d) => d.id === dishId),

      addCustomDish: (dish) =>
        set((state) => ({
          customDishes: [
            ...state.customDishes,
            { ...dish, id: Date.now(), isCustom: true },
          ],
        })),

      removeCustomDish: (dishId) =>
        set((state) => ({
          customDishes: state.customDishes.filter((d) => d.id !== dishId),
        })),

      addTodayDish: (dish) =>
        set((state) => {
          const todayMenu = state.todayMenuDate === getTodayKey() ? state.todayMenu : [];
          if (todayMenu.some((item) => item.id === dish.id)) {
            return { todayMenu, todayMenuDate: getTodayKey() };
          }
          return { todayMenu: [...todayMenu, dish], todayMenuDate: getTodayKey() };
        }),

      removeTodayDish: (dishId) =>
        set((state) => ({
          todayMenu:
            state.todayMenuDate === getTodayKey()
              ? state.todayMenu.filter((dish) => dish.id !== dishId)
              : [],
          todayMenuDate: getTodayKey(),
        })),

      clearTodayMenu: () => set({ todayMenu: [], todayMenuDate: getTodayKey() }),

      rolloverTodayMenu: () =>
        set((state) =>
          state.todayMenuDate === getTodayKey()
            ? state
            : { todayMenu: [], todayMenuDate: getTodayKey() }
        ),

      showToast: (message) => {
        set({ toastMessage: message, toastVisible: true });
        setTimeout(() => {
          set({ toastVisible: false, toastMessage: '' });
        }, 2000);
      },
    }),
    {
      name: 'recipes-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useStore;
