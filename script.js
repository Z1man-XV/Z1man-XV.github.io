import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/*
 * 后续替换作品内容时，只需要改这里：
 * video 填视频路径（例如 "./media/work-01.mp4"）
 * audio 填独立声音路径；留空时使用视频自带声音
 * href 填点击电脑屏幕后要去的页面
 */
const projects = [
  { id: "01", title: "动态视觉", type: "MOTION STUDY", year: "2026", accent: "#00d9ff", video: "", audio: "", href: "" },
  { id: "02", title: "品牌实验", type: "IDENTITY SYSTEM", year: "2026", accent: "#2aa8ff", video: "", audio: "", href: "" },
  { id: "03", title: "交互叙事", type: "INTERACTIVE FILM", year: "2025", accent: "#70e6ff", video: "", audio: "", href: "" },
  { id: "04", title: "空间影像", type: "SPATIAL MEDIA", year: "2025", accent: "#0077ff", video: "", audio: "", href: "" },
  { id: "05", title: "游戏原型", type: "PLAYABLE PROTOTYPE", year: "SOON", accent: "#a5f2ff", video: "", audio: "", href: "" },
];

const shell = document.querySelector("#scene-shell");
const scrollStage = document.querySelector(".scroll-stage");
const introCopy = document.querySelector(".intro-copy");
const canvas = document.querySelector("#scene-canvas");
const fallback = document.querySelector("#webgl-fallback");
const markers = [...document.querySelectorAll(".project-marker")];
const statusText = document.querySelector("#interaction-status");
const pitchReadout = document.querySelector("#pitch-readout");
const deviceReadout = document.querySelector("#device-readout");
const scrollProgress = document.querySelector("#scroll-progress");
const scrollPercent = document.querySelector("#scroll-percent");
const soundToggle = document.querySelector("#sound-toggle");
const soundLabel = document.querySelector("#sound-label");
const screenHit = document.querySelector("#screen-hit");
const timeLabel = document.querySelector("#local-time");
const profileScreen = document.querySelector("#profile-screen");
const profileBack = document.querySelector("#profile-back");
const profileOpeners = [...document.querySelectorAll("[data-open-profile]")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let renderer;
let scene;
let camera;
let terminal;
let lidGroup;
let terminalRestY = -0.9;
let usbDrives = [];
let screenMesh;
let portAnchor;
let dataField;
let screenTexture;
let videoElement;
let videoTexture;
let audioElement;
let selectedIndex = -1;
let hoveredDrive = -1;
let locked = false;
let pointerX = 0;
let pointerY = 0;
let targetPitch = THREE.MathUtils.degToRad(4);
let currentPitch = targetPitch;
let targetFocus = 0;
let currentFocus = 0;
let targetLidClose = 1;
let currentLidClose = 1;
let scrollRatio = 0;
let lastFrame = performance.now();
let screenClickReady = false;
let soundMuted = sessionStorage.getItem("portfolio-muted") === "true";
let audioContext;
let insertion = null;
let profileReturnFocus = null;
let profileCloseTimer = 0;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(99, 99);
const clock = new THREE.Clock();

function createMaterial(color, roughness = 0.72, metalness = 0.05) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function rounded(width, height, depth, radius, material, segments = 4) {
  const geometry = new RoundedBoxGeometry(width, height, depth, segments, radius);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function canvasTexture(width, height, draw) {
  const target = document.createElement("canvas");
  target.width = width;
  target.height = height;
  const context = target.getContext("2d");
  draw(context, width, height);
  const texture = new THREE.CanvasTexture(target);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer?.capabilities.getMaxAnisotropy?.() || 1);
  return texture;
}

function drawScreen(project = null) {
  return canvasTexture(1024, 700, (ctx, width, height) => {
    const accent = project?.accent || "#00d9ff";
    ctx.fillStyle = "#020b16";
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width * 0.5, height * 0.44, 0, width * 0.5, height * 0.44, width * 0.62);
    glow.addColorStop(0, `${accent}20`);
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = `${accent}24`;
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
      ctx.stroke();
    }

    ctx.strokeStyle = `${accent}66`;
    ctx.strokeRect(34, 34, width - 68, height - 68);
    ctx.fillStyle = accent;
    ctx.font = "700 24px monospace";
    ctx.fillText("NEURAL ARCHIVE / NODE 05", 58, 78);
    ctx.textAlign = "right";
    ctx.fillText(project ? `DEVICE ${project.id}` : "STANDBY", width - 58, 78);
    ctx.textAlign = "left";

    if (!project) {
      ctx.font = "700 72px Arial, sans-serif";
      ctx.fillStyle = "#e5faff";
      ctx.fillText("CONNECT", 58, 270);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.strokeRect(58, 304, width - 116, 72);
      ctx.fillStyle = accent;
      ctx.fillRect(58, 304, 170, 72);
      ctx.fillStyle = "#020b16";
      ctx.font = "700 26px monospace";
      ctx.fillText("MEMORY", 82, 350);
      ctx.fillStyle = "#6f94a6";
      ctx.font = "20px monospace";
      ctx.fillText("SELECT ONE OF FIVE MEMORY SHARDS", 58, 443);
    } else {
      ctx.fillStyle = "#e5faff";
      ctx.font = "800 88px Arial, sans-serif";
      ctx.fillText(project.title, 58, 268);
      ctx.fillStyle = accent;
      ctx.font = "700 30px monospace";
      ctx.fillText(`${project.type}  /  ${project.year}`, 62, 324);

      ctx.fillStyle = `${accent}24`;
      ctx.fillRect(58, 388, width - 116, 118);
      ctx.strokeStyle = `${accent}88`;
      ctx.strokeRect(58, 388, width - 116, 118);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(105, 418);
      ctx.lineTo(105, 477);
      ctx.lineTo(154, 447.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#c9f5ff";
      ctx.font = "22px monospace";
      ctx.fillText(project.video ? "LOADING MEDIA..." : "MEDIA PLACEHOLDER / READY", 190, 455);
      ctx.fillStyle = "#668da0";
      ctx.font = "18px monospace";
      ctx.fillText("CLICK SCREEN FOR PROJECT PAGE", 58, 568);
    }

    ctx.fillStyle = "#466f84";
    ctx.font = "18px monospace";
    ctx.fillText("SYNAPSE 64K", 58, height - 58);
    ctx.textAlign = "right";
    ctx.fillText("LINK STABLE", width - 58, height - 58);
  });
}

function drawBadge(text) {
  return canvasTexture(512, 128, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#242722";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#d1cab4";
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, width - 8, height - 8);
    ctx.fillStyle = "#d7d0bb";
    ctx.font = "700 44px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, width / 2, height / 2 + 2);
  });
}

function buildTerminal() {
  const group = new THREE.Group();
  group.name = "neural-laptop";

  const shellMaterial = createMaterial(0x0c1824, 0.42, 0.72);
  const edgeMaterial = createMaterial(0x193447, 0.35, 0.72);
  const black = createMaterial(0x02070d, 0.74, 0.18);
  const keyMaterial = createMaterial(0x07121c, 0.65, 0.26);
  const metal = createMaterial(0x6e96a8, 0.22, 0.9);
  const cyan = new THREE.MeshBasicMaterial({ color: 0x00d9ff, toneMapped: false });

  lidGroup = new THREE.Group();
  lidGroup.name = "laptop-lid";
  lidGroup.position.set(0, -0.9, -0.98);
  group.add(lidGroup);

  const lid = rounded(5.8, 3.55, 0.2, 0.16, shellMaterial, 6);
  lid.position.set(0, 1.83, -0.04);
  lidGroup.add(lid);

  const screenBezel = rounded(5.25, 3.03, 0.055, 0.1, black, 5);
  screenBezel.position.set(0, 1.83, 0.08);
  lidGroup.add(screenBezel);

  screenTexture = drawScreen();
  const screenMaterial = new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false });
  screenMesh = rounded(4.86, 2.68, 0.025, 0.08, screenMaterial, 5);
  screenMesh.position.set(0, 1.83, 0.115);
  screenMesh.name = "screen";
  lidGroup.add(screenMesh);

  const cameraDot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), cyan);
  cameraDot.position.set(0, 3.46, 0.09);
  lidGroup.add(cameraDot);

  const hingeGeometry = new THREE.CylinderGeometry(0.12, 0.12, 2.15, 24);
  for (const x of [-1.65, 1.65]) {
    const hinge = new THREE.Mesh(hingeGeometry, edgeMaterial);
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(x, -0.9, -0.95);
    group.add(hinge);
  }

  const deck = rounded(5.95, 0.3, 3.45, 0.16, shellMaterial, 6);
  deck.position.set(0, -1.18, 0.57);
  group.add(deck);

  const deckGlow = rounded(5.55, 0.035, 2.98, 0.12, edgeMaterial, 4);
  deckGlow.position.set(0, -1.005, 0.55);
  group.add(deckGlow);

  const keyGeometry = new RoundedBoxGeometry(0.29, 0.075, 0.24, 2, 0.035);
  for (let row = 0; row < 4; row += 1) {
    const count = row === 3 ? 11 : 14;
    for (let col = 0; col < count; col += 1) {
      const key = new THREE.Mesh(keyGeometry, keyMaterial);
      const rowWidth = (count - 1) * 0.35;
      key.position.set(-rowWidth / 2 + col * 0.35, -0.94, -0.47 + row * 0.31);
      key.castShadow = true;
      group.add(key);
    }
  }

  const space = rounded(1.72, 0.075, 0.24, 0.035, keyMaterial, 2);
  space.position.set(0.35, -0.94, 0.47);
  group.add(space);

  const trackpad = rounded(2.25, 0.035, 0.95, 0.08, black, 4);
  trackpad.position.set(0, -0.985, 1.25);
  group.add(trackpad);

  const trackpadLine = new THREE.Mesh(new THREE.PlaneGeometry(2.05, 0.75), new THREE.MeshBasicMaterial({
    color: 0x0b2434,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
  }));
  trackpadLine.rotation.x = -Math.PI / 2;
  trackpadLine.position.set(0, -0.963, 1.25);
  group.add(trackpadLine);

  const portFrame = rounded(0.09, 0.24, 0.84, 0.035, metal, 3);
  portFrame.position.set(2.99, -1.18, 0.43);
  group.add(portFrame);

  const port = rounded(0.105, 0.145, 0.62, 0.025, black, 3);
  port.position.set(3.045, -1.18, 0.43);
  port.name = "usb-port";
  group.add(port);

  const portLight = rounded(0.11, 0.025, 0.66, 0.01, cyan, 2);
  portLight.position.set(3.055, -1.29, 0.43);
  group.add(portLight);

  portAnchor = new THREE.Object3D();
  portAnchor.position.set(4.08, -1.18, 0.43);
  portAnchor.rotation.y = Math.PI / 2;
  group.add(portAnchor);

  group.position.set(0.65, terminalRestY, 0.2);
  return group;
}

function buildUsb(index) {
  const project = projects[index];
  const group = new THREE.Group();
  group.name = `drive-${index}`;
  group.userData.projectIndex = index;

  const accent = new THREE.Color(project.accent);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: accent.clone().multiplyScalar(0.45),
    emissive: accent.clone().multiplyScalar(0.16),
    roughness: 0.38,
    metalness: 0.52,
  });
  const darkMaterial = createMaterial(0x03101a, 0.54, 0.42);
  const metalMaterial = createMaterial(0x8aa9b7, 0.24, 0.92);

  const body = rounded(0.76, 0.24, 1.32, 0.1, bodyMaterial, 4);
  body.position.z = 0.15;
  body.userData.projectIndex = index;
  group.add(body);

  const darkBand = rounded(0.8, 0.255, 0.25, 0.06, darkMaterial, 3);
  darkBand.position.z = 0.1;
  darkBand.userData.projectIndex = index;
  group.add(darkBand);

  const connector = rounded(0.55, 0.15, 0.72, 0.025, metalMaterial, 2);
  connector.position.z = -0.82;
  connector.userData.projectIndex = index;
  group.add(connector);

  const inner = rounded(0.39, 0.09, 0.32, 0.015, darkMaterial, 2);
  inner.position.set(0, 0.035, -1.19);
  inner.userData.projectIndex = index;
  group.add(inner);

  const label = canvasTexture(256, 256, (ctx, width, height) => {
    ctx.fillStyle = "#020b14";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = project.accent;
    ctx.font = "800 108px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(project.id, width / 2, height / 2 + 6);
  });
  const labelMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.52, 0.52),
    new THREE.MeshBasicMaterial({ map: label, toneMapped: false }),
  );
  labelMesh.rotation.x = -Math.PI / 2;
  labelMesh.position.set(0, 0.126, 0.28);
  labelMesh.userData.projectIndex = index;
  group.add(labelMesh);

  group.traverse((child) => {
    child.userData.projectIndex = index;
  });
  return group;
}

function addWorldDetails() {
  const particlePositions = [];
  for (let i = 0; i < 180; i += 1) {
    const angle = i * 2.39996;
    const radius = 3.2 + (i % 13) * 0.22;
    particlePositions.push(
      Math.cos(angle) * radius + 0.65,
      -1.2 + (i % 29) * 0.22,
      -3.5 + Math.sin(angle) * radius * 0.42,
    );
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.Float32BufferAttribute(particlePositions, 3));
  dataField = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({ color: 0x3edfff, size: 0.025, transparent: true, opacity: 0.5, toneMapped: false }),
  );
  scene.add(dataField);
}

function setupScene() {
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (error) {
    fallback.hidden = false;
    markers.forEach((marker) => marker.classList.add("is-visible"));
    return false;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(shell.clientWidth, shell.clientHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !reducedMotion.matches;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020b24, 0.045);
  camera = new THREE.PerspectiveCamera(34, shell.clientWidth / shell.clientHeight, 0.1, 100);
  camera.position.set(0, 1.1, 13.3);
  camera.lookAt(0.45, 0.3, 0);

  scene.add(new THREE.HemisphereLight(0x78dcff, 0x01040a, 1.7));

  const key = new THREE.DirectionalLight(0xa4edff, 3.6);
  key.position.set(-5, 8, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 25;
  scene.add(key);

  const edge = new THREE.SpotLight(0x008cff, 44, 22, 0.6, 0.7, 1.5);
  edge.position.set(6, 3, 5);
  edge.target.position.set(0, 0, 0);
  scene.add(edge, edge.target);

  const fill = new THREE.PointLight(0x00d9ff, 12, 14, 2);
  fill.position.set(-5, 1, 2);
  scene.add(fill);

  terminal = buildTerminal();
  scene.add(terminal);

  const compactLayout = shell.clientWidth < 1120;
  const desktopPositions = compactLayout
    ? [
        [-4.15, 1.85, -0.55],
        [4.05, 3.25, -0.7],
        [-4.35, -0.08, -0.1],
        [5.0, -0.12, -0.25],
        [2.5, 3.65, -0.85],
      ]
    : [
        [-3.85, 1.95, -0.55],
        [4.35, 2.28, -0.7],
        [-4.15, -0.05, -0.1],
        [4.55, -0.05, -0.25],
        [3.2, 3.55, -0.85],
      ];

  usbDrives = projects.map((project, index) => {
    const drive = buildUsb(index);
    const home = new THREE.Vector3(...desktopPositions[index]);
    drive.position.copy(home);
    drive.rotation.set(0.22 + index * 0.05, (index % 2 ? -1 : 1) * (0.42 + index * 0.08), (index - 2) * 0.06);
    drive.userData.home = home;
    drive.userData.homeRotation = drive.rotation.clone();
    drive.userData.phase = index * 1.37;
    scene.add(drive);
    return drive;
  });

  addWorldDetails();
  window.setTimeout(() => markers.forEach((marker) => marker.classList.add("is-visible")), 280);
  return true;
}

function setScreenProject(project) {
  if (screenTexture) screenTexture.dispose();
  if (videoTexture) {
    videoTexture.dispose();
    videoTexture = null;
  }
  if (videoElement) {
    videoElement.pause();
    videoElement.removeAttribute("src");
    videoElement.load();
    videoElement = null;
  }

  screenTexture = drawScreen(project);
  screenMesh.material.map = screenTexture;
  screenMesh.material.needsUpdate = true;

  if (project?.video) {
    videoElement = document.createElement("video");
    videoElement.src = project.video;
    videoElement.loop = true;
    videoElement.playsInline = true;
    videoElement.muted = soundMuted;
    videoElement.crossOrigin = "anonymous";
    videoElement.addEventListener("canplay", () => {
      videoTexture = new THREE.VideoTexture(videoElement);
      videoTexture.colorSpace = THREE.SRGBColorSpace;
      screenMesh.material.map = videoTexture;
      screenMesh.material.needsUpdate = true;
      videoElement.play().catch(() => {
        updateStatus(`${project.title} 已就绪 · 点击屏幕播放`);
      });
    }, { once: true });
    videoElement.addEventListener("error", () => {
      updateStatus(`${project.title} 的视频尚未连接 · 当前显示占位画面`);
    }, { once: true });
    videoElement.load();
  }
}

function updateStatus(message) {
  statusText.textContent = message;
}

function setMarkerState(index) {
  markers.forEach((marker, markerIndex) => {
    const active = markerIndex === index;
    marker.classList.toggle("is-active", active);
    marker.classList.toggle("is-dimmed", index !== -1 && !active);
    marker.setAttribute("aria-pressed", String(active));
    marker.setAttribute(
      "aria-label",
      active
        ? `弹出作品 ${projects[markerIndex].id}：${projects[markerIndex].title}`
        : `插入作品 ${projects[markerIndex].id}：${projects[markerIndex].title}`,
    );
  });
}

function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") audioContext.resume();
}

function playBootChime(accentIndex = 0) {
  if (soundMuted) return;
  ensureAudioContext();
  const now = audioContext.currentTime;
  const frequencies = [110, 164.81, 220, 329.63].map((value) => value * (1 + accentIndex * 0.025));
  frequencies.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = index % 2 ? "triangle" : "square";
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.065);
    gain.gain.setValueAtTime(0.0001, now + index * 0.065);
    gain.gain.exponentialRampToValueAtTime(0.035, now + index * 0.065 + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.065 + 0.25);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now + index * 0.065);
    oscillator.stop(now + index * 0.065 + 0.28);
  });
}

function updateExternalAudio(project) {
  if (audioElement) {
    audioElement.pause();
    audioElement = null;
  }
  if (!project.audio) return;
  audioElement = new Audio(project.audio);
  audioElement.loop = true;
  audioElement.muted = soundMuted;
  audioElement.play().catch(() => {});
}

function selectProject(index) {
  if (locked || !usbDrives[index]) return;
  if (index === selectedIndex) {
    ejectProject();
    return;
  }
  locked = true;
  screenClickReady = false;
  screenHit.hidden = true;
  const previous = selectedIndex;
  selectedIndex = index;
  setMarkerState(index);
  deviceReadout.textContent = `READING ${projects[index].id}`;
  updateStatus(`正在插入作品 ${projects[index].id} · ${projects[index].title}`);

  const beginInsert = () => {
    const drive = usbDrives[index];
    terminal.updateMatrixWorld(true);
    const targetPosition = new THREE.Vector3();
    const targetQuaternion = new THREE.Quaternion();
    portAnchor.getWorldPosition(targetPosition);
    portAnchor.getWorldQuaternion(targetQuaternion);
    insertion = {
      index,
      start: performance.now(),
      duration: reducedMotion.matches ? 1 : 1150,
      tracksPort: true,
      fromPosition: drive.position.clone(),
      fromRotation: drive.rotation.clone(),
      toPosition: targetPosition,
      toRotation: new THREE.Euler().setFromQuaternion(targetQuaternion, "XYZ"),
      onComplete: () => {
        terminal.attach(drive);
        drive.position.copy(portAnchor.position);
        drive.quaternion.copy(portAnchor.quaternion);
        drive.updateMatrixWorld(true);
        drive.userData.inserted = true;
        setScreenProject(projects[index]);
        updateExternalAudio(projects[index]);
        playBootChime(index);
        deviceReadout.textContent = `DEVICE ${projects[index].id}`;
        updateStatus(`作品 ${projects[index].id} 已插入 · 点击屏幕可打开项目页`);
        screenClickReady = true;
        screenHit.hidden = false;
        locked = false;
      },
    };
  };

  if (previous >= 0) {
    returnDrive(previous, beginInsert);
  } else {
    beginInsert();
  }
}

function returnDrive(index, onComplete = () => {}) {
  const drive = usbDrives[index];
  if (!drive) return onComplete();
  if (drive.userData.inserted) {
    scene.attach(drive);
    drive.userData.inserted = false;
  }
  insertion = {
    index,
    start: performance.now(),
    duration: reducedMotion.matches ? 1 : 700,
    fromPosition: drive.position.clone(),
    fromRotation: drive.rotation.clone(),
    toPosition: drive.userData.home.clone(),
    toRotation: drive.userData.homeRotation.clone(),
    onComplete,
  };
}

function ejectProject() {
  if (locked || selectedIndex < 0) return;
  locked = true;
  const oldIndex = selectedIndex;
  selectedIndex = -1;
  screenClickReady = false;
  screenHit.hidden = true;
  setMarkerState(-1);
  setScreenProject(null);
  updateExternalAudio({ audio: "" });
  deviceReadout.textContent = "EJECTING";
  updateStatus("正在退出当前作品");
  returnDrive(oldIndex, () => {
    deviceReadout.textContent = "STANDBY";
    updateStatus("系统待机 · 请选择一枚 U 盘");
    locked = false;
  });
}

function easeInOutCubic(value) {
  return value < 0.5 ? 4 * value ** 3 : 1 - ((-2 * value + 2) ** 3) / 2;
}

function updateInsertion(now) {
  if (!insertion) return;
  const drive = usbDrives[insertion.index];
  if (insertion.tracksPort) {
    terminal.updateMatrixWorld(true);
    const targetQuaternion = new THREE.Quaternion();
    portAnchor.getWorldPosition(insertion.toPosition);
    portAnchor.getWorldQuaternion(targetQuaternion);
    insertion.toRotation.setFromQuaternion(targetQuaternion, "XYZ");
  }
  const raw = Math.min(1, (now - insertion.start) / insertion.duration);
  const eased = easeInOutCubic(raw);
  drive.position.lerpVectors(insertion.fromPosition, insertion.toPosition, eased);
  drive.rotation.x = THREE.MathUtils.lerp(insertion.fromRotation.x, insertion.toRotation.x, eased);
  drive.rotation.y = THREE.MathUtils.lerp(insertion.fromRotation.y, insertion.toRotation.y, eased);
  drive.rotation.z = THREE.MathUtils.lerp(insertion.fromRotation.z, insertion.toRotation.z, eased);
  if (raw >= 1) {
    const complete = insertion.onComplete;
    insertion = null;
    complete();
  }
}

function projectToScreen(object) {
  const position = new THREE.Vector3();
  object.getWorldPosition(position);
  position.project(camera);
  return {
    x: (position.x * 0.5 + 0.5) * shell.clientWidth,
    y: (-position.y * 0.5 + 0.5) * shell.clientHeight,
    visible: position.z < 1,
  };
}

function updateMarkers() {
  const markerReveal = THREE.MathUtils.smoothstep(scrollRatio, 0.3, 0.45);
  usbDrives.forEach((drive, index) => {
    const point = projectToScreen(drive);
    const marker = markers[index];
    const width = marker.offsetWidth || 180;
    const height = marker.offsetHeight || 48;
    const padding = window.innerWidth < 720 ? 8 : 16;
    let x = point.x;
    let y = point.y;
    if (marker.classList.contains("marker-left")) {
      x = THREE.MathUtils.clamp(x, width + padding, shell.clientWidth - padding);
    } else if (marker.classList.contains("marker-right")) {
      x = THREE.MathUtils.clamp(x, padding, shell.clientWidth - width - padding);
    } else {
      x = THREE.MathUtils.clamp(x, width / 2 + padding, shell.clientWidth - width / 2 - padding);
      y = Math.max(y, height + padding);
    }
    marker.style.setProperty("--marker-x", `${x.toFixed(1)}px`);
    marker.style.setProperty("--marker-y", `${y.toFixed(1)}px`);
    marker.style.opacity = String(markerReveal * (marker.classList.contains("is-dimmed") ? 0.16 : 1));
    marker.style.visibility = point.visible ? "visible" : "hidden";
  });
}

function updateScreenHit() {
  if (!screenMesh || screenHit.hidden) return;
  const corners = [
    new THREE.Vector3(-2.36, -1.28, 0.04),
    new THREE.Vector3(2.36, -1.28, 0.04),
    new THREE.Vector3(2.36, 1.28, 0.04),
    new THREE.Vector3(-2.36, 1.28, 0.04),
  ].map((corner) => screenMesh.localToWorld(corner).project(camera));
  const xs = corners.map((corner) => (corner.x * 0.5 + 0.5) * shell.clientWidth);
  const ys = corners.map((corner) => (-corner.y * 0.5 + 0.5) * shell.clientHeight);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  screenHit.style.left = `${left}px`;
  screenHit.style.top = `${top}px`;
  screenHit.style.width = `${Math.max(...xs) - left}px`;
  screenHit.style.height = `${Math.max(...ys) - top}px`;
}

function updateScroll() {
  const max = Math.max(1, scrollStage.offsetHeight - window.innerHeight);
  const rect = scrollStage.getBoundingClientRect();
  scrollRatio = THREE.MathUtils.clamp(-rect.top / max, 0, 1);
  targetFocus = THREE.MathUtils.smoothstep(scrollRatio, 0.04, 0.36);
  const openingLid = 1 - THREE.MathUtils.smoothstep(scrollRatio, 0.04, 0.34);
  const closingLid = THREE.MathUtils.smoothstep(scrollRatio, 0.58, 0.96);
  targetLidClose = Math.max(openingLid, closingLid);
  const maxPitch = window.innerWidth < 720 ? 3 : 4;
  const minPitch = window.innerWidth < 720 ? -5 : -7;
  targetPitch = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(maxPitch, minPitch, scrollRatio));
  const titleExit = THREE.MathUtils.smoothstep(scrollRatio, 0.05, 0.34);
  introCopy.style.opacity = String(1 - titleExit);
  introCopy.style.transform = `translate(-50%, -50%) translateY(${(-7 * titleExit).toFixed(3)}rem) scale(${(1 - titleExit * 0.12).toFixed(3)})`;
  introCopy.style.filter = `blur(${(titleExit * 7).toFixed(2)}px)`;
  const degrees = THREE.MathUtils.radToDeg(targetPitch);
  pitchReadout.textContent = `${degrees >= 0 ? "+" : ""}${degrees.toFixed(1)}°`;
  scrollProgress.style.transform = `scaleX(${scrollRatio})`;
  scrollPercent.textContent = String(Math.round(scrollRatio * 100)).padStart(2, "0");
}

function updateSoundUI() {
  soundToggle.setAttribute("aria-pressed", String(soundMuted));
  soundLabel.textContent = soundMuted ? "声音：关" : "声音：开";
  if (videoElement) videoElement.muted = soundMuted;
  if (audioElement) audioElement.muted = soundMuted;
}

function toggleSound() {
  soundMuted = !soundMuted;
  sessionStorage.setItem("portfolio-muted", String(soundMuted));
  updateSoundUI();
  if (!soundMuted) playBootChime(Math.max(0, selectedIndex));
}

function openSelectedProject() {
  if (!screenClickReady || selectedIndex < 0) return;
  const project = projects[selectedIndex];
  if (project.href) {
    window.location.href = project.href;
  } else if (videoElement?.paused) {
    videoElement.play().catch(() => {});
    updateStatus(`${project.title} 正在播放 · 项目链接稍后接入`);
  } else {
    updateStatus(`${project.title} 的详情页接口已预留 · 在 script.js 中填写 href`);
  }
}

function onPointerMove(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  pointerX = pointer.x;
  pointerY = pointer.y;
}

function onCanvasPointerUp(event) {
  if (locked) return;
  onPointerMove(event);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects([...usbDrives, terminal], true);
  const hit = hits[0]?.object;
  if (!hit) {
    ejectProject();
    return;
  }
  if (hit.name === "screen" || hit === screenMesh) {
    openSelectedProject();
    return;
  }
  const index = hit.userData.projectIndex;
  if (Number.isInteger(index)) selectProject(index);
}

function resize() {
  if (!renderer) return;
  const width = shell.clientWidth;
  const height = shell.clientHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 720 ? 1.35 : 1.75));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.fov = width < 720 ? 43 : width < 1050 ? 39 : 34;
  camera.position.z = width < 720 ? 15.7 : width < 1050 ? 14.5 : 13.3;
  camera.updateProjectionMatrix();
  updateScroll();
}

function animate(now) {
  if (!renderer) return;
  requestAnimationFrame(animate);
  const delta = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  const elapsed = clock.getElapsedTime();

  const pitchEase = reducedMotion.matches ? 1 : 1 - Math.exp(-delta * 5.5);
  currentPitch = THREE.MathUtils.lerp(currentPitch, targetPitch, pitchEase);
  currentFocus = THREE.MathUtils.lerp(currentFocus, targetFocus, pitchEase);
  currentLidClose = THREE.MathUtils.lerp(currentLidClose, targetLidClose, pitchEase);
  lidGroup.rotation.x = THREE.MathUtils.lerp(0, THREE.MathUtils.degToRad(89), currentLidClose);
  terminal.rotation.x = currentPitch;
  terminal.rotation.y = reducedMotion.matches ? 0 : pointerX * 0.012;
  terminal.rotation.z = 0;
  const mobileLayout = window.innerWidth < 720;
  const focusX = mobileLayout ? 0 : 0.45;
  const focusedX = focusX;
  const focusedY = terminalRestY;
  const focusedZ = THREE.MathUtils.lerp(-1, 0.2, currentFocus);
  const focusedScale = THREE.MathUtils.lerp(mobileLayout ? 0.72 : 0.76, mobileLayout ? 1 : 1.06, currentFocus);
  terminal.position.x = focusedX;
  terminal.position.y = focusedY;
  terminal.position.z = focusedZ;
  terminal.scale.setScalar(focusedScale);

  if (dataField && !reducedMotion.matches) {
    dataField.rotation.y = elapsed * 0.018;
  }

  usbDrives.forEach((drive, index) => {
    if (insertion?.index === index || selectedIndex === index) return;
    const phase = drive.userData.phase;
    const amount = reducedMotion.matches ? 0 : 1;
    drive.position.y = drive.userData.home.y + Math.sin(elapsed * 0.82 + phase) * 0.17 * amount;
    drive.position.x = drive.userData.home.x + Math.cos(elapsed * 0.48 + phase) * 0.07 * amount;
    drive.rotation.z = drive.userData.homeRotation.z + Math.sin(elapsed * 0.56 + phase) * 0.09 * amount;
    drive.rotation.y = drive.userData.homeRotation.y + Math.cos(elapsed * 0.38 + phase) * 0.08 * amount;
    const deviceReveal = THREE.MathUtils.smoothstep(scrollRatio, 0.24, 0.43);
    const scale = (hoveredDrive === index ? 1.1 : 1) * deviceReveal;
    drive.scale.lerp(new THREE.Vector3(scale, scale, scale), 1 - Math.exp(-delta * 10));
  });

  updateInsertion(now);
  updateMarkers();
  updateScreenHit();

  camera.position.x = (reducedMotion.matches ? 0 : pointerX * 0.12);
  camera.position.y = 1.1 + (reducedMotion.matches ? 0 : pointerY * 0.06);
  camera.lookAt(0.45, 0.3, 0);
  renderer.render(scene, camera);
}

function openProfileScreen() {
  window.clearTimeout(profileCloseTimer);
  profileReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  profileScreen.hidden = false;
  profileScreen.setAttribute("aria-hidden", "false");
  document.body.classList.add("profile-is-open");
  window.requestAnimationFrame(() => {
    profileScreen.classList.add("is-open");
    window.requestAnimationFrame(() => profileBack.focus({ preventScroll: true }));
  });
}

function closeProfileScreen() {
  if (profileScreen.hidden) return;
  profileScreen.classList.remove("is-open");
  profileScreen.setAttribute("aria-hidden", "true");
  document.body.classList.remove("profile-is-open");
  profileCloseTimer = window.setTimeout(() => {
    profileScreen.hidden = true;
    profileReturnFocus?.focus({ preventScroll: true });
  }, reducedMotion.matches ? 0 : 380);
}

markers.forEach((marker, index) => {
  marker.addEventListener("click", () => selectProject(index));
  marker.addEventListener("pointerenter", () => { hoveredDrive = index; });
  marker.addEventListener("pointerleave", () => { hoveredDrive = -1; });
});

profileOpeners.forEach((control) => control.addEventListener("click", openProfileScreen));
profileBack.addEventListener("click", closeProfileScreen);

document.querySelectorAll("[data-select-project]").forEach((control) => {
  control.addEventListener("click", () => {
    const index = Number(control.dataset.selectProject);
    if (!Number.isInteger(index) || !projects[index]) return;
    selectProject(index);
    window.setTimeout(() => {
      document.querySelector("#top")?.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" });
    }, 120);
  });
});

soundToggle.addEventListener("click", toggleSound);
screenHit.addEventListener("click", openSelectedProject);
screenHit.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openSelectedProject();
  }
});

canvas.addEventListener("pointermove", onPointerMove, { passive: true });
canvas.addEventListener("pointerup", onCanvasPointerUp);
canvas.addEventListener("pointerleave", () => {
  pointer.set(99, 99);
  pointerX = 0;
  pointerY = 0;
});

window.addEventListener("scroll", updateScroll, { passive: true });
window.addEventListener("resize", resize, { passive: true });
window.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!profileScreen.hidden) closeProfileScreen();
  else ejectProject();
});

function updateTime() {
  timeLabel.textContent = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo",
  }).format(new Date());
}

updateSoundUI();
setMarkerState(-1);
updateTime();
window.setInterval(updateTime, 1000);
updateScroll();

if (setupScene()) {
  resize();
  requestAnimationFrame(animate);
}
