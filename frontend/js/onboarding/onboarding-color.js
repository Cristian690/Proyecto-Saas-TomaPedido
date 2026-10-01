import { API_URL } from "../api/api.js";

const token = localStorage.getItem("token");
const businessSlug = localStorage.getItem("businessSlug");

const colorInput =
    document.getElementById("business-background-color");

const primaryColorInput =
    document.getElementById("business-primary-color");

const finishButton =
    document.getElementById("btn-finish");

const backButton =
    document.getElementById("btn-back");

console.log("BOTÓN ATRÁS:", backButton);

const preview =
    document.getElementById("business-preview");

const previewLogo =
    document.getElementById("preview-logo");

const previewCover =
    document.getElementById("preview-cover");

const previewBusinessName =
    document.getElementById("preview-business-name");

const previewWelcomeMessage =
    document.getElementById("preview-welcome-message");

const previewAddress =
    document.getElementById("preview-address");

const errorMessage =
    document.getElementById("onboarding-error");

function getContrastTextColor(hexColor) {
    const hex = hexColor.replace("#", "");

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const luminance =
        (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.6
        ? "#111111"
        : "#ffffff";
}


// ================================
// CARGAR DATOS DEL NEGOCIO
// ================================

async function loadBusiness() {

    try {

        const response = await fetch(
            `${API_URL}/business/${businessSlug}`
        );

        if (!response.ok) {
            throw new Error(
                "No se pudo cargar el negocio"
            );
        }

        const business =
            await response.json();

        console.log(
            "Business cargado:",
            business
        );


        // Nombre del negocio
        previewBusinessName.textContent =
            business.name || "Tu negocio";


        // Mensaje de bienvenida
        previewWelcomeMessage.textContent =
            business.welcomeMessage || "";


        // Dirección
        if (business.address) {

            previewAddress.textContent =
                `📍 ${business.address}`;

            previewAddress.style.display =
                "block";

        } else {

            previewAddress.style.display =
                "none";
        }


        // Logo
        if (business.logoUrl) {

            previewLogo.src =
                business.logoUrl;

            previewLogo.style.display =
                "block";
        }

        // Portada
        if (business.coverUrl) {

            previewCover.src =
                business.coverUrl;

            previewCover.style.display =
                "block";
        }


        // Color actual
        if (business.backgroundColor) {

            colorInput.value =
                business.backgroundColor;

            preview.style.backgroundColor =
                business.backgroundColor;
        }

    } catch (error) {

        console.error(
            "Error cargando negocio:",
            error
        );
    }
}


// ================================
// CAMBIAR COLOR EN TIEMPO REAL
// ================================

colorInput.addEventListener(
    "input",
    () => {

        const textColor =
            getContrastTextColor(colorInput.value);

        preview.style.backgroundColor =
            colorInput.value;

        preview.style.color =
            textColor;
    }
);

primaryColorInput.addEventListener(
    "input",
    () => {

        const buttonColor =
            primaryColorInput.value;

        const textColor =
            getContrastTextColor(buttonColor);

        document.querySelectorAll(".preview-product").forEach(
            product => {

                product.style.backgroundColor =
                    buttonColor;

                product.style.color =
                    textColor;
            }
        );
    }
);


// ================================
// VOLVER AL PASO 1
// ================================

backButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "onboarding.html";

    }
);


// ================================
// FINALIZAR
// ================================

finishButton.addEventListener(
    "click",
    async () => {

        errorMessage.textContent = "";

        const backgroundColor =
            colorInput.value;

        const primaryColor =
            primaryColorInput.value;

        try {

            const response =
                await fetch(
                    `${API_URL}/business/customization`,
                    {
                        method: "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        },

                        body: JSON.stringify({
                            backgroundColor,
                            primaryColor
                        })
                    }
                );

            if (!response.ok) {

                throw new Error(
                    "No se pudo guardar el color"
                );
            }

            console.log(
                "Color guardado correctamente"
            );

            window.location.href =
                "onboarding-finished.html";

        } catch (error) {

            console.error(
                "Error guardando color:",
                error
            );

            errorMessage.textContent =
                error.message;
        }
    }
);


// ================================
// INICIAR
// ================================

loadBusiness();