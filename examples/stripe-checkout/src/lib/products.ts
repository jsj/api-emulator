export const productImages: Record<string, string> = {
  "API Emulator T-Shirt": "/products/tshirt.webp",
  "API Emulator Mug": "/products/mug.webp",
  "API Emulator Sticker Pack": "/products/stickers.webp",
  "API Emulator Hoodie": "/products/hoodie.webp",
};

export function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount / 100);
}
