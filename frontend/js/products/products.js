export let products = [];

export function setProducts(data) {
    products = data;
}

export function renderProducts(categories, onAddToCart) {
    const container = document.getElementById("productos-container");

    container.innerHTML = categories.map(category => {

        const productsByCategory = products.filter(
            product => product.categoria === category.id
        );

        return `
            <div class="menu-category">
                <h2 class="category-title">${category.nombre}</h2>

                ${productsByCategory.map(product => `
                    <div class="product-card">
                        <div class="product-main-row">
                            <img
                                src="${product.imagen}"
                                alt="${product.nombre}"
                                class="product-img"
                            />

                            <div class="product-info">
                                <h3>${product.nombre}</h3>
                                <p>${product.descripcion}</p>
                                <span class="product-price">
                                    $${product.precio.toLocaleString("es-AR")}
                                </span>

                                <button class="btn-agregar" data-id="${product.id}">
                                    Agregar
                                </button>
                            </div>
                        </div>
                    </div>
                `).join("")}
            </div>
        `;
    }).join("");

    document.querySelectorAll(".btn-agregar").forEach(btn => {
        btn.addEventListener("click", () => {
            onAddToCart(btn.dataset.id, products);
        });
    });
}