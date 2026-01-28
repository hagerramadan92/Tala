// services/cart.service.ts

import axios from 'axios';
import type {
  AddToCartRequest,
  CartResponse,
  UpdateCartRequest,
} from '@/Types/cartI';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
});

export class CartService {
  static async addToCart(data: AddToCartRequest): Promise<CartResponse> {
    const response = await api.post<CartResponse>('/cart/add', data);
    return response.data;
  }

  static async getCart(): Promise<CartResponse> {
    const response = await api.get<CartResponse>('/cart');
    return response.data;
  }


  static async updateCart(data: UpdateCartRequest): Promise<CartResponse> {
    const response = await api.post<CartResponse>('/cart/items', data);
    return response.data;
  }

  static async removeItem(cartItemId: number): Promise<any> {
    const response = await api.delete(`/cart/items/${cartItemId}`);
    return response.data;
  }

  static async clearCart(): Promise<any> {
    const response = await api.delete('/cart/clear');
    return response.data;
  }
}