// File Renamer Module for Creative Validator
// Handles file renaming according to Seznam naming conventions

/**
 * Generate new filename for a creative file
 * @param {Object} params - Renaming parameters
 * @param {Object} params.fileData - Analyzed file data
 * @param {string} params.network - Network name (ADFORM, SOS, ONEGAR, SKLIK, HP_EXCLUSIVE)
 * @param {string} params.campaignName - Campaign name
 * @param {string} params.formatName - Format display name (banner, branding, kombi, etc.)
 * @param {string} params.variant - Optional variant (_hp, _obsah, _sport, _trigger, _banner, etc.)
 * @returns {string} New filename
 */
function renameFile(params) {
  const {
    fileData,
    network,
    campaignName,
    formatName,
    variant = null
  } = params;

  // Build ad-network part (seznam_sos, seznam_onegar, etc.)
  const adNetwork = `seznam_${network.toLowerCase()}`;

  // Build dimensions
  const dimensions = `${fileData.width}x${fileData.height}`;

  // Handle HTML5 special case (dash instead of underscore)
  const isHTML5 = fileData.fileType === 'html5';
  const contentSeparator = isHTML5 ? '-html5_' : '_';

  // Build filename parts
  let filename = `${adNetwork}-${campaignName}-content${contentSeparator}${formatName}_${dimensions}`;

  // Add variant if provided (for in-article or multi-file formats)
  if (variant) {
    filename += `_${variant}`;
  }

  // Add extension
  filename += `.${fileData.format}`;

  return filename;
}

/**
 * Rename file for a specific network/format match
 * @param {Object} fileData - Analyzed file data
 * @param {Object} matchedFormat - Matched format from validation
 * @param {string} network - Network name
 * @param {string} campaignName - Campaign name
 * @param {string} variant - Optional variant
 * @returns {string} New filename
 */
function renameFileForMatch(fileData, matchedFormat, network, campaignName, variant = null) {
  return renameFile({
    fileData,
    network,
    campaignName,
    formatName: matchedFormat.formatDisplay,
    variant
  });
}

/**
 * Rename all files for a specific network
 * @param {Array} files - Array of file objects with their matched formats
 * @param {string} network - Network name
 * @param {string} campaignName - Campaign name
 * @param {Object} variantMap - Optional map of fileName -> variant
 * @returns {Object} Map of original filename -> new filename
 */
function renameAllFiles(files, network, campaignName, variantMap = {}) {
  const renameMap = {};

  for (const fileData of files) {
    // Get variant if provided
    const variant = variantMap[fileData.name] || null;

    // Get format name (would come from matched format in practice)
    const formatName = getFormatDisplayName(fileData.dimensions, null);

    const newName = renameFile({
      fileData,
      network,
      campaignName,
      formatName,
      variant
    });

    renameMap[fileData.name] = newName;
  }

  return renameMap;
}

/**
 * Generate variant options for a format
 * @param {string} formatName - Format name
 * @returns {Array<string>} Array of variant options
 */
function getVariantOptions(formatName) {
  // In-article formats have content variants
  if (formatName === 'in-article') {
    return ['hp', 'obsah', 'sport', 'custom'];
  }

  // Branding Uncover has cover/uncover roles
  if (formatName === 'uncover') {
    return ['cover', 'uncover'];
  }

  // HP Exclusive has trigger/banner roles
  if (formatName.includes('exclusive')) {
    return ['trigger', 'banner'];
  }

  // Spincube has banner role for all 4 files
  if (formatName === 'spincube') {
    return ['banner'];
  }

  return [];
}

/**
 * Check if a format requires variant selection
 * @param {string} formatName - Format name
 * @returns {boolean} True if variant selection needed
 */
function requiresVariant(formatName) {
  return getVariantOptions(formatName).length > 0;
}

/**
 * Sanitize campaign name for use in filenames
 * @param {string} campaignName - Campaign name
 * @returns {string} Sanitized name
 */
function sanitizeCampaignName(campaignName) {
  // Replace spaces with hyphens
  // Remove special characters except hyphens and underscores
  // Convert to lowercase
  return campaignName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Preview filename before renaming
 * @param {Object} fileData - Analyzed file data
 * @param {string} network - Network name
 * @param {string} campaignName - Campaign name
 * @param {string} formatName - Format name
 * @param {string} variant - Optional variant
 * @returns {Object} Preview object with old and new names
 */
function previewRename(fileData, network, campaignName, formatName, variant = null) {
  const sanitizedCampaign = sanitizeCampaignName(campaignName);

  const newName = renameFile({
    fileData,
    network,
    campaignName: sanitizedCampaign,
    formatName,
    variant
  });

  return {
    originalName: fileData.name,
    newName: newName,
    network: network,
    formatName: formatName,
    variant: variant,
    dimensions: `${fileData.width}x${fileData.height}`
  };
}

/**
 * Batch preview for multiple files
 * @param {Array} filesWithFormats - Array of {fileData, matchedFormat, network, variant}
 * @param {string} campaignName - Campaign name
 * @returns {Array} Array of preview objects
 */
function batchPreviewRename(filesWithFormats, campaignName) {
  const previews = [];

  for (const item of filesWithFormats) {
    const preview = previewRename(
      item.fileData,
      item.network,
      campaignName,
      item.matchedFormat.formatDisplay,
      item.variant
    );
    previews.push(preview);
  }

  return previews;
}

/**
 * Validate filename length (avoid overly long filenames)
 * @param {string} filename - Filename to validate
 * @param {number} maxLength - Maximum allowed length (default 255)
 * @returns {{valid: boolean, length: number, message: string}}
 */
function validateFilenameLength(filename, maxLength = 255) {
  const length = filename.length;
  const valid = length <= maxLength;

  return {
    valid,
    length,
    message: valid ? 'OK' : `Filename too long (${length} > ${maxLength} characters)`
  };
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renameFile,
    renameFileForMatch,
    renameAllFiles,
    getVariantOptions,
    requiresVariant,
    sanitizeCampaignName,
    previewRename,
    batchPreviewRename,
    validateFilenameLength
  };
}
