# Product Clarification Needed

## URL Generation Patterns

### 1. Spinner (SOS System)
**Question:** What UTM pattern should be used for Spinner creative URLs?
- Current assumption: Use standard SOS URL rules (same as other SOS formats)
- Spinner is a 4-image rotating banner (300×600 px each)
- Each image can have different target URL in the campaign table

**Action needed:** Confirm if Spinner follows standard SOS UTM pattern or needs custom pattern.

---

### 2. Branding Sklik (SOS System)
**Question:** Should Branding Sklik follow standard Sklik UTM pattern or SOS pattern?
- Branding Sklik is 2000×1400 px desktop branding format
- Added to SOS system (not SKLIK)
- Current assumption: Follow standard Sklik branding URL pattern

**Action needed:** Confirm UTM generation logic for Branding Sklik campaigns.

---

## Campaign Table Detection

### 3. Spinner Detection Without Folder Names
**Context:** Spinner requires 4× 300×600 px images. Detection priority:
1. First: Check for "spinner" in folder names
2. Fallback: Check campaign table (kampanova tabulka) if spinner was requested

**Question:** What is the exact mechanism to check "kampanova tabulka" for spinner requests?
- How is this data passed to the validation system?
- What field/column should be checked?
- Should we add UI for users to manually mark files as Spinner?

**Action needed:** Clarify fallback detection mechanism for Spinner when folder naming is not used.

---

## Priority: Medium
These questions affect URL export functionality but don't block creative validation.
