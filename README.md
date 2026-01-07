# Seznam Creative Validator

A client-side tool for validating advertising banners against Seznam network specifications (Adform, SOS, Onegar, Sklik, HP Exclusive).

## Features

- **Multi-format upload**: Drag-and-drop support for images, folders, and ZIP archives
- **Automatic validation**: Checks banner dimensions, file sizes, and color spaces against network specs
- **Smart system detection**: Automatically assigns banners to networks based on folder structure
- **UTM URL generation**: Creates properly tagged tracking URLs for each network
- **Export packages**: Generates ZIP files with renamed banners and upload instructions

## Usage

1. Open `index.html` in a web browser
2. Upload your banner files (supports JPG, PNG, GIF)
3. Review validation results for each advertising network
4. Configure campaign settings and select networks
5. Download export packages with renamed files and tracking URLs

## Development

No build process required - this is a pure vanilla JavaScript application.

To run locally:
```bash
python3 -m http.server 8000
# or
npx serve
```

Then open http://localhost:8000

## Tech Stack

- Vanilla JavaScript (ES6+)
- HTML5 File APIs for drag-and-drop
- JSZip library for ZIP file handling
- CSS3 for responsive design
