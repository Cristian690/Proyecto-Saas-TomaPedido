console.log("ONBOARDING COLOR JS CARGADO");

const token = localStorage.getItem("token");
const businessSlug = localStorage.getItem("businessSlug");

const colorInput = document.getElementById("business-background-color");
const finishButton = document.getElementById("btn-finish");
const backButton = document.getElementById("btn-back");

const textColorInput =
    document.getElementById("business-text-color");

console.log("BOTÓN ATRÁS:", backButton);

const preview = document.getElementById("business-preview");
const previewLogo = document.getElementById("preview-logo");
const previewBusinessName =
    document.getElementById("preview-business-name");

const errorMessage =
    document.getElementById("onboarding-error");


// ================================
// CARGAR DATOS DEL NEGOCIO
// ================================

async function loadBusiness() {

    try {

        const response = await fetch(
            `http://192.168.100.32:8080/business/${businessSlug}`
        );

        if (!response.ok) {
            throw new Error("No se pudo cargar el negocio");
        }

        const business = await response.json();

        console.log("Business cargado:", business);


        // Nombre del negocio
        previewBusinessName.textContent =
            business.name || "Tu negocio";


        // Logo
        if (business.logoUrl) {

            previewLogo.src = business.logoUrl;
            previewLogo.style.display = "block";

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

colorInput.addEventListener("input", () => {

    preview.style.backgroundColor =
        colorInput.value;

});


textColorInput.addEventListener("input", () => {

    preview.style.color =
        textColorInput.value;

});

// ================================
// VOLVER AL PASO 1
// ================================

backButton.addEventListener("click", () => {

    window.location.href =
        "onboarding.html";

});


// ================================
// FINALIZAR
// ================================

finishButton.addEventListener("click", async () => {

    errorMessage.textContent = "";

    const backgroundColor =
        colorInput.value;

    try {

        const response = await fetch(
            "http://192.168.100.32:8080/business/customization",
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    backgroundColor,
                    primaryColor: textColorInput.value
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
});


// ================================
// INICIAR
// ================================

loadBusiness();