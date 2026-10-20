import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  CHARACTER_ROWS,
  ALL_CHARACTERS,
  getGlyphCategory,
  getGlyphSafeName,
  DEFAULT_DEPTH,
  DEFAULT_BEVEL_THICKNESS,
  DEFAULT_BEVEL_SIZE
} from '../constants';
import {
  createTriglavianMesh,
  createTriglavianTextGroup
} from '../geometry';
import { generateSvg } from '../svg';
import { generateTypefaceJson } from '../typeface';
import { exportToGLB, exportToOBJ, exportToSTL } from '../exporters';
import { MaterialPreset } from '../types';

// State
let currentChar = 'A';
let currentMode: 'single' | 'text' = 'single';
let currentText = 'TRIGLAVIAN';
let currentPreset: MaterialPreset = 'plasma';
let depth = DEFAULT_DEPTH;
let bevelThickness = DEFAULT_BEVEL_THICKNESS;
let autoRotate = true;

// Three.js Core
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let currentObject: THREE.Object3D | null = null;

function initThree() {
  const container = document.getElementById('canvas3d-container')!;
  const width = container.clientWidth;
  const height = container.clientHeight;

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
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
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

  // Subtle orange fill light from below
  const fillLight = new THREE.PointLight(0xff5511, 1.2, 50);
  fillLight.position.set(0, -6, 5);
  scene.add(fillLight);

  // Decorative Grid Floor
  const gridHelper = new THREE.GridHelper(40, 40, 0xff1e42, 0x1f2530);
  gridHelper.position.y = -4.5;
  (gridHelper.material as THREE.Material).transparent = true;
  (gridHelper.material as THREE.Material).opacity = 0.35;
  scene.add(gridHelper);

  window.addEventListener('resize', onWindowResize);
  animate();
}

function onWindowResize() {
  const container = document.getElementById('canvas3d-container')!;
  if (!container) return;
  const width = container.clientWidth;
  const height = container.clientHeight;
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

  // Adjust camera distance if rendering composed text
  if (currentMode === 'text' && currentText.length > 3) {
    const desiredDist = Math.max(16, currentText.length * 3.8);
    controls.target.set(0, 0, 0);
  }
}

// Download Helper
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

function renderGlyphMatrix() {
  const matrixContainer = document.getElementById('matrix-rows-container')!;
  matrixContainer.innerHTML = '';

  const rowLabels = [
    'Uppercase A – M',
    'Lowercase a – m',
    'Uppercase N – Z',
    'Lowercase n – z',
    'Numerals 1 – 0',
    'Symbols: Row 1',
    'Symbols: Row 2'
  ];

  CHARACTER_ROWS.forEach((row, rIdx) => {
    const rowTitle = document.createElement('div');
    rowTitle.className = 'matrix-row-title';
    rowTitle.textContent = rowLabels[rIdx];
    matrixContainer.appendChild(rowTitle);

    const rowGrid = document.createElement('div');
    rowGrid.className = 'glyph-row-grid';

    row.forEach(char => {
      const tile = document.createElement('div');
      tile.className = `glyph-tile${char === currentChar ? ' selected' : ''}`;
      tile.dataset.char = char;

      // Inline SVG markup
      const svg = generateSvg(char, { width: 36, height: 36 });
      tile.innerHTML = `
        ${svg}
        <span class="glyph-char-label">${char}</span>
      `;

      tile.addEventListener('click', () => {
        currentChar = char;
        currentMode = 'single';
        syncModeUI();
        document.querySelectorAll('.glyph-tile').forEach(t => t.classList.remove('selected'));
        tile.classList.add('selected');
        update3DScene();
      });

      rowGrid.appendChild(tile);
    });

    matrixContainer.appendChild(rowGrid);
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

function setupEventListeners() {
  // Mode switcher
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

  // Text composer input
  const textInput = document.getElementById('composer-input') as HTMLInputElement;
  textInput.addEventListener('input', (e) => {
    currentText = (e.target as HTMLInputElement).value || 'TRIGLAVIAN';
    if (currentMode === 'text') {
      update3DScene();
    }
  });

  // Slider controls
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

  // Preset Buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      const target = (e.currentTarget as HTMLElement);
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

  document.getElementById('btn-reset-cam')!.addEventListener('click', () => {
    camera.position.set(0, 4, 18);
    controls.target.set(0, 0, 0);
  });

  // Export Buttons
  document.getElementById('btn-export-glb')!.addEventListener('click', async () => {
    if (!currentObject) return;
    const buf = await exportToGLB(currentObject);
    const name = currentMode === 'single' ? getGlyphSafeName(currentChar) : 'triglavian_text';
    triggerDownload(new Blob([buf], { type: 'model/gltf-binary' }), `${name}.glb`);
  });

  document.getElementById('btn-export-obj')!.addEventListener('click', () => {
    if (!currentObject) return;
    const objStr = exportToOBJ(currentObject);
    const name = currentMode === 'single' ? getGlyphSafeName(currentChar) : 'triglavian_text';
    triggerDownload(new Blob([objStr], { type: 'text/plain' }), `${name}.obj`);
  });

  document.getElementById('btn-export-stl')!.addEventListener('click', () => {
    if (!currentObject) return;
    const stlStr = exportToSTL(currentObject);
    const name = currentMode === 'single' ? getGlyphSafeName(currentChar) : 'triglavian_text';
    triggerDownload(new Blob([stlStr as string], { type: 'text/plain' }), `${name}.stl`);
  });

  document.getElementById('btn-export-svg')!.addEventListener('click', () => {
    const svgStr = generateSvg(currentChar);
    const name = getGlyphSafeName(currentChar);
    triggerDownload(new Blob([svgStr], { type: 'image/svg+xml' }), `${name}.svg`);
  });

  document.getElementById('btn-export-font')!.addEventListener('click', () => {
    const font = generateTypefaceJson();
    const jsonStr = JSON.stringify(font, null, 2);
    triggerDownload(new Blob([jsonStr], { type: 'application/json' }), 'triglavian.typeface.json');
  });
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  initThree();
  renderGlyphMatrix();
  setupEventListeners();
  update3DScene();
});
