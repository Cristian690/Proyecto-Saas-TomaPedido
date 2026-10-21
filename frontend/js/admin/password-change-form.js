import { API_URL } from "../api/api.js";
import { clearSession, storeSession } from "../auth/session.js";

export function initializePasswordChangeForm({ onSuccess } = {}) {
    const form = document.getElementById("change-password-form");
    const submitButton = document.getElementById("change-password-submit");
    const message = document.getElementById("change-password-message");
    const currentPasswordInput = document.getElementById("current-password");
    const newPasswordInput = document.getElementById("new-password");
    const confirmNewPasswordInput = document.getElementById("confirm-new-password");

    function showMessage(text, isSuccess = false) {
        message.textContent = text;
        message.classList.toggle("account-panel__message--success", isSuccess);
        message.hidden = false;
    }

    async function getErrorMessage(response) {
        try {
            const data = await response.json();
            return data?.message || data?.detail || data?.error ||
                "No se pudo actualizar la contraseña. Intentá nuevamente.";
        } catch {
            return "No se pudo actualizar la contraseña. Intentá nuevamente.";
        }
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();
        message.hidden = true;

        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmNewPassword = confirmNewPasswordInput.value;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            showMessage("Completá todos los campos para continuar.");
            return;
        }

        if (newPassword.length < 8 || newPassword.length > 72) {
            showMessage("La nueva contraseña debe tener entre 8 y 72 caracteres.");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            showMessage("La confirmación no coincide con la nueva contraseña.");
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Actualizando...";

        try {
            const response = await fetch(`${API_URL}/auth/change-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            if (response.status === 401) {
                clearSession();
                window.location.href = "../login/login.html";
                return;
            }

            if (!response.ok) {
                showMessage(await getErrorMessage(response));
                return;
            }

            const session = await response.json();

            if (!session?.token || session.mustChangePassword === true) {
                showMessage("No se pudo completar el cambio de contraseña. Intentá nuevamente.");
                return;
            }

            storeSession(session);
            form.reset();
            showMessage("Contraseña actualizada correctamente.", true);

            if (onSuccess) {
                onSuccess();
            }
        } catch {
            showMessage("No se pudo conectar con el servidor. Intentá nuevamente.");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Actualizar contraseña";
        }
    });
}
