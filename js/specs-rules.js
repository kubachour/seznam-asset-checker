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
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'mobilni-square': {
      name: 'Mobilní square',
      dimensions: ['300x300'],
      maxSize: 150,
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Mobil',
      tier: ['HIGH', 'LOW']
    },
    'skyscraper': {
      name: 'Skyscraper',
      dimensions: ['300x600'],
      maxSize: 150,
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'wallpaper': {
      name: 'Wallpaper / Produktová plachta',
      dimensions: ['480x300'],
      maxSize: 150,
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Desktop/Mobil',
      tier: ['HIGH', 'LOW']
    },
    'mobilni-square-premium': {
      name: 'Mobilní square premium / Mobilní square',
      dimensions: ['480x480'],
      maxSize: 150,
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Mobil',
      tier: ['HIGH', 'LOW']
    },
    'leaderboard': {
      name: 'Leaderboard',
      dimensions: ['970x210'],
      maxSize: 150,
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'rectangle': {
      name: 'Rectangle',
      dimensions: ['970x310'],
      maxSize: 150,
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    }
  },

  // =============================================================================
  // SOS SPECIFICATIONS (HIGH tier ONLY - no LOW tier)
  // =============================================================================
  SOS: {
    // SOS accepts ONLY rich media and in-article formats
    // Standard banners (300x250, 300x300, 300x600, etc.) are NOT supported on SOS
    // Use ADFORM, ONEGAR, or SKLIK for standard banner placements
    'branding': {
      name: 'Branding',
      dimensions: ['2560x1440'],
      maxSize: 600, // Updated to 600 KB
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Desktop',
      tier: ['HIGH'],
      notes: 'Main message: 1366×720px upper area. Podporuje HTML5. Video panel option: MP4, 720p, max 100MB, 60s.'
    },
    'branding-sklik': {
      name: 'Branding Sklik',
      dimensions: ['2000x1400'],
      maxSize: 500, // KB
      formats: ['jpg', 'png', 'gif', 'webp', 'avif'],
      device: 'Desktop',
      tier: ['HIGH'],
      notes: 'Safe area: 1366×720px (top placement). Protective margin: 100px from edges. Image cannot be transparent.'
    },
    'branding-scratcher': {
      name: 'Branding Scratcher',
      dimensions: ['2560x1440'],
      maxSize: 600, // Updated to 600 KB
      formats: ['jpg'], // Only JPG
      device: 'Desktop',
      tier: ['HIGH'],
      notes: 'Potřeba důkladně pročíst požadavky v odkaze'
    },
    'branding-uncover': {
      name: 'Branding Uncover',
      dimensions: ['2560x1440'],
      maxSize: 600, // Updated to 600 KB
      formats: ['jpg', 'png', 'gif'], // Non-animated GIF only
      device: 'Desktop',
      tier: ['HIGH'],
      multiFile: true,
      fileCount: 2,
      fileRoles: ['cover', 'uncover'],
      notes: 'Dvě kreativy: cover a uncover, potřeba důkladně pročíst požadavky v odkaze'
    },
    'branding-videopanel': {
      name: 'Branding Videopanel',
      dimensions: ['2560x1440'],
      maxSize: 600, // KB
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Desktop',
      tier: ['HIGH'],
      notes: 'Same technical specs as base branding. Video panel placement - video content can be embedded in HTML5 creatives.'
    },
    'inarticle': {
      name: 'Inarticle',
      dimensions: ['640x480', '338x190', '400x300', '800x533', '1200x628', '1200x1200'],
      maxSize: 500, // UPDATED: 500 KB limit for inarticle
      formats: ['jpg', 'png'],
      device: 'Desktop/Mobil',
      tier: ['HIGH'],
      notes: 'Inarticle placement. 500KB limit. Various dimensions supported.'
    },
    'nativni-inzerat': {
      name: 'Nativní inzerát (In-article)',
      dimensions: ['640x480', '338x190', '400x300', '800x533'],
      maxSize: 500, // UPDATED: 500 KB limit to match inarticle
      formats: ['jpg', 'png'],
      device: 'Desktop/Mobil',
      tier: ['HIGH'],
      notes: 'In-article placement. Various dimensions supported.'
    },
    'spincube': {
      name: 'Spincube',
      dimensions: ['480x480'],
      maxSize: 250, // 250 KB per image
      formats: ['jpg', 'png', 'gif'], // Non-animated GIF only
      device: 'Mobil',
      tier: ['HIGH'],
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
      tier: ['HIGH'],
      notes: 'Safe zone: 700×920px for main message. Podporuje HTML5.'
    },
    'spinner': {
      name: 'Spinner (Skyscraper)',
      dimensions: ['300x600'],
      maxSize: 250, // KB
      formats: ['jpg', 'png', 'gif'], // Non-animated GIF only
      device: 'Desktop',
      tier: ['HIGH'],
      multiFile: true,
      fileCount: 4,
      fileRoles: ['side1', 'side2', 'side3', 'side4'],
      notes: '4× 300×600 banners required (or 2 used twice). Each can have different target URL. Must be visually distinct from page content.'
    },
    'exclusive': {
      name: 'Exclusive',
      dimensions: ['480x480', '480x300', '461x100', '1100x500'],
      maxSize: 300,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop/Mobil',
      tier: ['HIGH'],
      notes: 'Exclusive format for SOS. Various dimensions.'
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
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Desktop/Mobil',
      tier: ['HIGH', 'LOW']
    },
    'leaderboard': {
      name: 'Leaderboard',
      dimensions: ['970x210'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'sponzor-sluzby': {
      name: 'Sponzor služby',
      dimensions: ['300x250'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'rectangle': {
      name: 'Rectangle',
      dimensions: ['970x310'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'skyscraper': {
      name: 'Skyscraper',
      dimensions: ['300x600'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'mobilni-square': {
      name: 'Mobilní square',
      dimensions: ['300x300', '480x480'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif', 'html5'],
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
      notes: 'Banner bez textu (pro nativ). Min: 600×314 (rect) / 300×300 (square). Recommended: 1200×628 / 1200×1200.'
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
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Desktop/Mobil',
      tier: ['HIGH', 'LOW']
    },
    'leaderboard': {
      name: 'Leaderboard',
      dimensions: ['970x210'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'sponzor-sluzby': {
      name: 'Sponzor služby',
      dimensions: ['300x250'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'rectangle': {
      name: 'Rectangle',
      dimensions: ['970x310'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'skyscraper': {
      name: 'Skyscraper',
      dimensions: ['300x600'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Desktop',
      tier: ['HIGH', 'LOW']
    },
    'mobilni-square': {
      name: 'Mobilní square',
      dimensions: ['300x300', '480x480'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif', 'html5'],
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
      formats: ['jpg', 'png', 'gif', 'html5'],
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
    },
    // UAC (Universal App Campaigns) formats
    'uac-square': {
      name: 'UAC Square (1:1)',
      dimensions: ['1200x1200'],
      maxSize: 5120, // 5 MB
      formats: ['jpg', 'png'],
      device: 'Desktop/Mobil',
      notes: 'Universal App Campaign - Square format for app promotion'
    },
    'uac-portrait': {
      name: 'UAC Portrait (4:5)',
      dimensions: ['1200x1500'],
      maxSize: 5120, // 5 MB
      formats: ['jpg', 'png'],
      device: 'Desktop/Mobil',
      notes: 'Universal App Campaign - Portrait format for app promotion'
    },
    'uac-landscape': {
      name: 'UAC Landscape (1.91:1)',
      dimensions: ['1200x628'],
      maxSize: 5120, // 5 MB
      formats: ['jpg', 'png'],
      device: 'Desktop/Mobil',
      notes: 'Universal App Campaign - Landscape format for app promotion'
    }
  }
};

// =============================================================================
// FORMAT-TO-SYSTEM MAPPING (Strict rules for which formats are allowed on each system)
// =============================================================================

const FORMAT_SYSTEM_MAPPING = {
  // SOS-exclusive formats (only deployed to SOS, HIGH tier only)
  'inarticle': ['SOS'],
  'spincube': ['SOS'],
  'exclusive': ['SOS'],
  'branding-scratcher': ['SOS'],
  'branding-uncover': ['SOS'],
  'branding-videopanel': ['SOS'],
  'spinner': ['SOS'],
  'nativni-inzerat': ['SOS'], // In-article / native ad

  // Branding - SOS and SKLIK
  'branding': ['SOS', 'SKLIK'],
  'branding-sklik': ['SKLIK'],

  // Interscroller - SOS and SKLIK
  'interscroller': ['SOS', 'SKLIK'],
  'mobilni-interscroller': ['SOS', 'SKLIK'],

  // Kombi - ONEGAR and SKLIK
  'kombi': ['ONEGAR', 'SKLIK'],

  // Standard banners - can be deployed to ADFORM, ONEGAR, SKLIK (NOT SOS!)
  // SOS accepts only rich media and in-article formats
  'sponzor-sluzby': ['ADFORM', 'ONEGAR', 'SKLIK'],
  'mobilni-square': ['ADFORM', 'ONEGAR', 'SKLIK'],
  'mobilni-square-premium': ['ADFORM', 'ONEGAR', 'SKLIK'],
  'skyscraper': ['ADFORM', 'ONEGAR', 'SKLIK'],
  'skyscraper-sticky': ['SKLIK'],
  'wallpaper': ['ADFORM', 'ONEGAR', 'SKLIK'],
  'leaderboard': ['ADFORM', 'ONEGAR', 'SKLIK'],
  'leaderboard-middle': ['SKLIK'],
  'mobilni-leaderboard': ['SKLIK'],
  'rectangle': ['ADFORM', 'ONEGAR', 'SKLIK'],

  // HTML5 banners - ADFORM, ONEGAR, SKLIK (NOT SOS for most)
  'html5-banner': ['ADFORM', 'ONEGAR', 'SKLIK'],

  // HP Exclusive formats (HP_EXCLUSIVE system only)
  'exclusive-desktop-trigger': ['HP_EXCLUSIVE'],
  'exclusive-desktop-banner': ['HP_EXCLUSIVE'],
  'exclusive-mobile-wallpaper': ['HP_EXCLUSIVE'],
  'exclusive-mobile-square': ['HP_EXCLUSIVE'],
  'exclusive-app-wallpaper': ['HP_EXCLUSIVE'],
  'exclusive-app-square': ['HP_EXCLUSIVE'],

  // UAC (Universal App Campaigns) - GOOGLE_ADS only
  'uac': ['GOOGLE_ADS'],
  'uac-square': ['GOOGLE_ADS'],
  'uac-portrait': ['GOOGLE_ADS'],
  'uac-landscape': ['GOOGLE_ADS'],

  // Social media - NOT for any ad system (handled separately)
  'social-media': []
};

/**
 * Get allowed systems for a detected format
 * @param {string} formatType - Detected format type (e.g., 'spincube', 'inarticle')
 * @returns {Array<string>} Array of allowed system names
 */
function getAllowedSystemsForFormat(formatType) {
  if (!formatType) return ['ADFORM', 'SOS', 'ONEGAR', 'SKLIK', 'HP_EXCLUSIVE', 'GOOGLE_ADS']; // All systems if no format detected

  const allowed = FORMAT_SYSTEM_MAPPING[formatType];
  if (allowed) return allowed;

  // Default: standard banner formats allowed on most systems (including Google Ads for validation)
  return ['ADFORM', 'SOS', 'ONEGAR', 'SKLIK', 'GOOGLE_ADS'];
}

/**
 * Check if a format is allowed for a specific system
 * @param {string} formatType - Detected format type
 * @param {string} system - System name (ADFORM, SOS, etc.)
 * @returns {boolean} True if format is allowed for the system
 */
function isFormatAllowedForSystem(formatType, system) {
  if (!formatType) return true; // If no format detected, allow validation

  // Social media should never be validated against ad systems
  if (formatType === 'social-media') return false;

  const allowedSystems = getAllowedSystemsForFormat(formatType);
  return allowedSystems.includes(system);
}

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
  if (specKey && specKey.includes('branding-videopanel')) return 'videopanel';
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

  // Filter networks based on detected format (if any)
  // This ensures format-specific files (e.g., spincube, spinner) only match their allowed systems
  let filteredNetworks = searchNetworks;
  if (fileData.detectedFormat) {
    const allowedSystems = getAllowedSystemsForFormat(fileData.detectedFormat);
    filteredNetworks = searchNetworks.filter(net => allowedSystems.includes(net));
  }

  for (const netName of filteredNetworks) {
    const networkSpecs = CREATIVE_SPECS[netName];

    for (const [specKey, spec] of Object.entries(networkSpecs)) {
      // If detected format exists and is not 'html5-banner', match only that specific specKey
      // This prevents rich media formats (spincube, spinner, branding-scratcher) from matching wrong specs
      // For UAC: if detectedFormat is 'uac', match any specKey starting with 'uac-'
      if (fileData.detectedFormat &&
          fileData.detectedFormat !== 'html5-banner' &&
          specKey !== fileData.detectedFormat &&
          !(fileData.detectedFormat === 'uac' && specKey.startsWith('uac-'))) {
        continue;
      }

      // If file is HTML5 ZIP, match only HTML5-compatible specs
      // This prevents HTML5 banners from being matched against static image specs
      if (fileData.isHTML5 && !spec.formats.includes('html5')) {
        continue;
      }

      // Check if tier matches (if specified)
      if (tier && spec.tier && !spec.tier.includes(tier)) continue;

      // Check if dimensions match
      if (!spec.dimensions.includes(fileData.dimensions)) continue;

      // For multi-file formats, require detectedFormat to match
      // This prevents random files with matching dimensions from being validated as compatible
      // Only files with the format keyword in name/folder should match multi-file specs
      if (spec.multiFile && fileData.detectedFormat !== specKey) {
        continue; // Skip this spec - file doesn't belong to this multi-file format
      }

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
 * @returns {{valid: boolean, issues: Array<string>, warnings: Array<string>}}
 */
function validateFileForFormat(fileData, formatSpec) {
  const issues = [];
  const warnings = [];

  // Special handling for HTML5 banners
  if (fileData.isHTML5 && fileData.html5Validation) {
    // Check dimensions
    if (!formatSpec.dimensions.includes(fileData.dimensions)) {
      issues.push(`Rozměr ${fileData.dimensions} není podporován (očekáváno: ${formatSpec.dimensions.join(' nebo ')})`);
    }

    // Check size limit (with 5% tolerance) - SIZE IS A WARNING FOR HTML5, NOT BLOCKING
    const sizeLimit = formatSpec.maxSize;
    const fileSize = fileData.sizeKB;
    const toleranceMultiplier = 1.05; // 5% tolerance for file size

    if (fileSize > sizeLimit * toleranceMultiplier) {
      warnings.push(`Velikost souboru ${fileSize}KB překračuje limit ${sizeLimit}KB (${Math.round(sizeLimit * toleranceMultiplier)}KB s 5% tolerancí)`);
    }

    // Add HTML5 validation issues as WARNINGS (not blocking errors)
    // These are policy violations but don't prevent export for internal systems
    if (!fileData.html5Validation.valid) {
      warnings.push(...fileData.html5Validation.issues);
    }

    return {
      valid: issues.length === 0, // Only dimension mismatch blocks validation for HTML5
      issues: issues,
      warnings: warnings
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

  // Check size limit (with 5% tolerance) - SIZE IS NOW A WARNING, NOT A BLOCKING ERROR
  const sizeLimit = formatSpec.maxSize;
  const fileSize = fileData.sizeKB;
  const toleranceMultiplier = 1.05; // 5% tolerance for file size

  if (fileSize > sizeLimit * toleranceMultiplier) {
    warnings.push(`Velikost souboru ${fileSize}KB překračuje limit ${sizeLimit}KB (${Math.round(sizeLimit * toleranceMultiplier)}KB s 5% tolerancí)`);
  }

  // Check color space
  if (!fileData.colorSpaceValid && fileData.colorSpace === 'CMYK') {
    issues.push('Detekován barevný prostor CMYK (vyžadováno RGB)');
  }

  return {
    valid: issues.length === 0,
    issues: issues,
    warnings: warnings
  };
}

/**
 * Group files by folder path for multi-file format detection
 * @param {Array} files - Array of file objects
 * @param {Function} filterFn - Optional filter function to apply to each file
 * @returns {Object} Object keyed by folder path with arrays of files
 */
function groupByFolderPath(files, filterFn = null) {
  const grouped = {};
  for (const file of files) {
    if (filterFn && !filterFn(file)) continue;
    const key = file.folderPath || 'root';
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(file);
  }
  return grouped;
}

/**
 * Detect multi-file format groups
 * @param {Array} allFiles - Array of analyzed files
 * @returns {Array} Array of multi-file format groups
 */
function detectMultiFileFormats(allFiles) {
  const multiFileGroups = [];

  // Check for Branding Uncover (2x 2560x1440)
  // Only match files with "uncover" in name or folder to avoid mixing with branding-scratcher
  const uncoverFiles = allFiles.filter(f => {
    if (f.dimensions !== '2560x1440') return false;
    // Skip HTML5 files - branding-uncover only supports static images
    if (f.isHTML5 || f.fileType === 'html5') return false;
    const fileName = (f.name || '').toLowerCase();
    const folderPath = (f.folderPath || '').toLowerCase();
    return fileName.includes('uncover') || folderPath.includes('uncover');
  });

  // Group by folder to prevent mixing files from different folders
  const uncoverByFolder = groupByFolderPath(uncoverFiles);

  // Then create pairs within each folder
  for (const folderKey in uncoverByFolder) {
    const files = uncoverByFolder[folderKey];
    // Group in pairs
    for (let i = 0; i < files.length - 1; i += 2) {
      multiFileGroups.push({
        format: 'branding-uncover',
        network: 'SOS',
        files: [files[i], files[i + 1]],
        complete: true,
        requiredCount: 2,
        roles: ['cover', 'uncover'],
        folderPath: folderKey  // Store folder path for filtering
      });
    }
    // If odd number, last one is incomplete
    if (files.length % 2 === 1) {
      multiFileGroups.push({
        format: 'branding-uncover',
        network: 'SOS',
        files: [files[files.length - 1]],
        complete: false,
        requiredCount: 2,
        roles: ['cover', 'uncover'],
        folderPath: folderKey  // Store folder path for filtering
      });
    }
  }

  // Check for Spincube (4x 480x480)
  // First, identify Spincube files by name/folder, then by dimension
  const spincubeFiles = allFiles.filter(f => f.dimensions === '480x480');

  // Group by folder path - only files with "spincube" in name/folder
  const spincubeByFolder = groupByFolderPath(spincubeFiles, file => {
    // Skip HTML5 files - spincube only supports static images
    if (file.isHTML5 || file.fileType === 'html5') return false;
    const fileName = (file.name || '').toLowerCase();
    const folderPath = (file.folderPath || '').toLowerCase();
    return fileName.includes('spincube') || folderPath.includes('spincube');
  });

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
        roles: ['banner', 'banner', 'banner', 'banner'],
        folderPath: folderKey  // Store folder path for filtering
      });
    } else {
      // Incomplete Spincube set
      multiFileGroups.push({
        format: 'spincube',
        network: 'SOS',
        files: files,
        complete: false,
        requiredCount: 4,
        roles: ['banner', 'banner', 'banner', 'banner'],
        folderPath: folderKey  // Store folder path for filtering
      });
    }
  }

  // DO NOT process ungrouped 480x480 files as Spincube
  // Only files with "spincube" in name/folder are considered Spincube format
  // This prevents regular 480x480 banners from being incorrectly matched as Spincube

  // Check for Spinner (4x 300x600)
  // First, identify Spinner files by name/folder containing "spinner"
  const skyscraperFiles = allFiles.filter(f => f.dimensions === '300x600');

  // Group by folder path - only files with "spinner" in name/folder
  const spinnerByFolder = groupByFolderPath(skyscraperFiles, file => {
    // Skip HTML5 files - spinner only supports static images
    if (file.isHTML5 || file.fileType === 'html5') return false;
    const fileName = (file.name || '').toLowerCase();
    const folderPath = (file.folderPath || '').toLowerCase();
    return fileName.includes('spinner') || folderPath.includes('spinner');
  });

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
        roles: ['side1', 'side2', 'side3', 'side4'],
        folderPath: folderKey  // Store folder path for filtering
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
        notes: 'Using 2 images (will be used twice)',
        folderPath: folderKey  // Store folder path for filtering
      });
    } else {
      // Incomplete Spinner set
      multiFileGroups.push({
        format: 'spinner',
        network: 'SOS',
        files: files,
        complete: false,
        requiredCount: 4,
        roles: ['side1', 'side2', 'side3', 'side4'],
        folderPath: folderKey  // Store folder path for filtering
      });
    }
  }

  // Check for HP Exclusive Desktop (461x100 trigger + 1100x500 banner)
  const triggers = allFiles.filter(f => f.dimensions === '461x100');
  const banners = allFiles.filter(f => f.dimensions === '1100x500');

  // Group by folder to prevent mixing files from different folders
  const triggersByFolder = groupByFolderPath(triggers);
  const bannersByFolder = groupByFolderPath(banners);

  // Get all unique folder keys
  const allFolderKeys = new Set([...Object.keys(triggersByFolder), ...Object.keys(bannersByFolder)]);

  // Pair triggers with banners within each folder
  for (const folderKey of allFolderKeys) {
    const folderTriggers = triggersByFolder[folderKey] || [];
    const folderBanners = bannersByFolder[folderKey] || [];
    const pairCount = Math.min(folderTriggers.length, folderBanners.length);

    // Create complete pairs
    for (let i = 0; i < pairCount; i++) {
      multiFileGroups.push({
        format: 'exclusive-desktop',
        network: 'HP_EXCLUSIVE',
        files: [folderTriggers[i], folderBanners[i]],
        complete: true,
        requiredCount: 2,
        roles: ['trigger', 'banner'],
        folderPath: folderKey  // Store folder path for filtering
      });
    }

    // If unpaired triggers, mark as incomplete
    if (folderTriggers.length > pairCount) {
      for (let i = pairCount; i < folderTriggers.length; i++) {
        multiFileGroups.push({
          format: 'exclusive-desktop',
          network: 'HP_EXCLUSIVE',
          files: [folderTriggers[i]],
          complete: false,
          requiredCount: 2,
          roles: ['trigger', 'banner'],
          folderPath: folderKey  // Store folder path for filtering
        });
      }
    }

    // If unpaired banners, mark as incomplete
    if (folderBanners.length > pairCount) {
      for (let i = pairCount; i < folderBanners.length; i++) {
        multiFileGroups.push({
          format: 'exclusive-desktop',
          network: 'HP_EXCLUSIVE',
          files: [folderBanners[i]],
          complete: false,
          requiredCount: 2,
          roles: ['trigger', 'banner'],
          folderPath: folderKey  // Store folder path for filtering
        });
      }
    }
  }

  return multiFileGroups;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CREATIVE_SPECS,
    FORMAT_SYSTEM_MAPPING,
    FORMAT_NAME_MAP,
    getAllowedSystemsForFormat,
    isFormatAllowedForSystem,
    getFormatDisplayName,
    parseDimension,
    findMatchingFormats,
    validateFileForFormat,
    detectMultiFileFormats,
    groupByFolderPath
  };
}
