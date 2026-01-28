"use client";
import { useState, useRef, useEffect } from "react";
import { HiOutlineShoppingBag } from "react-icons/hi";
import { AiOutlineClose } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useCart } from "@/src/context/CartContext";
import Image from "next/image";

export default function CartSidebar() {
  const [cartOpen, setCartOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const { cart , total  } = useCart();


const formattedTotal = total.toLocaleString("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});




  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setCartOpen(false);
      }
    };
    if (cartOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [cartOpen]);

  return (
    <>
      <Link href="/cart"
        className="relative cursor-pointer"
      
      >
        <div className="flex relative gap-1">
        
					<p className=" max-md:hidden ">العربة</p>
          <HiOutlineShoppingBag size={25} strokeWidth={1.3} />
          {
            cart.length>0 && (  <span className="absolute -top-2 -left-2  bg-red-500 rounded-full w-5 h-5 p-2 text-[0.9rem] flex items-center justify-center text-white">
            {cart.length}
          </span>)
          }
        </div>
      </Link>
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
            />

            <motion.div
              ref={sidebarRef}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 w-80 md:w-[430px] h-full bg-white z-50 shadow-lg p-4 px-6 overflow-y-auto flex flex-col"
            >
              <div className="flex justify-between items-center border-b border-gray-200 py-5">
                <h2 className="text-[1.1rem] font-bold">
                  عربة التسوق
                  <span className=" font-normal">{cart.length}منتج</span>
                </h2>
                <button
                  onClick={() => setCartOpen(false)}
                  aria-label="close"
                  className="self-end text-gray-600 hover:text-gray-800 cursor-pointer"
                >
                  <AiOutlineClose size={20} />
                </button>
              </div>
              <Link
                href="/cart"
                className="text-pro border  border-pro text-white py-2 rounded-lg  text-center mt-5 hover:bg-gray-50 transition"
                onClick={() => setCartOpen(false)}
              >
                  متابعة الي الشراء
              </Link>
              <div className="flex items-center justify-between pt-2">
                <h3 className="font-semibold">ملخص الطلبات</h3>
                <div className="flex">
                  <h4>المجموع الفرعي </h4>
                  <p className="font-bold">
                    {formattedTotal}
                    <span>ريال</span>
                  </p>
                </div>
              </div>
              <div className="flex-1 ">
                {cart.length === 0 ? (
                  <p className="text-center text-gray-500 mt-10">
                    العربة فارغة
                  </p>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.cart_item_id}
                      className="flex justify-between items-center mb-3 shadow-[rgb(0 0 0 / 10%)] rounded-xl mx-2 shadow  my-5"
                    >
                      <div className="flex gap-3 py-3">
                        <Image
                          src={item.product.image || "images/o1.jpg"}
                          alt={item.product.name}
                          width={80}
                          height={80}
                          className="p-2"
                        />
                        <div>
                          <p className="font-semibold text-[0.8rem] text-gray-700">
                            {item.product.name}
                          </p>
                          <p className="text-lg text-gray-900 font-bold mt-4">
                            <span className="font-normal text-sm me-2">ريال</span>
                            {item.product.price}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
