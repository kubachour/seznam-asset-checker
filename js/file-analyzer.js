// File Analysis Module for Creative Validator
// Handles dimension detection, color space validation, and file analysis

/**
 * Read image dimensions using Image API
 * @param {File} file - Image file
 * @returns {Promise<{width: number, height: number}>}
 */
async function readImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const dimensions = {
        width: img.naturalWidth,
        height: img.naturalHeight
      };
      URL.revokeObjectURL(url);
      resolve(dimensions);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}


/**
 * Check color space of an image (RGB vs CMYK)
 * Uses canvas API to detect CMYK color space
 * @param {File} file - Image file
 * @returns {Promise<{colorSpace: string, isValid: boolean}>}
 */
async function checkColorSpace(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;

        // For JPEG files, check APP14 marker for CMYK
        if (file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
          const isCMYK = checkJPEGColorSpace(arrayBuffer);
          resolve({
            colorSpace: isCMYK ? 'CMYK' : 'RGB',
            isValid: !isCMYK
          });
          return;
        }

        // For other formats, try canvas method
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = Math.min(img.width, 100); // Sample size
            canvas.height = Math.min(img.height, 100);
            const ctx = canvas.getContext('2d');

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // If we can draw to canvas successfully, it's likely RGB
            // CMYK images would typically fail or show incorrect colors
            URL.revokeObjectURL(url);
            resolve({
              colorSpace: 'RGB',
              isValid: true
            });
          } catch (err) {
            URL.revokeObjectURL(url);
            // If canvas fails, might be CMYK or other issue
            resolve({
              colorSpace: 'Unknown',
              isValid: false
            });
          }
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve({
            colorSpace: 'Unknown',
            isValid: false
          });
        };

        img.src = url;
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Check JPEG file for CMYK color space using APP14 marker
 * @param {ArrayBuffer} arrayBuffer - JPEG file data
 * @returns {boolean} True if CMYK detected
 */
function checkJPEGColorSpace(arrayBuffer) {
  const view = new DataView(arrayBuffer);

  // Check JPEG signature
  if (view.getUint16(0) !== 0xFFD8) {
    return false; // Not a JPEG
  }

  let offset = 2;

  // Scan for APP14 marker (0xFFEE) which contains color space info
  while (offset < view.byteLength - 1) {
    const marker = view.getUint16(offset);

    if (marker === 0xFFEE) {
      // Found APP14 marker
      // Check if it's Adobe marker
      offset += 2;
      const length = view.getUint16(offset);
      offset += 2;

      if (length >= 12) {
        // Check for "Adobe" string
        const isAdobe =
          view.getUint8(offset) === 0x41 && // 'A'
          view.getUint8(offset + 1) === 0x64 && // 'd'
          view.getUint8(offset + 2) === 0x6F && // 'o'
          view.getUint8(offset + 3) === 0x62 && // 'b'
          view.getUint8(offset + 4) === 0x65; // 'e'

        if (isAdobe) {
          // Color transform byte is at offset + 11
          const colorTransform = view.getUint8(offset + 11);
          // 0 = CMYK, 1 = YCbCr (RGB), 2 = YCCK
          return colorTransform === 0 || colorTransform === 2;
        }
      }
      return false;
    }

    // Skip to next marker
    if ((marker & 0xFF00) !== 0xFF00) {
      break; // Invalid marker
    }

    offset += 2;
    if (marker !== 0xFFD8 && marker !== 0xFFD9) {
      // Read segment length and skip
      if (offset >= view.byteLength - 1) break;
      const segmentLength = view.getUint16(offset);
      offset += segmentLength;
    }
  }

  return false; // CMYK not detected
}


/**
 * Determine file format type
 * @param {File} file - File object
 * @returns {string} File type: 'image', 'zip', or 'unknown'
 */
function getFileFormat(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  const mimeType = file.type.toLowerCase();

  // Check if it's an image
  if (['jpg', 'jpeg', 'png', 'gif'].includes(extension) || mimeType.startsWith('image/')) {
    return 'image';
  }

  // Check if it's a ZIP file
  if (extension === 'zip' || mimeType === 'application/zip' || mimeType === 'application/x-zip-compressed') {
    return 'zip';
  }

  return 'unknown';
}

/**
 * Generate base64 preview/thumbnail for a file
 * @param {File} file - File object
 * @param {string} fileType - File type (image)
 * @returns {Promise<string>} Base64 data URL
 */
async function generatePreview(file, fileType) {
  if (fileType === 'image') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Unknown file type
  return Promise.resolve('');
}

/**
 * Analyze a file completely
 * Detects dimensions, format, size, color space
 * @param {File} file - File to analyze
 * @returns {Promise<Object>} Analysis result object
 */
async function analyzeFile(file) {
  const fileType = getFileFormat(file);
  const extension = file.name.split('.').pop().toLowerCase();

  const analysis = {
    name: file.name,
    originalName: file.name,
    format: extension,
    fileType: fileType,
    size: file.size, // bytes
    sizeKB: Math.round(file.size / 1024),
    file: file,
    dimensions: null,
    width: null,
    height: null,
    colorSpace: 'Unknown',
    colorSpaceValid: true,
    preview: null
  };

  try {
    // Get dimensions and color space for images only
    if (fileType === 'image') {
      const dims = await readImageDimensions(file);
      analysis.width = dims.width;
      analysis.height = dims.height;
      analysis.dimensions = `${dims.width}x${dims.height}`;

      // Check color space for images
      const colorSpaceInfo = await checkColorSpace(file);
      analysis.colorSpace = colorSpaceInfo.colorSpace;
      analysis.colorSpaceValid = colorSpaceInfo.isValid;

      // Generate preview
      analysis.preview = await generatePreview(file, fileType);
    }
  } catch (error) {
    console.error(`Error analyzing file ${file.name}:`, error);
    analysis.error = error.message;
  }

  return analysis;
}

/**
 * Analyze multiple files in parallel
 * @param {FileList|Array<File>} files - Files to analyze
 * @param {Function} progressCallback - Optional callback for progress updates
 * @returns {Promise<Array>} Array of analysis results
 */
async function analyzeFiles(files, progressCallback = null) {
  const fileArray = Array.from(files);
  const results = [];

  for (let i = 0; i < fileArray.length; i++) {
    const analysis = await analyzeFile(fileArray[i]);
    results.push(analysis);

    if (progressCallback) {
      progressCallback({
        current: i + 1,
        total: fileArray.length,
        percentage: Math.round(((i + 1) / fileArray.length) * 100),
        file: fileArray[i].name
      });
    }
  }

  return results;
}


// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    readImageDimensions,
    checkColorSpace,
    getFileFormat,
    generatePreview,
    analyzeFile,
    analyzeFiles
  };
}
