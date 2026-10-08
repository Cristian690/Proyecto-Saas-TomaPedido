import { ORDENFLASH_SUPPORT_WHATSAPP_URL } from "../../js/config/support.js?v=1.0";

document.querySelectorAll("[data-whatsapp-contact]").forEach((link) => {
    link.href = ORDENFLASH_SUPPORT_WHATSAPP_URL;
});
