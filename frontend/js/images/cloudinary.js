export function getOptimizedCloudinaryUrl(imageUrl, transformation) {
    if (!imageUrl || !transformation) {
        return imageUrl;
    }

    try {
        const url = new URL(imageUrl, window.location.origin);

        if (url.hostname !== "res.cloudinary.com") {
            return imageUrl;
        }

        const uploadPath = "/image/upload/";
        const uploadPathIndex = url.pathname.indexOf(uploadPath);

        if (uploadPathIndex === -1) {
            return imageUrl;
        }

        const transformationStart = uploadPathIndex + uploadPath.length;
        url.pathname =
            `${url.pathname.slice(0, transformationStart)}` +
            `${transformation}/` +
            url.pathname.slice(transformationStart);

        return url.href;
    } catch {
        return imageUrl;
    }
}
