import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Dish } from '@/data/dishes';

type RecipeState = {
  favorites: Dish[];
  customDishes: Dish[];
  toastMessage: string;
  toastVisible: boolean;

  addFavorite: (dish: Dish) => void;
  removeFavorite: (dishId: number) => void;
  isFavorite: (dishId: number) => boolean;

  addCustomDish: (dish: Omit<Dish, 'id' | 'isCustom'>) => void;
  removeCustomDish: (dishId: number) => void;

  showToast: (message: string) => void;
};

const useStore = create<RecipeState>()(
  persist(
    (set, get) => ({
      favorites: [],
      customDishes: [],
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