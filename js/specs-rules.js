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
      maxSize: 500,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW'],
      notes: 'Potřeba důkladně pročíst požadavky v odkaze'
    },
    'branding-scratcher': {
      name: 'Branding Scratcher',
      dimensions: ['2560x1440'],
      maxSize: 500,
      formats: ['jpg'], // Only JPG
      device: 'Desktop',
      tier: ['HIGH', 'LOW'],
      notes: 'Potřeba důkladně pročíst požadavky v odkaze'
    },
    'branding-uncover': {
      name: 'Branding Uncover',
      dimensions: ['2560x1440'],
      maxSize: 500,
      formats: ['jpg', 'png', 'gif'], // Non-animated GIF only
      device: 'Desktop',
      tier: ['HIGH', 'LOW'],
      multiFile: true,
      fileCount: 2,
      fileRoles: ['cover', 'uncover'],
      notes: 'Dvě kreativy: cover a uncover, potřeba důkladně pročíst požadavky v odkaze'
    },
    'spincube': {
      name: 'Spincube',
      dimensions: ['480x480'],
      maxSize: 100,
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
      maxSize: 200,
      formats: ['jpg', 'png', 'gif'],
      device: 'Mobil',
      tier: ['HIGH', 'LOW'],
      notes: 'Potřeba důkladně pročíst požadavky v odkaze'
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
      dimensions: ['1200x628', '1200x1200'],
      maxSize: 1024, // 1 MB
      formats: ['jpg', 'png'],
      device: 'Desktop/Mobil',
      tier: ['HIGH', 'LOW'],
      notes: 'Banner bez textu (pro nativ)'
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
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop',
      multiFile: true,
      fileRoles: ['banner'],
      pairedWith: 'exclusive-desktop-trigger',
      notes: 'Hlavní banner pro Exclusive s obrázkem'
    },
    'exclusive-mobile-wallpaper': {
      name: 'Exclusive wallpaper (varianta A)',
      dimensions: ['480x300'],
      maxSize: 200,
      formats: ['jpg', 'png', 'gif'],
      device: 'Mobil',
      notes: 'Mobilní wallpaper pro Exclusive'
    },
    'exclusive-mobile-square': {
      name: 'Exclusive mobilní square premium (varianta B)',
      dimensions: ['480x480'],
      maxSize: 200,
      formats: ['jpg', 'png', 'gif'],
      device: 'Mobil',
      notes: 'Mobilní square premium pro Exclusive'
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

  // Special formats → specific names
  '2560x1440': 'branding',
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
  if (specKey && specKey.includes('branding')) return 'branding';
  if (specKey && specKey.includes('interscroller')) return 'interscroller';
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

  // Check dimensions
  if (!formatSpec.dimensions.includes(fileData.dimensions)) {
    issues.push(`Dimension ${fileData.dimensions} not supported (expected: ${formatSpec.dimensions.join(' or ')})`);
  }

  // Check file format
  const fileFormat = fileData.format;
  if (!formatSpec.formats.includes(fileFormat)) {
    issues.push(`Format ${fileFormat} not allowed (allowed: ${formatSpec.formats.join(', ')})`);
  }

  // Check size limit
  const sizeLimit = formatSpec.maxSize;
  const fileSize = fileData.sizeKB;

  if (fileSize > sizeLimit) {
    issues.push(`File size ${fileSize}KB exceeds ${sizeLimit}KB limit`);
  }

  // Check color space
  if (!fileData.colorSpaceValid && fileData.colorSpace === 'CMYK') {
    issues.push('CMYK color space detected (RGB required)');
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
  const spincubeFiles = allFiles.filter(f => f.dimensions === '480x480');
  if (spincubeFiles.length >= 4) {
    // Group in sets of 4
    for (let i = 0; i < Math.floor(spincubeFiles.length / 4) * 4; i += 4) {
      multiFileGroups.push({
        format: 'spincube',
        network: 'SOS',
        files: spincubeFiles.slice(i, i + 4),
        complete: true,
        requiredCount: 4,
        roles: ['banner', 'banner', 'banner', 'banner']
      });
    }
    // If remaining files (less than 4), incomplete
    const remaining = spincubeFiles.length % 4;
    if (remaining > 0) {
      multiFileGroups.push({
        format: 'spincube',
        network: 'SOS',
        files: spincubeFiles.slice(-remaining),
        complete: false,
        requiredCount: 4,
        roles: ['banner', 'banner', 'banner', 'banner']
      });
    }
  } else if (spincubeFiles.length > 0) {
    // Less than 4 files, incomplete
    multiFileGroups.push({
      format: 'spincube',
      network: 'SOS',
      files: spincubeFiles,
      complete: false,
      requiredCount: 4,
      roles: ['banner', 'banner', 'banner', 'banner']
    });
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
