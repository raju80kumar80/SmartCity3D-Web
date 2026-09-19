import * as THREE from 'three';

/**
 * EnvironmentMonitoringSystem
 * Manages 3D atmospheric and air quality sensor towers, overhead floating billboard tags,
 * dynamic AQI status halos, eco-filter mitigation visuals, and interactive raycasting.
 */
export class EnvironmentMonitoringSystem {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'SmartEnvironmentMonitoringSystem';

    this.interactiveMeshes = [];
    this.sensorsMap = new Map(); // sensorId -> sensor visual object
    this.animationTime = 0;

    // Shared Materials Palette
    this.initSharedMaterials();

    // Default fallback stations if offline
    this.defaultSensors = [
      {
        sensorId: 'ENV-01',
        name: 'Central Eco Park Station',
        zone: 'PARK',
        coordinates: { x: 22, z: 18 },
        temperature: 22.4,
        humidity: 64,
        aqi: 28,
        pm25: 8,
        pm10: 16,
        co2: 395,
        no2: 12,
        status: 'GOOD',
        ecoFilterActive: false
      },
      {
        sensorId: 'ENV-02',
        name: 'Commercial Financial District Station',
        zone: 'COMMERCIAL',
        coordinates: { x: 22, z: -22 },
        temperature: 26.8,
        humidity: 48,
        aqi: 72,
        pm25: 24,
        pm10: 45,
        co2: 480,
        no2: 28,
        status: 'MODERATE',
        ecoFilterActive: false
      },
      {
        sensorId: 'ENV-03',
        name: 'Tech & Innovation Park Station',
        zone: 'TECH',
        coordinates: { x: -22, z: -20 },
        temperature: 24.1,
        humidity: 52,
        aqi: 45,
        pm25: 14,
        pm10: 28,
        co2: 420,
        no2: 19,
        status: 'GOOD',
        ecoFilterActive: false
      },
      {
        sensorId: 'ENV-04',
        name: 'Residential Living District Station',
        zone: 'RESIDENTIAL',
        coordinates: { x: -20, z: 22 },
        temperature: 23.5,
        humidity: 58,
        aqi: 38,
        pm25: 11,
        pm10: 22,
        co2: 405,
        no2: 15,
        status: 'GOOD',
        ecoFilterActive: false
      },
      {
        sensorId: 'ENV-05',
        name: 'Central Traffic Hub Roundabout Station',
        zone: 'TRANSIT',
        coordinates: { x: 6, z: -6 },
        temperature: 27.5,
        humidity: 46,
        aqi: 118,
        pm25: 42,
        pm10: 78,
        co2: 540,
        no2: 36,
        status: 'UNHEALTHY',
        ecoFilterActive: false
      },
      {
        sensorId: 'ENV-06',
        name: 'West Gate Industrial Corridor Station',
        zone: 'INDUSTRIAL',
        coordinates: { x: -45, z: -10 },
        temperature: 25.2,
        humidity: 50,
        aqi: 68,
        pm25: 22,
        pm10: 41,
        co2: 460,
        no2: 24,
        status: 'MODERATE',
        ecoFilterActive: false
      }
    ];

    this.initStations(this.defaultSensors);
  }

  initSharedMaterials() {
    // Metal tower pole
    this.towerPoleMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.8,
      roughness: 0.25
    });

    // Station base housing
    this.housingMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.4,
      roughness: 0.5
    });

    // Solar micro-panel
    this.solarPanelMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      metalness: 0.85,
      roughness: 0.15
    });

    // Sensor intake vents
    this.ventMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.6,
      roughness: 0.4
    });

    // Color definitions for status
    this.statusColors = {
      GOOD: { hex: 0x10b981, css: '#10b981', label: 'Good' },
      MODERATE: { hex: 0xf59e0b, css: '#f59e0b', label: 'Moderate' },
      UNHEALTHY: { hex: 0xef4444, css: '#ef4444', label: 'Unhealthy' },
      HAZARDOUS: { hex: 0x9333ea, css: '#9333ea', label: 'Hazardous' }
    };
  }

  /**
   * Initializes initial 3D sensor stations
   */
  initStations(sensors) {
    sensors.forEach(sensor => {
      const stationObj = this.createSensorStation(sensor);
      this.group.add(stationObj.group);
      this.sensorsMap.set(sensor.sensorId, stationObj);
    });
    this.rebuildInteractiveMeshes();
  }

  /**
   * Constructs the 3D model for an environmental sensor station
   */
  createSensorStation(sensor) {
    const stationGroup = new THREE.Group();
    stationGroup.name = `EnvStation_${sensor.sensorId}`;
    const x = sensor.coordinates?.x ?? 0;
    const z = sensor.coordinates?.z ?? 0;
    stationGroup.position.set(x, 0, z);

    const statusInfo = this.statusColors[sensor.status] || this.statusColors.GOOD;

    // 1. Concrete Ground Base Plinth
    const plinthGeo = new THREE.CylinderGeometry(0.7, 0.8, 0.25, 16);
    const plinth = new THREE.Mesh(plinthGeo, this.housingMat);
    plinth.position.y = 0.125;
    plinth.receiveShadow = true;
    plinth.userData = { isEnvironmentSensor: true, sensorData: sensor };
    stationGroup.add(plinth);

    // 2. Vertical Telemetry Mast
    const mastGeo = new THREE.CylinderGeometry(0.12, 0.16, 3.4, 12);
    const mast = new THREE.Mesh(mastGeo, this.towerPoleMat);
    mast.position.y = 1.85;
    mast.castShadow = true;
    mast.userData = { isEnvironmentSensor: true, sensorData: sensor };
    stationGroup.add(mast);

    // 3. Meteorological Instrument Pod / Vents
    const podGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.65, 12);
    const pod = new THREE.Mesh(podGeo, this.housingMat);
    pod.position.y = 2.6;
    pod.castShadow = true;
    pod.userData = { isEnvironmentSensor: true, sensorData: sensor };
    stationGroup.add(pod);

    // Intake vent rings
    const ventRingGeo = new THREE.TorusGeometry(0.38, 0.04, 8, 16);
    const ventRing1 = new THREE.Mesh(ventRingGeo, this.ventMat);
    ventRing1.rotation.x = Math.PI / 2;
    ventRing1.position.y = 2.45;
    stationGroup.add(ventRing1);

    const ventRing2 = ventRing1.clone();
    ventRing2.position.y = 2.75;
    stationGroup.add(ventRing2);

    // 4. Solar Micro-Collector Canopy (top cap angled toward sun)
    const solarGeo = new THREE.BoxGeometry(0.85, 0.05, 0.85);
    const solar = new THREE.Mesh(solarGeo, this.solarPanelMat);
    solar.position.set(0, 3.65, 0);
    solar.rotation.x = 0.25; // Tilt toward sky
    solar.castShadow = true;
    solar.userData = { isEnvironmentSensor: true, sensorData: sensor };
    stationGroup.add(solar);

    // 5. Dynamic Luminous Status Beacon (glows according to AQI)
    const beaconGeo = new THREE.SphereGeometry(0.16, 16, 12);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: statusInfo.hex,
      emissive: statusInfo.hex,
      emissiveIntensity: sensor.status === 'UNHEALTHY' ? 3.0 : 1.8,
      roughness: 0.2
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 3.82;
    beacon.userData = { isEnvironmentSensor: true, sensorData: sensor };
    stationGroup.add(beacon);

    // 6. Ground AQI Ambient Ring / Halo
    const haloGeo = new THREE.RingGeometry(1.2, 1.6, 24);
    const haloMat = new THREE.MeshBasicMaterial({
      color: statusInfo.hex,
      transparent: true,
      opacity: sensor.status === 'UNHEALTHY' ? 0.65 : 0.35,
      side: THREE.DoubleSide
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.05;
    stationGroup.add(halo);

    // 7. Eco-Filter Mist Aura (shown when eco-purification is active)
    const mistGeo = new THREE.CylinderGeometry(1.8, 1.8, 3.2, 16, 1, true);
    const mistMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: sensor.ecoFilterActive ? 0.35 : 0.0,
      side: THREE.DoubleSide,
      wireframe: true
    });
    const mistMesh = new THREE.Mesh(mistGeo, mistMat);
    mistMesh.position.y = 1.8;
    stationGroup.add(mistMesh);

    // 8. Overhead Floating Holographic Tag / Billboard
    const tagMesh = this.createFloatingTag(sensor);
    tagMesh.position.set(0, 4.6, 0);
    stationGroup.add(tagMesh);

    return {
      group: stationGroup,
      data: sensor,
      beacon,
      beaconMat,
      halo,
      haloMat,
      mistMesh,
      mistMat,
      tagMesh
    };
  }

  /**
   * Creates an overhead floating billboard tag showing Sensor ID, AQI & Temperature
   */
  createFloatingTag(sensor) {
    const canvas = document.createElement('canvas');
    canvas.width = 280;
    canvas.height = 96;
    this.drawTagCanvas(canvas, sensor);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });

    const geo = new THREE.PlaneGeometry(2.4, 0.82);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { isEnvironmentSensor: true, sensorData: sensor, canvas, texture };
    return mesh;
  }

  drawTagCanvas(canvas, sensor) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const statusInfo = this.statusColors[sensor.status] || this.statusColors.GOOD;

    // Pill background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(6, 6, 268, 84, 16);
      ctx.fill();
      ctx.strokeStyle = statusInfo.css;
      ctx.lineWidth = 3.5;
      ctx.stroke();
    } else {
      ctx.fillRect(6, 6, 268, 84);
      ctx.strokeStyle = statusInfo.css;
      ctx.lineWidth = 3.5;
      ctx.strokeRect(6, 6, 268, 84);
    }

    // Status Indicator Dot
    ctx.fillStyle = statusInfo.css;
    ctx.beginPath();
    ctx.arc(32, 34, 10, 0, Math.PI * 2);
    ctx.fill();

    // Sensor ID
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(sensor.sensorId, 50, 34);

    // AQI Badge text
    ctx.fillStyle = statusInfo.css;
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`AQI ${sensor.aqi}`, 260, 34);

    // Subtitle: Temperature & Humidity
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 18px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🌡️ ${sensor.temperature}°C  |  💧 ${sensor.humidity}%`, 22, 68);
  }

  /**
   * Updates floating tag canvas with fresh sensor data
   */
  updateFloatingTag(stationObj) {
    const mesh = stationObj.tagMesh;
    if (!mesh || !mesh.userData.canvas) return;

    this.drawTagCanvas(mesh.userData.canvas, stationObj.data);
    mesh.userData.texture.needsUpdate = true;
  }

  /**
   * Applies visual changes to beacon, halo, mist, and meshes
   */
  applySensorVisuals(stationObj) {
    const sensor = stationObj.data;
    const statusInfo = this.statusColors[sensor.status] || this.statusColors.GOOD;

    // Beacon emissive intensity & color
    stationObj.beaconMat.color.setHex(statusInfo.hex);
    stationObj.beaconMat.emissive.setHex(statusInfo.hex);
    stationObj.beaconMat.emissiveIntensity = sensor.status === 'UNHEALTHY' ? 3.0 : 1.8;

    // Ground halo
    stationObj.haloMat.color.setHex(statusInfo.hex);
    stationObj.haloMat.opacity = sensor.status === 'UNHEALTHY' ? 0.65 : 0.35;

    // Eco-Filter mist visualization
    stationObj.mistMat.opacity = sensor.ecoFilterActive ? 0.35 : 0.0;

    // Update billboard tag
    this.updateFloatingTag(stationObj);

    // Propagate updated sensor data to mesh userData
    stationObj.group.traverse(child => {
      if (child.userData && child.userData.isEnvironmentSensor) {
        child.userData.sensorData = sensor;
      }
    });
  }

  /**
   * Rebuilds the flat list of interactive raycast meshes
   */
  rebuildInteractiveMeshes() {
    this.interactiveMeshes = [];
    this.sensorsMap.forEach(stationObj => {
      stationObj.group.traverse(child => {
        if (child.isMesh && child.userData && child.userData.isEnvironmentSensor) {
          this.interactiveMeshes.push(child);
        }
      });
    });
  }

  getInteractiveMeshes() {
    return this.interactiveMeshes;
  }

  /**
   * Synchronizes 3D stations with data from GET /api/environment
   */
  syncSensors(apiSensors) {
    if (!Array.isArray(apiSensors) || apiSensors.length === 0) return;

    apiSensors.forEach(apiSensor => {
      const station = this.sensorsMap.get(apiSensor.sensorId);
      if (station) {
        station.data = apiSensor;
        this.applySensorVisuals(station);
      } else {
        const newStation = this.createSensorStation(apiSensor);
        this.group.add(newStation.group);
        this.sensorsMap.set(apiSensor.sensorId, newStation);
      }
    });

    this.rebuildInteractiveMeshes();
  }

  /**
   * Per-frame animation loop (pulsing beacons, mist rotation, tag hover & billboard facing)
   */
  update(delta = 0.016, camera = null) {
    this.animationTime += delta;

    this.sensorsMap.forEach(stationObj => {
      const sensor = stationObj.data;

      // Animate floating tag hover & billboard facing
      if (stationObj.tagMesh) {
        stationObj.tagMesh.position.y = 4.6 + Math.sin(this.animationTime * 2.0 + stationObj.group.position.x) * 0.12;
        if (camera) {
          stationObj.tagMesh.quaternion.copy(camera.quaternion);
        }
      }

      // Pulse ground halo on unhealthy stations
      if (sensor.status === 'UNHEALTHY' && stationObj.halo) {
        const scale = 1.0 + Math.sin(this.animationTime * 4.0) * 0.12;
        stationObj.halo.scale.set(scale, scale, 1);
        stationObj.beaconMat.emissiveIntensity = 2.0 + Math.sin(this.animationTime * 6.0) * 1.5;
      }

      // Rotate eco-filter mist cylinder if active
      if (sensor.ecoFilterActive && stationObj.mistMesh) {
        stationObj.mistMesh.rotation.y += delta * 1.5;
      }
    });
  }
}
