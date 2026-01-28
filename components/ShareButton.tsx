"use client";

import { BsShare } from "react-icons/bs";
import toast from "react-hot-toast";
import { BiShareAlt } from "react-icons/bi";

export default function ShareButton() {
  const handleShare = async () => {
    const url = window.location.href;
    const title = document.title;

    if (navigator.share) {
      
      try {
        await navigator.share({ title, url });
        toast.success("تمت المشاركة بنجاح!");
      } catch (err) {
        console.error(err);
        toast.error("فشل المشاركة");
      }
    } else {
     
      try {
        await navigator.clipboard.writeText(url);
        toast.success("تم نسخ رابط الصفحة!");
      } catch (err) {
        console.error(err);
        toast.error("فشل نسخ الرابط");
      }
    }
  };

  return (
    <div
    aria-label="share it"
      onClick={handleShare}
      className="w-8 h-8 md:w-11 md:h-11 border border-gray-200 rounded-full bg-white/70 duration-75 flex items-center justify-center p-0.5 cursor-pointer transition-transform hover:scale-110"
    >
  
      <BsShare size={17} className="text-gray-500" />
    </div>
  );
}
