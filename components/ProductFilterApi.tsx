"use client";

import { ReactNode, useMemo, useState } from "react";
import { FiFilter, FiX } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import {
  FormControl,
  MenuItem,
  Select,
  TextField,
  OutlinedInput,
  InputLabel,
} from "@mui/material";

type Option = { id: number; name: string };

export type ProductsApiFilters = {
  search: string;
  category_id: number | "";
  material_id: number | "";
  color_id: number | "";
  price_from: string;
  price_to: string;
};

type Props = {
  categories?: Option[];
  materials?: Option[];
  colors?: Option[];
  value: ProductsApiFilters;
  onChange: (next: ProductsApiFilters) => void;
};

function cn(...c: (string | false | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

export default function ProductFilterApi({
  categories = [],
  materials = [],
  colors = [],
  value,
  onChange,
}: Props) {
  const hasCategories = categories.length > 0;
  const hasMaterials = materials.length > 0;
  const hasColors = colors.length > 0;

  const activeChips = useMemo(() => {
    const chips: { label: string; onDelete: () => void }[] = [];

    if (value.search?.trim())
      chips.push({ label: `بحث: ${value.search}`, onDelete: () => onChange({ ...value, search: "" }) });

    if (value.category_id) {
      const c = categories.find((x) => x.id === value.category_id);
      chips.push({
        label: `القسم: ${c?.name ?? value.category_id}`,
        onDelete: () => onChange({ ...value, category_id: "" }),
      });
    }

    if (value.material_id) {
      const m = materials.find((x) => x.id === value.material_id);
      chips.push({
        label: `الخامة: ${m?.name ?? value.material_id}`,
        onDelete: () => onChange({ ...value, material_id: "" }),
      });
    }

    if (value.color_id) {
      const c = colors.find((x) => x.id === value.color_id);
      chips.push({
        label: `اللون: ${c?.name ?? value.color_id}`,
        onDelete: () => onChange({ ...value, color_id: "" }),
      });
    }

    if (value.price_from)
      chips.push({ label: `من: ${value.price_from}`, onDelete: () => onChange({ ...value, price_from: "" }) });

    if (value.price_to)
      chips.push({ label: `إلى: ${value.price_to}`, onDelete: () => onChange({ ...value, price_to: "" }) });

    return chips;
  }, [value, categories, materials, colors, onChange]);

  const clearAll = () => {
    onChange({
      search: "",
      category_id: "",
      material_id: "",
      color_id: "",
      price_from: "",
      price_to: "",
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FiFilter />
          <p className="font-black text-[1.05rem] text-slate-900">تصفية</p>
        </div>

        <button
          onClick={clearAll}
          className="text-xs font-extrabold text-slate-600 hover:text-slate-900 rounded-xl px-3 py-2 hover:bg-slate-50 transition"
        >
          مسح الكل
        </button>
      </div>

      {/* Active chips */}
      {activeChips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex flex-wrap gap-2"
        >
          {activeChips.map((chip, i) => (
            <button
              key={i}
              onClick={chip.onDelete}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100 transition"
              aria-label="remove filter"
            >
              <span className="truncate max-w-[160px]">{chip.label}</span>
              <FiX />
            </button>
          ))}
        </motion.div>
      )}

      <div className="mt-4 space-y-3">
        <FilterSection title="بحث" defaultOpen>
          <TextField
            fullWidth
            value={value.search}
            onChange={(e) => onChange({ ...value, search: e.target.value })}
            placeholder="ابحث عن منتج..."
            size="small"
            sx={{
              direction: "rtl",
              "& .MuiOutlinedInput-root": { borderRadius: "14px" },
              fontFamily: "Cairo, Cairo Fallback",
            }}
          />
        </FilterSection>

        <FilterSection title="السعر">
          <div className="grid grid-cols-2 gap-2">
            <TextField
              value={value.price_from}
              onChange={(e) => onChange({ ...value, price_from: e.target.value.replace(/[^\d]/g, "") })}
              placeholder="من"
              size="small"
              inputMode="numeric"
              sx={{
                direction: "rtl",
                "& .MuiOutlinedInput-root": { borderRadius: "14px" },
                fontFamily: "Cairo, Cairo Fallback",
              }}
            />
            <TextField
              value={value.price_to}
              onChange={(e) => onChange({ ...value, price_to: e.target.value.replace(/[^\d]/g, "") })}
              placeholder="إلى"
              size="small"
              inputMode="numeric"
              sx={{
                direction: "rtl",
                "& .MuiOutlinedInput-root": { borderRadius: "14px" },
                fontFamily: "Cairo, Cairo Fallback",
              }}
            />
          </div>
        </FilterSection>

        {hasCategories && (
          <FilterSection title="القسم">
            <FormControl fullWidth size="small" sx={{ direction: "rtl" }}>
              <InputLabel sx={{ fontFamily: "Cairo, Cairo Fallback" }}>اختر القسم</InputLabel>
              <Select
                value={value.category_id}
                onChange={(e) => onChange({ ...value, category_id: e.target.value as any })}
                input={<OutlinedInput label="اختر القسم" />}
                sx={{
                  borderRadius: "14px",
                  fontFamily: "Cairo, Cairo Fallback",
                }}
                displayEmpty
              >
                <MenuItem value="">
                  <em>الكل</em>
                </MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </FilterSection>
        )}

        {hasMaterials && (
          <FilterSection title="الخامة">
            <FormControl fullWidth size="small" sx={{ direction: "rtl" }}>
              <InputLabel sx={{ fontFamily: "Cairo, Cairo Fallback" }}>اختر الخامة</InputLabel>
              <Select
                value={value.material_id}
                onChange={(e) => onChange({ ...value, material_id: e.target.value as any })}
                input={<OutlinedInput label="اختر الخامة" />}
                sx={{
                  borderRadius: "14px",
                  fontFamily: "Cairo, Cairo Fallback",
                }}
                displayEmpty
              >
                <MenuItem value="">
                  <em>الكل</em>
                </MenuItem>
                {materials.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </FilterSection>
        )}

        {hasColors && (
          <FilterSection title="اللون">
            <FormControl fullWidth size="small" sx={{ direction: "rtl" }}>
              <InputLabel sx={{ fontFamily: "Cairo, Cairo Fallback" }}>اختر اللون</InputLabel>
              <Select
                value={value.color_id}
                onChange={(e) => onChange({ ...value, color_id: e.target.value as any })}
                input={<OutlinedInput label="اختر اللون" />}
                sx={{
                  borderRadius: "14px",
                  fontFamily: "Cairo, Cairo Fallback",
                }}
                displayEmpty
              >
                <MenuItem value="">
                  <em>الكل</em>
                </MenuItem>
                {colors.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </FilterSection>
        )}

        {!hasCategories && !hasMaterials && !hasColors && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-sm font-extrabold text-slate-700">لا توجد خيارات تصفية هنا</p>
            <p className="text-xs text-slate-500 mt-1">ستظهر الخيارات تلقائيًا عند توفرها</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        aria-label={title}
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition"
      >
        <span className="font-black text-slate-900 text-[0.98rem]">{title}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="text-slate-500" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="bg-white"
          >
            <div className="p-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
