import { clearSession } from "../auth/session.js";
import { initializePasswordChangeForm } from "./password-change-form.js";

if (!localStorage.getItem("token")) {
    window.location.href = "../login/login.html";
} else if (localStorage.getItem("mustChangePassword") !== "true") {
    window.location.href = "admin.html";
}

initializePasswordChangeForm({
    onSuccess: () => {
        window.location.href = "admin.html";
    }
});

window.addEventListener("pageshow", () => {
    if (!localStorage.getItem("token")) {
        clearSession();
        window.location.href = "../login/login.html";
    }
});
