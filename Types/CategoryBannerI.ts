export interface CategoryBannerI {
  id: number;
  order?: number;
  image?: string;
  mobile_image?: null;
  alt?: string;
  link_url?: string;
  link_target?: string;
  is_link_active?: boolean;
  product_id?: number;
  category_id?: number;
  tag?: tagsI;
  is_active?: number;
}
export interface tagsI{
    text: null,
color: null,
background: null
}

