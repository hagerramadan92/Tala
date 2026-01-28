"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Check from "@mui/icons-material/Check";
import { FaAngleDown } from "react-icons/fa";
import { LuArrowDownUp } from "react-icons/lu";

type SortKey = "featured" | "price-asc" | "price-desc" | "newest";

const OPTIONS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "الخيارات المميزة" },
  { key: "price-asc", label: "الأقل سعرًا" },
  { key: "price-desc", label: "الأعلى سعرًا" },
  { key: "newest", label: "الأحدث" },
];

export default function SortMenu({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <Button
        variant="outlined"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        endIcon={<span style={{ transform: open ? "rotate(180deg)" : undefined , marginRight:9 }}>
            <FaAngleDown size={18} />
        </span>}
        sx={{ textTransform: "none" ,  padding:"8px 10px 8px 0" , color:"#14213d" , fontSize:"1.1rem" ,
            
            border:0, borderRadius:"3rem"
            , backgroundColor:"#f1f1f1" }}
      >
        <LuArrowDownUp className="me-2" /> ترتيب حسب: {OPTIONS.find((o) => o.key === value)?.label || "الخيارات المميزة"}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { minWidth: 220 } }}
      >
        {OPTIONS.map((opt) => (
          <MenuItem
            key={opt.key}
            selected={opt.key === value}
            onClick={() => {
              onChange(opt.key);
              setAnchorEl(null);
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {opt.key === value ? <Check fontSize="small" /> : null}
            </ListItemIcon>
            {opt.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
