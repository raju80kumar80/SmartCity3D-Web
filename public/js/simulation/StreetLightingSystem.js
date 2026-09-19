import * as THREE from 'three';

/**
 * StreetLightingSystem
 * Coordinates 16 intelligent 3D street light nodes along city avenues and ring roads.
 * Features:
 * - High-detail modern architectural poles with luminaire heads and smart sensor collars
 * - Downward SpotLight projection (castShadow = false for 60 FPS performance)
 * - Ground pool illumination ring and holographic ID tag
 * - Automatic Day/Night awareness (dim/off during day, active at night)
 * - Vehicle-aware adaptive radar sensing (reading cityScene.vehicleSimulation.vehicles)
 * - Smooth lerp brightness transitions (0.08 rate)
 * - Controlled diagnostic fault visualization for SL-08 (pulsing red luminaire and warning beacon)
 * - Interactive raycast inspection metadata (userData.isStreetLight, userData.lightData)
 */
export class StreetLightingSystem {
  constructor(lightingManager = null, vehicleSimulation = null) {
    this.lightingManager = lightingManager;
    this.vehicleSimulation = vehicleSimulation;
    this.group = new THREE.Group();
    this.group.name = 'SmartStreetLightingSystem';

    this.lightsMap = new Map(); // lightId -> node
    this.interactiveMeshes = [];
    this.animationTime = 0;
    this.lastNightState = null;

    // Shared high-performance materials
    this.initSharedMaterials();

    // Baseline approved 16 street light coordinates
    this.defaultLights = [
      // North-South Avenue (x=0, staggered at +/-7.5)
      { lightId: 'SL-01', name: 'North-South Ave Luminaire 1', zone: 'COMMERCIAL', coordinates: { x: -7.5, y: 0, z: -60, rotationY: 0 }, status: 'ON', brightness: 80, mode: 'AUTO', isFaulty: false, faultType: 'NONE' },
      { lightId: 'SL-02', name: 'North-South Ave Luminaire 2', zone: 'COMMERCIAL', coordinates: { x: 7.5, y: 0, z: -40, rotationY: Math.PI }, status: 'ON', brightness: 80, mode: 'AUTO', isFaulty: false, faultType: 'NONE' },
      { lightId: 'SL-03', name: 'North-South Ave Luminaire 3', zone: 'TRANSIT', coordinates: { x: -7.5, y: 0, z: -20, rotationY: 0 }, status: 'ON', brightness: 85, mode: 'AUTO', isFaulty: false, faultType: 'NONE' },
      { lightId: 'SL-04', name: 'North-South Ave Luminaire 4', zone: 'TRANSIT', coordinates: { x: 7.5, y: 0, z: 20, rotationY: Math.PI }, status: 'ON', brightness: 85, mode: 'AUTO', isFaulty: false, faultType: 'NONE' },
      { lightId: 'SL-05', name: 'North-South Ave Luminaire 5', zone: 'RESIDENTIAL', coordinates: { x: -7.5, y: 0, z: 40, rotationY: 0 }, status: 'ON', brightness: 75, mode: 'AUTO', isFaulty: false, faultType: 'NONE' },
      { lightId: 'SL-06', name: 'North-South Ave Luminaire 6', zone: 'RESIDENTIAL', coordinates: { x: 7.5, y: 0, z: 60, rotationY: Math.PI }, status: 'ON', brightness: 75, mode: 'AUTO', isFaulty: false, faultType: 'NONE' },

      // East-West Avenue (z=0, staggered at +/-7.5)
      { lightId: 'SL-07', name: 'East-West Ave Luminaire 1', zone: 'TECH', coordinates: { x: -60, y: 0, z: -7.5, rotationY: Math.PI / 2 }, status: 'ON', brightness: 80, mode: 'AUTO', isFaulty: false, faultType: 'NONE' },
      { lightId: 'SL-08', name: 'East-West Ave Luminaire 2 (Faulty)', zone: 'TECH', coordinates: { x: -40, y: 0, z: 7.5, rotationY: -Math.PI / 2 }, status: 'FAULT', brightness: 0, mode: 'MANUAL', isFaulty: true, faultType: 'DRIVER_FAULT' },
      { lightId: 'SL-09', name: 'East-West Ave Luminaire 3', zone: 'TRANSIT', coordinates: { x: -20, y: 0, z: -7.5, rotationY: Math.PI / 2 }, status: 'ON', brightness: 85, mode: 'AUTO', isFaulty: false, faultType: 'NONE' },
      { lightId: 'SL-10', name: 'East-West Ave Luminaire 4', zone: 'TRANSIT', coordinates: { x: 20, y: 0, z: 7.5, rotationY: -Math.PI / 2 }, status: 'ON', brightness: 85, mode: 'AUTO', isFaulty: false, faultType: 'NONE' },
      { lightId: 'SL-11', name: 'East-West Ave Luminaire 5', zone: 'PARK', coordinates: { x: 40, y: 0, z: -7.5, rotationY: Math.PI / 2 }, status: 'ON', brightness: 70, mode: 'AUTO', isFaulty: false, faultType: 'NONE' },
      { lightId: 'SL-12', name: 'East-West Ave Luminaire 6', zone: 'PARK', coordinates: { x: 60, y: 0, z: 7.5, rotationY: -Math.PI / 2 }, status: 'ON', brightness: 70, mode: 'AUTO', isFaulty: false, faultType: 'NONE' },

      // Ring Road Intersections
      { lightId: 'SL-13', name: 'North-West Ring Intersection', zone: 'TECH', coordinates: { x: -44.5, y: 0, z: -50, rotationY: -Math.PI / 2 }, status: 'ON', brightness: 80, mode: 'AUTO', isFaulty: false, faultType: 'NONE' },
      { lightId: 'SL-14', name: 'North-East Ring Intersection', zone: 'COMMERCIAL', coordinates: { x: 44.5, y: 0, z: -50, rotationY: Math.PI / 2 }, status: 'ON', brightness: 80, mode: 'AUTO', isFaulty: false, faultType: 'NONE' },
      { lightId: 'SL-15', name: 'South-West Ring Intersection', zone: 'INDUSTRIAL', coordinates: { x: -44.5, y: 0, z: 50, rotationY: -Math.PI / 2 }, status: 'ON', brightness: 80, mode: 'AUTO', isFaulty: false, faultType: 'NONE' },
      { lightId: 'SL-16', name: 'South-East Ring Intersection', zone: 'PARK', coordinates: { x: 44.5, y: 0, z: 50, rotationY: Math.PI / 2 }, status: 'ON', brightness: 75, mode: 'AUTO', isFaulty: false, faultType: 'NONE' }
    ];

    this.initLights(this.defaultLights);
  }

  setVehicleSimulation(vehicleSimulation) {
    this.vehicleSimulation = vehicleSimulation;
  }

  initSharedMaterials() {
    // Metal pole column (architectural graphite)
    this.poleMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25
    });

    // Base flange
    this.baseMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.7,
      roughness: 0.4
    });

    // Smart radar sensor collar (cyan glowing ring)
    this.sensorCollarMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.2,
      roughness: 0.3
    });

    // Aerodynamic luminaire body
    this.luminaireHousingMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.6,
      roughness: 0.3
    });
  }

  /**
   * Builds 3D street light nodes
   */
  initLights(lights) {
    lights.forEach(data => {
      const node = this.createLightNode(data);
      this.group.add(node.group);
      this.lightsMap.set(data.lightId, node);
    });
    this.rebuildInteractiveMeshes();
  }

  /**
   * Constructs the 3D model for an individual smart street lamp
   */
  createLightNode(lightData) {
    const nodeGroup = new THREE.Group();
    nodeGroup.name = `StreetLight_${lightData.lightId}`;
    const x = lightData.coordinates?.x ?? 0;
    const y = lightData.coordinates?.y ?? 0;
    const z = lightData.coordinates?.z ?? 0;
    const rotY = lightData.coordinates?.rotationY ?? 0;

    nodeGroup.position.set(x, y, z);
    nodeGroup.rotation.y = rotY;

    // 1. Hexagonal Base Plinth
    const baseGeo = new THREE.CylinderGeometry(0.42, 0.52, 0.4, 6);
    const base = new THREE.Mesh(baseGeo, this.baseMat);
    base.position.y = 0.2;
    base.receiveShadow = true;
    base.userData = { isStreetLight: true, lightData: lightData };
    nodeGroup.add(base);

    // 2. Main Vertical Pole (5.8m height)
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.18, 5.8, 12);
    const pole = new THREE.Mesh(poleGeo, this.poleMat);
    pole.position.y = 2.9;
    pole.castShadow = true;
    pole.userData = { isStreetLight: true, lightData: lightData };
    nodeGroup.add(pole);

    // 3. Smart Radar/Photocell Sensor Collar
    const collarGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.18, 12);
    const collar = new THREE.Mesh(collarGeo, this.sensorCollarMat);
    collar.position.y = 4.8;
    collar.userData = { isStreetLight: true, lightData: lightData };
    nodeGroup.add(collar);

    // 4. Cantilever Overhang Arm (curved/extended toward road center)
    const armGeo = new THREE.CylinderGeometry(0.09, 0.11, 2.4, 8);
    const arm = new THREE.Mesh(armGeo, this.poleMat);
    arm.rotation.z = Math.PI / 2.3;
    arm.position.set(1.0, 5.6, 0);
    arm.castShadow = true;
    arm.userData = { isStreetLight: true, lightData: lightData };
    nodeGroup.add(arm);

    // 5. Aerodynamic Luminaire Head
    const headGeo = new THREE.BoxGeometry(0.85, 0.18, 0.42);
    const head = new THREE.Mesh(headGeo, this.luminaireHousingMat);
    head.position.set(2.0, 6.05, 0);
    head.castShadow = true;
    head.userData = { isStreetLight: true, lightData: lightData };
    nodeGroup.add(head);

    // 6. Emissive LED Surface Panel (face down toward roadway)
    const ledGeo = new THREE.PlaneGeometry(0.68, 0.32);
    const isFault = Boolean(lightData.isFaulty || lightData.status === 'FAULT');
    const emissiveColor = isFault ? 0xef4444 : 0xfffae0;
    const emissiveIntensity = isFault ? 3.0 : (lightData.status === 'ON' ? (lightData.brightness / 100) * 2.2 : 0);

    const emissiveMat = new THREE.MeshStandardMaterial({
      color: emissiveColor,
      emissive: emissiveColor,
      emissiveIntensity: emissiveIntensity,
      roughness: 0.1
    });

    const ledPanel = new THREE.Mesh(ledGeo, emissiveMat);
    ledPanel.rotation.x = Math.PI / 2; // Facing down
    ledPanel.position.set(2.0, 5.95, 0);
    ledPanel.userData = { isStreetLight: true, lightData: lightData };
    nodeGroup.add(ledPanel);

    // 7. Downward SpotLight (lightweight: castShadow = false for 60 FPS)
    const spotLight = new THREE.SpotLight(
      isFault ? 0xef4444 : 0xffecd2,
      isFault ? 0.4 : (lightData.status === 'ON' ? 2.5 : 0),
      18,
      Math.PI / 3.8,
      0.65,
      1.5
    );
    spotLight.position.set(2.0, 5.9, 0);
    spotLight.castShadow = false;

    // Direct spot light target downward onto the roadway
    const spotTarget = new THREE.Object3D();
    spotTarget.position.set(2.0, 0, 0);
    nodeGroup.add(spotTarget);
    spotLight.target = spotTarget;
    nodeGroup.add(spotLight);

    // 8. Ground Illumination Pool Mesh (soft projected radial gradient)
    const poolGeo = new THREE.CircleGeometry(4.2, 24);
    const poolMat = new THREE.MeshBasicMaterial({
      color: isFault ? 0xef4444 : 0xfef08a,
      transparent: true,
      opacity: isFault ? 0.25 : (lightData.status === 'ON' ? 0.35 : 0.0),
      side: THREE.DoubleSide
    });
    const groundPool = new THREE.Mesh(poolGeo, poolMat);
    groundPool.rotation.x = -Math.PI / 2;
    groundPool.position.set(2.0, 0.03, 0);
    nodeGroup.add(groundPool);

    // 9. Floating Holographic Billboard Tag (displays ID & Live Brightness)
    const tagMesh = this.createFloatingTag(lightData);
    tagMesh.position.set(0, 6.8, 0);
    nodeGroup.add(tagMesh);

    return {
      group: nodeGroup,
      data: lightData,
      pole,
      arm,
      head,
      ledPanel,
      emissiveMat,
      spotLight,
      spotTarget,
      groundPool,
      poolMat,
      tagMesh,
      targetVisualBrightness: lightData.status === 'ON' ? (lightData.brightness ?? 80) : 0,
      currentVisualBrightness: lightData.status === 'ON' ? (lightData.brightness ?? 80) : 0
    };
  }

  /**
   * Creates an overhead floating billboard tag
   */
  createFloatingTag(lightData) {
    if (typeof document === 'undefined') {
      const geo = new THREE.PlaneGeometry(2.0, 0.68);
      const mat = new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { isStreetLight: true, lightData: lightData };
      return mesh;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 80;
    this.drawTagCanvas(canvas, lightData);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });

    const geo = new THREE.PlaneGeometry(2.0, 0.68);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { isStreetLight: true, lightData: lightData, canvas, texture };
    return mesh;
  }

  drawTagCanvas(canvas, lightData) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isFault = Boolean(lightData.isFaulty || lightData.status === 'FAULT');
    const isOn = lightData.status === 'ON';
    const accentColor = isFault ? '#ef4444' : (isOn ? '#06b6d4' : '#64748b');

    // Background capsule
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(4, 4, 232, 72, 14);
      ctx.fill();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      ctx.fillRect(4, 4, 232, 72);
    }

    // Status Dot
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(28, 28, 8, 0, Math.PI * 2);
    ctx.fill();

    // Light ID
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(lightData.lightId, 44, 28);

    // Brightness % or FAULT badge
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 18px Inter, sans-serif';
    ctx.textAlign = 'right';
    if (isFault) {
      ctx.fillText('FAULT', 224, 28);
    } else {
      ctx.fillText(isOn ? `${Math.round(lightData.brightness || 80)}%` : 'OFF', 224, 28);
    }

    // Subtitle: Mode & Power
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 14px Inter, sans-serif';
    ctx.textAlign = 'left';
    const powerW = isOn && !isFault ? Math.round(120 * ((lightData.brightness || 80) / 100)) : 0;
    ctx.fillText(`${lightData.mode || 'AUTO'}  |  ${powerW}W`, 16, 56);
  }

  updateFloatingTag(node) {
    const mesh = node.tagMesh;
    if (!mesh || !mesh.userData.canvas) return;
    this.drawTagCanvas(mesh.userData.canvas, node.data);
    mesh.userData.texture.needsUpdate = true;
  }

  /**
   * Rebuilds flat list of interactive raycast meshes
   */
  rebuildInteractiveMeshes() {
    this.interactiveMeshes = [];
    this.lightsMap.forEach(node => {
      node.group.traverse(child => {
        if (child.isMesh && child.userData && child.userData.isStreetLight) {
          this.interactiveMeshes.push(child);
        }
      });
    });
  }

  getInteractiveMeshes() {
    return this.interactiveMeshes;
  }

  getLightNode(lightId) {
    return this.lightsMap.get(lightId) || null;
  }

  getLightData(lightId) {
    const node = this.lightsMap.get(lightId);
    return node ? node.data : null;
  }

  /**
   * Generates live telemetry summary for the Smart Street Lighting HUD
   */
  getLightingHUDMetrics() {
    const isNight = this.lightingManager ? Boolean(this.lightingManager.isNight) : true;
    const totalLights = this.lightsMap.size;
    let activeOnCount = 0;
    let faultyCount = 0;
    const faultyDetails = [];
    let totalDbBrightness = 0;
    let totalPowerWatts = 0;
    let totalSavedPct = 0;
    const modeCounts = {};

    this.lightsMap.forEach(node => {
      const d = node.data;
      const isFault = Boolean(d.isFaulty || d.status === 'FAULT');
      const isOn = d.status === 'ON';

      if (isFault) {
        faultyCount++;
        faultyDetails.push(`${d.lightId} • ${d.faultType || 'DRIVER_FAULT'}`);
        totalPowerWatts += 15; // Diagnostic idle power draw
      } else if (isOn) {
        activeOnCount++;
        totalDbBrightness += (d.brightness ?? 80);

        // Power calculation from current visual/operational brightness
        const visualB = node.currentVisualBrightness !== undefined ? node.currentVisualBrightness : (d.brightness ?? 80);
        const rating = d.powerRatingWatts || 120;
        totalPowerWatts += rating * (visualB / 100);
      }

      totalSavedPct += (d.energySavedPct ?? 35);
      const m = d.mode || 'AUTO';
      modeCounts[m] = (modeCounts[m] || 0) + 1;
    });

    const avgBrightness = activeOnCount > 0 ? Math.round(totalDbBrightness / activeOnCount) : 0;
    const powerKw = +(totalPowerWatts / 1000).toFixed(2);
    const avgEnergySaved = totalLights > 0 ? Math.round(totalSavedPct / totalLights) : 26;

    // Dominant mode
    let dominantMode = 'AUTO';
    let maxModeCount = 0;
    for (const [m, count] of Object.entries(modeCounts)) {
      if (count > maxModeCount) {
        maxModeCount = count;
        dominantMode = m;
      }
    }
    if (Object.keys(modeCounts).length > 1 && maxModeCount < totalLights * 0.75) {
      dominantMode = 'MIXED';
    }

    const adaptiveStatus = isNight ? 'ACTIVE' : 'STANDBY';

    return {
      totalLights,
      activeOnCount,
      faultyCount,
      faultyDetails,
      avgBrightness,
      powerKw,
      avgEnergySaved,
      dominantMode,
      dayNight: isNight ? 'NIGHT' : 'DAY',
      adaptiveStatus
    };
  }

  /**
   * Synchronizes with data from GET /api/street-lights
   */
  syncLights(apiLights) {
    if (!Array.isArray(apiLights) || apiLights.length === 0) return;

    apiLights.forEach(apiData => {
      const node = this.lightsMap.get(apiData.lightId);
      if (node) {
        node.data = { ...node.data, ...apiData };

        // Handle fault state transition
        const isFault = Boolean(node.data.isFaulty || node.data.status === 'FAULT');
        if (isFault) {
          node.emissiveMat.color.setHex(0xef4444);
          node.emissiveMat.emissive.setHex(0xef4444);
          node.spotLight.color.setHex(0xef4444);
          node.poolMat.color.setHex(0xef4444);
        } else {
          node.emissiveMat.color.setHex(0xfffae0);
          node.emissiveMat.emissive.setHex(0xfffae0);
          node.spotLight.color.setHex(0xffecd2);
          node.poolMat.color.setHex(0xfef08a);
        }

        if (node.data.status === 'OFF') {
          node.targetVisualBrightness = 0;
          node.currentVisualBrightness = 0;
          this.applyVisualBrightness(node);
        } else if (!isFault) {
          if (node.data.mode === 'MANUAL') {
            node.targetVisualBrightness = node.data.brightness ?? 80;
            node.currentVisualBrightness = node.data.brightness ?? 80;
          } else if (node.currentVisualBrightness <= 0.05) {
            const isNight = this.lightingManager ? Boolean(this.lightingManager.isNight) : true;
            node.currentVisualBrightness = isNight ? 25 : 0;
            node.targetVisualBrightness = isNight ? 25 : 0;
          }
          this.applyVisualBrightness(node);
        }

        this.updateFloatingTag(node);

        // Propagate updated data to mesh userData
        node.group.traverse(child => {
          if (child.userData && child.userData.isStreetLight) {
            child.userData.lightData = node.data;
          }
        });
      }
    });

    this.rebuildInteractiveMeshes();
  }

  /**
   * Applies smooth visual brightness to Three.js materials
   */
  applyVisualBrightness(node) {
    const data = node.data;
    const isFault = Boolean(data.isFaulty || data.status === 'FAULT');
    if (isFault) return; // Fault pulsating is handled in update()

    const brightness = node.currentVisualBrightness;

    // Cache check: skip redundant material uniform re-uploads if brightness has settled (< 0.05)
    if (node.lastAppliedVisualBrightness !== undefined &&
        Math.abs(brightness - node.lastAppliedVisualBrightness) < 0.05 &&
        Math.abs(node.targetVisualBrightness - brightness) < 0.05) {
      return;
    }
    node.lastAppliedVisualBrightness = brightness;

    const intensityPct = Math.max(0, Math.min(1.0, brightness / 100));

    if (intensityPct <= 0.02) {
      // Visually OFF / Day standby
      node.emissiveMat.color.setHex(0x334155);
      node.emissiveMat.emissive.setHex(0x000000);
      node.emissiveMat.emissiveIntensity = 0;
      node.spotLight.intensity = 0;
      node.poolMat.opacity = 0;
    } else {
      // Operating luminaire: warm glow mapped to smooth visual brightness
      node.emissiveMat.color.setHex(0xfffae0);
      node.emissiveMat.emissive.setHex(0xfffae0);
      node.emissiveMat.emissiveIntensity = 0.2 + intensityPct * 2.0;
      node.spotLight.color.setHex(0xffecd2);
      node.spotLight.intensity = intensityPct * 2.8;
      node.poolMat.color.setHex(0xfef08a);
      node.poolMat.opacity = intensityPct * 0.38;
    }
  }

  /**
   * Per-frame animation loop:
   * - Day/Night integration (standby in day, active at night)
   * - Vehicle-aware adaptive brightness (ambulance priority, approach ramps)
   * - Smooth lerp transitions (0.08 rate)
   * - Preserves SL-08 red diagnostic fault beacon
   */
  update(delta = 0.016, vehicles = null) {
    this.animationTime += delta;

    const isNight = this.lightingManager ? Boolean(this.lightingManager.isNight) : true;

    // Log Day/Night mode change only once per transition
    if (this.lastNightState !== null && this.lastNightState !== isNight) {
      console.log(`[StreetLighting] Environment lighting changed -> ${isNight ? '🌙 NIGHT (Adaptive Radar Active)' : '☀️ DAY (Standby Mode)'}`);
    }
    this.lastNightState = isNight;

    const fleet = vehicles || (this.vehicleSimulation ? this.vehicleSimulation.vehicles : []);

    this.lightsMap.forEach(node => {
      const data = node.data;
      const isFault = Boolean(data.isFaulty || data.status === 'FAULT');

      if (isFault) {
        // Pulsing warning indicator for SL-08 diagnostic fault
        const pulse = 1.5 + Math.sin(this.animationTime * 5.0) * 1.2;
        node.emissiveMat.emissiveIntensity = pulse;
        node.spotLight.intensity = pulse * 0.25;
        node.poolMat.opacity = 0.15 + Math.sin(this.animationTime * 5.0) * 0.1;

        // Subtle floating tag hover
        if (node.tagMesh) {
          node.tagMesh.position.y = 6.8 + Math.sin(this.animationTime * 2.0 + node.group.position.x * 0.1) * 0.08;
        }
        return;
      }

      if (data.status === 'OFF') {
        node.targetVisualBrightness = 0;
      } else if (!isNight) {
        // DAYTIME:
        if (data.mode === 'MANUAL') {
          // MANUAL: respects manually selected status/brightness, within safe daytime ceiling
          node.targetVisualBrightness = Math.min(30, data.brightness ?? 80);
        } else {
          // AUTO / ECO_RADAR: 0% standby during daytime
          node.targetVisualBrightness = 0;
        }
      } else {
        // NIGHT TIME:
        if (data.mode === 'MANUAL') {
          // MANUAL: strictly respects database brightness without vehicle-aware adaptation
          node.targetVisualBrightness = data.brightness ?? 80;
        } else {
          // AUTO & ECO_RADAR: vehicle-aware adaptive lighting
          const lightPos = node.group.position;
          let minDist = 999;
          let nearestAmbulanceDist = 999;

          if (Array.isArray(fleet) && fleet.length > 0) {
            for (let i = 0; i < fleet.length; i++) {
              const v = fleet[i];
              if (!v.meshGroup || !v.meshGroup.position) continue;
              const vp = v.meshGroup.position;
              const dist = Math.hypot(lightPos.x - vp.x, lightPos.z - vp.z);

              if (dist < minDist) {
                minDist = dist;
              }
              if (v.type === 'AMBULANCE' && dist < nearestAmbulanceDist) {
                nearestAmbulanceDist = dist;
              }
            }
          }

          // Emergency vehicle / ambulance priority: <= 25m -> 100%
          if (nearestAmbulanceDist <= 25) {
            node.targetVisualBrightness = 100;
          } else if (minDist <= 18) {
            // Normal vehicle within 18m: 85 - 90%
            node.targetVisualBrightness = 88;
          } else if (minDist <= 30) {
            // Normal vehicle between 18m and 30m: approximately 50%
            node.targetVisualBrightness = 50;
          } else {
            // Normal vehicle beyond 30m:
            if (data.mode === 'ECO_RADAR') {
              // Stronger vehicle-aware optimization: lower base illumination
              node.targetVisualBrightness = 15;
            } else {
              // Standard AUTO: 25% energy-saving glow
              node.targetVisualBrightness = 25;
            }
          }
        }
      }

      // Smooth lerp transition around 0.08
      const lerpSpeed = 0.08;
      node.currentVisualBrightness += (node.targetVisualBrightness - node.currentVisualBrightness) * lerpSpeed;

      // Apply calculated visual brightness to materials and spotlight
      this.applyVisualBrightness(node);

      // Subtle floating tag hover
      if (node.tagMesh) {
        node.tagMesh.position.y = 6.8 + Math.sin(this.animationTime * 2.0 + node.group.position.x * 0.1) * 0.08;
      }
    });
  }
}
