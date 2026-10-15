'use strict';

(() => {
  const $ = (id) => document.getElementById(id);
  const zone = $('dropzone');
  const chooser = $('files');
  const status = $('status');
  const results = $('results');
  const widthInput = $('width');
  const qualityInput = $('quality');
  const formatInput = $('format');
  const qualities = Object.freeze({ high: 0.92, medium: 0.82, low: 0.68 });
  const MAX_FILES = 50;
  const MAX_FILE_BYTES = 40 * 1024 * 1024;
  const MAX_PIXELS = 80_000_000;
  const types = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']);
  let busy = false;

  const bytes = (n) => n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`;
  const safeBase = (name) => name.replace(/\.[^.]+$/, '').replace(/[\\/\x00-\x1f<>:"|?*]/g, '_').slice(0, 110) || 'bild';
  const setStatus = (message, error = false) => { status.textContent = message; status.classList.toggle('error', error); };

  function readOptions() {
    const width = Number(widthInput.value);
    if (!Number.isInteger(width) || width < 320 || width > 4000) throw new Error('Breite muss zwischen 320 und 4000 Pixel liegen.');
    const q = Object.hasOwn(qualities, qualityInput.value) ? qualityInput.value : 'medium';
    const format = ['original', 'webp', 'jpg', 'png'].includes(formatInput.value) ? formatInput.value : 'original';
    return { width, q, quality: qualities[q], format };
  }

  function updateUrl() {
    try {
      const o = readOptions();
      const url = new URL(location.href);
      url.searchParams.set('w', String(o.width));
      url.searchParams.set('q', o.q);
      if (o.format === 'original') url.searchParams.delete('format');
      else url.searchParams.set('format', o.format);
      history.replaceState(null, '', url);
      setStatus('Bereit.');
    } catch (e) { setStatus(e.message, true); }
  }
  // Initialize controls from optional URL parameters, using safe defaults for invalid values.
  const params = new URLSearchParams(location.search);
  const initialWidth = Number(params.get('w'));
  if (Number.isInteger(initialWidth) && initialWidth >= 320 && initialWidth <= 4000) widthInput.value = String(initialWidth);
  const initialQuality = params.get('q');
  if (Object.hasOwn(qualities, initialQuality)) qualityInput.value = initialQuality;
  const initialFormat = params.get('format');
  if (['original', 'webp', 'jpg', 'png'].includes(initialFormat)) formatInput.value = initialFormat;
  widthInput.addEventListener('change', updateUrl);
  qualityInput.addEventListener('change', updateUrl);
  formatInput.addEventListener('change', updateUrl);

  async function prepareSvg(file) {
    // Never pass arbitrary active SVG markup directly to the browser decoder.
    // This tool supports static vector drawings, not scripts or linked assets.
    const xml = await file.text();
    const doc = new DOMParser().parseFromString(xml, 'image/svg+xml');
    const root = doc.documentElement;
    if (root.localName !== 'svg' || root.namespaceURI !== 'http://www.w3.org/2000/svg' || doc.querySelector('parsererror')) {
      throw new Error(`Ungültige SVG-Datei: ${file.name}`);
    }
    const blocked = new Set(['script', 'foreignObject', 'image', 'use', 'a', 'iframe', 'audio', 'video', 'animate', 'animateMotion', 'animateTransform', 'set', 'style']);
    for (const el of [...root.querySelectorAll('*')]) {
      if (blocked.has(el.localName) || el.namespaceURI !== 'http://www.w3.org/2000/svg') {
        el.remove();
        continue;
      }
    }
    for (const el of [root, ...root.querySelectorAll('*')]) {
      for (const attr of [...el.attributes]) {
        const name = attr.name.toLowerCase();
        const value = attr.value;
        if (name.startsWith('on') || name === 'style' || name === 'href' || name.endsWith(':href') ||
            /url\s*\(|@import|javascript:|data:|https?:|\/\//i.test(value)) {
          el.removeAttributeNode(attr);
        }
      }
    }
    return new Blob([new XMLSerializer().serializeToString(root)], { type: 'image/svg+xml' });
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(file);
      image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`Bild konnte nicht gelesen werden: ${file.name}`)); };
      image.src = url;
    });
  }
  function encode(canvas, type, quality) {
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Bild konnte nicht konvertiert werden.')), type, quality));
  }
  async function optimize(file, options) {
    const isSvg = file.type === 'image/svg+xml' || /\.svg$/i.test(file.name);
    const sourceType = isSvg ? 'image/svg+xml' : file.type;
    if (!types.has(sourceType)) throw new Error(`Nicht unterstützter Bildtyp: ${file.name}`);
    if (file.size > MAX_FILE_BYTES) throw new Error(`Datei zu groß (maximal 40 MB): ${file.name}`);

    // SVG is vector-based: preserve the original format and proportions.
    // Keep the sanitization step, to avoid passing active content to the decoder/download.
    if (isSvg && options.format === 'original') {
      const blob = await prepareSvg(file);
      if (blob.size > file.size) throw new Error(`${file.name}: Die optimierte Datei wäre größer als das Original (${bytes(blob.size)} statt ${bytes(file.size)}). Bitte Breite oder Qualität reduzieren; bei SVG sind diese Einstellungen im Originalformat nicht wirksam.`);
      return { name: `${safeBase(file.name)}-optimiert.svg`, blob, originalSize: file.size };
    }

    const image = await loadImage(isSvg ? await prepareSvg(file) : file);
    if (!image.naturalWidth || !image.naturalHeight) throw new Error(`Bild ohne gültige Abmessungen: ${file.name}`);
    if (image.naturalWidth * image.naturalHeight > MAX_PIXELS) throw new Error(`Bildauflösung zu groß: ${file.name}`);
    const factor = Math.min(1, options.width / image.naturalWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * factor));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * factor));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Bildverarbeitung wird in diesem Browser nicht unterstützt.');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    let format = options.format;
    if (format === 'original') {
      format = sourceType === 'image/jpeg' ? 'jpg' : sourceType === 'image/png' ? 'png' : 'webp';
    }
    const mime = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[format];
    if (!mime) throw new Error(`Unbekanntes Ausgabeformat: ${format}`);

    // JPEG has no transparency; fill the canvas white instead of producing black backgrounds.
    if (format === 'jpg') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await encode(canvas, mime, options.quality);
    canvas.width = canvas.height = 0;
    // Canvas may silently fall back to PNG if the requested encoder is unavailable.
    if (blob.type !== mime) throw new Error(`Dieser Browser unterstützt die Ausgabe als ${format.toUpperCase()} nicht.`);
    if (blob.size > file.size) throw new Error(`${file.name}: Die optimierte Datei wäre größer als das Original (${bytes(blob.size)} statt ${bytes(file.size)}). Bitte maximale Breite oder Qualität reduzieren${format === 'png' ? ' (bei PNG hat die Qualitätseinstellung keinen Einfluss)' : ''}.`);
    return { name: `${safeBase(file.name)}-optimiert.${format}`, blob, originalSize: file.size };
  }

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = name;
    document.body.append(anchor); anchor.click(); anchor.remove();
    // Keep the URL alive long enough for browsers to start the download.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
  function showResult(item, linkBlob) {
    const row = document.createElement('div'); row.className = 'result';
    const label = document.createElement('span');
    label.textContent = `${item.name} · ${bytes(item.originalSize)} → ${bytes(item.blob.size)}`;
    const link = document.createElement('a');
    const url = URL.createObjectURL(linkBlob || item.blob);
    link.href = url; link.download = item.name; link.textContent = 'Erneut laden';
    row.append(label, link); results.append(row);
    // Revoke on next conversion; don't invalidate manually clickable links too early.
  }

  // Zero-dependency ZIP (store-only). WebP/PNG are already compressed, so deflate adds little.
  function crc32(data) {
    let crc = -1;
    for (const byte of data) {
      crc ^= byte;
      for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xEDB88320 : 0);
    }
    return (crc ^ -1) >>> 0;
  }
  async function makeZip(items) {
    const encoder = new TextEncoder();
    const localParts = [], directoryParts = [];
    let offset = 0;
    const now = new Date();
    const dosDate = ((Math.max(1980, now.getFullYear()) - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    for (const item of items) {
      const filename = encoder.encode(item.name);
      const data = new Uint8Array(await item.blob.arrayBuffer());
      const crc = crc32(data);
      const local = new Uint8Array(30 + filename.length);
      const l = new DataView(local.buffer);
      l.setUint32(0, 0x04034b50, true); l.setUint16(4, 20, true); l.setUint16(6, 0x0800, true);
      l.setUint16(10, dosTime, true); l.setUint16(12, dosDate, true);
      l.setUint32(14, crc, true); l.setUint32(18, data.length, true); l.setUint32(22, data.length, true);
      l.setUint16(26, filename.length, true); local.set(filename, 30);
      localParts.push(local, data);
      const central = new Uint8Array(46 + filename.length);
      const c = new DataView(central.buffer);
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true);
      c.setUint16(8, 0x0800, true); c.setUint16(12, dosTime, true); c.setUint16(14, dosDate, true);
      c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
      c.setUint16(28, filename.length, true); c.setUint32(42, offset, true); central.set(filename, 46);
      directoryParts.push(central);
      offset += local.length + data.length;
    }
    const directoryLength = directoryParts.reduce((sum, p) => sum + p.length, 0);
    const end = new Uint8Array(22); const e = new DataView(end.buffer);
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, items.length, true); e.setUint16(10, items.length, true);
    e.setUint32(12, directoryLength, true); e.setUint32(16, offset, true);
    return new Blob([...localParts, ...directoryParts, end], { type: 'application/zip' });
  }

  async function process(files) {
    if (busy || files.length === 0) return;
    let options;
    try { options = readOptions(); } catch (e) { setStatus(e.message, true); return; }
    if (files.length > MAX_FILES) { setStatus(`Maximal ${MAX_FILES} Bilder pro Durchlauf.`, true); return; }
    busy = true; zone.setAttribute('aria-busy', 'true');
    results.querySelectorAll('a').forEach(a => URL.revokeObjectURL(a.href));
    results.replaceChildren();
    const finished = [], errors = [], usedNames = new Set();
    try {
      for (let i = 0; i < files.length; i++) {
        setStatus(`Verarbeite Bild ${i + 1} von ${files.length} …`);
        try {
          const item = await optimize(files[i], options);
          let candidate = item.name, suffix = 2;
          while (usedNames.has(candidate.toLowerCase())) {
            candidate = item.name.replace(/(\.[^.]+)$/, `-${suffix++}$1`);
          }
          item.name = candidate;
          usedNames.add(candidate.toLowerCase());
          finished.push(item); showResult(item);
        } catch (err) { errors.push(err.message); }
      }
      if (finished.length === 1) {
        download(finished[0].blob, finished[0].name);
      } else if (finished.length > 1) {
        setStatus('Erstelle ZIP …');
        const zip = await makeZip(finished);
        download(zip, 'bilder-verkleinert.zip');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zip); link.download = 'bilder-verkleinert.zip'; link.textContent = 'ZIP erneut herunterladen';
        link.className = 'zip-link'; results.prepend(link);
      }
      setStatus(`${finished.length} Bild(er) fertig.${errors.length ? ` ${errors.length} Fehler: ${errors.slice(0, 3).join(' / ')}` : ' Download gestartet.'}`, errors.length > 0);
    } catch (err) { setStatus(`Fehler: ${err.message}`, true); }
    finally { busy = false; zone.removeAttribute('aria-busy'); chooser.value = ''; }
  }

  zone.addEventListener('click', () => chooser.click());
  zone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chooser.click(); } });
  chooser.addEventListener('change', () => process([...chooser.files]));
  for (const eventName of ['dragenter', 'dragover']) zone.addEventListener(eventName, e => { e.preventDefault(); zone.classList.add('dragover'); });
  for (const eventName of ['dragleave', 'drop']) zone.addEventListener(eventName, e => { e.preventDefault(); zone.classList.remove('dragover'); });
  zone.addEventListener('drop', e => process([...e.dataTransfer.files]));
  window.addEventListener('dragover', e => e.preventDefault());
  window.addEventListener('drop', e => e.preventDefault());
})();
