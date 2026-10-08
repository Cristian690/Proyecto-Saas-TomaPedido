export const ORDENFLASH_SUPPORT_WHATSAPP_URL =
    "https://wa.me/5491164072860";

export function getSupportWhatsAppUrl(message) {
    return `${ORDENFLASH_SUPPORT_WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
}
