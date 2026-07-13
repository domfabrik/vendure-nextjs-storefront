import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { pushEcommerceEvent, reachGoal } from '@/shared/lib';

export interface CartItem {
  productVariantId: string;
  productName: string;
  variantName: string;
  slug: string;
  price: number;
  quantity: number;
  image: string | null;
}

interface CartState {
  items: CartItem[];
  totalQuantity: number;
  totalPrice: number;
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (productVariantId: string) => void;
  setItemQuantity: (productVariantId: string, quantity: number) => void;
  clearCart: () => void;
}

function recalc(items: CartItem[]) {
  return {
    items,
    totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
    totalPrice: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      totalQuantity: 0,
      totalPrice: 0,

      addToCart: (item, quantity = 1) => {
        pushEcommerceEvent({
          add: { products: [{ id: item.productVariantId, name: item.productName, price: item.price / 100, variant: item.variantName, quantity }] },
        });
        reachGoal('add_to_cart');
        set((state) => {
          const existing = state.items.find((i) => i.productVariantId === item.productVariantId);
          if (existing) {
            const updated = state.items.map((i) => (i.productVariantId === item.productVariantId ? { ...i, quantity: i.quantity + quantity } : i));
            return recalc(updated);
          }
          return recalc([...state.items, { ...item, quantity }]);
        });
      },

      removeFromCart: (productVariantId) => {
        const item = useCartStore.getState().items.find((i) => i.productVariantId === productVariantId);
        if (item) {
          pushEcommerceEvent({
            remove: { products: [{ id: item.productVariantId, name: item.productName, price: item.price / 100, variant: item.variantName, quantity: item.quantity }] },
          });
        }
        set((state) => recalc(state.items.filter((i) => i.productVariantId !== productVariantId)));
      },

      setItemQuantity: (productVariantId, quantity) => {
        const item = useCartStore.getState().items.find((i) => i.productVariantId === productVariantId);
        if (item && quantity < item.quantity) {
          pushEcommerceEvent({
            remove: { products: [{ id: item.productVariantId, name: item.productName, price: item.price / 100, variant: item.variantName, quantity: item.quantity - quantity }] },
          });
        }
        set((state) => {
          if (quantity <= 0) {
            return recalc(state.items.filter((i) => i.productVariantId !== productVariantId));
          }
          return recalc(state.items.map((i) => (i.productVariantId === productVariantId ? { ...i, quantity } : i)));
        });
      },

      clearCart: () => set({ items: [], totalQuantity: 0, totalPrice: 0 }),
    }),
    {
      name: 'cart-storage',
    },
  ),
);
