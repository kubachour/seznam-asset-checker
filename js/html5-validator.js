/**
 * HTML5 Banner Validator
 * Validates HTML5 banner ZIP files according to Seznam.cz advertising specs
 */

(function(window) {
  'use strict';

  // Validation rules based on Seznam.cz specs
  const VALIDATION_RULES = {
    maxFiles: 40,
    maxSubdirectoryLevels: 2,
    requiredHTMLFiles: 1, // Exactly 1 HTML file
    allowedExtensions: ['htm', 'html', 'css', 'js', 'gif', 'png', 'jpg', 'jpeg', 'svg', 'webp', 'avif', 'woff', 'woff2', 'ttf', 'eot', 'json', 'txt', 'xml'],
    prohibitedFunctions: [
      'window.open(',
      'Enabler.exit(',
      'mraid.open(',
      'gwd.actions.gwdGenericad.exit(',
      'gwdGoogleAd.exit(',
      'gwdGoogleAd.exitOverride('
    ],
    whitelistedCDNs: [
      'fonts.googleapis.com',
      'cdnjs.cloudflare.com',
      'code.jquery.com',
      'cdn.jsdelivr.net',
      'ajax.googleapis.com'
    ]
  };

  /**
   * Detect if a file is an HTML5 banner ZIP by name pattern
   * @param {string} fileName - File name to check
   * @returns {boolean} True if matches HTML5 pattern
   */
  function isHTML5BannerByName(fileName) {
    // Pattern: Must contain "html5" and be a ZIP file
    // Matches: "HTML5_970x210_leaderboard.zip", "2511-HTML5-Zimni-kampan-300x250-V2.zip", etc.
    const nameLower = fileName.toLowerCase();
    return nameLower.includes('html5') && fileName.endsWith('.zip');
  }

  /**
   * Extract dimension from HTML5 banner filename
   * @param {string} fileName - File name (e.g., "HTML5_970x210_leaderboard.zip")
   * @returns {string|null} Dimension string (e.g., "970x210") or null
   */
  function extractDimensionFromName(fileName) {
    const match = fileName.match(/(\d+)x(\d+)/i);
    if (match) {
      return `${match[1]}x${match[2]}`;
    }
    return null;
  }

  /**
   * Count subdirectory levels in a path
   * @param {string} path - File path
   * @returns {number} Number of subdirectory levels
   */
  function countSubdirectoryLevels(path) {
    if (!path) return 0;
    const parts = path.split('/').filter(p => p && p !== '.');
    return parts.length;
  }

  /**
   * Validate file structure of HTML5 ZIP
   * @param {Object} zip - JSZip object
   * @returns {Object} Validation result with issues array
   */
  async function validateZIPStructure(zip) {
    const issues = [];
    const files = Object.keys(zip.files).filter(name => !zip.files[name].dir);

    // Check file count
    if (files.length > VALIDATION_RULES.maxFiles) {
      issues.push(`Příliš mnoho souborů: ${files.length} (maximum: ${VALIDATION_RULES.maxFiles})`);
    }

    // Check for HTML files in root
    const htmlFilesInRoot = files.filter(name => {
      const path = name.split('/');
      const isRoot = path.length === 1;
      const ext = name.split('.').pop().toLowerCase();
      return isRoot && (ext === 'html' || ext === 'htm');
    });

    if (htmlFilesInRoot.length === 0) {
      issues.push('Chybí HTML soubor v kořenovém adresáři');
    } else if (htmlFilesInRoot.length > 1) {
      issues.push(`Více než jeden HTML soubor v kořenu: ${htmlFilesInRoot.length} (povolený: 1)`);
    }

    // Check subdirectory levels
    for (const fileName of files) {
      const levels = countSubdirectoryLevels(fileName);
      if (levels > VALIDATION_RULES.maxSubdirectoryLevels) {
        issues.push(`Příliš hluboká struktura adresářů: ${fileName} (maximum: ${VALIDATION_RULES.maxSubdirectoryLevels} úrovně)`);
        break;
      }
    }

    // Check file extensions
    const invalidExtensions = [];
    for (const fileName of files) {
      const ext = fileName.split('.').pop().toLowerCase();
      if (!VALIDATION_RULES.allowedExtensions.includes(ext)) {
        invalidExtensions.push(`${fileName} (.${ext})`);
      }
    }
    if (invalidExtensions.length > 0) {
      issues.push(`Nepovolené přípony souborů: ${invalidExtensions.slice(0, 3).join(', ')}${invalidExtensions.length > 3 ? ` a další ${invalidExtensions.length - 3}` : ''}`);
    }

    return {
      valid: issues.length === 0,
      issues: issues,
      htmlFiles: htmlFilesInRoot
    };
  }

  /**
   * Validate HTML content
   * @param {string} htmlContent - HTML file content
   * @returns {Object} Validation result with issues array
   */
  function validateHTMLContent(htmlContent) {
    const issues = [];
    const htmlLower = htmlContent.toLowerCase();

    // Check for required tags
    if (!htmlLower.includes('<html')) {
      issues.push('Chybí tag <html>');
    }
    if (!htmlLower.includes('<body')) {
      issues.push('Chybí tag <body>');
    }

    // Check for clickthrough link
    if (!htmlContent.includes('__CLICKTHRU__')) {
      issues.push('Chybí proměnná __CLICKTHRU__ pro clickthrough URL');
    }

    // Count <a> tags
    const aTagMatches = htmlContent.match(/<a\s+[^>]*>/gi);
    if (!aTagMatches || aTagMatches.length === 0) {
      issues.push('Chybí tag <a> pro kliknutí');
    } else if (aTagMatches.length > 1) {
      issues.push(`Více než jeden tag <a> nalezen: ${aTagMatches.length} (povolený: 1)`);
    } else {
      // Check target="_top" in the <a> tag
      const aTag = aTagMatches[0];
      if (!aTag.includes('target="_top"') && !aTag.includes("target='_top'")) {
        issues.push('Tag <a> musí mít target="_top"');
      }
    }

    // Check for prohibited functions
    for (const func of VALIDATION_RULES.prohibitedFunctions) {
      if (htmlContent.includes(func)) {
        issues.push(`Zakázaná funkce: ${func}`);
      }
    }

    // Check for external resources (basic check for CDNs)
    const urlMatches = htmlContent.match(/https?:\/\/[^\s"']+/gi);
    if (urlMatches) {
      const externalUrls = urlMatches.filter(url => {
        const urlLower = url.toLowerCase();
        return !VALIDATION_RULES.whitelistedCDNs.some(cdn => urlLower.includes(cdn));
      });
      if (externalUrls.length > 0) {
        issues.push(`Nepovolené externí zdroje: ${externalUrls.slice(0, 2).join(', ')}${externalUrls.length > 2 ? '...' : ''}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues: issues
    };
  }

  /**
   * Validate complete HTML5 banner ZIP file
   * @param {File} file - ZIP file to validate
   * @returns {Promise<Object>} Validation result
   */
  async function validateHTML5Banner(file) {
    const result = {
      valid: false,
      isHTML5: false,
      dimensions: null,
      issues: [],
      warnings: []
    };

    try {
      // Check if JSZip is available
      if (typeof JSZip === 'undefined') {
        result.issues.push('JSZip knihovna není dostupná');
        return result;
      }

      // Load ZIP file
      const zip = await JSZip.loadAsync(file);
      result.isHTML5 = true;

      // Extract dimensions from filename
      result.dimensions = extractDimensionFromName(file.name);
      if (!result.dimensions) {
        result.warnings.push('Nepodařilo se zjistit rozměry z názvu souboru (očekávaný formát: HTML5_WIDTHxHEIGHT_name.zip)');
      }

      // Validate ZIP structure
      const structureValidation = await validateZIPStructure(zip);
      result.issues.push(...structureValidation.issues);

      // If structure is valid, validate HTML content
      if (structureValidation.valid && structureValidation.htmlFiles.length > 0) {
        const htmlFileName = structureValidation.htmlFiles[0];
        const htmlContent = await zip.file(htmlFileName).async('string');

        const htmlValidation = validateHTMLContent(htmlContent);
        result.issues.push(...htmlValidation.issues);
      }

      // Check naming convention
      if (!isHTML5BannerByName(file.name)) {
        result.warnings.push('Název souboru neodpovídá doporučenému formátu HTML5_WIDTHxHEIGHT_name.zip');
      }

      result.valid = result.issues.length === 0;

    } catch (error) {
      result.issues.push(`Chyba při zpracování ZIP: ${error.message}`);
    }

    return result;
  }

  /**
   * Check if a ZIP file contains HTML files (quick check)
   * @param {File} file - ZIP file to check
   * @returns {Promise<boolean>} True if contains HTML files
   */
  async function isHTML5ZIP(file) {
    try {
      if (typeof JSZip === 'undefined') return false;

      const zip = await JSZip.loadAsync(file);
      const files = Object.keys(zip.files);

      return files.some(name => {
        const ext = name.split('.').pop().toLowerCase();
        return ext === 'html' || ext === 'htm';
      });
    } catch (error) {
      return false;
    }
  }

  // Export functions
  window.HTML5Validator = {
    validateHTML5Banner,
    isHTML5BannerByName,
    isHTML5ZIP,
    extractDimensionFromName,
    VALIDATION_RULES
  };

})(window);
