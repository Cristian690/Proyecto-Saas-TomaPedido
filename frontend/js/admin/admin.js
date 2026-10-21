import { API_URL } from "../api/api.js";
import { getOptimizedCloudinaryUrl } from "../images/cloudinary.js?v=1.0";
import { getSupportWhatsAppUrl } from "../config/support.js?v=1.0";
import { getBusinessType } from "./business-types.js?v=1.1";

const CLOUDINARY_URL =
    "https://api.cloudinary.com/v1_1/y2zsd3jg/image/upload";

const CLOUDINARY_UPLOAD_PRESET =
    "tomapedido_uploads";

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "../login/login.html";
}

if (localStorage.getItem("mustChangePassword") === "true") {
    window.location.href = "force-change-password.html";
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
    mercadoPagoAlias: "",
    mercadoPagoAccountHolder: "",
    deliveryMode: "BOTH",
    whatsappMode: "ORDERS",
    businessType: null,
    open: false,
    stockEnabled: true
};

let shareMessageTimeout;
let qrMessageTimeout;

function getPublicStoreUrl() {

    const slug = localStorage.getItem("businessSlug");

    if (!slug) {
        return null;
    }

    const publicStoreUrl = new URL("../../index.html", window.location.href);

    publicStoreUrl.searchParams.set("business", slug);

    return publicStoreUrl.toString();
}

function renderBusinessType(businessTypeId) {

    const businessTypeDisplay =
        document.getElementById("business-type-display");

    const businessType = getBusinessType(businessTypeId);

    businessTypeDisplay.textContent = businessType
        ? `${businessType.icon} ${businessType.name}`
        : "Rubro no definido";
}

function showQrMessage(message) {

    const qrMessage = document.getElementById("business-qr-message");

    clearTimeout(qrMessageTimeout);

    qrMessage.textContent = message;
    qrMessage.hidden = false;

    qrMessageTimeout = setTimeout(() => {
        qrMessage.hidden = true;
    }, 3000);
}

function showBusinessQrCode() {

    const publicStoreUrl = getPublicStoreUrl();

    if (!publicStoreUrl) {
        showShareMessage("No se encontró el enlace público del negocio.");
        return;
    }

    const qrModal = document.getElementById("business-qr-modal");
    const qrCodeContainer = document.getElementById("business-qr-code");
    const qrUrl = document.getElementById("business-qr-url");
    const downloadButton = document.getElementById("btn-download-qr");

    qrCodeContainer.replaceChildren();
    qrUrl.textContent = publicStoreUrl;
    document.getElementById("business-qr-message").hidden = true;
    downloadButton.disabled = true;

    if (!window.QRCode) {
        qrModal.hidden = false;
        showQrMessage("No se pudo generar el código QR. Intentá nuevamente.");
        return;
    }

    try {
        new window.QRCode(qrCodeContainer, {
            text: publicStoreUrl,
            width: 256,
            height: 256,
            colorDark: "#161616",
            colorLight: "#ffffff",
            correctLevel: window.QRCode.CorrectLevel.M
        });

        downloadButton.disabled = false;
        qrModal.hidden = false;
    } catch (error) {
        console.error("Error generating business QR code:", error);
        qrModal.hidden = false;
        showQrMessage("No se pudo generar el código QR. Intentá nuevamente.");
    }
}

function closeBusinessQrCode() {
    document.getElementById("business-qr-modal").hidden = true;
}

function downloadBusinessQrCode() {

    const canvas = document.querySelector("#business-qr-code canvas");
    const slug = localStorage.getItem("businessSlug") || "tienda";

    if (!canvas) {
        showQrMessage("No se pudo preparar la descarga. Intentá nuevamente.");
        return;
    }

    const pngCanvas = document.createElement("canvas");
    const pngContext = pngCanvas.getContext("2d");

    pngCanvas.width = canvas.width;
    pngCanvas.height = canvas.height;
    pngContext.fillStyle = "#ffffff";
    pngContext.fillRect(0, 0, pngCanvas.width, pngCanvas.height);
    pngContext.drawImage(canvas, 0, 0);

    const downloadLink = document.createElement("a");

    downloadLink.href = pngCanvas.toDataURL("image/png");
    downloadLink.download = `ordenflash-${slug}-codigo-qr.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
}

function initializeBusinessSectionNavigation() {

    const navigation = document.querySelector(".business-section-nav");

    if (!navigation) {
        return;
    }

    const buttons = [...navigation.querySelectorAll("[data-business-section]")];
    const sections = buttons
        .map(button => document.getElementById(button.dataset.businessSection))
        .filter(Boolean);

    const setActiveSection = (sectionId) => {
        buttons.forEach(button => {
            const isActive = button.dataset.businessSection === sectionId;

            button.classList.toggle("business-section-nav__button--active", isActive);
            button.setAttribute("aria-current", isActive ? "true" : "false");
        });
    };

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            const section = document.getElementById(button.dataset.businessSection);

            if (!section) {
                return;
            }

            setActiveSection(section.id);
            section.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });

    if (!("IntersectionObserver" in window)) {
        return;
    }

    const observer = new IntersectionObserver(entries => {
        const visibleSection = entries
            .filter(entry => entry.isIntersecting)
            .sort((first, second) =>
                first.boundingClientRect.top - second.boundingClientRect.top
            )[0];

        if (visibleSection) {
            setActiveSection(visibleSection.target.id);
        }
    }, {
        rootMargin: "-80px 0px -55% 0px",
        threshold: 0
    });

    sections.forEach(section => observer.observe(section));
}

function syncBusinessOptionGroups() {

    document.querySelectorAll("[data-business-select]").forEach(group => {
        const select = document.getElementById(group.dataset.businessSelect);

        if (!select) {
            return;
        }

        group.querySelectorAll("[data-value]").forEach(button => {
            const isActive = button.dataset.value === select.value;

            button.classList.toggle("business-option-button--active", isActive);
            button.setAttribute("aria-checked", isActive ? "true" : "false");
        });
    });
}

function initializeBusinessOptionGroups() {

    document.querySelectorAll("[data-business-select]").forEach(group => {
        const select = document.getElementById(group.dataset.businessSelect);

        if (!select) {
            return;
        }

        group.querySelectorAll("[data-value]").forEach(button => {
            button.addEventListener("click", () => {
                select.value = button.dataset.value;
                select.dispatchEvent(new Event("change"));
                syncBusinessOptionGroups();
            });
        });
    });

    syncBusinessOptionGroups();
}

function showShareMessage(message) {

    const shareMessage = document.getElementById("business-share-message");

    clearTimeout(shareMessageTimeout);

    shareMessage.textContent = message;
    shareMessage.hidden = false;

    shareMessageTimeout = setTimeout(() => {
        shareMessage.hidden = true;
    }, 3000);
}

function showBusinessPanelMessage(elementId, message) {

    const messageElement = document.getElementById(elementId);

    if (!messageElement) {
        return;
    }

    messageElement.textContent = message;
    messageElement.hidden = false;
}

function hideBusinessPanelMessage(elementId) {

    const messageElement = document.getElementById(elementId);

    if (messageElement) {
        messageElement.hidden = true;
    }
}

async function getResponseErrorMessage(response, fallbackMessage) {

    try {
        const data = await response.json();

        if (typeof data?.message === "string" && data.message.trim()) {
            return data.message;
        }

        if (typeof data?.error === "string" && data.error.trim()) {
            return data.error;
        }
    } catch (error) {
        console.error("No se pudo leer el detalle del error:", error);
    }

    return fallbackMessage;
}

async function copyPublicStoreUrl(url) {

    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        return;
    }

    const temporaryInput = document.createElement("textarea");

    temporaryInput.value = url;
    temporaryInput.setAttribute("readonly", "");
    temporaryInput.style.position = "fixed";
    temporaryInput.style.opacity = "0";

    document.body.appendChild(temporaryInput);
    temporaryInput.select();

    const copied = document.execCommand("copy");

    temporaryInput.remove();

    if (!copied) {
        throw new Error("No se pudo copiar el enlace");
    }
}

function getContinuationWhatsappUrl() {

    const businessName = localStorage.getItem("businessName") || "mi comercio";
    const message = `Hola, quiero continuar usando OrdenFlash para mi comercio ${businessName}.`;

    return getSupportWhatsAppUrl(message);
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

            business.mercadoPagoAlias =
                document.getElementById(
                    "business-mercado-pago-alias"
                ).value;

            business.mercadoPagoAccountHolder =
                document.getElementById(
                    "business-mercado-pago-account-holder"
                ).value;

            business.stockEnabled =
                document.getElementById(
                    "business-stock-enabled"
                ).checked;

            business.deliveryMode =
                document.getElementById(
                    "business-delivery-mode"
                ).value;

            business.whatsappMode =
                document.getElementById(
                    "business-whatsapp-mode"
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
                mercadoPagoAlias: business.mercadoPagoAlias,
                mercadoPagoAccountHolder: business.mercadoPagoAccountHolder,
                deliveryMode: business.deliveryMode,
                whatsappMode: business.whatsappMode,
                open: business.open,
                stockEnabled: business.stockEnabled
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
                    await getResponseErrorMessage(
                        response,
                        "No se pudieron guardar los cambios."
                    )
                );
            }

            const data =
                await response.json();

            business.welcomeMessage =
                data.welcomeMessage ?? "";

            business.stockEnabled =
                data.stockEnabled !== false;

            business.mercadoPagoAlias =
                data.mercadoPagoAlias ?? "";

            business.mercadoPagoAccountHolder =
                data.mercadoPagoAccountHolder ?? "";

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

const publicStoreUrl = getPublicStoreUrl();

if (publicStoreUrl) {
    document.getElementById("business-public-url").value = publicStoreUrl;
}

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

        if (!response.ok) {
            return getResponseErrorMessage(
                response,
                "No se pudieron cargar los datos del negocio."
            ).then(message => {
                throw new Error(message);
            });
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

        hideBusinessPanelMessage("business-load-message");

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

        business.mercadoPagoAlias =
            data.mercadoPagoAlias ?? "";

        business.mercadoPagoAccountHolder =
            data.mercadoPagoAccountHolder ?? "";

        business.open =
            data.open;

        business.stockEnabled =
            data.stockEnabled !== false;

        business.deliveryMode =
            data.deliveryMode || "BOTH";

        business.whatsappMode =
            data.whatsappMode || "ORDERS";

        business.businessType = data.businessType || null;
        renderBusinessType(business.businessType);

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

        document.getElementById(
            "business-mercado-pago-alias"
        ).value =
            business.mercadoPagoAlias;

        document.getElementById(
            "business-mercado-pago-account-holder"
        ).value =
            business.mercadoPagoAccountHolder;

        document.getElementById(
            "business-stock-enabled"
        ).checked =
            business.stockEnabled;

        document.getElementById(
            "business-delivery-mode"
        ).value =
            business.deliveryMode;

        document.getElementById(
            "business-whatsapp-mode"
        ).value =
            business.whatsappMode;

        syncBusinessOptionGroups();

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

        showBusinessPanelMessage(
            "business-load-message",
            error.message || "No se pudieron cargar los datos del negocio."
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

        hideBusinessPanelMessage("business-status-message");

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
                    await getResponseErrorMessage(
                        response,
                        "No se pudo cambiar el estado."
                    )
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

        showBusinessPanelMessage(
            "business-status-message",
            error.message || "No se pudo cambiar el estado."
        );

    }
    });


document
    .getElementById("btn-share-store")
    .addEventListener("click", async () => {

        const publicStoreUrl = getPublicStoreUrl();

        if (!publicStoreUrl) {
            showShareMessage("No se encontró el enlace público del negocio.");
            return;
        }

        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Mi tienda online",
                    text: "Visitá mi tienda online y hacé tu pedido.",
                    url: publicStoreUrl
                });

                return;
            } catch (error) {
                if (error.name === "AbortError") {
                    return;
                }
            }
        }

        try {
            await copyPublicStoreUrl(publicStoreUrl);
            showShareMessage("✅ Enlace copiado al portapapeles.");
        } catch (error) {
            console.error("Error copying public store URL:", error);
            showShareMessage("No se pudo copiar el enlace. Intentá nuevamente.");
        }
    });

document
    .getElementById("btn-show-qr")
    .addEventListener("click", showBusinessQrCode);

document
    .getElementById("btn-close-qr")
    .addEventListener("click", closeBusinessQrCode);

document
    .getElementById("btn-download-qr")
    .addEventListener("click", downloadBusinessQrCode);

document
    .getElementById("business-qr-modal")
    .addEventListener("click", (event) => {
        if (event.target.id === "business-qr-modal") {
            closeBusinessQrCode();
        }
    });

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeBusinessQrCode();
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

            showShareMessage(
                "No se encontró el enlace público del negocio."
            );

            return;
        }

        window.open(
            `../../index.html?business=${slug}&admin=true`,
            "_blank"
        );
    });

initializeBusinessOptionGroups();
initializeBusinessSectionNavigation();
initializeAdmin();
