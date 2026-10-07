import { getOrders } from "../api/api.js?v=1.1";

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "../login/login.html";
}

const ordersContainer = document.getElementById("orders-container");
const statusMessage = document.getElementById("orders-status-message");

function clearSessionAndRedirectToLogin() {
    localStorage.removeItem("token");
    localStorage.removeItem("businessSlug");
    localStorage.removeItem("businessName");
    localStorage.removeItem("role");
    window.location.href = "../login/login.html";
}

function formatCurrency(value) {
    return `$${Number(value).toLocaleString("es-AR")}`;
}

function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Fecha no disponible";
    }

    return date.toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function getDeliveryLabel(deliveryMethod) {
    return deliveryMethod === "delivery"
        ? "Envío a domicilio"
        : "Retirar por el local";
}

function getStatusLabel(status) {
    return status === "PENDING" ? "Pendiente" : status;
}

function createDetail(label, value) {
    const detail = document.createElement("p");
    detail.className = "order-detail";

    const detailLabel = document.createElement("strong");
    detailLabel.textContent = `${label}: `;

    detail.append(detailLabel, document.createTextNode(value));

    return detail;
}

function createOrderCard(order) {
    const card = document.createElement("article");
    card.className = "order-card";

    const header = document.createElement("div");
    header.className = "order-card-header";

    const title = document.createElement("h3");
    title.textContent = `Pedido #${order.id}`;

    const date = document.createElement("time");
    date.textContent = formatDate(order.createdAt);

    header.append(title, date);

    const customer = document.createElement("p");
    customer.className = "order-customer";
    customer.textContent = order.customerName;

    const itemsList = document.createElement("ul");
    itemsList.className = "order-items";

    const orderItems = Array.isArray(order.items) ? order.items : [];

    if (orderItems.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.textContent = "Sin productos registrados.";
        itemsList.appendChild(emptyItem);
    } else {
        orderItems.forEach(item => {
            const orderItem = document.createElement("li");
            orderItem.textContent =
                `${item.quantity} × ${item.productName} — ${formatCurrency(item.unitPrice)} c/u · Subtotal: ${formatCurrency(item.subtotal)}`;
            itemsList.appendChild(orderItem);
        });
    }

    const total = document.createElement("p");
    total.className = "order-total";
    total.textContent = `Total: ${formatCurrency(order.total)}`;

    const details = document.createElement("div");
    details.className = "order-details";
    details.appendChild(createDetail("Entrega", getDeliveryLabel(order.deliveryMethod)));

    if (order.deliveryMethod === "delivery" && order.address) {
        details.appendChild(createDetail("Dirección", order.address));
    }

    if (order.deliveryNotes?.trim()) {
        details.appendChild(createDetail("Notas", order.deliveryNotes));
    }

    details.appendChild(createDetail("Pago", order.paymentMethod));

    if (order.cashAmount !== null && order.cashAmount !== undefined) {
        details.appendChild(createDetail("Paga con", formatCurrency(order.cashAmount)));
    }

    const status = document.createElement("p");
    status.className = "order-status";
    status.textContent = `Estado: ${getStatusLabel(order.status)}`;

    card.append(header, customer, itemsList, total, details, status);

    return card;
}

function renderOrders(orders) {
    if (orders.length === 0) {
        const emptyState = document.createElement("section");
        emptyState.className = "orders-empty-state";
        emptyState.textContent = "No tenés pedidos todavía.";
        ordersContainer.replaceChildren(emptyState);
        return;
    }

    const fragment = document.createDocumentFragment();
    orders.forEach(order => fragment.appendChild(createOrderCard(order)));
    ordersContainer.replaceChildren(fragment);
}

async function loadOrders() {
    try {
        const orders = await getOrders();
        renderOrders(orders);
    } catch (error) {
        if (error.status === 401) {
            clearSessionAndRedirectToLogin();
            return;
        }

        if (error.status === 403) {
            window.location.href = "admin.html";
            return;
        }

        statusMessage.textContent = "No se pudieron cargar los pedidos. Intentá nuevamente.";
        statusMessage.hidden = false;
    }
}

document.getElementById("btn-logout").addEventListener("click", () => {
    clearSessionAndRedirectToLogin();
});

void loadOrders();
