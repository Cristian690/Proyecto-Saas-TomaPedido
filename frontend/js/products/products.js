import { getOptimizedCloudinaryUrl } from "../images/cloudinary.js?v=1.0";

export let products = [];

let currentCategories = [];
let currentOnAddToCart = null;
let currentOnChangeQuantity = null;
let currentGetQuantity = null;
let currentStockEnabled = false;
let cartChangeListenerInitialized = false;

export function setProducts(data) {
    products = data;
}

function createImagePlaceholder(className, alt) {
    const placeholder = document.createElement("div");

    placeholder.className = `${className} product-image-placeholder`;
    placeholder.setAttribute("role", "img");
    placeholder.setAttribute(
        "aria-label",
        alt ? `Imagen no disponible de ${alt}` : "Imagen no disponible"
    );

    return placeholder;
}

function getImageSource(imageUrl, cloudinaryTransformation) {
    const url = new URL(imageUrl, window.location.origin);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
        return null;
    }

    return getOptimizedCloudinaryUrl(
        url.href,
        cloudinaryTransformation
    );
}

export function createProductImage(
    imageUrl,
    alt,
    className,
    cloudinaryTransformation
) {
    if (!imageUrl) {
        return createImagePlaceholder(className, alt);
    }

    try {
        const source = getImageSource(
            imageUrl,
            cloudinaryTransformation
        );

        if (!source) {
            return createImagePlaceholder(className, alt);
        }

        const image = document.createElement("img");
        image.className = className;
        image.alt = alt;
        image.addEventListener("error", () => {
            image.replaceWith(createImagePlaceholder(className, alt));
        }, { once: true });
        image.src = source;

        return image;
    } catch {
        // Una URL inválida no debe convertirse en contenido ejecutable.
        return createImagePlaceholder(className, alt);
    }
}

export function renderProducts(
    categories,
    onAddToCart,
    onChangeQuantity = null,
    getQuantity = null,
    stockEnabled = false
) {
    currentCategories = categories;
    currentOnAddToCart = onAddToCart;
    currentOnChangeQuantity = onChangeQuantity;
    currentGetQuantity = getQuantity;
    currentStockEnabled = stockEnabled;

    if (!cartChangeListenerInitialized) {
        window.addEventListener("cartchange", () => {
            if (currentOnAddToCart) {
                renderProducts(
                    currentCategories,
                    currentOnAddToCart,
                    currentOnChangeQuantity,
                    currentGetQuantity,
                    currentStockEnabled
                );
            }
        });

        cartChangeListenerInitialized = true;
    }

    const container = document.getElementById("productos-container");
    const fragment = document.createDocumentFragment();

    categories.forEach(category => {
        const productsByCategory = products.filter(
            product => product.categoria === category.id
        );

        const menuCategory = document.createElement("div");
        menuCategory.className = "menu-category";

        const title = document.createElement("h2");
        title.className = "category-title";
        title.textContent = category.nombre;
        menuCategory.appendChild(title);

        productsByCategory.forEach(product => {
            const card = document.createElement("div");
            card.className = "product-card";

            const mainRow = document.createElement("div");
            mainRow.className = "product-main-row";

            const image = createProductImage(
                product.imagen,
                product.nombre || "",
                "product-img",
                "f_auto,q_auto,w_160,h_160,c_fill"
            );

            const info = document.createElement("div");
            info.className = "product-info";

            const name = document.createElement("h3");
            name.textContent = product.nombre;

            const description = document.createElement("p");
            description.textContent = product.descripcion || "";

            const price = document.createElement("span");
            price.className = "product-price";
            price.textContent = `$${product.precio.toLocaleString("es-AR")}`;

            const actions = document.createElement("div");
            actions.className = "btn-container-dinamico";

            const renderQuantityControls = () => {
                const productId = String(product.id);
                const quantity = currentGetQuantity?.(productId) || 0;
                const stock = Number(product.stock);
                const isOutOfStock = currentStockEnabled && stock <= 0;

                if (isOutOfStock) {
                    const outOfStock = document.createElement("span");
                    outOfStock.className = "product-out-of-stock";
                    outOfStock.textContent = "Agotado";
                    actions.replaceChildren(outOfStock);
                    return;
                }

                if (quantity === 0) {
                    const addButton = document.createElement("button");
                    addButton.className = "btn-agregar";
                    addButton.type = "button";
                    addButton.textContent = "Agregar";
                    addButton.addEventListener("click", () => {
                        onAddToCart(productId, products);
                    });

                    actions.replaceChildren(addButton);
                    return;
                }

                const controls = document.createElement("div");
                controls.className = "card-control-qty";

                const decreaseButton = document.createElement("button");
                decreaseButton.type = "button";
                decreaseButton.textContent = "−";
                decreaseButton.setAttribute("aria-label", `Quitar una unidad de ${product.nombre}`);
                decreaseButton.addEventListener("click", () => {
                    currentOnChangeQuantity?.(productId, -1);
                });

                const quantityValue = document.createElement("span");
                quantityValue.className = "card-qty-num";
                quantityValue.textContent = quantity;

                const increaseButton = document.createElement("button");
                increaseButton.type = "button";
                increaseButton.textContent = "+";
                increaseButton.setAttribute("aria-label", `Agregar una unidad de ${product.nombre}`);
                increaseButton.disabled = currentStockEnabled && quantity >= stock;
                increaseButton.addEventListener("click", () => {
                    currentOnChangeQuantity?.(productId, 1);
                });

                controls.append(decreaseButton, quantityValue, increaseButton);
                actions.replaceChildren(controls);
            };

            renderQuantityControls();

            info.append(name, description, price, actions);
            mainRow.append(image, info);
            card.appendChild(mainRow);
            menuCategory.appendChild(card);
        });

        fragment.appendChild(menuCategory);
    });

    container.replaceChildren(fragment);
}
