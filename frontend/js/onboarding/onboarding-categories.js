import { API_URL } from "../api/api.js";
import { getBusinessType } from "../admin/business-types.js?v=1.1";

const token = localStorage.getItem("token");
const businessSlug = localStorage.getItem("businessSlug");
const optionsContainer = document.getElementById("onboarding-category-options");
const customCategoryInput = document.getElementById("onboarding-custom-category-name");
const addCategoryButton = document.getElementById("btn-add-onboarding-category");
const finishButton = document.getElementById("btn-finish-categories");
const errorMessage = document.getElementById("onboarding-error");
const description = document.getElementById("onboarding-categories-description");

const selectedCategories = new Map();
const existingCategoryNames = new Set();

function getAuthenticatedHeaders() {
    if (!token) {
        throw new Error(
            "Tu sesión venció. Volvé a iniciar sesión para guardar las categorías."
        );
    }

    return { "Authorization": `Bearer ${token}` };
}

async function getPersistedCategories() {
    const response = await fetch(`${API_URL}/categories`, {
        headers: getAuthenticatedHeaders()
    });

    if (response.status === 401 || response.status === 403) {
        throw new Error(
            "No tenés permiso para consultar las categorías de este comercio."
        );
    }

    if (!response.ok) {
        throw new Error("No se pudieron cargar las categorías.");
    }

    return response.json();
}

function categoryKey(name) {
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("es-AR");
}

function addCategoryOption(name, icon, selected = true, existing = false) {
    const key = categoryKey(name);

    if (selectedCategories.has(key)) {
        return;
    }

    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    const content = document.createElement("span");
    const iconElement = document.createElement("span");
    const nameElement = document.createElement("span");

    label.className = "onboarding-category-option";
    content.className = "onboarding-category-content";
    checkbox.type = "checkbox";
    checkbox.checked = selected;
    checkbox.disabled = existing;
    checkbox.setAttribute("aria-label", name);
    iconElement.setAttribute("aria-hidden", "true");
    iconElement.className = "onboarding-category-icon";
    iconElement.textContent = icon;
    nameElement.className = "onboarding-category-name";
    nameElement.textContent = name;
    content.append(iconElement, nameElement);

    if (existing) {
        const status = document.createElement("small");
        status.textContent = "Ya creada";
        content.appendChild(status);
    }

    label.append(checkbox, content);
    optionsContainer.appendChild(label);
    selectedCategories.set(key, { name, checkbox, existing });
}

function addCustomCategory() {
    const name = customCategoryInput.value.trim();

    if (!name) {
        return;
    }

    if (selectedCategories.has(categoryKey(name))) {
        errorMessage.textContent = "Esa categoría ya está en la lista.";
        return;
    }

    errorMessage.textContent = "";
    addCategoryOption(name, "🏷️");
    customCategoryInput.value = "";
}

async function loadCategories() {
    const businessResponse = await fetch(`${API_URL}/business/${businessSlug}`);

    if (!businessResponse.ok) {
        throw new Error("No se pudo cargar la configuración del comercio.");
    }

    const business = await businessResponse.json();
    const businessType = getBusinessType(business.businessType);

    const existingCategories = await getPersistedCategories();

    existingCategories.forEach(category => {
        existingCategoryNames.add(categoryKey(category.name));
    });

    if (!businessType) {
        description.textContent =
            "Elegí un rubro desde Mi negocio para recibir categorías sugeridas. También podés agregar una categoría personalizada.";
    } else {
        businessType.categories.forEach(([name, icon, label = name]) => {
            addCategoryOption(
                name,
                icon,
                true,
                existingCategoryNames.has(categoryKey(name))
            );
        });
    }

    existingCategories.forEach(category => {
        addCategoryOption(category.name, "🏷️", true, true);
    });
}

async function saveCategories() {
    const categoriesToCreate = Array.from(selectedCategories.values())
        .filter(category => category.checkbox.checked && !category.existing);

    for (const category of categoriesToCreate) {
        const response = await fetch(`${API_URL}/categories`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthenticatedHeaders()
            },
            body: JSON.stringify({
                name: category.name,
                description: "Categoría sugerida",
                imageUrl: ""
            })
        });

        if (response.status === 401 || response.status === 403) {
            throw new Error(
                "No tenés permiso para guardar categorías en este comercio."
            );
        }

        if (!response.ok) {
            throw new Error(
                `No se pudo guardar la categoría “${category.name}”. Intentá nuevamente.`
            );
        }
    }

    const persistedCategories = await getPersistedCategories();
    const persistedCategoryNames = new Set(
        persistedCategories.map(category => categoryKey(category.name))
    );
    const missingCategories = categoriesToCreate.filter(
        category => !persistedCategoryNames.has(categoryKey(category.name))
    );

    if (missingCategories.length > 0) {
        throw new Error(
            "No se pudieron confirmar todas las categorías guardadas. Intentá nuevamente."
        );
    }
}

addCategoryButton.addEventListener("click", addCustomCategory);

customCategoryInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        addCustomCategory();
    }
});

document.getElementById("btn-back").addEventListener("click", () => {
    window.location.href = "onboarding.html";
});

finishButton.addEventListener("click", async () => {
    finishButton.disabled = true;
    finishButton.textContent = "Guardando...";
    errorMessage.textContent = "";

    try {
        await saveCategories();
        window.location.href = "onboarding-color.html";
    } catch (error) {
        console.error("Error guardando categorías:", error);
        errorMessage.textContent = error.message;
    } finally {
        finishButton.disabled = false;
        finishButton.textContent = "Continuar";
    }
});

loadCategories().catch(error => {
    console.error("Error cargando categorías:", error);
    errorMessage.textContent = error.message;
});
