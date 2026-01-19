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
 * UPDATED: Implements strict per-network UTM requirements
 * @param {Object} params - URL generation parameters
 * @param {Object} params.fileData - Analyzed file data
 * @param {string} params.network - Network name (ADFORM, SOS, ONEGAR, SKLIK, HP_EXCLUSIVE, GOOGLE_ADS)
 * @param {string} params.tier - Tier level (HIGH, LOW, MKT) or null
 * @param {string} params.campaignName - Campaign name
 * @param {string} params.contentName - Content name (for utm_content)
 * @param {string} params.landingPage - Landing page URL
 * @param {string} params.formatName - Format display name
 * @param {string} params.placement - Optional placement/umístění (hp, obsah, sport, zpravy, etc.)
 * @returns {string} Complete URL with UTM parameters
 */
function generateURL(params) {
  const {
    fileData,
    network,
    tier,
    campaignName,
    contentName = '',
    landingPage,
    formatName,
    placement = null
  } = params;

  let utmSource, utmMedium, utmCampaign, utmContent, utmTerm;

  // Network-specific UTM generation
  switch (network) {
    case 'ADFORM':
      // ADFORM: utm_source = seznam_onegar (routes through Onegar)
      utmSource = 'seznam_onegar';
      utmMedium = `banner_selfpromo_${tier.toLowerCase()}`;
      utmCampaign = campaignName; // Campaign name ONLY, no additions
      utmContent = contentName ? `${campaignName}-${contentName}_${formatName}_${placement || ''}`.replace(/_$/, '') : `${campaignName}-content_${formatName}_${placement || ''}`.replace(/_$/, '');
      utmTerm = placement ? `banner-${placement}` : 'banner'; // "banner" + placement
      break;

    case 'SOS':
      // SOS: Special utm_medium based on format
      utmSource = 'seznam_sos';

      // utm_medium based on format (SOS only has HIGH tier)
      if (formatName === 'inarticle' || formatName.includes('in-article')) {
        utmMedium = 'inarticle_selfpromo'; // No tier suffix
      } else if (formatName.includes('exclusive')) {
        utmMedium = 'exclusive_selfpromo'; // No tier suffix
      } else {
        utmMedium = 'banner_selfpromo_high'; // Standard banners
      }

      utmCampaign = campaignName; // Campaign name ONLY, no additions

      // utm_content: {campaign}-{content}_{format}_{placement}
      if (contentName) {
        utmContent = `${campaignName}-${contentName}_${formatName}${placement ? '_' + placement : ''}`;
      } else {
        utmContent = `${campaignName}-content_${formatName}${placement ? '_' + placement : ''}`;
      }

      // utm_term: {format_name}_{placement} (if placement filled)
      utmTerm = placement ? `${formatName}_${placement}` : formatName;
      break;

    case 'ONEGAR':
      // ONEGAR: utm_source = seznam_onegar
      utmSource = 'seznam_onegar';
      utmMedium = formatName === 'kombi' ? 'kombi_selfpromo' : `banner_selfpromo_${tier.toLowerCase()}`;
      utmCampaign = campaignName; // Campaign name ONLY, no additions
      utmContent = contentName ? `${campaignName}-${contentName}_${formatName}${placement ? '_' + placement : ''}` : `${campaignName}-content_${formatName}${placement ? '_' + placement : ''}`;
      utmTerm = placement ? `${formatName}_${placement}` : formatName;
      break;

    case 'SKLIK':
      // SKLIK: utm_campaign can have optional additions (dynamic)
      utmSource = 'seznam_sklik';

      if (formatName === 'kombi') {
        utmMedium = 'kombi_selfpromo';
      } else if (formatName.includes('interscroller')) {
        utmMedium = 'interscroller_selfpromo';
      } else if (formatName.includes('branding')) {
        utmMedium = `branding_selfpromo_${tier.toLowerCase()}`;
      } else {
        utmMedium = `banner_selfpromo_${tier.toLowerCase()}`;
      }

      // utm_campaign: campaign name + optional additions (kept flexible for Sklik)
      utmCampaign = campaignName;
      utmContent = contentName ? `${campaignName}-${contentName}_${formatName}${placement ? '_' + placement : ''}` : `${campaignName}-content_${formatName}${placement ? '_' + placement : ''}`;
      utmTerm = placement ? `${formatName}_${placement}` : formatName;
      break;

    case 'HP_EXCLUSIVE':
      utmSource = 'seznam_hp_exclusive';
      utmMedium = 'exclusive_selfpromo';
      utmCampaign = campaignName;
      utmContent = contentName ? `${campaignName}-${contentName}_${formatName}` : `${campaignName}-content_${formatName}`;
      utmTerm = formatName;
      break;

    case 'GOOGLE_ADS':
      utmSource = 'seznam_google_ads';
      utmMedium = `banner_selfpromo_${tier ? tier.toLowerCase() : 'high'}`;
      utmCampaign = campaignName;
      utmContent = contentName ? `${campaignName}-${contentName}_${formatName}` : `${campaignName}-content_${formatName}`;
      utmTerm = formatName;
      break;

    default:
      // Fallback to original behavior
      utmSource = `seznam_${network.toLowerCase()}`;
      utmMedium = buildMedium(formatName, tier, network, fileData.dimensions);
      utmCampaign = campaignName;
      utmContent = buildContent(campaignName, formatName, fileData.dimensions, placement, fileData.fileType === 'html5');
      utmTerm = buildTerm(formatName, placement);
  }

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
 * UPDATED: Uses new parameter structure with contentName and placement
 * @param {Object} fileData - Analyzed file data
 * @param {Object} matchedFormat - Matched format from validation
 * @param {string} network - Network name
 * @param {string} tier - Tier level
 * @param {string} campaignName - Campaign name
 * @param {string} contentName - Content name (optional)
 * @param {string} landingPage - Landing page URL
 * @param {string} placement - Optional placement (hp, obsah, sport, zpravy, etc.)
 * @returns {string} Generated URL
 */
function generateURLForMatch(fileData, matchedFormat, network, tier, campaignName, contentName, landingPage, placement = null) {
  const formatName = matchedFormat.formatDisplay;

  return generateURL({
    fileData,
    network,
    tier,
    campaignName,
    contentName,
    landingPage,
    formatName,
    placement
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
