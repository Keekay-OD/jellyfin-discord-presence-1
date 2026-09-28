import axios from "axios";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const CACHE_DIR = path.join(
    process.cwd(),
    "poster_cache"
);

const PUBLIC_IMAGE_URL =
    "https://images.keekay.cloud/posters";

if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, {
        recursive: true
    });
}

/**
 * Download a Jellyfin image and cache it locally.
 *
 * Returns the public URL that Discord can access.
 */
export async function uploadToImgur(
    imageUrl: string | null,
    type: "large" | "small"
): Promise<string | null> {

    /*
     * Keep the old function name for now so we don't
     * have to change every other file in the project.
     *
     * It no longer uploads to Imgur.
     */

    if (!imageUrl) {
        return null;
    }

    try {

        /*
         * Generate a unique filename based on the
         * Jellyfin image URL.
         */
        const hash = crypto
            .createHash("md5")
            .update(imageUrl)
            .digest("hex");

        /*
         * Jellyfin normally returns JPEG artwork.
         */
        const filename =
            `${hash}.jpg`;

        const cacheFile =
            path.join(
                CACHE_DIR,
                filename
            );

        /*
         * -------------------------------------------------
         * CACHE CHECK
         * -------------------------------------------------
         */

        if (fs.existsSync(cacheFile)) {

            console.log(
                `[Cache] Using cached poster: ${filename}`
            );

            return `${PUBLIC_IMAGE_URL}/${filename}`;
        }

        /*
         * -------------------------------------------------
         * DOWNLOAD FROM JELLYFIN
         * -------------------------------------------------
         */

        console.log(
            `[Cache] Downloading Jellyfin artwork: ${imageUrl}`
        );

        const response =
            await axios.get(
                imageUrl,
                {
                    responseType:
                        "arraybuffer",

                    timeout: 15000
                }
            );

        /*
         * -------------------------------------------------
         * SAVE LOCALLY
         * -------------------------------------------------
         */

        fs.writeFileSync(
            cacheFile,
            Buffer.from(response.data)
        );

        console.log(
            `[Cache] Saved poster: ${cacheFile}`
        );

        const publicUrl =
            `${PUBLIC_IMAGE_URL}/${filename}`;

        console.log(
            `[Cache] Public URL: ${publicUrl}`
        );

        return publicUrl;

    } catch (error: any) {

        console.error(
            "[Cache] Failed:",
            error.response?.data ||
            error.code ||
            error.message
        );

        return null;
    }
}