import { CategoryBannerI } from "./CategoryBannerI";
import { ProductI } from "./ProductsI";

export interface SubCategoriesI {
  id: number;
  name: string;
  slug: string;
  description: string;
  children: SubCategoriesI[] | null;
  order: number;
  image: string;
  sub_image: string;
  is_parent: boolean;
  products: ProductI[];
  category_banners:CategoryBannerI[]
}

 