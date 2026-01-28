export interface ProductColor {
  id: number;
  name: string;
  hex_code: string;
  image: string | null;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  children: any[];
  order: number;
  image: string;
  sub_image: string;
  is_parent: boolean;
}

export interface ProductDiscount {
  value: string;
  type: string;
}

export interface ProductDeliveryTime {
  from: number;
  to: number;
  text: string;
}

export interface ProductWarranty {
  months: number;
  text: string;
}

export interface ProductFeature {
  name: string;
  value: string;
}

export interface ProductReview {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
    image: string;
    created_at: string;
  };
}

export interface ProductSize {
  value: string;
}

export interface ProductOffer {
  id: number;
  name: string;
  image: string;
}

export interface ProductMaterial {
  id: number;
  name: string;
  description: string;
}

export interface ProductI {
  id: number;
  name: string;
  slug?: string;
  quantity?:number;
  description?: string;
  price: string;
  final_price?: number;
  has_discount?: boolean;
  includes_tax?: boolean;
  includes_shipping?: boolean;
  is_favorite?: boolean;
  stock: number;
  image: string | null;
  average_rating?: number;
  category?: ProductCategory;
  discount?: ProductDiscount | null;
  colors?: ProductColor[];
  delivery_time?: ProductDeliveryTime;
  warranty?: ProductWarranty;
  features?: ProductFeature[];
  reviews?: ProductReview[];
  sizes?: ProductSize[];
  offers?: ProductOffer[];
  materials?: ProductMaterial[];
  images?: ImagesI[];
    specifications?: string;
}
export interface ImagesI {
  url?: string;
  alt?: string;
  type?: string;
  order?: number;
  active?: number;
}
