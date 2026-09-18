const API_URL = "http://192.168.100.32:8080";

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