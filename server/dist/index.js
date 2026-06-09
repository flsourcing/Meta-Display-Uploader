import cors from "cors";
import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { getYouTubeEmbedUrl } from "./code.js";
import { migrate } from "./db.js";
import { createSession, getSessionByCode, pruneStaleSessions, refreshSession, setSessionMedia, } from "./session-store.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "..", "uploads");
const port = Number(process.env.PORT ?? 8080);
function getPublicBaseUrl() {
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
    }
    if (process.env.PUBLIC_URL) {
        return process.env.PUBLIC_URL.replace(/\/$/, "");
    }
    return `http://localhost:${port}`;
}
function getAllowedOrigins() {
    const configured = process.env.CORS_ORIGIN?.split(",").map((value) => value.trim());
    if (configured?.length)
        return configured;
    return true;
}
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const extension = path.extname(file.originalname) || ".bin";
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
});
async function start() {
    fs.mkdirSync(uploadDir, { recursive: true });
    await migrate();
    const app = express();
    const publicBaseUrl = getPublicBaseUrl();
    app.use(express.json());
    app.use(cors({
        origin: getAllowedOrigins(),
    }));
    app.use("/uploads", express.static(uploadDir, {
        maxAge: "1d",
        setHeaders(res) {
            res.setHeader("Cache-Control", "public, max-age=86400");
        },
    }));
    app.get("/health", (_req, res) => {
        res.json({ ok: true });
    });
    app.post("/api/session", async (_req, res) => {
        try {
            await pruneStaleSessions();
            const session = await createSession();
            res.json(session);
        }
        catch (error) {
            res.status(500).json({
                error: error instanceof Error ? error.message : "Could not create session.",
            });
        }
    });
    app.get("/api/session", async (req, res) => {
        try {
            await pruneStaleSessions();
            const sessionId = String(req.query.id ?? "");
            if (!sessionId) {
                res.status(400).json({ error: "Session id is required." });
                return;
            }
            const session = await refreshSession(sessionId);
            if (!session) {
                res.status(404).json({ error: "Session not found." });
                return;
            }
            res.json(session);
        }
        catch (error) {
            res.status(500).json({
                error: error instanceof Error ? error.message : "Could not load session.",
            });
        }
    });
    app.post("/api/upload", upload.single("file"), async (req, res) => {
        try {
            const code = String(req.body.code ?? "").trim();
            const videoUrl = String(req.body.videoUrl ?? "").trim();
            const youtubeUrl = String(req.body.youtubeUrl ?? "").trim();
            const file = req.file;
            if (!/^\d{6}$/.test(code)) {
                res.status(400).json({ error: "Enter the current 6-digit code shown on the glasses." });
                return;
            }
            const session = await getSessionByCode(code);
            if (!session) {
                res.status(404).json({
                    error: "That code is not active. Check the glasses and try again.",
                });
                return;
            }
            let media;
            if (file) {
                const mime = file.mimetype;
                let type;
                if (mime.startsWith("image/")) {
                    type = "image";
                }
                else if (mime.startsWith("video/")) {
                    type = "video";
                }
                else {
                    res.status(400).json({ error: "Only photo and video files are supported." });
                    return;
                }
                media = {
                    type,
                    url: `${publicBaseUrl}/uploads/${file.filename}`,
                    originalName: file.originalname,
                    uploadedAt: Date.now(),
                };
            }
            else if (youtubeUrl) {
                const embedUrl = getYouTubeEmbedUrl(youtubeUrl);
                if (!embedUrl) {
                    res.status(400).json({ error: "Could not read that YouTube link." });
                    return;
                }
                media = {
                    type: "youtube",
                    url: embedUrl,
                    originalName: youtubeUrl,
                    uploadedAt: Date.now(),
                };
            }
            else if (videoUrl) {
                try {
                    new URL(videoUrl);
                }
                catch {
                    res.status(400).json({ error: "Enter a valid video URL." });
                    return;
                }
                media = {
                    type: "video-url",
                    url: videoUrl,
                    originalName: videoUrl,
                    uploadedAt: Date.now(),
                };
            }
            else {
                res.status(400).json({ error: "Upload a file or provide a video / YouTube URL." });
                return;
            }
            const updated = await setSessionMedia(code, media);
            res.json({ ok: true, session: updated });
        }
        catch (error) {
            res.status(500).json({
                error: error instanceof Error ? error.message : "Upload failed.",
            });
        }
    });
    app.get("/api/upload", async (req, res) => {
        try {
            const code = String(req.query.code ?? "").trim();
            if (!/^\d{6}$/.test(code)) {
                res.status(400).json({ error: "Invalid code." });
                return;
            }
            const session = await getSessionByCode(code);
            if (!session) {
                res.status(404).json({ error: "Code not found." });
                return;
            }
            res.json({ ok: true, session });
        }
        catch (error) {
            res.status(500).json({
                error: error instanceof Error ? error.message : "Could not load upload session.",
            });
        }
    });
    app.listen(port, () => {
        console.log(`Meta Display API listening on ${publicBaseUrl}`);
    });
}
start().catch((error) => {
    console.error(error);
    process.exit(1);
});
