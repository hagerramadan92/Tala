import { ReviewsI } from "@/Types/ReviewsI";
import { FaStar } from "react-icons/fa";
import { PiStarHalfFill } from "react-icons/pi";
import { SlStar } from "react-icons/sl";

export default function RatingStars({ average_ratingc , reviewsc}: { average_ratingc: number , reviewsc:ReviewsI[]}) {
  const fullStars = Math.floor(average_ratingc);    
  const hasHalfStar = average_ratingc % 1 >= 0.5;   
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0); 

  return (
    <div className="flex gap-1.5 items-center mt-2">
      {/* <p className="text-[13px] text-gray-900 font-semibold">{average_ratingc}</p> */}

      <div className="text-yellow-500 flex text-[1.2rem] gap-1">
   
        {Array.from({ length: fullStars }).map((_, i) => (

          <FaStar  size={18} key={`full-${i}`} />
        ))}

        {hasHalfStar && <PiStarHalfFill  size={19} className="scale-x-[-1]" />}
     

        {Array.from({ length: emptyStars }).map((_, i) => (
          
          <SlStar size={17}  key={`empty-${i}`}/>
        ))}
      </div>

      <p className=" max-md:hidden text-[13px] text-gray-400 font-semibold ms-1">({reviewsc.length}  تقييم) </p>
    </div>
  );
}
