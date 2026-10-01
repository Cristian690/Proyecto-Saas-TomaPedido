import { API_URL } from "../api/api.js";

const token = localStorage.getItem("token");
const businessSlug = localStorage.getItem("businessSlug");

const logoInput =
    document.getElementById("business-logo");

const logoPreview =
    document.getElementById("logo-preview");

const coverInput =
    document.getElementById("business-cover");

const coverPreview =
    document.getElementById("cover-preview");

const nextButton =
    document.getElementById("btn-next");

const skipButton =
    document.getElementById("skip-logo");

const errorMessage =
    document.getElementById("onboarding-error");


// ====================================
// ARCHIVOS ACTUALES
// ====================================

let existingLogoUrl = null;
let existingCoverUrl = null;


// ====================================
// CARGAR DATOS DEL NEGOCIO
// ====================================

async function loadBusiness() {

    try {

        const response = await fetch(
            `${API_URL}/business/${businessSlug}`
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


        // ================================
        // CARGAR PORTADA EXISTENTE
        // ================================

        if (business.coverUrl) {

            existingCoverUrl =
                business.coverUrl;

            coverPreview.src =
                business.coverUrl;

            coverPreview.style.display =
                "block";

            console.log(
                "Portada existente cargada:",
                existingCoverUrl
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
// PREVIEW DEL LOGO
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
// PREVIEW DE LA PORTADA
// ====================================

coverInput.addEventListener("change", () => {

    errorMessage.textContent = "";

    const file =
        coverInput.files[0];

    if (!file) {
        return;
    }

    const imageUrl =
        URL.createObjectURL(file);

    coverPreview.src =
        imageUrl;

    coverPreview.style.display =
        "block";
});


// ====================================
// SUBIR IMAGEN A CLOUDINARY
// ====================================

async function uploadImage(file) {

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

    const response =
        await fetch(
            "https://api.cloudinary.com/v1_1/y2zsd3jg/image/upload",
            {
                method: "POST",
                body: formData
            }
        );

    if (!response.ok) {

        throw new Error(
            "No se pudo subir la imagen."
        );
    }

    const data =
        await response.json();

    return data.secure_url;
}


// ====================================
// GUARDAR PERSONALIZACIÓN
// ====================================

async function saveCustomization(data) {

    const response =
        await fetch(
            `${API_URL}/business/customization`,
            {
                method: "PATCH",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },

                body: JSON.stringify(data)
            }
        );

    if (!response.ok) {

        throw new Error(
            "No se pudo guardar la imagen."
        );
    }
}


// ====================================
// CONTINUAR
// ====================================

nextButton.addEventListener("click", async () => {

    errorMessage.textContent = "";

    const logoFile =
        logoInput.files[0];

    const coverFile =
        coverInput.files[0];


    try {

        // ================================
        // GUARDAR LOGO NUEVO
        // ================================

        if (logoFile) {

            const logoUrl =
                await uploadImage(logoFile);

            await saveCustomization({
                logoUrl
            });

            console.log(
                "Logo guardado correctamente"
            );
        }


        // ================================
        // GUARDAR PORTADA NUEVA
        // ================================

        if (coverFile) {

            const coverUrl =
                await uploadImage(coverFile);

            await saveCustomization({
                coverUrl
            });

            console.log(
                "Portada guardada correctamente"
            );
        }


        // ================================
        // PASAR AL PASO 2
        // ================================

        window.location.href =
            "onboarding-color.html";

    } catch (error) {

        console.error(
            "Error guardando imágenes:",
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