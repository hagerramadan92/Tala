import { ProductI } from "./ProductsI";

export interface OrderCompleteI {
  id: number;
  order_number: string;
  status?: string;
  status_label?: string;
  total_amount?: string;
  formatted_total?: string;
  customer_name?: string;
  customer_phone?: string;
  shipping_address?: string;
  user?: UserI;
  notes?: string;
  created_at?: string;
  items: ItemsOrder[];
  full_address?: FullAddressI;
  payment_method_label?: string;
}

export interface ItemsOrder {
  product_name: string;
  quantity: number;
  price: string;
  options: string;
  image?: string | null;
  product: ProductI;
}

export interface UserI {
  id: number;
  name: string;
  email: string;
  image: string;
  created_at: string;
}
export interface FullAddressI {
  apartment_number?: null;
  area:string;
  building?: null;
  city: string;
  details: string;
  floor?: null;
  full_name: string;
  id: number;
  label:string;
  phone: string;
  type:string;
}
