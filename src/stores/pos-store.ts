'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { POSCartItem, POSBill, PaymentMethod, Customer } from '@/types'

interface POSState {
  // Cart
  cart: POSCartItem[]
  currentStoreId: string | null
  currentLocationId: string | null
  currentUserId: string | null
  currentShiftId: string | null

  // Customer
  currentCustomer: Customer | null

  // Bill metadata
  billingType: PaymentMethod
  notes: string
  parkingSlipNo: string

  // Actions
  addToCart: (item: POSCartItem) => void
  updateCartItem: (productId: string, variantId: string | undefined, updates: Partial<POSCartItem>) => void
  removeFromCart: (productId: string, variantId: string | undefined) => void
  clearCart: () => void
  setCurrentStore: (storeId: string) => void
  setCurrentLocation: (locationId: string | null) => void
  setCurrentUser: (userId: string) => void
  setCurrentShift: (shiftId: string) => void
  setCurrentCustomer: (customer: Customer | null) => void
  setBillingType: (type: PaymentMethod) => void
  setNotes: (notes: string) => void
  setParkingSlipNo: (slipNo: string) => void

  // Computed
  getCartTotal: () => { subtotal: number; totalGst: number; totalAmount: number; totalDiscount: number }
  getCartItemCount: () => number

  // Hold/Recall
  heldBills: HeldBill[]
  holdBill: (name: string) => void
  recallBill: (heldBillId: string) => void
  deleteHeldBill: (heldBillId: string) => void
}

interface HeldBill {
  id: string
  name: string
  items: POSCartItem[]
  customerId?: string
  customerName?: string
  billingType: PaymentMethod
  notes: string
  createdAt: string
}

export const usePOSStore = create<POSState>()(
  persist(
    (set, get) => ({
      cart: [],
      currentStoreId: null,
      currentLocationId: null,
      currentUserId: null,
      currentShiftId: null,
      currentCustomer: null,
      billingType: 'CASH',
      notes: '',
      parkingSlipNo: '',
      heldBills: [],

      addToCart: (item) => {
        set((state) => {
          const existingIndex = state.cart.findIndex(
            (c) => c.productId === item.productId && c.variantId === item.variantId
          )
          if (existingIndex >= 0) {
            const updated = [...state.cart]
            updated[existingIndex] = {
              ...updated[existingIndex],
              quantity: updated[existingIndex].quantity + item.quantity,
              discountAmount:
                updated[existingIndex].discountAmount +
                item.discountAmount,
              gstAmount:
                updated[existingIndex].gstAmount + item.gstAmount,
              totalAmount:
                updated[existingIndex].totalAmount + item.totalAmount,
            }
            return { cart: updated }
          }
          return { cart: [...state.cart, item] }
        })
      },

      updateCartItem: (productId, variantId, updates) => {
        set((state) => ({
          cart: state.cart.map((item) =>
            item.productId === productId && item.variantId === variantId
              ? { ...item, ...updates }
              : item
          ),
        }))
      },

      removeFromCart: (productId, variantId) => {
        set((state) => ({
          cart: state.cart.filter(
            (item) => !(item.productId === productId && item.variantId === variantId)
          ),
        }))
      },

      clearCart: () => set({ cart: [], currentCustomer: null, notes: '', parkingSlipNo: '' }),

      setCurrentStore: (storeId) => set({ currentStoreId: storeId }),
      setCurrentLocation: (locationId) => set({ currentLocationId: locationId }),
      setCurrentUser: (userId) => set({ currentUserId: userId }),
      setCurrentShift: (shiftId) => set({ currentShiftId: shiftId }),
      setCurrentCustomer: (customer) => set({ currentCustomer: customer }),
      setBillingType: (type) => set({ billingType: type }),
      setNotes: (notes) => set({ notes }),
      setParkingSlipNo: (slipNo) => set({ parkingSlipNo: slipNo }),

      getCartTotal: () => {
        const { cart } = get()
        return cart.reduce(
          (acc, item) => ({
            subtotal: acc.subtotal + item.unitPrice * item.quantity,
            totalGst: acc.totalGst + item.gstAmount,
            totalAmount: acc.totalAmount + item.totalAmount,
            totalDiscount: acc.totalDiscount + item.discountAmount,
          }),
          { subtotal: 0, totalGst: 0, totalAmount: 0, totalDiscount: 0 }
        )
      },

      getCartItemCount: () =>
        get().cart.reduce((acc, item) => acc + item.quantity, 0),

      holdBill: (name) => {
        const { cart, currentCustomer, billingType, notes, heldBills } = get()
        if (cart.length === 0) return
        const held: HeldBill = {
          id: crypto.randomUUID(),
          name,
          items: [...cart],
          customerId: currentCustomer?.id,
          customerName: currentCustomer
            ? `${currentCustomer.firstName}${currentCustomer.lastName ? ' ' + currentCustomer.lastName : ''}`
            : undefined,
          billingType,
          notes,
          createdAt: new Date().toISOString(),
        }
        set({ heldBills: [...heldBills, held], cart: [], currentCustomer: null, notes: '' })
      },

      recallBill: (heldBillId) => {
        const { heldBills } = get()
        const bill = heldBills.find((b) => b.id === heldBillId)
        if (!bill) return
        set({
          cart: bill.items,
          currentCustomer: bill.customerId
            ? { ...get().currentCustomer!, id: bill.customerId } as Customer
            : null,
          billingType: bill.billingType,
          notes: bill.notes,
        })
      },

      deleteHeldBill: (heldBillId) => {
        set((state) => ({
          heldBills: state.heldBills.filter((b) => b.id !== heldBillId),
        }))
      },
    }),
    {
      name: 'pos-storage',
      partialize: (state) => ({
        currentStoreId: state.currentStoreId,
        currentLocationId: state.currentLocationId,
        currentUserId: state.currentUserId,
        currentShiftId: state.currentShiftId,
        heldBills: state.heldBills,
      }),
    }
  )
)
