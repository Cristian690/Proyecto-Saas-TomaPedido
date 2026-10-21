import { clearSession } from "../auth/session.js";
import { initializePasswordChangeForm } from "./password-change-form.js";

if (!localStorage.getItem("token")) {
    window.location.href = "../login/login.html";
} else if (localStorage.getItem("mustChangePassword") === "true") {
    window.location.href = "force-change-password.html";
}

initializePasswordChangeForm();

document.getElementById("btn-logout").addEventListener("click", () => {
    clearSession();
    window.location.href = "../login/login.html";
});
