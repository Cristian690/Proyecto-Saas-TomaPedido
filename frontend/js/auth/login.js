import { API_URL } from "../api/api.js";
import { getSupportWhatsAppUrl } from "../config/support.js?v=1.0";
import { storeSession } from "./session.js";

const form = document.getElementById("login-form");
const errorMessage = document.getElementById("login-error");
const forgotPasswordSupportLink = document.getElementById(
    "forgot-password-support"
);

forgotPasswordSupportLink.href = getSupportWhatsAppUrl(
    "Hola, olvidé mi contraseña de OrdenFlash y necesito recuperar el acceso a mi comercio."
);

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const phone = document.getElementById("login-phone").value;
    const password = document.getElementById("login-password").value;

    try {

        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                phone,
                password
            })
        });

        if (!response.ok) {
            throw new Error("Teléfono o contraseña incorrectos");
        }

        const data = await response.json();

        storeSession(data);

        window.location.href = data.mustChangePassword
            ? "../admin/force-change-password.html"
            : "../admin/admin.html";

    } catch (error) {

        errorMessage.textContent = error.message;

    }
});
