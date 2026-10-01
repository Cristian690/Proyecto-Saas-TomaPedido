// Punto único para actualizar el contacto comercial de la landing.
const WHATSAPP_CONTACT_URL = "https://wa.me/5491164072860";

document.querySelectorAll("[data-whatsapp-contact]").forEach((link) => {
    link.href = WHATSAPP_CONTACT_URL;
});
