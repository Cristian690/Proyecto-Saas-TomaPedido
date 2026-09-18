let cart = {};

export function addToCart(id, products) {
    const product = products.find(p => p.id == id);

    if (!product) return;

    if (cart[id]) {
        cart[id].qty++;
    } else {
        cart[id] = {
            name: product.nombre,
            price: product.precio,
            img: product.imagen,
            qty: 1
        };
    }

    renderCart();
}

export function changeQty(id, delta) {
    if (!cart[id]) return;

    cart[id].qty += delta;

    if (cart[id].qty <= 0) {
        delete cart[id];
    }

    renderCart();
}

export function removeItem(id) {
    delete cart[id];
    renderCart();
}

export function renderCart() {
    const items = Object.entries(cart);

    const badge = document.getElementById("cart-badge");
    const cartItemsEl = document.getElementById("cart-items");
    const totalEl = document.getElementById("cart-total");

    const totalQty = items.reduce(
        (sum, [, item]) => sum + item.qty,
        0
    );

    const totalPrice = items.reduce(
        (sum, [, item]) => sum + item.price * item.qty,
        0
    );

    badge.textContent = totalQty;
    badge.style.display = totalQty > 0 ? "inline-flex" : "none";

    if (items.length === 0) {
        cartItemsEl.innerHTML =
            '<p class="cart-empty">Tu carrito está vacío 🛒</p>';
    } else {
        cartItemsEl.innerHTML = items.map(([id, item]) => `
            <div class="cart-item">
                <img
                    src="${item.img}"
                    alt="${item.name}"
                    class="cart-item-img"
                />

                <div class="cart-item-info">
                    <span class="cart-item-name">${item.name}</span>

                    <span class="cart-item-price">
                        $${item.price.toLocaleString("es-AR")}
                    </span>
                </div>

                <div class="cart-item-controls">
                    <button onclick="changeQty('${id}', -1)">−</button>

                    <span>${item.qty}</span>

                    <button onclick="changeQty('${id}', 1)">+</button>

                    <button
                        class="cart-item-delete"
                        onclick="removeItem('${id}')"
                    >
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `).join("");
    }

    totalEl.textContent =
        "$" + totalPrice.toLocaleString("es-AR");

    lucide.createIcons();
}

export function getCart() {
    return cart;
}