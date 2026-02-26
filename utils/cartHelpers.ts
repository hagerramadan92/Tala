// utils/cartHelpers.ts
export function n(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const num = Number(v);
    return isFinite(num) ? num : 0;
  }
  return 0;
}

export function money(value: number): string {
  if (typeof value !== 'number' || !isFinite(value)) return '0.00';
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseSelectedOptions(raw: any): any[] {
  if (!raw) return [];
  
  // If it's already an array, return it
  if (Array.isArray(raw)) return raw;
  
  // If it's a string, try to parse it
  if (typeof raw === "string") {
    // Remove any extra whitespace
    const trimmed = raw.trim();
    if (!trimmed) return [];
    
    try {
      // Try parsing as JSON
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      // If JSON parsing fails, check if it's a comma-separated string
      if (trimmed.includes(',')) {
        return trimmed.split(',').map(item => item.trim()).filter(Boolean);
      }
      // Return as single item array if it's a simple string
      return [trimmed];
    }
  }
  
  // If it's an object but not array, wrap it
  if (typeof raw === "object" && raw !== null) {
    return [raw];
  }
  
  return [];
}

// Helper to check if product has any options
export function hasProductOptions(product: any): boolean {
  if (!product) return false;
  
  return (
    (product?.sizes?.length ?? 0) > 0 ||
    (product?.colors?.length ?? 0) > 0 ||
    (product?.materials?.length ?? 0) > 0 ||
    (product?.options?.length ?? 0) > 0 ||
    (product?.printing_methods?.length ?? 0) > 0 ||
    (product?.print_locations?.length ?? 0) > 0
  );
}

// Helper to get missing required fields
export function getMissingRequiredFields(item: any): string[] {
  if (!item || !item.product) return [];
  
  const product = item.product;
  const selectedOptions = parseSelectedOptions(item.selected_options);
  const missing: string[] = [];
  
  // Check sizes
  if ((product?.sizes?.length ?? 0) > 0) {
    const hasSize = selectedOptions.some(
      (opt: any) => 
        opt.option_name === "المقاس" || 
        opt.option_name?.includes("مقاس")
    );
    if (!hasSize && !item.size) missing.push("المقاس");
  }
  
  // Check colors
  if ((product?.colors?.length ?? 0) > 0) {
    const hasColor = selectedOptions.some(
      (opt: any) => 
        opt.option_name === "اللون" || 
        opt.option_name?.includes("لون")
    );
    if (!hasColor && !item.color) missing.push("اللون");
  }
  
  // Check materials
  if ((product?.materials?.length ?? 0) > 0) {
    const hasMaterial = selectedOptions.some(
      (opt: any) => 
        opt.option_name === "الخامة" || 
        opt.option_name?.includes("خامة")
    );
    if (!hasMaterial && !item.material) missing.push("الخامة");
  }
  
  return missing;
}