import * as fs from "node:fs";
import * as path from "node:path";
const STREAM_DECK_ICON_SIZE = 144;
export const DEFAULT_TITLE_STYLE = {
    show: true,
    color: "#ffffff",
    fontSize: 16,
    position: "bottom",
    background: true,
    backgroundColor: "rgba(0,0,0,0.7)",
};
export const DEFAULT_FOLDER_BORDER = {
    enabled: true,
    color: "#74b9ff",
    opacity: 0.9,
    size: 4,
};
export function overlayTitleOnImage(imageBase64, title, style = DEFAULT_TITLE_STYLE, isFolder = false, folderBorder = DEFAULT_FOLDER_BORDER, isPlaying = false) {
    const mergedStyle = { ...DEFAULT_TITLE_STYLE, ...style };
    const mergedBorder = { ...DEFAULT_FOLDER_BORDER, ...folderBorder };
    const fontSize = mergedStyle.fontSize || 16;
    const color = mergedStyle.color || "#ffffff";
    const position = mergedStyle.position || "bottom";
    const showBg = mergedStyle.background !== false;
    const bgColor = mergedStyle.backgroundColor || "rgba(0,0,0,0.7)";
    // Calculate Y position based on position setting
    let textY;
    let bgY;
    const bgHeight = fontSize + 12;
    switch (position) {
        case "top":
            textY = fontSize + 8;
            bgY = 0;
            break;
        case "center":
            textY = (STREAM_DECK_ICON_SIZE + fontSize) / 2 - 4;
            bgY = (STREAM_DECK_ICON_SIZE - bgHeight) / 2;
            break;
        case "bottom":
        default:
            textY = STREAM_DECK_ICON_SIZE - 10;
            bgY = STREAM_DECK_ICON_SIZE - bgHeight;
            break;
    }
    // Truncate title if too long
    const maxChars = Math.floor((STREAM_DECK_ICON_SIZE - 10) / (fontSize * 0.6));
    const displayTitle = title.length > maxChars ? title.substring(0, maxChars - 1) + "…" : title;
    // Folder border - draw a border around the entire image
    let folderBorderSvg = "";
    if (isFolder && mergedBorder.enabled) {
        const borderSize = mergedBorder.size || 4;
        const borderColor = mergedBorder.color || "#74b9ff";
        const borderOpacity = mergedBorder.opacity ?? 0.9;
        const halfBorder = borderSize / 2;
        folderBorderSvg = `<rect x="${halfBorder}" y="${halfBorder}" width="${STREAM_DECK_ICON_SIZE - borderSize}" height="${STREAM_DECK_ICON_SIZE - borderSize}" fill="none" stroke="${borderColor}" stroke-width="${borderSize}" opacity="${borderOpacity}" rx="20"/>`;
    }
    // Playing indicator - equalizer bars effect
    let playingOverlay = "";
    if (isPlaying) {
        const barCount = 5;
        const barWidth = 8;
        const barGap = 4;
        const totalWidth = barCount * barWidth + (barCount - 1) * barGap;
        const startX = (STREAM_DECK_ICON_SIZE - totalWidth) / 2;
        const maxBarHeight = 40;
        const barHeights = [0.6, 1, 0.75, 0.9, 0.5]; // Different heights for visual effect
        const equalizerY = position === "bottom" ? bgY - maxBarHeight - 8 : STREAM_DECK_ICON_SIZE - maxBarHeight - 12;
        let bars = "";
        for (let i = 0; i < barCount; i++) {
            const barHeight = maxBarHeight * barHeights[i];
            const x = startX + i * (barWidth + barGap);
            const y = equalizerY + (maxBarHeight - barHeight);
            bars += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="#00b894" rx="2" opacity="0.9"/>`;
        }
        playingOverlay = `
      <rect x="${startX - 8}" y="${equalizerY - 4}" width="${totalWidth + 16}" height="${maxBarHeight + 8}" fill="rgba(0,0,0,0.5)" rx="6"/>
      ${bars}
    `;
    }
    // Create text overlay (only if show is true and title exists)
    let textOverlay = "";
    if (mergedStyle.show && title) {
        const bgRect = showBg
            ? `<rect x="0" y="${bgY}" width="${STREAM_DECK_ICON_SIZE}" height="${bgHeight}" fill="${bgColor}"/>`
            : "";
        textOverlay = `${bgRect}
    <text x="${STREAM_DECK_ICON_SIZE / 2}" y="${textY}" font-family="Arial,sans-serif" font-size="${fontSize}" fill="${color}" text-anchor="middle" font-weight="bold">${escapeXml(displayTitle)}</text>`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${STREAM_DECK_ICON_SIZE}" height="${STREAM_DECK_ICON_SIZE}" viewBox="0 0 ${STREAM_DECK_ICON_SIZE} ${STREAM_DECK_ICON_SIZE}">
    <image xlink:href="${imageBase64}" width="${STREAM_DECK_ICON_SIZE}" height="${STREAM_DECK_ICON_SIZE}" preserveAspectRatio="xMidYMid slice"/>
    ${playingOverlay}
    ${textOverlay}
    ${folderBorderSvg}
  </svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
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
    // Icon centered at y=75 (baseline), label at y=125
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${STREAM_DECK_ICON_SIZE}" height="${STREAM_DECK_ICON_SIZE}" viewBox="0 0 ${STREAM_DECK_ICON_SIZE} ${STREAM_DECK_ICON_SIZE}"><rect width="${STREAM_DECK_ICON_SIZE}" height="${STREAM_DECK_ICON_SIZE}" fill="#000000"/><text x="72" y="75" font-family="Arial,sans-serif" font-size="64" font-weight="bold" fill="#74b9ff" text-anchor="middle">${escapeXml(firstLetter)}</text><text x="72" y="125" font-family="Arial,sans-serif" font-size="16" fill="#b2bec3" text-anchor="middle">${escapeXml(truncateText(name, 12))}</text></svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
export function generateFavoriteIcon() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${STREAM_DECK_ICON_SIZE}" height="${STREAM_DECK_ICON_SIZE}" viewBox="0 0 ${STREAM_DECK_ICON_SIZE} ${STREAM_DECK_ICON_SIZE}"><rect width="${STREAM_DECK_ICON_SIZE}" height="${STREAM_DECK_ICON_SIZE}" fill="#000000"/><text x="72" y="75" font-family="Arial,sans-serif" font-size="64" fill="#fdcb6e" text-anchor="middle">★</text><text x="72" y="125" font-family="Arial,sans-serif" font-size="16" fill="#b2bec3" text-anchor="middle">Favoris</text></svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
export function generateSoundIcon(title, isPlaying = false) {
    const bgColor = isPlaying ? "#00b894" : "#0984e3";
    const icon = isPlaying ? "▶" : "♪";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${STREAM_DECK_ICON_SIZE}" height="${STREAM_DECK_ICON_SIZE}" viewBox="0 0 ${STREAM_DECK_ICON_SIZE} ${STREAM_DECK_ICON_SIZE}"><rect width="${STREAM_DECK_ICON_SIZE}" height="${STREAM_DECK_ICON_SIZE}" fill="${bgColor}"/><text x="72" y="70" font-family="Arial,sans-serif" font-size="48" fill="#ffffff" text-anchor="middle">${icon}</text><text x="72" y="125" font-family="Arial,sans-serif" font-size="14" fill="#ffffff" text-anchor="middle">${escapeXml(truncateText(title, 14))}</text></svg>`;
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