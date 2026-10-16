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
        const pathAfterUpload = url.pathname.slice(transformationStart);
        const firstSegment = pathAfterUpload.split("/")[0];
        const cloudinaryTransformation =
            /^(?:(?:a|ac|af|ar|b|bo|br|c|co|d|dl|dn|dpr|du|e|f|fl|fps|g|h|if|l|o|p|pg|q|r|so|sp|t|u|vc|w|x|y|z)_[^,/]+)(?:,(?:(?:a|ac|af|ar|b|bo|br|c|co|d|dl|dn|dpr|du|e|f|fl|fps|g|h|if|l|o|p|pg|q|r|so|sp|t|u|vc|w|x|y|z)_[^,/]+))*$/i;

        if (cloudinaryTransformation.test(firstSegment)) {
            return imageUrl;
        }

        url.pathname =
            `${url.pathname.slice(0, transformationStart)}` +
            `${transformation}/` +
            url.pathname.slice(transformationStart);

        return url.href;
    } catch {
        return imageUrl;
    }
}
