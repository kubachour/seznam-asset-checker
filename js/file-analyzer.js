// File Analysis Module for Creative Validator
// Handles dimension detection, color space validation, and file analysis

// =============================================================================
// MODULE DEPENDENCY CHECK
// =============================================================================
if (typeof FILE_TYPES === 'undefined' || typeof FileTypeHelpers === 'undefined') {
  console.error('file-analyzer.js: FILE_TYPES or FileTypeHelpers not found. Ensure file-types.js is loaded before this module.');
}

/**
 * Read image dimensions using Image API
 * @param {File} file - Image file
 * @returns {Promise<{width: number, height: number}>}
 */
async function readImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    const IMAGE_LOAD_TIMEOUT = 10000; // 10 seconds timeout for corrupted/slow images

    // Set up timeout to prevent indefinite hanging on corrupted images
    const timeoutId = setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error(`Image load timeout after ${IMAGE_LOAD_TIMEOUT / 1000}s`));
    }, IMAGE_LOAD_TIMEOUT);

    img.onload = () => {
      clearTimeout(timeoutId);
      const dimensions = {
        width: img.naturalWidth,
        height: img.naturalHeight
      };
      URL.revokeObjectURL(url);
      resolve(dimensions);
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
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
 * @returns {string} File type: 'image', 'html', 'zip', or 'unknown'
 */
function getFileFormat(file) {
  const extension = FileTypeHelpers.getExtension(file.name);
  const mimeType = file.type.toLowerCase();

  // Check if it's an image (use centralized constants)
  if (FileTypeHelpers.isImageExtension(extension) || mimeType.startsWith(FILE_TYPES.MIME_TYPES.IMAGE_PREFIX)) {
    return FILE_TYPES.TYPES.IMAGE;
  }

  // Check if it's an HTML file (NEWLY ADDED)
  if (FileTypeHelpers.isHTMLExtension(extension) || FILE_TYPES.MIME_TYPES.HTML.includes(mimeType)) {
    return FILE_TYPES.TYPES.HTML;
  }

  // Check if it's a ZIP file
  if (FileTypeHelpers.isArchiveExtension(extension) || FILE_TYPES.MIME_TYPES.ZIP.includes(mimeType)) {
    return FILE_TYPES.TYPES.ZIP;
  }

  return FILE_TYPES.TYPES.UNKNOWN;
}

// =============================================================================
// FORMAT DETECTION PATTERNS (Data-driven approach for DRY code)
// =============================================================================

/**
 * Format detection patterns - defines keywords and their mappings
 * Each pattern has: keywords (array), format, system, confidence
 */
const FORMAT_PATTERNS = [
  // Social media (exclude from all ad systems)
  { keywords: ['social-media', 'facebook', 'linkedin', 'twitter', 'instagram', 'tiktok'], format: 'social-media', system: null, confidence: 'high', isSocialMedia: true },

  // SOS-exclusive formats (high confidence)
  { keywords: ['spincube', 'spin-cube'], format: 'spincube', system: 'SOS', confidence: 'high' },
  { keywords: ['inarticle', 'in-article', 'in-articl'], format: 'inarticle', system: 'SOS', confidence: 'high' },
  { keywords: ['exclusive'], format: 'exclusive', system: 'SOS', confidence: 'high' },
  { keywords: ['spinner'], format: 'spinner', system: 'SOS', confidence: 'high' },

  // Branding variants (standalone keywords for backward compatibility)
  { keywords: ['scratcher', 'scratch'], format: 'branding-scratcher', system: 'SOS', confidence: 'high' },
  { keywords: ['uncover'], format: 'branding-uncover', system: 'SOS', confidence: 'high' },
  { keywords: ['videopanel'], format: 'branding-videopanel', system: 'SOS', confidence: 'high' },

  // Multi-system formats
  { keywords: ['interscroller', 'inter-scroller'], format: 'interscroller', system: null, confidence: 'high' },
  { keywords: ['kombi'], format: 'kombi', system: null, confidence: 'medium' },
  { keywords: ['html5', 'html-5'], format: 'html5-banner', system: null, confidence: 'medium' },

  // Google Ads / UAC
  { keywords: ['uac', 'google-ads', 'googleads'], format: 'uac', system: 'GOOGLE_ADS', confidence: 'high' }
];

/**
 * Branding sub-type mappings for special handling
 */
const BRANDING_SUBTYPES = {
  'scratcher': 'branding-scratcher',
  'scratch': 'branding-scratcher',
  'uncover': 'branding-uncover',
  'videopanel': 'branding-videopanel'
};

/**
 * Detect format type from filename and folder path
 * Priority: Name-based detection over dimension-based detection
 * @param {string} filename - File name
 * @param {string} folderPath - Folder path (optional)
 * @returns {Object} { detectedFormat, detectedSystem, confidence, isSocialMedia }
 */
function detectFormatFromName(filename, folderPath = '') {
  const searchText = (filename + ' ' + folderPath).toLowerCase();

  // Check for branding formats with systematic second-word parsing (special handling)
  if (searchText.includes('branding')) {
    const brandingMatch = searchText.match(/branding[\s-]+(scratcher|scratch|uncover|videopanel)/i);

    if (brandingMatch?.[1]) {
      const subType = brandingMatch[1].toLowerCase();
      const mappedFormat = BRANDING_SUBTYPES[subType];
      if (mappedFormat) {
        return {
          detectedFormat: mappedFormat,
          detectedSystem: 'SOS',
          confidence: 'high',
          isSocialMedia: false
        };
      }
    }

    // No sub-type specified, use default branding
    return {
      detectedFormat: 'branding',
      detectedSystem: null, // Can be SOS or SKLIK
      confidence: 'medium',
      isSocialMedia: false
    };
  }

  // Check all format patterns
  for (const pattern of FORMAT_PATTERNS) {
    if (pattern.keywords.some(keyword => searchText.includes(keyword))) {
      return {
        detectedFormat: pattern.format,
        detectedSystem: pattern.system,
        confidence: pattern.confidence,
        isSocialMedia: pattern.isSocialMedia || false
      };
    }
  }

  // No specific format detected from name
  return {
    detectedFormat: null,
    detectedSystem: null,
    confidence: 'none',
    isSocialMedia: false
  };
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
async function analyzeFile(file, folderPath = '') {
  const fileType = getFileFormat(file);
  const extension = file.name.split('.').pop().toLowerCase();

  // Detect format from name (priority over dimension-based detection)
  const formatDetection = detectFormatFromName(file.name, folderPath);

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
    preview: null,
    isHTML5: false,
    html5Validation: null,
    // Format detection from name
    detectedFormat: formatDetection.detectedFormat,
    detectedSystem: formatDetection.detectedSystem,
    formatConfidence: formatDetection.confidence,
    isSocialMedia: formatDetection.isSocialMedia,
    formatSource: formatDetection.detectedFormat ? 'name' : null,
    folderPath: folderPath
  };

  try {
    // Check if this is an HTML5 banner ZIP
    if (fileType === 'zip' && typeof HTML5Validator !== 'undefined') {
      const isHTML5 = HTML5Validator.isHTML5BannerByName(file.name) || await HTML5Validator.isHTML5ZIP(file);

      if (isHTML5) {
        analysis.isHTML5 = true;
        analysis.fileType = 'html5';
        analysis.format = 'html5';
        // Override any folder-based format detection
        analysis.detectedFormat = 'html5-banner';
        analysis.detectedSystem = null; // HTML5 can work with multiple systems

        // Validate HTML5 banner
        const validation = await HTML5Validator.validateHTML5Banner(file);
        analysis.html5Validation = validation;

        // Extract dimensions from filename if available
        if (validation.dimensions) {
          analysis.dimensions = validation.dimensions;
          const parts = validation.dimensions.split('x');
          if (parts.length >= 2) {
            analysis.width = parseInt(parts[0], 10) || null;
            analysis.height = parseInt(parts[1], 10) || null;
          }
        }

        // Mark as invalid if validation failed
        if (!validation.valid) {
          analysis.colorSpaceValid = false; // Use this flag to indicate validation errors
          analysis.error = validation.issues.join('; ');
        }
      }
    }

    // Get dimensions and color space for images only
    if (fileType === 'image') {
      const dims = await readImageDimensions(file);
      analysis.width = dims.width;
      analysis.height = dims.height;
      analysis.dimensions = `${dims.width}x${dims.height}`;

      // UAC (Universal App Campaigns) dimension-based detection
      // If dimensions match UAC formats and no other format detected, mark as UAC
      const uacDimensions = ['1200x1200', '1200x1500', '1200x628'];
      if (uacDimensions.includes(analysis.dimensions) && !analysis.detectedFormat) {
        analysis.detectedFormat = 'uac';
        analysis.detectedSystem = 'GOOGLE_ADS';
        analysis.formatConfidence = 'medium';
        analysis.formatSource = 'dimension';
      }

      // Check color space for images
      const colorSpaceInfo = await checkColorSpace(file);
      analysis.colorSpace = colorSpaceInfo.colorSpace;
      analysis.colorSpaceValid = colorSpaceInfo.isValid;

      // Generate preview
      analysis.preview = await generatePreview(file, fileType);
    }
  } catch (error) {
    console.warn(`Could not analyze file ${file.name}:`, error.message);
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
    detectFormatFromName,
    generatePreview,
    analyzeFile,
    analyzeFiles
  };
}
