export const API_URL = "https://ordenflash-api.onrender.com";

export async function getBusiness(slug) {
    const response = await fetch(`${API_URL}/business/${slug}`);

    if (!response.ok) {
        throw new Error("No se pudo obtener la configuración del comercio");
    }

    return await response.json();
}

export async function getCategories(slug) {
    const response = await fetch(`${API_URL}/public/${slug}/categories`);

    if (!response.ok) {
        throw new Error("No se pudieron obtener las categorías");
    }

    return await response.json();
}

export async function getProducts(slug) {
    const response = await fetch(`${API_URL}/public/${slug}/products`);

    if (!response.ok) {
        throw new Error("No se pudieron obtener los productos");
    }

    return await response.json();
}

export async function confirmCheckout(slug, checkoutData) {
    const response = await fetch(
        `${API_URL}/public/${slug}/checkout/confirm`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(checkoutData)
        }
    );

    if (!response.ok) {
        let details = null;

        try {
            details = await response.json();
        } catch {
            // La respuesta de error no contiene JSON utilizable.
        }

        const error = new Error("No se pudo confirmar el pedido");
        error.status = response.status;
        error.details = details;

        throw error;
    }

    return await response.json();
}

export async function getOrders() {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/orders`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const error = new Error("No se pudieron obtener los pedidos");
        error.status = response.status;

        throw error;
    }

    return await response.json();
}
