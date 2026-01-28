import { ProductI } from "@/Types/ProductsI";
import Image from "next/image";
import { LuTruck } from "react-icons/lu";
interface OrderItemType {
  product_name: string;
  quantity: number;
  price: string;
  product: {
    id: number;
    name: string;
    stock: number;
    image: string | null;
    price: string;
  };
}
interface OrderPayDetailsProps {
  item: OrderItemType;
}

export default function OrderPayDetails({item}:OrderPayDetailsProps) {
  
  return (
    <>
      <div className="  border border-gray-200 rounded-md pt-3 overflow-hidden">
        <div className="flex gap-3 ps-3">
          <Image
            src={item.product.image??"/images/o1.jpg"}
            alt="product"
            width={92}
            height={92}
            className="h-fit rounded"
          />

          <div className="pb-3 pt-0">
            <p className="text-sm mb-2 text-gray-700">
             {item.product.name}
            </p>
            <p className="text-gray-500 font-semibold mb-1">
              الكمية : <span>{item.quantity}</span>
            </p>
            <h6 className="font-bold">
              {item.price}
              <span className="font-semibold text-sm ms-1">ريال</span>
            </h6>
          {/* {available &&(    <p className="bg-[#f0fbf3] text-[#20a144] rounded px-3 py-1 w-fit text-md my-2">
              ينتج عند الطلب
            </p>)}  */}
        
           
           {/* { dateDeliver &&(   <div className="flex items-center gap-1">
              <LuTruck size={28} className=" scale-x-[-1] text-gray-600" />
              <p className="text-sm text-gray-600">
                توصيل18 نوفمبر - 20 نوفمبر, بإستثناء الاجازات
              </p>
            </div>)} */}
         
          </div>
        </div>

        {/* <div className="text-gray-700 bg-gray-50 justify-center items-center w-full py-2 font-semibold flex">
         { free? 
         ( <div>
            <p>إجمالي رسوم الشحن</p>
            <span className="font-bold mx-0.5">27</span>
            <span>ريال</span>
          </div>):
         ( <p className=" font-normal text-green-600">شحن مجاني</p>)}
        </div> */}
      </div>
    </>
  );
}
