export let categories = [];

export function setCategories(data) {
    categories = data;
}

export function getCategories() {
    return categories;
}

export function renderTabs() {
    const tabsContainer = document.getElementById("tabs-container");
    const fragment = document.createDocumentFragment();

    const allTab = document.createElement("button");
    allTab.className = "tab tab--active";
    allTab.dataset.cat = "all";
    allTab.type = "button";
    allTab.textContent = "Todas";
    fragment.appendChild(allTab);

    categories.forEach(category => {
        const tab = document.createElement("button");
        tab.className = "tab";
        tab.dataset.cat = String(category.id);
        tab.type = "button";
        tab.textContent = category.nombre;
        fragment.appendChild(tab);
    });

    tabsContainer.replaceChildren(fragment);
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
