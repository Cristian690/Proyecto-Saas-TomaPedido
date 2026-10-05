import { API_URL } from "../api/api.js";
import { getOptimizedCloudinaryUrl } from "../images/cloudinary.js?v=1.0";

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

    const toLinearSrgb = value => {
        const channel = value / 255;

        return channel <= 0.03928
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4;
    };

    const luminance =
        0.2126 * toLinearSrgb(parseInt(hex.substring(0, 2), 16)) +
        0.7152 * toLinearSrgb(parseInt(hex.substring(2, 4), 16)) +
        0.0722 * toLinearSrgb(parseInt(hex.substring(4, 6), 16));

    const darkTextLuminance = toLinearSrgb(17);
    const whiteTextLuminance = 1;

    const darkTextContrast =
        (Math.max(luminance, darkTextLuminance) + 0.05) /
        (Math.min(luminance, darkTextLuminance) + 0.05);

    const whiteTextContrast =
        (Math.max(luminance, whiteTextLuminance) + 0.05) /
        (Math.min(luminance, whiteTextLuminance) + 0.05);

    return darkTextContrast > whiteTextContrast
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
                getOptimizedCloudinaryUrl(
                    business.logoUrl,
                    "f_auto,q_auto,w_300,c_fit"
                );

            previewLogo.style.display =
                "block";
        }

        // Portada
        if (business.coverUrl) {

            previewCover.src =
                getOptimizedCloudinaryUrl(
                    business.coverUrl,
                    "f_auto,q_auto,w_1200,c_fill"
                );

            previewCover.style.display =
                "block";
        }


        // Color actual
        if (business.backgroundColor) {

            colorInput.value =
                business.backgroundColor;

            preview.style.backgroundColor =
                business.backgroundColor;

            preview.style.color =
                getContrastTextColor(business.backgroundColor);
        }

        document.querySelectorAll(".preview-product").forEach(
            product => {

                product.style.backgroundColor =
                    primaryColorInput.value;

                product.style.color =
                    getContrastTextColor(primaryColorInput.value);
            }
        );

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
