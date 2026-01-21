// Main Application Controller for Creative Validator
// Handles state management, navigation, file upload, and workflow coordination

// =============================================================================
// GLOBAL STATE
// =============================================================================

const APP_VERSION = 'v1.3.0'; // Major update: Format detection fixes and workflow improvements

const appState = {
  currentStep: 1,
  uploadedFiles: [], // Array of analyzed file objects
  selectedNetworks: [], // [{ network: 'SOS', enabled: true }, ...]
  selectedCampaignTier: 'HIGH', // Campaign tier: 'HIGH' or 'LOW'
  validationResults: {}, // Compatibility matrix per file
  multiFileGroups: [], // Detected multi-file format groups
  networkStats: {}, // Per-network statistics: { ADFORM: { HIGH: {...}, LOW: {...} }, ... }
  // Campaign requirements (optional - step 2)
  campaignRequirements: [], // Parsed campaign table: [{ name, dimensions: [], maxSizeKB }]
  tableValidation: {}, // Per-requirement validation results
  campaignTableData: {}, // Per-dimension utm_campaign and targetUrl: { '300x250': { utm_campaign, targetUrl } }
  fieldsLockedByTable: false, // Whether campaign/URL fields are locked by table data
  // Export settings (step 4)
  campaignName: '',
  contentVariants: [],
  contentName: '',
  placement: '',
  landingURL: '',
  isZboziCampaign: false
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate tooltip text showing supported banner sizes, KB limits, and naming rules for a network
 * @param {string} network - Network name (e.g., 'SKLIK', 'SOS', 'ONEGAR')
 * @returns {string} HTML string for tooltip content
 */
function getNetworkTooltip(network) {
  const specs = CREATIVE_SPECS[network];
  if (!specs) return '';

  // Build supported formats section
  const dimensionMap = new Map();

  for (const [key, spec] of Object.entries(specs)) {
    for (const dim of spec.dimensions) {
      if (!dimensionMap.has(dim)) {
        dimensionMap.set(dim, {
          name: spec.name,
          maxSize: spec.maxSize,
          device: spec.device
        });
      }
    }
  }

  // Sort dimensions by size (width * height)
  const sortedDims = Array.from(dimensionMap.entries()).sort((a, b) => {
    const [wa, ha] = a[0].split('x').map(Number);
    const [wb, hb] = b[0].split('x').map(Number);
    return (wa * ha) - (wb * hb);
  });

  // Section 1: Supported formats
  let tooltip = `━━━ PODPOROVANÉ FORMÁTY ━━━\n`;
  for (const [dim, info] of sortedDims) {
    tooltip += `• ${dim} - max ${info.maxSize} KB`;
    if (info.device) {
      tooltip += ` (${info.device})`;
    }
    tooltip += `\n`;
  }

  // Section 2: Regular campaign naming rules
  tooltip += `\n━━━ PRAVIDLA POJMENOVÁNÍ (BĚŽNÉ) ━━━\n`;
  tooltip += `utm_campaign: služba_nazev-kampane\n`;
  tooltip += `  Příklad: hp_moje-kampan-2026\n\n`;
  tooltip += `utm_content: kampan-content_rozmery\n`;
  tooltip += `  Příklad: moje-kampan-brand_300x250\n\n`;
  tooltip += `utm_term: banner / kombi / video\n`;

  // Section 3: Zbozi campaign naming rules
  tooltip += `\n━━━ PRAVIDLA POJMENOVÁNÍ (ZBOŽÍ) ━━━\n`;
  tooltip += `LOW tier:\n`;
  tooltip += `  utm_campaign: zbozi_low_rok\n`;
  tooltip += `  utm_content: kampan-content-rozmery (vše pomlčky!)\n`;
  tooltip += `  utm_term: pozice (wallpaper, skyscraper...)\n\n`;
  tooltip += `HIGH tier:\n`;
  tooltip += `  utm_campaign: kampan_sluzba_pozice_datum\n`;
  tooltip += `  utm_content: kampan-content-rozmery (vše pomlčky!)\n`;
  tooltip += `  utm_term: sluzba_pozice\n`;

  return tooltip.trim();
}

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('Creative Validator initialized');

  // Display app version
  const versionElement = document.getElementById('appVersion');
  if (versionElement) {
    versionElement.textContent = APP_VERSION;
  }

  // Load saved campaign settings
  loadCampaignSettingsFromStorage();

  // Setup event listeners
  setupEventListeners();

  // Initialize step 1
  goToStep(1);
});

// =============================================================================
// DIRECTORY TRAVERSAL HELPERS
// =============================================================================

/**
 * Convert FileSystemFileEntry to File object
 * @param {FileSystemFileEntry} fileEntry - File entry
 * @returns {Promise<File>} File object
 */
function getFileFromEntry(fileEntry) {
  return new Promise((resolve, reject) => {
    fileEntry.file(resolve, reject);
  });
}

/**
 * Read all files from a directory recursively
 * @param {FileSystemDirectoryEntry} directoryEntry - Directory entry
 * @param {string} parentPath - Parent folder path
 * @returns {Promise<Array<File>>} Array of File objects with folderPath property
 */
async function readDirectoryRecursive(directoryEntry, parentPath = '') {
  const files = [];
  const entries = await readAllDirectoryEntries(directoryEntry);
  const currentPath = parentPath ? `${parentPath}/${directoryEntry.name}` : directoryEntry.name;

  for (const entry of entries) {
    if (entry.isFile) {
      try {
        const file = await getFileFromEntry(entry);
        // Only include image files
        const fileType = getFileFormat(file);
        if (fileType === 'image') {
          // Store folder path for system detection
          file.folderPath = currentPath;
          files.push(file);
        }
      } catch (error) {
        console.warn(`Could not read file: ${entry.name}`, error);
      }
    } else if (entry.isDirectory) {
      // Recursively read subdirectory
      const subFiles = await readDirectoryRecursive(entry, currentPath);
      files.push(...subFiles);
    }
  }

  return files;
}

/**
 * Read all entries from a directory
 * @param {FileSystemDirectoryEntry} directoryEntry - Directory entry
 * @returns {Promise<Array<FileSystemEntry>>} Array of entries
 */
async function readAllDirectoryEntries(directoryEntry) {
  const entries = [];
  const reader = directoryEntry.createReader();

  // Read entries in batches (readEntries returns max 100 at a time)
  const readBatch = () => {
    return new Promise((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
  };

  let batch = await readBatch();
  while (batch.length > 0) {
    entries.push(...batch);
    batch = await readBatch();
  }

  return entries;
}

// =============================================================================
// EVENT LISTENERS SETUP
// =============================================================================

function setupEventListeners() {
  // Step 1: File upload
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');

  if (uploadZone) {
    // Click to upload
    uploadZone.addEventListener('click', () => {
      fileInput.click();
    });

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');

      const items = e.dataTransfer.items;
      const files = [];

      if (items) {
        // Handle DataTransferItemList - support both files and folders
        const promises = [];

        for (let i = 0; i < items.length; i++) {
          if (items[i].kind === 'file') {
            const entry = items[i].webkitGetAsEntry ? items[i].webkitGetAsEntry() : items[i].getAsEntry();

            if (entry) {
              if (entry.isDirectory) {
                // Recursively collect files from directory
                promises.push(readDirectoryRecursive(entry));
              } else if (entry.isFile) {
                // Get the file
                promises.push(getFileFromEntry(entry).then(file => file ? [file] : []));
              }
            } else {
              // Fallback for browsers without FileSystem API
              const file = items[i].getAsFile();
              if (file) {
                files.push(file);
              }
            }
          }
        }

        // Wait for all directory/file reads to complete
        const results = await Promise.all(promises);
        results.forEach(result => {
          if (Array.isArray(result)) {
            files.push(...result);
          }
        });
      } else {
        // Fallback to files
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          files.push(e.dataTransfer.files[i]);
        }
      }

      if (files.length > 0) {
        await handleFileUpload(files);
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        await handleFileUpload(files);
      }
    });
  }

  // Step 3: Zbozi toggle - show/hide date fields
  const zboziToggle = document.getElementById('zboziToggle');
  const zboziDateFields = document.getElementById('zboziDateFields');

  if (zboziToggle && zboziDateFields) {
    zboziToggle.addEventListener('change', function(e) {
      zboziDateFields.style.display = e.target.checked ? 'block' : 'none';
      appState.isZboziCampaign = e.target.checked;
      updateExportPreview();
    });
  }
}

// =============================================================================
// NAVIGATION
// =============================================================================

function handleStepClick(stepNumber) {
  // Validate navigation requirements
  if (stepNumber >= 2 && appState.uploadedFiles.length === 0) {
    alert('Nejprve nahrajte soubory.');
    return;
  }

  // Step 2 (table validation) only exists if campaign table provided
  if (stepNumber === 2 && appState.campaignRequirements.length === 0) {
    alert('Kampaňová tabulka nebyla poskytnuta. Pokračujte na krok 3.');
    return;
  }

  if (stepNumber >= 3 && Object.keys(appState.validationResults).length === 0) {
    alert('Nejprve proveďte validaci bannerů.');
    return;
  }

  if (stepNumber >= 5 && appState.selectedNetworks.length === 0) {
    alert('Vyberte alespoň jeden systém před přechodem na export.');
    return;
  }

  // Allow navigation to previous steps or to valid next steps
  if (stepNumber <= appState.currentStep + 1) {
    goToStep(stepNumber);
  }
}

/**
 * Apply campaign table data to Step 4 fields (pre-fill and lock if needed)
 */
function applyCampaignTableData() {
  const campaignTableData = appState.campaignTableData || {};
  const dataEntries = Object.keys(campaignTableData);

  // If no campaign table data, do nothing
  if (dataEntries.length === 0) {
    return;
  }

  // Get dimensions of all uploaded files
  const uploadedDimensions = new Set();
  appState.uploadedFiles.forEach(file => {
    if (file.dimensions) {
      uploadedDimensions.add(file.dimensions);
    }
  });

  // Check how many uploaded dimensions have campaign table data
  const dimensionsWithData = [];
  const dimensionsWithoutData = [];
  uploadedDimensions.forEach(dim => {
    if (campaignTableData[dim]) {
      dimensionsWithData.push(dim);
    } else {
      dimensionsWithoutData.push(dim);
    }
  });

  const allDimensionsCovered = dimensionsWithData.length === uploadedDimensions.size && dimensionsWithData.length > 0;
  const someDimensionsCovered = dimensionsWithData.length > 0 && dimensionsWithData.length < uploadedDimensions.size;

  // Get common campaign name and URL (if all dimensions have the same value)
  let commonCampaign = null;
  let commonUrl = null;

  if (dimensionsWithData.length > 0) {
    const campaigns = new Set();
    const urls = new Set();

    dimensionsWithData.forEach(dim => {
      const data = campaignTableData[dim];
      if (data.utm_campaign) campaigns.add(data.utm_campaign);
      if (data.targetUrl) urls.add(data.targetUrl);
    });

    if (campaigns.size === 1) commonCampaign = Array.from(campaigns)[0];
    if (urls.size === 1) commonUrl = Array.from(urls)[0];
  }

  // Pre-fill fields if common values exist
  const campaignNameInput = document.getElementById('campaignName');
  const landingURLInput = document.getElementById('landingURL');
  const tableDataInfo = document.getElementById('tableDataInfo');

  if (allDimensionsCovered && commonCampaign && commonUrl) {
    // All dimensions covered and values are consistent - lock fields
    if (campaignNameInput) {
      campaignNameInput.value = commonCampaign;
      campaignNameInput.disabled = true;
      campaignNameInput.style.backgroundColor = '#f3f4f6';
      campaignNameInput.style.color = '#6b7280';
    }

    if (landingURLInput) {
      landingURLInput.value = commonUrl;
      landingURLInput.disabled = true;
      landingURLInput.style.backgroundColor = '#f3f4f6';
      landingURLInput.style.color = '#6b7280';
    }

    // Show info message with unlock button
    if (tableDataInfo) {
      tableDataInfo.innerHTML = `
        <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 6px; padding: 12px; margin-bottom: 15px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
            <div style="flex: 1;">
              <strong style="color: #1e40af;">📊 Načteno z kampaňové tabulky</strong>
              <div style="font-size: 13px; color: #1e40af; margin-top: 4px;">
                Název kampaně a cílová URL načteny pro všechny rozměry banneru.
              </div>
            </div>
            <button type="button" onclick="unlockTableDataFields()" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; white-space: nowrap;">
              ✏️ Upravit
            </button>
          </div>
        </div>
      `;
      tableDataInfo.style.display = 'block';
    }

    appState.fieldsLockedByTable = true;
  } else if (someDimensionsCovered) {
    // Some dimensions covered - show info, don't lock
    if (tableDataInfo) {
      tableDataInfo.innerHTML = `
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 12px; margin-bottom: 15px;">
          <strong style="color: #92400e;">📊 Částečná data z tabulky</strong>
          <div style="font-size: 13px; color: #92400e; margin-top: 4px;">
            Kampaň a URL načteny z tabulky pro rozměry: <strong>${dimensionsWithData.join(', ')}</strong>
            <br>Ručně zadejte údaje pro ostatní rozměry.
          </div>
        </div>
      `;
      tableDataInfo.style.display = 'block';
    }

    // Pre-fill if common values exist but don't lock
    if (commonCampaign && campaignNameInput && !campaignNameInput.value) {
      campaignNameInput.value = commonCampaign;
    }
    if (commonUrl && landingURLInput && !landingURLInput.value) {
      landingURLInput.value = commonUrl;
    }

    appState.fieldsLockedByTable = false;
  }
}

/**
 * Unlock fields that were locked by campaign table data
 */
function unlockTableDataFields() {
  const campaignNameInput = document.getElementById('campaignName');
  const landingURLInput = document.getElementById('landingURL');
  const tableDataInfo = document.getElementById('tableDataInfo');

  if (campaignNameInput) {
    campaignNameInput.disabled = false;
    campaignNameInput.style.backgroundColor = '';
    campaignNameInput.style.color = '';
  }

  if (landingURLInput) {
    landingURLInput.disabled = false;
    landingURLInput.style.backgroundColor = '';
    landingURLInput.style.color = '';
  }

  if (tableDataInfo) {
    tableDataInfo.innerHTML = `
      <div style="background: #d1fae5; border: 1px solid #10b981; border-radius: 6px; padding: 12px; margin-bottom: 15px;">
        <strong style="color: #065f46;">✏️ Pole odemčena</strong>
        <div style="font-size: 13px; color: #065f46; margin-top: 4px;">
          Můžete nyní upravit hodnoty ručně. Změny se použijí pro všechny bannery.
        </div>
      </div>
    `;
  }

  appState.fieldsLockedByTable = false;
}

function goToStep(stepNumber) {
  // Hide all sections
  const sections = document.querySelectorAll('.section');
  sections.forEach(section => section.classList.remove('active'));

  // Show target section
  const targetSection = document.getElementById(`step${stepNumber}`);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  // Update step indicators
  const steps = document.querySelectorAll('.step');
  steps.forEach((step, index) => {
    const stepNum = index + 1;
    step.classList.remove('active', 'completed');

    if (stepNum < stepNumber) {
      step.classList.add('completed');
    } else if (stepNum === stepNumber) {
      step.classList.add('active');
    }
  });

  // Refresh displays when navigating to steps
  if (stepNumber === 2 && appState.campaignRequirements.length > 0) {
    // Step 2: Table validation (only if campaign table provided)
    displayTableValidation();
  }

  if (stepNumber === 3 && Object.keys(appState.networkStats).length > 0) {
    // Step 3: System validation
    displayNetworkToggles();
  }

  if (stepNumber === 4 && Object.keys(appState.networkStats).length > 0) {
    // Step 4: Network selection (formerly Step 5)
    displayNetworkSelection();
  }

  if (stepNumber === 5) {
    // Step 5: Export (formerly Step 6)
    displayExportSettings();
  }

  appState.currentStep = stepNumber;
}

// =============================================================================
// EXPORT SETTINGS & URL GENERATION (Step 3)
// =============================================================================

/**
 * Update campaign tier selection
 * @param {string} tier - 'HIGH' or 'LOW'
 */
function updateCampaignTier(tier) {
  appState.selectedCampaignTier = tier;
  updateExportPreview();
}

/**
 * Update export preview with sample URL
 */
/**
 * Add a new content variant row
 */
function addContentVariant() {
  const container = document.getElementById('contentVariantsList');
  if (!container) return;

  const newRow = document.createElement('div');
  newRow.className = 'content-variant-row';
  newRow.style.cssText = 'display: flex; gap: 10px; margin-bottom: 8px; align-items: center;';
  newRow.innerHTML = `
    <input type="text" class="content-variant-input" placeholder="např. varianta-a" oninput="updateExportPreview()" style="flex: 1;" />
    <button type="button" class="btn-remove-variant" onclick="removeContentVariant(this)" style="background: #ef4444; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 14px;">✕</button>
  `;
  container.appendChild(newRow);
  updateContentVariantButtons();
  updateExportPreview();
}

/**
 * Remove a content variant row
 */
function removeContentVariant(button) {
  const row = button.closest('.content-variant-row');
  if (row) {
    row.remove();
    updateContentVariantButtons();
    updateExportPreview();
  }
}

/**
 * Update visibility of remove buttons (hide if only one variant)
 */
function updateContentVariantButtons() {
  const rows = document.querySelectorAll('.content-variant-row');
  rows.forEach((row, index) => {
    const removeBtn = row.querySelector('.btn-remove-variant');
    if (removeBtn) {
      removeBtn.style.display = rows.length > 1 ? 'block' : 'none';
    }
  });
}

/**
 * Get all content variants from the form
 */
function getContentVariants() {
  const inputs = document.querySelectorAll('.content-variant-input');
  return Array.from(inputs)
    .map(input => input.value.trim())
    .filter(value => value.length > 0);
}

/**
 * Get the current placement value (from dropdown or custom input)
 */
function getPlacementValue() {
  const placementSelect = document.getElementById('placement');
  const placementCustom = document.getElementById('placementCustom');

  if (!placementSelect) return '';

  if (placementSelect.value === 'custom' && placementCustom) {
    return placementCustom.value.trim();
  }

  return placementSelect.value;
}

function updateExportPreview() {
  // Read values from inputs
  const campaignName = document.getElementById('campaignName')?.value || '';
  const contentVariants = getContentVariants();
  const contentName = contentVariants.length > 0 ? contentVariants[0] : ''; // Use first variant for preview
  const landingURL = document.getElementById('landingURL')?.value || '';
  const placement = getPlacementValue();
  const zboziToggle = document.getElementById('zboziToggle')?.checked || false;

  // Update state
  appState.campaignName = campaignName;
  appState.contentVariants = contentVariants;
  appState.contentName = contentName; // Keeping for backwards compatibility
  appState.placement = placement;
  appState.landingURL = landingURL;
  appState.isZboziCampaign = zboziToggle;

  // Generate preview URL
  const previewContent = document.getElementById('urlPreviewContent');
  if (!previewContent) return;

  if (!campaignName || !contentName || !landingURL) {
    previewContent.textContent = 'Vyplňte údaje pro zobrazení náhledu URL';
    return;
  }

  // Generate example URL for SOS banner_selfpromo_high
  const exampleDimensions = '300x250';
  const exampleFormat = 'banner';
  const exampleService = 'hp';

  const sampleURL = generateBannerURL({
    network: 'SOS',
    tier: appState.selectedCampaignTier,
    campaignName: campaignName,
    contentName: contentName,
    landingURL: landingURL,
    dimensions: exampleDimensions,
    format: exampleFormat,
    service: exampleService,
    anchor: '',
    isZbozi: zboziToggle
  });

  previewContent.innerHTML = `
    <div style="margin-bottom: 8px;"><strong>Příklad pro SOS ${appState.selectedCampaignTier} banner ${exampleDimensions}:</strong></div>
    <div style="color: #3b82f6;">${sampleURL}</div>
  `;

  // Save to localStorage
  saveCampaignSettingsToStorage();
}

// =============================================================================
// UTM TAGGING HELPER FUNCTIONS
// =============================================================================

/**
 * Remove diacritics from Czech text
 * @param {string} text - Text with diacritics
 * @returns {string} Text without diacritics
 */
function removeDiacritics(text) {
  const diacriticsMap = {
    'á': 'a', 'Á': 'A', 'č': 'c', 'Č': 'C', 'ď': 'd', 'Ď': 'D',
    'é': 'e', 'É': 'E', 'ě': 'e', 'Ě': 'E', 'í': 'i', 'Í': 'I',
    'ň': 'n', 'Ň': 'N', 'ó': 'o', 'Ó': 'O', 'ř': 'r', 'Ř': 'R',
    'š': 's', 'Š': 'S', 'ť': 't', 'Ť': 'T', 'ú': 'u', 'Ú': 'U',
    'ů': 'u', 'Ů': 'U', 'ý': 'y', 'Ý': 'Y', 'ž': 'z', 'Ž': 'Z'
  };

  return text.replace(/[áÁčČďĎéÉěĚíÍňŇóÓřŘšŠťŤúÚůŮýÝžŽ]/g, match => diacriticsMap[match] || match);
}

/**
 * Normalize text for UTM parameters according to Seznam rules:
 * - Remove diacritics
 * - Convert to lowercase
 * - Replace spaces with hyphens
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
function normalizeUTMText(text) {
  if (!text) return '';

  return removeDiacritics(text)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');  // Replace spaces with hyphens
}

/**
 * Build utm_campaign parameter according to Seznam tagging rules:
 * Rule 2: service_campaign-name (e.g., televizeseznam_revir-jaro-2023)
 * Rule 4: If service name already in campaign, omit service prefix (e.g., seznammenu-podzim-2023)
 *
 * @param {string} service - Service name (already normalized, e.g., "televizeseznam", "hp")
 * @param {string} campaignName - Campaign name (may contain diacritics, spaces)
 * @returns {string} utm_campaign value
 */
function buildUTMCampaign(service, campaignName) {
  const normalizedCampaign = normalizeUTMText(campaignName);
  const normalizedService = service ? service.toLowerCase() : '';

  // Rule 4: Check if service name is already in the campaign name
  if (normalizedService && normalizedCampaign.includes(normalizedService)) {
    // Service already in campaign name, return just the campaign
    return normalizedCampaign;
  }

  // Rule 2: service_campaign-name format
  if (normalizedService && normalizedCampaign) {
    return `${normalizedService}_${normalizedCampaign}`;
  }

  // Fallback: just return normalized campaign
  return normalizedCampaign;
}

/**
 * Map banner dimensions to position name for zbozi campaigns
 * @param {string} dimensions - Banner dimensions (e.g., "300x250")
 * @returns {string} Position name (e.g., "sponzor-sluzby")
 */
function dimensionToPosition(dimensions) {
  const dimensionMap = {
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

  return dimensionMap[dimensions] || 'banner';
}

/**
 * Format date range for zbozi HIGH tier campaigns
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {string} Formatted date range (e.g., "1.1.-31.1.2026")
 */
function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return '';

  const start = new Date(startDate);
  const end = new Date(endDate);

  const startDay = start.getDate();
  const startMonth = start.getMonth() + 1;
  const endDay = end.getDate();
  const endMonth = end.getMonth() + 1;
  const year = end.getFullYear();

  return `${startDay}.${startMonth}.-${endDay}.${endMonth}.${year}`;
}

/**
 * Extract year from campaign name or use current year
 * @param {string} campaignName - Campaign name (may contain year)
 * @returns {string} Year (4 digits)
 */
function extractYear(campaignName) {
  // Try to find 4-digit year in campaign name
  const yearMatch = campaignName.match(/20\d{2}/);
  if (yearMatch) {
    return yearMatch[0];
  }

  // Fallback to current year
  return new Date().getFullYear().toString();
}

/**
 * Save campaign settings form values to localStorage
 */
function saveCampaignSettingsToStorage() {
  const settings = {
    campaignName: document.getElementById('campaignName')?.value || '',
    contentName: document.getElementById('contentName')?.value || '',
    landingURL: document.getElementById('landingURL')?.value || '',
    zboziToggle: document.getElementById('zboziToggle')?.checked || false,
    campaignStartDate: document.getElementById('campaignStartDate')?.value || '',
    campaignEndDate: document.getElementById('campaignEndDate')?.value || ''
  };

  try {
    localStorage.setItem('campaignSettings', JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings to localStorage:', e);
  }
}

/**
 * Load campaign settings form values from localStorage
 */
function loadCampaignSettingsFromStorage() {
  try {
    const savedSettings = localStorage.getItem('campaignSettings');
    if (!savedSettings) return;

    const settings = JSON.parse(savedSettings);

    // Restore text fields
    const campaignNameInput = document.getElementById('campaignName');
    const contentNameInput = document.getElementById('contentName');
    const landingURLInput = document.getElementById('landingURL');
    const zboziToggleInput = document.getElementById('zboziToggle');
    const startDateInput = document.getElementById('campaignStartDate');
    const endDateInput = document.getElementById('campaignEndDate');

    if (campaignNameInput && settings.campaignName) {
      campaignNameInput.value = settings.campaignName;
    }

    if (contentNameInput && settings.contentName) {
      contentNameInput.value = settings.contentName;
    }

    if (landingURLInput && settings.landingURL) {
      landingURLInput.value = settings.landingURL;
    }

    if (zboziToggleInput && settings.zboziToggle !== undefined) {
      zboziToggleInput.checked = settings.zboziToggle;

      // Show/hide date fields based on toggle state
      const zboziDateFields = document.getElementById('zboziDateFields');
      if (zboziDateFields) {
        zboziDateFields.style.display = settings.zboziToggle ? 'block' : 'none';
      }
    }

    if (startDateInput && settings.campaignStartDate) {
      startDateInput.value = settings.campaignStartDate;
    }

    if (endDateInput && settings.campaignEndDate) {
      endDateInput.value = settings.campaignEndDate;
    }

    // Sync to appState
    appState.campaignName = settings.campaignName || '';
    appState.contentName = settings.contentName || '';
    appState.landingURL = settings.landingURL || '';
    appState.isZboziCampaign = settings.zboziToggle || false;

    // Update preview if on step 3
    if (appState.currentStep === 3) {
      updateExportPreview();
    }

  } catch (e) {
    console.warn('Failed to load settings from localStorage:', e);
  }
}

/**
 * Generate banner URL based on system and parameters
 * @param {Object} params - URL parameters
 * @returns {string} Generated URL
 */
function generateBannerURL(params) {
  const {
    network,
    tier,
    campaignName,
    contentName,
    landingURL,
    dimensions,
    format,
    service,
    anchor,
    isZbozi
  } = params;

  // Normalize campaign and content names according to Seznam tagging rules
  const normalizedCampaign = normalizeUTMText(campaignName);
  const normalizedContent = normalizeUTMText(contentName);

  let utm_source = '';
  let utm_medium = '';
  let utm_campaign = '';
  let utm_content = '';
  let utm_term = '';

  // Determine source and medium based on network
  if (network === 'SOS') {
    utm_source = 'seznam_sos';

    // ========== ZBOZI CAMPAIGN LOGIC ==========
    if (isZbozi) {
      const position = dimensionToPosition(dimensions);

      // utm_campaign: Different for LOW vs HIGH
      if (tier === 'HIGH') {
        const dateRange = formatDateRange(
          document.getElementById('campaignStartDate')?.value,
          document.getElementById('campaignEndDate')?.value
        );
        utm_campaign = `${normalizedCampaign}_${service}_${position}${dateRange ? '_' + dateRange : ''}`;
      } else {
        const year = extractYear(campaignName);
        utm_campaign = `zbozi_low_${year}`;
      }

      // utm_content: ALL HYPHENS (not underscore before dimensions!)
      utm_content = `${normalizedCampaign}-${normalizedContent}-${dimensions}`;

      // utm_term: Position-based
      utm_term = tier === 'HIGH' ? `${service}_${position}` : position;

      // utm_medium: Keep SOS medium rules
      if (format === 'kombi') {
        utm_medium = 'kombi_selfpromo';
      } else if (format === 'video') {
        utm_medium = tier === 'HIGH' ? 'video_selfpromo_high' : 'video_selfpromo_low';
      } else if (format === 'in-article') {
        utm_medium = 'inarticle_selfpromo';
      } else if (format === 'exclusive') {
        utm_medium = 'exclusive_selfpromo';
      } else if (format === 'audio') {
        utm_medium = tier === 'HIGH' ? 'audio_selfpromo_high' : 'audio_selfpromo_low';
      } else {
        utm_medium = tier === 'HIGH' ? 'banner_selfpromo_high' : 'banner_selfpromo_low';
      }
    }
    // ========== REGULAR SOS LOGIC ==========
    else {
      // Build utm_campaign with service prefix (or without if service already in campaign name)
      utm_campaign = buildUTMCampaign(service, campaignName);

      // Determine medium based on format and tier
      if (format === 'in-article') {
        utm_medium = 'inarticle_selfpromo';
      } else if (format === 'banner') {
        utm_medium = tier === 'HIGH' ? 'banner_selfpromo_high' : 'banner_selfpromo_low';
      } else if (format === 'video') {
        utm_medium = tier === 'HIGH' ? 'video_selfpromo_high' : 'video_selfpromo_low';
      } else if (format === 'exclusive') {
        utm_medium = 'exclusive_selfpromo';
      } else if (format === 'audio') {
        utm_medium = tier === 'HIGH' ? 'audio_selfpromo_high' : 'audio_selfpromo_low';
      } else {
        utm_medium = 'banner_selfpromo_high';
      }

      // utm_content: normalized campaign-content_format_service
      if (format === 'in-article') {
        utm_content = `${normalizedCampaign}-${normalizedContent}_${format}_${service}`;
        utm_term = `${format}_${service}`;
      } else {
        utm_content = `${normalizedCampaign}-${normalizedContent}_${dimensions}`;
        utm_term = normalizeUTMText(format);
      }
    }

  } else if (network === 'ONEGAR') {
    utm_source = 'seznam_onegar';

    // Check if it's through ADFORM
    const isAdform = false; // Will be determined by user selection later

    // ========== ZBOZI CAMPAIGN LOGIC ==========
    if (isZbozi) {
      const position = dimensionToPosition(dimensions);

      // utm_campaign: Different for LOW vs HIGH
      if (tier === 'HIGH') {
        const dateRange = formatDateRange(
          document.getElementById('campaignStartDate')?.value,
          document.getElementById('campaignEndDate')?.value
        );
        utm_campaign = `${normalizedCampaign}_${service}_${position}${dateRange ? '_' + dateRange : ''}`;
      } else {
        const year = extractYear(campaignName);
        utm_campaign = `zbozi_low_${year}`;
      }

      // utm_content: ALL HYPHENS (not underscore before dimensions!)
      utm_content = `${normalizedCampaign}-${normalizedContent}-${dimensions}`;

      // utm_term: Position-based
      utm_term = tier === 'HIGH' ? `${service}_${position}` : position;

      // utm_medium: Keep ONEGAR medium rules
      if (format === 'kombi') {
        utm_medium = 'kombi_selfpromo';
      } else if (format === 'video') {
        utm_medium = tier === 'HIGH' ? 'video_selfpromo_high' : 'video_selfpromo_low';
      } else {
        utm_medium = tier === 'HIGH' ? 'banner_selfpromo_high' : 'banner_selfpromo_low';
      }
    }
    // ========== REGULAR ONEGAR LOGIC ==========
    else {
      // Build utm_campaign with service prefix
      utm_campaign = buildUTMCampaign(service, campaignName);

      if (format === 'kombi') {
        utm_medium = 'kombi_selfpromo';
        utm_content = `${normalizedCampaign}-${normalizedContent}_kombi`;
        utm_term = 'kombi';
      } else if (format === 'banner') {
        if (tier === 'HIGH') {
          utm_medium = isAdform ? 'banner_selfpromo_high_adform' : 'banner_selfpromo_high';
        } else {
          utm_medium = isAdform ? 'banner_selfpromo_low_adform' : 'banner_selfpromo_low';
        }
        utm_content = `${normalizedCampaign}-${normalizedContent}_${dimensions}`;
        utm_term = 'banner';
      } else if (format === 'video') {
        utm_medium = tier === 'HIGH' ? 'video_selfpromo_high' : 'video_selfpromo_low';
        utm_content = `${normalizedCampaign}-${normalizedContent}_${dimensions}`;
        utm_term = 'video';
      }
    }

  } else if (network === 'SKLIK') {
    utm_source = 'seznam_sklik';

    // ========== ZBOZI CAMPAIGN LOGIC ==========
    if (isZbozi) {
      const position = dimensionToPosition(dimensions);

      // utm_campaign: Different for LOW vs HIGH
      if (tier === 'HIGH') {
        const dateRange = formatDateRange(
          document.getElementById('campaignStartDate')?.value,
          document.getElementById('campaignEndDate')?.value
        );
        utm_campaign = `${normalizedCampaign}_${service}_${position}${dateRange ? '_' + dateRange : ''}`;
      } else {
        const year = extractYear(campaignName);
        utm_campaign = `zbozi_low_${year}`;
      }

      // utm_content: ALL HYPHENS (not underscore before dimensions!)
      utm_content = `${normalizedCampaign}-${normalizedContent}-${dimensions}`;

      // utm_term: Position-based
      utm_term = tier === 'HIGH' ? `${service}_${position}` : position;

      // utm_medium: SKLIK uses 'cpc'
      utm_medium = 'cpc';
    }
    // ========== REGULAR SKLIK LOGIC ==========
    else {
      utm_medium = 'cpc_low';
      // SKLIK uses autotagging - keep {campaign} and {adtitle} placeholders (Rule 5 exception)
      utm_campaign = '{campaign}';
      utm_content = '{adgroup}_{adtitle}';
      utm_term = '';
    }

  } else if (network === 'ADFORM' || network === 'HP_EXCLUSIVE') {
    // Set utm_source based on network
    utm_source = network === 'HP_EXCLUSIVE' ? 'homepage_exclusive' : 'seznam_adform';

    // ========== ZBOZI CAMPAIGN LOGIC ==========
    if (isZbozi) {
      const position = dimensionToPosition(dimensions);

      // utm_campaign: Different for LOW vs HIGH
      if (tier === 'HIGH') {
        const dateRange = formatDateRange(
          document.getElementById('campaignStartDate')?.value,
          document.getElementById('campaignEndDate')?.value
        );
        utm_campaign = `${normalizedCampaign}_${service}_${position}${dateRange ? '_' + dateRange : ''}`;
      } else {
        const year = extractYear(campaignName);
        utm_campaign = `zbozi_low_${year}`;
      }

      // utm_content: ALL HYPHENS (not underscore before dimensions!)
      utm_content = `${normalizedCampaign}-${normalizedContent}-${dimensions}`;

      // utm_term: Position-based
      utm_term = tier === 'HIGH' ? `${service}_${position}` : position;

      // utm_medium
      if (format === 'kombi') {
        utm_medium = 'kombi_selfpromo';
      } else if (format === 'video') {
        utm_medium = tier === 'HIGH' ? 'video_selfpromo_high' : 'video_selfpromo_low';
      } else {
        utm_medium = tier === 'HIGH' ? 'banner_selfpromo_high' : 'banner_selfpromo_low';
      }
    }
    // ========== REGULAR ADFORM/HP LOGIC ==========
    else {
      // Build utm_campaign with service prefix
      utm_campaign = buildUTMCampaign(service, campaignName);

      utm_medium = tier === 'HIGH' ? 'banner_selfpromo_high_adform' : 'banner_selfpromo_low_adform';
      utm_content = `${normalizedCampaign}-${normalizedContent}_${dimensions}`;
      utm_term = 'banner';
    }
  }

  // Build URL
  let url = landingURL;
  const params_array = [];

  if (utm_source) params_array.push(`utm_source=${encodeURIComponent(utm_source)}`);
  if (utm_medium) params_array.push(`utm_medium=${encodeURIComponent(utm_medium)}`);
  if (utm_campaign) params_array.push(`utm_campaign=${encodeURIComponent(utm_campaign)}`);
  if (utm_content) params_array.push(`utm_content=${encodeURIComponent(utm_content)}`);
  if (utm_term) params_array.push(`utm_term=${encodeURIComponent(utm_term)}`);

  if (params_array.length > 0) {
    url += '?' + params_array.join('&');
  }

  // Add anchor (also normalized according to rules)
  if (anchor) {
    const normalizedAnchor = normalizeUTMText(anchor);
    url += '#' + normalizedAnchor;
  }

  return url;
}

// =============================================================================
// SYSTEM NAME DETECTION
// =============================================================================

/**
 * Detect system name from folder path
 * @param {string} folderPath - Folder path
 * @returns {string|null} Detected system name or null
 */
function detectSystemFromPath(folderPath) {
  if (!folderPath) return null;

  const pathUpper = folderPath.toUpperCase();
  const systems = ['ADFORM', 'SOS', 'ONEGAR', 'SKLIK', 'HP_EXCLUSIVE', 'HPEXCLUSIVE', 'HP EXCLUSIVE', 'GOOGLE_ADS', 'GOOGLE ADS', 'GADS'];

  for (const system of systems) {
    if (pathUpper.includes(system)) {
      // Normalize HP variants to HP_EXCLUSIVE
      if (system.startsWith('HP')) {
        return 'HP_EXCLUSIVE';
      }
      // Normalize Google Ads variants to GOOGLE_ADS
      if (system.includes('GOOGLE') || system === 'GADS') {
        return 'GOOGLE_ADS';
      }
      return system;
    }
  }

  return null;
}

// =============================================================================
// CAMPAIGN TABLE PARSER
// =============================================================================

/**
 * Parse campaign table from TSV (tab-separated) text
 * @param {string} text - Raw table text from textarea
 * @returns {Array<Object>} Parsed requirements [{name, dimensions:[], maxSizeKB}]
 */
function parseCampaignTableText(text) {
  const requirements = [];
  const campaignTableData = {}; // Per-dimension mapping
  const lines = text.trim().split('\n');

  let currentRequirement = null;
  let currentUtmCampaign = null;
  let currentTargetUrl = null;

  console.group('📋 Parsing Campaign Table');
  console.log(`Total lines to parse: ${lines.length}`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split by tabs
    const columns = line.split('\t').map(col => col.trim());

    // Skip header row (contains "Druh", "Rozměry", etc.)
    if (columns[0] && (columns[0].toLowerCase().includes('druh') || columns[0].toLowerCase().includes('rozměr'))) {
      continue;
    }

    let name = columns[0] || '';
    let dimensionText = columns[1] || '';
    let sizeText = columns[2] || '';
    let utmCampaign = columns[3] || ''; // Optional: utm_campaign
    let targetUrl = columns[4] || ''; // Optional: target URL

    // MERGED CELL HANDLING: Check if column[0] contains ONLY dimensions (no real name)
    // This happens when Excel paste doesn't preserve empty cells from merged rows
    const isDimensionOnly = /^\d+\s*[x×]\s*\d+$/i.test(name);

    if (isDimensionOnly) {
      // Column 0 contains a dimension, not a name - this is a continuation row
      // Shift columns: dimension is in col[0], size might be in col[1]
      console.log(`  Line ${i + 1}: Detected dimension-only row "${name}" - treating as continuation`);
      dimensionText = name;
      sizeText = columns[1] || '';
      name = ''; // Clear name to trigger continuation logic
    }

    // Extract dimensions from text (supports formats like "300x250", "300 x 250", "300×250")
    const dimensionMatches = dimensionText.match(/(\d+)\s*[x×]\s*(\d+)/gi);
    const dimensions = dimensionMatches ? dimensionMatches.map(d => {
      const parts = d.match(/(\d+)\s*[x×]\s*(\d+)/i);
      return `${parts[1]}x${parts[2]}`;
    }) : [];

    // Extract size in KB (supports "150 kb", "150KB", "1 MB" => 1024KB)
    let maxSizeKB = null;
    if (sizeText) {
      const sizeMatch = sizeText.match(/([\d.]+)\s*(kb|mb|gb)/i);
      if (sizeMatch) {
        const value = parseFloat(sizeMatch[1]);
        const unit = sizeMatch[2].toLowerCase();
        if (unit === 'mb') {
          maxSizeKB = Math.round(value * 1024);
        } else if (unit === 'gb') {
          maxSizeKB = Math.round(value * 1024 * 1024);
        } else {
          maxSizeKB = Math.round(value);
        }
      }
    }

    // If name exists and is not just a dimension, start new requirement
    if (name && !isDimensionOnly) {
      currentRequirement = {
        name: name,
        dimensions: dimensions,
        maxSizeKB: maxSizeKB
      };

      // Detect format type from name
      const nameLower = name.toLowerCase();

      // HTML5 detection - files with "html5" in requirement name must be HTML5 ZIP files
      if (nameLower.includes('html5')) {
        currentRequirement.isHTML5 = true;
        currentRequirement.formatType = 'html5';
        console.log(`    → Detected HTML5 requirement`);
      }

      // Static banner detection - files with "statika" must be static images (not HTML5)
      if (nameLower.includes('statika') || nameLower.includes('static')) {
        currentRequirement.isStatic = true;
        currentRequirement.formatType = 'static';
        console.log(`    → Detected static-only requirement`);
      }

      // SOS-exclusive format detection - auto-assign to SOS system
      const sosFormats = ['in-article', 'inarticle', 'branding', 'spincube', 'spinner',
                         'scratcher', 'uncover', 'interscroller', 'interactive', 'exclusive'];
      const isSosFormat = sosFormats.some(format => nameLower.includes(format));

      if (isSosFormat) {
        currentRequirement.autoAssignSystem = 'SOS';
        currentRequirement.isSosExclusive = true;
        console.log(`    → Detected SOS-exclusive format, auto-assigning to SOS`);
      }

      requirements.push(currentRequirement);

      // Store utm_campaign and targetUrl if provided
      if (utmCampaign) currentUtmCampaign = utmCampaign;
      if (targetUrl) currentTargetUrl = targetUrl;

      // Map dimensions to campaign data
      dimensions.forEach(dim => {
        if (currentUtmCampaign || currentTargetUrl) {
          campaignTableData[dim] = {
            utm_campaign: currentUtmCampaign || '',
            targetUrl: currentTargetUrl || ''
          };
        }
      });

      console.log(`  Line ${i + 1}: New requirement "${name}" with ${dimensions.length} dimension(s), size: ${maxSizeKB || 'N/A'} KB, campaign: ${currentUtmCampaign || 'N/A'}`);
    } else if (currentRequirement && dimensions.length > 0) {
      // No name or dimension-only = continuation of previous requirement
      currentRequirement.dimensions.push(...dimensions);

      // Map dimensions to campaign data (use current campaign/URL from parent row)
      dimensions.forEach(dim => {
        if (currentUtmCampaign || currentTargetUrl) {
          campaignTableData[dim] = {
            utm_campaign: currentUtmCampaign || '',
            targetUrl: currentTargetUrl || ''
          };
        }
      });

      console.log(`  Line ${i + 1}: Added ${dimensions.length} dimension(s) to "${currentRequirement.name}"`);
      // Update size if provided and not already set
      if (maxSizeKB && !currentRequirement.maxSizeKB) {
        currentRequirement.maxSizeKB = maxSizeKB;
        console.log(`  Line ${i + 1}: Updated size for "${currentRequirement.name}" to ${maxSizeKB} KB`);
      }
    }
  }

  console.log(`\n✅ Parsed ${requirements.length} requirements:`);
  requirements.forEach((req, idx) => {
    console.log(`  ${idx + 1}. "${req.name}": ${req.dimensions.length} dimensions [${req.dimensions.join(', ')}], ${req.maxSizeKB || 'N/A'} KB`);
  });

  const dimensionsWithCampaignData = Object.keys(campaignTableData).length;
  if (dimensionsWithCampaignData > 0) {
    console.log(`\n📊 Campaign table data extracted for ${dimensionsWithCampaignData} dimension(s)`);
    Object.entries(campaignTableData).forEach(([dim, data]) => {
      console.log(`  ${dim}: campaign="${data.utm_campaign}", url="${data.targetUrl}"`);
    });
  }

  console.groupEnd();

  return { requirements, campaignTableData };
}

/**
 * Handle campaign table paste and parse
 */
function parseCampaignTable() {
  const textarea = document.getElementById('campaignTableInput');
  const resultDiv = document.getElementById('tableParseResult');
  const inputContainer = document.getElementById('tableInputContainer');
  const parsedTableDisplay = document.getElementById('parsedTableDisplay');

  if (!textarea || !resultDiv) return;

  const text = textarea.value.trim();

  if (!text) {
    resultDiv.innerHTML = '<div style="color: #ef4444; padding: 10px; background: #fee2e2; border-radius: 6px;">⚠️ Vložte prosím tabulku</div>';
    resultDiv.style.display = 'block';
    return;
  }

  try {
    const { requirements, campaignTableData } = parseCampaignTableText(text);

    if (requirements.length === 0) {
      resultDiv.innerHTML = '<div style="color: #ef4444; padding: 10px; background: #fee2e2; border-radius: 6px;">⚠️ Nepodařilo se rozpoznat žádné požadavky</div>';
      resultDiv.style.display = 'block';
      return;
    }

    // Store in appState
    appState.campaignRequirements = requirements;
    appState.campaignTableData = campaignTableData;

    // Calculate totals
    const totalRequirements = requirements.length;
    const totalDimensions = requirements.reduce((sum, req) => sum + req.dimensions.length, 0);

    // Generate formatted table HTML
    let tableHTML = `
      <div style="color: #10b981; padding: 10px; background: #d1fae5; border-radius: 6px; border: 1px solid #10b981; margin-bottom: 15px;">
        ✅ <strong>Úspěšně zpracováno!</strong>
        <span style="font-size: 14px;">
          ${totalRequirements} kategorií kreativ, celkem ${totalDimensions} rozměrů
        </span>
      </div>

      <button class="btn-secondary" onclick="toggleTableInput()" style="margin-bottom: 15px;">
        📝 Upravit vstupní data
      </button>

      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #374151;">Název kreativy</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #374151;">Rozměry</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #374151;">Max. velikost</th>
            </tr>
          </thead>
          <tbody>
    `;

    // Add table rows
    requirements.forEach((req, index) => {
      const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
      const dimensions = req.dimensions.join(', ');
      const maxSize = req.maxSizeKB ? `${req.maxSizeKB} KB` : '-';

      tableHTML += `
        <tr style="background: ${bgColor};">
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${req.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-family: 'Courier New', monospace; font-size: 13px;">${dimensions}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${maxSize}</td>
        </tr>
      `;
    });

    tableHTML += `
          </tbody>
        </table>
      </div>
    `;

    // Show parsed table, hide input
    parsedTableDisplay.innerHTML = tableHTML;
    parsedTableDisplay.style.display = 'block';
    inputContainer.style.display = 'none';
    resultDiv.style.display = 'none';

    console.log('Parsed campaign requirements:', requirements);

  } catch (error) {
    console.error('Error parsing campaign table:', error);
    resultDiv.innerHTML = `<div style="color: #ef4444; padding: 10px; background: #fee2e2; border-radius: 6px;">❌ Chyba při zpracování: ${error.message}</div>`;
    resultDiv.style.display = 'block';
  }
}

/**
 * Toggle visibility of table input container
 */
function toggleTableInput() {
  const inputContainer = document.getElementById('tableInputContainer');
  const parsedTableDisplay = document.getElementById('parsedTableDisplay');

  if (inputContainer.style.display === 'none') {
    inputContainer.style.display = 'block';
    parsedTableDisplay.style.display = 'none';
  } else {
    inputContainer.style.display = 'none';
    parsedTableDisplay.style.display = 'block';
  }
}

// =============================================================================
// FILE UPLOAD & ANALYSIS
// =============================================================================

/**
 * Extract image files from a ZIP archive
 * @param {File} zipFile - ZIP file
 * @returns {Promise<Array<File>>} Array of image File objects with folderPath property
 */
/**
 * Extract images from ZIP file, handling nested ZIPs and HTML5 banners
 * @param {File} zipFile - ZIP file to extract
 * @param {number} depth - Current recursion depth (for limiting)
 * @param {string} parentPath - Parent folder path for nested files
 * @returns {Promise<Array>} Array of extracted files
 */
async function extractImagesFromZIP(zipFile, depth = 0, parentPath = '') {
  // Limit recursion depth to prevent infinite loops
  const MAX_DEPTH = 2;
  if (depth > MAX_DEPTH) {
    console.warn(`Max ZIP nesting depth (${MAX_DEPTH}) reached, skipping deeper extraction`);
    return [];
  }

  try {
    const zip = new JSZip();
    const contents = await zip.loadAsync(zipFile);
    const imageFiles = [];

    for (const [filename, zipEntry] of Object.entries(contents.files)) {
      // Skip directories and hidden files
      if (zipEntry.dir || filename.startsWith('__MACOSX') || filename.startsWith('.')) {
        continue;
      }

      const extension = filename.split('.').pop().toLowerCase();
      const baseName = filename.split('/').pop();
      const pathParts = filename.split('/');
      const folderPath = parentPath
        ? `${parentPath}/${pathParts.slice(0, -1).join('/')}`
        : (pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '');

      // Check if this is a nested ZIP file
      if (extension === 'zip') {
        const blob = await zipEntry.async('blob');
        const nestedZipFile = new File([blob], baseName, { type: 'application/zip' });

        // Check if nested ZIP is HTML5 banner
        const isHTML5 = typeof HTML5Validator !== 'undefined' &&
          (HTML5Validator.isHTML5BannerByName(baseName) || await HTML5Validator.isHTML5ZIP(nestedZipFile));

        if (isHTML5) {
          // Keep HTML5 banner as whole ZIP file
          nestedZipFile.folderPath = folderPath;
          imageFiles.push(nestedZipFile);
          console.log(`Found nested HTML5 banner: ${baseName} in ${folderPath}`);
        } else {
          // Regular nested ZIP - extract recursively
          console.log(`Extracting nested ZIP: ${baseName} at depth ${depth + 1}`);
          const nestedFiles = await extractImagesFromZIP(nestedZipFile, depth + 1, folderPath);
          imageFiles.push(...nestedFiles);
        }
      }
      // Check if it's an image file
      else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(extension)) {
        // Extract file as blob
        const blob = await zipEntry.async('blob');

        // Create a File object from the blob
        const file = new File([blob], baseName, {
          type: `image/${extension === 'jpg' ? 'jpeg' : extension}`
        });

        // Store folder path for system detection
        file.folderPath = folderPath;

        imageFiles.push(file);
      }
    }

    return imageFiles;
  } catch (error) {
    console.error('Error extracting ZIP file:', error);
    throw error;
  }
}

async function handleFileUpload(files) {
  const progressSection = document.getElementById('uploadProgress');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const uploadedFilesSection = document.getElementById('uploadedFiles');
  const analyzeBtn = document.getElementById('analyzeBtn');

  // Show progress
  if (progressSection) {
    progressSection.style.display = 'block';
  }

  // Process files - handle images and ZIP files
  const filesToAnalyze = [];
  let skippedCount = 0;
  let zipCount = 0;

  for (const file of files) {
    const fileType = getFileFormat(file);

    if (fileType === 'image') {
      filesToAnalyze.push(file);
    } else if (fileType === 'zip') {
      // Check if this is an HTML5 banner ZIP
      const isHTML5 = typeof HTML5Validator !== 'undefined' &&
        (HTML5Validator.isHTML5BannerByName(file.name) || await HTML5Validator.isHTML5ZIP(file));

      if (isHTML5) {
        // Keep HTML5 banners as whole files (don't extract)
        filesToAnalyze.push(file);
        console.log(`Detected HTML5 banner: ${file.name}`);
      } else {
        // Regular ZIP - extract images
        zipCount++;
        if (progressText) {
          progressText.textContent = `Extracting ZIP file: ${file.name}...`;
        }

        try {
          const extractedImages = await extractImagesFromZIP(file);
          filesToAnalyze.push(...extractedImages);
          console.log(`Extracted ${extractedImages.length} image(s) from ${file.name}`);
        } catch (error) {
          console.error(`Failed to extract ${file.name}:`, error);
          alert(`Error extracting ${file.name}: ${error.message}`);
        }
      }
    } else {
      skippedCount++;
      console.warn(`Unsupported file type: ${file.name}. Only JPG, PNG, GIF images, HTML5 banners, and ZIP files are supported.`);
    }
  }

  // Show info about found files
  if (progressText && files.length > 0) {
    let message = `Nalezeno ${filesToAnalyze.length} obrázků`;
    if (zipCount > 0) {
      message += ` (rozbaleno ${zipCount} ZIP)`;
    }
    if (skippedCount > 0) {
      message += `, přeskočeno ${skippedCount} nepodporovaných`;
    }
    progressText.textContent = message;
  }

  // Analyze files
  if (filesToAnalyze.length > 0) {
    const analyzed = await analyzeFiles(filesToAnalyze, (progress) => {
      if (progressFill) {
        progressFill.style.width = `${progress.percentage}%`;
      }
      if (progressText) {
        progressText.textContent = `Analyzing ${progress.current}/${progress.total}: ${progress.file}`;
      }
    });

    // Detect assigned system from folder path for each file
    for (const fileData of analyzed) {
      const folderPath = fileData.file?.folderPath || '';
      fileData.assignedSystem = detectSystemFromPath(folderPath);
      fileData.folderPath = folderPath;
    }

    // Add to uploaded files (additive - don't replace existing)
    appState.uploadedFiles.push(...analyzed);
  }

  // Hide progress
  if (progressSection) {
    progressSection.style.display = 'none';
  }

  // Show uploaded files list
  displayUploadedFiles();

  // Enable analyze button
  if (analyzeBtn && appState.uploadedFiles.length > 0) {
    analyzeBtn.disabled = false;
  }
}

function displayUploadedFiles() {
  const uploadedFilesSection = document.getElementById('uploadedFiles');
  if (!uploadedFilesSection) return;

  if (appState.uploadedFiles.length === 0) {
    uploadedFilesSection.innerHTML = '';
    return;
  }

  const html = `
    <div class="uploaded-files-container" style="margin-top: 20px;">
      <h3>Uploaded Files (${appState.uploadedFiles.length})</h3>
      <ul class="uploaded-files-list" style="list-style: none; padding: 0;">
        ${appState.uploadedFiles.map((file, index) => {
          // Generate thumbnail URL if file has preview (images only)
          const thumbnailURL = file.preview || (file.file ? createThumbnailURL(file.file) : '');

          return `
          <li class="uploaded-file-item" style="padding: 10px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
              ${thumbnailURL ? `
                <img class="file-thumbnail" src="${thumbnailURL}" alt="${file.name}"
                  style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid #e5e7eb; flex-shrink: 0;">
              ` : `
                <div class="file-thumbnail-placeholder" style="width: 40px; height: 40px; background: #f3f4f6; border-radius: 4px; border: 1px solid #e5e7eb; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 18px;">📄</div>
              `}
              <div class="file-info">
                <strong class="file-name">${file.name}</strong>
                ${file.dimensions ? `<span class="file-dimensions" style="color: #6b7280; margin-left: 10px;">${file.dimensions}</span>` : ''}
                <span class="file-size" style="color: #6b7280; margin-left: 10px;">${file.sizeKB} KB</span>
                ${!file.colorSpaceValid ? '<span class="file-warning" style="color: #ef4444; margin-left: 10px;">⚠️ CMYK</span>' : ''}
              </div>
            </div>
            <button class="remove-file-btn" onclick="removeFile(${index})" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; flex-shrink: 0;">✕</button>
          </li>
        `;
        }).join('')}
      </ul>
    </div>
  `;

  uploadedFilesSection.innerHTML = html;
}

function removeFile(index) {
  appState.uploadedFiles.splice(index, 1);
  displayUploadedFiles();

  const analyzeBtn = document.getElementById('analyzeBtn');
  if (analyzeBtn && appState.uploadedFiles.length === 0) {
    analyzeBtn.disabled = true;
  }
}

// =============================================================================
// FILE ANALYSIS & VALIDATION
// =============================================================================

async function validateCompatibility() {
  if (appState.uploadedFiles.length === 0) {
    alert('Please upload files first');
    return;
  }

  // Detect multi-file formats
  appState.multiFileGroups = detectMultiFileFormats(appState.uploadedFiles);

  // Build compatibility matrix for each file
  appState.validationResults = {};
  appState.networkStats = {};

  for (const fileData of appState.uploadedFiles) {
    const compatible = [];
    const incompatible = [];

    // Skip social media files - they don't validate against ad systems
    if (fileData.isSocialMedia) {
      appState.validationResults[fileData.name] = {
        file: fileData,
        compatible: [],
        incompatible: [],
        isSocialMedia: true
      };
      continue;
    }

    // Check against all networks and tiers
    const networks = ['ADFORM', 'SOS', 'ONEGAR', 'SKLIK'];

    for (const network of networks) {
      // Check if format is allowed for this system
      if (fileData.detectedFormat && !isFormatAllowedForSystem(fileData.detectedFormat, network)) {
        continue; // Skip validation for disallowed systems
      }

      // SOS: Only HIGH tier (no LOW tier)
      const tiers = network === 'SOS' ? ['HIGH'] : ['HIGH', 'LOW'];

      for (const tier of tiers) {
        const matches = findMatchingFormats(fileData, network, tier);

        for (const match of matches) {
          const validation = validateFileForFormat(fileData, match.spec);

          if (validation.valid && match.sizeValid) {
            compatible.push({
              network: network,
              tier: tier,
              format: match.specKey,
              formatDisplay: match.formatDisplay,
              spec: match.spec
            });
          } else {
            // Only add to incompatible if format is allowed for this system
            incompatible.push({
              network: network,
              tier: tier,
              format: match.specKey,
              formatDisplay: match.formatDisplay,
              reason: validation.issues.join(', ') || `Velikost překračuje limit (${match.fileSize}KB > ${match.sizeLimit}KB)`
            });
          }
        }
      }
    }

    // Check HP EXCLUSIVE (no tier) - only if format is allowed
    if (!fileData.detectedFormat || isFormatAllowedForSystem(fileData.detectedFormat, 'HP_EXCLUSIVE')) {
      const exclusiveMatches = findMatchingFormats(fileData, 'HP_EXCLUSIVE', null);
      for (const match of exclusiveMatches) {
        const validation = validateFileForFormat(fileData, match.spec);

        if (validation.valid && match.sizeValid) {
          compatible.push({
            network: 'HP_EXCLUSIVE',
            tier: null,
            format: match.specKey,
            formatDisplay: match.formatDisplay,
            spec: match.spec
          });
        } else {
          incompatible.push({
            network: 'HP_EXCLUSIVE',
            tier: null,
            format: match.specKey,
            formatDisplay: match.formatDisplay,
            reason: validation.issues.join(', ') || `Velikost překračuje limit`
          });
        }
      }
    }

    // Check GOOGLE_ADS (no tier) - only if format is allowed
    if (!fileData.detectedFormat || isFormatAllowedForSystem(fileData.detectedFormat, 'GOOGLE_ADS')) {
      const googleAdsMatches = findMatchingFormats(fileData, 'GOOGLE_ADS', null);
      for (const match of googleAdsMatches) {
        const validation = validateFileForFormat(fileData, match.spec);

        if (validation.valid && match.sizeValid) {
          compatible.push({
            network: 'GOOGLE_ADS',
            tier: null,
            format: match.specKey,
            formatDisplay: match.formatDisplay,
            spec: match.spec
          });
        } else {
          incompatible.push({
            network: 'GOOGLE_ADS',
            tier: null,
            format: match.specKey,
            formatDisplay: match.formatDisplay,
            reason: validation.issues.join(', ') || `Velikost překračuje limit`
          });
        }
      }
    }

    appState.validationResults[fileData.name] = {
      file: fileData,
      compatible: compatible,
      incompatible: incompatible
    };
  }

  // Log validation summary to console
  console.group('📊 Validation Summary');
  console.log(`Total files validated: ${appState.uploadedFiles.length}`);
  let totalCompatible = 0;
  let totalIncompatible = 0;
  for (const [fileName, validation] of Object.entries(appState.validationResults)) {
    totalCompatible += validation.compatible.length;
    totalIncompatible += validation.incompatible.length;
    if (validation.incompatible.length > 0) {
      console.warn(`⚠️  ${fileName}: ${validation.compatible.length} compatible, ${validation.incompatible.length} incompatible placements`);
    }
  }
  console.log(`✅ Total compatible placements: ${totalCompatible}`);
  console.log(`❌ Total incompatible placements: ${totalIncompatible}`);
  console.groupEnd();

  // Calculate network stats
  calculateNetworkStats();

  // Check if campaign table exists
  if (appState.campaignRequirements.length > 0) {
    // Show Step 2: Table validation
    validateAgainstCampaignTable();
    displayTableValidation();
    goToStep(2);
  } else {
    // Skip to Step 3: System validation
    displayNetworkToggles();
    goToStep(3);
  }
}

/**
 * Validate uploaded files against campaign requirements
 */
function validateAgainstCampaignTable() {
  const results = [];

  for (const requirement of appState.campaignRequirements) {
    const result = {
      requirement: requirement,
      found: [],
      missing: [],
      issues: []
    };

    // Check each dimension in requirement
    for (const dimension of requirement.dimensions) {
      // Filter by dimension AND format type (HTML5 vs static)
      const matchingFiles = appState.uploadedFiles.filter(f => {
        if (f.dimensions !== dimension) return false;

        // If requirement is HTML5-only, accept only HTML5 files
        if (requirement.isHTML5 && !f.isHTML5) return false;

        // If requirement is static-only, accept only non-HTML5 files
        if (requirement.isStatic && f.isHTML5) return false;

        return true;
      });

      if (matchingFiles.length > 0) {
        // Found files with this dimension
        for (const file of matchingFiles) {
          const fileResult = {
            file: file,
            dimension: dimension,
            sizeValid: true,
            sizeIssue: null
          };

          // Check size if requirement specifies it
          if (requirement.maxSizeKB && file.sizeKB > requirement.maxSizeKB * 1.05) {
            fileResult.sizeValid = false;
            fileResult.sizeIssue = `${file.sizeKB}KB překračuje limit ${requirement.maxSizeKB}KB`;
          }

          result.found.push(fileResult);
        }
      } else {
        // Missing this dimension
        result.missing.push(dimension);
      }
    }

    results.push(result);
  }

  // Find extra files (not in requirements)
  const requiredDimensions = new Set();
  appState.campaignRequirements.forEach(req => {
    req.dimensions.forEach(dim => requiredDimensions.add(dim));
  });

  const extraFiles = appState.uploadedFiles.filter(f =>
    f.dimensions && !requiredDimensions.has(f.dimensions)
  );

  appState.tableValidation = {
    results: results,
    extraFiles: extraFiles
  };
}

/**
 * Display Step 2: Table validation results
 */
function displayTableValidation() {
  const container = document.getElementById('tableValidationResults');
  if (!container) return;

  const { results, extraFiles } = appState.tableValidation;

  let html = '<div style="display: grid; gap: 15px;">';

  // Show each requirement
  for (const result of results) {
    const req = result.requirement;
    const totalRequired = req.dimensions.length;
    const totalFound = new Set(result.found.map(f => f.dimension)).size;
    const hasMissing = result.missing.length > 0;
    const hasIssues = result.found.some(f => !f.sizeValid);

    let borderColor = '#10b981'; // green
    let bgColor = '#f0fdf4';

    if (hasMissing || hasIssues) {
      borderColor = '#fb923c'; // orange
      bgColor = '#fff7ed';
    }

    html += `
      <div style="border: 2px solid ${borderColor}; border-radius: 12px; padding: 20px; background: ${bgColor};">
        <h3 style="font-size: 18px; font-weight: 700; margin: 0 0 12px 0; color: #1f2937;">
          ${req.name}
          ${req.maxSizeKB ? `<span style="font-size: 14px; color: #6b7280; font-weight: 400;">(max ${req.maxSizeKB}KB)</span>` : ''}
        </h3>

        <div style="font-size: 16px; margin-bottom: 15px;">
          <span style="color: #10b981; font-weight: 600;">${totalFound}/${totalRequired}</span>
          <span style="color: #6b7280;"> rozměrů nalezeno</span>
        </div>

        <!-- Found files -->
        ${result.found.length > 0 ? `
          <div style="margin-bottom: 12px;">
            <div style="font-weight: 600; color: #059669; margin-bottom: 8px;">✅ Nalezené bannery:</div>
            <ul style="margin: 0; padding-left: 0; list-style: none;">
              ${result.found.map(f => {
                const file = f.file;
                const thumbnailURL = file.preview || (file.file ? createThumbnailURL(file.file) : '');
                return `
                  <li style="margin-bottom: 8px; display: flex; align-items: center; gap: 10px; padding: 8px; background: white; border-radius: 6px; border: 1px solid ${f.sizeValid ? '#bbf7d0' : '#fed7aa'};">
                    ${thumbnailURL ? `
                      <img src="${thumbnailURL}" alt="${file.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid #e5e7eb; flex-shrink: 0;">
                    ` : ''}
                    <div style="flex: 1;">
                      <div><strong>${file.name}</strong></div>
                      <div style="font-size: 12px; color: #6b7280;">${file.dimensions} • ${file.sizeKB}KB</div>
                      ${!f.sizeValid ? `<div style="font-size: 12px; color: #ef4444;">⚠️ ${f.sizeIssue}</div>` : ''}
                    </div>
                  </li>
                `;
              }).join('')}
            </ul>
          </div>
        ` : ''}

        <!-- Missing dimensions -->
        ${result.missing.length > 0 ? `
          <div style="padding: 12px; background: #fee2e2; border-radius: 6px; border: 1px solid #ef4444;">
            <div style="font-weight: 600; color: #dc2626; margin-bottom: 6px;">⚠️ Chybějící rozměry:</div>
            <div style="color: #991b1b; font-size: 14px;">
              ${result.missing.join(', ')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Show extra files
  if (extraFiles.length > 0) {
    html += `
      <div style="border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; background: #eff6ff;">
        <h3 style="font-size: 18px; font-weight: 700; margin: 0 0 12px 0; color: #1f2937;">
          ℹ️ Navíc (není v tabulce)
        </h3>
        <ul style="margin: 0; padding-left: 0; list-style: none;">
          ${extraFiles.map(file => {
            const thumbnailURL = file.preview || (file.file ? createThumbnailURL(file.file) : '');
            return `
              <li style="margin-bottom: 8px; display: flex; align-items: center; gap: 10px; padding: 8px; background: white; border-radius: 6px; border: 1px solid #bfdbfe;">
                ${thumbnailURL ? `
                  <img src="${thumbnailURL}" alt="${file.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; border: 1px solid #e5e7eb; flex-shrink: 0;">
                ` : ''}
                <div style="flex: 1;">
                  <div><strong>${file.name}</strong></div>
                  <div style="font-size: 12px; color: #6b7280;">${file.dimensions} • ${file.sizeKB}KB</div>
                </div>
              </li>
            `;
          }).join('')}
        </ul>
      </div>
    `;
  }

  html += '</div>';
  container.innerHTML = html;
}

function calculateNetworkStats() {
  // Initialize stats for all networks
  const networks = ['ADFORM', 'SOS', 'ONEGAR', 'SKLIK', 'HP_EXCLUSIVE', 'GOOGLE_ADS'];
  const tiers = ['HIGH', 'LOW'];

  for (const network of networks) {
    appState.networkStats[network] = {};

    if (network === 'HP_EXCLUSIVE' || network === 'GOOGLE_ADS') {
      // HP_EXCLUSIVE and GOOGLE_ADS have no tiers
      appState.networkStats[network].NONE = {
        eligibleAssets: 0,
        totalAssets: appState.uploadedFiles.length,
        errors: 0,
        eligiblePlacements: new Set(),
        errorFiles: []
      };
    } else {
      // Other networks have HIGH and LOW tiers
      for (const tier of tiers) {
        appState.networkStats[network][tier] = {
          eligibleAssets: 0,
          totalAssets: appState.uploadedFiles.length,
          errors: 0,
          eligiblePlacements: new Set(),
          errorFiles: []
        };
      }
    }
  }

  // Count eligible assets and errors per network per tier
  for (const [fileName, validation] of Object.entries(appState.validationResults)) {
    const fileCompatibleNetworks = new Set();

    // Track which networks have at least one compatible placement for this file
    for (const comp of validation.compatible) {
      const tier = comp.tier || 'NONE';
      const network = comp.network;

      if (appState.networkStats[network] && appState.networkStats[network][tier]) {
        appState.networkStats[network][tier].eligiblePlacements.add(comp.format);
        fileCompatibleNetworks.add(`${network}_${tier}`);
      }
    }

    // Count eligible assets (files with at least one compatible placement)
    for (const key of fileCompatibleNetworks) {
      const [network, tier] = key.split('_');
      if (appState.networkStats[network] && appState.networkStats[network][tier]) {
        appState.networkStats[network][tier].eligibleAssets++;
      }
    }

    // Count errors (incompatible placements)
    for (const incomp of validation.incompatible) {
      const tier = incomp.tier || 'NONE';
      const network = incomp.network;

      if (appState.networkStats[network] && appState.networkStats[network][tier]) {
        appState.networkStats[network][tier].errors++;
        appState.networkStats[network][tier].errorFiles.push({
          file: fileName,
          reason: incomp.reason,
          tier: tier !== 'NONE' ? tier : null,
          format: incomp.format
        });
      }
    }
  }

  // Convert Sets to counts and calculate totals per network
  for (const network in appState.networkStats) {
    for (const tier in appState.networkStats[network]) {
      const stats = appState.networkStats[network][tier];
      stats.eligiblePlacements = stats.eligiblePlacements.size;
    }
  }
}

function displayNetworkToggles() {
  const togglesSection = document.getElementById('networkToggles');
  if (!togglesSection) return;

  let html = '<div style="display: grid; gap: 15px; margin-bottom: 20px;">';

  // Aggregate stats per network (combining HIGH and LOW tiers)
  const networkAggregates = [];
  for (const [network, tiers] of Object.entries(appState.networkStats)) {
    let totalEligibleAssets = 0;
    let totalEligiblePlacementsHigh = 0;
    let totalEligiblePlacementsLow = 0;
    let totalPlacements = 0;
    let totalErrors = 0;
    let allErrorFiles = [];

    for (const [tier, stats] of Object.entries(tiers)) {
      totalEligibleAssets = Math.max(totalEligibleAssets, stats.eligibleAssets);
      if (tier === 'HIGH') totalEligiblePlacementsHigh = stats.eligiblePlacements;
      if (tier === 'LOW') totalEligiblePlacementsLow = stats.eligiblePlacements;
      if (tier === 'NONE') totalEligiblePlacementsHigh = stats.eligiblePlacements;
      totalPlacements = Math.max(totalPlacements, totalEligiblePlacementsHigh, totalEligiblePlacementsLow);
      totalErrors += stats.errors;
      allErrorFiles.push(...stats.errorFiles);
    }

    networkAggregates.push({
      network,
      eligibleAssets: totalEligibleAssets,
      totalPlacements: totalPlacements,
      eligiblePlacementsHigh: totalEligiblePlacementsHigh,
      eligiblePlacementsLow: totalEligiblePlacementsLow,
      errors: totalErrors,
      errorFiles: allErrorFiles
    });
  }

  // Sort networks by eligible assets (descending)
  networkAggregates.sort((a, b) => b.eligibleAssets - a.eligibleAssets);

  for (const stats of networkAggregates) {
    const hasEligibleAssets = stats.eligibleAssets > 0;
    const hasErrors = stats.errors > 0;

    // Determine border color: green if has eligible assets, orange if only errors, gray otherwise
    let borderColor = '#e5e7eb'; // gray
    let bgColor = '#ffffff';
    if (hasEligibleAssets && hasErrors) {
      borderColor = '#fb923c'; // orange (has both valid and errors)
      bgColor = '#fff7ed'; // light orange bg
    } else if (hasEligibleAssets) {
      borderColor = '#10b981'; // green (only valid)
      bgColor = '#f0fdf4'; // light green bg
    } else if (hasErrors) {
      borderColor = '#fb923c'; // orange (only errors)
      bgColor = '#fff7ed'; // light orange bg
    }

    html += `
      <div class="network-toggle-card" style="border: 2px solid ${borderColor}; border-radius: 12px; padding: 20px; background: ${bgColor}; transition: all 0.2s;">
        <div style="display: flex; align-items: flex-start; gap: 15px;">
          <div style="flex: 1;">
            <div style="font-weight: 700; font-size: 20px; color: #1f2937; margin-bottom: 12px;">
              <span style="cursor: help; border-bottom: 1px dotted #6b7280;" title="${getNetworkTooltip(stats.network)}">${stats.network.replace('_', ' ')}</span>
            </div>

            <div class="network-stats-summary" style="font-size: 18px; color: #1f2937; margin-bottom: 12px;">
              <span class="valid-assets-count" style="display: inline-flex; align-items: center; gap: 5px;">
                <span class="valid-icon" style="font-size: 20px;">✓</span>
                <span class="valid-count" style="font-weight: 700; color: #10b981;">${stats.eligibleAssets} validních assetů</span>
              </span>
              <span class="placements-count" style="color: #6b7280;"> (${stats.totalPlacements} umístění)</span>
              ${hasErrors ? `
                <span class="error-assets-count" style="margin-left: 15px; display: inline-flex; align-items: center; gap: 5px;">
                  <span class="error-icon" style="font-size: 20px;">⚠</span>
                  <span class="error-count" style="font-weight: 700; color: #ef4444;">${stats.errors}</span>
                  <span class="error-label" style="color: #6b7280;"> chyb</span>
                </span>
              ` : ''}
            </div>

            <div style="margin-top: 12px; display: flex; gap: 10px; flex-wrap: wrap;">
              ${hasEligibleAssets ? `
                <button onclick="toggleValidCreatives('${stats.network}')"
                  id="validBtn_${stats.network}"
                  style="background: #ffffff; border: 1px solid #10b981; color: #10b981; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-weight: 600;">
                  <span id="validIcon_${stats.network}">▶</span>
                  <span id="validText_${stats.network}">Zobrazit validní bannery</span>
                </button>
              ` : ''}
              ${hasErrors ? `
                <button onclick="toggleNetworkErrors('${stats.network}')"
                  id="errorBtn_${stats.network}"
                  style="background: #ffffff; border: 1px solid #ef4444; color: #ef4444; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-weight: 600;">
                  <span id="errorIcon_${stats.network}">▼</span>
                  <span id="errorText_${stats.network}">Skrýt chyby</span>
                </button>
              ` : ''}
            </div>

            ${hasEligibleAssets ? `
              <div id="validDetails_${stats.network}" style="display: none; margin-top: 12px; padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; font-size: 13px;">
                <div style="font-weight: 600; color: #166534; margin-bottom: 8px;">Validní bannery pro tento systém:</div>
                ${buildValidDetails(stats.network)}
              </div>
            ` : ''}

            ${hasErrors ? `
              <div id="errorDetails_${stats.network}" style="display: block; margin-top: 12px; padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; font-size: 13px;">
                <div style="font-weight: 600; color: #991b1b; margin-bottom: 8px;">Chybějící nebo nevalidní bannery:</div>
                ${buildErrorDetails({ errorFiles: stats.errorFiles })}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  html += '</div>';
  togglesSection.innerHTML = html;
}

// Display network selection with checkboxes (Step 4)
function displayNetworkSelection() {
  const selectionSection = document.getElementById('networkSelection');
  if (!selectionSection) return;

  let html = '<div id="network-selection-container" style="display: grid; gap: 15px; margin-bottom: 20px;">';

  // Aggregate stats per network (combining HIGH and LOW tiers)
  const networkAggregates = [];
  for (const [network, tiers] of Object.entries(appState.networkStats)) {
    let totalEligibleAssets = 0;

    for (const [tier, stats] of Object.entries(tiers)) {
      totalEligibleAssets = Math.max(totalEligibleAssets, stats.eligibleAssets);
    }

    if (totalEligibleAssets > 0) {
      networkAggregates.push({
        network,
        eligibleAssets: totalEligibleAssets
      });
    }
  }

  // Sort networks by eligible assets (descending)
  networkAggregates.sort((a, b) => b.eligibleAssets - a.eligibleAssets);

  for (const stats of networkAggregates) {
    const isSOS = stats.network === 'SOS';
    const hasHPExclusive = stats.network === 'HP_EXCLUSIVE';
    const hasGoogleAds = stats.network === 'GOOGLE_ADS';
    const showTierSelector = !hasHPExclusive && !hasGoogleAds;

    html += `
      <div class="network-selection-card" id="network-card-${stats.network}" style="border: 2px solid #10b981; border-radius: 12px; padding: 20px; background: #f0fdf4; transition: all 0.2s;">
        <label class="network-checkbox-label" style="display: flex; align-items: center; gap: 15px; cursor: pointer;">
          <input class="network-checkbox" type="checkbox" id="select_${stats.network}"
            checked
            onchange="toggleNetworkSelection('${stats.network}')"
            style="width: 24px; height: 24px; cursor: pointer; accent-color: #10b981;">
          <div class="network-info" style="flex: 1;">
            <div class="network-name" style="font-weight: 700; font-size: 20px; color: #1f2937;">
              <span class="network-name-tooltip" style="cursor: help; border-bottom: 1px dotted #6b7280;" title="${getNetworkTooltip(stats.network)}">${stats.network.replace('_', ' ')}</span>
            </div>
            <div class="network-banner-count" style="font-size: 16px; color: #1f2937; margin-top: 8px;">
              <span class="banner-count-value" style="font-weight: 700; color: #10b981;">${stats.eligibleAssets} validních bannerů</span>
            </div>
          </div>
        </label>

        ${showTierSelector ? `
          <div class="tier-selector" style="margin-top: 15px; padding: 12px; background: #ffffff; border: 1px solid #d1d5db; border-radius: 6px;">
            <label for="tier_${stats.network}" style="font-weight: 600; color: #1f2937; display: block; margin-bottom: 8px;">
              Tier:
            </label>
            ${isSOS ? `
              <div style="padding: 8px; background: #f3f4f6; border-radius: 4px; color: #6b7280; font-size: 14px;">
                HIGH (pouze)
              </div>
            ` : `
              <select id="tier_${stats.network}" onchange="updateNetworkTier('${stats.network}')" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;">
                <option value="LOW" selected>LOW</option>
                <option value="HIGH">HIGH</option>
                <option value="BOTH">Oba (LOW i HIGH)</option>
              </select>
            `}
          </div>
        ` : ''}

        <div class="network-actions" style="margin-top: 12px;">
          <button class="toggle-banner-selection-btn" onclick="toggleExportPreview('${stats.network}')"
            id="previewBtn_${stats.network}"
            style="background: #ffffff; border: 1px solid #10b981; color: #10b981; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-weight: 600;">
            <span class="toggle-icon" id="previewIcon_${stats.network}">▶</span>
            <span id="previewText_${stats.network}">Vybrat bannery k exportu</span>
          </button>
        </div>
        <div id="previewDetails_${stats.network}" class="banner-selection-panel" style="display: none; margin-top: 12px; padding: 12px; background: #ffffff; border: 1px solid #bbf7d0; border-radius: 6px; font-size: 13px;">
          ${buildExportPreviewWithCheckboxes(stats.network)}
        </div>
      </div>
    `;
  }

  html += '</div>';
  selectionSection.innerHTML = html;

  // Initialize selected networks
  updateSelectedNetworks();
}

function toggleNetworkSelection(network) {
  updateSelectedNetworks();
}

/**
 * Create a thumbnail URL from a File object
 * @param {File} file - The file to create a thumbnail for
 * @returns {string} Object URL for the thumbnail
 */
function createThumbnailURL(file) {
  return URL.createObjectURL(file);
}

function buildExportPreviewWithCheckboxes(network) {
  // Get all valid files for this network (across all tiers)
  const assignedFiles = [];
  const otherValidFiles = [];

  for (const [fileName, validation] of Object.entries(appState.validationResults)) {
    const matches = validation.compatible.filter(c => c.network === network);
    if (matches.length > 0) {
      const fileInfo = {
        fileName,
        file: validation.file
      };

      // Check if file is assigned to this network based on folder name
      if (validation.file.assignedSystem === network) {
        assignedFiles.push(fileInfo);
      } else {
        otherValidFiles.push(fileInfo);
      }
    }
  }

  if (assignedFiles.length === 0 && otherValidFiles.length === 0) {
    return '<p style="color: #6b7280;">Žádné bannery k exportu</p>';
  }

  let html = '';

  // Show assigned banners first
  if (assignedFiles.length > 0) {
    html += '<div class="banner-list-section" style="margin-bottom: 12px;">';
    html += '<div style="font-weight: 600; color: #059669; margin-bottom: 8px; font-size: 13px;">📂 Přiřazené bannery:</div>';
    html += '<ul style="margin: 0; padding-left: 0; list-style: none; color: #166534;">';
    for (const fileData of assignedFiles) {
      const checkboxId = `banner_${network}_${fileData.fileName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const thumbnailURL = createThumbnailURL(fileData.file.file);
      html += `
        <li style="margin-bottom: 8px; display: flex; align-items: center; gap: 10px;">
          <input type="checkbox" id="${checkboxId}" checked onchange="updateBannerSelection('${network}', '${fileData.fileName}')" style="width: 18px; height: 18px; cursor: pointer; accent-color: #10b981; flex-shrink: 0;">
          <img src="${thumbnailURL}" alt="${fileData.fileName}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #e5e7eb; flex-shrink: 0;">
          <label for="${checkboxId}" style="cursor: pointer; flex: 1;">
            <strong>${fileData.fileName}</strong> <span style="color: #6b7280; font-size: 12px;">(${fileData.file.dimensions})</span>
          </label>
        </li>`;
    }
    html += '</ul>';
    html += '</div>';
  }

  // Show other compatible banners
  if (otherValidFiles.length > 0) {
    html += '<div class="banner-list-section" style="margin-bottom: 12px;">';
    // If there are no assigned files, just show "Bannery k exportu" instead of "Další kompatibilní bannery"
    const headline = assignedFiles.length === 0
      ? 'Bannery k exportu:'
      : '✓ Další kompatibilní bannery:';
    html += `<div style="font-weight: 600; color: #059669; margin-bottom: 8px; font-size: 13px;">${headline}</div>`;
    html += '<ul style="margin: 0; padding-left: 0; list-style: none; color: #166534;">';
    for (const fileData of otherValidFiles) {
      const checkboxId = `banner_${network}_${fileData.fileName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const thumbnailURL = createThumbnailURL(fileData.file.file);
      html += `
        <li style="margin-bottom: 8px; display: flex; align-items: center; gap: 10px;">
          <input type="checkbox" id="${checkboxId}" checked onchange="updateBannerSelection('${network}', '${fileData.fileName}')" style="width: 18px; height: 18px; cursor: pointer; accent-color: #10b981; flex-shrink: 0;">
          <img src="${thumbnailURL}" alt="${fileData.fileName}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #e5e7eb; flex-shrink: 0;">
          <label for="${checkboxId}" style="cursor: pointer; flex: 1;">
            <strong>${fileData.fileName}</strong> <span style="color: #6b7280; font-size: 12px;">(${fileData.file.dimensions})</span>
          </label>
        </li>`;
    }
    html += '</ul>';
    html += '</div>';
  }

  return html;
}

function buildExportPreview(network) {
  // Get all valid files for this network (across all tiers)
  const assignedFiles = [];
  const otherValidFiles = [];

  for (const [fileName, validation] of Object.entries(appState.validationResults)) {
    const matches = validation.compatible.filter(c => c.network === network);
    if (matches.length > 0) {
      const fileInfo = {
        fileName,
        file: validation.file
      };

      // Check if file is assigned to this network based on folder name
      if (validation.file.assignedSystem === network) {
        assignedFiles.push(fileInfo);
      } else {
        otherValidFiles.push(fileInfo);
      }
    }
  }

  if (assignedFiles.length === 0 && otherValidFiles.length === 0) {
    return '<p style="color: #6b7280;">Žádné bannery k exportu</p>';
  }

  let html = '';

  // Show assigned banners first
  if (assignedFiles.length > 0) {
    html += '<div style="margin-bottom: 12px;">';
    html += '<div style="font-weight: 600; color: #059669; margin-bottom: 8px; font-size: 13px;">📂 Přiřazené bannery:</div>';
    html += '<ul style="margin: 0; padding-left: 20px; color: #166534;">';
    for (const fileData of assignedFiles) {
      html += `<li style="margin-bottom: 4px;"><strong>${fileData.fileName}</strong> <span style="color: #6b7280; font-size: 12px;">(${fileData.file.dimensions})</span></li>`;
    }
    html += '</ul>';
    html += '</div>';
  }

  // Show other compatible banners
  if (otherValidFiles.length > 0) {
    html += '<div style="margin-bottom: 12px;">';
    // If there are no assigned files, just show "Bannery k exportu" instead of "Další kompatibilní bannery"
    const headline = assignedFiles.length === 0
      ? 'Bannery k exportu:'
      : '✓ Další kompatibilní bannery:';
    html += `<div style="font-weight: 600; color: #059669; margin-bottom: 8px; font-size: 13px;">${headline}</div>`;
    html += '<ul style="margin: 0; padding-left: 20px; color: #166534;">';
    for (const fileData of otherValidFiles) {
      html += `<li style="margin-bottom: 4px;"><strong>${fileData.fileName}</strong> <span style="color: #6b7280; font-size: 12px;">(${fileData.file.dimensions})</span></li>`;
    }
    html += '</ul>';
    html += '</div>';
  }

  return html;
}

function toggleExportPreview(key) {
  const previewDetails = document.getElementById(`previewDetails_${key}`);
  const previewIcon = document.getElementById(`previewIcon_${key}`);
  const previewText = document.getElementById(`previewText_${key}`);

  if (!previewDetails) return;

  const isVisible = previewDetails.style.display !== 'none';

  if (isVisible) {
    // Collapse
    previewDetails.style.display = 'none';
    if (previewIcon) previewIcon.textContent = '▶';
    if (previewText) previewText.textContent = 'Zobrazit bannery k exportu';
  } else {
    // Expand
    previewDetails.style.display = 'block';
    if (previewIcon) previewIcon.textContent = '▼';
    if (previewText) previewText.textContent = 'Skrýt bannery k exportu';
  }
}

function buildValidDetails(network) {
  // Get all valid files for this network (across all tiers)
  const assignedFiles = [];
  const otherValidFiles = [];

  for (const [fileName, validation] of Object.entries(appState.validationResults)) {
    const matches = validation.compatible.filter(c => c.network === network);
    if (matches.length > 0) {
      const file = validation.file;
      const fileInfo = {
        fileName,
        file,
        assignedSystem: file.assignedSystem
      };

      // Check if file is assigned to this network based on folder name
      if (file.assignedSystem === network) {
        assignedFiles.push(fileInfo);
      } else {
        otherValidFiles.push(fileInfo);
      }
    }
  }

  if (assignedFiles.length === 0 && otherValidFiles.length === 0) {
    return '<p style="color: #6b7280;">Žádné validní bannery</p>';
  }

  let html = '';

  // Show assigned banners first
  if (assignedFiles.length > 0) {
    html += '<div style="margin-bottom: 12px;">';
    html += '<div style="font-weight: 600; color: #059669; margin-bottom: 8px; font-size: 14px;">📂 Přiřazené bannery:</div>';
    html += '<ul style="margin: 0; padding-left: 0; list-style: none; color: #166534;">';
    for (const fileInfo of assignedFiles) {
      const thumbnailURL = fileInfo.file.preview || (fileInfo.file.file ? createThumbnailURL(fileInfo.file.file) : '');
      html += `
        <li style="margin-bottom: 8px; display: flex; align-items: center; gap: 10px; padding: 8px; background: #f0fdf4; border-radius: 6px; border: 1px solid #bbf7d0;">
          ${thumbnailURL ? `
            <img src="${thumbnailURL}" alt="${fileInfo.fileName}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #e5e7eb; flex-shrink: 0;">
          ` : `
            <div style="width: 60px; height: 60px; background: #f3f4f6; border-radius: 4px; border: 1px solid #e5e7eb; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 24px;">📄</div>
          `}
          <div style="flex: 1;">
            <div><strong>${fileInfo.fileName}</strong></div>
            <div style="color: #166534; font-size: 12px;">${fileInfo.file.dimensions} • ${fileInfo.file.sizeKB} KB</div>
          </div>
        </li>`;
    }
    html += '</ul>';
    html += '</div>';
  }

  // Show other compatible banners
  if (otherValidFiles.length > 0) {
    html += '<div style="margin-bottom: 12px;">';
    html += '<div style="font-weight: 600; color: #059669; margin-bottom: 8px; font-size: 14px;">✓ Další kompatibilní bannery:</div>';
    html += '<ul style="margin: 0; padding-left: 0; list-style: none; color: #166534;">';
    for (const fileInfo of otherValidFiles) {
      const thumbnailURL = fileInfo.file.preview || (fileInfo.file.file ? createThumbnailURL(fileInfo.file.file) : '');
      html += `
        <li style="margin-bottom: 8px; display: flex; align-items: center; gap: 10px; padding: 8px; background: #f0fdf4; border-radius: 6px; border: 1px solid #bbf7d0;">
          ${thumbnailURL ? `
            <img src="${thumbnailURL}" alt="${fileInfo.fileName}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #e5e7eb; flex-shrink: 0;">
          ` : `
            <div style="width: 60px; height: 60px; background: #f3f4f6; border-radius: 4px; border: 1px solid #e5e7eb; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 24px;">📄</div>
          `}
          <div style="flex: 1;">
            <div><strong>${fileInfo.fileName}</strong></div>
            <div style="color: #166534; font-size: 12px;">${fileInfo.file.dimensions} • ${fileInfo.file.sizeKB} KB</div>
          </div>
        </li>`;
    }
    html += '</ul>';
    html += '</div>';
  }

  // Show missing files
  const allFiles = new Set(Object.keys(appState.validationResults));
  const validFileNames = new Set([...assignedFiles, ...otherValidFiles].map(f => f.fileName));
  const missingFiles = [...allFiles].filter(f => !validFileNames.has(f));

  if (missingFiles.length > 0) {
    html += '<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #bbf7d0;">';
    html += '<div style="font-weight: 600; color: #dc2626; margin-bottom: 6px;">Chybějící nebo nevalidní bannery:</div>';
    html += '<ul style="margin: 0; padding-left: 20px; color: #dc2626;">';
    for (const fileName of missingFiles) {
      const validation = appState.validationResults[fileName];
      const file = validation.file;
      html += `<li style="margin-bottom: 4px;">${fileName} <span style="font-size: 12px; color: #6b7280;">(${file.dimensions})</span></li>`;
    }
    html += '</ul>';
    html += '</div>';
  }

  return html;
}

function buildErrorDetails(stats) {
  if (!stats || !stats.errorFiles.length) return '';

  // Group errors by filename, collecting all tier-specific reasons
  const errorsByFile = {};
  for (const errorInfo of stats.errorFiles) {
    if (!errorsByFile[errorInfo.file]) {
      errorsByFile[errorInfo.file] = [];
    }
    // Add tier information if present
    const tierInfo = errorInfo.tier ? ` (${errorInfo.tier})` : '';
    errorsByFile[errorInfo.file].push({
      reason: errorInfo.reason,
      tier: errorInfo.tier,
      format: errorInfo.format
    });
  }

  // Log errors to console for developers
  console.group('🔴 Validation Errors');
  for (const [file, errors] of Object.entries(errorsByFile)) {
    console.group(`📄 ${file}`);
    errors.forEach((err, idx) => {
      const tierLabel = err.tier ? ` [${err.tier} tier]` : '';
      const formatLabel = err.format ? ` (${err.format})` : '';
      console.error(`  Error ${idx + 1}${tierLabel}${formatLabel}: ${err.reason}`);
    });
    console.groupEnd();
  }
  console.groupEnd();

  let html = '<ul style="margin: 0; padding-left: 20px; color: #7f1d1d;">';
  for (const [file, errors] of Object.entries(errorsByFile)) {
    html += `<li style="margin-bottom: 8px;"><strong>${file}</strong><br/>`;

    // Show all error reasons (deduplicate identical messages)
    const uniqueReasons = [...new Set(errors.map(e => e.reason))];
    uniqueReasons.forEach((reason, idx) => {
      // Find which tiers have this error
      const tiersWithError = errors.filter(e => e.reason === reason).map(e => e.tier).filter(Boolean);
      const tierLabel = tiersWithError.length > 0 ? ` <span style="font-size: 11px; color: #6b7280;">[${tiersWithError.join(', ')}]</span>` : '';

      html += `<span style="color: #991b1b; font-size: 12px; display: block; margin-top: ${idx > 0 ? '4px' : '2px'};">• ${reason}${tierLabel}</span>`;
    });

    html += '</li>';
  }
  html += '</ul>';

  return html;
}

function toggleValidCreatives(key) {
  const validDetails = document.getElementById(`validDetails_${key}`);
  const validIcon = document.getElementById(`validIcon_${key}`);
  const validText = document.getElementById(`validText_${key}`);

  if (!validDetails) return;

  const isVisible = validDetails.style.display !== 'none';

  if (isVisible) {
    // Collapse
    validDetails.style.display = 'none';
    if (validIcon) validIcon.textContent = '▶';
    if (validText) validText.textContent = 'Zobrazit validní bannery';
  } else {
    // Expand
    validDetails.style.display = 'block';
    if (validIcon) validIcon.textContent = '▼';
    if (validText) validText.textContent = 'Skrýt validní bannery';
  }
}

function updateSelectedNetworks() {
  appState.selectedNetworks = [];

  for (const network in appState.networkStats) {
    const checkbox = document.getElementById(`select_${network}`);
    if (checkbox && checkbox.checked) {
      // Get selected banners for this network
      const selectedBanners = [];
      for (const [fileName, validation] of Object.entries(appState.validationResults)) {
        const matches = validation.compatible.filter(c => c.network === network);
        if (matches.length > 0) {
          const checkboxId = `banner_${network}_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`;
          const bannerCheckbox = document.getElementById(checkboxId);
          if (bannerCheckbox && bannerCheckbox.checked) {
            selectedBanners.push(fileName);
          }
        }
      }

      // Get tier selection for this network
      const tierSelect = document.getElementById(`tier_${network}`);
      let tiers = [];

      if (network === 'SOS') {
        // SOS only has HIGH tier
        tiers = ['HIGH'];
      } else if (network === 'HP_EXCLUSIVE' || network === 'GOOGLE_ADS') {
        // HP_EXCLUSIVE and GOOGLE_ADS have no tiers
        tiers = ['NONE'];
      } else if (tierSelect) {
        const tierValue = tierSelect.value;
        if (tierValue === 'BOTH') {
          tiers = ['LOW', 'HIGH'];
        } else {
          tiers = [tierValue];
        }
      } else {
        // Default to LOW if no tier selector found
        tiers = ['LOW'];
      }

      // Store with tier information
      appState.selectedNetworks.push({
        network: network,
        selectedBanners: selectedBanners,
        tiers: tiers
      });
    }
  }
}

function updateNetworkTier(network) {
  // Update selected networks when tier changes
  updateSelectedNetworks();
}

function updateBannerSelection(network, fileName) {
  // Just update the state - the checkbox state is already updated by the browser
  updateSelectedNetworks();
}

function toggleNetworkErrors(key) {
  const errorDetails = document.getElementById(`errorDetails_${key}`);
  const errorIcon = document.getElementById(`errorIcon_${key}`);
  const errorText = document.getElementById(`errorText_${key}`);

  if (!errorDetails) return;

  const isVisible = errorDetails.style.display !== 'none';

  if (isVisible) {
    // Collapse
    errorDetails.style.display = 'none';
    if (errorIcon) errorIcon.textContent = '▶';
    if (errorText) errorText.textContent = 'Zobrazit chyby';
  } else {
    // Expand
    errorDetails.style.display = 'block';
    if (errorIcon) errorIcon.textContent = '▼';
    if (errorText) errorText.textContent = 'Skrýt chyby';
  }
}

function showFileDetails(fileIndex) {
  const file = appState.uploadedFiles[fileIndex];
  const validation = appState.validationResults[file.name];

  let details = `File: ${file.name}\n\n`;

  if (validation) {
    if (validation.compatible.length > 0) {
      details += `✅ Compatible Networks (${validation.compatible.length}):\n`;
      validation.compatible.forEach(c => {
        details += `  - ${c.network} ${c.tier || ''} (${c.formatDisplay})\n`;
      });
      details += '\n';
    }

    if (validation.incompatible.length > 0) {
      details += `❌ Incompatible Networks (${validation.incompatible.length}):\n`;
      validation.incompatible.forEach(c => {
        details += `  - ${c.network} ${c.tier || ''}: ${c.reason}\n`;
      });
      details += '\n';
    }
  }

  if (!file.colorSpaceValid) {
    details += `⚠️ Warning: ${file.colorSpace} color space detected. Please convert to RGB.\n`;
  }

  alert(details);
}

// =============================================================================
// EXPORT SETTINGS (Step 4)
// =============================================================================

function updateCampaignTier(tier) {
  appState.selectedCampaignTier = tier;
  displayExportSettings();
}

/**
 * Build HTML for a single network tier section
 * @param {string} network - Network name (e.g., 'ADFORM', 'SOS')
 * @param {string} tier - Tier level ('LOW' or 'HIGH')
 * @param {Object} selection - Selection object with network and selectedBanners
 * @param {string} campaignName - Campaign name
 * @param {string} contentName - Content name
 * @param {string} landingURL - Landing page URL
 * @returns {string} HTML for the tier section
 */
function buildNetworkTierSection(network, tier, selection, campaignName, contentName, landingURL) {
  const tierKey = network === 'HP_EXCLUSIVE' ? 'NONE' : tier;
  const stats = appState.networkStats[network][tierKey];

  if (!stats) return '';

  // Get eligible files for this network and tier, filtered by selected banners
  const eligibleFiles = [];
  for (const [fileName, validation] of Object.entries(appState.validationResults)) {
    // Only include files that were selected in step 4
    if (!selection.selectedBanners || !selection.selectedBanners.includes(fileName)) {
      continue;
    }

    const matches = validation.compatible.filter(c =>
      c.network === network && (c.tier === tier || (network === 'HP_EXCLUSIVE' && !c.tier))
    );

    if (matches.length > 0) {
      eligibleFiles.push({
        fileName,
        file: validation.file,
        placements: matches
      });
    }
  }

  // Build and return the HTML for this tier section
  return `
    <div class="network-card" style="border: 2px solid #10b981; border-radius: 12px; padding: 20px; margin: 20px 0; background: #f0fdf4;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <div>
          <h3 style="margin: 0; font-size: 22px; color: #1f2937;">
            <span style="cursor: help; border-bottom: 1px dotted #6b7280;" title="${getNetworkTooltip(network)}">${network.replace('_', ' ')}</span> - ${tier} Tier
          </h3>
          <div style="font-size: 14px; color: #6b7280; margin-top: 5px;">
            Tier kampaně: <strong>${network === 'HP_EXCLUSIVE' ? 'N/A' : tier}</strong>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 28px; font-weight: 700; color: #10b981;">${eligibleFiles.length}</div>
          <div style="font-size: 12px; color: #6b7280;">Validních bannerů</div>
        </div>
      </div>

      <div style="padding: 12px; background: white; border-radius: 8px; margin-bottom: 15px;">
        <div style="font-size: 12px; color: #6b7280;">Počet kampaňových assetů</div>
        <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${stats.eligiblePlacements}</div>
      </div>

      ${eligibleFiles.length > 0 ? `
        <div style="margin-bottom: 15px;">
          <strong style="display: block; margin-bottom: 8px; color: #1f2937;">Bannery k exportu:</strong>
          <div style="overflow-x: auto; background: white; border-radius: 6px;">
            <table class="results-table" style="width: 100%; min-width: 1000px;">
              <thead>
                <tr>
                  <th style="width: 180px;">Název banneru</th>
                  <th style="width: 100px;">Rozměr</th>
                  <th style="width: 120px;">Formát</th>
                  <th style="width: 120px;">Umístění</th>
                  <th style="width: 120px;">Ukotvení</th>
                  <th>Finální URL</th>
                  <th style="width: 80px;">Akce</th>
                </tr>
              </thead>
              <tbody>
                ${eligibleFiles.map((f, idx) => {
                  const fileId = `${network}_${tier}_${idx}`;

                  // Auto-detect format based on file.detectedFormat
                  let defaultFormat = 'banner';
                  if (f.file.detectedFormat) {
                    const df = f.file.detectedFormat;
                    if (df === 'kombi') defaultFormat = 'kombi';
                    else if (df === 'branding' || df === 'branding-scratcher' || df === 'branding-uncover') defaultFormat = 'branding';
                    else if (df === 'interscroller' || df === 'mobilni-interscroller') defaultFormat = 'interscroller';
                    else if (df === 'spincube') defaultFormat = 'spincube';
                    else if (df === 'spinner') defaultFormat = 'spinner';
                    else if (df === 'inarticle') defaultFormat = 'in-article';
                  }

                  const defaultService = 'hp';

                  // Build format dropdown options based on network
                  let formatOptions = '';
                  if (network === 'SOS') {
                    // SOS: rich media formats only
                    formatOptions = `
                      <option value="in-article">In-article</option>
                      <option value="branding">Branding</option>
                      <option value="branding-videopanel">Branding-videopanel</option>
                      <option value="uncover">Uncover</option>
                      <option value="scratcher">Scratcher</option>
                      <option value="interscroller">Interscroller</option>
                      <option value="spincube">Spincube</option>
                      <option value="spinner">Spinner</option>
                      <option value="mobilni-interactive">Mobilní-interactive</option>
                    `;
                  } else if (network === 'ADFORM') {
                    // ADFORM: only banner
                    formatOptions = '<option value="banner">Banner</option>';
                  } else {
                    // Others: banner, kombi, etc.
                    formatOptions = `
                      <option value="banner">Banner</option>
                      <option value="kombi">Kombi</option>
                    `;
                  }

                  // Mark selected format
                  formatOptions = formatOptions.replace(`value="${defaultFormat}"`, `value="${defaultFormat}" selected`);

                  // Generate URL with current values
                  const generatedURL = generateBannerURL({
                    network: network,
                    tier: tier,
                    campaignName: campaignName,
                    contentName: contentName,
                    landingURL: landingURL,
                    dimensions: f.file.dimensions,
                    format: defaultFormat,
                    service: defaultService,
                    anchor: '',
                    isZbozi: appState.isZboziCampaign
                  });

                  const finalName = generateFinalFilename(f.fileName, f.file.dimensions, campaignName, network);

                  return `
                    <tr>
                      <td>
                        <div style="font-weight: 600;">${f.fileName}</div>
                        <div style="font-size: 11px; color: #10b981; margin-top: 2px;">→ ${finalName}</div>
                      </td>
                      <td>${f.file.dimensions}</td>
                      <td>
                        <select id="format_${fileId}" onchange="updateBannerURL('${fileId}', '${network}', '${tier}', ${idx})" style="width: 100%; padding: 4px; font-size: 12px;">
                          ${formatOptions}
                        </select>
                      </td>
                      <td>
                        <select id="service_${fileId}" onchange="handleServiceChange('${fileId}', '${network}', '${tier}', ${idx})" style="width: 100%; padding: 4px; font-size: 12px;">
                          <option value="">-- žádné --</option>
                          <option value="hp" selected>HP</option>
                          <option value="obsah">Obsah</option>
                          <option value="sport">Sport</option>
                          <option value="zpravy">Zprávy</option>
                          <option value="novinky">Novinky</option>
                          <option value="prozeny">Pro ženy</option>
                          <option value="super">Super</option>
                          <option value="garaz">Garáž</option>
                          <option value="_custom_">Vlastní...</option>
                        </select>
                        <input type="text" id="service_custom_${fileId}" placeholder="Zadejte vlastní umístění" onchange="updateBannerURL('${fileId}', '${network}', '${tier}', ${idx})" style="display: none; margin-top: 4px; width: 100%; padding: 4px; font-size: 12px; border: 1px solid #d1d5db; border-radius: 3px;">
                      </td>
                      <td>
                        <input type="text" id="anchor_${fileId}" onchange="updateBannerURL('${fileId}', '${network}', '${tier}', ${idx})" placeholder="např. at-ziji-duchove" style="width: 100%; padding: 4px; font-size: 12px;">
                      </td>
                      <td>
                        <div id="url_${fileId}" style="font-size: 11px; color: #3b82f6; word-break: break-all; font-family: monospace;">${generatedURL}</div>
                      </td>
                      <td style="text-align: center;">
                        <button onclick="copyURL('${fileId}')" style="padding: 4px 8px; font-size: 11px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                          📋 Kopírovat
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <button class="btn-primary" onclick="exportNetworkZIP('${network}', '${tier}')" style="width: 100%; padding: 12px; font-size: 16px;">
          📦 Stáhnout balíček ${network} ${tier}
        </button>
      ` : `
        <div style="padding: 15px; background: #fef2f2; border-radius: 6px; color: #991b1b; text-align: center;">
          Žádné validní bannery pro tento systém a tier
        </div>
      `}
    </div>
  `;
}

function displayExportSettings() {
  const exportNetworksSection = document.getElementById('exportNetworks');
  if (!exportNetworksSection) return;

  // Use values from appState (set in step 3)
  const campaignName = appState.campaignName || '';
  const contentName = appState.contentName || '';
  const landingURL = appState.landingURL || '';

  let html = '';

  // Display each selected network with selected tiers
  for (const selection of appState.selectedNetworks) {
    const network = selection.network;
    const tiers = selection.tiers || ['LOW']; // Default to LOW if no tiers specified

    html += `<div class="network-tier-container" style="margin-bottom: 30px;">`;

    // Display section for each selected tier
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const marginTop = i > 0 ? 'margin-top: 20px;' : '';

      html += `<div id="tierSection_${network}_${tier}" style="${marginTop}">`;
      html += buildNetworkTierSection(network, tier, selection, campaignName, contentName, landingURL);
      html += `</div>`;
    }

    html += `</div>`; // Close network-tier-container
  }

  if (html === '') {
    html = '<div style="padding: 30px; text-align: center; color: #6b7280;">Nejsou vybrány žádné systémy. Vraťte se na krok 5 a vyberte systémy.</div>';
  }

  exportNetworksSection.innerHTML = html;
}
/**
 * Update banner URL when format, service, or anchor changes
 */
/**
 * Handle service dropdown change - show/hide custom input
 */
function handleServiceChange(fileId, network, tier, fileIndex) {
  const serviceSelect = document.getElementById(`service_${fileId}`);
  const customInput = document.getElementById(`service_custom_${fileId}`);

  if (serviceSelect.value === '_custom_') {
    customInput.style.display = 'block';
    customInput.focus();
  } else {
    customInput.style.display = 'none';
    customInput.value = '';
  }

  // Update URL
  updateBannerURL(fileId, network, tier, fileIndex);
}

function updateBannerURL(fileId, network, tier, fileIndex) {
  const formatSelect = document.getElementById(`format_${fileId}`);
  const serviceSelect = document.getElementById(`service_${fileId}`);
  const serviceCustomInput = document.getElementById(`service_custom_${fileId}`);
  const anchorInput = document.getElementById(`anchor_${fileId}`);
  const urlDiv = document.getElementById(`url_${fileId}`);

  if (!formatSelect || !serviceSelect || !urlDiv) return;

  // Get service value - use custom if selected
  let serviceValue = serviceSelect.value;
  if (serviceValue === '_custom_' && serviceCustomInput) {
    serviceValue = serviceCustomInput.value.trim();
  }

  // Get eligible files for this network/tier
  const eligibleFiles = [];
  for (const [fileName, validation] of Object.entries(appState.validationResults)) {
    const matches = validation.compatible.filter(c =>
      c.network === network && (c.tier === tier || (network === 'HP_EXCLUSIVE' && !c.tier))
    );
    if (matches.length > 0) {
      eligibleFiles.push({
        fileName,
        file: validation.file
      });
    }
  }

  const fileData = eligibleFiles[fileIndex];
  if (!fileData) return;

  // Generate new URL
  const newURL = generateBannerURL({
    network: network,
    tier: tier,
    campaignName: appState.campaignName,
    contentName: appState.contentName,
    landingURL: appState.landingURL,
    dimensions: fileData.file.dimensions,
    format: formatSelect.value,
    service: serviceValue,
    anchor: anchorInput ? anchorInput.value : '',
    isZbozi: appState.isZboziCampaign
  });

  urlDiv.textContent = newURL;
}

/**
 * Copy URL to clipboard
 */
function copyURL(fileId) {
  const urlDiv = document.getElementById(`url_${fileId}`);
  if (!urlDiv) return;

  const url = urlDiv.textContent;
  navigator.clipboard.writeText(url).then(() => {
    alert('URL zkopírována do schránky');
  }).catch(err => {
    console.error('Failed to copy:', err);
    alert('Nepodařilo se zkopírovat URL');
  });
}

function generateFinalFilename(originalName, dimensions, campaignName, network) {
  const extension = originalName.split('.').pop();
  const baseName = campaignName || 'banner';
  const safeBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
  const safeDimensions = dimensions.replace('x', '_');

  return `${safeBaseName}_${network}_${safeDimensions}.${extension}`;
}

// =============================================================================
// EXPORT FUNCTIONALITY
// =============================================================================

async function exportNetworkZIP(network, tier) {
  try {
    // Find the selection for this network (tier is no longer in selection)
    const selection = appState.selectedNetworks.find(s => s.network === network);
    if (!selection) {
      alert('Systém nebyl nalezen ve výběru.');
      return;
    }

    // Get eligible files for this network and tier, filtered by selected banners
    const eligibleFiles = [];
    for (const [fileName, validation] of Object.entries(appState.validationResults)) {
      // Only include files that were selected in step 4
      if (!selection.selectedBanners || !selection.selectedBanners.includes(fileName)) {
        continue;
      }

      const matches = validation.compatible.filter(c =>
        c.network === network && (c.tier === tier || (network === 'HP_EXCLUSIVE' && !c.tier))
      );

      if (matches.length > 0) {
        eligibleFiles.push({
          fileName,
          file: validation.file,
          placements: matches
        });
      }
    }

    if (eligibleFiles.length === 0) {
      alert('Žádné bannery k exportu pro tento systém.');
      return;
    }

    const campaignName = appState.campaignName || '';
    const contentName = appState.contentName || '';
    const landingURL = appState.landingURL || '';

    // Create ZIP file
    const zip = new JSZip();

    // Add all eligible banner files with renamed filenames
    for (const fileData of eligibleFiles) {
      const finalName = generateFinalFilename(fileData.fileName, fileData.file.dimensions, campaignName, network);
      zip.file(finalName, fileData.file.file);
    }

    // === Generate XLS file ===
    const wb = XLSX.utils.book_new();

    // Create worksheet data with headers
    const wsData = [
      ['Campaign', 'Content', 'Formát', 'Rozměr', 'Stopáž', 'Služba', 'Source', 'Medium', 'Landing page', 'Ukotvení', 'Název banneru', 'URL']
    ];

    // For each banner, read form values and add row
    for (let idx = 0; idx < eligibleFiles.length; idx++) {
      const fileData = eligibleFiles[idx];
      const fileId = `${network}_${tier}_${idx}`;

      // Read current form values from DOM
      const formatSelect = document.getElementById(`format_${fileId}`);
      const serviceSelect = document.getElementById(`service_${fileId}`);
      const anchorInput = document.getElementById(`anchor_${fileId}`);

      const format = formatSelect?.value || 'banner';
      const service = serviceSelect?.value || 'hp';
      const anchor = anchorInput?.value || '';

      // Generate URL with current values
      const url = generateBannerURL({
        network: network,
        tier: tier,
        campaignName: campaignName,
        contentName: contentName,
        landingURL: landingURL,
        dimensions: fileData.file.dimensions,
        format: format,
        service: service,
        anchor: anchor,
        isZbozi: appState.isZboziCampaign
      });

      // Extract UTM parameters from generated URL
      let source = '';
      let medium = '';

      // Only parse URL if landingURL is valid
      if (landingURL && landingURL.trim() !== '') {
        try {
          const urlObj = new URL(url);
          source = urlObj.searchParams.get('utm_source') || '';
          medium = urlObj.searchParams.get('utm_medium') || '';
        } catch (e) {
          console.warn('Invalid URL generated:', url, e);
        }
      }

      // Generate final renamed filename
      const finalName = generateFinalFilename(fileData.fileName, fileData.file.dimensions, campaignName, network);

      // Add row to worksheet
      wsData.push([
        campaignName,              // Campaign
        contentName,               // Content
        format,                    // Formát
        fileData.file.dimensions,  // Rozměr
        '',                        // Stopáž (empty for images, would be duration for videos)
        service,                   // Služba
        source,                    // Source (utm_source)
        medium,                    // Medium (utm_medium)
        landingURL,                // Landing page
        anchor,                    // Ukotvení
        finalName,                 // Název banneru
        url                        // URL (complete with UTM params)
      ]);
    }

    // Create worksheet from array of arrays
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Optional: Set column widths for better readability
    ws['!cols'] = [
      { wch: 25 },  // Campaign
      { wch: 20 },  // Content
      { wch: 15 },  // Formát
      { wch: 12 },  // Rozměr
      { wch: 10 },  // Stopáž
      { wch: 12 },  // Služba
      { wch: 20 },  // Source
      { wch: 25 },  // Medium
      { wch: 40 },  // Landing page
      { wch: 20 },  // Ukotvení
      { wch: 40 },  // Název banneru
      { wch: 80 }   // URL
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'URLs');

    // Generate XLSX file as binary array
    const xlsxData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // Add XLSX file to ZIP
    zip.file('export.xlsx', xlsxData);

    // Generate ZIP and download
    const blob = await zip.generateAsync({ type: 'blob' });
    const filename = `${network}_${network === 'HP_EXCLUSIVE' ? 'Package' : tier + '_Tier'}_${Date.now()}.zip`;
    downloadBlob(blob, filename);

    alert(`✅ Balíček úspěšně vyexportován!\n\nObsah:\n- ${eligibleFiles.length} bannerů\n- export.xlsx s URL detaily`);
  } catch (error) {
    console.error('Export error:', error);
    alert('Chyba při vytváření balíčku: ' + error.message);
  }
}

/**
 * Export all selected networks in a single master ZIP file
 * Each network will have its own folder with banners and XLSX file
 */
async function exportAllNetworksZIP() {
  try {
    if (appState.selectedNetworks.length === 0) {
      alert('Nejsou vybrány žádné systémy k exportu.');
      return;
    }

    const campaignName = appState.campaignName || 'campaign';
    const contentName = appState.contentName || '';
    const landingURL = appState.landingURL || '';

    // Create master ZIP file
    const masterZip = new JSZip();
    let totalBanners = 0;
    let totalNetworks = 0;

    // Process each selected network
    for (const selection of appState.selectedNetworks) {
      const network = selection.network;
      const tiers = network === 'HP_EXCLUSIVE' ? ['NONE'] : ['LOW', 'HIGH'];

      for (const tier of tiers) {
        // Get eligible files for this network and tier
        const eligibleFiles = [];
        for (const [fileName, validation] of Object.entries(appState.validationResults)) {
          if (!selection.selectedBanners || !selection.selectedBanners.includes(fileName)) {
            continue;
          }

          const matches = validation.compatible.filter(c =>
            c.network === network && (c.tier === tier || (network === 'HP_EXCLUSIVE' && !c.tier))
          );

          if (matches.length > 0) {
            eligibleFiles.push({
              fileName,
              file: validation.file,
              placements: matches
            });
          }
        }

        if (eligibleFiles.length === 0) continue;

        // Create folder for this network/tier
        const folderName = network === 'HP_EXCLUSIVE' ? network : `${network}_${tier}`;
        const networkFolder = masterZip.folder(folderName);

        // Add banner files with renamed names
        for (const fileData of eligibleFiles) {
          const finalName = generateFinalFilename(fileData.fileName, fileData.file.dimensions, campaignName, network);
          networkFolder.file(finalName, fileData.file.file);
        }

        // === Generate XLS file for this network/tier ===
        const wb = XLSX.utils.book_new();
        const wsData = [
          ['Campaign', 'Content', 'Formát', 'Rozměr', 'Stopáž', 'Služba', 'Source', 'Medium', 'Landing page', 'Ukotvení', 'Název banneru', 'URL']
        ];

        // For each banner, read form values and add row
        for (let idx = 0; idx < eligibleFiles.length; idx++) {
          const fileData = eligibleFiles[idx];
          const fileId = `${network}_${tier}_${idx}`;

          // Read current form values from DOM
          const formatSelect = document.getElementById(`format_${fileId}`);
          const serviceSelect = document.getElementById(`service_${fileId}`);
          const anchorInput = document.getElementById(`anchor_${fileId}`);

          const format = formatSelect?.value || 'banner';
          const service = serviceSelect?.value || 'hp';
          const anchor = anchorInput?.value || '';

          // Generate URL with current values
          const url = generateBannerURL({
            network: network,
            tier: tier,
            campaignName: campaignName,
            contentName: contentName,
            landingURL: landingURL,
            dimensions: fileData.file.dimensions,
            format: format,
            service: service,
            anchor: anchor,
            isZbozi: appState.isZboziCampaign
          });

          // Extract UTM parameters from generated URL
          let source = '';
          let medium = '';

          // Only parse URL if landingURL is valid
          if (landingURL && landingURL.trim() !== '') {
            try {
              const urlObj = new URL(url);
              source = urlObj.searchParams.get('utm_source') || '';
              medium = urlObj.searchParams.get('utm_medium') || '';
            } catch (e) {
              console.warn('Invalid URL generated:', url, e);
            }
          }

          // Generate final renamed filename
          const finalName = generateFinalFilename(fileData.fileName, fileData.file.dimensions, campaignName, network);

          // Add row to worksheet
          wsData.push([
            campaignName,
            contentName,
            format,
            fileData.file.dimensions,
            '',
            service,
            source,
            medium,
            landingURL,
            anchor,
            finalName,
            url
          ]);
        }

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [
          { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
          { wch: 20 }, { wch: 25 }, { wch: 40 }, { wch: 20 }, { wch: 40 }, { wch: 80 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'URLs');

        // Generate XLSX file as binary array
        const xlsxData = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

        // Add XLSX file to network folder
        networkFolder.file('export.xlsx', xlsxData);

        totalBanners += eligibleFiles.length;
        totalNetworks++;
      }
    }

    if (totalNetworks === 0) {
      alert('Žádné bannery k exportu.');
      return;
    }

    // Generate master ZIP and download
    const blob = await masterZip.generateAsync({ type: 'blob' });
    const safeCampaignName = campaignName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
    const filename = `${safeCampaignName}_all_networks_${Date.now()}.zip`;
    downloadBlob(blob, filename);

    alert(`✅ Všechny balíčky úspěšně vyexportovány!\n\nObsah:\n- ${totalNetworks} systémů\n- ${totalBanners} celkem bannerů\n\nKaždý systém má vlastní složku s bannery a export.xlsx souborem.`);
  } catch (error) {
    console.error('Export all error:', error);
    alert('Chyba při vytváření balíčku: ' + error.message);
  }
}

async function exportCSV() {
  if (appState.selectedNetworks.length === 0) {
    alert('Please select at least one network first');
    return;
  }

  // Build CSV content
  const headers = [
    'Network',
    'Tier',
    'Filename',
    'Dimensions',
    'Format',
    'Size (KB)',
    'Color Space',
    'Status',
    'Compatible Placements'
  ];

  const rows = [headers];

  for (const selection of appState.selectedNetworks) {
    const { network, tier } = selection;

    // Get compatible files for this network/tier
    for (const [fileName, validation] of Object.entries(appState.validationResults)) {
      const matches = validation.compatible.filter(c =>
        c.network === network && (tier === null || c.tier === tier)
      );

      if (matches.length > 0) {
        const fileData = validation.file;
        const placementNames = matches.map(m => m.spec.name).join('; ');

        rows.push([
          network,
          tier || 'N/A',
          fileData.name,
          fileData.dimensions,
          fileData.format.toUpperCase(),
          fileData.sizeKB,
          fileData.colorSpace,
          fileData.colorSpaceValid ? 'Valid' : 'Warning: CMYK',
          placementNames
        ]);
      }
    }
  }

  // Convert to CSV string
  const csvContent = rows.map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, 'banner-validation-report.csv');

  alert('CSV report generated! Check your downloads folder.');
}

/**
 * Helper function to download a blob
 * @param {Blob} blob - Blob to download
 * @param {string} filename - Filename
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Make functions globally accessible
window.handleStepClick = handleStepClick;
window.goToStep = goToStep;
window.removeFile = removeFile;
window.validateCompatibility = validateCompatibility;
window.showFileDetails = showFileDetails;
window.toggleNetworkSelection = toggleNetworkSelection;
window.updateBannerSelection = updateBannerSelection;
window.toggleExportPreview = toggleExportPreview;
window.toggleValidCreatives = toggleValidCreatives;
window.toggleNetworkErrors = toggleNetworkErrors;
window.updateCampaignTier = updateCampaignTier;
window.updateExportPreview = updateExportPreview;
window.updateBannerURL = updateBannerURL;
window.copyURL = copyURL;
window.displayExportSettings = displayExportSettings;
window.toggleHighTierSection = toggleHighTierSection;
window.exportNetworkZIP = exportNetworkZIP;
window.exportCSV = exportCSV;
