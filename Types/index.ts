export type SelectedOpt = { 
    option_name: string; 
    option_value: string; 
    additional_price?: number 
};

export interface StickerFormProps {
    cartItemId?: number;
    productId: number;
    productData?: any;
    cartItem?: any;
    onOptionsChange?: (cartItemId: number, options: any) => void;
    showValidation?: boolean;
}

export interface CartItemType {
    cart_item_id: number;
    product: any;
    quantity: number;
    selected_options: any;
    size?: string;
    color?: any;
    material?: string;
    printing_method?: string;
    print_locations?: any;
    image_design?: string;
    price_per_unit: number;
    line_total: number;
    [key: string]: any;
}

export interface PricingResult {
    unit: number;
    line: number;
    showRealProductPrice: any;
    effectiveQty: number;
}

export interface DraftType {
    size: string;
    color: string;
    material: string;
    optionGroups: Record<string, string>;
    optionChildren: Record<string, string>;
    printing_method: string;
    print_locations: string[];
    size_tier_id: number | null;
    size_tier_qty: number | null;
    size_tier_unit: number | null;
    size_tier_total: number | null;
    existing_design_url?: string | null;
    has_new_design_file?: boolean;
    design_delivery?: string;
    isValid?: boolean;
}
