import { createProductImage } from "../products/products.js?v=1.2";

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
        const emptyCart = document.createElement("p");
        emptyCart.className = "cart-empty";
        emptyCart.textContent = "Tu carrito está vacío 🛒";
        cartItemsEl.replaceChildren(emptyCart);
    } else {
        const fragment = document.createDocumentFragment();

        items.forEach(([id, item]) => {
            const cartItem = document.createElement("div");
            cartItem.className = "cart-item";

            const image = createProductImage(
                item.img,
                item.name || "",
                "cart-item-img",
                "f_auto,q_auto,w_88,h_88,c_fill"
            );

            const info = document.createElement("div");
            info.className = "cart-item-info";

            const name = document.createElement("span");
            name.className = "cart-item-name";
            name.textContent = item.name;

            const price = document.createElement("span");
            price.className = "cart-item-price";
            price.textContent = `$${item.price.toLocaleString("es-AR")}`;
            info.append(name, price);

            const controls = document.createElement("div");
            controls.className = "cart-item-controls";

            const decreaseButton = document.createElement("button");
            decreaseButton.type = "button";
            decreaseButton.textContent = "−";
            decreaseButton.addEventListener("click", () => changeQty(id, -1));

            const quantity = document.createElement("span");
            quantity.textContent = item.qty;

            const increaseButton = document.createElement("button");
            increaseButton.type = "button";
            increaseButton.textContent = "+";
            increaseButton.addEventListener("click", () => changeQty(id, 1));

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "cart-item-delete";
            deleteButton.addEventListener("click", () => removeItem(id));

            const deleteIcon = document.createElement("i");
            deleteIcon.setAttribute("data-lucide", "trash-2");
            deleteButton.appendChild(deleteIcon);

            controls.append(
                decreaseButton,
                quantity,
                increaseButton,
                deleteButton
            );
            cartItem.append(image, info, controls);
            fragment.appendChild(cartItem);
        });

        cartItemsEl.replaceChildren(fragment);
    }

    totalEl.textContent =
        "$" + totalPrice.toLocaleString("es-AR");

    lucide.createIcons();
    window.dispatchEvent(new Event("cartchange"));
}

export function getCart() {
    return cart;
}
