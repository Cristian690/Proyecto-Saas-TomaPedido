const form = document.getElementById("register-form");
const errorMessage = document.getElementById("register-error");

const step1 = document.getElementById("register-step-1");
const step2 = document.getElementById("register-step-2");
const step3 = document.getElementById("register-step-3");

const nextButton1 = document.getElementById("register-next-1");
const nextButton2 = document.getElementById("register-next-2");
const backButton2 = document.getElementById("register-back-2");
const backButton3 = document.getElementById("register-back-3");


// Paso 1 → Paso 2
nextButton1.addEventListener("click", () => {

    const businessName =
        document.getElementById("register-business-name").value.trim();

    if (!businessName) {
        errorMessage.textContent =
            "Ingresá el nombre de tu negocio";
        return;
    }

    errorMessage.textContent = "";

    step1.style.display = "none";
    step2.style.display = "block";
});


// Paso 2 → Paso 3
nextButton2.addEventListener("click", () => {

    const phone =
        document.getElementById("register-phone").value.trim();

    if (!phone) {
        errorMessage.textContent =
            "Ingresá el número de WhatsApp";
        return;
    }

    errorMessage.textContent = "";

    step2.style.display = "none";
    step3.style.display = "block";
});

// Paso 2 → Paso 1
backButton2.addEventListener("click", () => {

    errorMessage.textContent = "";

    step2.style.display = "none";
    step1.style.display = "block";
});


// Paso 3 → Paso 2
backButton3.addEventListener("click", () => {

    errorMessage.textContent = "";

    step3.style.display = "none";
    step2.style.display = "block";
});

// Paso 3 → Crear cuenta
form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const businessName =
        document.getElementById("register-business-name").value.trim();

    const phone =
        document.getElementById("register-phone").value.trim();

    const password =
        document.getElementById("register-password").value;

    if (!password) {
        errorMessage.textContent =
            "Ingresá una contraseña";
        return;
    }

    try {

        // 1. Crear la cuenta
        const registerResponse = await fetch(
            "http://192.168.100.32:8080/auth/register",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    businessName,
                    phone,
                    email: null,
                    password
                })
            }
        );

        if (!registerResponse.ok) {
            throw new Error("No se pudo crear la cuenta");
        }

        const registerData = await registerResponse.json();

        console.log("Registro exitoso:", registerData);


        // 2. Login automático
        const loginResponse = await fetch(
            "http://192.168.100.32:8080/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    phone,
                    password
                })
            }
        );

        if (!loginResponse.ok) {
            throw new Error(
                "La cuenta fue creada, pero no se pudo iniciar sesión"
            );
        }

        const loginData = await loginResponse.json();

        console.log("Login automático exitoso:", loginData);


        // 3. Guardar sesión
        localStorage.setItem("token", loginData.token);
        localStorage.setItem("businessSlug", loginData.slug);
        localStorage.setItem("businessName", loginData.businessName);
        localStorage.setItem("role", loginData.role);


        // 4. Ir al onboarding
        window.location.href =
            "../onboarding/onboarding.html";

    } catch (error) {

        console.error("Error en registro:", error);

        errorMessage.textContent = error.message;
    }
});