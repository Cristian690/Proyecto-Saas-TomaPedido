export let categories = [];

export function setCategories(data) {
    categories = data;
}

export function getCategories() {
    return categories;
}

export function renderTabs() {
    const tabsContainer = document.getElementById("tabs-container");

    tabsContainer.innerHTML = `
        <button
            class="tab tab--active"
            data-cat="all"
        >
            Todas
        </button>

        ${categories.map(category => `
            <button
                class="tab"
                data-cat="${category.id}"
            >
                ${category.nombre}
            </button>
        `).join("")}
    `;
}

export function initTabs(onCategorySelected) {
    document.querySelectorAll(".tab").forEach(btn => {
        btn.addEventListener("click", () => {

            document.querySelectorAll(".tab").forEach(tab =>
                tab.classList.remove("tab--active")
            );

            btn.classList.add("tab--active");

            onCategorySelected(btn.dataset.cat);
        });
    });
}