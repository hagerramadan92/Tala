import React from 'react'
import Link from "next/link";
export default function ProductNotFound() {
  return (
    <>
     <div className="p-10 text-center text-2xl">
          <p>هذا المنتج غير متوفر! </p>
          <button  className="text-white bg-pro px-7 py-2 rounded-4xl mt-5 text-xl pb-3" aria-label='go to home'>
            <Link href="/">متابعة التسوق</Link>
          </button>
        </div>
    </>
  )
}
