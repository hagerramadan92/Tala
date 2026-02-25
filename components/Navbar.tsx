"use client";
// import CateNavbar from "./cateNavbar";
import HeaderAdsSlider from "./HeaderAdsSlider";
// import LangNavbar from "./langNavbar";
import SearchNavbar from "./searchNavbar";

export default function Navbar() {
	return (

		<div className=" h-fit  z-888 bg-white/80 fixed top-0 start-0 end-0 w-full  ">
			{/* <HeaderAdsSlider /> */}
			<SearchNavbar />
			{/* <CateNavbar /> */}
		</div>
	);
}
