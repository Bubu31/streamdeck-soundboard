import * as fs from "node:fs";
import * as path from "node:path";
const STREAM_DECK_ICON_SIZE = 144;
export async function imageToBase64(imagePath) {
    try {
        if (!fs.existsSync(imagePath)) {
            return null;
        }
        const buffer = await fs.promises.readFile(imagePath);
        const ext = path.extname(imagePath).toLowerCase();
        let mimeType;
        switch (ext) {
            case ".png":
                mimeType = "image/png";
                break;
            case ".jpg":
            case ".jpeg":
                mimeType = "image/jpeg";
                break;
            case ".gif":
                mimeType = "image/gif";
                break;
            case ".webp":
                mimeType = "image/webp";
                break;
            default:
                mimeType = "image/png";
        }
        const base64 = buffer.toString("base64");
        return `data:${mimeType};base64,${base64}`;
    }
    catch (error) {
        console.error(`Error converting image to base64: ${imagePath}`, error);
        return null;
    }
}
export function generateCategoryIcon(name) {
    const firstLetter = name.charAt(0).toUpperCase();
    // Use black background to match Stream Deck's default button background
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${STREAM_DECK_ICON_SIZE}" height="${STREAM_DECK_ICON_SIZE}" viewBox="0 0 ${STREAM_DECK_ICON_SIZE} ${STREAM_DECK_ICON_SIZE}"><rect width="${STREAM_DECK_ICON_SIZE}" height="${STREAM_DECK_ICON_SIZE}" fill="#000000"/><text x="72" y="58" font-family="Arial,sans-serif" font-size="64" font-weight="bold" fill="#74b9ff" text-anchor="middle" dominant-baseline="middle">${escapeXml(firstLetter)}</text><text x="72" y="108" font-family="Arial,sans-serif" font-size="16" fill="#b2bec3" text-anchor="middle" dominant-baseline="middle">${escapeXml(truncateText(name, 12))}</text></svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
export function generateFavoriteIcon() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${STREAM_DECK_ICON_SIZE}" height="${STREAM_DECK_ICON_SIZE}" viewBox="0 0 ${STREAM_DECK_ICON_SIZE} ${STREAM_DECK_ICON_SIZE}"><rect width="${STREAM_DECK_ICON_SIZE}" height="${STREAM_DECK_ICON_SIZE}" fill="#000000"/><text x="72" y="58" font-family="Arial,sans-serif" font-size="64" fill="#fdcb6e" text-anchor="middle" dominant-baseline="middle">★</text><text x="72" y="108" font-family="Arial,sans-serif" font-size="16" fill="#b2bec3" text-anchor="middle" dominant-baseline="middle">Favoris</text></svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
export function generateSoundIcon(title, isPlaying = false) {
    const bgColor = isPlaying ? "#00b894" : "#0984e3";
    const icon = isPlaying ? "▶" : "♪";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${STREAM_DECK_ICON_SIZE}" height="${STREAM_DECK_ICON_SIZE}" viewBox="0 0 ${STREAM_DECK_ICON_SIZE} ${STREAM_DECK_ICON_SIZE}"><rect width="${STREAM_DECK_ICON_SIZE}" height="${STREAM_DECK_ICON_SIZE}" fill="${bgColor}"/><text x="72" y="58" font-family="Arial,sans-serif" font-size="48" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${icon}</text><text x="72" y="108" font-family="Arial,sans-serif" font-size="14" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${escapeXml(truncateText(title, 14))}</text></svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
export function generateEmptyIcon() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${STREAM_DECK_ICON_SIZE}" height="${STREAM_DECK_ICON_SIZE}" viewBox="0 0 ${STREAM_DECK_ICON_SIZE} ${STREAM_DECK_ICON_SIZE}"><rect width="${STREAM_DECK_ICON_SIZE}" height="${STREAM_DECK_ICON_SIZE}" fill="#000000"/></svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
function truncateText(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength - 1) + "…";
}
function escapeXml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}
//# sourceMappingURL=image-converter.js.map