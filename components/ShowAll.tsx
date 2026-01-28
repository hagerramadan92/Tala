
import Link from "next/link";
import { RiArrowRightSLine } from "react-icons/ri";
interface ShowProps{
    title:string,
    Anchor:string,
    link?:string
}
export default function ShowAll({title,Anchor,link}:ShowProps) {
  return (
    <>
    <div className="flex justify-between md:flex-nowrap flex-wrap">
              <h2 className="text-xl md:text-2xl font-bold text-pro pt-5  py-2">
                {title}
              </h2>
              <div className="flex gap-1 items-center text-pro cursor-pointer font-semibold text-[1.1rem]">
                <Link href={link||"/"} aria-label="products page"> 
                        {Anchor}
                        
                </Link>
                <RiArrowRightSLine size={28} className=" rotate-180 " />
              </div>
            </div>
    </>
  )
}
