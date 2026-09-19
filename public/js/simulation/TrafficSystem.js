import * as THREE from 'three';

/**
 * TrafficSystem
 * Coordinates 3D traffic signals at city junctions, dynamic RED/YELLOW/GREEN lens emissions,
 * countdown timers, overhead floating junction tags, and raycasting interactions.
 */
export class TrafficSystem {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'SmartTrafficSystem';

    this.interactiveMeshes = [];
    this.signals = new Map(); // junctionId -> signal instance object
    this.lastTime = performance.now();

    // Base materials
    this.metalPoleMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.75,
      roughness: 0.3
    });

    this.housingMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.5,
      metalness: 0.2
    });

    this.hoodMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6
    });

    // Color definitions for signal states
    this.colors = {
      RED: { color: 0xef4444, hex: '#ef4444' },
      YELLOW: { color: 0xf59e0b, hex: '#f59e0b' },
      GREEN: { color: 0x10b981, hex: '#10b981' }
    };

    // Junction placement layout (positioned along roadside curb at crosswalks)
    this.junctionLayouts = [
      { id: 'J-NORTH', x: 7.5,  z: -35, rot: Math.PI,       name: 'North Boulevard Junction' },
      { id: 'J-SOUTH', x: -7.5, z: 35,  rot: 0,             name: 'South Highway Junction' },
      { id: 'J-EAST',  x: 35,   z: 7.5, rot: -Math.PI / 2,   name: 'East Commercial Avenue' },
      { id: 'J-WEST',  x: -35,  z: -7.5, rot: Math.PI / 2,   name: 'West Residential Gate' }
    ];

    this.initSignals();
  }

  /**
   * Initializes the 3D signal models at each junction
   */
  initSignals() {
    this.junctionLayouts.forEach(j => {
      const signalGroup = new THREE.Group();
      signalGroup.name = `TrafficSignal_${j.id}`;
      signalGroup.position.set(j.x, 0, j.z);
      signalGroup.rotation.y = j.rot;

      const defaultData = {
        junctionId: j.id,
        name: j.name,
        status: (j.id === 'J-NORTH' || j.id === 'J-EAST') ? 'GREEN' : 'RED',
        cycleDuration: 15,
        elapsedTime: (j.id === 'J-NORTH' || j.id === 'J-EAST') ? 5 : 10,
        remainingTime: 15,
        emergencyOverride: false,
        coordinates: { x: j.x, z: j.z }
      };

      // 1. Vertical Mast Pole
      const mastGeo = new THREE.CylinderGeometry(0.18, 0.24, 6.8, 12);
      const mast = new THREE.Mesh(mastGeo, this.metalPoleMat);
      mast.position.y = 3.4;
      mast.castShadow = true;
      mast.userData = { isTrafficSignal: true, signalData: defaultData };
      signalGroup.add(mast);
      this.interactiveMeshes.push(mast);

      // Mast Base Ring
      const baseGeo = new THREE.CylinderGeometry(0.4, 0.5, 0.3, 12);
      const base = new THREE.Mesh(baseGeo, this.metalPoleMat);
      base.position.y = 0.15;
      base.userData = { isTrafficSignal: true, signalData: defaultData };
      signalGroup.add(base);
      this.interactiveMeshes.push(base);

      // 2. Horizontal Cantilever Arm extending toward the road center
      const armGeo = new THREE.CylinderGeometry(0.1, 0.1, 3.4, 8);
      const arm = new THREE.Mesh(armGeo, this.metalPoleMat);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(1.7, 6.2, 0);
      arm.castShadow = true;
      arm.userData = { isTrafficSignal: true, signalData: defaultData };
      signalGroup.add(arm);
      this.interactiveMeshes.push(arm);

      // 3. Traffic Signal Housing Box
      const boxGeo = new THREE.BoxGeometry(0.7, 2.0, 0.6);
      const box = new THREE.Mesh(boxGeo, this.housingMat);
      box.position.set(2.8, 5.9, 0);
      box.castShadow = true;
      box.userData = { isTrafficSignal: true, signalData: defaultData };
      signalGroup.add(box);
      this.interactiveMeshes.push(box);

      // 4. Optical Lenses (RED, YELLOW, GREEN)
      const lensGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.16, 16);

      // RED Lens (Top)
      const redMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xef4444,
        emissiveIntensity: defaultData.status === 'RED' ? 2.0 : 0.08,
        roughness: 0.2
      });
      const redLens = new THREE.Mesh(lensGeo, redMat);
      redLens.rotation.x = Math.PI / 2;
      redLens.position.set(2.8, 6.5, 0.28);
      redLens.userData = { isTrafficSignal: true, signalData: defaultData };
      signalGroup.add(redLens);
      this.interactiveMeshes.push(redLens);

      // YELLOW Lens (Middle)
      const yellowMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xf59e0b,
        emissiveIntensity: defaultData.status === 'YELLOW' ? 2.0 : 0.08,
        roughness: 0.2
      });
      const yellowLens = new THREE.Mesh(lensGeo, yellowMat);
      yellowLens.rotation.x = Math.PI / 2;
      yellowLens.position.set(2.8, 5.9, 0.28);
      yellowLens.userData = { isTrafficSignal: true, signalData: defaultData };
      signalGroup.add(yellowLens);
      this.interactiveMeshes.push(yellowLens);

      // GREEN Lens (Bottom)
      const greenMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x10b981,
        emissiveIntensity: defaultData.status === 'GREEN' ? 2.0 : 0.08,
        roughness: 0.2
      });
      const greenLens = new THREE.Mesh(lensGeo, greenMat);
      greenLens.rotation.x = Math.PI / 2;
      greenLens.position.set(2.8, 5.3, 0.28);
      greenLens.userData = { isTrafficSignal: true, signalData: defaultData };
      signalGroup.add(greenLens);
      this.interactiveMeshes.push(greenLens);

      // Hood Visors above each lens
      [-0.6, 0, 0.6].forEach(offsetY => {
        const hoodGeo = new THREE.BoxGeometry(0.48, 0.08, 0.35);
        const hood = new THREE.Mesh(hoodGeo, this.hoodMat);
        hood.position.set(2.8, 5.9 + offsetY + 0.22, 0.32);
        hood.rotation.x = 0.2;
        signalGroup.add(hood);
      });

      // 5. Junction Ground Road Wash Light
      const roadLight = new THREE.PointLight(
        defaultData.status === 'GREEN' ? 0x10b981 : (defaultData.status === 'YELLOW' ? 0xf59e0b : 0xef4444),
        1.8,
        14
      );
      roadLight.position.set(2.8, 4.5, 2.5);
      roadLight.castShadow = false;
      signalGroup.add(roadLight);

      // 6. Floating 3D Junction Tag / Billboard
      const tagMesh = this.createFloatingTag(j.id, defaultData.status, defaultData.remainingTime, defaultData);
      tagMesh.position.set(2.8, 7.6, 0);
      signalGroup.add(tagMesh);

      this.group.add(signalGroup);

      // Store signal instance reference
      this.signals.set(j.id, {
        id: j.id,
        name: j.name,
        group: signalGroup,
        data: defaultData,
        lenses: { RED: redLens, YELLOW: yellowLens, GREEN: greenLens },
        materials: { RED: redMat, YELLOW: yellowMat, GREEN: greenMat },
        roadLight,
        tagMesh,
        elapsedTime: defaultData.elapsedTime,
        lastState: defaultData.status
      });
    });
  }

  /**
   * Creates an overhead floating billboard tag showing Junction ID, Status & Timer
   */
  createFloatingTag(junctionId, status, remainingTime, signalData) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 96;
    this.drawTagCanvas(canvas, junctionId, status, remainingTime);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });

    const geo = new THREE.PlaneGeometry(2.2, 0.82);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { isTrafficSignal: true, signalData, canvas, texture };
    this.interactiveMeshes.push(mesh);
    return mesh;
  }

  drawTagCanvas(canvas, junctionId, status, remainingTime) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Pill background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(8, 8, 240, 80, 16);
      ctx.fill();
      ctx.strokeStyle = status === 'GREEN' ? '#10b981' : (status === 'YELLOW' ? '#f59e0b' : '#ef4444');
      ctx.lineWidth = 4;
      ctx.stroke();
    } else {
      ctx.fillRect(8, 8, 240, 80);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, 240, 80);
    }

    // Status Indicator Dot
    ctx.fillStyle = status === 'GREEN' ? '#10b981' : (status === 'YELLOW' ? '#f59e0b' : '#ef4444');
    ctx.beginPath();
    ctx.arc(38, 48, 14, 0, Math.PI * 2);
    ctx.fill();

    // Junction ID
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(junctionId, 62, 48);

    // Remaining Countdown
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${remainingTime}s`, 232, 48);
  }

  /**
   * Updates floating tag canvas with fresh status and countdown
   */
  updateFloatingTag(signalInstance) {
    const mesh = signalInstance.tagMesh;
    if (!mesh || !mesh.userData.canvas) return;

    this.drawTagCanvas(
      mesh.userData.canvas,
      signalInstance.id,
      signalInstance.data.status,
      signalInstance.data.remainingTime
    );
    mesh.userData.texture.needsUpdate = true;
  }

  /**
   * Syncs real-time signals from GET /api/traffic
   */
  syncSignals(apiSignals) {
    if (!Array.isArray(apiSignals)) return;

    apiSignals.forEach(apiSig => {
      const signal = this.signals.get(apiSig.junctionId);
      if (signal) {
        signal.data.name = apiSig.name || signal.data.name;
        signal.data.status = apiSig.status || signal.data.status;
        signal.data.cycleDuration = apiSig.cycleDuration || 15;
        signal.data.emergencyOverride = Boolean(apiSig.emergencyOverride);
        if (apiSig.coordinates) {
          signal.data.coordinates = apiSig.coordinates;
        }

        // Apply visual state
        this.applySignalVisuals(signal);
      }
    });
  }

  /**
   * Applies the optical lens materials and light colors for a signal's status
   */
  applySignalVisuals(signal) {
    const status = signal.data.status;

    // Lenses glow intensity
    signal.materials.RED.emissiveIntensity = status === 'RED' ? 2.2 : 0.06;
    signal.materials.YELLOW.emissiveIntensity = status === 'YELLOW' ? 2.2 : 0.06;
    signal.materials.GREEN.emissiveIntensity = status === 'GREEN' ? 2.2 : 0.06;

    // Road wash light color
    const lightColor = status === 'GREEN' ? 0x10b981 : (status === 'YELLOW' ? 0xf59e0b : 0xef4444);
    signal.roadLight.color.setHex(lightColor);

    // Update all sub-meshes userData reference
    signal.group.traverse(child => {
      if (child.userData && child.userData.isTrafficSignal) {
        child.userData.signalData = signal.data;
      }
    });

    this.updateFloatingTag(signal);
  }

  /**
   * Animation & autonomous cycle update tick
   */
  update(deltaTime = 0.016, camera = null) {
    this.signals.forEach(signal => {
      // Orient floating tag to camera
      if (camera && signal.tagMesh) {
        signal.tagMesh.quaternion.copy(camera.quaternion);
      }

      // If emergency override active, freeze standard cycle and hold green
      if (signal.data.emergencyOverride) {
        signal.data.status = 'GREEN';
        signal.data.remainingTime = 99;
        this.applySignalVisuals(signal);
        return;
      }

      signal.elapsedTime += deltaTime;
      const cycle = signal.data.cycleDuration || 15;

      // Calculate remaining time in current phase
      const remaining = Math.max(0, Math.ceil(cycle - (signal.elapsedTime % cycle)));
      if (remaining !== signal.data.remainingTime) {
        signal.data.remainingTime = remaining;
        this.updateFloatingTag(signal);
      }

      // Autonomous phase cycle transitions:
      // When cycle completes, advance phase
      if (signal.elapsedTime >= cycle) {
        signal.elapsedTime = 0;
        this.advancePhase(signal);
      }
    });
  }

  /**
   * Advances signal to its next natural phase
   */
  advancePhase(signal) {
    let nextStatus = 'GREEN';
    if (signal.data.status === 'GREEN') {
      nextStatus = 'YELLOW';
      signal.data.cycleDuration = 4; // Short caution window
    } else if (signal.data.status === 'YELLOW') {
      nextStatus = 'RED';
      signal.data.cycleDuration = 15;
    } else {
      nextStatus = 'GREEN';
      signal.data.cycleDuration = 15;
    }

    signal.data.status = nextStatus;
    this.applySignalVisuals(signal);
  }

  /**
   * Manually sets a signal's status (e.g. from user click or API)
   */
  setSignalStatus(junctionId, newStatus) {
    const signal = this.signals.get(junctionId);
    if (signal && ['RED', 'YELLOW', 'GREEN'].includes(newStatus)) {
      signal.data.status = newStatus;
      signal.elapsedTime = 0;
      signal.data.remainingTime = signal.data.cycleDuration;
      this.applySignalVisuals(signal);
    }
  }

  /**
   * Returns all interactive meshes for raycast selection
   */
  getInteractiveMeshes() {
    return this.interactiveMeshes;
  }

  /**
   * Returns current telemetry list of all signals
   */
  getSignalsData() {
    return Array.from(this.signals.values()).map(s => s.data);
  }
}
