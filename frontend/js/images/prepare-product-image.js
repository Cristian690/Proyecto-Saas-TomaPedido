const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const MAX_INPUT_PIXELS = 20_000_000;
const MAX_OUTPUT_SIDE = 1200;
const LOSSY_QUALITY = 0.84;

const SUPPORTED_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp"
]);

function createPreparationError(message) {
    return new Error(message);
}

function getOutputExtension(type) {
    if (type === "image/jpeg") {
        return "jpg";
    }

    if (type === "image/webp") {
        return "webp";
    }

    return "png";
}

function getOutputName(name, type) {
    const baseName = (name || "producto")
        .replace(/\.[^/.]+$/, "")
        .trim() || "producto";

    return `${baseName}.${getOutputExtension(type)}`;
}

function getOutputDimensions(width, height) {
    const largestSide = Math.max(width, height);

    if (largestSide <= MAX_OUTPUT_SIDE) {
        return { width, height };
    }

    const scale = MAX_OUTPUT_SIDE / largestSide;

    return {
        width: Math.max(1, Math.round(width * scale)),
        height: Math.max(1, Math.round(height * scale))
    };
}

function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (!blob) {
                reject(createPreparationError(
                    "No se pudo preparar la imagen. Probá con otra foto."
                ));
                return;
            }

            resolve(blob);
        }, type, quality);
    });
}

function isJpegStartOfFrame(marker) {
    return marker >= 0xC0 && marker <= 0xCF &&
        marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC;
}

function readPngMetadata(bytes, view) {
    const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

    if (
        bytes.length < 24 ||
        !pngSignature.every((value, index) => bytes[index] === value) ||
        String.fromCharCode(...bytes.slice(12, 16)) !== "IHDR"
    ) {
        return null;
    }

    return {
        type: "image/png",
        width: view.getUint32(16, false),
        height: view.getUint32(20, false)
    };
}

function readJpegMetadata(bytes, view) {
    if (bytes.length < 4 || bytes[0] !== 0xFF || bytes[1] !== 0xD8) {
        return null;
    }

    let offset = 2;

    while (offset < bytes.length) {
        while (bytes[offset] === 0xFF) {
            offset += 1;
        }

        const marker = bytes[offset];
        offset += 1;

        if (marker === undefined || marker === 0xD9 || marker === 0xDA) {
            break;
        }

        if (marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) {
            continue;
        }

        if (offset + 2 > bytes.length) {
            break;
        }

        const segmentLength = view.getUint16(offset, false);

        if (segmentLength < 2 || offset + segmentLength > bytes.length) {
            break;
        }

        if (isJpegStartOfFrame(marker) && segmentLength >= 8) {
            return {
                type: "image/jpeg",
                width: view.getUint16(offset + 5, false),
                height: view.getUint16(offset + 3, false)
            };
        }

        offset += segmentLength;
    }

    return null;
}

function readWebpMetadata(bytes, view) {
    if (
        bytes.length < 20 ||
        String.fromCharCode(...bytes.slice(0, 4)) !== "RIFF" ||
        String.fromCharCode(...bytes.slice(8, 12)) !== "WEBP"
    ) {
        return null;
    }

    let offset = 12;

    while (offset + 8 <= bytes.length) {
        const chunkType = String.fromCharCode(...bytes.slice(offset, offset + 4));
        const chunkSize = view.getUint32(offset + 4, true);
        const dataOffset = offset + 8;

        if (dataOffset + chunkSize > bytes.length) {
            return null;
        }

        if (chunkType === "VP8X" && chunkSize >= 10) {
            return {
                type: "image/webp",
                width: 1 + bytes[dataOffset + 4] +
                    (bytes[dataOffset + 5] << 8) +
                    (bytes[dataOffset + 6] << 16),
                height: 1 + bytes[dataOffset + 7] +
                    (bytes[dataOffset + 8] << 8) +
                    (bytes[dataOffset + 9] << 16)
            };
        }

        if (chunkType === "VP8L" && chunkSize >= 5 && bytes[dataOffset] === 0x2F) {
            return {
                type: "image/webp",
                width: 1 + bytes[dataOffset + 1] +
                    ((bytes[dataOffset + 2] & 0x3F) << 8),
                height: 1 + (bytes[dataOffset + 2] >> 6) +
                    (bytes[dataOffset + 3] << 2) +
                    ((bytes[dataOffset + 4] & 0x0F) << 10)
            };
        }

        if (
            chunkType === "VP8 " &&
            chunkSize >= 10 &&
            bytes[dataOffset + 3] === 0x9D &&
            bytes[dataOffset + 4] === 0x01 &&
            bytes[dataOffset + 5] === 0x2A
        ) {
            return {
                type: "image/webp",
                width: view.getUint16(dataOffset + 6, true) & 0x3FFF,
                height: view.getUint16(dataOffset + 8, true) & 0x3FFF
            };
        }

        offset = dataOffset + chunkSize + (chunkSize % 2);
    }

    return null;
}

async function readImageMetadata(file) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const metadata = readPngMetadata(bytes, view) ||
        readJpegMetadata(bytes, view) ||
        readWebpMetadata(bytes, view);

    if (!metadata || !metadata.width || !metadata.height) {
        throw createPreparationError(
            "No se pudo leer la imagen. Probá con otro archivo."
        );
    }

    return metadata;
}

async function decodeImage(file) {
    if (typeof createImageBitmap === "function") {
        try {
            const bitmap = await createImageBitmap(file, {
                imageOrientation: "from-image"
            });

            return {
                source: bitmap,
                width: bitmap.width,
                height: bitmap.height,
                release: () => bitmap.close()
            };
        } catch {
            // Algunos navegadores no admiten createImageBitmap para todos los formatos.
        }
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = "async";

    try {
        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = () => reject(createPreparationError(
                "No se pudo leer la imagen. Probá con otro archivo."
            ));
            image.src = objectUrl;
        });
    } catch (error) {
        URL.revokeObjectURL(objectUrl);
        throw error;
    }

    return {
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        release: () => URL.revokeObjectURL(objectUrl)
    };
}

function hasTransparency(context, width, height) {
    const pixels = context.getImageData(0, 0, width, height).data;

    for (let index = 3; index < pixels.length; index += 4) {
        if (pixels[index] < 255) {
            return true;
        }
    }

    return false;
}

function getOutputType(inputType, context, width, height) {
    if (inputType !== "image/png") {
        return inputType;
    }

    return hasTransparency(context, width, height)
        ? "image/png"
        : "image/webp";
}

function validateFile(file) {
    if (!(file instanceof File)) {
        throw createPreparationError("Elegí una imagen válida.");
    }

    if (!SUPPORTED_TYPES.has(file.type.toLowerCase())) {
        throw createPreparationError(
            "El formato no es compatible. Usá una imagen JPEG, PNG o WebP."
        );
    }

    if (file.size === 0) {
        throw createPreparationError("La imagen está vacía o dañada.");
    }

    if (file.size > MAX_INPUT_BYTES) {
        throw createPreparationError("La imagen no puede superar los 10 MB.");
    }
}

export async function prepareProductImage(file) {
    validateFile(file);

    const metadata = await readImageMetadata(file);
    const declaredType = file.type.toLowerCase();

    if (metadata.type !== declaredType) {
        throw createPreparationError(
            "El contenido de la imagen no coincide con su formato declarado."
        );
    }

    if (metadata.width * metadata.height > MAX_INPUT_PIXELS) {
        throw createPreparationError(
            "La imagen tiene demasiados píxeles. Elegí una foto de menor resolución."
        );
    }

    const decodedImage = await decodeImage(file);
    let canvas;

    try {
        const { width, height } = decodedImage;

        if (!width || !height) {
            throw createPreparationError(
                "No se pudieron obtener las dimensiones de la imagen."
            );
        }

        if (width * height > MAX_INPUT_PIXELS) {
            throw createPreparationError(
                "La imagen tiene demasiados píxeles. Elegí una foto de menor resolución."
            );
        }

        const outputDimensions = getOutputDimensions(width, height);
        canvas = document.createElement("canvas");
        canvas.width = outputDimensions.width;
        canvas.height = outputDimensions.height;

        const context = canvas.getContext("2d", { alpha: true });

        if (!context) {
            throw createPreparationError(
                "Tu navegador no pudo preparar la imagen."
            );
        }

        context.drawImage(
            decodedImage.source,
            0,
            0,
            outputDimensions.width,
            outputDimensions.height
        );

        const outputType = getOutputType(
            metadata.type,
            context,
            outputDimensions.width,
            outputDimensions.height
        );
        const blob = await canvasToBlob(
            canvas,
            outputType,
            outputType === "image/png" ? undefined : LOSSY_QUALITY
        );

        return new File(
            [blob],
            getOutputName(file.name, blob.type || outputType),
            {
                type: blob.type || outputType,
                lastModified: Date.now()
            }
        );
    } finally {
        decodedImage.release();

        if (canvas) {
            canvas.width = 0;
            canvas.height = 0;
        }
    }
}
