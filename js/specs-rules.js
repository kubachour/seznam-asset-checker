// Technical specifications for Seznam SelfPromo creative formats
// Updated with complete network specifications for image creatives

const CREATIVE_SPECS = {

  // =============================================================================
  // ADFORM SPECIFICATIONS (HIGH & LOW tiers)
  // =============================================================================
  ADFORM: {
    'sponzor-sluzby': {
      name: 'Sponzor služby',
      dimensions: ['300x250'],
      maxSize: 150, // KB
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'mobilni-square': {
      name: 'Mobilní square',
      dimensions: ['300x300'],
      maxSize: 150,
      formats: ['jpg', 'png', 'gif'],
      device: 'Mobil',
      tier: ['HIGH', 'LOW']
    },
    'skyscraper': {
      name: 'Skyscraper',
      dimensions: ['300x600'],
      maxSize: 150,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'wallpaper': {
      name: 'Wallpaper / Produktová plachta',
      dimensions: ['480x300'],
      maxSize: 150,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop/Mobil',
      tier: ['HIGH', 'LOW']
    },
    'mobilni-square-premium': {
      name: 'Mobilní square premium / Mobilní square',
      dimensions: ['480x480'],
      maxSize: 150,
      formats: ['jpg', 'png', 'gif'],
      device: 'Mobil',
      tier: ['HIGH', 'LOW']
    },
    'leaderboard': {
      name: 'Leaderboard',
      dimensions: ['970x210'],
      maxSize: 150,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'rectangle': {
      name: 'Rectangle',
      dimensions: ['970x310'],
      maxSize: 150,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    }
  },

  // =============================================================================
  // SOS SPECIFICATIONS (HIGH & LOW tiers)
  // =============================================================================
  SOS: {
    'sponzor-sluzby': {
      name: 'Sponzor služby',
      dimensions: ['300x250'],
      maxSize: 100, // KB for images
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop/Mobil',
      tier: ['HIGH', 'LOW']
    },
    'mobilni-square': {
      name: 'Mobilní square',
      dimensions: ['300x300'],
      maxSize: 100,
      formats: ['jpg', 'png', 'gif'],
      device: 'Mobil',
      tier: ['HIGH', 'LOW']
    },
    'skyscraper': {
      name: 'Skyscraper',
      dimensions: ['300x600'],
      maxSize: 100,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'wallpaper': {
      name: 'Wallpaper/Produktová plachta',
      dimensions: ['480x300'],
      maxSize: 100,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop/Mobil',
      tier: ['HIGH', 'LOW']
    },
    'mobilni-square-premium': {
      name: 'Mobilní square premium / Mobilní square',
      dimensions: ['480x480', '300x300'],
      maxSize: 100,
      formats: ['jpg', 'png', 'gif'],
      device: 'Mobil',
      tier: ['HIGH', 'LOW']
    },
    'leaderboard': {
      name: 'Leaderboard',
      dimensions: ['970x210'],
      maxSize: 100,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'rectangle': {
      name: 'Rectangle',
      dimensions: ['970x310'],
      maxSize: 100,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'branding': {
      name: 'Branding',
      dimensions: ['2560x1440'],
      maxSize: 600, // Updated to 600 KB
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW'],
      notes: 'Main message: 1366×720px upper area. Podporuje HTML5. Video panel option: MP4, 720p, max 100MB, 60s.'
    },
    'branding-sklik': {
      name: 'Branding Sklik',
      dimensions: ['2000x1400'],
      maxSize: 500, // KB
      formats: ['jpg', 'png', 'gif', 'webp', 'avif'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW'],
      notes: 'Safe area: 1366×720px (top placement). Protective margin: 100px from edges. Image cannot be transparent.'
    },
    'branding-scratcher': {
      name: 'Branding Scratcher',
      dimensions: ['2560x1440'],
      maxSize: 600, // Updated to 600 KB
      formats: ['jpg'], // Only JPG
      device: 'Desktop',
      tier: ['HIGH', 'LOW'],
      notes: 'Potřeba důkladně pročíst požadavky v odkaze'
    },
    'branding-uncover': {
      name: 'Branding Uncover',
      dimensions: ['2560x1440'],
      maxSize: 600, // Updated to 600 KB
      formats: ['jpg', 'png', 'gif'], // Non-animated GIF only
      device: 'Desktop',
      tier: ['HIGH', 'LOW'],
      multiFile: true,
      fileCount: 2,
      fileRoles: ['cover', 'uncover'],
      notes: 'Dvě kreativy: cover a uncover, potřeba důkladně pročíst požadavky v odkaze'
    },
    'nativni-inzerat': {
      name: 'Nativní inzerát (In-article)',
      dimensions: ['640x480', '338x190', '400x300', '800x533'],
      maxSize: 300,
      formats: ['jpg', 'png'],
      device: 'Desktop/Mobil',
      tier: ['HIGH', 'LOW'],
      notes: 'In-article placement. Various dimensions supported.'
    },
    'spincube': {
      name: 'Spincube',
      dimensions: ['480x480'],
      maxSize: 250, // 250 KB per image
      formats: ['jpg', 'png', 'gif'], // Non-animated GIF only
      device: 'Mobil',
      tier: ['HIGH', 'LOW'],
      multiFile: true,
      fileCount: 4,
      fileRoles: ['banner'],
      notes: '4x 480x480 banners required, potřeba důkladně pročíst požadavky v odkaze'
    },
    'mobilni-interscroller': {
      name: 'Mobilní Interscroller',
      dimensions: ['720x1280'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif', 'webp', 'avif'],
      device: 'Mobil',
      tier: ['HIGH', 'LOW'],
      notes: 'Safe zone: 700×920px for main message. Podporuje HTML5.'
    },
    'spinner': {
      name: 'Spinner (Skyscraper)',
      dimensions: ['300x600'],
      maxSize: 250, // KB
      formats: ['jpg', 'png', 'gif'], // Non-animated GIF only
      device: 'Desktop',
      tier: ['HIGH', 'LOW'],
      multiFile: true,
      fileCount: 4,
      fileRoles: ['side1', 'side2', 'side3', 'side4'],
      notes: '4× 300×600 banners required (or 2 used twice). Each can have different target URL. Must be visually distinct from page content.'
    }
  },

  // =============================================================================
  // ONEGAR SPECIFICATIONS (HIGH & LOW tiers)
  // =============================================================================
  ONEGAR: {
    'wallpaper': {
      name: 'Wallpaper',
      dimensions: ['480x300'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop/Mobil',
      tier: ['HIGH', 'LOW']
    },
    'leaderboard': {
      name: 'Leaderboard',
      dimensions: ['970x210'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'sponzor-sluzby': {
      name: 'Sponzor služby',
      dimensions: ['300x250'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'rectangle': {
      name: 'Rectangle',
      dimensions: ['970x310'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'skyscraper': {
      name: 'Skyscraper',
      dimensions: ['300x600'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'mobilni-square': {
      name: 'Mobilní square',
      dimensions: ['300x300', '480x480'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif'],
      device: 'Mobil',
      tier: ['HIGH', 'LOW']
    }
  },

  // =============================================================================
  // SKLIK SPECIFICATIONS (HIGH & LOW tiers)
  // =============================================================================
  SKLIK: {
    'wallpaper': {
      name: 'Wallpaper',
      dimensions: ['480x300'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop/Mobil',
      tier: ['HIGH', 'LOW']
    },
    'leaderboard': {
      name: 'Leaderboard',
      dimensions: ['970x210'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'sponzor-sluzby': {
      name: 'Sponzor služby',
      dimensions: ['300x250'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'rectangle': {
      name: 'Rectangle',
      dimensions: ['970x310'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'skyscraper': {
      name: 'Skyscraper',
      dimensions: ['300x600'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'mobilni-square': {
      name: 'Mobilní square',
      dimensions: ['300x300', '480x480'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif'],
      device: 'Mobil',
      tier: ['HIGH', 'LOW']
    },
    'kombi': {
      name: 'Nativní inzerát / Kombi',
      dimensions: ['1200x628', '1200x1200', '600x314', '300x300'],
      maxSize: 1024, // 1 MB
      formats: ['jpg', 'png', 'gif', 'webp', 'avif'],
      device: 'Desktop/Mobil',
      tier: ['HIGH', 'LOW'],
      notes: 'Banner bez textu (pro nativ). Min: 600×314 (rect) / 300×300 (square). Recommended: 1200×628 / 1200×1200. Max: 4000px width/height.'
    },
    'leaderboard-middle': {
      name: 'Leaderboard middle',
      dimensions: ['728x90'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'mobilni-leaderboard': {
      name: 'Mobilní leaderboard',
      dimensions: ['320x100'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif'],
      device: 'Mobil',
      tier: ['HIGH', 'LOW']
    },
    'skyscraper-sticky': {
      name: 'Skyscraper sticky',
      dimensions: ['160x600', '300x600'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'mobilni-interscroller': {
      name: 'Mobilní Interscroller',
      dimensions: ['720x1280'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif', 'webp', 'avif'],
      device: 'Mobil',
      tier: ['HIGH', 'LOW'],
      notes: 'Safe zone: 700×920px for main message. Podporuje HTML5.'
    }
  },

  // =============================================================================
  // HP EXCLUSIVE SPECIFICATIONS (No tier)
  // =============================================================================
  HP_EXCLUSIVE: {
    'exclusive-desktop-trigger': {
      name: 'Exclusive Desktop - Trigger (varianta A)',
      dimensions: ['461x100'],
      maxSize: 200,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop',
      multiFile: true,
      fileRoles: ['trigger'],
      pairedWith: 'exclusive-desktop-banner',
      notes: 'Spouštěč pro Exclusive s obrázkem'
    },
    'exclusive-desktop-banner': {
      name: 'Exclusive Desktop - Banner (varianta A)',
      dimensions: ['1100x500'],
      maxSize: 300,
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Desktop',
      multiFile: true,
      fileRoles: ['banner'],
      pairedWith: 'exclusive-desktop-trigger',
      notes: 'Hlavní banner pro Exclusive. Image max 300KB, HTML5 max 1MB. Video variant: background 1100×500, poster 1280×720, video MP4 720p max 100MB.'
    },
    'exclusive-mobile-wallpaper': {
      name: 'Exclusive wallpaper (varianta A)',
      dimensions: ['480x300'],
      maxSize: 200,
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Mobil',
      notes: 'Mobilní wallpaper pro Exclusive. Image max 200KB, HTML5 max 300KB.'
    },
    'exclusive-mobile-square': {
      name: 'Exclusive mobilní square premium (varianta B)',
      dimensions: ['480x480'],
      maxSize: 200,
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Mobil',
      notes: 'Mobilní square premium pro Exclusive. Image max 200KB, HTML5 max 300KB.'
    },
    'exclusive-app-wallpaper': {
      name: 'Exclusive wallpaper (varianta A)',
      dimensions: ['480x300'],
      maxSize: 100,
      formats: ['jpg', 'png', 'gif'],
      device: 'Aplikace',
      notes: 'Aplikační wallpaper pro Exclusive'
    },
    'exclusive-app-square': {
      name: 'Exclusive mobilní square premium (varianta B)',
      dimensions: ['480x480'],
      maxSize: 100,
      formats: ['jpg', 'png', 'gif'],
      device: 'Aplikace',
      notes: 'Aplikační square premium pro Exclusive'
    }
  },

  // =============================================================================
  // GOOGLE ADS SPECIFICATIONS (No tier - validation only)
  // =============================================================================
  GOOGLE_ADS: {
    'square-small': {
      name: 'Small Square',
      dimensions: ['200x200'],
      maxSize: 150,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop/Mobil'
    },
    'square': {
      name: 'Square',
      dimensions: ['250x250'],
      maxSize: 150,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop/Mobil'
    },
    'banner': {
      name: 'Banner',
      dimensions: ['468x60'],
      maxSize: 150,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop/Mobil'
    },
    'leaderboard': {
      name: 'Leaderboard',
      dimensions: ['728x90'],
      maxSize: 150,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop/Mobil'
    },
    'inline-rectangle': {
      name: 'Inline Rectangle',
      dimensions: ['300x250'],
      maxSize: 150,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop/Mobil'
    },
    'large-rectangle': {
      name: 'Large Rectangle',
      dimensions: ['336x280'],
      maxSize: 150,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop/Mobil'
    },
    'skyscraper': {
      name: 'Skyscraper',
      dimensions: ['120x600'],
      maxSize: 150,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop'
    },
    'wide-skyscraper': {
      name: 'Wide Skyscraper',
      dimensions: ['160x600'],
      maxSize: 150,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop'
    },
    'half-page': {
      name: 'Half Page',
      dimensions: ['300x600'],
      maxSize: 150,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop'
    },
    'large-leaderboard': {
      name: 'Large Leaderboard',
      dimensions: ['970x250'],
      maxSize: 150,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop'
    },
    'mobile-banner': {
      name: 'Mobile Banner',
      dimensions: ['320x50'],
      maxSize: 150,
      formats: ['jpg', 'png', 'gif'],
      device: 'Mobil'
    },
    'mobile-leaderboard': {
      name: 'Mobile Leaderboard',
      dimensions: ['320x100'],
      maxSize: 150,
      formats: ['jpg', 'png', 'gif'],
      device: 'Mobil'
    }
  }
};

// =============================================================================
// FORMAT NAME MAPPING FOR FILENAMES
// =============================================================================

const FORMAT_NAME_MAP = {
  // Standard banner sizes → 'banner'
  '300x250': 'banner',
  '300x300': 'banner',
  '300x600': 'banner',
  '480x300': 'banner',
  '480x480': 'banner',
  '970x210': 'banner',
  '970x310': 'banner',
  '728x90': 'banner',
  '320x100': 'banner',
  '160x600': 'banner',
  '120x600': 'banner',
  '970x250': 'banner',
  '320x50': 'banner',
  '468x60': 'banner',
  '336x280': 'banner',
  '250x250': 'banner',
  '200x200': 'banner',
  '600x314': 'banner',

  // Special formats → specific names
  '2560x1440': 'branding',
  '2000x1400': 'branding-sklik',
  '720x1280': 'interscroller',
  '1200x628': 'kombi',
  '1200x1200': 'kombi',
  '461x100': 'exclusive-trigger',
  '1100x500': 'exclusive-banner'
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get display format name for filename generation
 * @param {string} dimensions - e.g., "300x250"
 * @param {string} specKey - e.g., "branding-scratcher"
 * @returns {string} Format name for filename
 */
function getFormatDisplayName(dimensions, specKey) {
  // For special formats, use spec key mapping
  if (specKey && specKey.includes('branding-scratcher')) return 'scratcher';
  if (specKey && specKey.includes('branding-uncover')) return 'uncover';
  if (specKey && specKey.includes('branding-videopanel')) return 'branding-videopanel';
  if (specKey && specKey.includes('branding-sklik')) return 'branding-sklik';
  if (specKey && specKey.includes('branding')) return 'branding';
  if (specKey && specKey.includes('interscroller')) return 'interscroller';
  if (specKey && specKey.includes('spinner')) return 'spinner';
  if (specKey && specKey.includes('spincube')) return 'spincube';
  if (specKey && specKey.includes('kombi')) return 'kombi';
  if (specKey && specKey.includes('exclusive')) {
    if (dimensions === '461x100') return 'exclusive-trigger';
    if (dimensions === '1100x500') return 'exclusive-banner';
    if (specKey.includes('desktop')) return 'exclusive-desktop';
    if (specKey.includes('mobile') || specKey.includes('mobil')) return 'exclusive-mobile';
    if (specKey.includes('app')) return 'exclusive-aplikace';
    return 'exclusive';
  }

  // Default to banner for standard sizes
  return FORMAT_NAME_MAP[dimensions] || 'banner';
}

/**
 * Parse dimension string into width and height
 * @param {string} dimString - e.g., "300x250"
 * @returns {{width: number, height: number}}
 */
function parseDimension(dimString) {
  const [width, height] = dimString.split('x').map(Number);
  return { width, height };
}

/**
 * Find all matching formats for a file across all networks
 * @param {Object} fileData - Analyzed file data
 * @param {string} network - Network name (optional, null for all)
 * @param {string} tier - Tier level (optional)
 * @returns {Array} Array of matching format specs
 */
function findMatchingFormats(fileData, network = null, tier = null) {
  const matches = [];
  const searchNetworks = network ? [network] : Object.keys(CREATIVE_SPECS);

  for (const netName of searchNetworks) {
    const networkSpecs = CREATIVE_SPECS[netName];

    for (const [specKey, spec] of Object.entries(networkSpecs)) {
      // Check if tier matches (if specified)
      if (tier && spec.tier && !spec.tier.includes(tier)) continue;

      // Check if dimensions match
      if (!spec.dimensions.includes(fileData.dimensions)) continue;

      // Check if file format is supported
      const fileFormat = fileData.format;
      if (!spec.formats.includes(fileFormat)) continue;

      // Check size constraints
      const sizeLimit = spec.maxSize;
      const fileSize = fileData.sizeKB;

      matches.push({
        network: netName,
        tier: spec.tier,
        specKey: specKey,
        spec: spec,
        formatDisplay: getFormatDisplayName(fileData.dimensions, specKey),
        sizeValid: fileSize <= sizeLimit,
        sizeLimit: sizeLimit,
        fileSize: fileSize
      });
    }
  }

  return matches;
}

/**
 * Validate a file against a specific format spec
 * @param {Object} fileData - Analyzed file data
 * @param {Object} formatSpec - Format specification
 * @returns {{valid: boolean, issues: Array<string>}}
 */
function validateFileForFormat(fileData, formatSpec) {
  const issues = [];

  // Special handling for HTML5 banners
  if (fileData.isHTML5 && fileData.html5Validation) {
    // Check dimensions
    if (!formatSpec.dimensions.includes(fileData.dimensions)) {
      issues.push(`Rozměr ${fileData.dimensions} není podporován (očekáváno: ${formatSpec.dimensions.join(' nebo ')})`);
    }

    // Check size limit (with 5% tolerance)
    const sizeLimit = formatSpec.maxSize;
    const fileSize = fileData.sizeKB;
    const toleranceMultiplier = 1.05; // 5% tolerance for file size

    if (fileSize > sizeLimit * toleranceMultiplier) {
      issues.push(`Velikost souboru ${fileSize}KB překračuje limit ${sizeLimit}KB (${Math.round(sizeLimit * toleranceMultiplier)}KB s 5% tolerancí)`);
    }

    // Add HTML5 validation issues
    if (!fileData.html5Validation.valid) {
      issues.push(...fileData.html5Validation.issues);
    }

    return {
      valid: issues.length === 0,
      issues: issues
    };
  }

  // Standard validation for image files
  // Check dimensions
  if (!formatSpec.dimensions.includes(fileData.dimensions)) {
    issues.push(`Rozměr ${fileData.dimensions} není podporován (očekáváno: ${formatSpec.dimensions.join(' nebo ')})`);
  }

  // Check file format
  const fileFormat = fileData.format;
  if (!formatSpec.formats.includes(fileFormat)) {
    issues.push(`Formát ${fileFormat} není povolen (povoleno: ${formatSpec.formats.join(', ')})`);
  }

  // Check size limit (with 5% tolerance)
  const sizeLimit = formatSpec.maxSize;
  const fileSize = fileData.sizeKB;
  const toleranceMultiplier = 1.05; // 5% tolerance for file size

  if (fileSize > sizeLimit * toleranceMultiplier) {
    issues.push(`Velikost souboru ${fileSize}KB překračuje limit ${sizeLimit}KB (${Math.round(sizeLimit * toleranceMultiplier)}KB s 5% tolerancí)`);
  }

  // Check color space
  if (!fileData.colorSpaceValid && fileData.colorSpace === 'CMYK') {
    issues.push('Detekován barevný prostor CMYK (vyžadováno RGB)');
  }

  return {
    valid: issues.length === 0,
    issues: issues
  };
}

/**
 * Detect multi-file format groups
 * @param {Array} allFiles - Array of analyzed files
 * @returns {Array} Array of multi-file format groups
 */
function detectMultiFileFormats(allFiles) {
  const multiFileGroups = [];

  // Check for Branding Uncover (2x 2560x1440)
  const uncoverFiles = allFiles.filter(f => f.dimensions === '2560x1440');
  if (uncoverFiles.length >= 2) {
    // Group in pairs
    for (let i = 0; i < uncoverFiles.length - 1; i += 2) {
      multiFileGroups.push({
        format: 'branding-uncover',
        network: 'SOS',
        files: [uncoverFiles[i], uncoverFiles[i + 1]],
        complete: true,
        requiredCount: 2,
        roles: ['cover', 'uncover']
      });
    }
    // If odd number, last one is incomplete
    if (uncoverFiles.length % 2 === 1) {
      multiFileGroups.push({
        format: 'branding-uncover',
        network: 'SOS',
        files: [uncoverFiles[uncoverFiles.length - 1]],
        complete: false,
        requiredCount: 2,
        roles: ['cover', 'uncover']
      });
    }
  }

  // Check for Spincube (4x 480x480)
  // First, identify Spincube files by name/folder, then by dimension
  const spincubeFiles = allFiles.filter(f => f.dimensions === '480x480');
  const groupedSpincube = [];
  const ungroupedSpincube = [];

  // Group by folder path or filename containing "spincube"
  const spincubeByFolder = {};
  for (const file of spincubeFiles) {
    const fileName = (file.name || '').toLowerCase();
    const folderPath = (file.folderPath || '').toLowerCase();

    // Check if filename or folder contains "spincube"
    if (fileName.includes('spincube') || folderPath.includes('spincube')) {
      // Group by folder path
      const key = file.folderPath || 'root';
      if (!spincubeByFolder[key]) {
        spincubeByFolder[key] = [];
      }
      spincubeByFolder[key].push(file);
    } else {
      ungroupedSpincube.push(file);
    }
  }

  // Process named/folder-grouped Spincube sets
  for (const folderKey in spincubeByFolder) {
    const files = spincubeByFolder[folderKey];
    if (files.length === 4) {
      multiFileGroups.push({
        format: 'spincube',
        network: 'SOS',
        files: files,
        complete: true,
        requiredCount: 4,
        roles: ['banner', 'banner', 'banner', 'banner']
      });
    } else {
      // Incomplete Spincube set
      multiFileGroups.push({
        format: 'spincube',
        network: 'SOS',
        files: files,
        complete: false,
        requiredCount: 4,
        roles: ['banner', 'banner', 'banner', 'banner']
      });
    }
  }

  // Process ungrouped 480x480 files (fallback to old logic)
  if (ungroupedSpincube.length >= 4) {
    // Group in sets of 4
    for (let i = 0; i < Math.floor(ungroupedSpincube.length / 4) * 4; i += 4) {
      multiFileGroups.push({
        format: 'spincube',
        network: 'SOS',
        files: ungroupedSpincube.slice(i, i + 4),
        complete: true,
        requiredCount: 4,
        roles: ['banner', 'banner', 'banner', 'banner']
      });
    }
    // If remaining files (less than 4), incomplete
    const remaining = ungroupedSpincube.length % 4;
    if (remaining > 0) {
      multiFileGroups.push({
        format: 'spincube',
        network: 'SOS',
        files: ungroupedSpincube.slice(-remaining),
        complete: false,
        requiredCount: 4,
        roles: ['banner', 'banner', 'banner', 'banner']
      });
    }
  } else if (ungroupedSpincube.length > 0) {
    // Less than 4 files, incomplete
    multiFileGroups.push({
      format: 'spincube',
      network: 'SOS',
      files: ungroupedSpincube,
      complete: false,
      requiredCount: 4,
      roles: ['banner', 'banner', 'banner', 'banner']
    });
  }

  // Check for Spinner (4x 300x600)
  // First, identify Spinner files by name/folder containing "spinner"
  const skyscraperFiles = allFiles.filter(f => f.dimensions === '300x600');
  const spinnerByFolder = {};
  const nonSpinnerSkyscrapers = [];

  for (const file of skyscraperFiles) {
    const fileName = (file.name || '').toLowerCase();
    const folderPath = (file.folderPath || '').toLowerCase();

    // Check if filename or folder contains "spinner"
    if (fileName.includes('spinner') || folderPath.includes('spinner')) {
      // Group by folder path
      const key = file.folderPath || 'root';
      if (!spinnerByFolder[key]) {
        spinnerByFolder[key] = [];
      }
      spinnerByFolder[key].push(file);
    } else {
      nonSpinnerSkyscrapers.push(file);
    }
  }

  // Process named/folder-grouped Spinner sets
  for (const folderKey in spinnerByFolder) {
    const files = spinnerByFolder[folderKey];
    if (files.length === 4) {
      multiFileGroups.push({
        format: 'spinner',
        network: 'SOS',
        files: files,
        complete: true,
        requiredCount: 4,
        roles: ['side1', 'side2', 'side3', 'side4']
      });
    } else if (files.length === 2) {
      // 2 images can be used twice for Spinner
      multiFileGroups.push({
        format: 'spinner',
        network: 'SOS',
        files: files,
        complete: true,
        requiredCount: 2,
        roles: ['side1', 'side2'],
        notes: 'Using 2 images (will be used twice)'
      });
    } else {
      // Incomplete Spinner set
      multiFileGroups.push({
        format: 'spinner',
        network: 'SOS',
        files: files,
        complete: false,
        requiredCount: 4,
        roles: ['side1', 'side2', 'side3', 'side4']
      });
    }
  }

  // Check for HP Exclusive Desktop (461x100 trigger + 1100x500 banner)
  const triggers = allFiles.filter(f => f.dimensions === '461x100');
  const banners = allFiles.filter(f => f.dimensions === '1100x500');

  if (triggers.length > 0 && banners.length > 0) {
    // Pair triggers with banners
    const pairCount = Math.min(triggers.length, banners.length);
    for (let i = 0; i < pairCount; i++) {
      multiFileGroups.push({
        format: 'exclusive-desktop',
        network: 'HP_EXCLUSIVE',
        files: [triggers[i], banners[i]],
        complete: true,
        requiredCount: 2,
        roles: ['trigger', 'banner']
      });
    }
    // If unpaired triggers or banners, mark as incomplete
    if (triggers.length > banners.length) {
      for (let i = pairCount; i < triggers.length; i++) {
        multiFileGroups.push({
          format: 'exclusive-desktop',
          network: 'HP_EXCLUSIVE',
          files: [triggers[i]],
          complete: false,
          requiredCount: 2,
          roles: ['trigger', 'banner']
        });
      }
    }
    if (banners.length > triggers.length) {
      for (let i = pairCount; i < banners.length; i++) {
        multiFileGroups.push({
          format: 'exclusive-desktop',
          network: 'HP_EXCLUSIVE',
          files: [banners[i]],
          complete: false,
          requiredCount: 2,
          roles: ['trigger', 'banner']
        });
      }
    }
  } else if (triggers.length > 0 || banners.length > 0) {
    // Only one type, incomplete
    multiFileGroups.push({
      format: 'exclusive-desktop',
      network: 'HP_EXCLUSIVE',
      files: [...triggers, ...banners],
      complete: false,
      requiredCount: 2,
      roles: ['trigger', 'banner']
    });
  }

  return multiFileGroups;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CREATIVE_SPECS,
    FORMAT_NAME_MAP,
    getFormatDisplayName,
    parseDimension,
    findMatchingFormats,
    validateFileForFormat,
    detectMultiFileFormats
  };
}
