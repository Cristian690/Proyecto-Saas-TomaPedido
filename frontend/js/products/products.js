export let products = [];

export function setProducts(data) {
    products = data;
}

function setSafeImageSource(image, imageUrl) {
    if (!imageUrl) {
        return;
    }

    try {
        const url = new URL(imageUrl, window.location.origin);

        if (url.protocol === "http:" || url.protocol === "https:") {
            image.src = url.href;
        }
    } catch {
        // Una URL inválida no debe convertirse en contenido ejecutable.
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

            const image = document.createElement("img");
            image.className = "product-img";
            image.alt = product.nombre || "";
            setSafeImageSource(image, product.imagen);

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
