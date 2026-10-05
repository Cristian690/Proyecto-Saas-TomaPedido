import { getOptimizedCloudinaryUrl } from "../images/cloudinary.js?v=1.0";

export let products = [];

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

export function renderProducts(categories, onAddToCart) {
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

            const addButton = document.createElement("button");
            addButton.className = "btn-agregar";
            addButton.type = "button";
            addButton.textContent = "Agregar";
            addButton.addEventListener("click", () => {
                onAddToCart(String(product.id), products);
            });

            info.append(name, description, price, addButton);
            mainRow.append(image, info);
            card.appendChild(mainRow);
            menuCategory.appendChild(card);
        });

        fragment.appendChild(menuCategory);
    });

    container.replaceChildren(fragment);
}
