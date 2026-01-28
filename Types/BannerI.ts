export interface BannerI {
  id: number;
  title: string;
  order: number;
  is_active: boolean;
  grid_layout: null;
  items: ItemsI[];
  dates: object;
}
export interface ItemsI {
  id: number;
  order: number;
  image: string;
  mobile_image?: null;
  alt?: string;
  link_url?: string;
  link_target?: string;
  is_link_active: boolean;
  product_id?: number;
  category_id?: number;
  tag?: {
    text: null;
    color: null;
    background: null;
  };
  is_active?: boolean;
}
