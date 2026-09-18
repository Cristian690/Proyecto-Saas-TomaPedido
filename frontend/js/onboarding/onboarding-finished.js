const businessSlug = localStorage.getItem("businessSlug");

const viewPageButton = document.getElementById("btn-view-page");
const adminButton = document.getElementById("btn-admin");

const finishedLogo =
    document.getElementById("finished-logo");

const finishedBusinessName =
    document.getElementById("finished-business-name");


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
                "No se pudo cargar la información del negocio."
            );
        }

        const business =
            await response.json();

        console.log(
            "Business cargado:",
            business
        );


        // Nombre del negocio
        finishedBusinessName.textContent =
            business.name || "Tu negocio";


        // Logo
        if (business.logoUrl) {

            finishedLogo.src =
                business.logoUrl;

            finishedLogo.style.display =
                "block";

        } else {

            finishedLogo.style.display =
                "none";
        }

    } catch (error) {

        console.error(
            "Error cargando negocio:",
            error
        );

    }
}


// ====================================
// VER PÁGINA
// ====================================

viewPageButton.addEventListener("click", () => {

    window.location.href =
        `../../index.html?business=${encodeURIComponent(businessSlug)}`;

});


// ====================================
// IR AL ADMIN
// ====================================

adminButton.addEventListener("click", () => {

    window.location.href =
        "../admin/admin.html";

});


// ====================================
// INICIAR
// ====================================

loadBusiness();