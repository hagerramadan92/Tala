export interface ProductIn{
  id: number ;
  image:string | null,
  name:string,
  description?:string,
  stock?:number,
  price:string ,
  oldPrice?:string,
  discount?:number,
  quantity:number,
  categorySlug?: string,
   categoryName?: string
}