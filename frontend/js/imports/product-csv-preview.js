import { prepareProductImage } from "../images/prepare-product-image.js";

const REQUIRED_COLUMNS = [
    "nombre",
    "descripcion",
    "precio",
    "stock",
    "categoria",
    "imagen"
];

function normalizeText(value) {
    return String(value || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleLowerCase("es-AR");
}

function normalizeFileName(value) {
    return String(value || "").trim().toLocaleLowerCase("es-AR");
}

function createCsvError(message) {
    return new Error(message);
}

function parseCsv(text) {
    const rows = [];
    let row = [];
    let value = "";
    let insideQuotes = false;

    for (let index = 0; index < text.length; index += 1) {
        const character = text[index];

        if (insideQuotes) {
            if (character === '"' && text[index + 1] === '"') {
                value += '"';
                index += 1;
            } else if (character === '"') {
                insideQuotes = false;
            } else {
                value += character;
            }

            continue;
        }

        if (character === '"') {
            if (value) {
                throw createCsvError("El CSV tiene comillas en una posición inválida.");
            }

            insideQuotes = true;
        } else if (character === ",") {
            row.push(value);
            value = "";
        } else if (character === "\n") {
            row.push(value);
            rows.push(row);
            row = [];
            value = "";
        } else if (character !== "\r") {
            value += character;
        }
    }

    if (insideQuotes) {
        throw createCsvError("El CSV tiene una celda con comillas sin cerrar.");
    }

    row.push(value);
    rows.push(row);

    return rows.filter(currentRow => currentRow.some(cell => cell.trim()));
}

async function readCsvFile(file) {
    if (!file || !file.name.toLocaleLowerCase("es-AR").endsWith(".csv")) {
        throw createCsvError("Elegí un archivo CSV UTF-8 válido.");
    }

    let text;

    try {
        text = new TextDecoder("utf-8", { fatal: true })
            .decode(await file.arrayBuffer())
            .replace(/^\uFEFF/, "");
    } catch {
        throw createCsvError("El archivo debe estar codificado en UTF-8.");
    }

    return parseCsv(text);
}

function getColumnIndexes(header) {
    const indexes = new Map();

    header.forEach((column, index) => {
        const normalizedColumn = normalizeText(column);

        if (REQUIRED_COLUMNS.includes(normalizedColumn)) {
            if (indexes.has(normalizedColumn)) {
                throw createCsvError(
                    `La columna “${normalizedColumn}” aparece más de una vez.`
                );
            }

            indexes.set(normalizedColumn, index);
        }
    });

    const missingColumns = REQUIRED_COLUMNS.filter(column => !indexes.has(column));

    if (missingColumns.length) {
        throw createCsvError(
            `Faltan columnas obligatorias: ${missingColumns.join(", ")}.`
        );
    }

    return indexes;
}

function getCell(row, index) {
    return (row[index] || "").trim();
}

function parsePrice(value) {
    if (!/^\d+(?:[.,]\d+)?$/.test(value)) {
        return null;
    }

    const price = Number(value.replace(",", "."));

    return Number.isFinite(price) ? price : null;
}

function parseStock(value) {
    if (!/^\d+$/.test(value)) {
        return null;
    }

    const stock = Number(value);

    return Number.isSafeInteger(stock) ? stock : null;
}

function buildImageIndex(files) {
    const index = new Map();

    files.forEach(file => {
        const normalizedName = normalizeFileName(file.name);

        if (!normalizedName) {
            return;
        }

        const matches = index.get(normalizedName) || [];
        matches.push(file);
        index.set(normalizedName, matches);
    });

    return index;
}

function addError(row, message) {
    row.errors.push(message);
}

function validateProductFields(row) {
    if (!row.name) {
        addError(row, "El nombre es obligatorio.");
    } else if (row.name.length > 100) {
        addError(row, "El nombre no puede superar los 100 caracteres.");
    }

    if (row.description.length > 100) {
        addError(row, "La descripción no puede superar los 100 caracteres.");
    }

    if (!row.categoryName) {
        addError(row, "La categoría es obligatoria.");
    } else if (row.categoryName.length > 60) {
        addError(row, "La categoría no puede superar los 60 caracteres.");
    }

    if (row.price === null || row.price < 0) {
        addError(row, "El precio debe ser un número mayor o igual a cero.");
    }

    if (row.stock === null || row.stock < 0) {
        addError(row, "El stock debe ser un entero mayor o igual a cero.");
    }

    if (!row.imageName) {
        addError(row, "Indicá el nombre del archivo de imagen.");
    } else if (/[\\/]/.test(row.imageName)) {
        addError(row, "La imagen debe contener solo el nombre del archivo, sin rutas.");
    }
}

function markDuplicateProducts(rows) {
    const rowsByProduct = new Map();

    rows.forEach(row => {
        if (!row.name || !row.categoryName) {
            return;
        }

        const key = `${normalizeText(row.name)}\u0000${normalizeText(row.categoryName)}`;
        const matches = rowsByProduct.get(key) || [];
        matches.push(row);
        rowsByProduct.set(key, matches);
    });

    rowsByProduct.forEach(matches => {
        if (matches.length > 1) {
            matches.forEach(row => {
                addError(row, "Hay otro producto con el mismo nombre y categoría.");
            });
        }
    });
}

async function validateImages(rows, imageIndex) {
    const preparedImages = new Map();

    for (const row of rows) {
        if (!row.imageName || /[\\/]/.test(row.imageName)) {
            continue;
        }

        const matches = imageIndex.get(normalizeFileName(row.imageName)) || [];

        if (matches.length === 0) {
            addError(row, `No se encontró la imagen “${row.imageName}”.`);
            continue;
        }

        if (matches.length > 1) {
            addError(row, `La imagen “${row.imageName}” es ambigua.`);
            continue;
        }

        const [file] = matches;
        row.imageFile = file;

        if (!preparedImages.has(file)) {
            preparedImages.set(file, prepareProductImage(file)
                .then(preparedImageFile => ({ preparedImageFile }))
                .catch(error => ({
                    error: error.message || "La imagen no es válida."
                })));
        }

        const preparedImage = await preparedImages.get(file);

        if (preparedImage.error) {
            addError(row, preparedImage.error);
            continue;
        }

        row.preparedImageFile = preparedImage.preparedImageFile;
    }
}

export async function createProductImportPreview(csvFile, imageFiles) {
    const parsedRows = await readCsvFile(csvFile);

    if (parsedRows.length < 2) {
        throw createCsvError("El CSV debe incluir una fila de encabezados y al menos un producto.");
    }

    const columnIndexes = getColumnIndexes(parsedRows[0]);
    const rows = parsedRows.slice(1).map((csvRow, index) => ({
        line: index + 2,
        name: getCell(csvRow, columnIndexes.get("nombre")),
        description: getCell(csvRow, columnIndexes.get("descripcion")),
        priceText: getCell(csvRow, columnIndexes.get("precio")),
        stockText: getCell(csvRow, columnIndexes.get("stock")),
        categoryName: getCell(csvRow, columnIndexes.get("categoria")),
        imageName: getCell(csvRow, columnIndexes.get("imagen")),
        price: null,
        stock: null,
        imageFile: null,
        preparedImageFile: null,
        errors: []
    }));

    rows.forEach(row => {
        row.price = parsePrice(row.priceText);
        row.stock = parseStock(row.stockText);
        validateProductFields(row);
    });

    markDuplicateProducts(rows);
    await validateImages(rows, buildImageIndex(Array.from(imageFiles || [])));

    return {
        rows,
        validRows: rows.filter(row => row.errors.length === 0).length,
        invalidRows: rows.filter(row => row.errors.length > 0).length
    };
}
