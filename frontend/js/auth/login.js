const form = document.getElementById("login-form");
const errorMessage = document.getElementById("login-error");

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const phone = document.getElementById("login-phone").value;
    const password = document.getElementById("login-password").value;

    try {

        const response = await fetch("http://192.168.100.32:8080/auth/login", {
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

        localStorage.setItem("token", data.token);
        localStorage.setItem("businessSlug", data.slug);
        localStorage.setItem("businessName", data.businessName);
        localStorage.setItem("role", data.role);

        window.location.href = "../admin/admin.html";

    } catch (error) {

        errorMessage.textContent = error.message;

    }
});