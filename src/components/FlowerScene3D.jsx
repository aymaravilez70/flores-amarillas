import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { synth } from '../audio/synthMelody';

export default function FlowerScene3D({ 
  onFlowerClick, 
  isBlooming, 
  setIsBlooming,
  recipientName = "Amiga",
  isModalOpen = false
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const bouquetRef = useRef(null);
  const flowersRef = useRef([]);
  const bokehParticlesRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const cameraRef = useRef(null);
  const isModalOpenRef = useRef(isModalOpen);

  useEffect(() => {
    isModalOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  // 1. Textura procedimental del centro del girasol (como en la imagen de referencia)
  const createStylizedCenterTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Fondo chocolate oscuro
    ctx.fillStyle = '#1c0b05';
    ctx.beginPath();
    ctx.arc(256, 256, 250, 0, Math.PI * 2);
    ctx.fill();

    // Círculos concéntricos de radios/semillas
    ctx.strokeStyle = '#2d1308';
    ctx.lineWidth = 4;
    for (let r = 40; r <= 220; r += 35) {
      ctx.beginPath();
      ctx.arc(256, 256, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Puntos de semillas en rayos ordenados (exacto al arte del usuario)
    const rings = [
      { count: 12, radius: 55, dotSize: 5, color: '#f59e0b' },
      { count: 18, radius: 95, dotSize: 5.5, color: '#f59e0b' },
      { count: 24, radius: 135, dotSize: 6, color: '#fbbf24' },
      { count: 32, radius: 175, dotSize: 6.5, color: '#fde047' },
      { count: 36, radius: 215, dotSize: 7, color: '#facc15' }
    ];

    rings.forEach(({ count, radius, dotSize, color }) => {
      ctx.fillStyle = color;
      for (let i = 0; i < count; i++) {
        const theta = (i / count) * Math.PI * 2;
        const x = 256 + Math.cos(theta) * radius;
        const y = 256 + Math.sin(theta) * radius;
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Anillo dorado exterior
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(256, 256, 246, 0, Math.PI * 2);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  };

  // 2. Geometría facetada estilizada de pétalo puntiagudo
  const createStylizedPetalGeometry = (length = 0.95, width = 0.38) => {
    const geom = new THREE.BufferGeometry();
    const halfW = width / 2;

    const vertices = new Float32Array([
      // Cara 1: Base - Izq - Cresta
      0, 0, 0,
      -halfW, length * 0.45, 0,
      0, length * 0.45, 0.08,

      // Cara 2: Base - Cresta - Der
      0, 0, 0,
      0, length * 0.45, 0.08,
      halfW, length * 0.45, 0,

      // Cara 3: Izq - Punta - Cresta
      -halfW, length * 0.45, 0,
      0, length, 0.04,
      0, length * 0.45, 0.08,

      // Cara 4: Cresta - Punta - Der
      0, length * 0.45, 0.08,
      0, length, 0.04,
      halfW, length * 0.45, 0,

      // Reversa para doble cara limpia
      0, 0, 0,
      0, length * 0.45, 0.08,
      -halfW, length * 0.45, 0,

      0, 0, 0,
      halfW, length * 0.45, 0,
      0, length * 0.45, 0.08,

      -halfW, length * 0.45, 0,
      0, length * 0.45, 0.08,
      0, length, 0.04,

      0, length * 0.45, 0.08,
      halfW, length * 0.45, 0,
      0, length, 0.04
    ]);

    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.computeVertexNormals();
    return geom;
  };

  // 3. Hoja estilizada ovalada puntiaguda
  const createStylizedLeafGeometry = (length = 1.1, width = 0.55) => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(-width, length * 0.35, -width * 0.8, length * 0.75, 0, length);
    shape.bezierCurveTo(width * 0.8, length * 0.75, width, length * 0.35, 0, 0);

    const extrudeSettings = {
      steps: 1,
      depth: 0.02,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.02,
      bevelSegments: 2
    };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const ny = y / length;
      pos.setZ(i, pos.getZ(i) - Math.sin(ny * Math.PI) * 0.12);
    }
    geom.computeVertexNormals();
    return geom;
  };

  // 4. Crear un Girasol con la estética de la imagen
  const createIllustratedSunflower = ({
    pos = new THREE.Vector3(0, 4, 0),
    rot = new THREE.Euler(0, 0, 0),
    scale = 1.0,
    isHero = false,
    index = 0,
    centerTexture
  }) => {
    const flowerGroup = new THREE.Group();
    flowerGroup.userData = {
      isFlower: true,
      index,
      isHero,
      bounce: 0,
      phase: Math.random() * Math.PI * 2,
      origScale: scale,
      baseRot: { x: rot.x, y: rot.y, z: rot.z },
      headGroup: null
    };

    const headGroup = new THREE.Group();
    headGroup.position.copy(pos);
    headGroup.rotation.copy(rot);
    headGroup.scale.setScalar(scale);
    flowerGroup.userData.headGroup = headGroup;

    const centerRadius = 0.52;

    // A. Disco Central Estilizado
    const centerGeom = new THREE.CylinderGeometry(centerRadius, centerRadius * 0.95, 0.08, 36);
    const centerMat = new THREE.MeshStandardMaterial({
      map: centerTexture,
      roughness: 0.5,
      metalness: 0.1,
      emissive: 0x3d1b06,
      emissiveIntensity: 0.25
    });
    const centerMesh = new THREE.Mesh(centerGeom, centerMat);
    centerMesh.rotation.x = Math.PI / 2;
    centerMesh.castShadow = true;
    headGroup.add(centerMesh);

    // B. Pétalos Facetados en 2 Capas (Estilo Ilustración)
    const petalMatOuter = new THREE.MeshStandardMaterial({
      color: 0xffd200,
      emissive: 0xffaa00,
      emissiveIntensity: 0.35,
      roughness: 0.25,
      metalness: 0.08,
      side: THREE.DoubleSide
    });

    const petalMatInner = new THREE.MeshStandardMaterial({
      color: 0xffe033,
      emissive: 0xff9900,
      emissiveIntensity: 0.4,
      roughness: 0.25,
      metalness: 0.08,
      side: THREE.DoubleSide
    });

    const petalGeomOuter = createStylizedPetalGeometry(0.88, 0.38);
    const petalGeomInner = createStylizedPetalGeometry(0.74, 0.33);

    const petalCount = 14;

    // Capa exterior (14 pétalos)
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const pivot = new THREE.Group();
      pivot.rotation.z = angle;

      const pMesh = new THREE.Mesh(petalGeomOuter, petalMatOuter);
      pMesh.position.set(0, centerRadius * 0.88, -0.01);
      pMesh.castShadow = true;
      pivot.add(pMesh);
      headGroup.add(pivot);
    }

    // Capa interior desfasada (14 pétalos)
    for (let i = 0; i < petalCount; i++) {
      const angle = ((i + 0.5) / petalCount) * Math.PI * 2;
      const pivot = new THREE.Group();
      pivot.rotation.z = angle;

      const pMesh = new THREE.Mesh(petalGeomInner, petalMatInner);
      pMesh.position.set(0, centerRadius * 0.84, 0.04);
      pMesh.castShadow = true;
      pivot.add(pMesh);
      headGroup.add(pivot);
    }

    // Luz cálida propia en cada flor
    const glowLight = new THREE.PointLight(0xffdd44, isHero ? 1.4 : 0.8, 4);
    glowLight.position.set(0, 0, 0.5);
    headGroup.add(glowLight);

    flowerGroup.add(headGroup);
    return flowerGroup;
  };

  // 5. Partículas de Fondo Mágico Bokeh
  const createBokehParticles = (scene) => {
    const count = 140;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const palette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xffea75),
      new THREE.Color(0xa7f3d0),
      new THREE.Color(0x93c5fd),
      new THREE.Color(0xfbcfe8)
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 16 - 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.7)');
    grad.addColorStop(0.8, 'rgba(255, 255, 255, 0.15)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);

    const mat = new THREE.PointsMaterial({
      size: 0.45,
      map: texture,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geom, mat);
    scene.add(points);
    return points;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // A. Escena
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // B. Cámara FIJA y 100% RESPONSIVE (se adapta automáticamente a cualquier móvil o PC)
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    const updateCameraProjection = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;

      const aspect = w / h;
      camera.aspect = aspect;

      // En pantallas verticales móviles (aspect < 1.0, celulares):
      // Alejamos la cámara proporcionalmente para que el ancho del ramo nunca se corte
      const baseZ = 11.2;
      const targetY = 3.4;
      if (aspect < 1.0) {
        const mobileZ = baseZ / Math.min(1.0, aspect * 1.52);
        camera.position.set(0, targetY, mobileZ);
      } else {
        camera.position.set(0, targetY, baseZ);
      }

      camera.lookAt(0, 3.2, 0);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    updateCameraProjection();

    // C. Iluminación
    const ambientLight = new THREE.AmbientLight(0x382d54, 1.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff3d6, 2.2);
    mainLight.position.set(4, 9, 7);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const goldGlowLight = new THREE.PointLight(0xffb703, 3.0, 14);
    goldGlowLight.position.set(0, 4.2, 2.5);
    scene.add(goldGlowLight);

    const rimLight = new THREE.DirectionalLight(0x7c3aed, 1.8);
    rimLight.position.set(-3, 6, -5);
    scene.add(rimLight);

    // D. El Ramo de 7 Girasoles (Este grupo es el que gira interactivamente al arrastrar)
    const bouquetRoot = new THREE.Group();
    bouquetRef.current = bouquetRoot;
    const baseOrigin = new THREE.Vector3(0, 0.25, 0);
    const centerTexture = createStylizedCenterTexture();

    const FLOWER_CONFIGS = [
      // 1. Arriba Izquierda
      { pos: new THREE.Vector3(-0.95, 5.0, -0.25), rot: new THREE.Euler(0.12, 0.12, 0.08), scale: 1.05 },
      // 2. Arriba Derecha
      { pos: new THREE.Vector3(0.95, 5.0, -0.25), rot: new THREE.Euler(0.12, -0.12, -0.08), scale: 1.05 },
      // 3. Centro Radiante
      { pos: new THREE.Vector3(0.0, 4.15, 0.15), rot: new THREE.Euler(0.1, 0, 0), scale: 1.15, isHero: true },
      // 4. Medio Izquierda
      { pos: new THREE.Vector3(-1.7, 4.05, -0.08), rot: new THREE.Euler(0.16, 0.25, 0.14), scale: 1.0 },
      // 5. Medio Derecha
      { pos: new THREE.Vector3(1.7, 4.05, -0.08), rot: new THREE.Euler(0.16, -0.25, -0.14), scale: 1.0 },
      // 6. Abajo Frontal Izquierda
      { pos: new THREE.Vector3(-0.85, 3.15, 0.3), rot: new THREE.Euler(0.24, 0.12, 0.05), scale: 1.02 },
      // 7. Abajo Frontal Derecha
      { pos: new THREE.Vector3(0.85, 3.15, 0.3), rot: new THREE.Euler(0.24, -0.12, -0.05), scale: 1.02 }
    ];

    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x2e7d32,
      emissive: 0x143d17,
      emissiveIntensity: 0.2,
      roughness: 0.45
    });

    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x388e3c,
      emissive: 0x16471a,
      emissiveIntensity: 0.25,
      roughness: 0.4,
      side: THREE.DoubleSide
    });

    const leafGeom = createStylizedLeafGeometry(0.9, 0.48);
    const flowers = [];

    FLOWER_CONFIGS.forEach((cfg, index) => {
      const flower = createIllustratedSunflower({
        ...cfg,
        index,
        centerTexture
      });
      bouquetRoot.add(flower);
      flowers.push(flower);

      // Tallo verde suavemente curvado
      const midPoint = new THREE.Vector3()
        .addVectors(baseOrigin, cfg.pos)
        .multiplyScalar(0.5);
      midPoint.x += (cfg.pos.x * 0.15);
      midPoint.z += (cfg.pos.z * 0.2);

      const stemCurve = new THREE.CatmullRomCurve3([baseOrigin, midPoint, cfg.pos]);
      const stemGeom = new THREE.TubeGeometry(stemCurve, 20, 0.07, 8, false);
      const stemMesh = new THREE.Mesh(stemGeom, stemMat);
      stemMesh.castShadow = true;
      bouquetRoot.add(stemMesh);

      // Hojas a lo largo del tallo
      const pts = stemCurve.getPoints(5);
      if (pts.length >= 4) {
        const leaf1 = new THREE.Mesh(leafGeom, leafMat);
        leaf1.position.copy(pts[2]);
        leaf1.rotation.set(0.3, Math.atan2(cfg.pos.x, cfg.pos.y) + 0.6, 0.5);
        leaf1.scale.setScalar(0.85);
        bouquetRoot.add(leaf1);

        const leaf2 = new THREE.Mesh(leafGeom, leafMat);
        leaf2.position.copy(pts[3]);
        leaf2.rotation.set(-0.2, Math.atan2(cfg.pos.x, cfg.pos.y) - 0.6, -0.5);
        leaf2.scale.setScalar(0.75);
        bouquetRoot.add(leaf2);
      }
    });

    flowersRef.current = flowers;

    // Follaje frondoso en la base
    const baseFoliageCount = 18;
    const baseLeafGeom = createStylizedLeafGeometry(1.2, 0.6);
    for (let f = 0; f < baseFoliageCount; f++) {
      const angle = (f / baseFoliageCount) * Math.PI * 2;
      const rDist = 0.35 + (f % 3) * 0.18;
      const height = 0.3 + (f % 4) * 0.25;

      const leafMesh = new THREE.Mesh(baseLeafGeom, leafMat);
      leafMesh.position.set(
        Math.cos(angle) * rDist,
        height,
        Math.sin(angle) * rDist
      );
      leafMesh.rotation.set(0.6, angle - Math.PI / 2, 0.4);
      leafMesh.scale.setScalar(0.7 + (f % 3) * 0.2);
      bouquetRoot.add(leafMesh);
    }

    // Sombra en el suelo
    const shadowGeom = new THREE.CircleGeometry(1.8, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5
    });
    const shadow = new THREE.Mesh(shadowGeom, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    bouquetRoot.add(shadow);

    scene.add(bouquetRoot);

    // Bokeh de fondo
    bokehParticlesRef.current = createBokehParticles(scene);

    // Redimensionamiento
    const handleResize = () => {
      updateCameraProjection();
    };
    window.addEventListener('resize', handleResize);

    // ==========================================
    // INTERACCIÓN: LA PANTALLA NO SE MUEVE
    // EL USUARIO GIRA DIRECTAMENTE EL RAMO DE FLORES
    // ==========================================
    let isDragging = false;
    let startPointerPos = { x: 0, y: 0 };
    let previousPointerPos = { x: 0, y: 0 };
    let velocityY = 0;
    let velocityX = 0;
    let targetRotY = 0;
    let targetRotX = 0;
    let hasMovedSignificantly = false;

    const onPointerDown = (e) => {
      if (isModalOpenRef.current) return;
      isDragging = true;
      hasMovedSignificantly = false;
      startPointerPos = { x: e.clientX, y: e.clientY };
      previousPointerPos = { x: e.clientX, y: e.clientY };
      velocityY = 0;
      velocityX = 0;
    };

    const onPointerMove = (e) => {
      if (!isDragging || isModalOpenRef.current) return;

      const deltaX = e.clientX - previousPointerPos.x;
      const deltaY = e.clientY - previousPointerPos.y;

      const totalDist = Math.hypot(e.clientX - startPointerPos.x, e.clientY - startPointerPos.y);
      if (totalDist > 6) {
        hasMovedSignificantly = true;
      }

      // Girar el ramo sobre su eje Y (horizontal 360°)
      targetRotY += deltaX * 0.012;
      velocityY = deltaX * 0.012;

      // Inclinación sutil vertical (limitada para mantenerlo estético)
      targetRotX += deltaY * 0.005;
      targetRotX = Math.max(-0.25, Math.min(0.3, targetRotX));
      velocityX = deltaY * 0.005;

      previousPointerPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e) => {
      if (isModalOpenRef.current) {
        isDragging = false;
        return;
      }

      const wasDragging = isDragging;
      isDragging = false;
      if (!wasDragging) return;

      // Si el clic no fue dentro del contenedor de la escena 3D, ignorar
      if (!container || !container.contains(e.target)) return;

      // Si fue solo un clic sin arrastrar, comprobar si tocó una flor
      if (!hasMovedSignificantly) {
        const rect = container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
        const y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

        mouseRef.current.set(x, y);
        raycasterRef.current.setFromCamera(mouseRef.current, camera);

        const intersects = raycasterRef.current.intersectObjects(bouquetRoot.children, true);
        if (intersects.length > 0) {
          let obj = intersects[0].object;
          while (obj && !obj.userData?.isFlower && obj.parent !== bouquetRoot && obj.parent) {
            obj = obj.parent;
          }

          if (obj && obj.userData?.isFlower) {
            obj.userData.bounce = 1.0;
            synth.playSparkle();

            confetti({
              particleCount: 50,
              spread: 70,
              origin: { 
                x: e.clientX / window.innerWidth, 
                y: e.clientY / window.innerHeight 
              },
              colors: ['#ffd700', '#ffeb3b', '#fbc02d', '#ffffff', '#ff9800']
            });

            if (onFlowerClick) {
              onFlowerClick(obj.userData.index ?? 0, obj.userData.isHero);
            }
          }
        }
      }
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Bucle de Animación
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Aplicar inercia y rotación suave al ramo
      if (!isDragging) {
        targetRotY += velocityY;
        velocityY *= 0.94; // Fricción suave

        targetRotX += velocityX;
        velocityX *= 0.92;
        // Retornar suavemente al centro vertical si está en reposo
        targetRotX = THREE.MathUtils.lerp(targetRotX, 0, 0.03);
      }

      bouquetRoot.rotation.y = THREE.MathUtils.lerp(bouquetRoot.rotation.y, targetRotY, 0.12);
      bouquetRoot.rotation.x = THREE.MathUtils.lerp(bouquetRoot.rotation.x, targetRotX, 0.12);

      // ==========================================
      // MOVIMIENTO VIVO DE LAS FLORES ("y se muevan")
      // Cada girasol respira y se mece suavemente
      // ==========================================
      flowers.forEach((fl) => {
        const { headGroup, bounce = 0, phase, origScale = 1.0, baseRot } = fl.userData;

        // Balanceo orgánico botánico individual
        const swayZ = Math.sin(elapsedTime * 1.5 + phase) * 0.045;
        const swayX = Math.cos(elapsedTime * 1.1 + phase) * 0.035;

        // Inercia dinámica al girar el ramo
        const lagX = -velocityX * 1.2;
        const lagZ = -velocityY * 1.5;

        if (headGroup) {
          headGroup.rotation.z = baseRot.z + swayZ + lagZ;
          headGroup.rotation.x = baseRot.x + swayX + lagX;
        }

        // Rebote alegre al hacer clic
        if (fl.userData.bounce > 0.01) {
          fl.userData.bounce *= 0.88;
          const bScale = origScale * (1.0 + Math.sin(fl.userData.bounce * Math.PI) * 0.22);
          fl.scale.set(bScale, bScale, bScale);
        } else {
          // Sutil pulso de respiración viviente
          const breath = 1.0 + Math.sin(elapsedTime * 1.8 + phase) * 0.015;
          fl.scale.set(origScale * breath, origScale * breath, origScale * breath);
        }
      });

      // Partículas de fondo ascendiendo suavemente
      if (bokehParticlesRef.current) {
        const pos = bokehParticlesRef.current.geometry.attributes.position;
        for (let j = 0; j < pos.count; j++) {
          let y = pos.getY(j);
          y += 0.008;
          if (y > 15) y = -2;
          pos.setY(j, y);
        }
        pos.needsUpdate = true;
        bokehParticlesRef.current.rotation.y = elapsedTime * 0.015;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      if (rendererRef.current && rendererRef.current.domElement) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      scene.clear();
    };
  }, []);

  return (
    <div className={`relative w-full h-full ${isModalOpen ? 'pointer-events-none' : ''}`}>
      <div 
        ref={containerRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none select-none"
      />
    </div>
  );
}
