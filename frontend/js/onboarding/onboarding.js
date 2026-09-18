console.log("ONBOARDING LOGO JS CARGADO");

const token = localStorage.getItem("token");
const businessSlug = localStorage.getItem("businessSlug");

const logoInput =
    document.getElementById("business-logo");

const logoPreview =
    document.getElementById("logo-preview");

const nextButton =
    document.getElementById("btn-next");

const skipButton =
    document.getElementById("skip-logo");

const errorMessage =
    document.getElementById("onboarding-error");


// ====================================
// LOGO ACTUAL
// ====================================

let existingLogoUrl = null;


// ====================================
// CARGAR DATOS DEL NEGOCIO
// ====================================

async function loadBusiness() {

    try {

        const response = await fetch(
            `http://192.168.100.32:8080/business/${businessSlug}`
        );

        if (!response.ok) {
            throw new Error(
                "No se pudo cargar el negocio."
            );
        }

        const business = await response.json();

        console.log(
            "Business cargado:",
            business
        );


        // ================================
        // CARGAR LOGO EXISTENTE
        // ================================

        if (business.logoUrl) {

            existingLogoUrl =
                business.logoUrl;

            logoPreview.src =
                business.logoUrl;

            logoPreview.style.display =
                "block";

            console.log(
                "Logo existente cargado:",
                existingLogoUrl
            );
        }

    } catch (error) {

        console.error(
            "Error cargando negocio:",
            error
        );

        errorMessage.textContent =
            error.message;
    }
}


// ====================================
// MOSTRAR PREVIEW AL SELECCIONAR ARCHIVO
// ====================================

logoInput.addEventListener("change", () => {

    errorMessage.textContent = "";

    const file =
        logoInput.files[0];

    if (!file) {
        return;
    }

    const imageUrl =
        URL.createObjectURL(file);

    logoPreview.src =
        imageUrl;

    logoPreview.style.display =
        "block";
});


// ====================================
// CONTINUAR
// ====================================

nextButton.addEventListener("click", async () => {

    errorMessage.textContent = "";

    const file =
        logoInput.files[0];


    // ====================================
    // SI NO HAY ARCHIVO NUEVO
    // ====================================

    if (!file) {

        // Ya existe un logo guardado
        if (existingLogoUrl) {

            window.location.href =
                "onboarding-color.html";

            return;
        }

        // No existe ningún logo
        errorMessage.textContent =
            "Seleccioná un logo antes de continuar.";

        return;
    }


    try {

        // ================================
        // SUBIR LOGO A CLOUDINARY
        // ================================

        const formData =
            new FormData();

        formData.append(
            "file",
            file
        );

        formData.append(
            "upload_preset",
            "tomapedido_uploads"
        );


        const cloudinaryResponse =
            await fetch(
                "https://api.cloudinary.com/v1_1/y2zsd3jg/image/upload",
                {
                    method: "POST",
                    body: formData
                }
            );


        if (!cloudinaryResponse.ok) {

            throw new Error(
                "No se pudo subir el logo."
            );
        }


        const cloudinaryData =
            await cloudinaryResponse.json();


        console.log(
            "Logo subido a Cloudinary:",
            cloudinaryData
        );


        const logoUrl =
            cloudinaryData.secure_url;


        // ================================
        // GUARDAR LOGO EN EL BACKEND
        // ================================

        const response =
            await fetch(
                "http://192.168.100.32:8080/business/customization",
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        logoUrl
                    })
                }
            );


        if (!response.ok) {

            throw new Error(
                "No se pudo guardar el logo."
            );
        }


        console.log(
            "Logo guardado correctamente"
        );


        // ================================
        // PASAR AL PASO 2
        // ================================

        window.location.href =
            "onboarding-color.html";


    } catch (error) {

        console.error(
            "Error guardando logo:",
            error
        );

        errorMessage.textContent =
            error.message;
    }
});


// ====================================
// OMITIR LOGO
// ====================================

skipButton.addEventListener("click", () => {

    window.location.href =
        "onboarding-color.html";
});


// ====================================
// INICIAR
// ====================================

loadBusiness();