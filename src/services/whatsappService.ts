import { siteConfig } from "../constants/siteConfig";
export function createGeneralWhatsAppUrl(message: string) {
  const number = siteConfig.whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function formatPrice(price: number | null) {
  if (price === null) return "Price on request";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(price);
}

export function stockLabel(stock: number) {
  if (stock === 0) return "Out of stock";
  if (stock <= 3) return "Low stock";
  return "In stock";
}
