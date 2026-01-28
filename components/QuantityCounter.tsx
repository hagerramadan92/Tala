// "use client";
// import { useState } from "react";
// import { FiMinus, FiPlus } from "react-icons/fi";
// import ButtonComponent from "@/components/ButtonComponent";
// import Toast from "@/components/Toaster";
// import { useCart } from "@/src/context/CartContext";
// import { ProductIn } from "@/Types/ProductIn";
// import { ProductI } from "@/Types/ProductsI";


// interface QuantityCounterProps {
//   product: ProductI
// }

// export default function QuantityCounter({ product }: QuantityCounterProps) {
//   const [quant, setQuant] = useState(1);
//   const [toast, setToast] = useState<{ msg: string; img?: string; type: "success" | "warning" | "error" } | null>(null);

//   const { cart, addToCart } = useCart(); 

//   const showToast = (msg: string, type: "success" | "warning" | "error" = "success", img?: string) => {
//     setToast({ msg, type, img });
//     setTimeout(() => setToast(null), 3000);
//   };

//   const increase = () => {
//     if (quant < 10) {
//       const newQuant = quant + 1;
//       setQuant(newQuant);
//       if (newQuant === 10)
//         showToast("لقد وصلت إلى الحد الأقصى للكمية، تواصل مع الدعم", "warning");
//     }
//   };

//   const decrease = () => {
//     if (quant > 1) setQuant(prev => prev - 1);
//     else showToast("أقل كمية يمكن طلبها هي منتج واحد", "warning");
//   };

//   const handleAddToCart = () => {
   
//     const exists = cart.find(item => item.id === product.id);

//     // if (exists) {
   
//     //   addToCart({ ...product, quantity: quant });
//     // } else {
  
//     //   addToCart({ ...product, quantity: quant });
//     // }

//     showToast("تمت إضافة المنتج إلى العربة بنجاح!", "success", product.image || "");
//   };

//   return (
//     <div className="relative w-full">
//       {toast && <Toast message={toast.msg} type={toast.type} img={toast.img} />}

//       <div className="flex items-center mt-3">
//         <h3 className="mt-2 me-2 text-gray-700 font-semibold">الكمية:</h3>
//         <div className="flex items-center gap-3 mt-4 h-fit">
//           <button
//             onClick={decrease}
//             aria-label="decrease"
//             className={`bg-gray-200 rounded w-8 h-8 flex items-center justify-center transition 
//               ${quant === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-800 hover:bg-gray-300"}`}
//           >
//             <FiMinus size={19} />
//           </button>

//           <span className="text-lg font-semibold w-8 text-center select-none">{quant}</span>

//           <button
//             onClick={increase}
//             aria-label="increase"
//             className={`bg-gray-200 rounded w-8 h-8 flex items-center justify-center transition 
//               ${quant === 10 ? "text-gray-400 cursor-not-allowed" : "text-gray-800 hover:bg-gray-300"}`}
//           >
//             <FiPlus size={19} />
//           </button>
//         </div>
//       </div>

//       <div className="mt-4">
//         <ButtonComponent title="أضف إلى العربة" onClick={handleAddToCart} />
//       </div>
//     </div>
//   );
// }
