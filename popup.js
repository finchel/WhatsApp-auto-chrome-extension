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
        info.innerHTML = `<span class="name-en">${key}</span> → <span class="name-he">${val.he}</span> <span class="name-gender">(${val.gender === 'f' ? 'נ' : 'ז'})</span>`;

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
});