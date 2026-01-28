// types/cart.types.ts

export interface SelectedOption {
  option_name: string;
  option_value: string;
}

export interface AddToCartPayload {
  product_id: number;
  quantity?: number;
  size_id?: number | null;
  color_id?: number | null;
  printing_method_id?: number | null;
  print_locations?: number[];
  embroider_locations?: number[];
  selected_options?: { option_name: string; option_value: string }[];
  design_service_id?: number | null;
  is_sample?: boolean;
  note?: string;
  image_design?: string | null;
}
export interface AddToCartRequest {
  product_id: number;
  quantity: number;
  size_id?: number | null;
  color_id?: number | null;
  printing_method_id?: number | null;
  print_locations?: number[];
  embroider_locations?: number[];
  selected_options?: SelectedOption[];
  design_service_id?: number | null;
  is_sample?: boolean;
  note?: string;
  quantity_id?: string | null;
  image_design?: string | null;
}

export interface CartItemColor {
  name: string;
  hex: string;
}

export interface CartItem {
  id: number;
  product: {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: string;
    final_price: number;
    has_discount: boolean;
    includes_tax: boolean;
    includes_shipping: boolean;
    stock: number;
    image: string;
    average_rating: number;
    is_favorite: boolean;
  };
  size: string | null;
  color: CartItemColor | null;
  printing_method: string | null;
  print_locations: string;
  embroider_locations: string;
  selected_options: string;
  design_service: string | null;
  quantity: number;
  is_sample: 0 | 1;
  price_per_unit: string;
  line_total: string;
}

export interface CartResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    items_count: number;
    subtotal: string;
    total: string;
    items: CartItem[];
  };
}

export interface UpdateCartRequest {
  cart_item_id: number;
  quantity?: number;
  size_id?: number | null;
  color_id?: number | null;
  printing_method_id?: number | null;
  print_locations?: number[];
  embroider_locations?: number[];
  selected_options?: SelectedOption[];
  design_service_id?: number | null;
  is_sample?: boolean;
  note?: string;
}