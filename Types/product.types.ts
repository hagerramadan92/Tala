// types/product.types.ts
export type TabKey = "options" | "reviews" | "debug";

export type ReviewUser = {
  id: number;
  name: string;
  avatar: string | null;
  is_verified?: boolean;
};

export type Review = {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  comment: string;
  is_verified: boolean;
  created_at: string;
  human_created_at?: string;
  user?: ReviewUser;
};

export type SelectedOptions = {
  size: string;
  size_tier_id?: number | null;
  size_quantity?: number | null;
  size_price_per_unit?: number | null;
  size_total_price?: number | null;
  color: string;
  material: string;
  optionGroups: Record<string, string>;
  optionChildren: Record<string, string>;
  printing_method: string;
  print_locations: string[];
  isValid: boolean;
};

export type DesignSendMethod = "whatsapp" | "email" | "upload" | null;

export interface StickerFormHandle {
  getOptions: () => SelectedOptions;
  validate: () => boolean;
}

export interface ValidationResult {
  isValid: boolean;
  missingOptions: string[];
}