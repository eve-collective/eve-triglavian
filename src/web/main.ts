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
let editorTransparentBg = true;
let editorGlowEnabled = true;

// Lighting State
type LightPreset = 'studio' | 'abyssal' | 'horizon' | 'neon';
let currentLightPreset: LightPreset = 'studio';
let lightIntensity = 1.4;
let headlightEnabled = true;

// Three.js Core
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let gridHelper: THREE.GridHelper;
let currentObject: THREE.Object3D | null = null;

// Lighting Objects
let hemiLight: THREE.HemisphereLight;
let mainKeyLight: THREE.DirectionalLight;
let leftFillLight: THREE.DirectionalLight;
let rightFillLight: THREE.DirectionalLight;
let rimLight: THREE.DirectionalLight;
let bottomFillLight: THREE.PointLight;
let cameraHeadlight: THREE.DirectionalLight;

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
    requestAnimationFrame(() => {
      onWindowResize();
      update3DScene();
    });
    setTimeout(() => {
      onWindowResize();
      update3DScene();
    }, 60);
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
  // Clear scene fog so large/wide text strings remain fully illuminated and crisp across any distance

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

  // Setup Adaptive Multi-Light Rig
  hemiLight = new THREE.HemisphereLight(0xfff8f2, 0x1f2530, 0.9);
  scene.add(hemiLight);

  mainKeyLight = new THREE.DirectionalLight(0xffffff, 1.8);
  mainKeyLight.position.set(0, 20, 20);
  mainKeyLight.castShadow = true;
  mainKeyLight.shadow.mapSize.width = 1024;
  mainKeyLight.shadow.mapSize.height = 1024;
  scene.add(mainKeyLight);

  leftFillLight = new THREE.DirectionalLight(0xffeded, 1.4);
  leftFillLight.position.set(-15, 12, 16);
  scene.add(leftFillLight);

  rightFillLight = new THREE.DirectionalLight(0xffeded, 1.4);
  rightFillLight.position.set(15, 12, 16);
  scene.add(rightFillLight);

  rimLight = new THREE.DirectionalLight(0xff3b52, 1.8);
  rimLight.position.set(0, 16, -20);
  scene.add(rimLight);

  bottomFillLight = new THREE.PointLight(0xff6622, 0.7, 0);
  bottomFillLight.position.set(0, -6, 5);
  scene.add(bottomFillLight);

  // Camera Follow-Light (Headlight ensures face in view is never dark)
  cameraHeadlight = new THREE.DirectionalLight(0xffffff, 0.85);
  cameraHeadlight.position.set(0, 0, 0);
  cameraHeadlight.target.position.set(0, 0, -1);
  camera.add(cameraHeadlight);
  camera.add(cameraHeadlight.target);
  scene.add(camera);

  // Add light targets to scene for accurate world transforms
  scene.add(mainKeyLight.target);
  scene.add(leftFillLight.target);
  scene.add(rightFillLight.target);
  scene.add(rimLight.target);

  applyLightingPreset();

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

function applyLightingPreset() {
  if (!mainKeyLight) return;

  switch (currentLightPreset) {
    case 'studio':
      // Studio Wide: Balanced, broad, non-decaying illumination for wide text lines
      hemiLight.color.setHex(0xfff8f2);
      hemiLight.groundColor.setHex(0x1f2530);
      hemiLight.intensity = 0.95 * lightIntensity;

      mainKeyLight.color.setHex(0xffffff);
      mainKeyLight.intensity = 1.8 * lightIntensity;

      leftFillLight.color.setHex(0xffeded);
      leftFillLight.intensity = 1.4 * lightIntensity;

      rightFillLight.color.setHex(0xffeded);
      rightFillLight.intensity = 1.4 * lightIntensity;

      rimLight.color.setHex(0xff3b52);
      rimLight.intensity = 1.8 * lightIntensity;

      bottomFillLight.color.setHex(0xff6622);
      bottomFillLight.intensity = 0.7 * lightIntensity;

      cameraHeadlight.color.setHex(0xffffff);
      cameraHeadlight.intensity = 0.85 * lightIntensity;
      renderer.toneMappingExposure = 1.25;
      break;

    case 'abyssal':
      // Abyssal Noir: Moody, high-contrast, deep crimson plasma glow
      hemiLight.color.setHex(0x2b060d);
      hemiLight.groundColor.setHex(0x06080c);
      hemiLight.intensity = 0.4 * lightIntensity;

      mainKeyLight.color.setHex(0xffdddd);
      mainKeyLight.intensity = 1.2 * lightIntensity;

      leftFillLight.color.setHex(0xff1e38);
      leftFillLight.intensity = 2.5 * lightIntensity;

      rightFillLight.color.setHex(0xff3b52);
      rightFillLight.intensity = 2.2 * lightIntensity;

      rimLight.color.setHex(0xff0025);
      rimLight.intensity = 4.2 * lightIntensity;

      bottomFillLight.color.setHex(0xff1100);
      bottomFillLight.intensity = 1.0 * lightIntensity;

      cameraHeadlight.color.setHex(0xffe0e0);
      cameraHeadlight.intensity = 0.35 * lightIntensity;
      renderer.toneMappingExposure = 1.1;
      break;

    case 'horizon':
      // Broad Horizon: Ultra-uniform, high-ambient daylight illumination (no dark spots)
      hemiLight.color.setHex(0xffffff);
      hemiLight.groundColor.setHex(0x5a6575);
      hemiLight.intensity = 1.6 * lightIntensity;

      mainKeyLight.color.setHex(0xffffff);
      mainKeyLight.intensity = 2.0 * lightIntensity;

      leftFillLight.color.setHex(0xf5f8ff);
      leftFillLight.intensity = 1.8 * lightIntensity;

      rightFillLight.color.setHex(0xf5f8ff);
      rightFillLight.intensity = 1.8 * lightIntensity;

      rimLight.color.setHex(0xffffff);
      rimLight.intensity = 1.6 * lightIntensity;

      bottomFillLight.color.setHex(0xffffff);
      bottomFillLight.intensity = 0.9 * lightIntensity;

      cameraHeadlight.color.setHex(0xffffff);
      cameraHeadlight.intensity = 1.2 * lightIntensity;
      renderer.toneMappingExposure = 1.35;
      break;

    case 'neon':
      // Dual Chroma: Cyberpunk electric crimson on left, vibrant cyan on right
      hemiLight.color.setHex(0x0c1424);
      hemiLight.groundColor.setHex(0x000000);
      hemiLight.intensity = 0.5 * lightIntensity;

      mainKeyLight.color.setHex(0xffffff);
      mainKeyLight.intensity = 1.2 * lightIntensity;

      leftFillLight.color.setHex(0xff1e38);
      leftFillLight.intensity = 3.2 * lightIntensity; // Deep Crimson

      rightFillLight.color.setHex(0x00f0ff);
      rightFillLight.intensity = 3.2 * lightIntensity; // Electric Cyan

      rimLight.color.setHex(0xff9100);
      rimLight.intensity = 2.4 * lightIntensity; // Amber backlight

      bottomFillLight.color.setHex(0xaa00ff);
      bottomFillLight.intensity = 0.9 * lightIntensity;

      cameraHeadlight.color.setHex(0xffffff);
      cameraHeadlight.intensity = 0.5 * lightIntensity;
      renderer.toneMappingExposure = 1.2;
      break;
  }

  cameraHeadlight.visible = headlightEnabled;

  // Sync UI labels and buttons
  const labelEl = document.getElementById('label-active-light');
  if (labelEl) {
    const names: Record<LightPreset, string> = {
      studio: 'Studio Wide',
      abyssal: 'Abyssal Noir',
      horizon: 'Broad Horizon',
      neon: 'Dual Chroma'
    };
    labelEl.textContent = names[currentLightPreset];
  }

  document.querySelectorAll('.light-preset-btn').forEach(btn => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.light === currentLightPreset);
  });
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

  // Calculate object bounding box to dynamically adjust lighting spread & camera
  const box = new THREE.Box3().setFromObject(currentObject);
  const size = box.getSize(new THREE.Vector3());
  const textWidth = Math.max(size.x, 14);

  // Dynamically spread lateral fill lights across the width of the geometry
  leftFillLight.position.set(-textWidth * 0.55, 16, Math.max(16, textWidth * 0.2));
  leftFillLight.target.position.set(-textWidth * 0.25, 0, 0);
  rightFillLight.position.set(textWidth * 0.55, 16, Math.max(16, textWidth * 0.2));
  rightFillLight.target.position.set(textWidth * 0.25, 0, 0);
  mainKeyLight.position.set(0, 22, Math.max(20, textWidth * 0.35));
  rimLight.position.set(0, 18, -Math.max(18, textWidth * 0.35));

  // Scale grid floor helper to frame the text nicely
  const gridScale = Math.max(1, textWidth / 28);
  gridHelper.scale.set(gridScale, 1, gridScale);

  if (currentMode === 'text') {
    const desiredZ = Math.max(18, textWidth * 0.95);
    camera.position.set(0, Math.max(4, textWidth * 0.12), desiredZ);
    camera.lookAt(0, 0, 0);
    controls.maxDistance = Math.max(100, desiredZ * 3);
    controls.target.set(0, 0, 0);
    controls.update();
  } else {
    controls.maxDistance = 60;
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
    `;

    // Click anywhere on card to select and inspect in 3D
    card.addEventListener('click', () => {
      selectCharFor3D(char);
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
  outputEl.style.textShadow = editorGlowEnabled ? `0 0 16px ${editorColor}` : 'none';
  outputEl.style.background = editorTransparentBg ? 'transparent' : 'rgba(6, 8, 12, 0.95)';

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

/**
 * Render the composed Triglavian text into a high-resolution PNG Blob
 * supporting transparent background and custom plasma glow.
 */
async function createComposedPngBlob(options: {
  transparent: boolean;
  glow: boolean;
}): Promise<Blob> {
  const input = document.getElementById('editor-latin-input') as HTMLTextAreaElement;
  const text = (input?.value.trim()) || 'TRIGLAVIAN';

  const svgStr = generateTextSvg(text, {
    fill: editorColor,
    letterSpacing: editorLetterSpacing * 15,
    padding: 120
  });

  const match = svgStr.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
  const origW = match ? parseFloat(match[1]) : 1200;
  const origH = match ? parseFloat(match[2]) : 600;

  const targetWidth = Math.min(3840, Math.max(1200, Math.round(origW * 0.85)));
  const scale = targetWidth / origW;
  const targetHeight = Math.round(origH * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  if (!options.transparent) {
    ctx.fillStyle = '#06080c';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else {
    ctx.clearRect(0, 0, targetWidth, targetHeight);
  }

  const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();

  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      if (options.glow) {
        ctx.shadowColor = editorColor;
        ctx.shadowBlur = 36 * scale;
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        ctx.shadowBlur = 16 * scale;
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      }
      ctx.shadowBlur = 0;
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to rasterize SVG into Image'));
    };
    img.src = url;
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create PNG blob from canvas'));
    }, 'image/png');
  });
}

/**
 * Copy composed high-resolution PNG image directly to clipboard
 */
async function copyImageToClipboard() {
  try {
    showToast('Rendering high-res image...', '⏳');
    const blob = await createComposedPngBlob({
      transparent: editorTransparentBg,
      glow: editorGlowEnabled
    });

    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      const modeDesc = `${editorTransparentBg ? 'Transparent' : 'Dark BG'}, ${editorGlowEnabled ? 'Glow ON' : 'Glow OFF'}`;
      showToast(`Copied image to clipboard (${modeDesc})`, '📸');
    } else {
      triggerDownload(blob, 'triglavian-text.png');
      showToast('Clipboard API unavailable; downloaded PNG instead', '⬇');
    }
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    showToast('Failed to copy image to clipboard', '✕');
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

  // Copy High-Res PNG Image to Clipboard
  document.getElementById('btn-copy-image')?.addEventListener('click', () => {
    copyImageToClipboard();
  });

  // Toggle Transparent vs Dark Background
  const btnToggleTransparent = document.getElementById('btn-toggle-transparent');
  const labelTransparent = document.getElementById('label-transparent');
  btnToggleTransparent?.addEventListener('click', () => {
    editorTransparentBg = !editorTransparentBg;
    btnToggleTransparent.classList.toggle('active', editorTransparentBg);
    if (labelTransparent) {
      labelTransparent.textContent = editorTransparentBg ? 'Transparent BG' : 'Dark BG';
    }
    updateTranscriber();
    showToast(`Background set to: ${editorTransparentBg ? 'Transparent' : 'Dark Abyssal'}`, '◻');
  });

  // Toggle Glow Effect
  const btnToggleGlow = document.getElementById('btn-toggle-glow');
  const labelGlow = document.getElementById('label-glow');
  btnToggleGlow?.addEventListener('click', () => {
    editorGlowEnabled = !editorGlowEnabled;
    btnToggleGlow.classList.toggle('active', editorGlowEnabled);
    if (labelGlow) {
      labelGlow.textContent = editorGlowEnabled ? 'Glow: ON' : 'Glow: OFF';
    }
    updateTranscriber();
    showToast(`Glow effect: ${editorGlowEnabled ? 'ENABLED' : 'DISABLED'}`, '✨');
  });

  // Export Rasterized PNG File
  document.getElementById('btn-editor-export-png')?.addEventListener('click', async () => {
    try {
      showToast('Rendering PNG image...', '⏳');
      const blob = await createComposedPngBlob({
        transparent: editorTransparentBg,
        glow: editorGlowEnabled
      });
      triggerDownload(blob, 'triglavian-composed.png');
      showToast('Downloaded triglavian-composed.png', '⬇');
    } catch {
      showToast('Failed to generate PNG image', '✕');
    }
  });

  // Send to 3D Viewer
  document.getElementById('btn-editor-to-3d')?.addEventListener('click', () => {
    if (!latinInput) return;
    const text = latinInput.value.trim() || 'TRIGLAVIAN';
    currentText = text.slice(0, 48); // Extended bounds for long phrases
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

  // Lighting Rig Controls
  document.querySelectorAll('.light-preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.light-preset-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget as HTMLElement;
      target.classList.add('active');
      currentLightPreset = target.dataset.light as LightPreset;
      applyLightingPreset();
      showToast(`Activated ${target.textContent?.trim()} Lighting Rig`, '💡');
    });
  });

  const lightIntensitySlider = document.getElementById('slider-light-intensity') as HTMLInputElement;
  const lightIntensityVal = document.getElementById('val-light-intensity');
  lightIntensitySlider?.addEventListener('input', () => {
    lightIntensity = parseFloat(lightIntensitySlider.value);
    if (lightIntensityVal) lightIntensityVal.textContent = `${lightIntensity.toFixed(1)}x`;
    applyLightingPreset();
  });

  const toggleHeadlightBtn = document.getElementById('btn-toggle-headlight');
  toggleHeadlightBtn?.addEventListener('click', () => {
    headlightEnabled = !headlightEnabled;
    toggleHeadlightBtn.classList.toggle('active', headlightEnabled);
    toggleHeadlightBtn.textContent = headlightEnabled ? 'ENABLED' : 'DISABLED';
    applyLightingPreset();
    showToast(`Camera Headlight: ${headlightEnabled ? 'ENABLED' : 'DISABLED'}`, '💡');
  });

  // Viewport Quick Cycle Button
  const cycleLightBtn = document.getElementById('btn-cycle-light');
  cycleLightBtn?.addEventListener('click', () => {
    const presets: LightPreset[] = ['studio', 'abyssal', 'horizon', 'neon'];
    const nextIdx = (presets.indexOf(currentLightPreset) + 1) % presets.length;
    currentLightPreset = presets[nextIdx];
    applyLightingPreset();
    showToast(`Switched lighting: ${currentLightPreset.toUpperCase()}`, '💡');
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
