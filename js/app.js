// Main Application Controller for Creative Validator
// Handles state management, navigation, file upload, and workflow coordination

// =============================================================================
// GLOBAL STATE
// =============================================================================

const APP_VERSION = 'v1.5.19'; // Stats count now matches actual exportable files (HTML5/static, network filters)

// =============================================================================
// SECURITY HELPERS
// =============================================================================

/**
 * Escape HTML special characters to prevent XSS attacks
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for innerHTML
 */
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// =============================================================================
// DEBUG LOGGING
// =============================================================================

/**
 * Log processing state to console for debugging asset flow
 * @param {string} step - Step identifier (e.g., 'UPLOAD', 'TABLE_VALIDATION', 'NETWORK_STATS')
 * @param {Object} data - Data to log
 */
function logProcessDebug(step, data) {
  console.group(`📊 Process Debug: ${step}`);
  console.log(JSON.stringify(data, null, 2));
  console.groupEnd();
}

const appState = {
  currentStep: 1,
  uploadedFiles: [], // Array of analyzed file objects
  selectedNetworks: [], // [{ network: 'SOS', enabled: true }, ...]
  selectedCampaignTier: 'HIGH', // Campaign tier: 'HIGH' or 'LOW'
  validationResults: {}, // Compatibility matrix per file
  multiFileGroups: [], // Detected multi-file format groups
  networkStats: {}, // Per-network statistics: { ADFORM: { HIGH: {...}, LOW: {...} }, ... }
  // Campaign requirements (optional - step 2)
  campaignRequirements: [], // Parsed campaign table: [{ name, dimensions: [] }]
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

  // Display app version and link to GitHub release
  const versionElement = document.getElementById('appVersion');
  if (versionElement) {
    versionElement.textContent = APP_VERSION;
    versionElement.href = `https://github.com/kubachour/seznam-asset-checker/releases/tag/${APP_VERSION}`;
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
        // Accept images, HTML files, and ZIPs (use centralized constants)
        const fileType = getFileFormat(file);
        if (fileType === FILE_TYPES.TYPES.IMAGE ||
            fileType === FILE_TYPES.TYPES.HTML ||
            fileType === FILE_TYPES.TYPES.ZIP) {
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
  const zipFileInput = document.getElementById('zipFileInput');
  const selectFolderBtn = document.getElementById('selectFolderBtn');
  const selectFilesBtn = document.getElementById('selectFilesBtn');

  // Button click handlers - prevent event from bubbling to uploadZone
  if (selectFolderBtn) {
    selectFolderBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  if (selectFilesBtn) {
    selectFilesBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      zipFileInput.click();
    });
  }

  if (uploadZone) {
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

        // Wait for all directory/file reads to complete (using allSettled to handle partial failures)
        const results = await Promise.allSettled(promises);
        results.forEach(result => {
          if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            files.push(...result.value);
          } else if (result.status === 'rejected') {
            console.warn('Failed to read directory/file:', result.reason);
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

  // Folder input handler (webkitdirectory)
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const rawFiles = Array.from(e.target.files);
      if (rawFiles.length === 0) return;

      // Filter for image and ZIP files (accept attribute is ignored with webkitdirectory)
      const imageExtensions = /\.(jpg|jpeg|png|gif|webp|avif|zip)$/i;
      const files = rawFiles.filter(f => imageExtensions.test(f.name));

      // Preserve folder structure from webkitRelativePath for system detection
      files.forEach(file => {
        if (file.webkitRelativePath) {
          // Extract folder path (everything except the filename)
          const pathParts = file.webkitRelativePath.split('/');
          pathParts.pop(); // Remove filename
          file.folderPath = pathParts.join('/');
        }
      });

      if (files.length > 0) {
        await handleFileUpload(files);
      }

      // Reset input so same folder can be selected again
      e.target.value = '';
    });
  }

  // Individual files input handler (ZIP, images)
  if (zipFileInput) {
    zipFileInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      if (files.length > 0) {
        await handleFileUpload(files);
      }

      // Reset input so same files can be selected again
      e.target.value = '';
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

  // Step 5: Auto-update export previews when form fields change
  setupExportFormListeners();
}

/**
 * Simple debounce helper to avoid excessive updates while typing
 */
let exportPreviewTimeout = null;
function debouncedUpdateExportPreviews() {
  if (exportPreviewTimeout) {
    clearTimeout(exportPreviewTimeout);
  }
  exportPreviewTimeout = setTimeout(() => {
    updateAllExportPreviews();
  }, 300);
}

/**
 * Set up event listeners for export settings form fields
 * Automatically updates URL previews when user types
 */
function setupExportFormListeners() {
  const campaignNameInput = document.getElementById('campaignName');
  const landingURLInput = document.getElementById('landingURL');
  const utmContentInput = document.getElementById('utmContent');
  const contentVariantsInput = document.getElementById('contentVariantsList');

  if (campaignNameInput) {
    campaignNameInput.addEventListener('input', debouncedUpdateExportPreviews);
  }
  if (landingURLInput) {
    landingURLInput.addEventListener('input', debouncedUpdateExportPreviews);
  }
  if (utmContentInput) {
    utmContentInput.addEventListener('input', debouncedUpdateExportPreviews);
  }
  if (contentVariantsInput) {
    contentVariantsInput.addEventListener('input', debouncedUpdateExportPreviews);
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

  // Allow navigation: backward to any visited step OR forward one step
  if (stepNumber <= appState.currentStep || stepNumber === appState.currentStep + 1) {
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
  // Validation guards - prevent navigation without required data
  if (stepNumber === 2 && appState.uploadedFiles.length === 0) {
    alert('Nejprve nahrajte soubory v kroku 1');
    return;
  }

  if (stepNumber === 3 && Object.keys(appState.validationResults).length === 0) {
    alert('Nejprve spusťte validaci v kroku 2 (tlačítko "Zkontrolovat kompatibilitu")');
    return;
  }

  if (stepNumber === 4 && Object.keys(appState.networkStats).length === 0) {
    alert('Nejprve dokončete validaci v kroku 3');
    return;
  }

  if (stepNumber === 5) {
    // Check if networks are selected (campaign name is checked at export time, not navigation)
    const hasSelectedNetworks = appState.selectedNetworks.some(n => n.enabled);
    if (!hasSelectedNetworks) {
      alert('Nejprve vyberte alespoň jeden systém pro export v kroku 4');
      return;
    }
  }

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
    isZbozi,
    fileName = '',
    placement = ''
  } = params;

  // Normalize campaign and content names according to Seznam tagging rules
  const normalizedCampaign = normalizeUTMText(campaignName);
  const normalizedContent = normalizeUTMText(contentName);

  // Detect variant from filename (v1, v2, V1, V2, var1, var2, variant1, variant2)
  const variantMatch = fileName.match(/[_-](v\d+|var\d+|variant\d+)/i);
  const variant = variantMatch ? variantMatch[1].toLowerCase().replace('variant', 'var') : '';

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

      // utm_content: campaign-content_format[_placement][_variant]
      // utm_term: just format name (no placement)
      const formatName = normalizeUTMText(format);

      if (format === 'in-article') {
        utm_content = `${normalizedCampaign}-${normalizedContent}_${format}_${service}`;
        if (placement) utm_content += `_${normalizeUTMText(placement)}`;
        if (variant) utm_content += `_${variant}`;
        utm_term = format;
      } else {
        utm_content = `${normalizedCampaign}-${normalizedContent}_${formatName}`;
        if (placement) utm_content += `_${normalizeUTMText(placement)}`;
        if (variant) utm_content += `_${variant}`;
        utm_term = formatName;
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

      const formatName = normalizeUTMText(format);

      if (format === 'kombi') {
        utm_medium = 'kombi_selfpromo';
        utm_content = `${normalizedCampaign}-${normalizedContent}_kombi`;
        if (placement) utm_content += `_${normalizeUTMText(placement)}`;
        if (variant) utm_content += `_${variant}`;
        utm_term = 'kombi';
      } else if (format === 'banner') {
        if (tier === 'HIGH') {
          utm_medium = isAdform ? 'banner_selfpromo_high_adform' : 'banner_selfpromo_high';
        } else {
          utm_medium = isAdform ? 'banner_selfpromo_low_adform' : 'banner_selfpromo_low';
        }
        utm_content = `${normalizedCampaign}-${normalizedContent}_${formatName}`;
        if (placement) utm_content += `_${normalizeUTMText(placement)}`;
        if (variant) utm_content += `_${variant}`;
        utm_term = 'banner';
      } else if (format === 'video') {
        utm_medium = tier === 'HIGH' ? 'video_selfpromo_high' : 'video_selfpromo_low';
        utm_content = `${normalizedCampaign}-${normalizedContent}_${formatName}`;
        if (placement) utm_content += `_${normalizeUTMText(placement)}`;
        if (variant) utm_content += `_${variant}`;
        utm_term = 'video';
      }
    }

  } else if (network === 'SKLIK') {
    utm_source = 'seznam';

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
      utm_medium = 'cpc';

      // Determine format type: kombi vs banner
      const isKombi = format.includes('kombi') || format.includes('nativni');
      const formatType = isKombi ? 'kombi' : 'banner';
      const formatName = normalizeUTMText(format);

      // Build campaign name: display_{campaignName}_banner or display_{campaignName}_kombi
      utm_campaign = `display_${normalizedCampaign}_${formatType}`;

      // Build utm_content: format[_placement][_variant]
      utm_content = formatName;
      if (placement) utm_content += `_${normalizeUTMText(placement)}`;
      if (variant) utm_content += `_${variant}`;

      utm_term = '';
    }

  } else if (network === 'ADFORM' || network === 'HP_EXCLUSIVE') {
    // Set utm_source based on network
    // ADFORM routes through ONEGAR, so uses 'seznam_onegar' source
    utm_source = network === 'HP_EXCLUSIVE' ? 'homepage_exclusive' : 'seznam_onegar';

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

      const formatName = normalizeUTMText(format);
      utm_medium = tier === 'HIGH' ? 'banner_selfpromo_high_adform' : 'banner_selfpromo_low_adform';
      utm_content = `${normalizedCampaign}-${normalizedContent}_${formatName}`;
      if (placement) utm_content += `_${normalizeUTMText(placement)}`;
      if (variant) utm_content += `_${variant}`;
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

/**
 * Detect specific format from folder path (e.g., branding-scratcher, spincube, etc.)
 * This prevents files from different formats but same dimensions from being mixed
 * @param {string} folderPath - Full folder path
 * @returns {string|null} Detected format name or null
 */
function detectFormatFromPath(folderPath) {
  if (!folderPath) return null;

  const pathLower = folderPath.toLowerCase();

  // Define format patterns to detect (order matters - check more specific patterns first)
  const formatPatterns = [
    // HTML5 specific patterns (check before generic 'html5')
    { pattern: 'html5-adform', format: 'html5-adform' },
    { pattern: 'html5_adform', format: 'html5-adform' },
    { pattern: 'html5 adform', format: 'html5-adform' },
    { pattern: 'html5-sklik', format: 'html5-sklik' },
    { pattern: 'html5_sklik', format: 'html5-sklik' },
    { pattern: 'html5 sklik', format: 'html5-sklik' },
    { pattern: 'html5-self', format: 'html5-adform' },  // Self = Adform for HTML5 banners
    { pattern: 'html5_self', format: 'html5-adform' },  // Self = Adform for HTML5 banners
    { pattern: 'html5 self', format: 'html5-adform' },  // Self = Adform for HTML5 banners
    { pattern: 'html5-onegar', format: 'html5-onegar' },
    { pattern: 'html5_onegar', format: 'html5-onegar' },
    { pattern: 'html5 onegar', format: 'html5-onegar' },
    { pattern: 'html5', format: 'html5' },

    // UAC patterns
    { pattern: 'uac', format: 'uac' },

    // In-article patterns
    { pattern: 'in-article', format: 'in-article' },
    { pattern: 'in_article', format: 'in-article' },
    { pattern: 'inarticle', format: 'in-article' },
    { pattern: 'in article', format: 'in-article' },

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

    { pattern: 'vanocni', format: 'vanocni' },
    { pattern: 'vanoce', format: 'vanocni' },
    { pattern: 'vánoční', format: 'vanocni' },
    { pattern: 'vánoce', format: 'vanocni' },

    { pattern: 'obecna', format: 'obecna' },
    { pattern: 'obecná', format: 'obecna' }
  ];

  // Check each pattern
  for (const { pattern, format } of formatPatterns) {
    if (pathLower.includes(pattern)) {
      return format;
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
    let utmCampaign = columns[2] || ''; // Optional: utm_campaign
    let targetUrl = columns[3] || ''; // Optional: target URL

    // MERGED CELL HANDLING: Check if column[0] contains ONLY dimensions (no real name)
    // This happens when Excel paste doesn't preserve empty cells from merged rows
    const isDimensionOnly = /^\d+\s*[x×]\s*\d+$/i.test(name);

    if (isDimensionOnly) {
      // Column 0 contains a dimension, not a name - this is a continuation row
      console.log(`  Line ${i + 1}: Detected dimension-only row "${name}" - treating as continuation`);
      dimensionText = name;
      name = ''; // Clear name to trigger continuation logic
    }

    // Extract dimensions from text (supports formats like "300x250", "300 x 250", "300×250")
    const dimensionMatches = dimensionText.match(/(\d+)\s*[x×]\s*(\d+)/gi);
    const dimensions = dimensionMatches ? dimensionMatches.map(d => {
      const parts = d.match(/(\d+)\s*[x×]\s*(\d+)/i);
      // Ensure match was successful and has expected groups
      if (parts && parts[1] && parts[2]) {
        return `${parts[1]}x${parts[2]}`;
      }
      return null;
    }).filter(Boolean) : [];

    // If name exists and is not just a dimension, start new requirement
    if (name && !isDimensionOnly) {
      currentRequirement = {
        name: name,
        dimensions: dimensions
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

      console.log(`  Line ${i + 1}: New requirement "${name}" with ${dimensions.length} dimension(s), campaign: ${currentUtmCampaign || 'N/A'}`);
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
    }
  }

  console.log(`\n✅ Parsed ${requirements.length} requirements:`);
  requirements.forEach((req, idx) => {
    console.log(`  ${idx + 1}. "${req.name}": ${req.dimensions.length} dimensions [${req.dimensions.join(', ')}]`);
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
            </tr>
          </thead>
          <tbody>
    `;

    // Add table rows
    requirements.forEach((req, index) => {
      const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';
      const dimensions = req.dimensions.join(', ');

      tableHTML += `
        <tr style="background: ${bgColor};">
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${escapeHTML(req.name)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-family: 'Courier New', monospace; font-size: 13px;">${escapeHTML(dimensions)}</td>
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
    console.warn('Could not parse campaign table:', error.message);
    resultDiv.innerHTML = `<div style="color: #f59e0b; padding: 10px; background: #fef3c7; border-radius: 6px;">⚠️ Nepodařilo se zpracovat tabulku: ${error.message}</div>`;
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
  // Limit recursion depth to prevent infinite loops (allows up to 4 levels: 0, 1, 2, 3)
  const MAX_DEPTH = 3;
  if (depth > MAX_DEPTH) {
    console.warn(`Max ZIP nesting depth (${MAX_DEPTH}) reached at ${parentPath || 'root'}, skipping deeper extraction`);
    return [];
  }

  console.log(`Extracting ZIP at depth ${depth}, path: ${parentPath || 'root'}`);

  try {
    const zip = new JSZip();
    const contents = await zip.loadAsync(zipFile);
    const imageFiles = [];

    for (const [filename, zipEntry] of Object.entries(contents.files)) {
      // Skip directories and hidden files
      if (zipEntry.dir || filename.startsWith('__MACOSX') || filename.startsWith('.')) {
        if (zipEntry.dir) {
          console.log(`Skipping directory: ${filename}`);
        }
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
      // Check if it's a supported file (use centralized helper)
      else if (FileTypeHelpers.isSupportedExtension(extension)) {
        // Extract file as blob
        const blob = await zipEntry.async('blob');

        // Determine correct MIME type based on extension
        let mimeType = 'application/octet-stream';
        if (FileTypeHelpers.isImageExtension(extension)) {
          mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
        } else if (FileTypeHelpers.isHTMLExtension(extension)) {
          mimeType = 'text/html';
        }

        // Create a File object from the blob
        const file = new File([blob], baseName, { type: mimeType });

        // Store folder path for system detection
        file.folderPath = folderPath;

        imageFiles.push(file);
        console.log(`Extracted ${extension.toUpperCase()} file: ${baseName} from ${folderPath || 'root'}`);
      }
      else {
        // Skip unsupported files
        console.log(`Skipping unsupported file: ${filename}`);
      }
    }

    console.log(`Total images extracted at depth ${depth}: ${imageFiles.length}`);
    return imageFiles;
  } catch (error) {
    console.warn('Error extracting ZIP file:', error);
    return []; // Return empty array instead of throwing
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

    if (fileType === FILE_TYPES.TYPES.IMAGE) {
      filesToAnalyze.push(file);
    } else if (fileType === FILE_TYPES.TYPES.HTML) {
      // NEWLY ADDED: Process standalone HTML files
      filesToAnalyze.push(file);
      console.log(`Detected standalone HTML file: ${file.name}`);
    } else if (fileType === FILE_TYPES.TYPES.ZIP) {
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
          console.warn(`Failed to extract ${file.name}:`, error);
          // Continue processing other files instead of showing error to user
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

    // Detect assigned system and format from folder path for each file
    for (const fileData of analyzed) {
      const folderPath = fileData.file?.folderPath || '';
      fileData.assignedSystem = detectSystemFromPath(folderPath);
      fileData.assignedFormat = detectFormatFromPath(folderPath);
      fileData.folderPath = folderPath;

      // If folder detection didn't find a format, fall back to filename-based detection
      // This allows files like "Interscroller-720x1280.jpg" to be auto-assigned
      if (!fileData.assignedFormat && fileData.detectedFormat) {
        fileData.assignedFormat = fileData.detectedFormat;
      }
    }

    // Add to uploaded files (additive - don't replace existing)
    appState.uploadedFiles.push(...analyzed);

    // Debug: Log uploaded files with their assignments
    logProcessDebug('UPLOAD', {
      filesAdded: analyzed.length,
      files: analyzed.map(f => ({
        name: f.name,
        dimensions: f.dimensions,
        folderPath: f.folderPath,
        assignedSystem: f.assignedSystem,
        assignedFormat: f.assignedFormat,
        isHTML5: f.isHTML5 || false
      }))
    });
  }

  // Hide progress
  if (progressSection) {
    progressSection.style.display = 'none';
  }

  // Show uploaded files list
  displayUploadedFiles();

  // Enable analyze button (both top and bottom)
  const analyzeBtnTop = document.getElementById('analyzeBtnTop');
  if (appState.uploadedFiles.length > 0) {
    if (analyzeBtn) analyzeBtn.disabled = false;
    if (analyzeBtnTop) analyzeBtnTop.disabled = false;
  }
}

/**
 * Group files by their folder structure
 * @param {Array} files - Array of file objects
 * @returns {Object} Grouped files by folder path
 */
function groupFilesByFolder(files) {
  const grouped = {};

  files.forEach((file, index) => {
    const folderPath = file.folderPath || '';
    if (!grouped[folderPath]) {
      grouped[folderPath] = [];
    }
    grouped[folderPath].push({ file, index });
  });

  return grouped;
}

/**
 * Generate thumbnail HTML for a file
 * @param {Object} file - File object
 * @param {number} size - Thumbnail size in pixels (default: 40)
 * @returns {string} HTML string for thumbnail
 */
function generateThumbnailHTML(file, size = 40) {
  const iconSize = Math.floor(size / 2);
  const genericIconSize = Math.floor(size * 0.45);

  if (file.fileType === 'zip' || file.fileType === 'html5' || file.isHTML5) {
    // Show ZIP icon for ZIP and HTML5 files
    return `
      <div class="file-thumbnail-placeholder" style="width: ${size}px; height: ${size}px; background: #dbeafe; border-radius: 4px; border: 1px solid #93c5fd; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: ${iconSize}px;">🗜️</div>
    `;
  } else if (file.fileType === 'image' && file.preview) {
    // Show image thumbnail for images
    return `
      <img class="file-thumbnail" src="${file.preview}" alt="${file.name}"
        style="width: ${size}px; height: ${size}px; object-fit: cover; border-radius: 4px; border: 1px solid #e5e7eb; flex-shrink: 0;">
    `;
  } else {
    // Generic file icon for other files
    return `
      <div class="file-thumbnail-placeholder" style="width: ${size}px; height: ${size}px; background: #f3f4f6; border-radius: 4px; border: 1px solid #e5e7eb; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: ${genericIconSize}px;">📄</div>
    `;
  }
}

/**
 * Generate unified HTML for a file list item with thumbnail, name, dimensions, and optional metadata
 * @param {Object} file - File object with name, dimensions, sizeKB, folderPath, etc.
 * @param {Object} options - Display options
 * @param {string} options.borderColor - Border color (default: '#e5e7eb')
 * @param {string} options.bgColor - Background color (default: 'white')
 * @param {number} options.thumbnailSize - Thumbnail size in pixels (default: 50)
 * @param {Array} options.warnings - Array of warning messages to display
 * @param {string} options.additionalInfo - Additional info/error message to display
 * @param {string} options.additionalInfoColor - Color for additional info (default: '#ef4444')
 * @returns {string} HTML for a file list item
 */
function generateFileItemHTML(file, options = {}) {
  const {
    borderColor = '#e5e7eb',
    bgColor = 'white',
    thumbnailSize = 50,
    warnings = [],
    additionalInfo = '',
    additionalInfoColor = '#ef4444'
  } = options;

  const hasWarnings = warnings && warnings.length > 0;

  return `
    <li style="margin-bottom: 8px; display: flex; align-items: center; gap: 10px; padding: 8px; background: ${bgColor}; border-radius: 6px; border: 1px solid ${borderColor};">
      ${generateThumbnailHTML(file, thumbnailSize)}
      <div style="flex: 1;">
        <div><strong>${escapeHTML(file.name)}</strong></div>
        <div style="font-size: 12px; color: #6b7280;">${escapeHTML(file.dimensions)} • ${escapeHTML(String(file.sizeKB))}KB</div>
        ${file.folderPath ? `<div style="font-size: 11px; color: #6b7280; font-family: monospace;">📁 ${escapeHTML(file.folderPath)}</div>` : ''}
        ${additionalInfo ? `<div style="font-size: 12px; color: ${additionalInfoColor};">⚠️ ${escapeHTML(additionalInfo)}</div>` : ''}
        ${hasWarnings ? `
          <div style="margin-top: 6px; padding: 6px; background: #fef3c7; border-radius: 4px; border: 1px solid #fcd34d;">
            <div style="font-size: 11px; font-weight: 600; color: #92400e; margin-bottom: 3px;">⚠️ Porušení zásad (může projít interními systémy):</div>
            <ul style="margin: 0; padding-left: 16px; font-size: 11px; color: #78350f;">
              ${warnings.map(w => `<li style="margin: 2px 0;">${escapeHTML(w)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    </li>
  `;
}

function displayUploadedFiles() {
  const uploadedFilesSection = document.getElementById('uploadedFiles');
  if (!uploadedFilesSection) return;

  if (appState.uploadedFiles.length === 0) {
    uploadedFilesSection.innerHTML = '';
    return;
  }

  // Group files by folder
  const groupedFiles = groupFilesByFolder(appState.uploadedFiles);
  const sortedFolders = Object.keys(groupedFiles).sort();

  // Separate root files from folder files
  const rootFiles = groupedFiles[''] || [];
  const folderPaths = sortedFolders.filter(path => path !== '');

  let foldersHTML = '';

  // Display files organized by folders
  if (folderPaths.length > 0) {
    foldersHTML = folderPaths.map(folderPath => {
      const filesInFolder = groupedFiles[folderPath];
      const folderName = folderPath.split('/').pop() || folderPath;

      return `
        <div class="folder-group" style="margin-bottom: 15px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div class="folder-header" style="background: #f9fafb; padding: 10px 15px; border-bottom: 1px solid #e5e7eb; cursor: pointer; display: flex; align-items: center; gap: 8px; user-select: none;" onclick="toggleFolder(this)">
            <span class="folder-toggle">▼</span>
            <span style="font-size: 18px;">📁</span>
            <strong>${escapeHTML(folderName)}</strong>
            <span style="color: #6b7280; font-size: 0.9em;">(${filesInFolder.length} files)</span>
            <span style="color: #9ca3af; font-size: 0.85em; margin-left: auto; font-family: monospace;">${escapeHTML(folderPath)}</span>
          </div>
          <ul class="folder-files" style="list-style: none; padding: 0; margin: 0;">
            ${filesInFolder.map(({ file, index }) => {
              const thumbnailHTML = generateThumbnailHTML(file);

              const isZIP = file.name.toLowerCase().endsWith('.zip') ||
                            file.fileType === 'html5' ||
                            file.isHTML5;
              // Escape file name for use in onclick attribute (prevent injection)
              const safeFileName = escapeHTML(file.name).replace(/'/g, "\\'");
              return `
                <li class="uploaded-file-item" style="padding: 10px 15px; border-bottom: 1px solid #f3f4f6; background: white;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                      ${thumbnailHTML}
                      <div class="file-info" style="flex: 1;">
                        <div>
                          <strong class="file-name">${escapeHTML(file.name)}</strong>
                          ${file.dimensions ? `<span class="file-dimensions" style="color: #6b7280; margin-left: 10px;">${escapeHTML(file.dimensions)}</span>` : ''}
                          <span class="file-size" style="color: #6b7280; margin-left: 10px;">${escapeHTML(String(file.sizeKB))} KB</span>
                          ${file.fileType === 'image' && !file.colorSpaceValid ? '<span class="file-warning" style="color: #ef4444; margin-left: 10px;">⚠️ CMYK</span>' : ''}
                        </div>
                        ${isZIP ? `
                          <button class="btn-link" onclick="toggleZIPContents('${safeFileName}', ${index})" style="background: none; border: none; color: #3b82f6; cursor: pointer; padding: 4px 0; margin-top: 4px; font-size: 13px;">
                            <span id="zip-toggle-${index}">▶ Zobrazit obsah</span>
                          </button>
                        ` : ''}
                      </div>
                    </div>
                    <button class="remove-file-btn" onclick="removeFile(${index})" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; flex-shrink: 0;">✕</button>
                  </div>
                  ${isZIP ? `<div id="zip-contents-${index}" style="display: none;"></div>` : ''}
                </li>
              `;
            }).join('')}
          </ul>
        </div>
      `;
    }).join('');
  }

  // Display root files (files not in any folder)
  let rootFilesHTML = '';
  if (rootFiles.length > 0) {
    rootFilesHTML = `
      <div class="root-files" style="margin-bottom: 15px;">
        <h4 style="margin-bottom: 10px; color: #6b7280;">Root Files (${rootFiles.length})</h4>
        <ul class="uploaded-files-list" style="list-style: none; padding: 0; margin: 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          ${rootFiles.map(({ file, index }) => {
            const thumbnailHTML = generateThumbnailHTML(file);
            const isZIP = file.name.toLowerCase().endsWith('.zip') ||
                          file.fileType === 'html5' ||
                          file.isHTML5;
            // Escape file name for use in onclick attribute (prevent injection)
            const safeFileName = escapeHTML(file.name).replace(/'/g, "\\'");

            return `
              <li class="uploaded-file-item" style="padding: 10px; border-bottom: 1px solid #f3f4f6;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                    ${thumbnailHTML}
                    <div class="file-info" style="flex: 1;">
                      <div>
                        <strong class="file-name">${escapeHTML(file.name)}</strong>
                        ${file.dimensions ? `<span class="file-dimensions" style="color: #6b7280; margin-left: 10px;">${escapeHTML(file.dimensions)}</span>` : ''}
                        <span class="file-size" style="color: #6b7280; margin-left: 10px;">${escapeHTML(String(file.sizeKB))} KB</span>
                        ${file.fileType === 'image' && !file.colorSpaceValid ? '<span class="file-warning" style="color: #ef4444; margin-left: 10px;">⚠️ CMYK</span>' : ''}
                      </div>
                      ${isZIP ? `
                        <button class="btn-link" onclick="toggleZIPContents('${safeFileName}', ${index})" style="background: none; border: none; color: #3b82f6; cursor: pointer; padding: 4px 0; margin-top: 4px; font-size: 13px;">
                          <span id="zip-toggle-${index}">▶ Zobrazit obsah</span>
                        </button>
                      ` : ''}
                    </div>
                  </div>
                  <button class="remove-file-btn" onclick="removeFile(${index})" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; flex-shrink: 0;">✕</button>
                </div>
                ${isZIP ? `<div id="zip-contents-${index}" style="display: none;"></div>` : ''}
              </li>
            `;
          }).join('')}
        </ul>
      </div>
    `;
  }

  const html = `
    <div class="uploaded-files-container" style="margin-top: 20px;">
      <h3>Uploaded Files (${appState.uploadedFiles.length})</h3>
      ${rootFilesHTML}
      ${foldersHTML}
    </div>
  `;

  uploadedFilesSection.innerHTML = html;
}

/**
 * Toggle folder visibility
 * @param {HTMLElement} header - Folder header element
 */
function toggleFolder(header) {
  const folderGroup = header.parentElement;
  const filesList = folderGroup.querySelector('.folder-files');
  const toggle = header.querySelector('.folder-toggle');

  if (filesList.style.display === 'none') {
    filesList.style.display = 'block';
    toggle.textContent = '▼';
  } else {
    filesList.style.display = 'none';
    toggle.textContent = '▶';
  }
}

function removeFile(index) {
  appState.uploadedFiles.splice(index, 1);
  displayUploadedFiles();

  // Disable analyze button (both top and bottom) when no files
  const analyzeBtn = document.getElementById('analyzeBtn');
  const analyzeBtnTop = document.getElementById('analyzeBtnTop');
  if (appState.uploadedFiles.length === 0) {
    if (analyzeBtn) analyzeBtn.disabled = true;
    if (analyzeBtnTop) analyzeBtnTop.disabled = true;
  }
}

/**
 * Get file icon based on extension
 * @param {string} filename - File name
 * @returns {string} Icon emoji
 */
function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(ext)) return '🖼️';
  if (ext === 'html') return '📄';
  if (ext === 'css') return '🎨';
  if (ext === 'js') return '⚙️';
  if (ext === 'zip') return '🗜️';
  if (ext === 'json') return '📋';
  if (ext === 'txt') return '📝';
  return '📁';
}

/**
 * Toggle ZIP file contents visibility
 * @param {string} fileName - Name of the ZIP file
 * @param {number} fileIndex - Index in uploadedFiles array
 */
async function toggleZIPContents(fileName, fileIndex) {
  const contentsDiv = document.getElementById(`zip-contents-${fileIndex}`);
  const toggleSpan = document.getElementById(`zip-toggle-${fileIndex}`);

  if (!contentsDiv || !toggleSpan) return;

  if (contentsDiv.style.display === 'none' || !contentsDiv.style.display) {
    // Load ZIP contents
    try {
      const file = appState.uploadedFiles[fileIndex];
      if (!file || !file.file) {
        console.error('File not found in uploadedFiles');
        return;
      }

      toggleSpan.textContent = '⏳ Načítání...';

      const zip = new JSZip();
      const contents = await zip.loadAsync(file.file);

      let html = '<div style="margin-top: 10px; padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">';
      html += '<div style="font-weight: 600; margin-bottom: 8px; color: #374151;">Obsah ZIP souboru:</div>';
      html += '<ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #4b5563;">';

      let fileCount = 0;
      for (const [filename, entry] of Object.entries(contents.files)) {
        if (entry.dir) continue;
        fileCount++;
        const size = entry._data.uncompressedSize;
        const icon = getFileIcon(filename);
        html += `<li style="margin: 4px 0;">${icon} ${filename} <span style="color: #9ca3af;">(${(size/1024).toFixed(1)} KB)</span></li>`;
      }
      html += '</ul>';
      html += `<div style="margin-top: 8px; font-size: 12px; color: #6b7280;">Celkem: ${fileCount} souborů</div>`;
      html += '</div>';

      contentsDiv.innerHTML = html;
      contentsDiv.style.display = 'block';
      toggleSpan.textContent = '▼ Skrýt obsah';
    } catch (error) {
      console.warn('Could not read ZIP file contents:', error.message);
      contentsDiv.innerHTML = '<div style="color: #f59e0b; padding: 10px;">Nelze přečíst obsah ZIP souboru</div>';
      contentsDiv.style.display = 'block';
      toggleSpan.textContent = '▼ Skrýt';
    }
  } else {
    contentsDiv.style.display = 'none';
    toggleSpan.textContent = '▶ Zobrazit obsah';
  }
}

// =============================================================================
// FILE ANALYSIS & VALIDATION
// =============================================================================

/**
 * Build membership map for multi-file format groups
 * Identifies which files are "active" (needed) vs "excess" (extra)
 * @param {Array} multiFileGroups - Detected multi-file format groups
 * @returns {Map} fileName -> { isInGroup, isActive, isExcess, format, groupIndex }
 */
function buildMultiFileGroupMembership(multiFileGroups) {
  const membership = new Map();

  multiFileGroups.forEach((group, groupIndex) => {
    const requiredCount = group.requiredCount || group.fileCount;

    group.files.forEach((file, fileIndex) => {
      const fileName = file.name;
      const isActive = fileIndex < requiredCount; // First N files are active

      membership.set(fileName, {
        isInGroup: true,
        isActive: isActive,
        isExcess: !isActive,
        format: group.format,
        groupIndex: groupIndex,
        complete: group.complete
      });
    });
  });

  return membership;
}

async function validateCompatibility() {
  if (appState.uploadedFiles.length === 0) {
    alert('Please upload files first');
    return;
  }

  // Detect multi-file formats
  appState.multiFileGroups = detectMultiFileFormats(appState.uploadedFiles);

  // Build membership map to track which files are active vs excess
  const groupMembership = buildMultiFileGroupMembership(appState.multiFileGroups);

  // If campaign table exists, extract required dimensions for filtering
  const requiredDimensions = new Set();
  if (appState.campaignRequirements && appState.campaignRequirements.length > 0) {
    for (const requirement of appState.campaignRequirements) {
      for (const dimension of requirement.dimensions) {
        requiredDimensions.add(dimension);
      }
    }
    console.log('Campaign table filter active. Only validating dimensions:', Array.from(requiredDimensions));
  }

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

    // Check if this file is excess in a multi-file format
    if (fileData.detectedFormat) {
      const membership = groupMembership.get(fileData.name);
      if (membership && membership.isExcess) {
        // File is beyond required count for its format group
        // Skip validation entirely - don't show as compatible
        appState.validationResults[fileData.name] = {
          file: fileData,
          compatible: [],
          incompatible: [],
          isExcess: true
        };
        continue;
      }
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
          // If campaign table exists, only validate dimensions that are in the requirements
          if (requiredDimensions.size > 0 && fileData.dimensions && !requiredDimensions.has(fileData.dimensions)) {
            continue; // Skip this file - dimensions not in campaign table
          }

          const validation = validateFileForFormat(fileData, match.spec);

          // Size violations are warnings, not blocking errors - only check validation.valid
          if (validation.valid) {
            compatible.push({
              network: network,
              tier: tier,
              format: match.specKey,
              formatDisplay: match.formatDisplay,
              spec: match.spec,
              warnings: validation.warnings || [] // Includes size warnings if present
            });
          } else {
            // Only add to incompatible if format is allowed for this system
            incompatible.push({
              network: network,
              tier: tier,
              format: match.specKey,
              formatDisplay: match.formatDisplay,
              reason: validation.issues.join(', ')
            });
          }
        }
      }
    }

    // Check HP EXCLUSIVE (no tier) - only if format is allowed
    if (!fileData.detectedFormat || isFormatAllowedForSystem(fileData.detectedFormat, 'HP_EXCLUSIVE')) {
      const exclusiveMatches = findMatchingFormats(fileData, 'HP_EXCLUSIVE', null);
      for (const match of exclusiveMatches) {
        // If campaign table exists, only validate dimensions that are in the requirements
        if (requiredDimensions.size > 0 && fileData.dimensions && !requiredDimensions.has(fileData.dimensions)) {
          continue; // Skip this file - dimensions not in campaign table
        }

        const validation = validateFileForFormat(fileData, match.spec);

        // Size violations are warnings, not blocking errors - only check validation.valid
        if (validation.valid) {
          compatible.push({
            network: 'HP_EXCLUSIVE',
            tier: null,
            format: match.specKey,
            formatDisplay: match.formatDisplay,
            spec: match.spec,
            warnings: validation.warnings || []
          });
        } else {
          incompatible.push({
            network: 'HP_EXCLUSIVE',
            tier: null,
            format: match.specKey,
            formatDisplay: match.formatDisplay,
            reason: validation.issues.join(', ')
          });
        }
      }
    }

    // Check GOOGLE_ADS (no tier) - only if format is allowed
    if (!fileData.detectedFormat || isFormatAllowedForSystem(fileData.detectedFormat, 'GOOGLE_ADS')) {
      const googleAdsMatches = findMatchingFormats(fileData, 'GOOGLE_ADS', null);
      for (const match of googleAdsMatches) {
        // If campaign table exists, only validate dimensions that are in the requirements
        if (requiredDimensions.size > 0 && fileData.dimensions && !requiredDimensions.has(fileData.dimensions)) {
          continue; // Skip this file - dimensions not in campaign table
        }

        const validation = validateFileForFormat(fileData, match.spec);

        // Size violations are warnings, not blocking errors - only check validation.valid
        if (validation.valid) {
          compatible.push({
            network: 'GOOGLE_ADS',
            tier: null,
            format: match.specKey,
            formatDisplay: match.formatDisplay,
            spec: match.spec,
            warnings: validation.warnings || []
          });
        } else {
          incompatible.push({
            network: 'GOOGLE_ADS',
            tier: null,
            format: match.specKey,
            formatDisplay: match.formatDisplay,
            reason: validation.issues.join(', ')
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
      console.info(`ℹ️  ${fileName}: ${validation.compatible.length} compatible, ${validation.incompatible.length} incompatible placements`);
    }
  }
  console.log(`✅ Total compatible placements: ${totalCompatible}`);
  console.log(`ℹ️ Total incompatible placements: ${totalIncompatible}`);
  console.groupEnd();

  // IMPORTANT: Run campaign table validation BEFORE calculating network stats
  // This ensures stats are filtered by campaign table requirements
  if (appState.campaignRequirements.length > 0) {
    validateAgainstCampaignTable();
  }

  // Calculate network stats (now with campaign table filtering applied if available)
  calculateNetworkStats();

  // Log detailed incompatible placements to console (informational, not errors)
  if (totalIncompatible > 0) {
    // Collect all incompatible files from networkStats
    const allIncompatibleFiles = [];
    for (const [network, tiers] of Object.entries(appState.networkStats)) {
      for (const [tier, stats] of Object.entries(tiers)) {
        if (stats.errorFiles && stats.errorFiles.length > 0) {
          allIncompatibleFiles.push(...stats.errorFiles);
        }
      }
    }

    // Group by filename
    const incompatibleByFile = {};
    for (const info of allIncompatibleFiles) {
      if (!incompatibleByFile[info.file]) {
        incompatibleByFile[info.file] = [];
      }
      incompatibleByFile[info.file].push({
        reason: info.reason,
        tier: info.tier,
        format: info.format,
        network: info.network
      });
    }

    // Log incompatible placements as info (these are validation results, not code errors)
    console.group('ℹ️ Incompatible Placements (informational)');
    for (const [file, issues] of Object.entries(incompatibleByFile)) {
      console.group(`📄 ${file}`);
      for (let idx = 0; idx < issues.length; idx++) {
        const issue = issues[idx];
        const tierLabel = issue.tier ? ` [${issue.tier} tier]` : '';
        const formatLabel = issue.format ? ` (${issue.format})` : '';
        console.info(`  ${idx + 1}${tierLabel}${formatLabel}: ${issue.reason}`);
      }
      console.groupEnd();
    }
    console.groupEnd();
  }

  // Check if campaign table exists - display and navigate
  if (appState.campaignRequirements.length > 0) {
    // Show Step 2: Table validation (validation already done above)
    displayTableValidation();
    goToStep(2);
  } else {
    // Skip to Step 3: System validation
    displayNetworkToggles();
    goToStep(3);
  }
}

/**
 * Convert requirement name to format key for matching
 * @param {string} name - Requirement name (e.g., "Branding Scratcher")
 * @returns {string} Format key (e.g., "branding-scratcher")
 */
function requirementNameToFormatKey(name) {
  if (!name) return null;
  // Normalize: lowercase, replace spaces with hyphens
  return name.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Find available files that could be assigned to a missing dimension
 * @param {string} dimension - The missing dimension (e.g., "2000x1400")
 * @param {string} requirementName - The requirement we want to assign to
 * @returns {Array} - Files that match the dimension but are assigned elsewhere
 */
function findFilesForMissingDimension(dimension, requirementName) {
  const targetFormatKey = requirementNameToFormatKey(requirementName);
  const reqNameLower = (requirementName || '').toLowerCase();

  // Detect if requirement is HTML5-only (e.g., "HTML5 bannery")
  const isHTML5Requirement = reqNameLower.includes('html5');

  // Format keywords for filtering - file from specific format folder should only show for matching requirements
  const formatKeywords = [
    { format: 'uac', reqKeywords: ['uac'] },
    { format: 'in-article', reqKeywords: ['in-article', 'inarticle'] },
    { format: 'inarticle', reqKeywords: ['in-article', 'inarticle'] },
    { format: 'kombi', reqKeywords: ['kombi', 'kombinovaná', 'kombinovana'] },
    { format: 'interscroller', reqKeywords: ['interscroller'] },
    { format: 'mobilni-interscroller', reqKeywords: ['interscroller', 'mobilni'] },
    { format: 'spinner', reqKeywords: ['spinner'] },
    { format: 'spincube', reqKeywords: ['spincube'] },
    { format: 'branding-scratcher', reqKeywords: ['branding', 'scratcher'] },
    { format: 'branding-uncover', reqKeywords: ['branding', 'uncover'] },
    { format: 'branding-videopanel', reqKeywords: ['branding', 'videopanel'] },
    { format: 'exclusive-desktop', reqKeywords: ['exclusive'] },
    { format: 'html5', reqKeywords: ['html5'] },
    { format: 'html5-banner', reqKeywords: ['html5'] },
    { format: 'html5-adform', reqKeywords: ['html5', 'adform'] },
    { format: 'html5-sklik', reqKeywords: ['html5', 'sklik'] },
    { format: 'html5-adform', reqKeywords: ['html5', 'self'] },  // Self = Adform for HTML5 banners
    { format: 'html5-onegar', reqKeywords: ['html5', 'onegar'] }
  ];

  return appState.uploadedFiles.filter(f => {
    // Must match the dimension
    if (f.dimensions !== dimension) return false;

    // Skip if already assigned to this requirement
    if (f.assignedFormat === targetFormatKey) return false;

    // If HTML5 requirement, only show HTML5 files
    if (isHTML5Requirement && !f.isHTML5) return false;

    // If file is from a specific format folder, only show for matching requirements
    if (f.assignedFormat) {
      const fileFormat = f.assignedFormat.toLowerCase();

      for (const { format, reqKeywords } of formatKeywords) {
        if (fileFormat.includes(format) || format.includes(fileFormat)) {
          // File is from this format folder - check if requirement matches
          const reqMatches = reqKeywords.some(kw => reqNameLower.includes(kw));
          if (!reqMatches) return false; // Don't show UAC file for Kombi, etc.
        }
      }
    }

    return true;
  });
}

/**
 * Assign a file to a specific requirement format
 * Called when user clicks "Přiřadit" button for a missing dimension
 */
function assignFileToRequirement(fileName, requirementName) {
  const file = appState.uploadedFiles.find(f => f.name === fileName);
  if (!file) return;

  file.assignedFormat = requirementNameToFormatKey(requirementName);

  // Re-validate and update display
  validateAgainstCampaignTable();
  displayTableValidation();
}

/**
 * Build HTML for available files that can be assigned to a missing dimension
 */
function buildAssignableFilesHTML(dimension, requirementName) {
  const availableFiles = findFilesForMissingDimension(dimension, requirementName);

  if (availableFiles.length === 0) return '';

  const filesHTML = availableFiles.map(file => {
    const escapedName = file.name.replace(/'/g, "\\'");
    const escapedReqName = requirementName.replace(/'/g, "\\'");
    const folderInfo = file.folderPath ? `<span style="color: #6b7280; font-size: 11px;"> (${file.folderPath})</span>` : '';

    return `
      <li style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: white; border-radius: 6px; border: 1px solid #fde68a; margin-bottom: 6px;">
        ${file.preview ? `<img src="${file.preview}" class="assignment-thumbnail">` : ''}
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 500; color: #1f2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${file.name}${folderInfo}</div>
          <div style="font-size: 11px; color: #6b7280;">${file.sizeKB}KB${file.assignedFormat ? ` • aktuálně: ${file.assignedFormat}` : ''}</div>
        </div>
        <button onclick="assignFileToRequirement('${escapedName}', '${escapedReqName}')"
          style="background: #f59e0b; color: white; border: none; padding: 5px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap;">
          Přiřadit
        </button>
      </li>
    `;
  }).join('');

  return `
    <div style="margin-top: 12px; padding: 12px; background: #fef3c7; border-radius: 6px; border: 1px solid #fde68a;">
      <div style="font-weight: 600; color: #92400e; margin-bottom: 8px;">💡 Dostupné soubory k přiřazení (${dimension}):</div>
      <ul style="margin: 0; padding: 0; list-style: none;">
        ${filesHTML}
      </ul>
    </div>
  `;
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

    // Convert requirement name to format key for matching
    const requirementFormatKey = requirementNameToFormatKey(requirement.name);

    // Check each dimension in requirement
    for (const dimension of requirement.dimensions) {
      // Filter by dimension AND format type (HTML5 vs static) AND assignedFormat
      const matchingFiles = appState.uploadedFiles.filter(f => {
        if (f.dimensions !== dimension) return false;

        // If requirement is HTML5-only, accept only HTML5 files
        if (requirement.isHTML5 && !f.isHTML5) return false;

        // If requirement is static-only, accept only non-HTML5 files
        if (requirement.isStatic && f.isHTML5) return false;

        // SYSTEM-BASED MATCH: If file is assigned to a system (from folder name),
        // and requirement name contains that system, it's a match
        // E.g., file in "HTML5-Adform-V1" folder → assigned to ADFORM → matches "HTML5 bannery Adform" requirement
        if (f.assignedSystem) {
          const systemLower = f.assignedSystem.toLowerCase();
          const reqNameLower = (requirement.name || '').toLowerCase();
          if (reqNameLower.includes(systemLower)) {
            return true; // System match - file belongs to this requirement
          }
          // Self = Adform for HTML5 banners: files assigned to ADFORM should also match "Self" requirements
          if (systemLower === 'adform' && reqNameLower.includes('self')) {
            return true;
          }
          // And vice versa: files in Self folders should match Adform requirements
          if (f.assignedFormat && f.assignedFormat.toLowerCase().includes('html5-adform') && reqNameLower.includes('self')) {
            return true;
          }
        }

        // CRITICAL FIX: If file has assignedFormat, it must match the requirement
        // This prevents files from "Branding uncover" appearing in "Branding Scratcher" section
        if (f.assignedFormat) {
          // Check if file's format matches requirement's format
          // Allow match if requirement name contains the format key or vice versa
          const reqNameLower = (requirement.name || '').toLowerCase();
          const fileFormat = f.assignedFormat.toLowerCase();

          // Direct match or contains match
          // Also handle Self = Adform equivalence for HTML5 banners
          const isSelfAdformMatch = (fileFormat.includes('html5-adform') && reqNameLower.includes('self')) ||
                                    (fileFormat.includes('html5-adform') && reqNameLower.includes('adform'));
          const formatMatches = reqNameLower.includes(fileFormat.replace(/-/g, ' ')) ||
                               reqNameLower.includes(fileFormat) ||
                               fileFormat.includes(reqNameLower.replace(/\s+/g, '-')) ||
                               requirementFormatKey === fileFormat ||
                               isSelfAdformMatch;

          if (!formatMatches) {
            return false; // File belongs to a different format
          }
        } else {
          // FIX for cross-contamination: For files without assignedFormat,
          // check folder path to prevent wrong category assignments
          const folderPath = (f.folderPath || '').toLowerCase();
          const reqNameLower = (requirement.name || '').toLowerCase();

          // If file is from HTML5 folder but requirement is for static, reject
          if (folderPath.includes('html5') && !requirement.isHTML5) return false;

          // If file is from a specific format folder, require matching requirement
          const folderFormatKeywords = [
            { folder: 'spinner', reqKeywords: ['spinner'] },
            { folder: 'spincube', reqKeywords: ['spincube', 'spin cube', 'spin-cube'] },
            { folder: 'spin-cube', reqKeywords: ['spincube', 'spin cube', 'spin-cube'] },
            { folder: 'in-article', reqKeywords: ['in-article', 'inarticle', 'in article'] },
            { folder: 'inarticle', reqKeywords: ['in-article', 'inarticle', 'in article'] },
            { folder: 'in article', reqKeywords: ['in-article', 'inarticle', 'in article'] },
            { folder: 'uac', reqKeywords: ['uac', 'google ads', 'google_ads', 'gads'] },
            { folder: 'kombi', reqKeywords: ['kombi'] },
            { folder: 'scratcher', reqKeywords: ['scratcher'] },
            { folder: 'uncover', reqKeywords: ['uncover'] }
          ];

          for (const { folder, reqKeywords } of folderFormatKeywords) {
            if (folderPath.includes(folder)) {
              // File is from this format's folder - check if requirement matches
              const reqMatchesFolder = reqKeywords.some(kw => reqNameLower.includes(kw));
              if (!reqMatchesFolder) {
                return false; // File from format folder doesn't match requirement
              }
              break; // Found matching folder, no need to check others
            }
          }
        }

        return true;
      });

      if (matchingFiles.length > 0) {
        // Found files with this dimension
        for (const file of matchingFiles) {
          const fileResult = {
            file: file,
            dimension: dimension
          };

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

  // Debug: Log table validation results
  logProcessDebug('TABLE_VALIDATION', {
    requirementsCount: appState.campaignRequirements.length,
    requirements: results.map(r => ({
      name: r.requirement.name,
      isHTML5: r.requirement.isHTML5 || false,
      isStatic: r.requirement.isStatic || false,
      dimensionsRequired: r.requirement.dimensions,
      foundFiles: r.found.map(f => ({
        name: f.file.name,
        dimension: f.dimension,
        assignedFormat: f.file.assignedFormat,
        folderPath: f.file.folderPath
      })),
      missingDimensions: r.missing
    })),
    extraFilesCount: extraFiles.length
  });
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

    let borderColor = '#10b981'; // green
    let bgColor = '#f0fdf4';

    if (hasMissing) {
      borderColor = '#fb923c'; // orange
      bgColor = '#fff7ed';
    }

    html += `
      <div style="border: 2px solid ${borderColor}; border-radius: 12px; padding: 20px; background: ${bgColor};">
        <h3 style="font-size: 18px; font-weight: 700; margin: 0 0 12px 0; color: #1f2937;">
          ${req.name}
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
              ${result.found.map(f => generateFileItemHTML(f.file, {
                borderColor: '#bbf7d0',
                bgColor: 'white'
              })).join('')}
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
            ${result.missing.map(dim => buildAssignableFilesHTML(dim, req.name)).join('')}
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
          ${extraFiles.map(file => generateFileItemHTML(file, {
            borderColor: '#bfdbfe',
            bgColor: 'white'
          })).join('')}
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

  // Build map of file → matched campaign table requirement (for format type filtering)
  // This ensures stats only count files that match their requirement's format type (HTML5/static)
  const fileRequirementMap = new Map(); // fileName -> { requirementName, isHTML5, isStatic }
  if (appState.tableValidation && appState.tableValidation.results) {
    for (const result of appState.tableValidation.results) {
      const req = result.requirement;
      for (const found of result.found) {
        fileRequirementMap.set(found.file.name, {
          requirementName: req.name,
          isHTML5: req.isHTML5 || false,
          isStatic: req.isStatic || false
        });
      }
    }
    console.log('Campaign table active: files matched to requirements:', fileRequirementMap.size);
  }

  // Count eligible assets and errors per network per tier
  for (const [fileName, validation] of Object.entries(appState.validationResults)) {
    const file = validation.file;

    // If campaign table exists, only count files that are matched to requirements
    if (fileRequirementMap.size > 0 && !fileRequirementMap.has(fileName)) {
      continue; // Skip files not matched to campaign table requirements
    }

    // CAMPAIGN TABLE FORMAT FILTER: Check HTML5/static requirement match
    if (fileRequirementMap.size > 0) {
      const reqInfo = fileRequirementMap.get(fileName);
      if (reqInfo) {
        // If requirement is HTML5-only, skip static files
        if (reqInfo.isHTML5 && !file.isHTML5) {
          continue;
        }
        // If requirement is static-only, skip HTML5 files
        if (reqInfo.isStatic && file.isHTML5) {
          continue;
        }
      }
    }

    // Rich media formats filter - SOS only
    if (file.assignedFormat) {
      const fileFormat = file.assignedFormat.toLowerCase();
      const sosOnlyFormats = ['spincube', 'spinner', 'branding-scratcher', 'branding-uncover', 'branding-videopanel', 'branding'];
      const isRichMediaFormat = sosOnlyFormats.some(f => fileFormat.includes(f) || fileFormat === f);
      // Rich media files are only valid for SOS - skip counting for other networks handled below
    }

    const fileCompatibleNetworks = new Set();

    // Track which networks have at least one compatible placement for this file
    for (const comp of validation.compatible) {
      const tier = comp.tier || 'NONE';
      const network = comp.network;

      // Skip rich media formats on non-SOS networks
      if (file.assignedFormat) {
        const fileFormat = file.assignedFormat.toLowerCase();
        const sosOnlyFormats = ['spincube', 'spinner', 'branding-scratcher', 'branding-uncover', 'branding-videopanel', 'branding'];
        const isRichMediaFormat = sosOnlyFormats.some(f => fileFormat.includes(f) || fileFormat === f);
        if (isRichMediaFormat && network !== 'SOS') {
          continue;
        }
      }

      // Skip if file is assigned to a different network
      if (file.assignedSystem && file.assignedSystem !== network) {
        continue;
      }

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

  // Debug: Log network stats summary
  logProcessDebug('NETWORK_STATS', {
    networks: Object.entries(appState.networkStats).map(([network, tiers]) => ({
      network,
      tiers: Object.entries(tiers).map(([tier, stats]) => ({
        tier,
        eligibleAssets: stats.eligibleAssets,
        eligiblePlacements: stats.eligiblePlacements,
        errors: stats.errors
      }))
    }))
  });
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
              <span>${stats.network.replace('_', ' ')}</span>
            </div>

            <div class="network-stats-summary" style="font-size: 18px; color: #1f2937; margin-bottom: 12px;">
              <span class="valid-assets-count" style="display: inline-flex; align-items: center; gap: 5px;">
                <span class="valid-icon" style="font-size: 20px;">✓</span>
                <span class="valid-count" style="font-weight: 700; color: #10b981;">${stats.eligibleAssets} validních assetů</span>
              </span>
              <span class="placements-count" style="color: #6b7280;"> (${stats.totalPlacements} formátů)</span>
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

    // Skip GOOGLE_ADS from export selection - it's validation-only
    if (network === 'GOOGLE_ADS') {
      continue;
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
    const showTierSelector = !hasHPExclusive;

    html += `
      <div class="network-selection-card" id="network-card-${stats.network}" style="border: 2px solid #10b981; border-radius: 12px; padding: 20px; background: #f0fdf4; transition: all 0.2s;">
        <label class="network-checkbox-label" style="display: flex; align-items: center; gap: 15px; cursor: pointer;">
          <input class="network-checkbox" type="checkbox" id="select_${stats.network}"
            checked
            onchange="toggleNetworkSelection('${stats.network}')"
            style="width: 24px; height: 24px; cursor: pointer; accent-color: #10b981;">
          <div class="network-info" style="flex: 1;">
            <div class="network-name" style="font-weight: 700; font-size: 20px; color: #1f2937;">
              <span>${stats.network.replace('_', ' ')}</span>
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
  // Build membership map from appState.multiFileGroups to track which files belong to multi-file formats
  const groupMembership = new Map(); // fileName -> groupInfo
  if (appState.multiFileGroups) {
    for (const group of appState.multiFileGroups) {
      if (group.network === network) {
        for (const file of group.files) {
          groupMembership.set(file.name, {
            format: group.format,
            folderPath: group.folderPath,
            groupSize: group.files.length,
            complete: group.complete,
            requiredCount: group.requiredCount
          });
        }
      }
    }
  }

  // Build map of file → matched campaign table requirement (for format type filtering)
  // This ensures files only appear in placements that match their campaign table requirement
  const fileRequirementMap = new Map(); // fileName -> { requirement, isHTML5, isStatic }
  if (appState.tableValidation && appState.tableValidation.results) {
    for (const result of appState.tableValidation.results) {
      const req = result.requirement;
      for (const found of result.found) {
        fileRequirementMap.set(found.file.name, {
          requirementName: req.name,
          isHTML5: req.isHTML5 || false,
          isStatic: req.isStatic || false
        });
      }
    }
  }

  // Group files by format (placement)
  const formatGroups = new Map(); // formatKey -> { spec, files[] }
  const processedFiles = new Set(); // Track which files we've added

  for (const [fileName, validation] of Object.entries(appState.validationResults)) {
    const matches = validation.compatible.filter(c => c.network === network);
    if (matches.length === 0) continue;

    const file = validation.file;

    // Check if file is part of a multi-file group
    const groupInfo = groupMembership.get(fileName);

    // Skip files that are part of INCOMPLETE multi-file groups
    if (groupInfo && !groupInfo.complete) {
      continue;
    }

    // FIX: Filter files by assigned system and format to prevent cross-contamination
    // If file is explicitly assigned to a DIFFERENT network, skip it
    if (file.assignedSystem && file.assignedSystem !== network) {
      continue;
    }

    // CAMPAIGN TABLE FORMAT FILTER: If file was matched to a campaign table requirement,
    // ensure the file's format (HTML5/static) matches what the requirement expects
    if (fileRequirementMap.size > 0) {
      const reqInfo = fileRequirementMap.get(fileName);
      if (reqInfo) {
        // If requirement is HTML5-only, skip static files
        if (reqInfo.isHTML5 && !file.isHTML5) {
          continue;
        }
        // If requirement is static-only, skip HTML5 files
        if (reqInfo.isStatic && file.isHTML5) {
          continue;
        }
      } else {
        // File is not matched to any campaign table requirement - skip it
        continue;
      }
    }

    // If file has a specific format type assigned, handle rich media vs standard banners
    if (file.assignedFormat) {
      const fileFormat = file.assignedFormat.toLowerCase();

      // Rich media formats are SOS-only - they should not appear on other networks
      const sosOnlyFormats = ['spincube', 'spinner', 'branding-scratcher', 'branding-uncover', 'branding-videopanel', 'branding'];
      const isRichMediaFormat = sosOnlyFormats.some(f => fileFormat.includes(f) || fileFormat === f);

      if (isRichMediaFormat && network !== 'SOS') {
        continue;
      }
    }

    // Add file to each matching format
    for (const match of matches) {
      const formatKey = match.format;
      const spec = match.spec;

      if (!formatGroups.has(formatKey)) {
        formatGroups.set(formatKey, {
          formatKey,
          spec,
          files: [],
          multiFileGroup: null
        });
      }

      const fileInfo = {
        fileName,
        file,
        isAssigned: file.assignedSystem === network,
        multiFileGroup: groupInfo
      };

      // For multi-file formats, store the group info at format level
      if (groupInfo) {
        formatGroups.get(formatKey).multiFileGroup = groupInfo;
      }

      // Avoid duplicates (same file in same format)
      const formatFileKey = `${formatKey}_${fileName}`;
      if (!processedFiles.has(formatFileKey)) {
        formatGroups.get(formatKey).files.push(fileInfo);
        processedFiles.add(formatFileKey);
      }
    }
  }

  if (formatGroups.size === 0) {
    return '<p style="color: #6b7280;">Žádné bannery k exportu</p>';
  }

  // Sort formats: multi-file formats first (branding, spincube, spinner), then by name
  const sortedFormats = Array.from(formatGroups.values()).sort((a, b) => {
    const richMediaOrder = ['branding', 'branding-scratcher', 'branding-uncover', 'branding-videopanel', 'branding-sklik', 'interscroller', 'mobilni-interscroller', 'spincube', 'spinner', 'inarticle', 'nativni-inzerat', 'exclusive'];
    const orderA = richMediaOrder.findIndex(rm => a.formatKey.includes(rm));
    const orderB = richMediaOrder.findIndex(rm => b.formatKey.includes(rm));

    if (orderA !== -1 && orderB !== -1) return orderA - orderB;
    if (orderA !== -1) return -1;
    if (orderB !== -1) return 1;

    return a.spec.name.localeCompare(b.spec.name);
  });

  let html = '';

  for (const formatGroup of sortedFormats) {
    const { formatKey, spec, files, multiFileGroup } = formatGroup;
    const fileCount = files.length;

    // Sort files: assigned first, then by folder, then filename
    files.sort((a, b) => {
      if (a.isAssigned !== b.isAssigned) return a.isAssigned ? -1 : 1;
      const folderA = a.file.folderPath || '';
      const folderB = b.file.folderPath || '';
      if (folderA !== folderB) return folderA.localeCompare(folderB);
      return a.fileName.localeCompare(b.fileName);
    });

    // Format dimensions display
    const dimensionsText = spec.dimensions.join(', ');
    const maxSizeText = spec.maxSize ? `max ${spec.maxSize}KB` : '';

    // Determine if this is a multi-file format
    const isMultiFile = multiFileGroup !== null;
    const borderColor = isMultiFile ? '#3b82f6' : '#10b981';
    const bgColor = isMultiFile ? '#eff6ff' : '#f0fdf4';
    const headerBgColor = isMultiFile ? '#dbeafe' : '#dcfce7';

    // Build format header
    const formatId = `exportFormat_${network}_${formatKey}`.replace(/[^a-zA-Z0-9_]/g, '_');

    // SINGLE FILE: Show thumbnail directly in header, no toggle needed
    if (fileCount === 1 && !isMultiFile) {
      const singleFile = files[0];
      const checkboxId = `banner_${network}_${singleFile.fileName.replace(/[^a-zA-Z0-9]/g, '_')}`;

      html += `
        <div style="margin-bottom: 12px; border: 1px solid ${borderColor}; border-radius: 8px; overflow: hidden;">
          <div style="display: flex; align-items: center; gap: 10px; padding: 12px; background: ${headerBgColor};">
            <input type="checkbox" id="${checkboxId}" checked
              onchange="updateBannerSelection('${network}', '${singleFile.fileName}')"
              style="width: 18px; height: 18px; cursor: pointer; accent-color: ${borderColor}; flex-shrink: 0;">
            ${generateThumbnailHTML(singleFile.file, 50)}
            <div style="flex: 1;">
              <div style="font-weight: 600; color: #1f2937; font-size: 14px;">${spec.name}</div>
              <div style="font-size: 12px; color: #374151;">${singleFile.fileName}</div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
                ${dimensionsText} • ${singleFile.file.sizeKB}KB${maxSizeText ? ' / ' + maxSizeText : ''}
              </div>
              ${singleFile.file.folderPath ? `<div style="font-size: 11px; color: #9ca3af; margin-top: 2px;">📁 ${singleFile.file.folderPath}</div>` : ''}
            </div>
          </div>
        </div>
      `;
      continue;
    }

    // MULTIPLE FILES: Show toggle with file list
    const assignedCount = files.filter(f => f.isAssigned).length;

    html += `
      <div style="margin-bottom: 12px; border: 1px solid ${borderColor}; border-radius: 8px; overflow: hidden;">
        <div style="display: flex; align-items: center; gap: 10px; padding: 12px; background: ${headerBgColor};">
          <input type="checkbox" id="${formatId}_checkbox" checked
            onclick="event.stopPropagation(); toggleFormatSelection('${network}', '${formatKey}')"
            style="width: 18px; height: 18px; cursor: pointer; accent-color: ${borderColor}; flex-shrink: 0;">
          <span id="${formatId}_icon" onclick="toggleExportFormatDetails('${formatId}')" style="font-size: 12px; color: #6b7280; cursor: pointer;">▶</span>
          <div style="flex: 1; cursor: pointer;" onclick="toggleExportFormatDetails('${formatId}')">
            <div style="font-weight: 600; color: #1f2937; font-size: 14px;">
              ${isMultiFile ? '🔗 ' : ''}${spec.name}
            </div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">
              ${dimensionsText}${maxSizeText ? ' • ' + maxSizeText : ''}
              ${isMultiFile ? ` • ${multiFileGroup.groupSize}/${multiFileGroup.requiredCount} souborů` : ''}
              ${assignedCount > 0 ? ` • 📂 ${assignedCount} přiřazených` : ''}
            </div>
          </div>
          <div style="font-weight: 700; color: ${borderColor}; font-size: 14px;">${fileCount}</div>
        </div>
        <div id="${formatId}_details" style="display: none; padding: 12px; background: ${bgColor};">
          <ul style="margin: 0; padding-left: 0; list-style: none;">
    `;

    for (const fileInfo of files) {
      const checkboxId = `banner_${network}_${fileInfo.fileName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const assignedBadge = fileInfo.isAssigned
        ? '<span style="background: #059669; color: white; font-size: 10px; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">přiřazeno</span>'
        : '';

      html += `
        <li style="margin-bottom: 8px; display: flex; align-items: center; gap: 10px; padding: 8px; background: white; border-radius: 6px; border: 1px solid ${fileInfo.isAssigned ? '#bbf7d0' : '#e5e7eb'};">
          <input type="checkbox" id="${checkboxId}" checked onchange="updateBannerSelection('${network}', '${fileInfo.fileName}')" style="width: 18px; height: 18px; cursor: pointer; accent-color: #10b981; flex-shrink: 0;">
          ${generateThumbnailHTML(fileInfo.file, 60)}
          <label for="${checkboxId}" style="cursor: pointer; flex: 1;">
            <div><strong>${fileInfo.fileName}</strong> <span style="color: #6b7280; font-size: 12px;">(${fileInfo.file.dimensions})</span>${assignedBadge}</div>
            ${fileInfo.file.folderPath ? `<div style="font-size: 11px; color: #9ca3af; font-family: monospace; margin-top: 2px;">📁 ${fileInfo.file.folderPath}</div>` : ''}
          </label>
        </li>`;
    }

    html += `
          </ul>
        </div>
      </div>
    `;
  }

  return html;
}

/**
 * Toggle export format details visibility in Step 4
 */
function toggleExportFormatDetails(formatId) {
  const details = document.getElementById(`${formatId}_details`);
  const icon = document.getElementById(`${formatId}_icon`);

  if (!details) return;

  const isVisible = details.style.display !== 'none';

  if (isVisible) {
    details.style.display = 'none';
    if (icon) icon.textContent = '▶';
  } else {
    details.style.display = 'block';
    if (icon) icon.textContent = '▼';
  }
}

/**
 * Toggle all file checkboxes within a format group
 * @param {string} network - Network name (e.g., 'ADFORM', 'SKLIK')
 * @param {string} formatKey - Format key (e.g., 'mobilni-square', 'kombi')
 */
function toggleFormatSelection(network, formatKey) {
  const formatId = `exportFormat_${network}_${formatKey}`.replace(/[^a-zA-Z0-9_]/g, '_');
  const formatCheckbox = document.getElementById(`${formatId}_checkbox`);
  const detailsContainer = document.getElementById(`${formatId}_details`);

  if (!formatCheckbox || !detailsContainer) return;

  const isChecked = formatCheckbox.checked;

  // Find all file checkboxes within this format's details section
  const fileCheckboxes = detailsContainer.querySelectorAll('input[type="checkbox"]');

  // Toggle all file checkboxes to match the format checkbox state
  fileCheckboxes.forEach(checkbox => {
    if (checkbox.checked !== isChecked) {
      checkbox.checked = isChecked;
      // Trigger the onchange handler to update banner selection state
      const fileName = checkbox.id.replace(`banner_${network}_`, '').replace(/_/g, '.');
      // The actual filename needs reconstruction - find it from the label
      const label = checkbox.nextElementSibling?.nextElementSibling;
      if (label) {
        const strongEl = label.querySelector('strong');
        if (strongEl) {
          updateBannerSelection(network, strongEl.textContent);
        }
      }
    }
  });
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

/**
 * Sort files by Format → Folder → Filename
 * Prioritizes rich media formats first
 */
function sortFilesByFormatFolderName(files) {
  return files.sort((a, b) => {
    // 1. Sort by format type (prioritize rich media)
    const formatA = a.file.detectedFormat || 'standard';
    const formatB = b.file.detectedFormat || 'standard';

    // Rich media formats first (ordered by importance)
    const richMediaOrder = [
      'branding', 'branding-scratcher', 'branding-uncover', 'branding-videopanel',
      'spinner', 'spincube', 'exclusive', 'interscroller', 'inarticle', 'kombi',
      'branding-sklik', 'mobilni-interscroller'
    ];

    const orderA = richMediaOrder.indexOf(formatA);
    const orderB = richMediaOrder.indexOf(formatB);

    // If both are rich media, sort by their order in the list
    if (orderA !== -1 && orderB !== -1) {
      return orderA - orderB;
    }

    // Rich media comes before standard
    if (orderA !== -1 && orderB === -1) return -1;
    if (orderA === -1 && orderB !== -1) return 1;

    // 2. Sort by folder path
    const folderA = a.file.folderPath || '';
    const folderB = b.file.folderPath || '';
    if (folderA !== folderB) {
      return folderA.localeCompare(folderB);
    }

    // 3. Sort by filename
    return a.fileName.localeCompare(b.fileName);
  });
}

function buildValidDetails(network) {
  console.group(`buildValidDetails(${network})`);
  console.log('validationResults entries:', Object.keys(appState.validationResults).length);

  // Build membership map from appState.multiFileGroups to track which files belong to multi-file formats
  const groupMembership = new Map(); // fileName -> groupInfo
  if (appState.multiFileGroups) {
    for (const group of appState.multiFileGroups) {
      if (group.network === network) {
        for (const file of group.files) {
          groupMembership.set(file.name, {
            format: group.format,
            folderPath: group.folderPath,
            groupSize: group.files.length,
            complete: group.complete,
            requiredCount: group.requiredCount
          });
        }
      }
    }
  }

  // Group files by placement (format key)
  const placementGroups = new Map(); // formatKey -> { spec, files[] }
  const processedFiles = new Set(); // Track which files we've added

  // Build set of campaign table matched files (same filter as calculateNetworkStats)
  const campaignMatchedFiles = new Set();
  if (appState.tableValidation && appState.tableValidation.results) {
    for (const result of appState.tableValidation.results) {
      for (const found of result.found) {
        campaignMatchedFiles.add(found.file.name);
      }
    }
  }

  for (const [fileName, validation] of Object.entries(appState.validationResults)) {
    // If campaign table exists, only show files matched to requirements
    if (campaignMatchedFiles.size > 0 && !campaignMatchedFiles.has(fileName)) {
      continue;
    }

    const matches = validation.compatible.filter(c => c.network === network);
    if (matches.length === 0) continue;

    const file = validation.file;

    // Check if file is part of a multi-file group
    const groupInfo = groupMembership.get(fileName);

    // Skip files that are part of INCOMPLETE multi-file groups
    if (groupInfo && !groupInfo.complete) {
      continue;
    }

    // FIX: Filter files by assigned system and format to prevent cross-contamination
    // If file is explicitly assigned to a DIFFERENT network, skip it
    if (file.assignedSystem && file.assignedSystem !== network) {
      continue;
    }

    // If file has a specific format type assigned, handle rich media vs standard banners
    if (file.assignedFormat) {
      const fileFormat = file.assignedFormat.toLowerCase();

      // Rich media formats are SOS-only - they should not appear on other networks
      // These have matching dimensions with standard banners but are distinct creative types
      const sosOnlyFormats = ['spincube', 'spinner', 'branding-scratcher', 'branding-uncover', 'branding-videopanel', 'branding'];
      const isRichMediaFormat = sosOnlyFormats.some(f => fileFormat.includes(f) || fileFormat === f);

      if (isRichMediaFormat && network !== 'SOS') {
        // Skip rich media files on non-SOS networks
        // These shouldn't be shown as standard banners even if dimensions match
        console.log(`Skipping ${fileName}: rich media format '${fileFormat}' on non-SOS network`);
        continue;
      }

      // For non-rich-media formats (standard banners), allow them through
      // The dimension matching has already happened via the 'matches' array
      // No need for additional format name matching - dimensions are sufficient
    }

    // Log accepted file
    console.log(`Accepting ${fileName}: ${matches.length} format(s) for ${network}`);

    // Collect all warnings from matching placements
    const allWarnings = [];
    for (const match of matches) {
      if (match.warnings && match.warnings.length > 0) {
        allWarnings.push(...match.warnings);
      }
    }
    const uniqueWarnings = [...new Set(allWarnings)];

    // Add file to each matching placement
    for (const match of matches) {
      const formatKey = match.format;
      const spec = match.spec;

      if (!placementGroups.has(formatKey)) {
        placementGroups.set(formatKey, {
          formatKey,
          spec,
          files: [],
          multiFileGroup: null
        });
      }

      const fileInfo = {
        fileName,
        file,
        warnings: uniqueWarnings,
        multiFileGroup: groupInfo
      };

      // For multi-file formats, store the group info at placement level
      if (groupInfo) {
        placementGroups.get(formatKey).multiFileGroup = groupInfo;
      }

      // Avoid duplicates (same file in same placement)
      const placementFileKey = `${formatKey}_${fileName}`;
      if (!processedFiles.has(placementFileKey)) {
        placementGroups.get(formatKey).files.push(fileInfo);
        processedFiles.add(placementFileKey);
      }
    }
  }

  console.log(`placementGroups size: ${placementGroups.size}`);
  console.groupEnd();

  if (placementGroups.size === 0) {
    return '<p style="color: #6b7280;">Žádné validní bannery</p>';
  }

  // Sort placements: multi-file formats first (branding, spincube, spinner), then by name
  const sortedPlacements = Array.from(placementGroups.values()).sort((a, b) => {
    const richMediaOrder = ['branding', 'branding-scratcher', 'branding-uncover', 'branding-videopanel', 'branding-sklik', 'interscroller', 'mobilni-interscroller', 'spincube', 'spinner', 'inarticle', 'nativni-inzerat', 'exclusive'];
    const orderA = richMediaOrder.findIndex(rm => a.formatKey.includes(rm));
    const orderB = richMediaOrder.findIndex(rm => b.formatKey.includes(rm));

    if (orderA !== -1 && orderB !== -1) return orderA - orderB;
    if (orderA !== -1) return -1;
    if (orderB !== -1) return 1;

    return a.spec.name.localeCompare(b.spec.name);
  });

  let html = '';

  for (const placement of sortedPlacements) {
    const { formatKey, spec, files, multiFileGroup } = placement;
    const fileCount = files.length;

    // Format dimensions display
    const dimensionsText = spec.dimensions.join(', ');
    const maxSizeText = spec.maxSize ? `max ${spec.maxSize}KB` : '';

    // Determine if this is a multi-file format
    const isMultiFile = multiFileGroup !== null;
    const borderColor = isMultiFile ? '#3b82f6' : '#10b981';
    const bgColor = isMultiFile ? '#eff6ff' : '#f0fdf4';
    const headerBgColor = isMultiFile ? '#dbeafe' : '#dcfce7';

    // Build placement header
    const placementId = `placement_${network}_${formatKey}`.replace(/[^a-zA-Z0-9_]/g, '_');

    // Sort files by folder then filename
    files.sort((a, b) => {
      const folderA = a.file.folderPath || '';
      const folderB = b.file.folderPath || '';
      if (folderA !== folderB) return folderA.localeCompare(folderB);
      return a.fileName.localeCompare(b.fileName);
    });

    // Single file: show preview inline, no toggle needed
    if (fileCount === 1 && !isMultiFile) {
      const singleFile = files[0];
      const hasWarnings = singleFile.warnings && singleFile.warnings.length > 0;
      const fileBorderColor = hasWarnings ? '#fb923c' : borderColor;
      const fileBgColor = hasWarnings ? '#fff7ed' : headerBgColor;

      html += `
        <div style="margin-bottom: 12px; border: 1px solid ${fileBorderColor}; border-radius: 8px; overflow: hidden;">
          <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: ${fileBgColor};">
            ${generateThumbnailHTML(singleFile.file, 50)}
            <div style="flex: 1; min-width: 0;">
              <div style="font-weight: 600; color: #1f2937; font-size: 14px;">${escapeHTML(spec.name)}</div>
              <div style="font-size: 12px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHTML(singleFile.file.name)}">${escapeHTML(singleFile.file.name)}</div>
              <div style="font-size: 11px; color: #6b7280;">${dimensionsText} • ${singleFile.file.sizeKB}KB${maxSizeText ? ' / ' + maxSizeText : ''}</div>
              ${hasWarnings ? `<div style="font-size: 11px; color: #f59e0b; margin-top: 2px;">⚠ ${escapeHTML(singleFile.warnings.join(', '))}</div>` : ''}
            </div>
          </div>
        </div>
      `;
    } else {
      // Multiple files: keep expandable toggle
      html += `
        <div style="margin-bottom: 12px; border: 1px solid ${borderColor}; border-radius: 8px; overflow: hidden;">
          <div onclick="togglePlacementDetails('${placementId}')" style="display: flex; align-items: center; gap: 10px; padding: 12px; background: ${headerBgColor}; cursor: pointer; user-select: none;">
            <span id="${placementId}_icon" style="font-size: 12px; color: #6b7280;">▶</span>
            <div style="flex: 1;">
              <div style="font-weight: 600; color: #1f2937; font-size: 14px;">
                ${isMultiFile ? '🔗 ' : ''}${spec.name}
              </div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">
                ${dimensionsText}${maxSizeText ? ' • ' + maxSizeText : ''}
                ${isMultiFile ? ` • ${multiFileGroup.groupSize}/${multiFileGroup.requiredCount} souborů` : ''}
              </div>
            </div>
            <div style="font-weight: 700; color: ${borderColor}; font-size: 14px;">${fileCount}</div>
          </div>
          <div id="${placementId}_details" style="display: none; padding: 12px; background: ${bgColor};">
            <ul style="margin: 0; padding-left: 0; list-style: none;">
      `;

      for (const fileInfo of files) {
        const hasWarnings = fileInfo.warnings && fileInfo.warnings.length > 0;
        html += generateFileItemHTML(fileInfo.file, {
          borderColor: hasWarnings ? '#fb923c' : '#bbf7d0',
          bgColor: hasWarnings ? '#fff7ed' : 'white',
          thumbnailSize: 60,
          warnings: fileInfo.warnings
        });
      }

      html += `
            </ul>
          </div>
        </div>
      `;
    }
  }

  return html;
}

/**
 * Toggle placement details visibility
 */
function togglePlacementDetails(placementId) {
  const details = document.getElementById(`${placementId}_details`);
  const icon = document.getElementById(`${placementId}_icon`);

  if (!details) return;

  const isVisible = details.style.display !== 'none';

  if (isVisible) {
    details.style.display = 'none';
    if (icon) icon.textContent = '▶';
  } else {
    details.style.display = 'block';
    if (icon) icon.textContent = '▼';
  }
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

  // NOTE: Console logging moved to validateCompatibility() to avoid duplicate logs

  let html = '<ul style="margin: 0; padding-left: 0; list-style: none;">';
  for (const [fileName, errors] of Object.entries(errorsByFile)) {
    // Look up the file object from validationResults
    const validation = appState.validationResults[fileName];
    const fileObj = validation ? validation.file : null;

    if (fileObj) {
      // Build error message string
      const uniqueReasons = [...new Set(errors.map(e => e.reason))];
      const errorMessages = uniqueReasons.map(reason => {
        const tiersWithError = errors.filter(e => e.reason === reason).map(e => e.tier).filter(Boolean);
        const tierLabel = tiersWithError.length > 0 ? ` [${tiersWithError.join(', ')}]` : '';
        return `• ${reason}${tierLabel}`;
      });

      // Use generateFileItemHTML with red border and error messages
      html += generateFileItemHTML(fileObj, {
        borderColor: '#fca5a5',
        bgColor: '#fee2e2',
        thumbnailSize: 60,
        additionalInfo: errorMessages.join('\n')
      });
    } else {
      // Fallback if file object not found
      html += `<li style="margin-bottom: 8px;"><strong>${fileName}</strong><br/>`;
      const uniqueReasons = [...new Set(errors.map(e => e.reason))];
      uniqueReasons.forEach((reason, idx) => {
        const tiersWithError = errors.filter(e => e.reason === reason).map(e => e.tier).filter(Boolean);
        const tierLabel = tiersWithError.length > 0 ? ` <span style="font-size: 11px; color: #6b7280;">[${tiersWithError.join(', ')}]</span>` : '';
        html += `<span style="color: #991b1b; font-size: 12px; display: block; margin-top: ${idx > 0 ? '4px' : '2px'};">• ${reason}${tierLabel}</span>`;
      });
      html += '</li>';
    }
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
        enabled: true,
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
 * Update all export previews with current settings
 * Called when user changes campaign settings in Step 5
 */
function updateAllExportPreviews() {
  // Save current form values to appState
  appState.campaignName = document.getElementById('campaignName')?.value || '';
  appState.landingURL = document.getElementById('landingURL')?.value || '';
  appState.contentName = document.getElementById('utmContent')?.value || '';

  // Update Zbozi state
  const zboziToggle = document.getElementById('zboziToggle')?.checked || false;
  appState.isZboziCampaign = zboziToggle;

  // Refresh export settings display
  displayExportSettings();

  console.log('Export previews updated');
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
    console.warn('Clipboard access denied:', err.message);
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
    console.warn('Export failed:', error.message);
    alert('Nepodařilo se vytvořit balíček: ' + error.message);
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
    console.warn('Export all networks failed:', error.message);
    alert('Nepodařilo se vytvořit balíček: ' + error.message);
  }
}

/**
 * Export consolidated XLSX with all networks in single sheet
 */
async function exportAllNetworksConsolidatedXLSX() {
  try {
    const campaignName = appState.campaignName || 'campaign';
    const contentName = appState.contentName || 'content';
    const landingURL = appState.landingURL || '';
    const isZbozi = appState.isZboziCampaign || false;

    // Build all rows
    const allRows = [];

    // Header row
    allRows.push([
      'Síť', 'Tier', 'Kampaň', 'Obsah', 'Formát', 'Rozměr', 'Stopáž',
      'Služba', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
      'Landing page', 'Ukotvení', 'Název banneru', 'Finální URL'
    ]);

    let totalRows = 0;

    // Iterate through all selected networks
    for (const selection of appState.selectedNetworks) {
      if (!selection.enabled) continue;

      const network = selection.network;
      const tiers = selection.tiers || ['LOW'];

      for (const tier of tiers) {
        // Get valid files for this network/tier
        const eligibleFiles = [];

        for (const [fileName, validation] of Object.entries(appState.validationResults)) {
          const matchingPlacement = validation.compatible.find(c =>
            c.network === network && c.tier === tier
          );

          if (matchingPlacement && validation.file) {
            eligibleFiles.push({
              fileName: fileName,
              file: validation.file,
              placement: matchingPlacement
            });
          }
        }

        // Generate rows for each file
        for (const fileInfo of eligibleFiles) {
          const file = fileInfo.file;
          const dimensions = file.dimensions || '';
          const format = getFormatDisplayName(dimensions, fileInfo.placement.format);

          // Get service selection for this file (if available in export state)
          const service = 'hp'; // Default - would need to get from UI state in real implementation

          // Generate final URL
          const finalURL = generateBannerURL({
            network: network,
            tier: tier,
            campaignName: campaignName,
            contentName: contentName,
            landingURL: landingURL,
            dimensions: dimensions,
            format: format,
            service: service,
            anchor: '',
            isZbozi: isZbozi,
            fileName: file.fileName || '',
            placement: ''
          });

          // Parse URL to extract UTM params
          let utm_source = '', utm_medium = '', utm_campaign = '', utm_content = '';
          try {
            const urlObj = new URL(finalURL);
            utm_source = urlObj.searchParams.get('utm_source') || '';
            utm_medium = urlObj.searchParams.get('utm_medium') || '';
            utm_campaign = urlObj.searchParams.get('utm_campaign') || '';
            utm_content = urlObj.searchParams.get('utm_content') || '';
          } catch (e) {
            console.warn('Failed to parse URL:', finalURL);
          }

          allRows.push([
            network,
            tier,
            campaignName,
            contentName,
            format,
            dimensions,
            '', // Stopáž (duration) - empty for static banners
            service,
            utm_source,
            utm_medium,
            utm_campaign,
            utm_content,
            landingURL,
            '', // Ukotvení (anchor) - empty by default
            file.fileName || file.name,
            finalURL
          ]);

          totalRows++;
        }
      }
    }

    if (totalRows === 0) {
      alert('Žádné bannery k exportu.');
      return;
    }

    // Create XLSX using SheetJS library
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(allRows);

    // Set column widths for better readability
    const colWidths = [
      { wch: 12 }, // Síť
      { wch: 8 },  // Tier
      { wch: 20 }, // Kampaň
      { wch: 15 }, // Obsah
      { wch: 15 }, // Formát
      { wch: 12 }, // Rozměr
      { wch: 10 }, // Stopáž
      { wch: 10 }, // Služba
      { wch: 18 }, // utm_source
      { wch: 25 }, // utm_medium
      { wch: 30 }, // utm_campaign
      { wch: 35 }, // utm_content
      { wch: 30 }, // Landing page
      { wch: 15 }, // Ukotvení
      { wch: 30 }, // Název banneru
      { wch: 60 }  // Finální URL
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'All Networks');

    // Download
    const safeCampaignName = campaignName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
    const filename = `${safeCampaignName}_all_networks_consolidated.xlsx`;
    XLSX.writeFile(wb, filename);

    alert(`✅ Konsolidovaný XLSX úspěšně vyexportován!\n\nObsah:\n- ${allRows.length - 1} řádků dat (+ hlavička)\n- Všechny systémy v jednom souboru`);
  } catch (error) {
    console.warn('Consolidated XLSX export failed:', error.message);
    alert('Nepodařilo se vytvořit konsolidovaný XLSX: ' + error.message);
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
window.updateAllExportPreviews = updateAllExportPreviews;
window.exportNetworkZIP = exportNetworkZIP;
window.exportAllNetworksConsolidatedXLSX = exportAllNetworksConsolidatedXLSX;
window.exportCSV = exportCSV;
window.toggleZIPContents = toggleZIPContents;
window.toggleFolder = toggleFolder;
window.togglePlacementDetails = togglePlacementDetails;
window.toggleExportFormatDetails = toggleExportFormatDetails;
window.toggleFormatSelection = toggleFormatSelection;
