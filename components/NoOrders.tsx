'use client'
import ButtonComponent from "./ButtonComponent";
import { useRouter } from "next/navigation";
interface TitleProps {
	title: string
}
export default function NoOrders({ title }: TitleProps) {
	const router = useRouter();
	return (
		<>
			<div className="py-5">
				<p className="text-center text-gray-900 font-semibold mt-5 text-2xl">
					{title}
				</p>
				<div className="w-36 mx-auto mt-5">
					<ButtonComponent
						className="text-nowrap"
						title="متابعة التسوق"
						onClick={() => router.push("/")}
					/>
				</div>
			</div>
		</>
	)
}
