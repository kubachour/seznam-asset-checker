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
      dimensions: ['640x480', '338x190', '338x338'],
      maxSize: 500, // 500 KB limit for inarticle
      formats: ['jpg', 'png'],
      device: 'Desktop/Mobil',
      tier: ['HIGH'],
      notes: 'Inarticle placement. 500KB limit.'
    },
    'nativni-inzerat': {
      name: 'Nativní inzerát (In-article)',
      dimensions: ['640x480', '338x190', '338x338'],
      maxSize: 500, // 500 KB limit to match inarticle
      formats: ['jpg', 'png'],
      device: 'Desktop/Mobil',
      tier: ['HIGH'],
      notes: 'In-article placement.'
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
    'mobilni-flip': {
      name: 'Mobilní Flip',
      dimensions: ['480x480'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif'],
      device: 'Mobil',
      tier: ['HIGH'],
      multiFile: true,
      fileCount: 2,
      fileRoles: ['side_a', 'side_b'],
      notes: '2× 480×480 banners required (A and B side). Variant of spincube with 2 sides.'
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
      dimensions: ['1200x628', '1200x1200'],
      maxSize: 1024, // 1 MB
      formats: ['jpg', 'png', 'gif', 'webp', 'avif'],
      device: 'Desktop/Mobil',
      tier: ['HIGH', 'LOW'],
      notes: 'Banner bez textu (pro nativ). Recommended: 1200×628 / 1200×1200.'
    }
  },

  // =============================================================================
  // SKLIK SPECIFICATIONS (No tier distinction)
  // =============================================================================
  SKLIK: {
    'wallpaper': {
      name: 'Wallpaper',
      dimensions: ['480x300'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Desktop/Mobil'
    },
    'leaderboard': {
      name: 'Leaderboard',
      dimensions: ['970x210'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Desktop'
    },
    'sponzor-sluzby': {
      name: 'Sponzor služby',
      dimensions: ['300x250'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Desktop'
    },
    'rectangle': {
      name: 'Rectangle',
      dimensions: ['970x310'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Desktop'
    },
    'skyscraper': {
      name: 'Skyscraper',
      dimensions: ['300x600'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Desktop'
    },
    'mobilni-square': {
      name: 'Mobilní square',
      dimensions: ['300x300', '480x480'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Mobil'
    },
    'kombi': {
      name: 'Nativní inzerát / Kombi',
      dimensions: ['1200x628', '1200x1200'],
      maxSize: 1024, // 1 MB
      formats: ['jpg', 'png', 'gif', 'webp', 'avif'],
      device: 'Desktop/Mobil',
      notes: 'Banner bez textu (pro nativ). Recommended: 1200×628 / 1200×1200. Max: 4000px width/height.'
    },
    'leaderboard-middle': {
      name: 'Leaderboard middle',
      dimensions: ['728x90'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif'],
      device: 'Desktop'
    },
    'mobilni-leaderboard': {
      name: 'Mobilní leaderboard',
      dimensions: ['320x100'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif'],
      device: 'Mobil'
    },
    'skyscraper-sticky': {
      name: 'Skyscraper sticky',
      dimensions: ['160x600'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif', 'html5'],
      device: 'Desktop'
    },
    'mobilni-interscroller': {
      name: 'Mobilní Interscroller',
      dimensions: ['720x1280'],
      maxSize: 250,
      formats: ['jpg', 'png', 'gif', 'webp', 'avif'],
      device: 'Mobil',
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
  'exclusive': ['HP_EXCLUSIVE'],
  'branding-scratcher': ['SOS'],
  'branding-uncover': ['SOS'],
  'branding-videopanel': ['SOS'],
  'spinner': ['SOS'],
  'mobilni-flip': ['SOS'],
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
  'html5-banner': ['ADFORM', 'ONEGAR', 'SKLIK', 'HP_EXCLUSIVE'],

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

/**
 * Dimension to position name mapping for UTM URL generation
 * Maps banner dimensions to their spec-based position names
 */
const DIMENSION_TO_POSITION_MAP = {
  '480x300': 'wallpaper',
  '970x210': 'leaderboard',
  '300x250': 'sponzor-sluzby',
  '970x310': 'rectangle',
  '300x600': 'skyscraper',
  '300x300': 'mobilni-square',
  '480x480': 'mobilni-square-premium',
  '1200x628': 'kombi',
  '1200x1200': 'kombi',
  '728x90': 'leaderboard-middle',
  '320x100': 'mobilni-leaderboard',
  '160x600': 'skyscraper-sticky'
};

// =============================================================================
// FORMAT DETECTION PATTERNS (Centralized from file-analyzer.js)
// =============================================================================

/**
 * Format detection patterns - defines keywords and their mappings
 * Each pattern has: keywords (array), format, system, confidence
 * Used by detectFormatFromName() and detectFormatFromPath()
 */
const FORMAT_PATTERNS = [
  // Social media (exclude from all ad systems)
  { keywords: ['social-media', 'facebook', 'linkedin', 'twitter', 'instagram', 'tiktok'], format: 'social-media', system: null, confidence: 'high', isSocialMedia: true },

  // SOS-exclusive formats (high confidence)
  { keywords: ['spincube', 'spin-cube'], format: 'spincube', system: 'SOS', confidence: 'high' },
  { keywords: ['inarticle', 'in-article', 'in-articl'], format: 'inarticle', system: 'SOS', confidence: 'high' },
  { keywords: ['exclusive'], format: 'exclusive', system: 'HP_EXCLUSIVE', confidence: 'high' },
  { keywords: ['spinner'], format: 'spinner', system: 'SOS', confidence: 'high' },
  { keywords: ['mobilflip', 'mobil flip', 'mobil-flip', 'mobilní flip'], format: 'mobilni-flip', system: 'SOS', confidence: 'high' },

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
 * Extended path-based format patterns for detectFormatFromPath()
 * More specific patterns checked before generic ones
 */
const PATH_FORMAT_PATTERNS = [
  // HTML5 specific patterns (check before generic 'html5')
  { pattern: 'html5-adform', format: 'html5-adform' },
  { pattern: 'html5_adform', format: 'html5-adform' },
  { pattern: 'html5 adform', format: 'html5-adform' },
  { pattern: 'html5-sklik', format: 'html5-sklik' },
  { pattern: 'html5_sklik', format: 'html5-sklik' },
  { pattern: 'html5 sklik', format: 'html5-sklik' },
  { pattern: 'html5-self', format: 'html5-adform' },
  { pattern: 'html5_self', format: 'html5-adform' },
  { pattern: 'html5 self', format: 'html5-adform' },
  { pattern: 'html5-onegar', format: 'html5-onegar' },
  { pattern: 'html5_onegar', format: 'html5-onegar' },
  { pattern: 'html5 onegar', format: 'html5-onegar' },
  { pattern: 'html5', format: 'html5' },

  // UAC patterns
  { pattern: 'uac', format: 'uac' },

  // In-article patterns (format must match CREATIVE_SPECS key 'inarticle')
  { pattern: 'in-article', format: 'inarticle' },
  { pattern: 'in_article', format: 'inarticle' },
  { pattern: 'inarticle', format: 'inarticle' },
  { pattern: 'in article', format: 'inarticle' },

  // Kombi patterns
  { pattern: 'kombi', format: 'kombi' },

  // Branding patterns
  { pattern: 'branding scratcher', format: 'branding-scratcher' },
  { pattern: 'branding-scratcher', format: 'branding-scratcher' },
  { pattern: 'branding_scratcher', format: 'branding-scratcher' },
  { pattern: 'brandingscratcher', format: 'branding-scratcher' },
  { pattern: 'scratcher', format: 'branding-scratcher' },

  { pattern: 'branding uncover', format: 'branding-uncover' },
  { pattern: 'branding-uncover', format: 'branding-uncover' },
  { pattern: 'branding_uncover', format: 'branding-uncover' },
  { pattern: 'brandinguncover', format: 'branding-uncover' },
  { pattern: 'uncover', format: 'branding-uncover' },

  { pattern: 'branding sklik', format: 'branding-sklik' },
  { pattern: 'branding-sklik', format: 'branding-sklik' },
  { pattern: 'branding_sklik', format: 'branding-sklik' },

  { pattern: 'spincube', format: 'spincube' },
  { pattern: 'spin cube', format: 'spincube' },
  { pattern: 'spin-cube', format: 'spincube' },
  { pattern: 'spin_cube', format: 'spincube' },

  { pattern: 'spinner', format: 'spinner' },

  // MobilFlip patterns
  { pattern: 'mobilflip', format: 'mobilni-flip' },
  { pattern: 'mobil flip', format: 'mobilni-flip' },
  { pattern: 'mobil-flip', format: 'mobilni-flip' },
  { pattern: 'mobil_flip', format: 'mobilni-flip' },

  // Interscroller patterns
  { pattern: 'mobilni-interscroller', format: 'mobilni-interscroller' },
  { pattern: 'mobilni_interscroller', format: 'mobilni-interscroller' },
  { pattern: 'mobilni interscroller', format: 'mobilni-interscroller' },
  { pattern: 'interscroller', format: 'interscroller' },
  { pattern: 'inter-scroller', format: 'interscroller' },
  { pattern: 'inter_scroller', format: 'interscroller' },

  { pattern: 'exclusive desktop', format: 'exclusive-desktop' },
  { pattern: 'exclusive-desktop', format: 'exclusive-desktop' },
  { pattern: 'exclusive_desktop', format: 'exclusive-desktop' },
  { pattern: 'exclusivedesktop', format: 'exclusive-desktop' },
  { pattern: 'exclusive', format: 'exclusive' },

  { pattern: 'vanocni', format: 'vanocni' },
  { pattern: 'vanoce', format: 'vanocni' },
  { pattern: 'vánoční', format: 'vanocni' },
  { pattern: 'vánoce', format: 'vanocni' },

  { pattern: 'obecna', format: 'obecna' },
  { pattern: 'obecná', format: 'obecna' }
];

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
  if (specKey && specKey.includes('mobilni-flip')) return 'mobilni-flip';
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

  // Use assignedFormat (from folder path) as fallback when detectedFormat (from filename) is absent
  const effectiveFormat = fileData.assignedFormat || fileData.detectedFormat;

  // Filter networks based on detected format (if any)
  // This ensures format-specific files (e.g., spincube, spinner) only match their allowed systems
  let filteredNetworks = searchNetworks;
  if (effectiveFormat) {
    const allowedSystems = getAllowedSystemsForFormat(effectiveFormat);
    filteredNetworks = searchNetworks.filter(net => allowedSystems.includes(net));
  }

  for (const netName of filteredNetworks) {
    const networkSpecs = CREATIVE_SPECS[netName];

    for (const [specKey, spec] of Object.entries(networkSpecs)) {
      // If effective format exists and is not 'html5-banner', match only that specific specKey
      // This prevents rich media formats (spincube, spinner, branding-scratcher) from matching wrong specs
      // For UAC: if effectiveFormat is 'uac', match any specKey starting with 'uac-'
      if (effectiveFormat &&
          effectiveFormat !== 'html5-banner' &&
          specKey !== effectiveFormat &&
          !specKey.includes(effectiveFormat) &&
          !(effectiveFormat === 'uac' && specKey.startsWith('uac-'))) {
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

      // For multi-file formats, require effective format to match (via includes)
      // This prevents random files with matching dimensions from being validated as compatible
      // Only files with the format keyword in name/folder should match multi-file specs
      if (spec.multiFile && !specKey.includes(effectiveFormat || '')) {
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

  // Check for Mobilní Flip (2x 480x480)
  // Similar to spincube but only 2 files, detected by "mobilflip" or "mobil flip" keyword
  const mobilFlipByFolder = groupByFolderPath(spincubeFiles, file => {
    if (file.isHTML5 || file.fileType === 'html5') return false;
    const fileName = (file.name || '').toLowerCase();
    const folderPath = (file.folderPath || '').toLowerCase();
    const searchText = fileName + ' ' + folderPath;
    return searchText.includes('mobilflip') || searchText.includes('mobil flip') ||
           searchText.includes('mobil-flip') || searchText.includes('mobil_flip');
  });

  for (const folderKey in mobilFlipByFolder) {
    const files = mobilFlipByFolder[folderKey];
    multiFileGroups.push({
      format: 'mobilni-flip',
      network: 'SOS',
      files: files,
      complete: files.length === 2,
      requiredCount: 2,
      roles: ['side_a', 'side_b'],
      folderPath: folderKey
    });
  }

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

  // Check for HP Exclusive composite (trigger 461x100 + banner 1100x500 + mobile 480x300 + mobile 480x480)
  // All pieces with "exclusive" in folder/name are grouped into one composite per folder
  const exclusiveDimMap = {
    '461x100': 'trigger',
    '1100x500': 'banner',
    '480x300': 'mobile-wallpaper',
    '480x480': 'mobile-square'
  };
  const exclusiveExpectedPieces = ['trigger', 'banner', 'mobile-wallpaper', 'mobile-square'];

  const exclusiveFiles = allFiles.filter(f => {
    if (!exclusiveDimMap[f.dimensions]) return false;
    const fileName = (f.name || '').toLowerCase();
    const folderPath = (f.folderPath || '').toLowerCase();
    return fileName.includes('exclusive') || folderPath.includes('exclusive');
  });

  const exclusiveByFolder = groupByFolderPath(exclusiveFiles);

  for (const folderKey in exclusiveByFolder) {
    const files = exclusiveByFolder[folderKey];
    // Categorize files by piece type
    const pieceFiles = {};
    const roles = [];
    for (const file of files) {
      const pieceType = exclusiveDimMap[file.dimensions];
      if (!pieceFiles[pieceType]) pieceFiles[pieceType] = [];
      pieceFiles[pieceType].push(file);
      roles.push(pieceType);
    }

    const foundPieces = Object.keys(pieceFiles);
    const missingPieces = exclusiveExpectedPieces.filter(p => !foundPieces.includes(p));
    const isComplete = missingPieces.length === 0;

    multiFileGroups.push({
      format: 'exclusive',
      network: 'HP_EXCLUSIVE',
      files: files,
      complete: isComplete,
      requiredCount: exclusiveExpectedPieces.length,
      roles: roles,
      expectedPieces: exclusiveExpectedPieces,
      foundPieces: foundPieces,
      missingPieces: missingPieces,
      folderPath: folderKey
    });
  }

  return multiFileGroups;
}

// =============================================================================
// CENTRALIZED HELPER FUNCTIONS
// =============================================================================

/**
 * Get all network names from CREATIVE_SPECS
 * @returns {Array<string>} Array of network names
 */
function getAllNetworks() {
  return Object.keys(CREATIVE_SPECS);
}

/**
 * Get network name variants for path detection
 * Maps canonical network names to all valid path variants
 * @returns {Object} Object mapping canonical names to variant arrays
 */
function getNetworkVariants() {
  return {
    HP_EXCLUSIVE: ['HP_EXCLUSIVE', 'HPEXCLUSIVE', 'HP EXCLUSIVE', 'EXCLUSIVE'],
    GOOGLE_ADS: ['GOOGLE_ADS', 'GOOGLE ADS', 'GADS', 'GOOGLEADS']
  };
}

/**
 * Check if a network has tier support (HIGH/LOW)
 * @param {string} network - Network name
 * @returns {boolean} True if network has tiers
 */
function networkHasTiers(network) {
  const networkSpecs = CREATIVE_SPECS[network];
  if (!networkSpecs) return false;

  // Check if any spec in this network has non-empty tier array
  for (const spec of Object.values(networkSpecs)) {
    if (spec.tier && spec.tier.length > 0) {
      return true;
    }
  }
  return false;
}

/**
 * Get formats that are exclusive to SOS (only deployed to SOS)
 * Derives from FORMAT_SYSTEM_MAPPING
 * @returns {Array<string>} Array of SOS-exclusive format names
 */
function getSOSExclusiveFormats() {
  const sosExclusive = [];
  for (const [format, systems] of Object.entries(FORMAT_SYSTEM_MAPPING)) {
    if (systems.length === 1 && systems[0] === 'SOS') {
      sosExclusive.push(format);
    }
  }
  return sosExclusive;
}

/**
 * Detect specific format from folder path (e.g., branding-scratcher, spincube, etc.)
 * This prevents files from different formats but same dimensions from being mixed
 * @param {string} folderPath - Full folder path
 * @returns {string|null} Detected format name or null
 */
function detectFormatFromPath(folderPath) {
  if (!folderPath) return null;

  const pathLower = folderPath.toLowerCase();

  // Check each pattern from PATH_FORMAT_PATTERNS
  for (const { pattern, format } of PATH_FORMAT_PATTERNS) {
    if (pathLower.includes(pattern)) {
      return format;
    }
  }

  return null;
}

/**
 * Map banner dimensions to position name for UTM URL generation
 * @param {string} dimensions - Banner dimensions (e.g., "300x250")
 * @returns {string} Position name (e.g., "sponzor-sluzby")
 */
function getDimensionPosition(dimensions) {
  return DIMENSION_TO_POSITION_MAP[dimensions] || 'banner';
}

/**
 * Detect system name from folder path
 * @param {string} folderPath - Folder path
 * @returns {string|null} Detected system name or null
 */
function detectSystemFromPath(folderPath) {
  if (!folderPath) return null;

  const pathUpper = folderPath.toUpperCase();
  const networks = getAllNetworks();
  const variants = getNetworkVariants();

  // Build list of all systems including variants
  const systemsToCheck = [...networks];
  for (const [canonical, variantList] of Object.entries(variants)) {
    for (const variant of variantList) {
      if (!systemsToCheck.includes(variant)) {
        systemsToCheck.push(variant);
      }
    }
  }

  for (const system of systemsToCheck) {
    if (pathUpper.includes(system)) {
      // Normalize HP variants to HP_EXCLUSIVE
      if (system.startsWith('HP') || variants.HP_EXCLUSIVE?.includes(system)) {
        return 'HP_EXCLUSIVE';
      }
      // Normalize Google Ads variants to GOOGLE_ADS
      if (system.includes('GOOGLE') || system === 'GADS' || variants.GOOGLE_ADS?.includes(system)) {
        return 'GOOGLE_ADS';
      }
      return system;
    }
  }

  return null;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CREATIVE_SPECS,
    FORMAT_SYSTEM_MAPPING,
    FORMAT_NAME_MAP,
    DIMENSION_TO_POSITION_MAP,
    FORMAT_PATTERNS,
    BRANDING_SUBTYPES,
    PATH_FORMAT_PATTERNS,
    getAllNetworks,
    getNetworkVariants,
    networkHasTiers,
    getSOSExclusiveFormats,
    getDimensionPosition,
    detectFormatFromPath,
    detectSystemFromPath,
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
