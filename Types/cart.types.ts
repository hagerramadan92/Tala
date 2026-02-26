export interface CartItem {
  cart_item_id: number;
  id?: number;
  quantity: number;
  price_per_unit?: number;
  line_total?: number;
  size?: string | null;
  color?: { name?: string } | string | null;
  material?: string | null;
  material_id?: number | null;
  printing_method?: string | null;
  print_locations?: any; // Can be string or array
  image_design?: string | null;
  selected_options?: any;
  product: {
    id: number;
    name: string;
    image: string;
    slug?: string;
    price?: number;
    final_price?: number;
    lowest_price?: number;
    has_discount?: boolean;
    sizes?: any[];
    colors?: any[];
    materials?: any[];
    options?: any[];
    printing_methods?: any[];
    print_locations?: any[];
    options_note?: string;
  };
}

export interface SelectedOption {
  option_name: string;
  option_value: string;
  additional_price?: number;
}

export interface ComputedCartItem extends CartItem {
  _unit: number;
  _line: number;
  _effectiveQty: number;
  _real: {
    discount: boolean;
    unit_after_options: number;
    original_unit_after_options: number;
    discount_unit_after_options: number;
    extras: number;
    one_time_extras: number;
    base_used: number;
    tier_qty: number;
    tier_total: number;
  };
}

export interface CartDraft {
  size?: string;
  color?: string;
  material?: string;
  optionGroups?: Record<string, string>;
  optionChildren?: Record<string, string>;
  printing_method?: string;
  print_locations?: string[];
  size_tier_id?: number | null;
  size_tier_qty?: number | null;
  size_tier_unit?: number | null;
  size_tier_total?: number | null;
  existing_design_url?: string | null;
  has_new_design_file?: boolean;
  design_send_method?: 'whatsapp' | 'email' | 'upload' | null;
  isValid?: boolean;
}

export interface CouponResponse {
  data?: {
    discount_amount?: number;
    new_total?: number;
  };
}