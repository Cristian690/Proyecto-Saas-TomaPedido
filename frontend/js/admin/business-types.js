export const businessTypes = [
    {
        id: "GASTRONOMY",
        name: "Gastronomía",
        icon: "🍽️",
        categories: [
            ["Pizzas", "🍕"], ["Empanadas", "🥟"], ["Hamburguesas", "🍔"],
            ["Sandwiches", "🥪", "Sándwiches"], ["Minutas", "🍳"], ["Pastas", "🍝"],
            ["Ensaladas", "🥗"], ["Bebidas", "🥤"], ["Postres", "🍰"],
            ["Promociones", "🔥"]
        ]
    },
    {
        id: "TOY_STORE",
        name: "Jugueterías",
        icon: "🧸",
        categories: [
            ["Peluches", "🧸"], ["Juguetes de madera", "🪵"], ["Didácticos", "🧩"],
            ["Juegos de mesa", "🎲"], ["Muñecas", "🪆"], ["Vehículos", "🚗"],
            ["Aire libre", "⚽"], ["Otros juguetes", "🪀"]
        ]
    },
    {
        id: "CLOTHING_AND_FOOTWEAR",
        name: "Indumentaria y calzado",
        icon: "👕",
        categories: [
            ["Remeras", "👕"], ["Pantalones", "👖"], ["Vestidos", "👗"],
            ["Abrigos", "🧥"], ["Calzado", "👟"], ["Carteras", "👜"],
            ["Accesorios", "🕶️"]
        ]
    },
    {
        id: "GIFTS_AND_DECOR",
        name: "Regalerías y decoración",
        icon: "🎁",
        categories: [
            ["Regalos", "🎁"], ["Peluches", "🧸"], ["Tazas", "☕"],
            ["Decoración", "🏠"], ["Velas", "🕯️"], ["Souvenirs", "💝"],
            ["Personalizados", "✨"]
        ]
    },
    {
        id: "PET_SHOP",
        name: "Pet shops",
        icon: "🐾",
        categories: [
            ["Alimentos", "🍖"], ["Juguetes", "🧸"], ["Correas y collares", "🦮"],
            ["Camas", "🛏️"], ["Higiene", "🧼"], ["Accesorios", "🐾"]
        ]
    },
    {
        id: "FLORIST_AND_NURSERY",
        name: "Florerías y viveros",
        icon: "🌷",
        categories: [
            ["Ramos", "💐"], ["Rosas", "🌹"], ["Plantas", "🪴"],
            ["Macetas", "🏺"], ["Arreglos florales", "🌼"], ["Jardinería", "🌱"]
        ]
    },
    {
        id: "BAKERY_AND_PASTRY",
        name: "Panaderías y pastelerías",
        icon: "🥐",
        categories: [
            ["Panes", "🍞"], ["Facturas", "🥐"], ["Tortas", "🎂"],
            ["Tartas", "🥧"], ["Alfajores", "🍪"], ["Masas finas", "🧁"]
        ]
    },
    {
        id: "CAFE_AND_TEA",
        name: "Cafeterías y casas de té",
        icon: "☕",
        categories: [
            ["Café", "☕"], ["Infusiones", "🫖"], ["Pastelería", "🍰"],
            ["Desayunos", "🥞"], ["Meriendas", "🧁"], ["Sandwiches", "🥪", "Sándwiches"]
        ]
    },
    {
        id: "HEALTH_FOOD",
        name: "Dietéticas y productos naturales",
        icon: "🌿",
        categories: [
            ["Frutos secos", "🥜"], ["Semillas", "🌱"], ["Cereales", "🌾"],
            ["Legumbres", "🫘"], ["Snacks", "🍎"], ["Infusiones", "🫖"]
        ]
    },
    {
        id: "GROCERY",
        name: "Almacenes y minimercados",
        icon: "🛒",
        categories: [
            ["Almacén", "🛒"], ["Bebidas", "🥤"], ["Golosinas", "🍬"],
            ["Lácteos", "🥛"], ["Limpieza", "🧽"], ["Higiene personal", "🧴"]
        ]
    },
    {
        id: "BEAUTY_AND_COSMETICS",
        name: "Perfumería y cosmética",
        icon: "💄",
        categories: [
            ["Perfumes", "🌸"], ["Maquillaje", "💄"], ["Cuidado facial", "🧖"],
            ["Cuidado corporal", "🧴"], ["Cabello", "💇"], ["Accesorios", "✨"]
        ]
    },
    {
        id: "TECHNOLOGY",
        name: "Tecnología y electrónica",
        icon: "📱",
        categories: [
            ["Celulares", "📱"], ["Fundas", "📲"], ["Cargadores", "🔌"],
            ["Auriculares", "🎧"], ["Computación", "💻"], ["Audio", "🔊"],
            ["Accesorios", "⚙️"]
        ]
    },
    {
        id: "HARDWARE",
        name: "Ferreterías y herramientas",
        icon: "🛠️",
        categories: [
            ["Herramientas", "🛠️"], ["Tornillería", "🔩"], ["Pinturas", "🎨"],
            ["Electricidad", "💡"], ["Plomería", "🚰"], ["Jardín", "🌿"]
        ]
    },
    {
        id: "STATIONERY",
        name: "Librerías y papelerías",
        icon: "📚",
        categories: [
            ["Cuadernos", "📓"], ["Útiles escolares", "✏️"], ["Escritura", "🖊️"],
            ["Libros", "📚"], ["Arte y manualidades", "🎨"], ["Oficina", "📎"]
        ]
    },
    {
        id: "HOME_AND_KITCHEN",
        name: "Hogar y bazar",
        icon: "🏠",
        categories: [
            ["Cocina", "🍳"], ["Vajilla", "🍽️"], ["Organización", "🗂️"],
            ["Textiles", "🧺"], ["Decoración", "🏠"], ["Limpieza", "🧽"]
        ]
    },
    {
        id: "BABY_AND_MATERNITY",
        name: "Bebés y maternidad",
        icon: "🍼",
        categories: [
            ["Ropa de bebé", "👶"], ["Juguetes", "🧸"], ["Accesorios", "🍼"],
            ["Higiene", "🧼"], ["Alimentación infantil", "🥣"]
        ]
    },
    {
        id: "OTHER",
        name: "Otro comercio",
        icon: "🏪",
        categories: []
    }
];

export function getBusinessType(businessTypeId) {
    return businessTypes.find(type => type.id === businessTypeId) || null;
}

export function getCategoryIcon(categoryName) {
    const normalizedCategoryName = String(categoryName || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("es-AR");

    for (const businessType of businessTypes) {
        const category = businessType.categories.find(([name]) =>
            name
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLocaleLowerCase("es-AR") === normalizedCategoryName
        );

        if (category) {
            return category[1];
        }
    }

    return "🏷️";
}
