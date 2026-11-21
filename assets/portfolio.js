const viewer = document.getElementById('photo-viewer');
const stage = viewer.querySelector('.viewer-stage');
const picks = Array.from(viewer.querySelectorAll('[data-plate]'));
const portrait = document.querySelector('#hero-portrait-frame > img');
const titles = {
  portrait: 'Potret M. Arifqu Wa Liin',
  drawing: 'Sketsa garis',
  ink: 'Cetakan tinta',
  print: 'Poster berwarna'
};

function makePlate(name) {
  const original = name === 'portrait' ? portrait : document.querySelector('.proof-stage .proof-sheet--' + name);
  const artwork = original.cloneNode(true);
  const photo = artwork.matches('img') ? artwork : artwork.querySelector('img');
  photo.loading = 'eager';
  if (name !== 'portrait') {
    artwork.removeAttribute('aria-hidden');
    artwork.setAttribute('role', 'img');
    artwork.setAttribute('aria-label', titles[name] + ' dengan nama M. Arifqu Wa Liin dan potret berkemeja batik.');
  }
  return artwork;
}

function showPlate(name, captureProgress = false) {
  let title = titles[name];
  if (captureProgress) {
    const proof = document.querySelector('.profile-proof');
    const value = document.getElementById('proof-reveal').valueAsNumber;
    const snapshot = document.createElement('div');
    snapshot.className = 'viewer-proof';
    const style = getComputedStyle(proof);
    for (const property of ['--paper-cut', '--color-cut', '--proof-zoom']) {
      snapshot.style.setProperty(property, style.getPropertyValue(property));
    }
    proof.querySelectorAll('.proof-sheet').forEach(sheet => {
      const layer = sheet.cloneNode(true);
      layer.querySelector('img').loading = 'eager';
      snapshot.append(layer);
    });
    title = 'Poster pada ' + value + '%';
    snapshot.setAttribute('role', 'img');
    snapshot.setAttribute('aria-label', 'Poster M. Arifqu Wa Liin pada posisi perbandingan ' + value + ' persen.');
    stage.replaceChildren(snapshot);
  } else {
    stage.replaceChildren(makePlate(name));
  }
  viewer.querySelector('h2').textContent = title;
  picks.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.plate === name)));
}

if (typeof viewer.showModal === 'function') {
  document.querySelectorAll('[data-view-photo]').forEach(opener => {
    opener.hidden = false;
    opener.addEventListener('click', () => {
      const stop = document.querySelector('.proof-stops [aria-pressed="true"]').dataset.stop;
      const plate = opener.dataset.viewPhoto === 'portrait' ? 'portrait' : {0:'drawing', 50:'ink', 100:'print'}[stop];
      const progress = document.getElementById('proof-reveal').valueAsNumber;
      showPlate(plate, plate !== 'portrait' && ![0, 50, 100].includes(progress));
      viewer.showModal();
    });
  });
  picks.forEach(button => button.addEventListener('click', () => showPlate(button.dataset.plate)));
  viewer.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const current = picks.findIndex(button => button.getAttribute('aria-pressed') === 'true');
    const next = picks[(current + (event.key === 'ArrowLeft' ? -1 : 1) + picks.length) % picks.length];
    next.click();
    next.focus();
  });
  viewer.addEventListener('click', event => {
    if (event.target !== viewer) return;
    const rect = viewer.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) viewer.close();
  });
  viewer.addEventListener('close', () => stage.replaceChildren());
  window.addEventListener('hashchange', () => {
    if (viewer.open) viewer.close();
  });
}

const manualCopy = document.getElementById('manual-copy');
const copyNotice = document.getElementById('clipboard-notice');
function bindCopy(button, getText, description) {
  const originalLabel = button.textContent;
  let reset;
  button.addEventListener('click', async () => {
    const value = getText();
    clearTimeout(reset);
    copyNotice.textContent = '';
    try {
      await navigator.clipboard.writeText(value);
      button.textContent = 'Disalin';
      button.dataset.copied = '';
      copyNotice.textContent = description + ' berhasil disalin.';
      reset = setTimeout(() => {
        button.textContent = originalLabel;
        delete button.dataset.copied;
      }, 2000);
    } catch {
      button.textContent = originalLabel;
      delete button.dataset.copied;
      const field = manualCopy.querySelector('textarea');
      field.value = value;
      manualCopy.showModal();
      field.focus();
      field.select();
    }
  });
}

document.querySelectorAll('.code-box').forEach(box => {
  const header = box.querySelector('.code-box__head');
  const filename = header.firstElementChild.textContent;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'source-copy';
  button.textContent = 'Salin kode';
  button.setAttribute('aria-label', 'Salin kode ' + filename);
  header.append(button);
  bindCopy(button, () => Array.from(box.querySelectorAll('.code-ln'), line => line.lastElementChild.textContent).join('\n'), filename);
});

const draftButton = document.querySelector('.draft-copy');
draftButton.hidden = false;
bindCopy(draftButton, () => {
  const link = new URL(document.getElementById('mail-cta-link').href);
  const subject = link.searchParams.get('subject');
  const body = document.getElementById('letter-body').value.trim();
  return 'Kepada: ' + link.pathname + '\nSubjek: ' + subject + (body ? '\n\n' + body : '');
}, 'Draf email');
