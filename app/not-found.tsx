"use client";

import Link, { LinkProps } from "next/link";
import Button from "@mui/material/Button";
import React from "react";

const LinkComponent = React.forwardRef<HTMLAnchorElement, LinkProps>(function LinkComponent(
  props,
  ref
) {
  return <Link ref={ref} {...props} />;
});

export default function NotFound() {
  return (
    <div className="text-center pb-10">
      
<h4 className="text-center mt-10 text-xl">  الصفحة غير موجوده</h4>

      <section className="error-container">
        <span className="four"><span className="screen-reader-text">4</span></span>
        <span className="zero"><span className="screen-reader-text">0</span></span>
        <span className="four"><span className="screen-reader-text">4</span></span>
      </section>
      <div className="link-container">
        <Button
          variant="contained"
          component={LinkComponent}
          href="/"
          sx={{
            backgroundColor: "#14213d",
            "&:hover": { backgroundColor: "#1a2b50" },
            fontWeight: "bold",
            fontSize:"1.4rem"
          }}
        >
          العوده الي الرئيسية
        </Button>
      </div>
    </div>
  );
}
