import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/*
 * 后续替换作品内容时，只需要改这里：
 * video 填视频路径（例如 "./media/work-01.mp4"）
 * audio 填独立声音路径；留空时使用视频自带声音
 * href 填点击电脑屏幕后要去的页面
 */
const projects = [
  { id: "01", title: "动态视觉", type: "MOTION STUDY", year: "2026", accent: "#baff39", video: "", audio: "", href: "" },
  { id: "02", title: "品牌实验", type: "IDENTITY SYSTEM", year: "2026", accent: "#ff7657", video: "", audio: "", href: "" },
  { id: "03", title: "交互叙事", type: "INTERACTIVE FILM", year: "2025", accent: "#78d8ff", video: "", audio: "", href: "" },
  { id: "04", title: "空间影像", type: "SPATIAL MEDIA", year: "2025", accent: "#ffd65a", video: "", audio: "", href: "" },
  { id: "05", title: "游戏原型", type: "PLAYABLE PROTOTYPE", year: "SOON", accent: "#d5a3ff", video: "", audio: "", href: "" },
];

const shell = document.querySelector("#scene-shell");
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
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let renderer;
let scene;
let camera;
let terminal;
let terminalRestY = -0.2;
let usbDrives = [];
let screenMesh;
let portAnchor;
let screenTexture;
let videoElement;
let videoTexture;
let audioElement;
let selectedIndex = -1;
let hoveredDrive = -1;
let locked = false;
let pointerX = 0;
let pointerY = 0;
let targetPitch = THREE.MathUtils.degToRad(10);
let currentPitch = targetPitch;
let scrollRatio = 0;
let lastFrame = performance.now();
let screenClickReady = false;
let soundMuted = sessionStorage.getItem("portfolio-muted") === "true";
let audioContext;
let insertion = null;

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
    const accent = project?.accent || "#baff39";
    ctx.fillStyle = "#07100b";
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
    ctx.fillText("ARCHIVE TERMINAL / PORT 05", 58, 78);
    ctx.textAlign = "right";
    ctx.fillText(project ? `DEVICE ${project.id}` : "STANDBY", width - 58, 78);
    ctx.textAlign = "left";

    if (!project) {
      ctx.font = "700 72px Arial, sans-serif";
      ctx.fillStyle = "#e6eadc";
      ctx.fillText("INSERT", 58, 270);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.strokeRect(58, 304, width - 116, 72);
      ctx.fillStyle = accent;
      ctx.fillRect(58, 304, 170, 72);
      ctx.fillStyle = "#07100b";
      ctx.font = "700 26px monospace";
      ctx.fillText("A DRIVE", 82, 350);
      ctx.fillStyle = "#829083";
      ctx.font = "20px monospace";
      ctx.fillText("SELECT ONE OF FIVE ARCHIVE DEVICES", 58, 443);
    } else {
      ctx.fillStyle = "#e9edde";
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
      ctx.fillStyle = "#d7dcce";
      ctx.font = "22px monospace";
      ctx.fillText(project.video ? "LOADING MEDIA..." : "MEDIA PLACEHOLDER / READY", 190, 455);
      ctx.fillStyle = "#7d8a7e";
      ctx.font = "18px monospace";
      ctx.fillText("CLICK SCREEN FOR PROJECT PAGE", 58, 568);
    }

    ctx.fillStyle = "#526054";
    ctx.font = "18px monospace";
    ctx.fillText("MEM 64K", 58, height - 58);
    ctx.textAlign = "right";
    ctx.fillText("SIGNAL OK", width - 58, height - 58);
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
  group.name = "retro-terminal";

  const beige = createMaterial(0xb7b09a, 0.88, 0.02);
  const beigeDark = createMaterial(0x8d8877, 0.9, 0.02);
  const bezel = createMaterial(0x20231f, 0.78, 0.03);
  const black = createMaterial(0x111410, 0.8, 0.03);
  const metal = createMaterial(0x747a76, 0.35, 0.78);

  const monitor = rounded(4.7, 3.55, 1.65, 0.28, beige, 6);
  monitor.position.set(0, 1.05, 0);
  group.add(monitor);

  const frontInset = rounded(3.92, 2.62, 0.13, 0.18, bezel, 5);
  frontInset.position.set(0, 1.25, 0.84);
  group.add(frontInset);

  screenTexture = drawScreen();
  const screenMaterial = new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false });
  screenMesh = rounded(3.48, 2.18, 0.055, 0.16, screenMaterial, 5);
  screenMesh.position.set(0, 1.28, 0.925);
  screenMesh.name = "screen";
  group.add(screenMesh);

  const controlPanel = rounded(4.1, 0.5, 0.1, 0.08, beigeDark, 4);
  controlPanel.position.set(0, -0.46, 0.855);
  group.add(controlPanel);

  for (let i = 0; i < 14; i += 1) {
    const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 12), black);
    hole.rotation.x = Math.PI / 2;
    hole.position.set(-1.55 + i * 0.19, -0.45, 0.92);
    group.add(hole);
  }

  const ledMaterial = new THREE.MeshBasicMaterial({ color: 0xbaff39, toneMapped: false });
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.052, 16, 8), ledMaterial);
  led.position.set(1.72, -0.45, 0.93);
  group.add(led);

  const power = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.07, 24), black);
  power.rotation.x = Math.PI / 2;
  power.position.set(1.42, -0.45, 0.94);
  group.add(power);

  const badgeMaterial = new THREE.MeshBasicMaterial({ map: drawBadge("MEMORY UNIT 84"), transparent: true, toneMapped: false });
  const badge = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.36), badgeMaterial);
  badge.position.set(-1.13, -0.44, 0.922);
  group.add(badge);

  const neck = rounded(1.7, 0.58, 1.22, 0.12, beigeDark, 4);
  neck.position.set(0, -1.02, -0.03);
  group.add(neck);

  const base = rounded(4.2, 0.42, 2.15, 0.15, beige, 5);
  base.position.set(0, -1.48, 0.25);
  group.add(base);

  const port = rounded(0.62, 0.18, 0.07, 0.035, black, 3);
  port.position.set(1.28, -1.46, 1.35);
  port.name = "usb-port";
  group.add(port);

  const portInner = rounded(0.48, 0.095, 0.02, 0.02, metal, 2);
  portInner.position.set(1.28, -1.46, 1.395);
  group.add(portInner);

  portAnchor = new THREE.Object3D();
  portAnchor.position.set(1.28, -1.46, 2.08);
  portAnchor.rotation.x = Math.PI / 2;
  group.add(portAnchor);

  const keyboard = new THREE.Group();
  const keyboardCase = rounded(5.05, 0.28, 1.9, 0.15, beige, 5);
  keyboardCase.position.y = -0.08;
  keyboard.add(keyboardCase);

  const keyMaterial = createMaterial(0x343631, 0.82, 0.02);
  const keyGeometry = new RoundedBoxGeometry(0.28, 0.13, 0.26, 2, 0.035);
  for (let row = 0; row < 4; row += 1) {
    const count = row === 3 ? 10 : 13;
    for (let col = 0; col < count; col += 1) {
      const key = new THREE.Mesh(keyGeometry, keyMaterial);
      const rowWidth = (count - 1) * 0.34;
      key.position.set(-rowWidth / 2 + col * 0.34, 0.11, -0.55 + row * 0.37);
      key.castShadow = true;
      keyboard.add(key);
    }
  }
  const space = rounded(1.65, 0.13, 0.26, 0.035, keyMaterial, 2);
  space.position.set(0.45, 0.11, 0.56);
  keyboard.add(space);
  keyboard.position.set(0, -1.72, 1.55);
  keyboard.rotation.x = -0.08;
  group.add(keyboard);

  group.position.set(0.9, terminalRestY, 0);
  return group;
}

function buildUsb(index) {
  const project = projects[index];
  const group = new THREE.Group();
  group.name = `drive-${index}`;
  group.userData.projectIndex = index;

  const bodyMaterial = createMaterial(new THREE.Color(project.accent).multiplyScalar(0.55), 0.6, 0.15);
  const darkMaterial = createMaterial(0x151914, 0.72, 0.12);
  const metalMaterial = createMaterial(0x9aa09a, 0.28, 0.88);

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
    ctx.fillStyle = "#11150f";
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
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 22),
    new THREE.MeshStandardMaterial({ color: 0x070a08, roughness: 0.92, metalness: 0.05 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -2.18, -1.5);
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(24, 24, 0x25321e, 0x141a13);
  grid.position.set(0, -2.16, -2);
  grid.material.opacity = 0.24;
  grid.material.transparent = true;
  scene.add(grid);

  const backRing = new THREE.Mesh(
    new THREE.TorusGeometry(4.8, 0.012, 8, 150),
    new THREE.MeshBasicMaterial({ color: 0xbaff39, transparent: true, opacity: 0.12 }),
  );
  backRing.position.set(0.8, 0.6, -2.1);
  scene.add(backRing);
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
  scene.fog = new THREE.FogExp2(0x050706, 0.035);
  camera = new THREE.PerspectiveCamera(34, shell.clientWidth / shell.clientHeight, 0.1, 100);
  camera.position.set(0, 1.1, 13.3);
  camera.lookAt(0.45, 0.3, 0);

  scene.add(new THREE.HemisphereLight(0xded6be, 0x050706, 1.6));

  const key = new THREE.DirectionalLight(0xfff2cf, 3.4);
  key.position.set(-5, 8, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 25;
  scene.add(key);

  const edge = new THREE.SpotLight(0xbaff39, 38, 22, 0.6, 0.7, 1.5);
  edge.position.set(6, 3, 5);
  edge.target.position.set(0, 0, 0);
  scene.add(edge, edge.target);

  const fill = new THREE.PointLight(0x6aa5ff, 8, 12, 2);
  fill.position.set(-5, 1, 2);
  scene.add(fill);

  terminal = buildTerminal();
  scene.add(terminal);

  const desktopPositions = [
    [-3.35, 2.05, -0.65],
    [4.0, 2.22, -0.8],
    [-3.75, -0.05, -0.15],
    [4.25, 0.05, -0.35],
    [0.75, 4.05, -1.1],
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
    if (active) marker.setAttribute("aria-label", `已插入作品 ${projects[index].id}：${projects[index].title}`);
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
  if (locked || index === selectedIndex || !usbDrives[index]) return;
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
      fromPosition: drive.position.clone(),
      fromRotation: drive.rotation.clone(),
      toPosition: targetPosition,
      toRotation: new THREE.Euler().setFromQuaternion(targetQuaternion, "XYZ"),
      onComplete: () => {
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
    marker.style.visibility = point.visible ? "visible" : "hidden";
  });
}

function updateScreenHit() {
  if (!screenMesh || screenHit.hidden) return;
  const corners = [
    new THREE.Vector3(-1.7, -1.04, 0.04),
    new THREE.Vector3(1.7, -1.04, 0.04),
    new THREE.Vector3(1.7, 1.04, 0.04),
    new THREE.Vector3(-1.7, 1.04, 0.04),
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
  const section = document.querySelector(".scroll-stage");
  const max = Math.max(1, section.offsetHeight - window.innerHeight);
  const rect = section.getBoundingClientRect();
  scrollRatio = THREE.MathUtils.clamp(-rect.top / max, 0, 1);
  const maxPitch = window.innerWidth < 720 ? 7 : 10;
  const minPitch = window.innerWidth < 720 ? -8 : -12;
  targetPitch = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(maxPitch, minPitch, scrollRatio));
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
  const hits = raycaster.intersectObjects([...usbDrives, screenMesh], true);
  const hit = hits[0]?.object;
  if (!hit) return;
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
  terminal.position.x = width < 720 ? 0 : 0.9;
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
  terminal.rotation.x = currentPitch;
  terminal.rotation.y = reducedMotion.matches ? 0 : pointerX * 0.025;
  terminal.position.y = terminalRestY + Math.sin(elapsed * 0.65) * (reducedMotion.matches ? 0 : 0.025);

  usbDrives.forEach((drive, index) => {
    if (insertion?.index === index || selectedIndex === index) return;
    const phase = drive.userData.phase;
    const amount = reducedMotion.matches ? 0 : 1;
    drive.position.y = drive.userData.home.y + Math.sin(elapsed * 0.82 + phase) * 0.17 * amount;
    drive.position.x = drive.userData.home.x + Math.cos(elapsed * 0.48 + phase) * 0.07 * amount;
    drive.rotation.z = drive.userData.homeRotation.z + Math.sin(elapsed * 0.56 + phase) * 0.09 * amount;
    drive.rotation.y = drive.userData.homeRotation.y + Math.cos(elapsed * 0.38 + phase) * 0.08 * amount;
    const scale = hoveredDrive === index ? 1.1 : 1;
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

markers.forEach((marker, index) => {
  marker.addEventListener("click", () => selectProject(index));
  marker.addEventListener("pointerenter", () => { hoveredDrive = index; });
  marker.addEventListener("pointerleave", () => { hoveredDrive = -1; });
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
  if (event.key === "Escape") ejectProject();
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
