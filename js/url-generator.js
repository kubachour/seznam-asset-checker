// URL Generator Module for Creative Validator
// Generates UTM-tagged URLs for each ad network and creative

/**
 * Build utm_medium parameter based on format, tier, and network
 * @param {string} formatName - Format name (banner, branding, kombi, etc.)
 * @param {string} tier - Tier level (HIGH, LOW, MKT)
 * @param {string} network - Network name
 * @param {string} dimensions - File dimensions (for certain formats)
 * @returns {string} utm_medium value
 */
function buildMedium(formatName, tier, network, dimensions = null) {
  const tierLower = tier ? tier.toLowerCase() : null;

  // Special handling for different format types

  // In-article format - no tier usually
  if (formatName === 'in-article') {
    return 'inarticle_selfpromo';
  }

  // Exclusive format - no tier
  if (formatName.includes('exclusive')) {
    return 'exclusive_selfpromo';
  }

  // Kombi format - no tier in examples
  if (formatName === 'kombi') {
    return 'kombi_selfpromo';
  }

  // Video formats - use "video" prefix
  if (formatName.includes('video') || formatName === 'videospot' || formatName === 'shorts') {
    if (tierLower === 'mkt') {
      return 'video_selfpromo_mkt';
    }
    return `video_selfpromo_${tierLower || 'high'}`;
  }

  // Special formats that don't use tier
  if (['branding', 'scratcher', 'uncover', 'spincube', 'interscroller', 'mobilni-interactive'].includes(formatName)) {
    return `${formatName}_selfpromo${tierLower ? '_' + tierLower : ''}`;
  }

  // Standard banner formats
  // Check if ADFORM is involved (would add _adform suffix)
  const isAdform = network === 'ADFORM';

  if (tierLower) {
    return `banner_selfpromo_${tierLower}${isAdform ? '_adform' : ''}`;
  }

  return 'banner_selfpromo';
}

/**
 * Build utm_content parameter
 * @param {string} campaignName - Campaign name
 * @param {string} formatName - Format name
 * @param {string} dimensions - File dimensions (optional)
 * @param {string} variant - Content variant (optional, e.g., _sport, _hp)
 * @param {boolean} isHTML5 - Whether file is HTML5
 * @returns {string} utm_content value
 */
function buildContent(campaignName, formatName, dimensions, variant = null, isHTML5 = false) {
  let content = `${campaignName}-content_${formatName}`;

  // Add HTML5 indicator if applicable (some examples show -html5)
  if (isHTML5 && formatName === 'banner') {
    content += '-html5';
  }

  // Add dimensions for certain formats
  if (dimensions && (formatName === 'banner' || formatName === 'kombi' || isHTML5)) {
    content += `_${dimensions}`;
  }

  // Add variant if provided
  if (variant) {
    content += `_${variant}`;
  }

  return content;
}

/**
 * Build utm_term parameter
 * @param {string} formatName - Format name
 * @param {string} variant - Content variant (optional)
 * @returns {string} utm_term value
 */
function buildTerm(formatName, variant = null) {
  let term = formatName;

  if (variant) {
    term += `_${variant}`;
  }

  return term;
}

/**
 * Generate complete URL with UTM parameters
 * @param {Object} params - URL generation parameters
 * @param {Object} params.fileData - Analyzed file data
 * @param {string} params.network - Network name (ADFORM, SOS, ONEGAR, SKLIK, HP_EXCLUSIVE, GOOGLE_ADS)
 * @param {string} params.tier - Tier level (HIGH, LOW, MKT) or null
 * @param {string} params.campaignName - Campaign name
 * @param {string} params.landingPage - Landing page URL
 * @param {string} params.formatName - Format display name
 * @param {string} params.variant - Optional variant (hp, obsah, sport, etc.)
 * @returns {string} Complete URL with UTM parameters
 */
function generateURL(params) {
  const {
    fileData,
    network,
    tier,
    campaignName,
    landingPage,
    formatName,
    variant = null
  } = params;

  // Build UTM parameters
  const utmSource = `seznam_${network.toLowerCase()}`;
  const utmMedium = buildMedium(formatName, tier, network, fileData.dimensions);
  const utmCampaign = campaignName;
  const utmContent = buildContent(
    campaignName,
    formatName,
    fileData.dimensions,
    variant,
    fileData.fileType === 'html5'
  );
  const utmTerm = buildTerm(formatName, variant);

  // Build URL
  const separator = landingPage.includes('?') ? '&' : '?';
  const url = `${landingPage}${separator}utm_source=${encodeURIComponent(utmSource)}&utm_medium=${encodeURIComponent(utmMedium)}&utm_campaign=${encodeURIComponent(utmCampaign)}&utm_content=${encodeURIComponent(utmContent)}&utm_term=${encodeURIComponent(utmTerm)}`;

  return url;
}

/**
 * Generate URLs for all files compatible with selected networks
 * @param {Array} files - Array of file objects with validation results
 * @param {Array} selectedNetworks - Array of {network, tier} objects
 * @param {string} campaignName - Campaign name
 * @param {string} landingPage - Landing page URL
 * @param {Object} variantMap - Optional map of fileName -> variant
 * @returns {Object} Map of fileId -> array of URLs per network
 */
function generateAllURLs(files, selectedNetworks, campaignName, landingPage, variantMap = {}) {
  const urlMap = {};

  for (const fileData of files) {
    const fileURLs = [];

    for (const selection of selectedNetworks) {
      const { network, tier } = selection;

      // Find compatible format for this network/tier
      // This would come from validation results in app.js
      // For now, assuming format is determined elsewhere

      // Get variant if provided
      const variant = variantMap[fileData.name] || null;

      // Generate URL (format name would come from validation)
      // This is a simplified version - in practice, format comes from validation
      const formatName = getFormatDisplayName(fileData.dimensions, null);

      const url = generateURL({
        fileData,
        network,
        tier,
        campaignName,
        landingPage,
        formatName,
        variant
      });

      fileURLs.push({
        network,
        tier,
        formatName,
        url
      });
    }

    urlMap[fileData.name] = fileURLs;
  }

  return urlMap;
}

/**
 * Generate URL for a specific file and network combination
 * @param {Object} fileData - Analyzed file data
 * @param {Object} matchedFormat - Matched format from validation
 * @param {string} network - Network name
 * @param {string} tier - Tier level
 * @param {string} campaignName - Campaign name
 * @param {string} landingPage - Landing page URL
 * @param {string} variant - Optional variant
 * @returns {string} Generated URL
 */
function generateURLForMatch(fileData, matchedFormat, network, tier, campaignName, landingPage, variant = null) {
  const formatName = matchedFormat.formatDisplay;

  return generateURL({
    fileData,
    network,
    tier,
    campaignName,
    landingPage,
    formatName,
    variant
  });
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateURL,
    generateAllURLs,
    generateURLForMatch,
    buildMedium,
    buildContent,
    buildTerm
  };
}
