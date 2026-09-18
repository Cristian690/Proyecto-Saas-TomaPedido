console.log("Admin loaded");

const CLOUDINARY_URL =
    "https://api.cloudinary.com/v1_1/y2zsd3jg/image/upload";

const CLOUDINARY_UPLOAD_PRESET =
    "tomapedido_uploads";

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "../login/login.html";
}

function handleUnauthorized(response) {
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("businessSlug");
        localStorage.removeItem("businessName");
        localStorage.removeItem("role");

        window.location.href = "../login/login.html";

        return true;
    }

    return false;
}

const business = {
    name: "",
    whatsapp: "",
    logo: "",
    cover: "",
    primaryColor: "#e63946",
    backgroundColor: "#ffffff",
    welcomeMessage: "",
    address: "",
    open: false
};

async function uploadLogo(file) {

    console.log("SUBIENDO LOGO:", file);

    if (!file) {
        return null;
    }

    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        throw new Error("No se pudo subir el logo");
    }

    const data = await response.json();

    return data.secure_url;
}

async function uploadCover(file) {

    if (!file) {
        return null;
    }

    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        throw new Error("No se pudo subir la portada");
    }

    const data = await response.json();

    return data.secure_url;
}

document
    .getElementById("save-business")
    .addEventListener("click", async () => {

        business.name =
            document.getElementById("business-name").value;

        business.whatsapp =
            document.getElementById("business-whatsapp").value;

        const logoFile =
            document.getElementById("business-logo").files[0];

        if (logoFile) {
            business.logo = await uploadLogo(logoFile);
        }

        const coverFile =
            document.getElementById("business-cover").files[0];

        if (coverFile) {
            business.cover = await uploadCover(coverFile);
        }

        business.primaryColor =
            document.getElementById("business-primary-color").value;

        business.backgroundColor =
            document.getElementById("business-background-color").value;

        business.welcomeMessage =
            document.getElementById("business-welcome-message").value;

        business.address =
            document.getElementById("business-address").value;


        console.log("Business saved:", business);

        const businessData = {
            name: business.name,
            whatsapp: business.whatsapp,
            logoUrl: business.logo,
            coverUrl: business.cover,
            primaryColor: business.primaryColor,
            backgroundColor: business.backgroundColor,
            welcomeMessage: business.welcomeMessage,
            address: business.address,
            open: business.open
        };

        const token = localStorage.getItem("token");

        fetch("http://192.168.100.32:8080/business", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(businessData)
        })
        .then(response => {
            if (handleUnauthorized(response)) {
                return null;
            }

            return response.json();
        })
        .then(data => {
            console.log("Business saved in backend:", data);
        })
        .catch(error => {
            console.error("Error saving business:", error);
        });

    });

const businessSlug = localStorage.getItem("businessSlug");

fetch(`http://192.168.100.32:8080/business/${businessSlug}`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
})
        .then(response => {
            if (handleUnauthorized(response)) {
                return null;
            }

            return response.json();
        })
        .then(data => {

            if (!data) {
                console.log("No hay negocio configurado");
                return;
            }

            business.name = data.name;
            business.whatsapp = data.whatsapp;
            business.logo = data.logoUrl;
            business.cover = data.coverUrl;
            const logoPreview =
                document.getElementById("business-logo-preview");

            const coverPreview =
                document.getElementById("business-cover-preview");


            if (business.logo) {
                logoPreview.src = business.logo;
                logoPreview.style.display = "block";
            }


            if (business.cover) {
                coverPreview.src = business.cover;
                coverPreview.style.display = "block";
            }
            business.primaryColor = data.primaryColor;
            console.log("PRIMARY COLOR RECIBIDO:", data.primaryColor);
            business.backgroundColor = data.backgroundColor;
            business.welcomeMessage = data.welcomeMessage;
            business.address = data.address;

            business.open = data.open;

            const statusText = document.getElementById("business-status-text");
            const statusButton = document.getElementById("business-status-button");

            statusText.textContent = business.open
                ? "Estado: ABIERTO"
                : "Estado: CERRADO";

            statusButton.textContent = business.open
                ? "Cerrar negocio"
                : "Abrir negocio";

            document.getElementById("business-name").value = business.name;
            document.getElementById("business-whatsapp").value = business.whatsapp;
            
            document.getElementById("business-primary-color").value = business.primaryColor;
            document.getElementById("business-background-color").value = business.backgroundColor;
            document.getElementById("business-welcome-message").value = business.welcomeMessage;
            document.getElementById("business-address").value = business.address;

            console.log("Business loaded from backend:", business);
        })
        .catch(error => {
            console.error("Error loading business:", error);
        });

document
    .getElementById("business-status-button")
    .addEventListener("click", async () => {

        const token = localStorage.getItem("token");

        const newStatus = !business.open;

        try {

            const response = await fetch(
                "http://192.168.100.32:8080/business/status",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        open: newStatus
                    })
                }
            );

            if (handleUnauthorized(response)) {
                return;
            }

            if (!response.ok) {
                throw new Error("No se pudo cambiar el estado");
            }

            const data = await response.json();

            business.open = data.open;

            const statusText =
                document.getElementById("business-status-text");

            const statusButton =
                document.getElementById("business-status-button");

            statusText.textContent = business.open
                ? "Estado: ABIERTO"
                : "Estado: CERRADO";

            statusButton.textContent = business.open
                ? "Cerrar negocio"
                : "Abrir negocio";

        } catch (error) {

            console.error("Error changing business status:", error);

        }
    });
        

document
    .getElementById("btn-logout")
    .addEventListener("click", () => {

        localStorage.removeItem("token");
        localStorage.removeItem("businessSlug");

        window.location.href = "../login/login.html";
    });

document
    .getElementById("btn-view-public")
    .addEventListener("click", () => {

        const slug =
            localStorage.getItem("businessSlug");

        if (!slug) {
            alert(
                "No se encontró el enlace público del negocio."
            );
            return;
        }

        window.open(
            `../../index.html?business=${slug}`,
            "_blank"
        );
    });