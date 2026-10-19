import { API_URL } from "../api/api.js";
import { businessTypes } from "../admin/business-types.js?v=1.1";

const form = document.getElementById("register-form");
const errorMessage = document.getElementById("register-error");

const step1 = document.getElementById("register-step-1");
const businessTypeStep = document.getElementById("register-step-business-type");
const step2 = document.getElementById("register-step-2");
const step3 = document.getElementById("register-step-3");
const stepConfirm = document.getElementById("register-step-confirm");

const nextButton1 = document.getElementById("register-next-1");
const nextBusinessTypeButton = document.getElementById("register-next-business-type");
const backBusinessTypeButton = document.getElementById("register-back-business-type");
const nextButton2 = document.getElementById("register-next-2");
const backButton2 = document.getElementById("register-back-2");
const backButton3 = document.getElementById("register-back-3");
const confirmCreateButton = document.getElementById("register-confirm-create");
const confirmBackButton = document.getElementById("register-confirm-back");

const passwordFields = document.getElementById("password-fields");
const phoneConfirmation = document.getElementById("register-phone-confirmation");
const businessTypeOptions = document.getElementById("register-business-type-options");

let registrationConfirmed = false;
let selectedBusinessType = null;

function renderBusinessTypeOptions() {
    businessTypeOptions.replaceChildren();

    businessTypes.forEach(type => {
        const button = document.createElement("button");
        const icon = document.createElement("span");
        const name = document.createElement("span");

        button.type = "button";
        button.className = "register-business-type-option";
        button.dataset.businessType = type.id;
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = type.icon;
        name.textContent = type.name;
        button.append(icon, name);

        if (type.id === selectedBusinessType) {
            button.classList.add("selected");
        }

        button.addEventListener("click", () => {
            selectedBusinessType = type.id;
            renderBusinessTypeOptions();
        });

        businessTypeOptions.appendChild(button);
    });
}


// Crear campos de contraseña cuando entramos al Paso 3
function createPasswordFields() {

    if (document.getElementById("register-password")) {
        return;
    }

    passwordFields.innerHTML = `
        <input
            type="password"
            id="register-password"
            placeholder="Elegí una contraseña"
            required
        >

        <label for="register-password-confirm">
            🔐 Repetí tu contraseña
        </label>

        <input
            type="password"
            id="register-password-confirm"
            placeholder="Repetí tu contraseña"
            required
        >
    `;
}

function normalizeArgentineWhatsApp(phone) {
    const value = phone.trim();

    if (!/^\+?[0-9() -]+$/.test(value)) {
        return null;
    }

    const digits = value
        .replace(/[()\s-]/g, "")
        .replace(/^\+/, "");

    if (/^549\d{10}$/.test(digits)) {
        return digits;
    }

    if (/^\d{10}$/.test(digits)) {
        return `549${digits}`;
    }

    return null;
}


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
    businessTypeStep.style.display = "block";
    renderBusinessTypeOptions();
});


nextBusinessTypeButton.addEventListener("click", () => {
    if (!selectedBusinessType) {
        errorMessage.textContent = "Elegí el tipo de comercio";
        return;
    }

    errorMessage.textContent = "";
    businessTypeStep.style.display = "none";
    step2.style.display = "block";
});


backBusinessTypeButton.addEventListener("click", () => {
    errorMessage.textContent = "";
    businessTypeStep.style.display = "none";
    step1.style.display = "block";
});


// Paso 2 → Paso 3
nextButton2.addEventListener("click", async () => {

    const phone =
        document.getElementById("register-phone").value;

    const normalizedPhone = normalizeArgentineWhatsApp(phone);

    if (!phone) {
        errorMessage.textContent =
            "Ingresá el número de WhatsApp";
        return;
    }

    if (!normalizedPhone) {
        errorMessage.textContent =
            "Ingresá un número de WhatsApp válido";
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/auth/check-phone/${encodeURIComponent(normalizedPhone)}`
        );

        if (!response.ok) {
            throw new Error("No se pudo verificar el número");
        }

        const exists = await response.json();

        if (exists) {
            errorMessage.textContent =
                "El número ya está en uso";
            return;
        }

        errorMessage.textContent = "";

        // Crear los campos recién ahora
        createPasswordFields();

        step2.style.display = "none";
        step3.style.display = "block";

    } catch (error) {

        console.error("Error verificando teléfono:", error);

        errorMessage.textContent =
            "No se pudo verificar el número";
    }
});


// Paso 2 → Paso 1
backButton2.addEventListener("click", () => {

    errorMessage.textContent = "";

    step2.style.display = "none";
    businessTypeStep.style.display = "block";
    renderBusinessTypeOptions();
});


// Paso 3 → Paso 2
backButton3.addEventListener("click", () => {

    errorMessage.textContent = "";

    step3.style.display = "none";
    step2.style.display = "block";
});


confirmBackButton.addEventListener("click", () => {

    registrationConfirmed = false;
    errorMessage.textContent = "";

    stepConfirm.style.display = "none";
    step2.style.display = "block";
});


confirmCreateButton.addEventListener("click", () => {

    registrationConfirmed = true;
    stepConfirm.style.display = "none";
    form.requestSubmit();
});


// Paso 3 → Crear cuenta
form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const businessName =
        document.getElementById("register-business-name").value.trim();

    const welcomeMessage =
        document.getElementById("register-welcome-message").value.trim();

    const phone =
        document.getElementById("register-phone").value;

    const normalizedPhone = normalizeArgentineWhatsApp(phone);

    const password =
        document.getElementById("register-password").value;

    const passwordConfirm =
        document.getElementById("register-password-confirm").value;


    if (!password) {
        errorMessage.textContent =
            "Ingresá una contraseña";
        return;
    }

    if (!passwordConfirm) {
        errorMessage.textContent =
            "Repetí la contraseña";
        return;
    }

    if (password !== passwordConfirm) {
        errorMessage.textContent =
            "Las contraseñas no coinciden";
        return;
    }

    if (password.length < 8) {
        errorMessage.textContent =
            "La contraseña debe tener al menos 8 caracteres";
        return;
    }

    if (!normalizedPhone) {
        errorMessage.textContent =
            "Ingresá un número de WhatsApp argentino válido";
        return;
    }

    if (!registrationConfirmed) {
        errorMessage.textContent = "";
        phoneConfirmation.textContent = phone.trim();
        step3.style.display = "none";
        stepConfirm.style.display = "block";
        return;
    }

    registrationConfirmed = false;


    try {

        errorMessage.textContent = "Creando tu página, esperá unos segundos…";
        errorMessage.classList.add("register-loading");

        // 1. Crear la cuenta
        const registerResponse = await fetch(
            `${API_URL}/auth/register`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    businessName,
                    phone: normalizedPhone,
                    email: null,
                    password,
                    businessType: selectedBusinessType
                })
            }
        );

        if (!registerResponse.ok) {

            if (registerResponse.status === 409) {
                throw new Error(
                    "El número ya está en uso"
                );
            }

            throw new Error(
                "No se pudo crear la cuenta"
            );
        }

        const registerData =
            await registerResponse.json();

        console.log(
            "Registro exitoso:",
            registerData
        );


        // 2. Login automático
        const loginResponse = await fetch(
            `${API_URL}/auth/login`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    phone: normalizedPhone,
                    password
                })
            }
        );

        if (!loginResponse.ok) {
            throw new Error(
                "La cuenta fue creada, pero no se pudo iniciar sesión"
            );
        }

        const loginData =
            await loginResponse.json();

        console.log(
            "Login automático exitoso:",
            loginData
        );


        // 3. Guardar sesión
        localStorage.setItem(
            "token",
            loginData.token
        );

        localStorage.setItem(
            "businessSlug",
            loginData.slug
        );

        localStorage.setItem(
            "businessName",
            loginData.businessName
        );

        localStorage.setItem(
            "role",
            loginData.role
        );


        // 4. Guardar mensaje de bienvenida
        const customizationResponse =
            await fetch(
                `${API_URL}/business/customization`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization":
                            `Bearer ${loginData.token}`
                    },
                    body: JSON.stringify({
                        welcomeMessage
                    })
                }
            );

        if (!customizationResponse.ok) {
            throw new Error(
                "La cuenta fue creada, pero no se pudo guardar el mensaje de bienvenida"
            );
        }


        // 5. Ir al onboarding
        window.location.href =
            "../onboarding/onboarding.html";

    } catch (error) {

        console.error(
            "Error en registro:",
            error
        );

        errorMessage.classList.remove("register-loading");
        errorMessage.textContent = error.message;
    }
});
