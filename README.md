# Stream Deck Dynamic Soundboard

A dynamic soundboard plugin for Elgato Stream Deck that automatically loads sounds from folders and allows navigation through categories.

## Features

- **Dynamic Sound Loading**: Automatically scans folders and displays sounds
- **Category Navigation**: Organize sounds in folders/subfolders as categories
- **Pagination**: Navigate through pages when you have many sounds
- **Custom Icons**: Add custom images for sounds and categories
- **Volume Control**: Global volume adjustment with encoder support
- **Favorites**: Mark sounds as favorites for quick access
- **Custom Titles**: Rename sounds and categories without changing file names

## Supported Formats

**Audio**: `.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`, `.aac`

**Images** (for custom icons): `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`

## Installation

1. Download the latest release
2. Double-click the `.streamDeckPlugin` file to install
3. The plugin will appear in Stream Deck under the "Sound" category

## Setting Up Your Profile

### Recommended Layout (Stream Deck XL - 32 keys)

The plugin is designed to work with **27 Sound Slots** per page, leaving room for navigation buttons.

#### Creating the Profile

1. **Open Stream Deck software**
2. **Create a new profile** for the soundboard
3. **Add Sound Slots**: Drag "Sound Slot" actions from the plugin to fill your grid
4. **Configure each slot**: Click on each Sound Slot and set its `slotIndex` (0-26 for 27 slots)
5. **Add navigation buttons**:
   - **Back**: Returns to parent category or home
   - **Previous Page**: Navigate to previous page
   - **Next Page**: Navigate to next page
   - **Volume**: Control global volume (works great with Stream Deck+ encoder)
   - **Stop All**: Stop all currently playing sounds

#### Slot Index Configuration

Each Sound Slot needs a unique `slotIndex` value:
- Slot indices start at `0`
- For a 27-slot layout, use indices `0` through `26`
- Slots display content based on current navigation and page

**Example layout for Stream Deck XL (8x4):**
```
[ 0][ 1][ 2][ 3][ 4][ 5][ 6][ 7]
[ 8][ 9][10][11][12][13][14][15]
[16][17][18][19][20][21][22][23]
[24][25][26][Back][Prev][Next][Vol][Stop]
```

### Smaller Stream Decks

For Stream Deck (15 keys) or Mini (6 keys), adjust the number of slots accordingly:
- **Stream Deck 15**: Use 11-12 slots + navigation
- **Stream Deck Mini**: Use 4-5 slots + Back button

## Setting Up Your Sound Library

### Folder Structure

Create a root folder for your sounds with this structure:

```
Soundboard/
├── Music/
│   ├── song1.mp3
│   ├── song2.mp3
│   └── song2.png          (custom icon for song2)
├── Sound Effects/
│   ├── _icon.png          (category icon)
│   ├── explosion.wav
│   ├── laser.mp3
│   └── Alerts/            (subcategory)
│       ├── alarm.mp3
│       └── notification.wav
├── Memes/
│   ├── _icon.gif          (animated category icon!)
│   ├── bruh.mp3
│   └── bruh.jpg           (custom icon for bruh sound)
└── _meta.json             (optional: global settings)
```

### Configuration in Stream Deck

1. Click on any **Sound Slot** action
2. In the Property Inspector, set the **Root Folder** to your soundboard folder
3. The plugin will automatically scan and display your categories

### Custom Icons

- **For sounds**: Place an image with the same name as the sound file
  - `explosion.mp3` + `explosion.png` = custom icon for that sound
- **For categories**: Place a `_icon.png` (or .jpg, .gif, etc.) inside the folder

### Metadata Files (Optional)

You can create `_meta.json` files to customize sounds and categories:

**For sounds** (in the same folder):
```json
{
  "sounds": {
    "mysound.mp3": {
      "title": "Custom Display Name",
      "volume": 0.8,
      "favorite": true
    }
  }
}
```

**For categories** (inside the category folder):
```json
{
  "displayName": "Cool Sounds",
  "titleStyle": {
    "show": true,
    "color": "#ffffff",
    "position": "bottom"
  }
}
```

## Usage

### Basic Navigation

1. **Home View**: Shows root categories (and Favorites if any exist)
2. **Click a category**: Enter that category to see its sounds and subcategories
3. **Click a sound**: Play the sound
4. **Click Back**: Return to parent category or home
5. **Use Prev/Next**: Navigate pages when content exceeds slot count

### Volume Control

- **Rotate encoder** (Stream Deck+): Adjust volume smoothly
- **Press encoder/button**: Toggle mute
- Volume affects all sounds globally

### Favorites

Mark sounds as favorites via the Property Inspector or `_meta.json`. Favorites appear in a special "Favorites" category at home.

## Building from Source

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# The compiled plugin is in com.music-assistant.soundboard.sdPlugin/
```

## License

MIT

## Credits

Built with the [Elgato Stream Deck SDK](https://developer.elgato.com/documentation/stream-deck/).
