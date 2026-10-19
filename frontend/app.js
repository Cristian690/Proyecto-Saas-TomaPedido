import {
    getBusiness,
    getCategories as fetchCategories,
    getProducts,
    confirmCheckout
} from "./js/api/api.js?v=1.0";

import { getOptimizedCloudinaryUrl } from "./js/images/cloudinary.js?v=1.0";
import { getCategoryIcon } from "./js/admin/business-types.js?v=1.1";

import {
    setCategories,
    getCategories,
    renderTabs,
    initTabs
} from "./js/categories/categories.js?v=1.0";

import {
    setProducts,
    renderProducts,
    products,
    createProductImage
} from "./js/products/products.js?v=1.7";

import {
    addToCart,
    changeQty,
    removeItem,
    renderCart,
    getCart,
    configureCartStock
} from "./js/cart/cart.js?v=1.5";


lucide.createIcons();

const params = new URLSearchParams(window.location.search);
const slug = params.get("business");
const openedFromAdmin = params.get("admin") === "true";

let businessOpen = true;
let currentBusiness = null;
let transferCopyMessageTimeout;
let currentProductDetail = null;
let productDetailTrigger = null;
let productDetailPreviousBodyOverflow = "";
const DEFAULT_BUSINESS_LOGO = "assets/logo-ejemplo.png";


if (!slug) {
    throw new Error("No se indicó el comercio");
}


function setupAdminPreview() {

    if (!openedFromAdmin) {
        return;
    }

    document.body.classList.add("admin-preview");

    const adminPanelLink =
        document.getElementById("nav-admin-panel");

    adminPanelLink.hidden = false;

    adminPanelLink.addEventListener("click", event => {

        if (!window.opener) {
            return;
        }

        event.preventDefault();
        window.opener.focus();
        window.close();
    });
}

function showTransferCopyMessage(message) {

    const copyMessage = document.getElementById("transfer-copy-message");

    clearTimeout(transferCopyMessageTimeout);

    copyMessage.textContent = message;
    copyMessage.hidden = false;

    transferCopyMessageTimeout = setTimeout(() => {
        copyMessage.hidden = true;
    }, 3000);
}

function renderTransferDetails(business) {

    const transferDetails = document.getElementById("transfer-details");
    const aliasDetails = document.getElementById("transfer-alias-details");
    const paymentMethod = document.getElementById("payment-method");
    const transferOption = document.getElementById("transfer-payment-option");
    const alias = business.mercadoPagoAlias?.trim();
    const accountHolder = business.mercadoPagoAccountHolder?.trim();
    const transferAvailable = Boolean(alias || accountHolder);

    transferOption.hidden = !transferAvailable;
    transferOption.disabled = !transferAvailable;

    if (!transferAvailable && paymentMethod.value === "Transferencia") {
        paymentMethod.value = "Efectivo";
    }

    aliasDetails.hidden = !alias;
    document.getElementById("transfer-alias").textContent = alias || "";

    const accountHolderElement =
        document.getElementById("transfer-account-holder");

    accountHolderElement.hidden = !accountHolder;
    accountHolderElement.textContent = accountHolder
        ? `Titular: ${accountHolder}`
        : "";

    document.getElementById("transfer-copy-message").hidden = true;
    togglePaymentFields();
}

function configureDeliveryMethods(business) {

    const deliveryMethod = document.getElementById("delivery-method");
    const deliveryOption = document.getElementById("delivery-option");
    const pickupOption = document.getElementById("pickup-option");
    const deliveryMode = business.deliveryMode || "BOTH";
    const deliveryEnabled = deliveryMode !== "PICKUP_ONLY";
    const pickupEnabled = deliveryMode !== "DELIVERY_ONLY";

    deliveryOption.hidden = !deliveryEnabled;
    deliveryOption.disabled = !deliveryEnabled;
    pickupOption.hidden = !pickupEnabled;
    pickupOption.disabled = !pickupEnabled;

    if (deliveryMethod.value === "delivery" && !deliveryEnabled) {
        deliveryMethod.value = "pickup";
    }

    if (deliveryMethod.value === "pickup" && !pickupEnabled) {
        deliveryMethod.value = "delivery";
    }

    toggleDeliveryFields();
}

function getBusinessWhatsAppPhone() {

    let phone = currentBusiness?.whatsapp?.replace(/\D/g, "") || "";

    if (phone.startsWith("549")) {
        return phone;
    }

    if (phone.startsWith("54")) {
        return "549" + phone.substring(2);
    }

    if (phone.startsWith("0")) {
        phone = phone.substring(1);
    }

    if (phone.startsWith("11") && phone.length === 10) {
        return "549" + phone;
    }

    return phone;
}

function configureWhatsAppMode(business) {

    const inquiriesMode = business.whatsappMode === "INQUIRIES";
    const button = document.getElementById("btn-whatsapp");
    const buttonIcon = document.createElement("i");

    document.getElementById("cart-panel").hidden = false;
    document.getElementById("menu-cart").hidden = false;
    document.getElementById("cart-title-text").textContent = inquiriesMode
        ? "Tu consulta"
        : "Tu carrito";

    buttonIcon.setAttribute("data-lucide", "message-circle");
    button.replaceChildren(
        buttonIcon,
        inquiriesMode
            ? "Consultar por WhatsApp"
            : "Enviar pedido por WhatsApp"
    );

    document.getElementById("cart-mode-note").textContent = inquiriesMode
        ? "Seleccioná los productos que querés consultar."
        : "🔒 Tu pedido será confirmado por WhatsApp";

    lucide.createIcons();
}

function showInquiryNotice(message) {
    document.getElementById("cart-mode-note").textContent = message;
}

function getProductDetailCategoryName(product) {
    return getCategories().find(
        category => String(category.id) === String(product.categoria)
    )?.nombre || "";
}

function showProductDetailFeedback(message) {
    const feedback = document.getElementById("product-detail-feedback");

    feedback.textContent = message;
    feedback.hidden = false;
}

function renderProductDetail() {
    if (!currentProductDetail) {
        return;
    }

    const product = currentProductDetail;
    const productId = String(product.id);
    const quantity = getCart()[productId]?.qty || 0;
    const stockEnabled = currentBusiness?.stockEnabled !== false;
    const stock = Number(product.stock);
    const outOfStock = stockEnabled && stock <= 0;
    const categoryName = getProductDetailCategoryName(product);
    const imageContainer = document.getElementById(
        "product-detail-image-container"
    );
    const image = createProductImage(
        product.imagen,
        product.nombre || "",
        "product-detail-image",
        "f_auto,q_auto,w_1200,h_900,c_fit"
    );

    imageContainer.replaceChildren(image);

    document.getElementById("product-detail-name").textContent =
        product.nombre;
    document.getElementById("product-detail-price").textContent =
        `$${product.precio.toLocaleString("es-AR")}`;

    const description = document.getElementById(
        "product-detail-description"
    );

    description.textContent = product.descripcion || "";
    description.hidden = !product.descripcion?.trim();

    const category = document.getElementById("product-detail-category");

    category.textContent = categoryName ? `📂 ${categoryName}` : "";
    category.hidden = !categoryName;

    document.getElementById("product-detail-quantity-value").textContent =
        quantity;

    const decreaseButton = document.getElementById(
        "btn-product-detail-decrease"
    );
    const increaseButton = document.getElementById(
        "btn-product-detail-increase"
    );
    const addButton = document.getElementById("btn-product-detail-add");

    decreaseButton.disabled = quantity === 0;
    increaseButton.disabled = outOfStock || (stockEnabled && quantity >= stock);
    addButton.disabled = outOfStock || (stockEnabled && quantity >= stock);
    addButton.textContent = outOfStock
        ? "Agotado"
        : stockEnabled && quantity >= stock
            ? "Stock máximo alcanzado"
            : "Agregar al carrito";
}

function openProductDetail(product, trigger) {
    const modal = document.getElementById("product-detail-modal");

    currentProductDetail = product;
    productDetailTrigger = trigger || document.activeElement;
    document.getElementById("product-detail-feedback").hidden = true;
    renderProductDetail();

    modal.hidden = false;
    productDetailPreviousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.getElementById("btn-close-product-detail").focus();
}

function closeProductDetail() {
    const modal = document.getElementById("product-detail-modal");

    modal.hidden = true;
    document.body.style.overflow = productDetailPreviousBodyOverflow;
    productDetailPreviousBodyOverflow = "";
    currentProductDetail = null;
    productDetailTrigger?.focus?.();
    productDetailTrigger = null;
}

function addProductFromDetail() {
    if (!currentProductDetail) {
        return;
    }

    const productId = String(currentProductDetail.id);

    if (!getCart()[productId]) {
        addToCart(productId, products);
    }

    renderProductDetail();
    showProductDetailFeedback("✅ Producto agregado al carrito.");
}

function changeProductDetailQuantity(delta) {
    if (!currentProductDetail) {
        return;
    }

    const productId = String(currentProductDetail.id);

    if (delta > 0 && !getCart()[productId]) {
        addToCart(productId, products);
    } else {
        changeQty(productId, delta);
    }

    renderProductDetail();
}

function sendProductInquiry() {

    const items = Object.entries(getCart());

    if (items.length === 0) {
        showInquiryNotice("Agregá al menos un producto para enviar tu consulta.");
        return;
    }

    const phone = getBusinessWhatsAppPhone();

    if (!phone) {
        showInquiryNotice("Este negocio todavía no configuró su número de WhatsApp.");
        return;
    }

    const productsMessage = items.map(([productId, item]) => {
        const product = products.find(
            currentProduct => String(currentProduct.id) === String(productId)
        );
        const categoryName = product
            ? getProductDetailCategoryName(product)
            : "";

        return `${getCategoryIcon(categoryName)} ${item.name} × ${item.qty}`;
    }).join("\n");

    const message =
        `🏪 *CONSULTA DE PRODUCTOS — ${currentBusiness.name}*\n\n` +
        "👋 ¡Hola! Quería consultar por estos productos:\n\n" +
        `📦 *Productos de interés:*\n\n${productsMessage}\n\n` +
        "💬 ¿Me podrían informar si están disponibles?\n\n" +
        "¡Muchas gracias! 😊";

    window.open(
        `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(message)}`,
        "_blank"
    );
}

window.addEventListener("cartchange", () => {
    if (currentBusiness?.whatsappMode === "INQUIRIES") {
        showInquiryNotice("Seleccioná los productos que querés consultar.");
    }
});

async function copyTransferAlias() {

    const alias = currentBusiness?.mercadoPagoAlias?.trim();

    if (!alias) {
        return;
    }

    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(alias);
        } else {
            const temporaryInput = document.createElement("textarea");

            temporaryInput.value = alias;
            temporaryInput.setAttribute("readonly", "");
            temporaryInput.style.position = "fixed";
            temporaryInput.style.opacity = "0";

            document.body.appendChild(temporaryInput);
            temporaryInput.select();

            const copied = document.execCommand("copy");

            temporaryInput.remove();

            if (!copied) {
                throw new Error("No se pudo copiar el alias");
            }
        }

        showTransferCopyMessage("✅ Alias copiado al portapapeles.");
    } catch (error) {
        console.error("Error copying Mercado Pago alias:", error);
        showTransferCopyMessage("No se pudo copiar el alias. Intentá nuevamente.");
    }
}


function renderEmptyProductsState() {

    const productsContainer =
        document.getElementById("productos-container");

    const tabsContainer =
        document.getElementById("tabs-container");

    tabsContainer.hidden = true;

    if (openedFromAdmin) {
        productsContainer.innerHTML = `
            <section class="public-store-empty public-store-empty--admin">
                <h2>🛒 Tu tienda todavía no tiene productos</h2>
                <p>Agregá tus primeros productos para empezar a recibir pedidos.</p>
                <a href="pages/admin/products.html">Agregar mi primer producto</a>
            </section>
        `;

        return;
    }

    productsContainer.innerHTML = `
        <section class="public-store-empty">
            <p>🛒 Todavía no hay productos disponibles.</p>
        </section>
    `;
}


async function loadData() {

    const business = await getBusiness(slug);    

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


    currentBusiness = business;

    renderTransferDetails(business);
    configureDeliveryMethods(business);
    configureWhatsAppMode(business);

    document.documentElement.style.setProperty(
        "--business-primary",
        business.primaryColor
    );

    document.documentElement.style.setProperty(
        "--business-primary-text",
        getContrastTextColor(business.primaryColor)
    );

    document.documentElement.style.setProperty(
        "--business-background-text",
        getContrastTextColor(business.backgroundColor)
    );

    document.documentElement.style.setProperty(
        "--business-background",
        business.backgroundColor
    );

    document.body.style.backgroundColor =
        business.backgroundColor;    
    
    

    document.body.classList.add("page-ready");

    document.title = business.name;


    // ================================
    // NOMBRE EN LA CABECERA
    // ================================

    const businessNameElement =
        document.getElementById("business-name");

    businessNameElement.textContent =
        business.name;


    // ================================
    // PORTADA Y LOGO DEL HERO
    // ================================

    const heroElement =
        document.querySelector(".hero");

    const heroBusinessLogoElement =
        document.getElementById("hero-business-logo");

    const showDefaultBusinessLogo = () => {
        heroBusinessLogoElement.onerror = () => {
            heroBusinessLogoElement.removeAttribute("src");
            heroBusinessLogoElement.style.display = "none";
        };

        heroBusinessLogoElement.src =
            DEFAULT_BUSINESS_LOGO;

        heroBusinessLogoElement.style.display =
            "block";
    };


    // PORTADA
    if (business.coverUrl) {

        heroElement.style.backgroundImage =
            `url("${getOptimizedCloudinaryUrl(
                business.coverUrl,
                "f_auto,q_auto,w_1200,c_fill"
            )}")`;

        heroElement.style.backgroundSize =
            "cover";

        heroElement.style.backgroundPosition =
            "center";

    } else {

        heroElement.style.backgroundImage =
            "none";
    }


    // LOGO
    if (business.logoUrl) {

        heroBusinessLogoElement.onerror =
            showDefaultBusinessLogo;

        heroBusinessLogoElement.src =
            getOptimizedCloudinaryUrl(
                business.logoUrl,
                "f_auto,q_auto,w_300,c_fit"
            );

        heroBusinessLogoElement.style.display =
            "block";

    } else {

        showDefaultBusinessLogo();
    }


    // ================================
    // MENSAJE DE BIENVENIDA
    // ================================

    const heroWelcomeMessageElement =
        document.getElementById("hero-welcome-message");

    heroWelcomeMessageElement.textContent =
        business.welcomeMessage || "";

    const heroBusinessAddressElement =
        document.getElementById("hero-business-address");

    const businessAddress =
        business.address?.trim();

    if (businessAddress) {

        heroBusinessAddressElement.textContent =
            `📍 ${businessAddress}`;

        heroBusinessAddressElement.hidden =
            false;

    } else {

        heroBusinessAddressElement.textContent =
            "";

        heroBusinessAddressElement.hidden =
            true;
    }


    // ================================
    // ESTADO DEL NEGOCIO
    // ================================

    businessOpen =
        business.open;

    const closedModal =
        document.getElementById(
            "closed-business-modal"
        );

    const closeClosedModalButton =
        document.getElementById(
            "btn-close-business-modal"
        );


    if (!business.open) {

        closedModal.style.display =
            "flex";
    }


    closeClosedModalButton.addEventListener(
        "click",
        () => {

            closedModal.style.display =
                "none";
        }
    );


    // ================================
    // CATEGORÍAS
    // ================================

    const categoriesFromApi =
        await fetchCategories(slug);


    // ================================
    // PRODUCTOS
    // ================================

    const productsFromApi =
        await getProducts(slug);


    setCategories(
        categoriesFromApi.map(category => ({
            id: String(category.id),
            nombre: category.name
        }))
    );


    setProducts(
        productsFromApi.map(product => ({
            id: String(product.id),
            nombre: product.name,
            descripcion: product.description,
            precio: Number(product.price),
            stock: Number(product.stock),
            imagen: product.imageUrl,
            categoria: String(product.categoryId)
        }))
    );

    const stockEnabled = business.stockEnabled !== false;
    const onProductAction = id => addToCart(id, products);
    const onOpenProductDetail = (product, trigger) =>
        openProductDetail(product, trigger);

    configureCartStock(
        stockEnabled,
        productId => products.find(
            product => String(product.id) === String(productId)
        )?.stock
    );


    if (productsFromApi.length === 0) {
        renderEmptyProductsState();
        return;
    }


    // ================================
    // CATEGORÍAS
    // ================================

    renderTabs();


    initTabs(categoryId => {

        const selectedCategory =
            categoryId === "all"
                ? getCategories()
                : getCategories().filter(
                    category =>
                        category.id === categoryId
                );


        renderProducts(
            selectedCategory,
            onProductAction,
            changeQty,
            id => getCart()[id]?.qty || 0,
            stockEnabled,
            onOpenProductDetail
        );
    });


    // ================================
    // PRODUCTOS
    // ================================

    renderProducts(
        getCategories(),
        onProductAction,
        changeQty,
        id => getCart()[id]?.qty || 0,
        stockEnabled,
        onOpenProductDetail
    );


    // ================================
    // CARRITO
    // ================================

    renderCart();
}

function showPublicStoreUnavailable() {

    document.getElementById("public-store-unavailable").hidden = false;
    document.body.classList.add("public-store-unavailable-active");
}


window.addToCart = addToCart;
window.changeQty = changeQty;
window.removeItem = removeItem;

window.addEventListener("cartchange", () => {
    if (currentProductDetail) {
        renderProductDetail();
    }
});

document
    .getElementById("btn-close-product-detail")
    .addEventListener("click", closeProductDetail);

document
    .getElementById("product-detail-modal")
    .addEventListener("click", event => {
        if (event.target === event.currentTarget) {
            closeProductDetail();
        }
    });

document.addEventListener("keydown", event => {
    if (
        event.key === "Escape" &&
        !document.getElementById("product-detail-modal").hidden
    ) {
        closeProductDetail();
    }
});

document
    .getElementById("btn-product-detail-decrease")
    .addEventListener("click", () => changeProductDetailQuantity(-1));

document
    .getElementById("btn-product-detail-increase")
    .addEventListener("click", () => changeProductDetailQuantity(1));

document
    .getElementById("btn-product-detail-add")
    .addEventListener("click", addProductFromDetail);

document
    .getElementById("btn-product-detail-cancel")
    .addEventListener("click", closeProductDetail);


// ====================================
// MODAL CHECKOUT
// ====================================

const modal =
    document.getElementById(
        "checkout-modal"
    );

const checkoutValidationError =
    document.getElementById(
        "checkout-validation-error"
    );

function showCheckoutValidationError(message) {

    checkoutValidationError.textContent = message;
    checkoutValidationError.hidden = false;
}


// ====================================
// BOTÓN WHATSAPP
// ====================================

const whatsappButton =
    document.getElementById(
        "btn-whatsapp"
    );


whatsappButton.addEventListener(
    "click",
    async (e) => {

        e.preventDefault();

        if (currentBusiness?.whatsappMode === "INQUIRIES") {
            sendProductInquiry();
            return;
        }

        try {

            const businessActual =
                await getBusiness(slug);

            if (!businessActual.open) {

                const closedModal =
                    document.getElementById(
                        "closed-business-modal"
                    );

                closedModal.style.display =
                    "flex";

                return;
            }


            if (
                Object.keys(getCart()).length === 0
            ) {
                return;
            }


            const items =
                Object.entries(getCart());


            const totalPrice =
                items.reduce(
                    (sum, [, item]) =>
                        sum + item.price * item.qty,
                    0
                );


            document.getElementById(
                "checkout-total-price"
            ).textContent =
                `$${totalPrice.toLocaleString("es-AR")}`;


            document.getElementById("cart-body").style.display =
                "none";

            document.getElementById("cart-overlay").style.display =
                "none";


            modal.style.display =
                "flex";

            document.body.style.overflow =
                "hidden";


            // Guardamos el estado del checkout
            history.pushState(
                { checkout: true },
                "",
                "#checkout"
            );


        } catch (error) {

            console.error(
                "Error comprobando estado del negocio:",
                error
            );

        }
    }
);


// ====================================
// CERRAR MODAL
// ====================================

document
    .getElementById("btn-close-modal")
    .addEventListener(
        "click",
        () => {

            if (
                history.state &&
                history.state.checkout
            ) {

                history.back();

            } else {

                modal.style.display =
                    "none";

                document.body.style.overflow =
                    "";
            }
        }
    );


// ====================================
// BOTÓN ATRÁS DEL CELULAR
// ====================================

window.addEventListener(
    "popstate",
    (event) => {

        const cartBody =
            document.getElementById("cart-body");

        const cartOverlay =
            document.getElementById("cart-overlay");

        const cartToggle =
            document.getElementById("cart-toggle");


        // ============================
        // CHECKOUT
        // ============================

        if (
            modal.style.display === "flex"
        ) {

            modal.style.display =
                "none";


            // Volvemos al carrito
            if (
                event.state &&
                event.state.cart
            ) {

                cartBody.style.display =
                    "block";

                cartOverlay.style.display =
                    "block";

                cartToggle.innerHTML =
                    'Ocultar carrito <i data-lucide="chevron-down" id="chevron-icon"></i>';

                document.body.style.overflow =
                    "hidden";

            } else {

                document.body.style.overflow =
                    "";
            }


            lucide.createIcons();

            return;
        }


        // ============================
        // CARRITO
        // ============================

        cartBody.style.display =
            "none";

        cartOverlay.style.display =
            "none";

        document.body.style.overflow =
            "";

        cartToggle.innerHTML =
            'Ver carrito <i data-lucide="chevron-up" id="chevron-icon"></i>';

        lucide.createIcons();
    }
);


// ====================================
// MÉTODO DE ENTREGA
// ====================================

function toggleDeliveryFields() {

    const method =
        document.getElementById(
            "delivery-method"
        ).value;


    const fields =
        document.getElementById(
            "delivery-fields"
        );


    const addressInput =
        document.getElementById(
            "customer-address"
        );


    if (method === "pickup") {

        fields.style.display =
            "none";

        addressInput.removeAttribute(
            "required"
        );

    } else {

        fields.style.display =
            "block";

        addressInput.setAttribute(
            "required",
            "required"
        );
    }
}


document
    .getElementById("delivery-method")
    .addEventListener(
        "change",
        toggleDeliveryFields
    );


// ====================================
// MÉTODO DE PAGO
// ====================================

function togglePaymentFields() {

    const paymentMethod = document.getElementById("payment-method");
    const method = paymentMethod.value;


    const cashFields =
        document.getElementById(
            "cash-fields"
        );


    const cashInput =
        document.getElementById(
            "cash-amount"
        );

    const transferDetails = document.getElementById("transfer-details");
    const transferAvailable = !document.getElementById(
        "transfer-payment-option"
    ).disabled;

    transferDetails.hidden =
        method !== "Transferencia" || !transferAvailable;


    if (method === "Efectivo") {

        cashFields.style.display =
            "block";

    } else {

        cashFields.style.display =
            "none";

        cashInput.removeAttribute(
            "required"
        );

        cashInput.value = "";
    }
}


window.toggleDeliveryFields =
    toggleDeliveryFields;

window.togglePaymentFields =
    togglePaymentFields;


document
    .getElementById("payment-method")
    .addEventListener(
        "change",
        togglePaymentFields
    );


// ====================================
// ENVIAR PEDIDO POR WHATSAPP
// ====================================

document
    .getElementById("form-checkout")
    .addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();
            checkoutValidationError.hidden = true;


            if (!currentBusiness) {

                alert(
                    "No se pudo cargar la información del negocio."
                );

                return;
            }

            try {

                const businessActual =
                    await getBusiness(slug);

                if (!businessActual.open) {

                    modal.style.display = "none";
                    document.body.style.overflow = "";

                    document.getElementById(
                        "closed-business-modal"
                    ).style.display = "flex";

                    return;
                }

            } catch (error) {

                console.error(
                    "Error comprobando estado del negocio:",
                    error
                );

                return;
            }

            try {

                const productosActuales =
                    await getProducts(slug);

                const productosPorId =
                    new Map(
                        productosActuales.map(
                            product => [
                                String(product.id),
                                product
                            ]
                        )
                    );

                const inconsistencias = [];

                Object.entries(getCart()).forEach(
                    ([productId, item]) => {

                        const productoActual =
                            productosPorId.get(productId);

                        if (!productoActual) {
                            inconsistencias.push(
                                `${item.name} ya no está disponible.`
                            );

                            return;
                        }

                        if (
                            Number(productoActual.price) !==
                            Number(item.price)
                        ) {
                            inconsistencias.push(
                                `${item.name} cambió de $${Number(item.price).toLocaleString("es-AR")} a $${Number(productoActual.price).toLocaleString("es-AR")}.`
                            );
                        }
                    }
                );

                if (inconsistencias.length > 0) {
                    showCheckoutValidationError(
                        `Revisá tu pedido:\n${inconsistencias.join("\n")}`
                    );

                    return;
                }

            } catch (error) {

                console.error(
                    "Error verificando productos del pedido:",
                    error
                );

                showCheckoutValidationError(
                    "No se pudo verificar tu pedido. Intentá nuevamente."
                );

                return;
            }


            const name =
                document.getElementById(
                    "customer-name"
                ).value;


            const method =
                document.getElementById(
                    "delivery-method"
                ).value;


            const address =
                document.getElementById(
                    "customer-address"
                ).value;


            const notes =
                document.getElementById(
                    "customer-notes"
                ).value;


            const payment =
                document.getElementById(
                    "payment-method"
                ).value;


            const items =
                Object.entries(getCart());


            const totalPrice =
                items.reduce(
                    (sum, [, item]) =>
                        sum +
                        item.price *
                        item.qty,
                    0
                );


            // ============================
            // PRODUCTOS
            // ============================

            const msgProductos =
                items
                    .map(
                        ([, item]) =>
                            `🛒 *${item.name}* x${item.qty} = $${(
                                item.price *
                                item.qty
                            ).toLocaleString("es-AR")}`
                    )
                    .join("\n");


            // ============================
            // FORMA DE PAGO
            // ============================

            let detallePago =
                payment;


            if (payment === "Efectivo") {

                const cashInput =
                    document.getElementById(
                        "cash-amount"
                    ).value.trim();


                // Si queda vacío, se considera simplemente efectivo
                if (cashInput === "") {

                    detallePago =
                        "Efectivo";

                } else {

                    const cashAmount =
                        parseInt(cashInput);

                    const vuelto =
                        cashAmount -
                        totalPrice;


                    if (vuelto < 0) {

                        const cashError =
                            document.getElementById(
                                "cash-error"
                            );

                        cashError.textContent =
                            `El monto ingresado ($${cashAmount.toLocaleString("es-AR")}) es menor al total del pedido ($${totalPrice.toLocaleString("es-AR")}).`;

                        cashError.style.display =
                            "block";

                        return;
                    }


                    detallePago =
                        `Efectivo (Paga con: $${cashAmount.toLocaleString("es-AR")} | Vuelto: $${vuelto.toLocaleString("es-AR")})`;
                }
            }

            const cashAmountValue =
                document.getElementById(
                    "cash-amount"
                ).value.trim();

            try {

                await confirmCheckout(
                    slug,
                    {
                        customerName: name,
                        deliveryMethod: method,
                        address,
                        deliveryNotes: notes,
                        paymentMethod: payment,
                        cashAmount: payment === "Efectivo" && cashAmountValue !== ""
                            ? Number(cashAmountValue)
                            : null,
                        items: items.map(
                            ([productId, item]) => ({
                                productId: Number(productId),
                                quantity: item.qty
                            })
                        )
                    }
                );

            } catch (error) {

                console.error(
                    "Error confirmando el pedido:",
                    error
                );

                if (error.status === 409) {

                    const conflictItems = error.details?.items || [];

                    if (error.details?.code === "INSUFFICIENT_STOCK") {
                        const details = conflictItems.map(item =>
                            `${item.name || "El producto"}: solicitaste ${item.requestedQuantity} y hay ${item.availableQuantity} disponible(s).`
                        );

                        showCheckoutValidationError(
                            `No hay stock suficiente.\n${details.join("\n")}`
                        );

                    } else if (error.details?.code === "PRODUCT_UNAVAILABLE") {

                        showCheckoutValidationError(
                            "Uno de los productos ya no está disponible. Revisá tu carrito."
                        );

                    } else {

                        showCheckoutValidationError(
                            "No se pudo confirmar el pedido. Intentá nuevamente."
                        );
                    }

                } else {

                    showCheckoutValidationError(
                        "No se pudo confirmar el pedido. Intentá nuevamente."
                    );
                }

                return;
            }


            // ============================
            // DATOS DEL CLIENTE
            // ============================

            let msgCliente =
                `*Datos de Entrega:*\n👤 *Nombre:* ${name}\n🛵 *Método:* ${
                    method === "delivery"
                        ? "Envío a domicilio"
                        : "Retiro por el local"
                }`;


            if (method === "delivery") {

                msgCliente +=
                    `\n📍 *Dirección:* ${address}`;


                if (notes) {

                    msgCliente +=
                        `\nℹ️ *Aclaraciones:* ${notes}`;
                }
            }


            msgCliente +=
                `\n💳 *Pago:* ${detallePago}`;


            // ============================
            // MENSAJE FINAL
            // ============================

            const mensajeTextoPlano =
                `🏪 *NUEVO PEDIDO - ${currentBusiness.name}*\n\n${msgCliente}\n\n🛒 *Detalle del Pedido:*\n${msgProductos}\n\n💰 *Total a pagar: $${totalPrice.toLocaleString("es-AR")}*`;


            const mensajeCodificado =
                encodeURIComponent(
                    mensajeTextoPlano
                );


            console.log(
                "MENSAJE ORIGINAL:",
                mensajeTextoPlano
            );

            console.log(
                "MENSAJE CODIFICADO:",
                mensajeCodificado
            );


            // ============================
            // WHATSAPP DEL NEGOCIO
            // ============================

            let telefonoNegocio =
                currentBusiness.whatsapp
                    .replace(/\D/g, "");


            if (telefonoNegocio.startsWith("549")) {

                // Ya está en formato internacional

            } else if (
                telefonoNegocio.startsWith("54")
            ) {

                telefonoNegocio =
                    "549" +
                    telefonoNegocio.substring(2);

            } else if (
                telefonoNegocio.startsWith("0")
            ) {

                telefonoNegocio =
                    telefonoNegocio.substring(1);
            }


            if (
                telefonoNegocio.startsWith("11") &&
                telefonoNegocio.length === 10
            ) {

                telefonoNegocio =
                    "549" +
                    telefonoNegocio;
            }


            if (!telefonoNegocio) {

                alert(
                    "Este negocio todavía no configuró su número de WhatsApp."
                );

                return;
            }


            window.open(
                `https://api.whatsapp.com/send/?phone=${telefonoNegocio}&text=${mensajeCodificado}`,
                "_blank"
            );


            modal.style.display =
                "none";

            document.body.style.overflow =
                "";
        }
    );


// ====================================
// TOGGLE CARRITO
// ====================================

document
    .getElementById("cart-toggle")
    .addEventListener(
        "click",
        () => {

            const body =
                document.getElementById("cart-body");

            const open =
                body.style.display !== "none" &&
                body.style.display !== "";


            if (!open) {

                body.style.display =
                    "block";

                document.body.style.overflow =
                    "hidden";

                document.getElementById("cart-overlay").style.display =
                    "block";

                document.getElementById("cart-toggle").innerHTML =
                    'Ocultar carrito <i data-lucide="chevron-down" id="chevron-icon"></i>';

                history.pushState(
                    { cart: true },
                    "",
                    "#cart"
                );

            } else {

                history.back();
            }


            lucide.createIcons();
        }
    );


// ====================================
// MENÚ HAMBURGUESA
// ====================================

const menuButton =
    document.querySelector(".nav-hamburger");

const sideMenu =
    document.getElementById("side-menu");

const menuOverlay =
    document.getElementById("menu-overlay");

const menuClose =
    document.getElementById("menu-close");


function openMenu() {
    sideMenu.classList.add("open");
    menuOverlay.classList.add("open");
}


function closeMenu() {
    sideMenu.classList.remove("open");
    menuOverlay.classList.remove("open");
}


menuButton.addEventListener(
    "click",
    () => {

        if (sideMenu.classList.contains("open")) {
            closeMenu();
        } else {
            openMenu();
        }

    }
);


menuClose.addEventListener(
    "click",
    closeMenu
);


menuOverlay.addEventListener(
    "click",
    closeMenu
);


const menuHome =
    document.getElementById("menu-home");


menuHome.addEventListener(
    "click",
    (e) => {

        e.preventDefault();

        closeMenu();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }
);


const menuCart =
    document.getElementById("menu-cart");

const cartOverlay =
    document.getElementById("cart-overlay");


menuCart.addEventListener(
    "click",
    (e) => {

        e.preventDefault();

        closeMenu();


        const cartPanel =
            document.getElementById("cart-panel");

        const cartBody =
            document.getElementById("cart-body");

        const cartToggle =
            document.getElementById("cart-toggle");


        if (
            cartBody.style.display === "none" ||
            cartBody.style.display === ""
        ) {

            cartBody.style.display =
                "block";

            cartOverlay.style.display =
                "block";

            document.body.style.overflow =
                "hidden";

            cartToggle.innerHTML =
                'Ocultar carrito <i data-lucide="chevron-down" id="chevron-icon"></i>';

            history.pushState(
                { cart: true },
                "",
                "#cart"
            );
        }


        lucide.createIcons();


        cartPanel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }
);


const menuContact =
    document.getElementById("menu-contact");


menuContact.addEventListener(
    "click",
    (e) => {

        e.preventDefault();

        closeMenu();


        if (!currentBusiness) {
            return;
        }


        let telefonoNegocio =
            currentBusiness.whatsapp
                .replace(/\D/g, "");


        if (telefonoNegocio.startsWith("549")) {

            // Ya está en formato internacional

        } else if (
            telefonoNegocio.startsWith("54")
        ) {

            telefonoNegocio =
                "549" +
                telefonoNegocio.substring(2);

        } else if (
            telefonoNegocio.startsWith("0")
        ) {

            telefonoNegocio =
                telefonoNegocio.substring(1);
        }


        if (
            telefonoNegocio.startsWith("11") &&
            telefonoNegocio.length === 10
        ) {

            telefonoNegocio =
                "549" +
                telefonoNegocio;
        }


        if (!telefonoNegocio) {
            return;
        }


        window.open(
            `https://api.whatsapp.com/send/?phone=${telefonoNegocio}`,
            "_blank"
        );

    }
);

document
    .getElementById("btn-copy-transfer-alias")
    .addEventListener("click", copyTransferAlias);


setupAdminPreview();

loadData().catch(error => { 
    showPublicStoreUnavailable(); 
});
