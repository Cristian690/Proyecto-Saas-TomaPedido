import { API_URL } from "../api/api.js";

import { defaultImages } from "../default-images/default-images.js";
import { getOptimizedCloudinaryUrl } from "../images/cloudinary.js";
import { prepareProductImage } from "../images/prepare-product-image.js";
import { createProductImportPreview } from "../imports/product-csv-preview.js";
import { getCategoryIcon } from "./business-types.js?v=1.1";

const token = localStorage.getItem("token");

console.log("🔥 PRODUCTS.JS CARGADO", new Date().toISOString());


if (!token) {
    window.location.href = "../login/login.html";
}

if (localStorage.getItem("mustChangePassword") === "true") {
    window.location.href = "force-change-password.html";
}

function handleUnauthorized(response) {
    if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("businessSlug");
        localStorage.removeItem("businessName");
        localStorage.removeItem("role");

        window.location.href = "../login/login.html";

        return true;
    }

    if (response.status === 403) {
        window.location.href = "admin.html";

        return true;
    }

    return false;
}


// El preset unsigned externo se conserva, pero las cargas nuevas usan firmas
// emitidas por el backend y ya no lo envían a Cloudinary.
const CLOUDINARY_UPLOAD_PRESET =
    "tomapedido_uploads";

const productsScreen =
    document.getElementById("products-screen");

const productImportScreen =
    document.getElementById("product-import-screen");

const openProductImportButton =
    document.getElementById("btn-import-products");

const productImportCsvInput =
    document.getElementById("product-import-csv");

const productImportImagesInput =
    document.getElementById("product-import-images");

const productImportPreviewButton =
    document.getElementById("btn-product-import-preview");

const productImportConfirmButton =
    document.getElementById("btn-product-import-confirm");

const productImportBackButton =
    document.getElementById("btn-product-import-back");

const productImportMessage =
    document.getElementById("product-import-message");

const productImportSummary =
    document.getElementById("product-import-summary");

const productImportPreview =
    document.getElementById("product-import-preview");

let productImportPreviewUrls = [];
let currentProductImportPreview = null;
let productImportInProgress = false;
let productImportHasFinished = false;
const productImportRowElements = new Map();

const productsContainer =
    document.getElementById("products-container");

const categoryFiltersContainer =
    document.getElementById("products-category-filters");

let selectedCategoryId = "all";
const productStatusTimers = new WeakMap();

const productImageLightbox =
    document.getElementById("product-image-lightbox");

const productImageLightboxContent =
    document.getElementById("product-image-lightbox-content");

const closeProductImageLightboxButton =
    document.getElementById("btn-close-product-image-lightbox");

let productImageLightboxTrigger = null;
let productImageLightboxPreviousBodyOverflow = "";

const productFormScreen =
    document.getElementById("product-form-screen");

const stepProgress =
    document.getElementById("product-step-progress");


const productStep1 =
    document.getElementById("product-step-1");

const productStep2 =
    document.getElementById("product-step-2");

const productStep3 =
    document.getElementById("product-step-3");

const productStep4 =
    document.getElementById("product-step-4");

const productConfirmation =
    document.getElementById("product-confirmation");

const productSuccess =
    document.getElementById("product-success");


const addProductButton =
    document.getElementById("btn-add-product");

const productNameInput =
    document.getElementById("product-name");

const productDescriptionInput =
    document.getElementById("product-description");

const productPriceInput =
    document.getElementById("product-price");

const productStockInput =
    document.getElementById("product-stock");

const productPhotoCameraInput =
    document.getElementById("product-photo-camera");

const productPhotoGalleryInput =
    document.getElementById("product-photo-gallery");

const productPhotoPreview =
    document.getElementById("product-photo-preview");

const productPhotoImage =
    document.getElementById("product-photo-image");


const nameNextButton =
    document.getElementById("btn-product-name-next");

const priceBackButton =
    document.getElementById("btn-product-price-back");

const priceNextButton =
    document.getElementById("btn-product-price-next");

const photoBackButton =
    document.getElementById("btn-product-photo-back");

const photoNextButton =
    document.getElementById("btn-product-photo-next");

const photoSkipButton =
    document.getElementById("btn-product-photo-skip");

const defaultImageButton =
    document.getElementById("btn-default-image");


const categoryBackButton =
    document.getElementById("btn-product-category-back");

const categoryNextButton =
    document.getElementById("btn-product-category-next");


let categoryOptions = [];

const customCategory =
    document.getElementById("custom-category");

const customCategoryName =
    document.getElementById("custom-category-name");


const confirmationImageContainer =
    document.getElementById("confirmation-image-container");

const confirmationImage =
    document.getElementById("confirmation-image");

const confirmationName =
    document.getElementById("confirmation-name");

const confirmationDescription =
    document.getElementById("confirmation-description");

const confirmationPrice =
    document.getElementById("confirmation-price");

const confirmationCategory =
    document.getElementById("confirmation-category");

const productError =
    document.getElementById("product-error");

const productStatusMessage =
    document.getElementById("product-status-message");

function showProductMessage(productId, message) {

    const card =
        document.querySelector(
            `.product-card[data-product-id="${productId}"]`
        );

    if (!card) {
        return;
    }

    const statusMessage =
        card.querySelector(".product-status-message");

    if (!statusMessage) {
        return;
    }

    statusMessage.textContent = message;
}


const confirmationBackButton =
    document.getElementById("btn-product-confirm-back");

const saveProductButton =
    document.getElementById("btn-product-save");


const addAnotherProductButton =
    document.getElementById("btn-add-another-product");

const viewProductsButton =
    document.getElementById("btn-view-products");

const cancelProductButton =
    document.getElementById("btn-product-cancel");


const newProduct = {
    name: "",
    description: "",
    price: null,
    stock: 0,
    imageFile: null,
    defaultImageUrl: "",
    categoryName: ""
};

let editingProduct = null;
let existingCategoryNames = [];
let productPhotoPreparationVersion = 0;
let productPhotoPreviewObjectUrl = "";

function revokeProductPhotoPreviewObjectUrl() {
    if (!productPhotoPreviewObjectUrl) {
        return;
    }

    URL.revokeObjectURL(productPhotoPreviewObjectUrl);
    productPhotoPreviewObjectUrl = "";
}

function selectCategory(button) {

    categoryOptions.forEach(option => {
        option.classList.remove("selected");
    });

    button.classList.add("selected");

    const category = button.dataset.category;
    const previousCategory = newProduct.categoryName;

    if (category === "__CUSTOM__") {
        customCategory.style.display = "block";
        customCategoryName.focus();
        newProduct.categoryName = "";
    } else {
        customCategory.style.display = "none";
        newProduct.categoryName = category;
    }

    if (previousCategory !== newProduct.categoryName) {
        newProduct.defaultImageUrl = "";
        updateDefaultImageOption();
    }
}

function renderCategoryOptions() {

    const categoryOptionsContainer =
        document.getElementById("category-options");

    categoryOptionsContainer.replaceChildren();

    existingCategoryNames.forEach(name => {
        const button = document.createElement("button");
        const iconElement = document.createElement("span");
        const nameElement = document.createElement("span");

        button.type = "button";
        button.className = "category-option";
        button.dataset.category = name;
        iconElement.className = "category-option-icon";
        iconElement.setAttribute("aria-hidden", "true");
        iconElement.textContent = getCategoryIcon(name);
        nameElement.textContent = name;
        button.append(iconElement, nameElement);
        button.addEventListener("click", () => selectCategory(button));
        categoryOptionsContainer.appendChild(button);
    });

    const customButton = document.createElement("button");
    const customIcon = document.createElement("span");
    const customLabel = document.createElement("span");

    customButton.type = "button";
    customButton.className = "category-option";
    customButton.dataset.category = "__CUSTOM__";
    customIcon.className = "category-option-icon";
    customIcon.setAttribute("aria-hidden", "true");
    customIcon.textContent = "➕";
    customLabel.textContent = "Otra categoría";
    customButton.append(customIcon, customLabel);
    customButton.addEventListener("click", () => selectCategory(customButton));
    categoryOptionsContainer.appendChild(customButton);

    categoryOptions = Array.from(
        categoryOptionsContainer.querySelectorAll(".category-option")
    );
}

function setCancelButtonVisible(isVisible) {

    cancelProductButton.hidden = !isVisible;
}

function clearProductImportPreview() {
    productImportPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    productImportPreviewUrls = [];
    productImportRowElements.clear();
    productImportPreview.replaceChildren();
    productImportPreview.hidden = true;
    productImportSummary.textContent = "";
    productImportSummary.hidden = true;
    productImportMessage.textContent = "";
    productImportMessage.hidden = true;
    productImportConfirmButton.hidden = true;
    productImportConfirmButton.disabled = true;
    productImportConfirmButton.textContent = "Importar productos";
}

function showProductImportMessage(message) {
    productImportMessage.textContent = message;
    productImportMessage.hidden = !message;
}

function appendImportCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.appendChild(cell);
}

function getProductImportRowStatus(importRow) {
    if (importRow.errors.length > 0) {
        return {
            className: "product-import-status-error",
            text: `Fila ${importRow.line}: ${importRow.errors.join(" ")}`
        };
    }

    switch (importRow.importStatus) {
    case "processing":
        return {
            className: "product-import-status-processing",
            text: "Procesando…"
        };
    case "imported":
        return {
            className: "product-import-status-imported",
            text: "Importada"
        };
    case "error":
        return {
            className: "product-import-status-error",
            text: `Error: ${importRow.importError}`
        };
    default:
        return {
            className: "product-import-status-pending",
            text: "Pendiente"
        };
    }
}

function updateProductImportRowStatus(importRow) {
    const rowElements = productImportRowElements.get(importRow);

    if (!rowElements) {
        return;
    }

    const status = getProductImportRowStatus(importRow);
    rowElements.row.classList.toggle(
        "product-import-row-error",
        importRow.errors.length > 0 || importRow.importStatus === "error"
    );
    rowElements.status.className = status.className;
    rowElements.status.textContent = status.text;
}

function updateProductImportSummary(preview) {
    const eligibleRows = preview.rows.filter(row => row.errors.length === 0);
    const importedRows = eligibleRows.filter(
        row => row.importStatus === "imported"
    ).length;
    const failedRows = eligibleRows.filter(
        row => row.importStatus === "error"
    ).length;
    const processingRows = eligibleRows.filter(
        row => row.importStatus === "processing"
    ).length;

    if (productImportInProgress) {
        productImportSummary.textContent =
            `${importedRows + failedRows} de ${eligibleRows.length} filas procesadas. ` +
            `${importedRows} importadas, ${failedRows} con error` +
            (processingRows ? ` y ${processingRows} en proceso.` : ".");
    } else if (productImportHasFinished) {
        productImportSummary.textContent =
            `Importación finalizada: ${importedRows} importadas y ${failedRows} fallidas. ` +
            `${preview.invalidRows} filas con errores de vista previa no se importaron.`;
    } else {
        productImportSummary.textContent =
            `${eligibleRows.length} filas listas y ${preview.invalidRows} con errores. ` +
            "Todavía no se subió ninguna imagen ni se creó ningún producto.";
    }

    productImportSummary.hidden = false;
}

function setProductImportBusy(isBusy) {
    productImportInProgress = isBusy;
    productImportCsvInput.disabled = isBusy;
    productImportImagesInput.disabled = isBusy;
    productImportPreviewButton.disabled = isBusy;
    productImportBackButton.disabled = isBusy;
    productImportConfirmButton.disabled = isBusy || productImportHasFinished;
}

function renderProductImportPreview(preview) {
    clearProductImportPreview();
    currentProductImportPreview = preview;
    productImportHasFinished = false;

    const table = document.createElement("table");
    table.className = "product-import-table";
    const head = document.createElement("thead");
    const headRow = document.createElement("tr");

    [
        "Imagen",
        "Nombre",
        "Descripción",
        "Precio",
        "Stock",
        "Categoría",
        "Archivo",
        "Estado"
    ].forEach(label => {
        const header = document.createElement("th");
        header.scope = "col";
        header.textContent = label;
        headRow.appendChild(header);
    });

    head.appendChild(headRow);
    table.appendChild(head);

    const body = document.createElement("tbody");

    preview.rows.forEach(importRow => {
        const row = document.createElement("tr");
        const hasErrors = importRow.errors.length > 0;

        if (hasErrors) {
            row.className = "product-import-row-error";
        }

        const imageCell = document.createElement("td");

        if (importRow.preparedImageFile || importRow.imageFile) {
            const image = document.createElement("img");
            const imageUrl = URL.createObjectURL(
                importRow.preparedImageFile || importRow.imageFile
            );
            productImportPreviewUrls.push(imageUrl);
            image.className = "product-import-thumbnail";
            image.alt = `Vista previa de ${importRow.name || importRow.imageName}`;
            image.src = imageUrl;
            image.addEventListener("error", () => {
                const fallback = document.createElement("span");
                fallback.className = "product-import-thumbnail-fallback";
                fallback.textContent = "🖼️";
                image.replaceWith(fallback);
            }, { once: true });
            imageCell.appendChild(image);
        } else {
            const fallback = document.createElement("span");
            fallback.className = "product-import-thumbnail-fallback";
            fallback.textContent = "—";
            imageCell.appendChild(fallback);
        }

        row.appendChild(imageCell);
        appendImportCell(row, importRow.name);
        appendImportCell(row, importRow.description);
        appendImportCell(row, importRow.priceText);
        appendImportCell(row, importRow.stockText);
        appendImportCell(row, importRow.categoryName);
        appendImportCell(row, importRow.imageName);

        const status = document.createElement("td");

        row.appendChild(status);
        body.appendChild(row);
        productImportRowElements.set(importRow, { row, status });
        updateProductImportRowStatus(importRow);
    });

    table.appendChild(body);
    productImportPreview.appendChild(table);
    productImportPreview.hidden = false;
    productImportConfirmButton.hidden = false;
    productImportConfirmButton.disabled = preview.validRows === 0;
    updateProductImportSummary(preview);
}

function openProductImportScreen() {
    resetProduct();
    clearProductImportPreview();
    currentProductImportPreview = null;
    productImportHasFinished = false;
    productImportCsvInput.value = "";
    productImportImagesInput.value = "";
    productsScreen.style.display = "none";
    productFormScreen.style.display = "none";
    productImportScreen.style.display = "grid";
}

function closeProductImportScreen() {
    if (productImportInProgress) {
        return;
    }

    clearProductImportPreview();
    currentProductImportPreview = null;
    productImportScreen.style.display = "none";
    showProductsList();
}

async function generateProductImportPreview() {
    if (productImportInProgress) {
        return;
    }

    const csvFile = productImportCsvInput.files?.[0];

    if (!csvFile) {
        showProductImportMessage("Seleccioná el archivo CSV que querés revisar.");
        return;
    }

    if (!productImportImagesInput.files?.length) {
        showProductImportMessage("Seleccioná las imágenes indicadas en el CSV.");
        return;
    }

    productImportPreviewButton.disabled = true;
    productImportPreviewButton.textContent = "Validando…";
    clearProductImportPreview();
    currentProductImportPreview = null;
    productImportHasFinished = false;

    try {
        const preview = await createProductImportPreview(
            csvFile,
            productImportImagesInput.files
        );

        renderProductImportPreview(preview);
    } catch (error) {
        showProductImportMessage(
            error.message || "No se pudo leer el archivo CSV."
        );
    } finally {
        productImportPreviewButton.disabled = false;
        productImportPreviewButton.textContent = "Generar vista previa";
    }
}

async function getProductImportError(response, fallbackMessage) {
    try {
        const errorData = await response.json();

        return errorData.detail || errorData.message || fallbackMessage;
    } catch {
        return fallbackMessage;
    }
}

async function importProductsFromPreview() {
    const preview = currentProductImportPreview;

    if (productImportInProgress || !preview) {
        return;
    }

    const rowsToImport = preview.rows.filter(row => row.errors.length === 0);

    if (rowsToImport.length === 0) {
        showProductImportMessage("No hay filas válidas para importar.");
        return;
    }

    const currentToken = localStorage.getItem("token");

    if (!currentToken) {
        window.location.href = "../login/login.html";
        return;
    }

    setProductImportBusy(true);
    productImportConfirmButton.textContent = "Importando…";
    showProductImportMessage("");
    updateProductImportSummary(preview);

    for (const importRow of rowsToImport) {
        importRow.importStatus = "processing";
        importRow.importError = "";
        updateProductImportRowStatus(importRow);
        updateProductImportSummary(preview);

        try {
            if (!importRow.preparedImageFile) {
                throw new Error("No se pudo preparar la imagen para subirla.");
            }

            const imageUrl = await uploadImage(importRow.preparedImageFile);
            const response = await fetch(`${API_URL}/products/imported`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${currentToken}`
                },
                body: JSON.stringify({
                    name: importRow.name,
                    description: importRow.description,
                    imageUrl,
                    categoryName: importRow.categoryName
                })
            });

            if (handleUnauthorized(response)) {
                throw new Error("Tu sesión ya no permite completar la importación.");
            }

            if (!response.ok) {
                throw new Error(await getProductImportError(
                    response,
                    "No se pudo crear el producto."
                ));
            }

            importRow.importStatus = "imported";
        } catch (error) {
            importRow.importStatus = "error";
            importRow.importError = error.message || "No se pudo importar esta fila.";
        }

        updateProductImportRowStatus(importRow);
        updateProductImportSummary(preview);
    }

    setProductImportBusy(false);
    productImportHasFinished = true;
    productImportConfirmButton.disabled = true;
    productImportConfirmButton.textContent = "Importación finalizada";
    updateProductImportSummary(preview);

    if (rowsToImport.some(row => row.importStatus === "error")) {
        showProductImportMessage(
            "Algunas filas fallaron. Revisá su estado; no se reintentaron automáticamente."
        );
    }

    void loadProducts();
}

function showProductsList() {

    setCancelButtonVisible(false);
    productSuccess.style.display = "none";
    productFormScreen.style.display = "none";
    productImportScreen.style.display = "none";
    productsScreen.style.display = "grid";
}

function cancelProductForm() {

    resetProduct();
    history.replaceState({ productForm: false }, "");
    showProductsList();

    void loadProducts();
}

function openProductForm() {

    resetProduct();

    history.pushState({ productForm: true }, "");

    productsScreen.style.display = "none";
    productImportScreen.style.display = "none";
    productFormScreen.style.display = "block";

    productSuccess.style.display = "none";
    productError.textContent = "";

    showStep1();
}

function openEditProduct(product, categoryName) {

    history.pushState({ productForm: true }, "");

    productPhotoPreparationVersion += 1;
    editingProduct = product;

    newProduct.name = product.name;
    newProduct.description = product.description || "";
    newProduct.price = product.price === null || product.price === undefined
        ? null
        : Number(product.price);
    newProduct.stock = Number(product.stock ?? 0);
    newProduct.imageFile = null;
    newProduct.defaultImageUrl = "";
    newProduct.categoryName = categoryName;

    productsScreen.style.display = "none";
    productFormScreen.style.display = "block";

    productSuccess.style.display = "none";
    productError.textContent = "";

    productPhotoCameraInput.value = "";
    productPhotoGalleryInput.value = "";
    revokeProductPhotoPreviewObjectUrl();

    if (product.imageUrl) {
        productPhotoImage.src = getOptimizedCloudinaryUrl(
            product.imageUrl,
            "f_auto,q_auto,w_600,h_380,c_fill"
        );
        productPhotoPreview.style.display = "block";
    } else {
        productPhotoImage.src = "";
        productPhotoPreview.style.display = "none";
    }

    showStep1();
}

function showStep1() {

    setCancelButtonVisible(true);
    stepProgress.textContent = "Paso 1 de 4";

    productStep1.style.display = "block";
    productStep2.style.display = "none";
    productStep3.style.display = "none";
    productStep4.style.display = "none";
    productConfirmation.style.display = "none";
    productSuccess.style.display = "none";

    productNameInput.value =
        newProduct.name;

    productDescriptionInput.value =
        newProduct.description;

    productNameInput.focus();
}


function showStep2() {

    setCancelButtonVisible(true);
    stepProgress.textContent = "Paso 2 de 4";

    productStep1.style.display = "none";
    productStep2.style.display = "block";
    productStep3.style.display = "none";
    productStep4.style.display = "none";
    productConfirmation.style.display = "none";
    productSuccess.style.display = "none";

    productPriceInput.value = newProduct.price === null
        ? ""
        : newProduct.price;

    productStockInput.value =
        newProduct.stock;

    productPriceInput.focus();
}


function showStep3() {

    setCancelButtonVisible(true);
    stepProgress.textContent = "Paso 3 de 4";

    productStep1.style.display = "none";
    productStep2.style.display = "none";
    productStep3.style.display = "block";
    productStep4.style.display = "none";
    productConfirmation.style.display = "none";
    productSuccess.style.display = "none";

    renderCategoryOptions();

    categoryOptions.forEach(button => {
        button.classList.remove("selected");
    });

    customCategory.style.display = "none";
    customCategoryName.value = "";

    if (newProduct.categoryName) {

        const selectedButton = categoryOptions.find(
            button => button.dataset.category === newProduct.categoryName
        );

        if (selectedButton) {

            selectedButton.classList.add("selected");

        } else {

            customCategory.style.display =
                "block";

            customCategoryName.value =
                newProduct.categoryName;
        }
    }
}

function showStep4() {

    setCancelButtonVisible(true);
    stepProgress.textContent = "Paso 4 de 4";

    productStep1.style.display = "none";
    productStep2.style.display = "none";
    productStep3.style.display = "none";
    productStep4.style.display = "block";
    productConfirmation.style.display = "none";
    productSuccess.style.display = "none";

    updateDefaultImageOption();
}

function updateDefaultImageOption() {

    const categoryImages =
        defaultImages[newProduct.categoryName] || [];

    const hasDefaultImages =
        categoryImages.length > 0;

    defaultImageButton.style.display =
        hasDefaultImages ? "" : "none";

    if (!hasDefaultImages) {
        document.getElementById(
            "default-images-container"
        ).style.display = "none";
    }
}

function showDefaultImages() {

    const container =
        document.getElementById("default-images-container");

    const gallery =
        document.getElementById("default-images-gallery");

    const categoryImages =
        defaultImages[newProduct.categoryName] || [];

    gallery.innerHTML = "";

    if (categoryImages.length === 0) {
        container.style.display = "none";
        return;
    }

    categoryImages.forEach(image => {

            const button =
                document.createElement("button");

            button.type = "button";
            button.className = "default-image-option";

            button.innerHTML = `
                <img
                    src="${getOptimizedCloudinaryUrl(
                        image.imagen,
                        "f_auto,q_auto,w_160,h_160,c_fill"
                    )}"
                    alt="${image.nombre}"
                >
                <span>${image.nombre}</span>
            `;

            const imageElement =
                button.querySelector("img");

            imageElement.addEventListener("error", () => {
                button.remove();

                if (gallery.childElementCount === 0) {
                    container.style.display = "none";
                }
            }, { once: true });

            button.addEventListener("click", () => {

                newProduct.imageFile = null;
                newProduct.defaultImageUrl =
                    image.imagen;

                revokeProductPhotoPreviewObjectUrl();

                productPhotoImage.src =
                    getOptimizedCloudinaryUrl(
                        image.imagen,
                        "f_auto,q_auto,w_600,h_380,c_fill"
                    );

                productPhotoPreview.style.display =
                    "block";

                console.log(
                    "Imagen predeterminada seleccionada:",
                    image
                );
            });

            gallery.appendChild(button);
        });

    container.style.display = "block";
}

document
    .getElementById("btn-default-image")
    .addEventListener("click", () => {
        showDefaultImages();
    });

function showConfirmation() {

    setCancelButtonVisible(true);
    stepProgress.textContent = "";

    productStep1.style.display = "none";
    productStep2.style.display = "none";
    productStep3.style.display = "none";
    productStep4.style.display = "none";
    productConfirmation.style.display = "block";
    productSuccess.style.display = "none";

    productError.textContent = "";


    confirmationName.textContent =
        newProduct.name;
    
    confirmationDescription.textContent =
        newProduct.description;


    confirmationPrice.textContent =
        `$${newProduct.price.toLocaleString("es-AR")}`;


    confirmationCategory.textContent =
        `${getCategoryIcon(newProduct.categoryName)} ${newProduct.categoryName}`;


    if (newProduct.imageFile) {

        confirmationImage.src =
            URL.createObjectURL(
                newProduct.imageFile
            );

        confirmationImageContainer.style.display =
            "block";

    } else if (newProduct.defaultImageUrl) {

        confirmationImage.src =
            getOptimizedCloudinaryUrl(
                newProduct.defaultImageUrl,
                "f_auto,q_auto,w_600,h_380,c_fill"
            );

        confirmationImageContainer.style.display =
            "block";

    } else {

        confirmationImageContainer.style.display =
            "none";
    }

    if (editingProduct) {
        saveProductButton.textContent =
            "Guardar cambios";
    } else {
        saveProductButton.textContent =
            "Agregar producto";
    }
}


function resetProduct() {

    productPhotoPreparationVersion += 1;
    editingProduct = null;

    newProduct.name = "";
    newProduct.description = "";
    newProduct.price = null;
    newProduct.stock = 0;
    newProduct.imageFile = null;
    newProduct.defaultImageUrl = "";
    newProduct.categoryName = "";

    productNameInput.value = "";
    productDescriptionInput.value = "";
    productPriceInput.value = "";
    productStockInput.value = "0";

    productPhotoCameraInput.value = "";
    productPhotoGalleryInput.value = "";
    photoNextButton.disabled = false;
    photoSkipButton.disabled = false;
    revokeProductPhotoPreviewObjectUrl();

    productPhotoPreview.style.display =
        "none";

    productPhotoImage.src = "";

    categoryOptions.forEach(button => {
        button.classList.remove("selected");
    });

    customCategory.style.display =
        "none";

    customCategoryName.value = "";

    productError.textContent = "";

    showStep1();
}


async function requestCloudinaryUploadSignature() {

    const currentToken =
        localStorage.getItem("token");

    if (!currentToken) {
        window.location.href = "../login/login.html";

        throw new Error(
            "Tu sesión expiró. Volvé a iniciar sesión para subir una foto."
        );
    }

    const response =
        await fetch(
            `${API_URL}/uploads/cloudinary/signatures`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${currentToken}`
                }
            }
        );

    if (handleUnauthorized(response)) {
        throw new Error(
            "No fue posible autorizar la carga de la foto."
        );
    }

    if (!response.ok) {
        throw new Error(
            "No se pudo preparar la carga segura de la foto. Intentá nuevamente."
        );
    }

    const signature =
        await response.json();

    if (
        !signature.cloudName ||
        !signature.apiKey ||
        !signature.timestamp ||
        !signature.folder ||
        !signature.publicId ||
        !signature.signature
    ) {
        throw new Error(
            "La configuración para subir la foto está incompleta."
        );
    }

    return signature;
}


async function uploadImage(imageFile = newProduct.imageFile) {

    if (!imageFile) {
        return "";
    }

    const uploadSignature =
        await requestCloudinaryUploadSignature();

    const formData =
        new FormData();

    formData.append(
        "file",
        imageFile
    );

    formData.append(
        "api_key",
        uploadSignature.apiKey
    );

    formData.append(
        "timestamp",
        String(uploadSignature.timestamp)
    );

    formData.append(
        "folder",
        uploadSignature.folder
    );

    formData.append(
        "public_id",
        uploadSignature.publicId
    );

    formData.append(
        "overwrite",
        String(uploadSignature.overwrite)
    );

    formData.append(
        "signature",
        uploadSignature.signature
    );


    const response =
        await fetch(
            `https://api.cloudinary.com/v1_1/${encodeURIComponent(uploadSignature.cloudName)}/image/upload`,
            {
                method: "POST",
                body: formData
            }
        );


    if (!response.ok) {

        throw new Error(
            "No se pudo subir la foto de forma segura. Intentá nuevamente."
        );
    }


    const data =
        await response.json();


    if (
        !data.secure_url ||
        !String(data.secure_url).startsWith("https://")
    ) {
        throw new Error(
            "Cloudinary no devolvió una URL válida para la foto."
        );
    }

    return data.secure_url;
}


async function saveProduct() {

    const token =
        localStorage.getItem("token");

    if (!token) {
        window.location.href = "../login/login.html";
        return;
    }

    saveProductButton.disabled =
        true;

    saveProductButton.textContent =
        "Guardando...";

    try {

        // ============================
        // SUBIR FOTO SI HAY UNA NUEVA
        // ============================

        const uploadedImageUrl =
            await uploadImage();

        // ============================
        // CONSERVAR FOTO ACTUAL
        // ============================

        let imageUrl =
            uploadedImageUrl || newProduct.defaultImageUrl;

        if (
            editingProduct &&
            !newProduct.imageFile
        ) {
            imageUrl =
                editingProduct.imageUrl || "";
        }

        // ============================
        // DATOS DEL PRODUCTO
        // ============================

        const productData = {

            name:
                newProduct.name,

            description:
                newProduct.description,

            price:
                newProduct.price,

            stock:
                newProduct.stock,

            imageUrl:
                imageUrl,

            categoryName:
                newProduct.categoryName
        };

        console.log(
            "Enviando producto:",
            productData
        );

        // ============================
        // URL Y MÉTODO
        // ============================

        const url =
            editingProduct
                ? `${API_URL}/products/${editingProduct.id}`
                : `${API_URL}/products`;

        const method =
            editingProduct
                ? "PUT"
                : "POST";

        const response =
            await fetch(
                url,
                {
                    method: method,

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify(
                            productData
                        )
                }
            );

        // ============================
        // ERROR
        // ============================

        if (!response.ok) {

            let message =
                editingProduct
                    ? "No se pudo actualizar el producto."
                    : "No se pudo guardar el producto.";

            try {

                const errorData =
                    await response.json();

                if (errorData.message) {
                    message =
                        errorData.message;
                }

            } catch {
                // No hacemos nada.
            }

            throw new Error(message);
        }

        const savedProduct =
            await response.json();

        console.log(
            editingProduct
                ? "Producto actualizado:"
                : "Producto guardado:",
            savedProduct
        );

        // ============================
        // ÉXITO
        // ============================

        productConfirmation.style.display =
            "none";

        productSuccess.style.display =
            "block";

        setCancelButtonVisible(false);
        stepProgress.textContent = "";

    } catch (error) {

        console.error(
            "Error guardando producto:",
            error
        );

        productError.textContent =
            error.message;

    } finally {

        saveProductButton.disabled =
            false;

        saveProductButton.textContent =
            editingProduct
                ? "Guardar cambios"
                : "Agregar producto";
    }
}


// ============================================================
// LISTADO DE PRODUCTOS
// ============================================================

async function loadProducts() {

    const token =
        localStorage.getItem("token");


    if (!token) {

        productsContainer.innerHTML = `
            <p>No hay una sesión iniciada.</p>
        `;

        return;
    }


    try {

        const [
            productsResponse,
            categoriesResponse
        ] =
            await Promise.all([

                fetch(
                    `${API_URL}/products`,
                    {
                        method: "GET",

                        headers: {
                            "Authorization":
                                `Bearer ${token}`
                        }
                    }
                ),

                fetch(
                    `${API_URL}/categories`,
                    {
                        method: "GET",

                        headers: {
                            "Authorization":
                                `Bearer ${token}`
                        }
                    }
                )
            ]);


        if (handleUnauthorized(productsResponse)) {
            return;
        }

        if (!productsResponse.ok) {
            throw new Error(
                "No se pudieron obtener los productos."
            );
        }


        const products =
            await productsResponse.json();


        if (handleUnauthorized(categoriesResponse)) {
            return;
        }

        if (!categoriesResponse.ok) {
            throw new Error(
                "No se pudieron obtener las categorías del comercio."
            );
        }

        const categories = await categoriesResponse.json();

        existingCategoryNames = categories.map(category => category.name);


        const categoryMap =
            new Map(
                categories.map(
                    category => [
                        category.id,
                        category.name
                    ]
                )
            );

        renderCategoryFilters(
            categories,
            products
        );


        console.log(
            "Productos cargados:",
            products
        );


        renderProducts(
            filterProductsByCategory(
                products,
                categories
            ),
            categoryMap
        );


    } catch (error) {

        console.error(
            "Error cargando productos:",
            error
        );


        productsContainer.innerHTML = `
            <p>
                No se pudieron cargar los productos.
            </p>
        `;
    }
}

function filterProductsByCategory(
    products,
    categories
) {

    if (selectedCategoryId === "all") {
        return products;
    }

    const categoryIds =
        new Set(
            categories.map(
                category => String(category.id)
            )
        );

    if (selectedCategoryId === "uncategorized") {
        return products.filter(
            product =>
                !categoryIds.has(
                    String(product.categoryId)
                )
        );
    }

    return products.filter(
        product =>
            String(product.categoryId) ===
            selectedCategoryId
    );
}

function renderCategoryFilters(
    categories,
    products
) {

    const categoryIdsWithProducts =
        new Set(
            products
                .map(product => product.categoryId)
                .filter(categoryId => categoryId !== null && categoryId !== undefined)
                .map(categoryId => String(categoryId))
        );

    const categoriesWithProducts =
        categories.filter(category =>
            categoryIdsWithProducts.has(String(category.id))
        );

    const categoryIds =
        new Set(
            categories.map(
                category => String(category.id)
            )
        );

    const hasUncategorizedProducts =
        products.some(
            product =>
                !categoryIds.has(
                    String(product.categoryId)
                )
        );

    const filters = [
        {
            id: "all",
            name: "Todas"
        },
        ...categoriesWithProducts.map(category => ({
            id: String(category.id),
            name: category.name
        }))
    ];

    if (hasUncategorizedProducts) {
        filters.push({
            id: "uncategorized",
            name: "Sin categoría"
        });
    }

    if (
        !filters.some(
            filter =>
                filter.id === selectedCategoryId
        )
    ) {
        selectedCategoryId = "all";
    }

    categoryFiltersContainer.innerHTML = "";

    filters.forEach(filter => {

        const button =
            document.createElement("button");

        button.type = "button";
        button.className =
            "product-category-filter";

        button.textContent = filter.name;

        if (filter.id === selectedCategoryId) {
            button.classList.add("active");
        }

        button.addEventListener("click", () => {

            selectedCategoryId = filter.id;

            renderCategoryFilters(
                categories,
                products
            );

            const categoryMap =
                new Map(
                    categories.map(
                        category => [
                            category.id,
                            category.name
                        ]
                    )
                );

            renderProducts(
                filterProductsByCategory(
                    products,
                    categories
                ),
                categoryMap
            );
        });

        categoryFiltersContainer.appendChild(button);
    });
}


function normalizeCategoryName(value) {
    return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("es-AR");
}

function resolveExistingCategoryName(value, categoryNames) {
    const normalizedValue = normalizeCategoryName(value);

    return categoryNames.find(categoryName =>
        normalizeCategoryName(categoryName) === normalizedValue
    ) || value.trim();
}

function hasQuickEditChanges(product, draft, categoryName) {
    return draft.name.trim() !== (product.name || "")
        || draft.description !== (product.description || "")
        || draft.price !== String(product.price ?? "")
        || draft.stock !== String(product.stock ?? "")
        || draft.categoryName.trim() !== categoryName
        || Boolean(draft.imageFile);
}

function setCardStatus(card, message, autoHide = false) {
    const status = card.querySelector(".product-status-message");

    if (!status) {
        return;
    }

    const existingTimer = productStatusTimers.get(card);

    if (existingTimer) {
        clearTimeout(existingTimer);
        productStatusTimers.delete(card);
    }

    status.textContent = message;
    status.hidden = !message;

    if (message && autoHide) {
        const timer = window.setTimeout(() => {
            if (card.isConnected && card.contains(status)) {
                status.textContent = "";
                status.hidden = true;
            }

            productStatusTimers.delete(card);
        }, 2500);

        productStatusTimers.set(card, timer);
    }
}

function closeProductImageLightbox() {
    if (productImageLightbox.hidden) {
        return;
    }

    productImageLightbox.hidden = true;
    document.body.style.overflow = productImageLightboxPreviousBodyOverflow;
    productImageLightboxPreviousBodyOverflow = "";
    productImageLightboxContent.replaceChildren();
    productImageLightboxTrigger?.focus?.();
    productImageLightboxTrigger = null;
}

function openProductImageLightbox(product, trigger) {
    productImageLightboxTrigger = trigger;
    productImageLightboxContent.replaceChildren();

    if (!product.imageUrl) {
        const fallback = document.createElement("div");
        fallback.className = "product-image-lightbox-fallback";
        fallback.textContent = "Imagen no disponible";
        productImageLightboxContent.appendChild(fallback);
    } else {
        const image = document.createElement("img");
        image.className = "product-image-lightbox-image";
        image.alt = product.name || "Imagen del producto";
        image.src = getOptimizedCloudinaryUrl(
            product.imageUrl,
            "f_auto,q_auto,w_1400,h_1000,c_fit"
        );
        image.addEventListener("error", () => {
            const fallback = document.createElement("div");
            fallback.className = "product-image-lightbox-fallback";
            fallback.textContent = "No se pudo cargar la imagen";
            image.replaceWith(fallback);
        }, { once: true });
        productImageLightboxContent.appendChild(image);
    }

    productImageLightbox.hidden = false;
    productImageLightboxPreviousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeProductImageLightboxButton.focus();
}

function updateProductCardImage(card, product) {
    const mainRow = card.querySelector(".product-main-row");

    if (!mainRow || !product.imageUrl) {
        return;
    }

    let imageButton = mainRow.querySelector(
        ".product-image-lightbox-trigger"
    );

    if (!imageButton) {
        imageButton = document.createElement("button");
        imageButton.type = "button";
        imageButton.className = "product-image-lightbox-trigger";
        imageButton.addEventListener("click", () => {
            openProductImageLightbox(product, imageButton);
        });
        mainRow.prepend(imageButton);
    }

    imageButton.setAttribute(
        "aria-label",
        `Ver imagen ampliada de ${product.name}`
    );

    const image = document.createElement("img");
    image.className = "product-img";
    image.alt = product.name;
    image.src = getOptimizedCloudinaryUrl(
        product.imageUrl,
        "f_auto,q_auto,w_160,h_160,c_fill"
    );
    image.addEventListener("error", () => {
        imageButton.textContent = "🖼️";
        imageButton.setAttribute(
            "aria-label",
            `Imagen no disponible de ${product.name}`
        );
    }, { once: true });
    imageButton.replaceChildren(image);
}

async function saveQuickEdit(
    product,
    draft,
    categoryNames,
    card,
    saveButton,
    finishEditing
) {
    const name = draft.name.trim();
    const description = draft.description.trim();
    const categoryName = resolveExistingCategoryName(
        draft.categoryName,
        categoryNames
    );
    const price = Number(draft.price);
    const stock = Number(draft.stock);

    if (!name || !categoryName || !Number.isFinite(price) || price <= 0) {
        setCardStatus(card, "Completá nombre, precio válido y categoría.");
        return;
    }

    if (name.length > 100 || description.length > 100 || categoryName.length > 60) {
        setCardStatus(card, "Revisá los límites de caracteres de los campos.");
        return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
        setCardStatus(card, "El stock debe ser un número entero igual o mayor a cero.");
        return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "../login/login.html";
        return;
    }

    saveButton.disabled = true;
    setCardStatus(card, "Guardando…");

    try {
        let imageUrl = product.imageUrl || "";

        if (draft.imageFile) {
            setCardStatus(card, "Subiendo foto…");
            imageUrl = await uploadImage(draft.imageFile);
            setCardStatus(card, "Guardando…");
        }

        const response = await fetch(`${API_URL}/products/${product.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                name,
                description,
                price,
                stock,
                imageUrl,
                categoryName
            })
        });

        if (handleUnauthorized(response)) {
            return;
        }

        if (!response.ok) {
            let message = "No se pudo guardar el producto.";

            try {
                const error = await response.json();
                message = error.message || error.error || message;
            } catch {
                // La respuesta no contiene un error JSON utilizable.
            }

            throw new Error(message);
        }

        const savedProduct = await response.json();
        const imageWasReplaced = Boolean(draft.imageFile);
        Object.assign(product, savedProduct, {
            imageUrl: imageWasReplaced
                ? imageUrl
                : savedProduct.imageUrl || imageUrl
        });

        if (imageWasReplaced) {
            updateProductCardImage(card, product);
        }

        draft.categoryName = categoryName;
        if (!categoryNames.some(existingName =>
            normalizeCategoryName(existingName) === normalizeCategoryName(categoryName)
        )) {
            categoryNames.push(categoryName);
        }
        finishEditing("Cambios guardados.", true, true);
    } catch (error) {
        console.error("Error guardando edición rápida:", error);
        const message = error.message || "No se pudo guardar el producto.";
        setCardStatus(card, message);
        saveButton.disabled = false;
    }
}

async function toggleProductActive(product, card, toggleButton) {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "../login/login.html";
        return;
    }

    if (!product.active && !hasActivatablePrice(product.price)) {
        setCardStatus(
            card,
            "Completá un precio mayor que cero antes de activar el producto."
        );
        return;
    }

    toggleButton.disabled = true;
    setCardStatus(card, "Actualizando estado…");

    try {
        const response = await fetch(
            product.active
                ? `${API_URL}/products/${product.id}`
                : `${API_URL}/products/${product.id}/activate`,
            {
                method: product.active ? "DELETE" : "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            }
        );

        if (handleUnauthorized(response)) {
            return;
        }

        if (!response.ok) {
            let message = "No se pudo actualizar el estado del producto.";

            try {
                const error = await response.json();
                message = error.detail || error.message || error.error || message;
            } catch {
                // La respuesta no contiene un error JSON utilizable.
            }

            throw new Error(message);
        }

        product.active = !product.active;
        toggleButton.textContent = product.active ? "✓ Activado" : "✓ Desactivado";
        setCardStatus(card, "Estado actualizado.", true);

        setTimeout(() => {
            if (card.isConnected && card.contains(toggleButton)) {
                toggleButton.textContent = product.active
                    ? "Desactivar"
                    : "Activar";
            }
        }, 1500);
    } catch (error) {
        console.error("Error cambiando estado del producto:", error);
        const message = error.message || "No se pudo actualizar el estado.";
        setCardStatus(card, message);
    } finally {
        toggleButton.disabled = false;
    }
}

function hasActivatablePrice(price) {
    const numericPrice = Number(price);

    return price !== null && price !== undefined &&
        Number.isFinite(numericPrice) && numericPrice > 0;
}

function renderProducts(products, categoryMap) {
    if (!products || products.length === 0) {
        productsContainer.innerHTML = `
            <div class="empty-products">
                <div class="empty-products-icon">🛒</div>
                <h3>Todavía no tenés productos</h3>
                <p>Agregá tu primer producto para empezar a armar tu menú.</p>
            </div>
        `;
        return;
    }

    productsContainer.replaceChildren();

    const categoryNames = [...new Set(categoryMap.values())];

    products.forEach(product => {
        const categoryName = categoryMap.get(product.categoryId) || "Sin categoría";
        const card = document.createElement("div");
        card.className = "product-card";
        card.dataset.productId = product.id;

        const mainRow = document.createElement("div");
        mainRow.className = "product-main-row";

        if (product.imageUrl) {
            const imageButton = document.createElement("button");
            imageButton.type = "button";
            imageButton.className = "product-image-lightbox-trigger";
            imageButton.setAttribute("aria-label", `Ver imagen ampliada de ${product.name}`);
            const image = document.createElement("img");
            image.className = "product-img";
            image.alt = product.name;
            image.src = getOptimizedCloudinaryUrl(
                product.imageUrl,
                "f_auto,q_auto,w_160,h_160,c_fill"
            );
            image.addEventListener("error", () => {
                imageButton.textContent = "🖼️";
                imageButton.setAttribute("aria-label", `Imagen no disponible de ${product.name}`);
            }, { once: true });
            imageButton.appendChild(image);
            imageButton.addEventListener("click", () => {
                openProductImageLightbox(product, imageButton);
            });
            mainRow.appendChild(imageButton);
        }

        const info = document.createElement("div");
        info.className = "product-info";
        const name = document.createElement("h3");
        name.textContent = product.name;
        const description = document.createElement("p");
        description.className = "product-description";
        description.textContent = product.description || "";
        description.hidden = !product.description?.trim();
        const stock = document.createElement("span");
        stock.className = "product-stock";
        stock.textContent = `Stock: ${product.stock}`;
        const category = document.createElement("p");
        category.className = "product-category";
        category.textContent = `📂 ${categoryName}`;
        const price = document.createElement("span");
        price.className = "product-price";
        price.textContent = hasActivatablePrice(product.price)
            ? `$${Number(product.price).toLocaleString("es-AR")}`
            : "Precio pendiente";
        info.append(name, description, stock, category, price);
        mainRow.appendChild(info);

        const quickEditButton = document.createElement("button");
        quickEditButton.type = "button";
        quickEditButton.textContent = "Editar";

        const toggleButton = document.createElement("button");
        toggleButton.type = "button";
        toggleButton.textContent = product.active ? "Desactivar" : "Activar";
        toggleButton.addEventListener("click", () => {
            void toggleProductActive(product, card, toggleButton);
        });

        const statusMessage = document.createElement("p");
        statusMessage.className = "product-status-message";
        statusMessage.setAttribute("aria-live", "polite");
        statusMessage.hidden = true;

        const startQuickEdit = () => {
            const draft = {
                name: product.name || "",
                description: product.description || "",
                price: String(product.price ?? ""),
                stock: String(product.stock ?? ""),
                categoryName,
                imageFile: null
            };
            const nameInput = document.createElement("input");
            nameInput.className = "product-quick-edit-input product-quick-edit-name";
            nameInput.value = draft.name;
            nameInput.maxLength = 100;
            nameInput.setAttribute("aria-label", "Nombre del producto");
            const descriptionInput = document.createElement("textarea");
            descriptionInput.className = "product-quick-edit-input product-quick-edit-description";
            descriptionInput.value = draft.description;
            descriptionInput.maxLength = 100;
            descriptionInput.setAttribute("aria-label", "Descripción del producto");
            const stockInput = document.createElement("input");
            stockInput.className = "product-quick-edit-input product-quick-edit-stock";
            stockInput.type = "number";
            stockInput.min = "0";
            stockInput.step = "1";
            stockInput.inputMode = "numeric";
            stockInput.value = draft.stock;
            stockInput.id = `quick-edit-stock-${product.id}`;
            const stockEditor = document.createElement("div");
            stockEditor.className = "product-quick-stock-editor";
            const stockLabel = document.createElement("label");
            stockLabel.htmlFor = stockInput.id;
            stockLabel.textContent = "Stock";
            stockEditor.append(stockLabel, stockInput);
            const priceInput = document.createElement("input");
            priceInput.className = "product-quick-edit-input product-quick-edit-price";
            priceInput.type = "number";
            priceInput.min = "0.01";
            priceInput.step = "0.01";
            priceInput.value = draft.price;
            priceInput.id = `quick-edit-price-${product.id}`;
            priceInput.setAttribute("aria-label", "Precio del producto");
            const priceEditor = document.createElement("div");
            priceEditor.style.display = "inline-flex";
            priceEditor.style.gridColumn = "2";
            priceEditor.style.justifySelf = "end";
            priceEditor.style.alignItems = "center";
            priceEditor.style.gap = "5px";
            priceEditor.style.width = "fit-content";
            priceEditor.style.color = "var(--red)";
            priceEditor.style.fontSize = "0.78rem";
            const priceLabel = document.createElement("label");
            priceLabel.htmlFor = priceInput.id;
            priceLabel.textContent = "Precio";
            priceLabel.style.font = "inherit";
            priceLabel.style.fontWeight = "600";
            priceEditor.append(priceLabel, priceInput);
            const categoryInput = document.createElement("input");
            categoryInput.className = "product-quick-edit-input product-quick-edit-category";
            categoryInput.value = draft.categoryName;
            categoryInput.maxLength = 60;
            categoryInput.setAttribute("role", "combobox");
            categoryInput.setAttribute("aria-autocomplete", "list");
            const categoryEditor = document.createElement("div");
            categoryEditor.className = "product-quick-category-editor";
            const categorySuggestions = document.createElement("div");
            categorySuggestions.className = "product-quick-category-suggestions";
            categorySuggestions.id = `quick-edit-category-suggestions-${product.id}`;
            categorySuggestions.setAttribute("role", "listbox");
            categorySuggestions.hidden = true;
            categoryInput.setAttribute("aria-controls", categorySuggestions.id);
            categoryInput.setAttribute("aria-expanded", "false");
            categoryInput.setAttribute("aria-label", "Categoría del producto");
            const categoryToggle = document.createElement("button");
            categoryToggle.type = "button";
            categoryToggle.className = "product-quick-category-toggle";
            categoryToggle.setAttribute("aria-label", "Mostrar categorías disponibles");
            categoryToggle.setAttribute("aria-haspopup", "listbox");
            categoryToggle.setAttribute("aria-expanded", "false");
            categoryToggle.textContent = "⌄";
            categoryEditor.append(categoryInput, categoryToggle, categorySuggestions);

            const imageInput = document.createElement("input");
            imageInput.type = "file";
            imageInput.accept = "image/*";
            imageInput.hidden = true;
            imageInput.id = `quick-edit-image-${product.id}`;
            imageInput.setAttribute(
                "aria-describedby",
                `quick-edit-image-name-${product.id}`
            );

            const imageEditor = document.createElement("div");
            imageEditor.className = "product-quick-image-editor";
            const imageLabel = document.createElement("label");
            imageLabel.className = "product-quick-image-button";
            imageLabel.htmlFor = imageInput.id;
            imageLabel.textContent = "Cambiar foto";
            const imageName = document.createElement("span");
            imageName.className = "product-quick-image-name";
            imageName.id = `quick-edit-image-name-${product.id}`;
            imageName.setAttribute("aria-live", "polite");
            imageName.textContent = "Sin cambios";
            imageEditor.append(imageInput, imageLabel, imageName);

            name.replaceWith(nameInput);
            description.replaceWith(descriptionInput);
            stock.replaceWith(stockEditor);
            price.replaceWith(priceEditor);
            category.replaceWith(categoryEditor);
            info.appendChild(imageEditor);

            const saveButton = document.createElement("button");
            saveButton.type = "button";
            saveButton.textContent = "Guardar";
            saveButton.disabled = true;
            const cancelButton = document.createElement("button");
            cancelButton.type = "button";
            cancelButton.textContent = "Cancelar";
            quickEditButton.replaceWith(saveButton, cancelButton);
            toggleButton.disabled = true;
            setCardStatus(card, "");

            let isPreparingImage = false;
            let imagePreparationVersion = 0;

            const updateDraft = () => {
                draft.name = nameInput.value;
                draft.description = descriptionInput.value;
                draft.price = priceInput.value;
                draft.stock = stockInput.value;
                draft.categoryName = categoryInput.value;
                saveButton.disabled = isPreparingImage ||
                    !hasQuickEditChanges(product, draft, categoryName);
            };

            imageInput.addEventListener("change", () => {
                const file = imageInput.files?.[0];

                if (!file) {
                    return;
                }

                const preparationVersion = ++imagePreparationVersion;
                isPreparingImage = true;
                updateDraft();
                setCardStatus(card, "Preparando foto…");

                void prepareProductImage(file)
                    .then(preparedImage => {
                        if (
                            preparationVersion !== imagePreparationVersion ||
                            !imageInput.isConnected
                        ) {
                            return;
                        }

                        draft.imageFile = preparedImage;
                        imageName.textContent = file.name;
                        isPreparingImage = false;
                        updateDraft();
                        setCardStatus(card, "");
                    })
                    .catch(error => {
                        if (
                            preparationVersion !== imagePreparationVersion ||
                            !imageInput.isConnected
                        ) {
                            return;
                        }

                        imageInput.value = "";
                        isPreparingImage = false;
                        updateDraft();
                        setCardStatus(
                            card,
                            error.message || "No se pudo preparar la imagen."
                        );
                    });
            });

            const renderCategorySuggestions = () => {
                const query = normalizeCategoryName(categoryInput.value);
                const matches = categoryNames.filter(existingName =>
                    !query || normalizeCategoryName(existingName).includes(query)
                );

                categorySuggestions.replaceChildren();

                matches.forEach(existingName => {
                    const suggestion = document.createElement("button");
                    suggestion.type = "button";
                    suggestion.className = "product-quick-category-suggestion";
                    suggestion.setAttribute("role", "option");
                    suggestion.textContent = existingName;
                    suggestion.addEventListener("click", () => {
                        categoryInput.value = existingName;
                        updateDraft();
                        categorySuggestions.hidden = true;
                        categoryInput.setAttribute("aria-expanded", "false");
                        categoryToggle.setAttribute("aria-expanded", "false");
                        categoryInput.focus();
                    });
                    categorySuggestions.appendChild(suggestion);
                });

                const createCategory = document.createElement("button");
                createCategory.type = "button";
                createCategory.className =
                    "product-quick-category-suggestion product-quick-category-create";
                createCategory.textContent = "＋ Crear nueva categoría";
                createCategory.addEventListener("click", showCreateCategory);
                categorySuggestions.appendChild(createCategory);

                categorySuggestions.hidden = false;
                categoryInput.setAttribute("aria-expanded", "true");
                categoryToggle.setAttribute("aria-expanded", "true");
            };

            const closeCategorySuggestions = () => {
                categorySuggestions.hidden = true;
                categoryInput.setAttribute("aria-expanded", "false");
                categoryToggle.setAttribute("aria-expanded", "false");
            };

            const closeWhenClickingOutside = event => {
                if (!categoryEditor.isConnected) {
                    document.removeEventListener(
                        "pointerdown",
                        closeWhenClickingOutside
                    );
                    return;
                }

                if (!categoryEditor.contains(event.target)) {
                    closeCategorySuggestions();
                }
            };

            const showCreateCategory = () => {
                closeCategorySuggestions();

                const newCategoryInput = document.createElement("input");
                newCategoryInput.className =
                    "product-quick-edit-input product-quick-new-category-input";
                newCategoryInput.maxLength = 60;
                newCategoryInput.placeholder = "Nueva categoría";
                newCategoryInput.setAttribute("aria-label", "Nombre de la nueva categoría");

                const creationActions = document.createElement("div");
                creationActions.className = "product-quick-new-category-actions";
                const acceptCategory = document.createElement("button");
                acceptCategory.type = "button";
                acceptCategory.textContent = "Aceptar";
                const cancelCategory = document.createElement("button");
                cancelCategory.type = "button";
                cancelCategory.textContent = "Cancelar";
                creationActions.append(acceptCategory, cancelCategory);

                const creationError = document.createElement("p");
                creationError.className = "product-quick-new-category-error";
                creationError.hidden = true;

                const restoreSelector = () => {
                    categoryEditor.replaceChildren(
                        categoryInput,
                        categoryToggle,
                        categorySuggestions
                    );
                    categoryInput.focus();
                    closeCategorySuggestions();
                };

                const acceptNewCategory = () => {
                    const newCategoryName = newCategoryInput.value
                        .trim()
                        .replace(/\s+/g, " ");

                    if (!newCategoryName) {
                        creationError.textContent =
                            "Escribí un nombre para la nueva categoría.";
                        creationError.hidden = false;
                        return;
                    }

                    const equivalentCategory = categoryNames.find(existingName =>
                        normalizeCategoryName(existingName)
                            === normalizeCategoryName(newCategoryName)
                    );

                    if (equivalentCategory) {
                        creationError.textContent =
                            `Ya existe “${equivalentCategory}”. Seleccionala de las sugerencias.`;
                        creationError.hidden = false;
                        return;
                    }

                    categoryInput.value = newCategoryName;
                    updateDraft();
                    restoreSelector();
                };

                acceptCategory.addEventListener("click", acceptNewCategory);
                cancelCategory.addEventListener("click", restoreSelector);
                newCategoryInput.addEventListener("keydown", event => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        acceptNewCategory();
                    }

                    if (event.key === "Escape") {
                        event.preventDefault();
                        restoreSelector();
                    }
                });

                categoryEditor.replaceChildren(
                    newCategoryInput,
                    creationActions,
                    creationError
                );
                newCategoryInput.focus();
            };

            [nameInput, descriptionInput, priceInput, stockInput]
                .forEach(input => input.addEventListener("input", updateDraft));

            categoryInput.addEventListener("input", () => {
                updateDraft();
                renderCategorySuggestions();
            });
            categoryInput.addEventListener("focus", renderCategorySuggestions);
            categoryToggle.addEventListener("click", () => {
                if (categorySuggestions.hidden) {
                    renderCategorySuggestions();
                } else {
                    closeCategorySuggestions();
                }

                categoryInput.focus();
            });
            document.addEventListener("pointerdown", closeWhenClickingOutside);
            categoryInput.addEventListener("keydown", event => {
                if (event.key === "ArrowDown" && !categorySuggestions.hidden) {
                    event.preventDefault();
                    categorySuggestions.querySelector("button")?.focus();
                }

                if (event.key === "Escape") {
                    closeCategorySuggestions();
                }
            });

            const finishEditing = (
                message,
                autoHide = false,
                useDraftCategory = false
            ) => {
                name.textContent = product.name;
                nameInput.replaceWith(name);
                description.textContent = product.description || "";
                description.hidden = !product.description?.trim();
                descriptionInput.replaceWith(description);
                stock.textContent = `Stock: ${product.stock}`;
                stockEditor.replaceWith(stock);
                price.textContent = `$${Number(product.price).toLocaleString("es-AR")}`;
                priceEditor.replaceWith(price);
                const savedCategoryName = useDraftCategory
                    ? draft.categoryName.trim() || categoryName
                    : categoryName;
                category.textContent = `📂 ${savedCategoryName}`;
                categoryEditor.replaceWith(category);
                imageEditor.remove();
                document.removeEventListener("pointerdown", closeWhenClickingOutside);
                saveButton.replaceWith(quickEditButton);
                cancelButton.remove();
                toggleButton.disabled = false;
                setCardStatus(card, message, autoHide);
            };

            saveButton.addEventListener("click", () => {
                void saveQuickEdit(
                    product,
                    draft,
                    categoryNames,
                    card,
                    saveButton,
                    finishEditing
                );
            });
            cancelButton.addEventListener("click", () => finishEditing(""));
            nameInput.focus();
        };

        quickEditButton.addEventListener("click", startQuickEdit);
        card.append(mainRow, quickEditButton, toggleButton, statusMessage);
        productsContainer.appendChild(card);
    });
}


// ============================================================
// EVENTOS
// ============================================================

openProductImportButton.addEventListener(
    "click",
    openProductImportScreen
);

productImportBackButton.addEventListener(
    "click",
    closeProductImportScreen
);

productImportPreviewButton.addEventListener(
    "click",
    () => {
        void generateProductImportPreview();
    }
);

productImportConfirmButton.addEventListener(
    "click",
    () => {
        void importProductsFromPreview();
    }
);

addProductButton.addEventListener(
    "click",
    openProductForm
);


nameNextButton.addEventListener(
    "click",
    () => {

        const name =
            productNameInput.value.trim();


        if (!name) {

            alert(
                "Escribí el nombre del producto"
            );

            return;
        }


        newProduct.name =
            name;

        newProduct.description =
            productDescriptionInput.value.trim();

        console.log(
            "Paso 1:",
            newProduct
        );


        showStep2();
    }
);


priceBackButton.addEventListener(
    "click",
    () => {

        showStep1();
    }
);


priceNextButton.addEventListener(
    "click",
    () => {

        const price =
            Number(
                productPriceInput.value
            );

        const stock =
            Number(
                productStockInput.value
            );


        if (
            !price ||
            price <= 0
        ) {

            alert(
                "Ingresá un precio válido"
            );

            return;
        }

        if (
            !Number.isInteger(stock) ||
            stock < 0
        ) {

            alert(
                "Ingresá un stock válido"
            );

            return;
        }


        newProduct.price =
            price;

        newProduct.stock =
            stock;


        console.log(
            "Paso 2:",
            newProduct
        );


        showStep3();
    }
);


async function handleProductPhotoChange(input) {

    const file =
        input.files[0];


    if (!file) {

        return;
    }

    const preparationVersion = ++productPhotoPreparationVersion;

    photoNextButton.disabled = true;
    photoSkipButton.disabled = true;
    productError.textContent = "Preparando imagen…";

    try {
        const preparedImage =
            await prepareProductImage(file);

        if (preparationVersion !== productPhotoPreparationVersion) {
            return;
        }

        newProduct.imageFile =
            preparedImage;

        newProduct.defaultImageUrl = "";

        revokeProductPhotoPreviewObjectUrl();
        const imageUrl =
            URL.createObjectURL(preparedImage);
        productPhotoPreviewObjectUrl = imageUrl;


        productPhotoImage.src =
            imageUrl;


        productPhotoPreview.style.display =
            "block";

        productError.textContent = "";
    } catch (error) {
        if (preparationVersion !== productPhotoPreparationVersion) {
            return;
        }

        input.value = "";
        productError.textContent =
            error.message || "No se pudo preparar la imagen.";
    } finally {
        if (preparationVersion === productPhotoPreparationVersion) {
            photoNextButton.disabled = false;
            photoSkipButton.disabled = false;
        }
    }
}


productPhotoCameraInput.addEventListener(
    "change",
    () => {

        void handleProductPhotoChange(
            productPhotoCameraInput
        );
    }
);


productPhotoGalleryInput.addEventListener(
    "change",
    () => {

        void handleProductPhotoChange(
            productPhotoGalleryInput
        );
    }
);


photoBackButton.addEventListener(
    "click",
    () => {

        showStep3();
    }
);


photoNextButton.addEventListener(
    "click",
    () => {

        console.log(
            "Paso 4:",
            newProduct
        );

        showConfirmation();
    }
);


photoSkipButton.addEventListener(
    "click",
    () => {

        newProduct.imageFile = null;
        newProduct.defaultImageUrl = "";

        console.log(
            "Paso 4 omitido:",
            newProduct
        );

        showConfirmation();
    }
);


categoryBackButton.addEventListener(
    "click",
    () => {

        showStep2();
    }
);


categoryNextButton.addEventListener(
    "click",
    () => {

        if (
            !newProduct.categoryName
        ) {

            const customName =
                customCategoryName.value.trim();


            if (!customName) {

                alert(
                    "Elegí una categoría"
                );

                return;
            }


            newProduct.categoryName =
                customName;
        }


        console.log(
            "Paso 3:",
            newProduct
        );

        showStep4();

            }
);


confirmationBackButton.addEventListener(
    "click",
    () => {

        showStep4();
    }
);


saveProductButton.addEventListener(
    "click",
    saveProduct
);


addAnotherProductButton.addEventListener(
    "click",
    resetProduct
);


viewProductsButton.addEventListener(
    "click",
    async () => {

        showProductsList();

        await loadProducts();
    }
);

cancelProductButton.addEventListener(
    "click",
    cancelProductForm
);

window.addEventListener("popstate", () => {

    if (productFormScreen.style.display === "none") {
        return;
    }

    showProductsList();

    void loadProducts();
});

document
    .getElementById("btn-logout")
    .addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("businessSlug");
        localStorage.removeItem("businessName");

        window.location.href = "../login/login.html";
    });

closeProductImageLightboxButton.addEventListener(
    "click",
    closeProductImageLightbox
);

productImageLightbox.addEventListener("click", event => {
    if (event.target === productImageLightbox) {
        closeProductImageLightbox();
    }
});

document.addEventListener("keydown", event => {
    if (productImageLightbox.hidden) {
        return;
    }

    if (event.key === "Escape") {
        closeProductImageLightbox();
        return;
    }

    if (event.key === "Tab") {
        event.preventDefault();
        closeProductImageLightboxButton.focus();
    }
});

// ============================================================
// INICIO
// ============================================================

loadProducts();
