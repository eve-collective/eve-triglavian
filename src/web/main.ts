import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  ALL_CHARACTERS,
  getGlyphCategory,
  getGlyphSafeName,
  DEFAULT_DEPTH,
  DEFAULT_BEVEL_THICKNESS
} from '../constants';
import {
  createTriglavianMesh,
  createTriglavianTextGroup
} from '../geometry';
import { generateSvg, generateTextSvg } from '../svg';
import { GLYPHS_DATA } from '../glyphs-data';
import { generateTypefaceJson } from '../typeface';
import { exportToGLB, exportToOBJ, exportToSTL } from '../exporters';
import { MaterialPreset } from '../types';
import { createZipArchive } from './zip';

// Application State
let activeTab: 'overview' | 'editor' | 'viewer' | 'downloads' = 'overview';
let currentChar = 'A';
let currentMode: 'single' | 'text' = 'single';
let currentText = 'TRIGLAVIAN';
let currentPreset: MaterialPreset = 'plasma';
let depth = DEFAULT_DEPTH;
let bevelThickness = DEFAULT_BEVEL_THICKNESS;
let autoRotate = true;
let showGrid = true;

// Editor State
let editorRenderMode: 'font' | 'vector' = 'font';
let editorFontSize = 52;
let editorLetterSpacing = 6;
let editorColor = '#ff1e38';
let editorAlign: 'left' | 'center' | 'right' = 'left';

// Three.js Core
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let gridHelper: THREE.GridHelper;
let currentObject: THREE.Object3D | null = null;

// ============================================================================
// 1. Navigation & Toast System
// ============================================================================

function setActiveTab(tab: 'overview' | 'editor' | 'viewer' | 'downloads') {
  activeTab = tab;
  window.location.hash = tab;

  // Update nav buttons
  document.querySelectorAll('.nav-tab').forEach(btn => {
    const isTarget = (btn as HTMLElement).dataset.tab === tab;
    btn.classList.toggle('active', isTarget);
  });

  // Toggle sections
  document.querySelectorAll('.view-section').forEach(sec => {
    const isTarget = sec.id === `tab-${tab}`;
    sec.classList.toggle('active', isTarget);
  });

  // Re-layout Three.js canvas when 3D viewer is shown
  if (tab === 'viewer') {
    setTimeout(() => {
      onWindowResize();
      update3DScene();
    }, 50);
  }
}

function showToast(message: string, icon = '✓') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================================
// 2. Three.js 3D Viewport Setup
// ============================================================================

function initThree() {
  const container = document.getElementById('canvas3d-container')!;
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 600;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06080c);
  scene.fog = new THREE.FogExp2(0x06080c, 0.025);

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 4, 18);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = autoRotate;
  controls.autoRotateSpeed = 1.2;
  controls.maxDistance = 60;
  controls.minDistance = 4;
  controls.target.set(0, 0, 0);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xfff0e8, 2.0);
  mainLight.position.set(12, 18, 14);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 1024;
  mainLight.shadow.mapSize.height = 1024;
  scene.add(mainLight);

  // Crimson Abyssal rim light
  const rimLight = new THREE.DirectionalLight(0xff1e42, 3.5);
  rimLight.position.set(-14, 8, -12);
  scene.add(rimLight);

  // Fill light
  const fillLight = new THREE.PointLight(0xff5511, 1.2, 50);
  fillLight.position.set(0, -6, 5);
  scene.add(fillLight);

  // Grid Floor
  gridHelper = new THREE.GridHelper(40, 40, 0xff1e42, 0x1f2530);
  gridHelper.position.y = -4.5;
  (gridHelper.material as THREE.Material).transparent = true;
  (gridHelper.material as THREE.Material).opacity = 0.35;
  scene.add(gridHelper);

  window.addEventListener('resize', onWindowResize);
  animate();
}

function onWindowResize() {
  const container = document.getElementById('canvas3d-container');
  if (!container || !renderer || !camera) return;
  const width = container.clientWidth;
  const height = container.clientHeight;
  if (width === 0 || height === 0) return;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function update3DScene() {
  if (currentObject) {
    scene.remove(currentObject);
    if ((currentObject as THREE.Mesh).geometry) {
      (currentObject as THREE.Mesh).geometry.dispose();
    }
  }

  const charDisplay = document.getElementById('current-char-display');
  if (charDisplay) {
    charDisplay.textContent = currentChar;
  }

  if (currentMode === 'single') {
    currentObject = createTriglavianMesh(
      currentChar,
      { preset: currentPreset },
      { depth, bevelThickness, bevelSize: bevelThickness * 0.75 }
    );
  } else {
    currentObject = createTriglavianTextGroup(currentText, {
      spacing: 7.5,
      materialOptions: { preset: currentPreset },
      extrudeOptions: { depth, bevelThickness, bevelSize: bevelThickness * 0.75 }
    });
  }

  scene.add(currentObject);

  if (currentMode === 'text' && currentText.length > 3) {
    controls.target.set(0, 0, 0);
  }
}

// ============================================================================
// 3. Tool 1: Grapheme Matrix
// ============================================================================

let matrixActiveCategory = 'all';
let matrixSearchQuery = '';

function renderMatrixGrid() {
  const grid = document.getElementById('matrix-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const filtered = ALL_CHARACTERS.filter(char => {
    const cat = getGlyphCategory(char);
    if (matrixActiveCategory !== 'all' && cat !== matrixActiveCategory) {
      return false;
    }
    if (matrixSearchQuery) {
      const q = matrixSearchQuery.toLowerCase();
      const safe = getGlyphSafeName(char).toLowerCase();
      const hex = `u+${char.charCodeAt(0).toString(16).toLowerCase()}`;
      if (!char.toLowerCase().includes(q) && !safe.includes(q) && !hex.includes(q)) {
        return false;
      }
    }
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-dim); font-family: var(--font-tech); font-size: 1.1rem;">
        No graphemes matched "${matrixSearchQuery}" in category "${matrixActiveCategory}".
      </div>
    `;
    return;
  }

  for (const char of filtered) {
    const card = document.createElement('div');
    card.className = `glyph-card${char === currentChar ? ' selected' : ''}`;
    card.dataset.char = char;

    const safeName = getGlyphSafeName(char);
    const hex = `U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`;
    const svgMarkup = generateSvg(char, { width: 52, height: 52, fill: '#ff1e38' });

    card.innerHTML = `
      <div class="glyph-preview-box">${svgMarkup}</div>
      <div class="glyph-meta">
        <span class="glyph-char">${char}</span>
        <span class="glyph-hex">${hex}</span>
      </div>
      <div class="glyph-name">${safeName}</div>
      <div class="glyph-card-actions">
        <button class="btn-card-action btn-act-3d" title="Inspect in 3D">3D View</button>
        <button class="btn-card-action btn-act-type" title="Insert to Transcriber">Type</button>
        <button class="btn-card-action btn-act-svg" title="Download SVG">SVG</button>
      </div>
    `;

    // Click on card body
    card.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('.btn-card-action')) return; // Handled separately
      selectCharFor3D(char);
    });

    // 3D View button
    card.querySelector('.btn-act-3d')?.addEventListener('click', () => {
      selectCharFor3D(char);
    });

    // Type button
    card.querySelector('.btn-act-type')?.addEventListener('click', () => {
      const input = document.getElementById('editor-latin-input') as HTMLTextAreaElement;
      if (input) {
        input.value += char;
        updateTranscriber();
        setActiveTab('editor');
        showToast(`Appended '${char}' to transcriber`, '⌨');
      }
    });

    // SVG download button
    card.querySelector('.btn-act-svg')?.addEventListener('click', () => {
      const svgStr = generateSvg(char, { fill: '#ffffff' });
      triggerDownload(new Blob([svgStr], { type: 'image/svg+xml' }), `${safeName}.svg`);
      showToast(`Downloaded ${safeName}.svg`, '⬇');
    });

    grid.appendChild(card);
  }
}

function selectCharFor3D(char: string) {
  currentChar = char;
  currentMode = 'single';
  syncModeUI();
  document.querySelectorAll('.glyph-card').forEach(c => {
    c.classList.toggle('selected', (c as HTMLElement).dataset.char === char);
  });
  setActiveTab('viewer');
  update3DScene();
  showToast(`Loaded '${char}' in 3D Viewport`, '🧊');
}

// ============================================================================
// 4. Tool 2: Bilingual Text Editor & Transcriber
// ============================================================================

function updateTranscriber() {
  const input = document.getElementById('editor-latin-input') as HTMLTextAreaElement;
  const countEl = document.getElementById('editor-char-count')!;
  const statusEl = document.getElementById('editor-char-status')!;
  const warningEl = document.getElementById('unsupported-warning')!;
  const warningMsg = document.getElementById('unsupported-msg')!;
  const outputEl = document.getElementById('editor-triglavian-output')!;

  if (!input || !outputEl) return;
  const text = input.value;

  // Character Count
  countEl.textContent = `${text.length} / 500 CHARACTERS`;

  // Validate supported characters
  const unsupportedChars = new Set<string>();
  for (const char of text) {
    if (char !== ' ' && char !== '\n' && !GLYPHS_DATA[char]) {
      unsupportedChars.add(char);
    }
  }

  if (unsupportedChars.size > 0) {
    const list = Array.from(unsupportedChars).map(c => `'${c}'`).join(', ');
    statusEl.className = 'status-badge warn';
    statusEl.textContent = `${unsupportedChars.size} UNSUPPORTED`;
    warningEl.style.display = 'flex';
    warningMsg.textContent = `The following characters have no Triglavian equivalent: ${list}. They will be skipped.`;
  } else {
    statusEl.className = 'status-badge valid';
    statusEl.textContent = '100% COMPATIBLE';
    warningEl.style.display = 'none';
  }

  // Update Output Stage Styling
  outputEl.style.fontSize = `${editorFontSize}px`;
  outputEl.style.letterSpacing = `${editorLetterSpacing}px`;
  outputEl.style.textAlign = editorAlign;
  outputEl.style.color = editorColor;
  outputEl.style.textShadow = `0 0 16px ${editorColor}`;

  if (editorRenderMode === 'font') {
    outputEl.className = 'triglavian-output-stage font-mode';
    outputEl.textContent = text || ' ';
  } else {
    outputEl.className = 'triglavian-output-stage vector-mode';
    outputEl.innerHTML = '';

    if (!text.trim()) {
      outputEl.innerHTML = `<span style="color: var(--text-dim); font-size: 1rem; letter-spacing: 1px;">Awaiting input...</span>`;
      return;
    }

    const lines = text.split('\n');
    lines.forEach((line, lIdx) => {
      for (const char of line) {
        if (char === ' ') {
          const space = document.createElement('span');
          space.className = 'vector-space-inline';
          space.style.width = `${Math.max(16, editorFontSize * 0.45)}px`;
          outputEl.appendChild(space);
        } else if (GLYPHS_DATA[char]) {
          const wrapper = document.createElement('span');
          wrapper.className = 'vector-glyph-inline';
          wrapper.innerHTML = generateSvg(char, {
            width: editorFontSize,
            height: editorFontSize,
            fill: editorColor
          });
          outputEl.appendChild(wrapper);
        }
      }
      if (lIdx < lines.length - 1) {
        const breakEl = document.createElement('div');
        breakEl.className = 'vector-newline-break';
        outputEl.appendChild(breakEl);
      }
    });
  }
}

// ============================================================================
// 5. Setup Event Listeners
// ============================================================================

function setupEventListeners() {
  // Navigation Tabs
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = (e.currentTarget as HTMLElement).dataset.tab as any;
      if (tab) setActiveTab(tab);
    });
  });

  // Buttons with data-nav attribute
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = (e.currentTarget as HTMLElement).dataset.nav as any;
      if (tab) setActiveTab(tab);
    });
  });

  // Category Filters (Matrix)
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget as HTMLElement;
      target.classList.add('active');
      matrixActiveCategory = target.dataset.cat || 'all';
      renderMatrixGrid();
    });
  });

  // Search Input (Matrix)
  const searchInput = document.getElementById('matrix-search') as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      matrixSearchQuery = (e.target as HTMLInputElement).value.trim();
      renderMatrixGrid();
    });
  }

  // Text Transcriber: Textarea Input
  const latinInput = document.getElementById('editor-latin-input') as HTMLTextAreaElement;
  if (latinInput) {
    latinInput.addEventListener('input', updateTranscriber);
  }

  // Clear Transcriber Button
  document.getElementById('btn-editor-clear')?.addEventListener('click', () => {
    if (latinInput) {
      latinInput.value = '';
      updateTranscriber();
      latinInput.focus();
    }
  });

  // Preset Chips
  document.querySelectorAll('.preset-chips .chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const phrase = (e.currentTarget as HTMLElement).dataset.phrase;
      if (phrase && latinInput) {
        latinInput.value = phrase;
        updateTranscriber();
        showToast(`Loaded preset: "${phrase}"`, '⌨');
      }
    });
  });

  // Display Mode Selector (Font vs. Vector)
  const btnModeFont = document.getElementById('btn-mode-font')!;
  const btnModeVector = document.getElementById('btn-mode-vector')!;
  btnModeFont.addEventListener('click', () => {
    editorRenderMode = 'font';
    btnModeFont.classList.add('active');
    btnModeVector.classList.remove('active');
    updateTranscriber();
  });
  btnModeVector.addEventListener('click', () => {
    editorRenderMode = 'vector';
    btnModeVector.classList.add('active');
    btnModeFont.classList.remove('active');
    updateTranscriber();
  });

  // Transcriber Visual Controls
  const fontSizeSlider = document.getElementById('editor-font-size') as HTMLInputElement;
  const fontSizeVal = document.getElementById('val-font-size')!;
  fontSizeSlider?.addEventListener('input', () => {
    editorFontSize = parseInt(fontSizeSlider.value, 10);
    fontSizeVal.textContent = `${editorFontSize}px`;
    updateTranscriber();
  });

  const letterSpacingSlider = document.getElementById('editor-letter-spacing') as HTMLInputElement;
  const letterSpacingVal = document.getElementById('val-letter-spacing')!;
  letterSpacingSlider?.addEventListener('input', () => {
    editorLetterSpacing = parseInt(letterSpacingSlider.value, 10);
    letterSpacingVal.textContent = `${editorLetterSpacing}px`;
    updateTranscriber();
  });

  // Color Palette Dots
  document.querySelectorAll('.color-dot').forEach(dot => {
    dot.addEventListener('click', (e) => {
      document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
      const target = e.currentTarget as HTMLElement;
      target.classList.add('active');
      editorColor = target.dataset.color || '#ff1e38';
      updateTranscriber();
    });
  });

  // Align Buttons
  document.querySelectorAll('.align-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.align-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget as HTMLElement;
      target.classList.add('active');
      editorAlign = (target.dataset.align as any) || 'left';
      updateTranscriber();
    });
  });

  // Copy English
  document.getElementById('btn-copy-latin')?.addEventListener('click', async () => {
    if (latinInput) {
      await navigator.clipboard.writeText(latinInput.value);
      showToast('English text copied to clipboard', '📋');
    }
  });

  // Copy Triglavian Unicode
  document.getElementById('btn-copy-triglavian')?.addEventListener('click', async () => {
    if (latinInput) {
      await navigator.clipboard.writeText(latinInput.value);
      showToast('Triglavian script copied to clipboard', '📋');
    }
  });

  // Send to 3D Viewer
  document.getElementById('btn-editor-to-3d')?.addEventListener('click', () => {
    if (!latinInput) return;
    const text = latinInput.value.trim() || 'TRIGLAVIAN';
    currentText = text.slice(0, 24); // Limit for 3D layout bounds
    currentMode = 'text';

    const composerInput = document.getElementById('composer-input') as HTMLInputElement;
    if (composerInput) composerInput.value = currentText;

    syncModeUI();
    setActiveTab('viewer');
    update3DScene();
    showToast(`Transferred "${currentText}" to 3D Viewport`, '🧊');
  });

  // Export Composed SVG
  document.getElementById('btn-editor-export-svg')?.addEventListener('click', () => {
    if (!latinInput) return;
    const text = latinInput.value.trim() || 'TRIGLAVIAN';
    const svgStr = generateTextSvg(text, { fill: editorColor, letterSpacing: editorLetterSpacing * 15 });
    triggerDownload(new Blob([svgStr], { type: 'image/svg+xml' }), 'triglavian-composed.svg');
    showToast('Exported composed SVG banner', '⬇');
  });

  // 3D Viewport Controls (Tab 3)
  document.getElementById('tab-single')!.addEventListener('click', () => {
    currentMode = 'single';
    syncModeUI();
    update3DScene();
  });

  document.getElementById('tab-text')!.addEventListener('click', () => {
    currentMode = 'text';
    syncModeUI();
    update3DScene();
  });

  const textInput = document.getElementById('composer-input') as HTMLInputElement;
  textInput.addEventListener('input', (e) => {
    currentText = (e.target as HTMLInputElement).value || 'TRIGLAVIAN';
    if (currentMode === 'text') update3DScene();
  });

  const depthSlider = document.getElementById('slider-depth') as HTMLInputElement;
  const depthValue = document.getElementById('val-depth')!;
  depthSlider.addEventListener('input', () => {
    depth = parseFloat(depthSlider.value);
    depthValue.textContent = `${depth} UPM`;
    update3DScene();
  });

  const bevelSlider = document.getElementById('slider-bevel') as HTMLInputElement;
  const bevelValue = document.getElementById('val-bevel')!;
  bevelSlider.addEventListener('input', () => {
    bevelThickness = parseFloat(bevelSlider.value);
    bevelValue.textContent = `${bevelThickness} UPM`;
    update3DScene();
  });

  // Preset Buttons (3D)
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget as HTMLElement;
      target.classList.add('active');
      currentPreset = target.dataset.preset as MaterialPreset;
      update3DScene();
    });
  });

  // Viewport overlays
  const rotateBtn = document.getElementById('btn-autorotate')!;
  rotateBtn.addEventListener('click', () => {
    autoRotate = !autoRotate;
    controls.autoRotate = autoRotate;
    rotateBtn.classList.toggle('active', autoRotate);
  });

  const gridBtn = document.getElementById('btn-toggle-grid')!;
  gridBtn.addEventListener('click', () => {
    showGrid = !showGrid;
    gridHelper.visible = showGrid;
    gridBtn.classList.toggle('active', showGrid);
  });

  document.getElementById('btn-reset-cam')!.addEventListener('click', () => {
    camera.position.set(0, 4, 18);
    controls.target.set(0, 0, 0);
  });

  // Export 3D Models
  document.getElementById('btn-export-glb')!.addEventListener('click', async () => {
    if (!currentObject) return;
    const buf = await exportToGLB(currentObject);
    const name = currentMode === 'single' ? getGlyphSafeName(currentChar) : 'triglavian_text';
    triggerDownload(new Blob([buf], { type: 'model/gltf-binary' }), `${name}.glb`);
    showToast(`Exported ${name}.glb`, '⬇');
  });

  document.getElementById('btn-export-obj')!.addEventListener('click', () => {
    if (!currentObject) return;
    const objStr = exportToOBJ(currentObject);
    const name = currentMode === 'single' ? getGlyphSafeName(currentChar) : 'triglavian_text';
    triggerDownload(new Blob([objStr], { type: 'text/plain' }), `${name}.obj`);
    showToast(`Exported ${name}.obj`, '⬇');
  });

  document.getElementById('btn-export-stl')!.addEventListener('click', () => {
    if (!currentObject) return;
    const stlStr = exportToSTL(currentObject);
    const name = currentMode === 'single' ? getGlyphSafeName(currentChar) : 'triglavian_text';
    triggerDownload(new Blob([stlStr as string], { type: 'text/plain' }), `${name}.stl`);
    showToast(`Exported ${name}.stl`, '⬇');
  });

  document.getElementById('btn-export-svg')!.addEventListener('click', () => {
    const svgStr = generateSvg(currentChar);
    const name = getGlyphSafeName(currentChar);
    triggerDownload(new Blob([svgStr], { type: 'image/svg+xml' }), `${name}.svg`);
    showToast(`Exported ${name}.svg`, '⬇');
  });

  document.getElementById('btn-export-font')!.addEventListener('click', () => {
    const font = generateTypefaceJson();
    const jsonStr = JSON.stringify(font, null, 2);
    triggerDownload(new Blob([jsonStr], { type: 'application/json' }), 'triglavian.typeface.json');
    showToast('Exported triglavian.typeface.json', '⬇');
  });

  // Downloads Section Downloads
  document.getElementById('btn-download-typeface')?.addEventListener('click', () => {
    const font = generateTypefaceJson();
    const jsonStr = JSON.stringify(font, null, 2);
    triggerDownload(new Blob([jsonStr], { type: 'application/json' }), 'triglavian.typeface.json');
    showToast('Downloaded triglavian.typeface.json', '⬇');
  });

  // Download All 81 SVGs as a single ZIP archive!
  document.getElementById('btn-download-all-svgs')?.addEventListener('click', () => {
    showToast('Generating 81 SVGs ZIP package...', '⚡');
    setTimeout(() => {
      const files = ALL_CHARACTERS.map(char => ({
        filename: `${getGlyphSafeName(char)}.svg`,
        data: generateSvg(char, { fill: '#FFFFFF' })
      }));
      const zipBlob = createZipArchive(files);
      triggerDownload(zipBlob, 'triglavian-svgs.zip');
      showToast('Downloaded triglavian-svgs.zip (81 glyphs)', '⬇');
    }, 50);
  });
}

function syncModeUI() {
  const tabSingle = document.getElementById('tab-single')!;
  const tabText = document.getElementById('tab-text')!;
  const singleControls = document.getElementById('single-char-controls')!;
  const textControls = document.getElementById('text-composer-controls')!;

  if (currentMode === 'single') {
    tabSingle.classList.add('active');
    tabText.classList.remove('active');
    singleControls.style.display = 'block';
    textControls.style.display = 'none';
  } else {
    tabSingle.classList.remove('active');
    tabText.classList.add('active');
    singleControls.style.display = 'none';
    textControls.style.display = 'block';
  }
}

// ============================================================================
// 6. Bootstrap Application
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
  initThree();
  renderMatrixGrid();
  setupEventListeners();
  updateTranscriber();
  update3DScene();

  // Support URL Hash Deep Linking
  const hash = window.location.hash.replace('#', '') as any;
  if (['overview', 'editor', 'viewer', 'downloads'].includes(hash)) {
    setActiveTab(hash);
  }
});
