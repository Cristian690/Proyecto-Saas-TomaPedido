console.log("Products admin loaded");

import { defaultImages } from "../default-images/default-images.js";

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "../login/login.html";
}

function handleUnauthorized(response) {
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("businessSlug");
        localStorage.removeItem("businessName");
        localStorage.removeItem("role");

        window.location.href = "../login/login.html";

        return true;
    }

    return false;
}


const API_URL =
    "http://192.168.100.32:8080";

const CLOUDINARY_URL =
    "https://api.cloudinary.com/v1_1/y2zsd3jg/image/upload";

const CLOUDINARY_UPLOAD_PRESET =
    "tomapedido_uploads";


const productsScreen =
    document.getElementById("products-screen");

const productsContainer =
    document.getElementById("products-container");

const categoryFiltersContainer =
    document.getElementById("products-category-filters");

let selectedCategoryId = "all";

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

const productPhotoInput =
    document.getElementById("product-photo");

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


const categoryOptions =
    document.querySelectorAll(".category-option");

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


const confirmationBackButton =
    document.getElementById("btn-product-confirm-back");

const saveProductButton =
    document.getElementById("btn-product-save");


const addAnotherProductButton =
    document.getElementById("btn-add-another-product");

const viewProductsButton =
    document.getElementById("btn-view-products");


const newProduct = {
    name: "",
    description: "",
    price: null,
    imageFile: null,
    defaultImageUrl: "",
    categoryName: ""
};

let editingProduct = null;

function openProductForm() {

    productsScreen.style.display = "none";
    productFormScreen.style.display = "block";

    productSuccess.style.display = "none";
    productError.textContent = "";

    showStep1();
}

function openEditProduct(product, categoryName) {

    editingProduct = product;

    newProduct.name = product.name;
    newProduct.description = product.description || "";
    newProduct.price = Number(product.price);
    newProduct.imageFile = null;
    newProduct.defaultImageUrl = "";
    newProduct.categoryName = categoryName;

    productsScreen.style.display = "none";
    productFormScreen.style.display = "block";

    productSuccess.style.display = "none";
    productError.textContent = "";

    productPhotoInput.value = "";

    if (product.imageUrl) {
        productPhotoImage.src = product.imageUrl;
        productPhotoPreview.style.display = "block";
    } else {
        productPhotoImage.src = "";
        productPhotoPreview.style.display = "none";
    }

    showStep1();
}

function showStep1() {

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

    stepProgress.textContent = "Paso 2 de 4";

    productStep1.style.display = "none";
    productStep2.style.display = "block";
    productStep3.style.display = "none";
    productStep4.style.display = "none";
    productConfirmation.style.display = "none";
    productSuccess.style.display = "none";

    if (newProduct.price !== null) {

        productPriceInput.value =
            newProduct.price;
    }

    productPriceInput.focus();
}


function showStep3() {

    stepProgress.textContent = "Paso 3 de 4";

    productStep1.style.display = "none";
    productStep2.style.display = "none";
    productStep3.style.display = "block";
    productStep4.style.display = "none";
    productConfirmation.style.display = "none";
    productSuccess.style.display = "none";

    categoryOptions.forEach(button => {
        button.classList.remove("selected");
    });

    customCategory.style.display = "none";
    customCategoryName.value = "";

    if (newProduct.categoryName) {

        const selectedButton =
            document.querySelector(
                `.category-option[data-category="${newProduct.categoryName}"]`
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
                src="${image.imagen}"
                alt="${image.nombre}"
            >
            <span>${image.nombre}</span>
        `;

        button.addEventListener("click", () => {

            newProduct.imageFile = null;
            newProduct.defaultImageUrl =
                image.imagen;

            productPhotoImage.src =
                image.imagen;

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
    .getElementById("btn-logout")
    .addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("businessSlug");
        localStorage.removeItem("businessName");

        window.location.href = "../login/login.html";
    });

// ============================================================
// INICIO
// ============================================================

loadProducts();
