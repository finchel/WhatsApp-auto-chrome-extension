document.addEventListener('DOMContentLoaded', () => {
  const templateMaleEl = document.getElementById('templateMale');
  const templateFemaleEl = document.getElementById('templateFemale');
  const warningMale = document.getElementById('warningMale');
  const warningFemale = document.getElementById('warningFemale');
  const saveStatus = document.getElementById('saveStatus');
  const namesToggle = document.getElementById('namesToggle');
  const toggleIcon = document.getElementById('toggleIcon');
  const namesList = document.getElementById('namesList');

  // Load saved templates
  chrome.storage.local.get(['templateMale', 'templateFemale'], (result) => {
    if (result.templateMale) templateMaleEl.value = result.templateMale;
    if (result.templateFemale) templateFemaleEl.value = result.templateFemale;
    validate();
  });

  // Auto-save on input
  let saveTimeout;
  templateMaleEl.addEventListener('input', () => {
    validate();
    debounceSave();
  });
  templateFemaleEl.addEventListener('input', () => {
    validate();
    debounceSave();
  });

  function debounceSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveTemplates, 300);
  }

  function saveTemplates() {
    chrome.storage.local.set({
      templateMale: templateMaleEl.value,
      templateFemale: templateFemaleEl.value
    }, () => {
      // Flash save status
      saveStatus.classList.add('visible');
      setTimeout(() => saveStatus.classList.remove('visible'), 1500);
    });
  }

  function validate() {
    warningMale.style.display = templateMaleEl.value.includes('<name>') ? 'none' : 'block';
    warningFemale.style.display = templateFemaleEl.value.includes('<name>') ? 'none' : 'block';
  }

  // Names list toggle
  let namesOpen = false;
  namesToggle.addEventListener('click', () => {
    namesOpen = !namesOpen;
    namesList.classList.toggle('open', namesOpen);
    toggleIcon.classList.toggle('open', namesOpen);
    if (namesOpen) loadUserNames();
  });

  function loadUserNames() {
    chrome.storage.local.get('userNames', (result) => {
      const names = result.userNames || {};
      const entries = Object.entries(names);

      if (entries.length === 0) {
        namesList.innerHTML = '<div class="empty-msg">אין שמות שנשמרו עדיין</div>';
        return;
      }

      namesList.innerHTML = '';
      entries.sort((a, b) => a[0].localeCompare(b[0]));

      entries.forEach(([key, val]) => {
        const item = document.createElement('div');
        item.className = 'name-item';

        const info = document.createElement('span');
        const nameEn = document.createElement('span');
        nameEn.className = 'name-en';
        nameEn.textContent = key;
        const nameHe = document.createElement('span');
        nameHe.className = 'name-he';
        nameHe.textContent = val.he;
        const nameGender = document.createElement('span');
        nameGender.className = 'name-gender';
        nameGender.textContent = `(${val.gender === 'f' ? 'נ' : 'ז'})`;
        info.appendChild(nameEn);
        info.append(' \u2192 ');
        info.appendChild(nameHe);
        info.append(' ');
        info.appendChild(nameGender);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.title = 'מחק';
        deleteBtn.addEventListener('click', () => deleteName(key));

        item.appendChild(info);
        item.appendChild(deleteBtn);
        namesList.appendChild(item);
      });
    });
  }

  function deleteName(key) {
    chrome.storage.local.get('userNames', (result) => {
      const names = result.userNames || {};
      delete names[key];
      chrome.storage.local.set({ userNames: names }, () => {
        loadUserNames();
      });
    });
  }

  // ==========================================================================
  // Import / Export
  // ==========================================================================

  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  const importStatus = document.getElementById('importStatus');

  exportBtn.addEventListener('click', () => {
    chrome.storage.local.get('userNames', (result) => {
      const names = result.userNames || {};
      const entries = Object.entries(names);

      if (entries.length === 0) {
        showImportStatus('אין שמות לייצוא', 'error');
        return;
      }

      const blob = new Blob([JSON.stringify(names, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'whatsapp-greeter-names.json';
      a.click();
      URL.revokeObjectURL(url);
      showImportStatus(`יוצאו ${entries.length} שמות`, 'success');
    });
  });

  importBtn.addEventListener('click', () => {
    importFile.click();
  });

  importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);

        // Validate structure
        if (typeof imported !== 'object' || Array.isArray(imported)) {
          showImportStatus('קובץ לא תקין', 'error');
          return;
        }

        // Validate entries
        const MAX_IMPORT_ENTRIES = 10000;
        let validCount = 0;
        const cleaned = {};
        for (const [key, val] of Object.entries(imported)) {
          if (validCount >= MAX_IMPORT_ENTRIES) break;
          if (val && typeof val.he === 'string' && (val.gender === 'm' || val.gender === 'f')
              && key.length > 0 && key.length <= 100
              && val.he.length > 0 && val.he.length <= 100) {
            cleaned[key.toLowerCase().trim()] = { he: val.he.trim(), gender: val.gender };
            validCount++;
          }
        }

        if (validCount === 0) {
          showImportStatus('לא נמצאו שמות תקינים בקובץ', 'error');
          return;
        }

        // Merge with existing names (imported names override existing)
        chrome.storage.local.get('userNames', (result) => {
          const existing = result.userNames || {};
          const merged = { ...existing, ...cleaned };
          chrome.storage.local.set({ userNames: merged }, () => {
            showImportStatus(`יובאו ${validCount} שמות (סה"כ ${Object.keys(merged).length})`, 'success');
            if (namesOpen) loadUserNames();
          });
        });
      } catch (err) {
        showImportStatus('שגיאה בקריאת הקובץ', 'error');
      }

      // Reset file input so same file can be re-imported
      importFile.value = '';
    };
    reader.readAsText(file);
  });

  function showImportStatus(message, type) {
    importStatus.textContent = message;
    importStatus.className = `import-status visible ${type}`;
    setTimeout(() => {
      importStatus.classList.remove('visible');
    }, 3000);
  }
});