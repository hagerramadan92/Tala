import React from 'react'

export default function PriceComponent({ start, final_price, price_text }: any) {
	return (


		price_text
			? <span className='font-[400] max-md:text-sm mt-1 opacity-50 text-nowrap' >{price_text}</span>
			: <> <div className="flex gap-1">
				<div className='flex items-center gap-1'>
					{start && <span className='font-[400] max-md:text-xs opacity-50 text-nowrap' >يبدأ من </span>}
					<h3 className="font-bold text-xl max-md:text-sm  text-[#14213d]">{final_price?.toFixed(2)}</h3>
				</div>
				<span className="mt-1 max-md:text-xs">ريال</span>
			</div></>



	)
}
