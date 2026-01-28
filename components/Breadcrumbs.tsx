import Breadcrumbs from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Link from "next/link";

interface nameProps {
  proName: string;
}
export default function CustomSeparator({ proName }: nameProps) {
  const breadcrumbs = [
    <Link key="1" href="/" className="me-1" >
      الرئيسية
    </Link>,
    <Link key="2" href="/product" className="mx-1">
      المنتاجات
    </Link>,
    <Typography key="3" sx={{ color: "#000" , fontSize:"15px" , fontFamily:"cairo"}}>
      {proName}
    </Typography>,
  ];

  return (
    <Stack spacing={10}>
      <Breadcrumbs separator="›" aria-label="breadcrumb" sx={{ color: "#000" , fontSize:"15px" , fontFamily:"cairo"}}>
        {breadcrumbs}
      </Breadcrumbs>
    </Stack>
  );
}
