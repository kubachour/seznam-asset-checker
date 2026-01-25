/**
 * File Type Definitions - SINGLE SOURCE OF TRUTH
 * Centralized constants and helpers for all file type handling
 *
 * This module ensures consistent file type detection across:
 * - Drag-and-drop folder uploads
 * - Direct file uploads
 * - ZIP file extraction
 * - HTML5 banner validation
 */

// =============================================================================
// FILE TYPE CONSTANTS
// =============================================================================

const FILE_TYPES = {
  // Supported extensions by category
  IMAGE_EXTENSIONS: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'],
  HTML_EXTENSIONS: ['html', 'htm'],
  ARCHIVE_EXTENSIONS: ['zip'],
  SUPPORTED_EXTENSIONS: [], // Computed below

  // MIME type patterns
  MIME_TYPES: {
    IMAGE_PREFIX: 'image/',
    ZIP: ['application/zip', 'application/x-zip-compressed'],
    HTML: ['text/html', 'application/xhtml+xml']
  },

  // Type identifiers (used throughout the app)
  TYPES: {
    IMAGE: 'image',
    HTML: 'html',
    ZIP: 'zip',
    HTML5: 'html5',
    UNKNOWN: 'unknown'
  }
};

// Compute all supported extensions
FILE_TYPES.SUPPORTED_EXTENSIONS = [
  ...FILE_TYPES.IMAGE_EXTENSIONS,
  ...FILE_TYPES.HTML_EXTENSIONS,
  ...FILE_TYPES.ARCHIVE_EXTENSIONS
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const FileTypeHelpers = {
  /**
   * Check if extension is an image format
   * @param {string} ext - File extension (case-insensitive)
   * @returns {boolean}
   */
  isImageExtension(ext) {
    return FILE_TYPES.IMAGE_EXTENSIONS.includes(ext.toLowerCase());
  },

  /**
   * Check if extension is an HTML file
   * @param {string} ext - File extension (case-insensitive)
   * @returns {boolean}
   */
  isHTMLExtension(ext) {
    return FILE_TYPES.HTML_EXTENSIONS.includes(ext.toLowerCase());
  },

  /**
   * Check if extension is an archive format
   * @param {string} ext - File extension (case-insensitive)
   * @returns {boolean}
   */
  isArchiveExtension(ext) {
    return FILE_TYPES.ARCHIVE_EXTENSIONS.includes(ext.toLowerCase());
  },

  /**
   * Check if extension is supported by the app
   * @param {string} ext - File extension (case-insensitive)
   * @returns {boolean}
   */
  isSupportedExtension(ext) {
    return FILE_TYPES.SUPPORTED_EXTENSIONS.includes(ext.toLowerCase());
  },

  /**
   * Extract file extension from filename
   * @param {string} filename - File name with extension
   * @returns {string} Lowercase extension without dot
   */
  getExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }
};

// =============================================================================
// GLOBAL EXPORTS
// =============================================================================

// Make available globally for all modules
window.FILE_TYPES = FILE_TYPES;
window.FileTypeHelpers = FileTypeHelpers;

console.log('✅ File type definitions loaded:', {
  imageFormats: FILE_TYPES.IMAGE_EXTENSIONS.length,
  htmlFormats: FILE_TYPES.HTML_EXTENSIONS.length,
  archiveFormats: FILE_TYPES.ARCHIVE_EXTENSIONS.length,
  totalSupported: FILE_TYPES.SUPPORTED_EXTENSIONS.length
});
