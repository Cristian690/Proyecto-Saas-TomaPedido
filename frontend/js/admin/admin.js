import { API_URL } from "../api/api.js";
import { getOptimizedCloudinaryUrl } from "../images/cloudinary.js?v=1.0";

const CLOUDINARY_URL =
    "https://api.cloudinary.com/v1_1/y2zsd3jg/image/upload";

const CLOUDINARY_UPLOAD_PRESET =
    "tomapedido_uploads";

const ORDENFLASH_WHATSAPP_URL = "https://wa.me/5491164072860";

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "../login/login.html";
}

function handleUnauthorized(response) {
    if (response.status === 401) {
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

function getContinuationWhatsappUrl() {

    const businessName = localStorage.getItem("businessName") || "mi comercio";
    const message = `Hola, quiero continuar usando OrdenFlash para mi comercio ${businessName}.`;

    return `${ORDENFLASH_WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
}

function renderTrialPeriod(trialPeriod) {

    const notice = document.getElementById("trial-period-notice");
    const message = document.getElementById("trial-period-message");
    const endingNotice = document.getElementById("trial-ending-notice");
    const expiredPanel = document.getElementById("trial-expired-panel");
    const managementContent = document.getElementById("admin-management-content");
    const trialEndsAt = new Date(trialPeriod.trialEndsAt);

    notice.hidden = true;
    endingNotice.hidden = true;
    expiredPanel.hidden = true;
    managementContent.hidden = false;

    if (Number.isNaN(trialEndsAt.getTime())) {
        return;
    }

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const daysRemaining = Math.max(
        0,
        Math.ceil((trialEndsAt - new Date()) / millisecondsPerDay)
    );
    const expirationDate = trialEndsAt.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

    if (trialPeriod.status === "ACTIVE") {
        return;
    }

    if (trialPeriod.status === "EXPIRED") {
        document.getElementById("trial-expired-message").textContent =
            `Tu prueba terminó el ${expirationDate}. Continuá usando OrdenFlash por $10.000/mes y seguí recibiendo pedidos por WhatsApp.`;
        document.getElementById("trial-expired-whatsapp").href =
            getContinuationWhatsappUrl();

        expiredPanel.hidden = false;
        managementContent.hidden = true;
        return;
    }

    message.textContent =
        `Tu comercio está en período de prueba. Te quedan ${daysRemaining} ${daysRemaining === 1 ? "día" : "días"}. Vence el ${expirationDate}.`;

    notice.hidden = false;

    if (daysRemaining === 1) {
        document.getElementById("trial-ending-whatsapp").href =
            getContinuationWhatsappUrl();
        endingNotice.hidden = false;
    }
}

async function loadTrialPeriod() {

    try {

        const response = await fetch(`${API_URL}/tenant/trial`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (handleUnauthorized(response)) {
            return null;
        }

        if (!response.ok) {
            throw new Error("No se pudo obtener el período de prueba");
        }

        const trialPeriod = await response.json();

        renderTrialPeriod(trialPeriod);

        return trialPeriod;

    } catch (error) {

        console.error("Error loading trial period:", error);

        return null;
    }
}

async function initializeAdmin() {

    const trialPeriod = await loadTrialPeriod();

    if (!trialPeriod || trialPeriod.status === "EXPIRED") {
        return;
    }

    loadBusinessConfig();
}

async function uploadLogo(file) {    

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

        const saveButton =
            document.getElementById("save-business");

        const saveMessage =
            document.getElementById("business-save-message");

        saveButton.disabled = true;
        saveButton.textContent = "Guardando...";
        saveMessage.style.display = "none";

        try {

            business.name =
                document.getElementById("business-name").value;

            business.whatsapp =
                document.getElementById("business-whatsapp").value;

            const logoFile =
                document.getElementById("business-logo").files[0];

            if (logoFile) {

                business.logo =
                    await uploadLogo(logoFile);

                document.getElementById(
                    "business-logo-preview"
                ).src = getOptimizedCloudinaryUrl(
                    business.logo,
                    "f_auto,q_auto,w_300,c_fit"
                );

                document.getElementById(
                    "business-logo-preview"
                ).style.display = "block";
            }

            const coverFile =
                document.getElementById("business-cover").files[0];

            if (coverFile) {

                business.cover =
                    await uploadCover(coverFile);

                document.getElementById(
                    "business-cover-preview"
                ).src = getOptimizedCloudinaryUrl(
                    business.cover,
                    "f_auto,q_auto,w_1200,c_fill"
                );

                document.getElementById(
                    "business-cover-preview"
                ).style.display = "block";
            }

            business.primaryColor =
                document.getElementById(
                    "business-primary-color"
                ).value;

            business.backgroundColor =
                document.getElementById(
                    "business-background-color"
                ).value;

            business.welcomeMessage =
                document.getElementById(
                    "business-welcome-message"
                ).value;

            business.address =
                document.getElementById(
                    "business-address"
                ).value;

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

            const token =
                localStorage.getItem("token");

            const response =
                await fetch(
                    `${API_URL}/business`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        },

                        body:
                            JSON.stringify(
                                businessData
                            )
                    }
                );

            if (handleUnauthorized(response)) {
                return;
            }

            if (!response.ok) {
                throw new Error(
                    "No se pudieron guardar los cambios."
                );
            }

            const data =
                await response.json();

            business.welcomeMessage =
                data.welcomeMessage ?? "";

            document.getElementById(
                "business-welcome-message"
            ).value = business.welcomeMessage;

            console.log(
                "Business saved in backend:",
                data
            );

            saveMessage.textContent =
                "✅ Cambios guardados correctamente.";

            saveMessage.style.display =
                "block";

            setTimeout(() => {
                saveMessage.style.display =
                    "none";
            }, 5000);

        } catch (error) {

            console.error(
                "Error saving business:",
                error
            );

            saveMessage.textContent =
                `❌ ${error.message}`;

            saveMessage.style.display =
                "block";

        } finally {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Guardar cambios";
        }

    });


document
    .getElementById("business-logo")
    .addEventListener("change", (event) => {

        const file =
            event.target.files[0];

        if (!file) {
            return;
        }

        const preview =
            document.getElementById("business-logo-preview");

        preview.src =
            URL.createObjectURL(file);

        preview.style.display =
            "block";
    });


document
    .getElementById("business-cover")
    .addEventListener("change", (event) => {

        const file =
            event.target.files[0];

        if (!file) {
            return;
        }

        const preview =
            document.getElementById("business-cover-preview");

        preview.src =
            URL.createObjectURL(file);

        preview.style.display =
            "block";
    });


function loadBusinessConfig() {

const businessSlug =
    localStorage.getItem("businessSlug");

fetch(
    `${API_URL}/business/${businessSlug}`,
    {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    }
)
    .then(response => {

        if (handleUnauthorized(response)) {
            return null;
        }

        return response.json();
    })
    .then(data => {

        if (!data) {
            console.log(
                "No hay negocio configurado"
            );

            return;
        }

        business.name =
            data.name;

        business.whatsapp =
            data.whatsapp;

        business.logo =
            data.logoUrl;

        business.cover =
            data.coverUrl;

        const logoPreview =
            document.getElementById(
                "business-logo-preview"
            );

        const coverPreview =
            document.getElementById(
                "business-cover-preview"
            );


        if (business.logo) {

            logoPreview.src =
                getOptimizedCloudinaryUrl(
                    business.logo,
                    "f_auto,q_auto,w_300,c_fit"
                );

            logoPreview.style.display =
                "block";
        }


        if (business.cover) {

            coverPreview.src =
                getOptimizedCloudinaryUrl(
                    business.cover,
                    "f_auto,q_auto,w_1200,c_fill"
                );

            coverPreview.style.display =
                "block";
        }


        business.primaryColor =
            data.primaryColor;

        console.log(
            "PRIMARY COLOR RECIBIDO:",
            data.primaryColor
        );

        business.backgroundColor =
            data.backgroundColor;

        business.welcomeMessage =
            data.welcomeMessage;

        business.address =
            data.address;

        business.open =
            data.open;


        const statusText =
            document.getElementById(
                "business-status-text"
            );

        const statusButton =
            document.getElementById(
                "business-status-button"
            );


        statusText.textContent =
            business.open
                ? "Estado: ABIERTO"
                : "Estado: CERRADO";

        statusButton.textContent =
            business.open
                ? "Cerrar negocio"
                : "Abrir negocio";


        document.getElementById(
            "business-name"
        ).value =
            business.name;

        document.getElementById(
            "business-whatsapp"
        ).value =
            business.whatsapp;

        document.getElementById(
            "business-primary-color"
        ).value =
            business.primaryColor;

        document.getElementById(
            "business-background-color"
        ).value =
            business.backgroundColor;

        document.getElementById(
            "business-welcome-message"
        ).value =
            business.welcomeMessage;

        document.getElementById(
            "business-address"
        ).value =
            business.address;


        console.log(
            "Business loaded from backend:",
            business
        );
    })
    .catch(error => {

        console.error(
            "Error loading business:",
            error
        );
    });

}


document
    .getElementById("business-status-button")
    .addEventListener("click", async () => {

        const token =
            localStorage.getItem("token");

        const newStatus =
            !business.open;

        try {

            const response =
                await fetch(
                    `${API_URL}/business/status`,
                    {
                        method: "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        },

                        body:
                            JSON.stringify({
                                open: newStatus
                            })
                    }
                );


            if (handleUnauthorized(response)) {
                return;
            }


            if (!response.ok) {
                throw new Error(
                    "No se pudo cambiar el estado"
                );
            }


            const data =
                await response.json();


            business.open =
                data.open;


            const statusText =
                document.getElementById(
                    "business-status-text"
                );

            const statusButton =
                document.getElementById(
                    "business-status-button"
                );


            statusText.textContent =
                business.open
                    ? "Estado: ABIERTO"
                    : "Estado: CERRADO";

            statusButton.textContent =
                business.open
                    ? "Cerrar negocio"
                    : "Abrir negocio";


        } catch (error) {

            console.error(
                "Error changing business status:",
                error
            );

        }
    });


document
    .getElementById("btn-logout")
    .addEventListener("click", () => {

        localStorage.removeItem("token");
        localStorage.removeItem("businessSlug");

        window.location.href =
            "../login/login.html";
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
            `../../index.html?business=${slug}&admin=true`,
            "_blank"
        );
    });

initializeAdmin();
