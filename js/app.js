// Main Application Controller for Creative Validator
// Handles state management, navigation, file upload, and workflow coordination

// =============================================================================
// GLOBAL STATE
// =============================================================================

const appState = {
  currentStep: 1,
  uploadedFiles: [], // Array of analyzed file objects
  selectedNetworks: [], // [{ network: 'SOS', enabled: true }, ...]
  selectedCampaignTier: 'HIGH', // Campaign tier: 'HIGH' or 'LOW'
  validationResults: {}, // Compatibility matrix per file
  multiFileGroups: [], // Detected multi-file format groups
  networkStats: {}, // Per-network statistics: { ADFORM: { HIGH: {...}, LOW: {...} }, ... }
  // Export settings (step 3)
  campaignName: '',
  contentName: '',
  landingURL: '',
  isZboziCampaign: false
};

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('Creative Validator initialized');

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
        for (let i = 0; i < items.length; i++) {
          if (items[i].kind === 'file') {
            const entry = items[i].webkitGetAsEntry ? items[i].webkitGetAsEntry() : items[i].getAsEntry();

            if (entry) {
              if (entry.isDirectory) {
                // Recursively collect files from directory
                const dirFiles = await readDirectoryRecursive(entry);
                files.push(...dirFiles);
              } else if (entry.isFile) {
                // Get the file
                const file = await getFileFromEntry(entry);
                if (file) {
                  files.push(file);
                }
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
}

// =============================================================================
// NAVIGATION
// =============================================================================

function handleStepClick(stepNumber) {
  // Validate navigation requirements
  if (stepNumber === 2 && appState.uploadedFiles.length === 0) {
    alert('Nejprve nahrajte soubory před přechodem na validaci.');
    return;
  }

  if (stepNumber === 3 && Object.keys(appState.validationResults).length === 0) {
    alert('Nejprve proveďte validaci bannerů.');
    return;
  }

  if (stepNumber === 4 && !appState.campaignName) {
    alert('Nejprve vyplňte nastavení exportu.');
    return;
  }

  if (stepNumber === 5 && appState.selectedNetworks.length === 0) {
    alert('Vyberte alespoň jeden systém před přechodem na export.');
    return;
  }

  // Allow navigation to previous steps or to valid next steps
  if (stepNumber <= appState.currentStep + 1) {
    goToStep(stepNumber);
  }
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
  if (stepNumber === 2 && Object.keys(appState.networkStats).length > 0) {
    displayNetworkToggles();
  }

  if (stepNumber === 3) {
    updateExportPreview();
  }

  if (stepNumber === 4 && Object.keys(appState.networkStats).length > 0) {
    displayNetworkSelection();
  }

  if (stepNumber === 5) {
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
function updateExportPreview() {
  // Read values from inputs
  const campaignName = document.getElementById('campaignName')?.value || '';
  const contentName = document.getElementById('contentName')?.value || '';
  const landingURL = document.getElementById('landingURL')?.value || '';
  const zboziToggle = document.getElementById('zboziToggle')?.checked || false;

  // Update state
  appState.campaignName = campaignName;
  appState.contentName = contentName;
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

  let utm_source = '';
  let utm_medium = '';
  let utm_campaign = campaignName;
  let utm_content = '';
  let utm_term = '';

  // Determine source and medium based on network
  if (network === 'SOS') {
    utm_source = 'seznam_sos';

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

    // utm_content: campaign-content_format_service
    if (format === 'in-article') {
      utm_content = `${campaignName}-${contentName}_${format}_${service}`;
      utm_term = `${format}_${service}`;
    } else {
      utm_content = `${campaignName}-${contentName}_${dimensions}`;
      utm_term = format;
    }

  } else if (network === 'ONEGAR') {
    utm_source = 'seznam_onegar';

    // Check if it's through ADFORM
    const isAdform = false; // Will be determined by user selection later

    if (format === 'kombi') {
      utm_medium = 'kombi_selfpromo';
      utm_content = `${campaignName}-${contentName}_kombi`;
      utm_term = 'kombi';
    } else if (format === 'banner') {
      if (tier === 'HIGH') {
        utm_medium = isAdform ? 'banner_selfpromo_high_adform' : 'banner_selfpromo_high';
      } else {
        utm_medium = isAdform ? 'banner_selfpromo_low_adform' : 'banner_selfpromo_low';
      }
      utm_content = `${campaignName}-${contentName}_${dimensions}`;
      utm_term = 'banner';
    } else if (format === 'video') {
      utm_medium = tier === 'HIGH' ? 'video_selfpromo_high' : 'video_selfpromo_low';
      utm_content = `${campaignName}-${contentName}_${dimensions}`;
      utm_term = 'video';
    }

  } else if (network === 'SKLIK') {
    utm_source = 'seznam_low';
    utm_medium = 'cpc_low';
    utm_campaign = '{campaign}';
    utm_content = '{adgroup}_{adtitle}';
    utm_term = '';

  } else if (network === 'ADFORM' || network === 'HP_EXCLUSIVE') {
    // ADFORM and HP_EXCLUSIVE typically go through Onegar
    utm_source = 'seznam_onegar';
    utm_medium = tier === 'HIGH' ? 'banner_selfpromo_high_adform' : 'banner_selfpromo_low_adform';
    utm_content = `${campaignName}-${contentName}_${dimensions}`;
    utm_term = 'banner';
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

  if (anchor) {
    url += '#' + anchor;
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
  const systems = ['ADFORM', 'SOS', 'ONEGAR', 'SKLIK', 'HP_EXCLUSIVE', 'HPEXCLUSIVE', 'HP EXCLUSIVE'];

  for (const system of systems) {
    if (pathUpper.includes(system)) {
      // Normalize HP variants to HP_EXCLUSIVE
      if (system.startsWith('HP')) {
        return 'HP_EXCLUSIVE';
      }
      return system;
    }
  }

  return null;
}

// =============================================================================
// FILE UPLOAD & ANALYSIS
// =============================================================================

/**
 * Extract image files from a ZIP archive
 * @param {File} zipFile - ZIP file
 * @returns {Promise<Array<File>>} Array of image File objects with folderPath property
 */
async function extractImagesFromZIP(zipFile) {
  try {
    const zip = new JSZip();
    const contents = await zip.loadAsync(zipFile);
    const imageFiles = [];

    for (const [filename, zipEntry] of Object.entries(contents.files)) {
      // Skip directories and hidden files
      if (zipEntry.dir || filename.startsWith('__MACOSX') || filename.startsWith('.')) {
        continue;
      }

      // Check if it's an image file
      const extension = filename.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
        // Extract file as blob
        const blob = await zipEntry.async('blob');

        // Create a File object from the blob
        const file = new File([blob], filename.split('/').pop(), {
          type: `image/${extension === 'jpg' ? 'jpeg' : extension}`
        });

        // Store folder path for system detection
        const pathParts = filename.split('/');
        file.folderPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';

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
    } else {
      skippedCount++;
      console.warn(`Unsupported file type: ${file.name}. Only JPG, PNG, GIF images and ZIP files are supported.`);
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
    <div style="margin-top: 20px;">
      <h3>Uploaded Files (${appState.uploadedFiles.length})</h3>
      <ul style="list-style: none; padding: 0;">
        ${appState.uploadedFiles.map((file, index) => `
          <li style="padding: 10px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>${file.name}</strong>
              ${file.dimensions ? `<span style="color: #6b7280; margin-left: 10px;">${file.dimensions}</span>` : ''}
              <span style="color: #6b7280; margin-left: 10px;">${file.sizeKB} KB</span>
              ${!file.colorSpaceValid ? '<span style="color: #ef4444; margin-left: 10px;">⚠️ CMYK</span>' : ''}
            </div>
            <button onclick="removeFile(${index})" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">✕</button>
          </li>
        `).join('')}
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

    // Check against all networks and tiers
    const networks = ['ADFORM', 'SOS', 'ONEGAR', 'SKLIK'];

    for (const network of networks) {
      const tiers = ['HIGH', 'LOW'];

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
            incompatible.push({
              network: network,
              tier: tier,
              format: match.specKey,
              formatDisplay: match.formatDisplay,
              reason: validation.issues.join(', ') || `Size exceeds limit (${match.fileSize}KB > ${match.sizeLimit}KB)`
            });
          }
        }
      }
    }

    // Check HP EXCLUSIVE (no tier)
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
          reason: validation.issues.join(', ') || `Size exceeds limit`
        });
      }
    }

    appState.validationResults[fileData.name] = {
      file: fileData,
      compatible: compatible,
      incompatible: incompatible
    };
  }

  // Calculate network stats
  calculateNetworkStats();

  // Display validation results
  displayNetworkToggles();

  // Go to step 2 (validation results)
  goToStep(2);
}

function calculateNetworkStats() {
  // Initialize stats for all networks
  const networks = ['ADFORM', 'SOS', 'ONEGAR', 'SKLIK', 'HP_EXCLUSIVE'];
  const tiers = ['HIGH', 'LOW'];

  for (const network of networks) {
    appState.networkStats[network] = {};

    if (network === 'HP_EXCLUSIVE') {
      // HP_EXCLUSIVE has no tiers
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
          reason: incomp.reason
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
              ${stats.network.replace('_', ' ')}
            </div>

            <div style="font-size: 18px; color: #1f2937; margin-bottom: 12px;">
              <span style="display: inline-flex; align-items: center; gap: 5px;">
                <span style="font-size: 20px;">✓</span>
                <span style="font-weight: 700; color: #10b981;">${stats.eligibleAssets} validních</span>
              </span>
              <span style="color: #6b7280;"> (${stats.totalPlacements} umístění)</span>
              ${hasErrors ? `
                <span style="margin-left: 15px; display: inline-flex; align-items: center; gap: 5px;">
                  <span style="font-size: 20px;">⚠</span>
                  <span style="font-weight: 700; color: #ef4444;">${stats.errors}</span>
                  <span style="color: #6b7280;"> chyb</span>
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

// Display network selection with checkboxes (Step 3)
function displayNetworkSelection() {
  const selectionSection = document.getElementById('networkSelection');
  if (!selectionSection) return;

  let html = '<div style="display: grid; gap: 15px; margin-bottom: 20px;">';

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
    html += `
      <div class="network-toggle-card" style="border: 2px solid #10b981; border-radius: 12px; padding: 20px; background: #f0fdf4; transition: all 0.2s;">
        <label style="display: flex; align-items: center; gap: 15px; cursor: pointer;">
          <input type="checkbox" id="select_${stats.network}"
            checked
            onchange="toggleNetworkSelection('${stats.network}')"
            style="width: 24px; height: 24px; cursor: pointer; accent-color: #10b981;">
          <div style="flex: 1;">
            <div style="font-weight: 700; font-size: 20px; color: #1f2937;">
              ${stats.network.replace('_', ' ')}
            </div>
            <div style="font-size: 16px; color: #1f2937; margin-top: 8px;">
              <span style="font-weight: 700; color: #10b981;">${stats.eligibleAssets} validních bannerů</span>
            </div>
          </div>
        </label>
        <div style="margin-top: 12px;">
          <button onclick="toggleExportPreview('${stats.network}')"
            id="previewBtn_${stats.network}"
            style="background: #ffffff; border: 1px solid #10b981; color: #10b981; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-weight: 600;">
            <span id="previewIcon_${stats.network}">▶</span>
            <span id="previewText_${stats.network}">Zobrazit bannery k exportu</span>
          </button>
        </div>
        <div id="previewDetails_${stats.network}" style="display: none; margin-top: 12px; padding: 12px; background: #ffffff; border: 1px solid #bbf7d0; border-radius: 6px; font-size: 13px;">
          <div style="font-weight: 600; color: #166534; margin-bottom: 8px;">Bannery k exportu:</div>
          ${buildExportPreview(stats.network)}
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
    html += '<div style="font-weight: 600; color: #059669; margin-bottom: 8px; font-size: 13px;">✓ Další kompatibilní bannery:</div>';
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
    html += '<ul style="margin: 0; padding-left: 20px; color: #166534;">';
    for (const fileInfo of assignedFiles) {
      html += `<li style="margin-bottom: 6px;"><strong>${fileInfo.fileName}</strong><br/><span style="color: #166534; font-size: 12px;">${fileInfo.file.dimensions} • ${fileInfo.file.sizeKB} KB</span></li>`;
    }
    html += '</ul>';
    html += '</div>';
  }

  // Show other compatible banners
  if (otherValidFiles.length > 0) {
    html += '<div style="margin-bottom: 12px;">';
    html += '<div style="font-weight: 600; color: #059669; margin-bottom: 8px; font-size: 14px;">✓ Další kompatibilní bannery:</div>';
    html += '<ul style="margin: 0; padding-left: 20px; color: #166534;">';
    for (const fileInfo of otherValidFiles) {
      html += `<li style="margin-bottom: 6px;"><strong>${fileInfo.fileName}</strong><br/><span style="color: #166534; font-size: 12px;">${fileInfo.file.dimensions} • ${fileInfo.file.sizeKB} KB</span></li>`;
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

  const uniqueErrors = {};
  for (const errorInfo of stats.errorFiles) {
    if (!uniqueErrors[errorInfo.file]) {
      uniqueErrors[errorInfo.file] = errorInfo.reason;
    }
  }

  let html = '<ul style="margin: 0; padding-left: 20px; color: #7f1d1d;">';
  for (const [file, reason] of Object.entries(uniqueErrors)) {
    html += `<li style="margin-bottom: 6px;"><strong>${file}</strong><br/><span style="color: #991b1b; font-size: 12px;">${reason}</span></li>`;
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
      appState.selectedNetworks.push({
        network: network
      });
    }
  }
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

function displayExportSettings() {
  const exportNetworksSection = document.getElementById('exportNetworks');
  if (!exportNetworksSection) return;

  // Use values from appState (set in step 3)
  const campaignName = appState.campaignName || '';
  const contentName = appState.contentName || '';
  const landingURL = appState.landingURL || '';

  let html = '';

  // Display each selected network with tier-specific stats
  for (const selection of appState.selectedNetworks) {
    const network = selection.network;
    const tier = appState.selectedCampaignTier;
    const tierKey = network === 'HP_EXCLUSIVE' ? 'NONE' : tier;
    const stats = appState.networkStats[network][tierKey];

    if (!stats) continue;

    // Get eligible files for this network and tier
    const eligibleFiles = [];
    for (const [fileName, validation] of Object.entries(appState.validationResults)) {
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

    html += `
      <div style="border: 2px solid #10b981; border-radius: 12px; padding: 20px; margin: 20px 0; background: #f0fdf4;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <div>
            <h3 style="margin: 0; font-size: 22px; color: #1f2937;">${network.replace('_', ' ')}</h3>
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
                    <th style="width: 120px;">Služba</th>
                    <th style="width: 120px;">Ukotvení</th>
                    <th>Finální URL</th>
                    <th style="width: 80px;">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  ${eligibleFiles.map((f, idx) => {
                    const fileId = `${network}_${tier}_${idx}`;
                    const defaultFormat = 'banner';
                    const defaultService = 'hp';

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
                            <option value="banner" selected>Banner</option>
                            <option value="kombi">Kombi</option>
                          </select>
                        </td>
                        <td>
                          <select id="service_${fileId}" onchange="updateBannerURL('${fileId}', '${network}', '${tier}', ${idx})" style="width: 100%; padding: 4px; font-size: 12px;">
                            <option value="hp" selected>HP</option>
                            <option value="obsah">Obsah</option>
                            <option value="sport">Sport</option>
                            <option value="zpravy">Zprávy</option>
                          </select>
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
            📦 Stáhnout balíček ${network} (ZIP + instrukce)
          </button>
        ` : `
          <div style="padding: 15px; background: #fef2f2; border-radius: 6px; color: #991b1b; text-align: center;">
            Žádné validní bannery pro tento systém a tier
          </div>
        `}
      </div>
    `;
  }

  if (html === '') {
    html = '<div style="padding: 30px; text-align: center; color: #6b7280;">Nejsou vybrány žádné systémy. Vraťte se na krok 4 a vyberte systémy.</div>';
  }

  exportNetworksSection.innerHTML = html;
}

/**
 * Update banner URL when format, service, or anchor changes
 */
function updateBannerURL(fileId, network, tier, fileIndex) {
  const formatSelect = document.getElementById(`format_${fileId}`);
  const serviceSelect = document.getElementById(`service_${fileId}`);
  const anchorInput = document.getElementById(`anchor_${fileId}`);
  const urlDiv = document.getElementById(`url_${fileId}`);

  if (!formatSelect || !serviceSelect || !urlDiv) return;

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
    service: serviceSelect.value,
    anchor: anchorInput.value,
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
    // Get eligible files for this network and tier
    const eligibleFiles = [];
    for (const [fileName, validation] of Object.entries(appState.validationResults)) {
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

    // Create ZIP file
    const zip = new JSZip();

    // Add all eligible banner files
    for (const fileData of eligibleFiles) {
      zip.file(fileData.fileName, fileData.file.file);
    }

    // Generate URLs list
    let urlsList = `${network} - ${network === 'HP_EXCLUSIVE' ? 'Campaign' : tier + ' Tier Campaign'}\n`;
    urlsList += `Generated: ${new Date().toLocaleString()}\n`;
    urlsList += `Total Assets: ${eligibleFiles.length}\n`;
    urlsList += `\n${'='.repeat(80)}\n\n`;

    for (const fileData of eligibleFiles) {
      urlsList += `File: ${fileData.fileName}\n`;
      urlsList += `Dimensions: ${fileData.file.dimensions}\n`;
      urlsList += `Size: ${fileData.file.sizeKB} KB\n`;
      urlsList += `Compatible Placements:\n`;

      for (const placement of fileData.placements) {
        urlsList += `  - ${placement.formatDisplay}\n`;
        urlsList += `    Spec: ${placement.spec.name}\n`;
        urlsList += `    ${placement.spec.width}x${placement.spec.height}`;
        if (placement.spec.maxSizeKB) {
          urlsList += ` (max ${placement.spec.maxSizeKB} KB)`;
        }
        urlsList += `\n`;
      }

      // Placeholder URL - user should replace with actual campaign URL
      urlsList += `Upload URL: [TO BE CONFIGURED IN ${network} PLATFORM]\n`;
      urlsList += `\n${'-'.repeat(80)}\n\n`;
    }

    urlsList += `\nNOTE: Please upload each file to the ${network} advertising platform\n`;
    urlsList += `and configure the campaign settings according to the ${network === 'HP_EXCLUSIVE' ? 'specifications' : tier + ' tier specifications'} listed above.\n`;

    // Add URLs text file
    zip.file('UPLOAD_INSTRUCTIONS.txt', urlsList);

    // Generate ZIP and download
    const blob = await zip.generateAsync({ type: 'blob' });
    const filename = `${network}_${network === 'HP_EXCLUSIVE' ? 'Package' : tier + '_Tier'}_${Date.now()}.zip`;
    downloadBlob(blob, filename);

    alert(`✅ Balíček úspěšně vyexportován!\n\nObsah:\n- ${eligibleFiles.length} bannerů\n- UPLOAD_INSTRUCTIONS.txt s detaily umístění`);
  } catch (error) {
    console.error('Export error:', error);
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
window.toggleExportPreview = toggleExportPreview;
window.toggleValidCreatives = toggleValidCreatives;
window.toggleNetworkErrors = toggleNetworkErrors;
window.updateCampaignTier = updateCampaignTier;
window.updateExportPreview = updateExportPreview;
window.updateBannerURL = updateBannerURL;
window.copyURL = copyURL;
window.displayExportSettings = displayExportSettings;
window.exportNetworkZIP = exportNetworkZIP;
window.exportCSV = exportCSV;
