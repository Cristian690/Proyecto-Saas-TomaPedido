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

    if (categoryImages.length === 0) {
        gallery.innerHTML = `
            <p>
                Todavía no tenemos imágenes predeterminadas
                para esta categoría.
            </p>
        `;
    } else {

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
    }

    container.style.display = "block";
}

defaultImageButton.addEventListener("click", () => {
    showDefaultImages();
});

function showConfirmation() {

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
        `📂 ${newProduct.categoryName}`;


    if (newProduct.imageFile) {

        confirmationImage.src =
            URL.createObjectURL(
                newProduct.imageFile
            );

        confirmationImageContainer.style.display =
            "block";

    } else if (newProduct.defaultImageUrl) {

        confirmationImage.src =
            newProduct.defaultImageUrl;

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

    editingProduct = null;

    newProduct.name = "";
    newProduct.price = null;
    newProduct.imageFile = null;
    newProduct.defaultImageUrl = "";
    newProduct.categoryName = "";

    productNameInput.value = "";
    productPriceInput.value = "";
    productPhotoInput.value = "";

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


async function uploadImage() {

    if (!newProduct.imageFile) {
        return "";
    }

    const formData =
        new FormData();

    formData.append(
        "file",
        newProduct.imageFile
    );

    formData.append(
        "upload_preset",
        CLOUDINARY_UPLOAD_PRESET
    );


    const response =
        await fetch(
            CLOUDINARY_URL,
            {
                method: "POST",
                body: formData
            }
        );


    if (!response.ok) {

        throw new Error(
            "No se pudo subir la foto."
        );
    }


    const data =
        await response.json();


    console.log(
        "Imagen subida a Cloudinary:",
        data
    );


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


        let categories = [];


        if (handleUnauthorized(categoriesResponse)) {
            return;
        }

        if (categoriesResponse.ok) {
            categories = await categoriesResponse.json();
        }


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
        ...categories.map(category => ({
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


function renderProducts(
    products,
    categoryMap
) {

    if (
        !products ||
        products.length === 0
    ) {

        productsContainer.innerHTML = `
            <div class="empty-products">

                <div class="empty-products-icon">
                    🛒
                </div>

                <h3>
                    Todavía no tenés productos
                </h3>

                <p>
                    Agregá tu primer producto para empezar
                    a armar tu menú.
                </p>                

            </div>
        `;    
       


        return;
    }


    productsContainer.innerHTML = "";


    products.forEach(product => {


        const categoryName =
            categoryMap.get(
                product.categoryId
            )
            || "Sin categoría";


        const card =
            document.createElement(
                "div"
            );

        card.className =
            "product-card";


        const mainRow =
            document.createElement(
                "div"
            );

        mainRow.className =
            "product-main-row";


        // ============================
        // IMAGEN
        // ============================

        if (product.imageUrl) {

            const image =
                document.createElement(
                    "img"
                );

            image.className =
                "product-img";

            image.src =
                product.imageUrl;

            image.alt =
                product.name;


            mainRow.appendChild(
                image
            );
        }


        // ============================
        // INFORMACIÓN
        // ============================

        const info =
            document.createElement(
                "div"
            );

        info.className =
            "product-info";


        const name =
            document.createElement(
                "h3"
            );

        name.textContent =
            product.name;


        const category =
            document.createElement(
                "p"
            );

        category.textContent =
            `📂 ${categoryName}`;


        const price =
            document.createElement(
                "span"
            );

        price.className =
            "product-price";


        price.textContent =
            `$${Number(
                product.price
            ).toLocaleString("es-AR")}`;


        info.appendChild(
            name
        );

        info.appendChild(
            category
        );

        info.appendChild(
            price
        );


        mainRow.appendChild(info);

        const editButton = document.createElement("button");

        editButton.type = "button";
        editButton.textContent = "Editar";

        editButton.addEventListener("click", () => {
            openEditProduct(product, categoryName);
        });

        const toggleButton = document.createElement("button");

        toggleButton.type = "button";
        toggleButton.textContent =
            product.active ? "Desactivar" : "Activar";

        toggleButton.addEventListener("click", async () => {

            const token =
                localStorage.getItem("token");

            if (!token) {
                alert("No hay una sesión iniciada.");
                return;
            }

            const url = product.active
                ? `${API_URL}/products/${product.id}`
                : `${API_URL}/products/${product.id}/activate`;

            const method = product.active
                ? "DELETE"
                : "PATCH";

            try {

                const response =
                    await fetch(
                        url,
                        {
                            method: method,
                            headers: {
                                "Authorization":
                                    `Bearer ${token}`
                            }
                        }
                    );

                if (!response.ok) {
                    throw new Error(
                        product.active
                            ? "No se pudo desactivar el producto."
                            : "No se pudo activar el producto."
                    );
                }

                alert(
                    product.active
                        ? "Producto desactivado."
                        : "Producto activado."
                );

                await loadProducts();

            } catch (error) {

                console.error(
                    "Error cambiando estado del producto:",
                    error
                );

                alert(error.message);
            }
        });

        card.appendChild(mainRow);
        card.appendChild(editButton);
        card.appendChild(toggleButton);

        productsContainer.appendChild(card);
    });
}


// ============================================================
// EVENTOS
// ============================================================

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


        if (
            !price ||
            price <= 0
        ) {

            alert(
                "Ingresá un precio válido"
            );

            return;
        }


        newProduct.price =
            price;


        console.log(
            "Paso 2:",
            newProduct
        );


        showStep3();
    }
);


productPhotoInput.addEventListener(
    "change",
    () => {

        const file =
            productPhotoInput.files[0];


        if (!file) {

            return;
        }


        newProduct.imageFile =
            file;

        newProduct.defaultImageUrl = "";

        const imageUrl =
            URL.createObjectURL(file);


        productPhotoImage.src =
            imageUrl;


        productPhotoPreview.style.display =
            "block";


        console.log(
            "Foto seleccionada:",
            file
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


categoryOptions.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                categoryOptions.forEach(
                    option => {

                        option.classList.remove(
                            "selected"
                        );
                    }
                );


                button.classList.add(
                    "selected"
                );


                const category =
                    button.dataset.category;


                if (
                    category === "Otra"
                ) {

                    customCategory.style.display =
                        "block";

                    customCategoryName.focus();

                    newProduct.categoryName =
                        "";

                } else {

                    customCategory.style.display =
                        "none";

                    newProduct.categoryName =
                        category;
                }


                console.log(
                    "Categoría seleccionada:",
                    newProduct.categoryName
                );
            }
        );
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

        productSuccess.style.display =
            "none";

        productsScreen.style.display =
            "block";

        productFormScreen.style.display =
            "none";


        await loadProducts();
    }
);

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
