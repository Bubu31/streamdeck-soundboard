import type { TitleStyle, FolderBorderStyle } from "../types.js";
export declare const DEFAULT_TITLE_STYLE: TitleStyle;
export declare const DEFAULT_FOLDER_BORDER: FolderBorderStyle;
export declare function overlayTitleOnImage(imageBase64: string, title: string, style?: TitleStyle, isFolder?: boolean, folderBorder?: FolderBorderStyle, isPlaying?: boolean): string;
export declare function imageToBase64(imagePath: string): Promise<string | null>;
export declare function generateCategoryIcon(name: string): string;
export declare function generateFavoriteIcon(): string;
export declare function generateSoundIcon(title: string, isPlaying?: boolean): string;
export declare function generateEmptyIcon(): string;
//# sourceMappingURL=image-converter.d.ts.map