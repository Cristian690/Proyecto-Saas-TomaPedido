import {
    getBusiness,
    getCategories as fetchCategories,
    getProducts
} from "./js/api/api.js?v=1.0";

import { getOptimizedCloudinaryUrl } from "./js/images/cloudinary.js?v=1.0";

import {
    setCategories,
    getCategories,
    renderTabs,
    initTabs
} from "./js/categories/categories.js?v=1.0";

import {
    setProducts,
    renderProducts,
    products
} from "./js/products/products.js?v=1.2";

import {
    addToCart,
    changeQty,
    removeItem,
    renderCart,
    getCart
} from "./js/cart/cart.js?v=1.3";


lucide.createIcons();

const params = new URLSearchParams(window.location.search);
const slug = params.get("business");
const openedFromAdmin = params.get("admin") === "true";

let businessOpen = true;
let currentBusiness = null;


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

        heroBusinessLogoElement.src =
            getOptimizedCloudinaryUrl(
                business.logoUrl,
                "f_auto,q_auto,w_300,c_fit"
            );

        heroBusinessLogoElement.style.display =
            "block";

    } else {

        heroBusinessLogoElement.style.display =
            "none";
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
            imagen: product.imageUrl,
            categoria: String(product.categoryId)
        }))
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
            addToCart
        );
    });


    // ================================
    // PRODUCTOS
    // ================================

    renderProducts(
        getCategories(),
        id => addToCart(id, products)
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

    const method =
        document.getElementById(
            "payment-method"
        ).value;


    const cashFields =
        document.getElementById(
            "cash-fields"
        );


    const cashInput =
        document.getElementById(
            "cash-amount"
        );


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


setupAdminPreview(); 

loadData().catch(error => { 
    showPublicStoreUnavailable(); 
});
