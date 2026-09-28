import http from "http";
import fs from "fs";
import path from "path";
import { URL } from "url";

const PORT = 8787;
const CACHE_DIR = path.join(process.cwd(), "poster_cache");

if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export function startImageServer() {
    const server = http.createServer((req, res) => {
        try {
            if (!req.url) {
                res.writeHead(400);
                res.end("Bad Request");
                return;
            }

            const url = new URL(
                req.url,
                `http://localhost:${PORT}`
            );

            /*
             * Only serve:
             *
             * /posters/<filename>
             */
            if (!url.pathname.startsWith("/posters/")) {
                res.writeHead(404);
                res.end("Not Found");
                return;
            }

            const filename = path.basename(
                decodeURIComponent(
                    url.pathname.replace("/posters/", "")
                )
            );

            /*
             * Only allow JPG/JPEG/PNG/WebP files.
             */
            if (!/\.(jpg|jpeg|png|webp)$/i.test(filename)) {
                res.writeHead(403);
                res.end("Forbidden");
                return;
            }

            const filePath = path.join(
                CACHE_DIR,
                filename
            );

            if (!fs.existsSync(filePath)) {
                res.writeHead(404);
                res.end("Image Not Found");
                return;
            }

            const ext = path
                .extname(filename)
                .toLowerCase();

            const contentTypes: Record<string, string> = {
                ".jpg": "image/jpeg",
                ".jpeg": "image/jpeg",
                ".png": "image/png",
                ".webp": "image/webp"
            };

            res.writeHead(200, {
                "Content-Type":
                    contentTypes[ext] || "application/octet-stream",

                "Cache-Control":
                    "public, max-age=31536000, immutable",

                "Access-Control-Allow-Origin": "*"
            });

            fs.createReadStream(filePath).pipe(res);

        } catch (error) {

            console.error(
                "[ImageServer] Error:",
                error
            );

            res.writeHead(500);
            res.end("Internal Server Error");
        }
    });

    server.listen(
        PORT,
        "0.0.0.0",
        () => {
            console.log(
                `[ImageServer] Listening on 0.0.0.0:${PORT}`
            );

            console.log(
                `[ImageServer] Public URL: https://images.keekay.cloud`
            );
        }
    );
}