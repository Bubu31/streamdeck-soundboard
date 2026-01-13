import * as fs from "node:fs";
import * as path from "node:path";

interface OldProfile {
  Name: string;
  ProfileImagePath: string;
  SoundPaths: string[];
  SoundImagePaths: Record<string, string>;
  SoundVolumes: Record<string, number>;
  SoundCustomNames: Record<string, string>;
}

interface SoundMetadata {
  title?: string;
  volume?: number;
  icon?: string;
  favorite?: boolean;
}

const SOURCE_DIR = "E:\\Soundboard\\profiles";
const DEST_DIR = "E:\\Soundboard\\library";

async function migrate() {
  console.log("Starting migration...");
  console.log(`Source: ${SOURCE_DIR}`);
  console.log(`Destination: ${DEST_DIR}`);

  // Create destination folder
  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
    console.log(`Created destination folder: ${DEST_DIR}`);
  }

  // Get all profile JSON files (not in Backups folder)
  const entries = fs.readdirSync(SOURCE_DIR, { withFileTypes: true });
  const profileFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => e.name);

  console.log(`Found ${profileFiles.length} profile files to migrate`);

  let totalSounds = 0;
  let copiedSounds = 0;
  let skippedSounds = 0;

  for (const profileFile of profileFiles) {
    const profilePath = path.join(SOURCE_DIR, profileFile);
    console.log(`\nProcessing: ${profileFile}`);

    try {
      const content = fs.readFileSync(profilePath, "utf-8");
      const profile: OldProfile = JSON.parse(content);

      // Create category folder
      const categoryName = sanitizeFolderName(profile.Name);
      const categoryPath = path.join(DEST_DIR, categoryName);

      if (!fs.existsSync(categoryPath)) {
        fs.mkdirSync(categoryPath, { recursive: true });
        console.log(`  Created category: ${categoryName}`);
      }

      // Copy profile icon as _icon.{ext}
      if (profile.ProfileImagePath && fs.existsSync(profile.ProfileImagePath)) {
        const iconExt = path.extname(profile.ProfileImagePath);
        const destIconPath = path.join(categoryPath, `_icon${iconExt}`);
        if (!fs.existsSync(destIconPath)) {
          fs.copyFileSync(profile.ProfileImagePath, destIconPath);
          console.log(`  Copied icon: _icon${iconExt}`);
        }
      }

      // Copy sounds
      for (const soundPath of profile.SoundPaths) {
        totalSounds++;

        if (!fs.existsSync(soundPath)) {
          console.log(`  [SKIP] Sound not found: ${path.basename(soundPath)}`);
          skippedSounds++;
          continue;
        }

        const soundFilename = path.basename(soundPath);
        const destSoundPath = path.join(categoryPath, soundFilename);

        // Copy sound file if not already exists
        if (!fs.existsSync(destSoundPath)) {
          fs.copyFileSync(soundPath, destSoundPath);
          copiedSounds++;
          console.log(`  Copied sound: ${soundFilename}`);
        } else {
          console.log(`  [EXISTS] ${soundFilename}`);
        }

        // Create metadata JSON if needed
        const volume = profile.SoundVolumes?.[soundPath] ?? 1.0;
        const customName = profile.SoundCustomNames?.[soundPath] ?? "";
        const customImage = profile.SoundImagePaths?.[soundPath] ?? "";

        const metadata: SoundMetadata = {};

        if (customName && customName.trim() !== "") {
          metadata.title = customName.trim();
        }

        if (volume !== 1.0) {
          metadata.volume = volume;
        }

        // Copy sound icon if exists
        if (customImage && customImage.trim() !== "" && fs.existsSync(customImage)) {
          const soundBaseName = path.basename(soundFilename, path.extname(soundFilename));
          const imageExt = path.extname(customImage);
          const destImagePath = path.join(categoryPath, `${soundBaseName}${imageExt}`);

          if (!fs.existsSync(destImagePath)) {
            fs.copyFileSync(customImage, destImagePath);
            console.log(`    Copied image: ${soundBaseName}${imageExt}`);
          }
        }

        // Write metadata JSON if has any properties
        if (Object.keys(metadata).length > 0) {
          const soundBaseName = path.basename(soundFilename, path.extname(soundFilename));
          const metadataPath = path.join(categoryPath, `${soundBaseName}.json`);
          fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
          console.log(`    Created metadata: ${soundBaseName}.json`);
        }
      }
    } catch (error) {
      console.error(`  [ERROR] Failed to process ${profileFile}:`, error);
    }
  }

  console.log("\n=== Migration Complete ===");
  console.log(`Total sounds: ${totalSounds}`);
  console.log(`Copied: ${copiedSounds}`);
  console.log(`Skipped (not found): ${skippedSounds}`);
  console.log(`Destination: ${DEST_DIR}`);
}

function sanitizeFolderName(name: string): string {
  // Remove or replace invalid Windows folder characters
  return name
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

migrate().catch(console.error);
