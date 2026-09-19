import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { LightingManager } from './core/LightingManager.js';
import { RoadBuilder } from './city/RoadBuilder.js';
import { BuildingBuilder } from './city/BuildingBuilder.js';
import { Environment } from './city/Environment.js';
import { ParkingSystem } from './simulation/ParkingSystem.js';
import { TrafficSystem } from './simulation/TrafficSystem.js';
import { EmergencySystem } from './simulation/EmergencySystem.js';
import { VehicleSimulation } from './simulation/VehicleSimulation.js';
import { EnvironmentMonitoringSystem } from './simulation/EnvironmentMonitoringSystem.js';
import { StreetLightingSystem } from './simulation/StreetLightingSystem.js';
import { FacilityBuilder } from './city/FacilityBuilder.js';
import { PedestrianSystem } from './simulation/PedestrianSystem.js';

/**
 * CityScene
 * Master 3D WebGL Scene controller coordinating rendering, controls, lighting,
 * procedural city generation, smart parking system, smart traffic system, emergency management,
 * vehicle simulation, and raycast interactions.
 */
export class CityScene {
  constructor(containerElement, onFpsUpdate) {
    this.container = containerElement;
    this.onFpsUpdate = onFpsUpdate;
    this.onSlotSelect = null;
    this.onSignalSelect = null;
    this.onIncidentSelect = null;
    this.onVehicleSelect = null;
    this.onSensorSelect = null;
    this.onLightSelect = null;
    this.onFacilitySelect = null;
    this.onPedestrianSelect = null;
    this.onEnergyIndicatorSelect = null;

    this.energyIndicatorGroup = null;
    this.energyIndicatorMeshes = [];
    this.energyCrystal = null;
    this.energyCrystalMat = null;
    this.energyBillboard = null;
    this.energyCanvas = null;
    this.energyCtx = null;
    this.energyTexture = null;

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    // Subsystems
    this.lightingManager = null;
    this.roadBuilder = null;
    this.buildingBuilder = null;
    this.environment = null;
    this.parkingSystem = null;
    this.trafficSystem = null;
    this.emergencySystem = null;
    this.vehicleSimulation = null;
    this.environmentMonitoringSystem = null;
    this.streetLightingSystem = null;
    this.facilityBuilder = null;
    this.pedestrianSystem = null;

    // Raycasting & Interaction
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.pointerDownPos = { x: 0, y: 0 };

    // Scene Groups
    this.groundMesh = null;
    this.gridHelper = null;

    // Animation & State
    this.isAutoRotating = false;
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.fps = 60;

    this.init();
  }

  init() {
    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1d);
    this.scene.fog = new THREE.FogExp2(0x0a0f1d, 0.0075);

    // 2. Camera setup
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.setDefaultCameraPosition();

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.04; // Prevent going below ground
    this.controls.minDistance = 15;
    this.controls.maxDistance = 250;
    this.controls.target.set(0, 0, 0);

    // 5. Lighting Subsystem
    this.lightingManager = new LightingManager(this.scene);

    // 6. City Ground & Grid Base
    this.setupGround();

    // 7. Road Network Generation
    this.roadBuilder = new RoadBuilder();
    this.scene.add(this.roadBuilder.build());

    // 8. Procedural Buildings (Commercial, Residential, Tech Zones)
    this.buildingBuilder = new BuildingBuilder();
    this.scene.add(this.buildingBuilder.build());

    // 9. Parks, Trees, Street Lamps & 3D Traffic Signals
    this.environment = new Environment(this.lightingManager);
    this.scene.add(this.environment.build());

    // 10. Smart Parking System (Visual slots and real-time indicators)
    this.parkingSystem = new ParkingSystem();
    this.scene.add(this.parkingSystem.group);

    // 10b. Smart Traffic System (Junction signals, timers, optical lenses)
    this.trafficSystem = new TrafficSystem();
    this.scene.add(this.trafficSystem.group);

    // 10c. Smart Emergency System (Incidents, beacons, responder vehicles)
    this.emergencySystem = new EmergencySystem();
    this.scene.add(this.emergencySystem.group);

    // 10d. Smart Vehicle & Traffic Simulation (Cars, Buses, Taxis, Ambulances)
    this.vehicleSimulation = new VehicleSimulation(this.trafficSystem, this.camera);
    this.scene.add(this.vehicleSimulation.group);

    // 10e. Smart Environment Monitoring System (Atmospheric sensors, AQI, mist mitigation)
    this.environmentMonitoringSystem = new EnvironmentMonitoringSystem();
    this.scene.add(this.environmentMonitoringSystem.group);

    // 10f. Smart Street Lighting System (Adaptive radar dimming, day/night sync, energy analytics)
    this.streetLightingSystem = new StreetLightingSystem(this.lightingManager, this.vehicleSimulation);
    this.scene.add(this.streetLightingSystem.group);

    // 10g. Smart City Facilities (Hospital, Police, Fire, School, Bus, Park, Gov Office, Mall, Power, Water)
    this.facilityBuilder = new FacilityBuilder(this.lightingManager);
    this.scene.add(this.facilityBuilder.group);

    // 10h. Smart Pedestrian System (24 low-poly citizens, limb walking animations, crosswalk & vehicle avoidance)
    this.pedestrianSystem = new PedestrianSystem(this.lightingManager, this.vehicleSimulation, this.facilityBuilder);
    this.scene.add(this.pedestrianSystem.group);

    // 10i. Floating 3D Energy Indicator & Holographic Status Node (Step 9)
    this.setupEnergyIndicator();

    // When user manually manipulates camera, release vehicle follow lock
    this.controls.addEventListener('start', () => {
      if (this.vehicleSimulation) {
        this.vehicleSimulation.clearFollowVehicle();
      }
    });

    // 11. Interaction Listeners (Raycasting for parking slot, traffic signal, emergency, and vehicle selection)
    this.setupInteraction();

    // 12. Resize handler
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // 13. Start animation loop
    this.animate();
  }

  setDefaultCameraPosition() {
    this.camera.position.set(65, 52, 70);
    this.camera.lookAt(0, 0, 0);
  }

  setupGround() {
    const groundGeo = new THREE.PlaneGeometry(220, 220);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.95,
      metalness: 0.05
    });
    this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.y = 0;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);

    this.gridHelper = new THREE.GridHelper(200, 50, 0x06b6d4, 0x1e293b);
    this.gridHelper.position.y = 0.02;
    this.scene.add(this.gridHelper);
  }

  setupInteraction() {
    const dom = this.renderer.domElement;

    dom.addEventListener('pointerdown', (e) => {
      this.pointerDownPos = { x: e.clientX, y: e.clientY };
    });

    dom.addEventListener('pointerup', (e) => {
      // Distinguish between a drag (orbiting) and a quick click
      const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
      if (dist < 6) {
        this.handleClick(e);
      }
    });

    dom.addEventListener('pointermove', (e) => {
      this.handleHover(e);
    });
  }

  findInteractiveTarget(object) {
    let curr = object;
    while (curr) {
      if (curr.userData && curr.userData.isParkingSlot && curr.userData.slotData) {
        return { type: 'parking', data: curr.userData.slotData };
      }
      if (curr.userData && curr.userData.isTrafficSignal && curr.userData.signalData) {
        return { type: 'traffic', data: curr.userData.signalData };
      }
      if (curr.userData && curr.userData.isEmergencyIncident && curr.userData.incidentData) {
        return { type: 'emergency', data: curr.userData.incidentData };
      }
      if (curr.userData && curr.userData.isVehicle && curr.userData.vehicleData) {
        return { type: 'vehicle', data: curr.userData.vehicleData };
      }
      if (curr.userData && curr.userData.isEnvironmentSensor && curr.userData.sensorData) {
        return { type: 'environment', data: curr.userData.sensorData };
      }
      if (curr.userData && curr.userData.isStreetLight && curr.userData.lightData) {
        return { type: 'streetLight', data: curr.userData.lightData };
      }
      if (curr.userData && curr.userData.isFacility && curr.userData.facilityData) {
        return { type: 'facility', data: curr.userData.facilityData };
      }
      if (curr.userData && curr.userData.isPedestrian && curr.userData.pedestrianData) {
        return { type: 'pedestrian', data: curr.userData.pedestrianData };
      }
      if (curr.userData && curr.userData.isEnergyIndicator) {
        return { type: 'energyIndicator', data: curr.userData.energyData || {} };
      }
      curr = curr.parent;
    }
    return null;
  }

  getCombinedInteractiveMeshes() {
    const meshes = [];
    if (this.parkingSystem) {
      meshes.push(...this.parkingSystem.getInteractiveMeshes());
    }
    if (this.trafficSystem) {
      meshes.push(...this.trafficSystem.getInteractiveMeshes());
    }
    if (this.emergencySystem) {
      meshes.push(...this.emergencySystem.getInteractiveMeshes());
    }
    if (this.vehicleSimulation) {
      meshes.push(...this.vehicleSimulation.getInteractiveMeshes());
    }
    if (this.environmentMonitoringSystem) {
      meshes.push(...this.environmentMonitoringSystem.getInteractiveMeshes());
    }
    if (this.streetLightingSystem) {
      meshes.push(...this.streetLightingSystem.getInteractiveMeshes());
    }
    if (this.facilityBuilder) {
      meshes.push(...this.facilityBuilder.getInteractiveMeshes());
    }
    if (this.pedestrianSystem) {
      meshes.push(...this.pedestrianSystem.getInteractiveMeshes());
    }
    if (this.energyIndicatorMeshes) {
      meshes.push(...this.energyIndicatorMeshes);
    }
    return meshes;
  }

  handleClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const interactiveMeshes = this.getCombinedInteractiveMeshes();
    const intersects = this.raycaster.intersectObjects(interactiveMeshes, true);

    for (let i = 0; i < intersects.length; i++) {
      const target = this.findInteractiveTarget(intersects[i].object);
      if (target) {
        if (target.type === 'parking' && this.onSlotSelect) {
          this.onSlotSelect(target.data);
          break;
        } else if (target.type === 'traffic' && this.onSignalSelect) {
          this.onSignalSelect(target.data);
          break;
        } else if (target.type === 'emergency' && this.onIncidentSelect) {
          this.onIncidentSelect(target.data);
          break;
        } else if (target.type === 'vehicle' && this.onVehicleSelect) {
          this.onVehicleSelect(target.data);
          if (this.vehicleSimulation) {
            this.vehicleSimulation.selectVehicle(target.data);
          }
          break;
        } else if (target.type === 'environment' && this.onSensorSelect) {
          this.onSensorSelect(target.data);
          break;
        } else if (target.type === 'streetLight') {
          if (this.onLightSelect) {
            this.onLightSelect(target.data);
          } else {
            console.log('[StreetLighting] Selected:', target.data);
          }
          break;
        } else if (target.type === 'facility' && this.onFacilitySelect) {
          this.onFacilitySelect(target.data);
          break;
        } else if (target.type === 'pedestrian' && this.onPedestrianSelect) {
          this.onPedestrianSelect(target.data);
          if (this.pedestrianSystem) {
            this.pedestrianSystem.selectPedestrian(target.data);
          }
          break;
        } else if (target.type === 'energyIndicator' && this.onEnergyIndicatorSelect) {
          this.onEnergyIndicatorSelect(target.data);
          break;
        }
      }
    }
  }

  handleHover(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const interactiveMeshes = this.getCombinedInteractiveMeshes();
    const intersects = this.raycaster.intersectObjects(interactiveMeshes, true);

    let isHovering = false;
    for (let i = 0; i < intersects.length; i++) {
      if (this.findInteractiveTarget(intersects[i].object)) {
        isHovering = true;
        break;
      }
    }
    this.renderer.domElement.style.cursor = isHovering ? 'pointer' : 'default';
  }

  setOnSlotSelect(callback) {
    this.onSlotSelect = callback;
  }

  setOnSignalSelect(callback) {
    this.onSignalSelect = callback;
  }

  setOnIncidentSelect(callback) {
    this.onIncidentSelect = callback;
  }

  setOnVehicleSelect(callback) {
    this.onVehicleSelect = callback;
  }

  setOnSensorSelect(callback) {
    this.onSensorSelect = callback;
  }

  setOnLightSelect(callback) {
    this.onLightSelect = callback;
  }

  setOnFacilitySelect(callback) {
    this.onFacilitySelect = callback;
  }

  setOnPedestrianSelect(callback) {
    this.onPedestrianSelect = callback;
  }

  setOnEnergyIndicatorSelect(callback) {
    this.onEnergyIndicatorSelect = callback;
  }

  setTrafficDensity(density) {
    if (this.vehicleSimulation) {
      this.vehicleSimulation.setDensity(density);
    }
  }

  followVehicle(vehicleData) {
    if (this.vehicleSimulation) {
      this.vehicleSimulation.setFollowVehicle(vehicleData);
    }
  }

  clearFollowVehicle() {
    if (this.vehicleSimulation) {
      this.vehicleSimulation.clearFollowVehicle();
    }
  }

  getTrafficMetrics() {
    if (this.vehicleSimulation) {
      return this.vehicleSimulation.getTrafficMetrics();
    }
    return null;
  }

  getStreetLightingMetrics() {
    if (this.streetLightingSystem) {
      return this.streetLightingSystem.getLightingHUDMetrics();
    }
    return null;
  }

  getStreetLightNode(lightId) {
    if (this.streetLightingSystem) {
      return this.streetLightingSystem.getLightNode(lightId);
    }
    return null;
  }

  getStreetLightData(lightId) {
    if (this.streetLightingSystem) {
      return this.streetLightingSystem.getLightData(lightId);
    }
    return null;
  }

  updateParkingSlots(slotsData) {
    if (this.parkingSystem) {
      this.parkingSystem.updateSlots(slotsData);
    }
  }

  updateTrafficSignals(signalsData) {
    if (this.trafficSystem) {
      this.trafficSystem.syncSignals(signalsData);
    }
  }

  updateEmergencyIncidents(incidentsData) {
    if (this.emergencySystem) {
      this.emergencySystem.updateIncidents(incidentsData);
    }
  }

  updateEnvironmentSensors(sensorsData) {
    if (this.environmentMonitoringSystem) {
      this.environmentMonitoringSystem.syncSensors(sensorsData);
    }
  }

  updateStreetLights(lightsData) {
    if (this.streetLightingSystem) {
      this.streetLightingSystem.syncLights(lightsData);
    }
  }

  setTrafficSignalStatus(junctionId, status) {
    if (this.trafficSystem) {
      this.trafficSystem.setSignalStatus(junctionId, status);
    }
  }

  resetCamera() {
    if (this.vehicleSimulation) {
      this.vehicleSimulation.clearFollowVehicle();
    }
    this.controls.reset();
    this.setDefaultCameraPosition();
  }

  toggleGrid() {
    if (this.gridHelper) {
      this.gridHelper.visible = !this.gridHelper.visible;
      return this.gridHelper.visible;
    }
    return false;
  }

  toggleAutoRotate() {
    this.isAutoRotating = !this.isAutoRotating;
    this.controls.autoRotate = this.isAutoRotating;
    this.controls.autoRotateSpeed = 0.85;
    return this.isAutoRotating;
  }

  toggleDayNight() {
    if (this.lightingManager) {
      return this.lightingManager.toggleDayNight();
    }
    return false;
  }

  setupEnergyIndicator() {
    this.energyIndicatorGroup = new THREE.Group();
    this.energyIndicatorGroup.name = 'EnergyIndicator';
    this.energyIndicatorGroup.position.set(-10, 0, -10);

    this.energyIndicatorMeshes = [];

    // Base pedestal
    const baseGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.4, 6);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.3
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.2;
    this.energyIndicatorGroup.add(base);

    // Glowing accent ring
    const ringGeo = new THREE.TorusGeometry(1.1, 0.05, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.5,
      roughness: 0.2
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.42;
    this.energyIndicatorGroup.add(ring);

    // Vertical holographic column
    const colGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8);
    const colMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.85
    });
    const col = new THREE.Mesh(colGeo, colMat);
    col.position.y = 2.0;
    this.energyIndicatorGroup.add(col);

    // Floating energy crystal
    const crystalGeo = new THREE.OctahedronGeometry(0.4, 0);
    this.energyCrystalMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 1.2,
      roughness: 0.2,
      metalness: 0.5
    });
    this.energyCrystal = new THREE.Mesh(crystalGeo, this.energyCrystalMat);
    this.energyCrystal.position.y = 3.8;
    this.energyIndicatorGroup.add(this.energyCrystal);

    // Dynamic Canvas Billboard
    this.energyCanvas = document.createElement('canvas');
    this.energyCanvas.width = 512;
    this.energyCanvas.height = 256;
    this.energyCtx = this.energyCanvas.getContext('2d');

    this.energyTexture = new THREE.CanvasTexture(this.energyCanvas);
    this.energyTexture.minFilter = THREE.LinearFilter;

    const boardGeo = new THREE.PlaneGeometry(3.6, 1.8);
    const boardMat = new THREE.MeshBasicMaterial({
      map: this.energyTexture,
      transparent: true,
      side: THREE.DoubleSide
    });
    this.energyBillboard = new THREE.Mesh(boardGeo, boardMat);
    this.energyBillboard.position.set(0, 4.8, 0);
    this.energyIndicatorGroup.add(this.energyBillboard);

    // Tag meshes for raycasting click
    const clickableData = { type: 'ENERGY_GRID' };
    [base, this.energyCrystal, this.energyBillboard].forEach(mesh => {
      mesh.userData = { isEnergyIndicator: true, energyData: clickableData };
      this.energyIndicatorMeshes.push(mesh);
    });

    this.renderEnergyCanvas({
      mode: 'NORMAL',
      currentPowerKw: 0.96,
      energySavedPct: 38
    });

    this.scene.add(this.energyIndicatorGroup);
  }

  renderEnergyCanvas(data) {
    if (!this.energyCtx) return;
    const ctx = this.energyCtx;
    const w = this.energyCanvas.width;
    const h = this.energyCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Dark cyber panel background
    ctx.fillStyle = 'rgba(3, 13, 26, 0.90)';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(8, 8, w - 16, h - 16, 20);
      ctx.fill();
    } else {
      ctx.fillRect(8, 8, w - 16, h - 16);
    }

    // Border
    const isEco = data.mode === 'ECO' || data.optimizationMode === 'ECO';
    ctx.strokeStyle = isEco ? '#10b981' : '#06b6d4';
    ctx.lineWidth = 4;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(8, 8, w - 16, h - 16, 20);
      ctx.stroke();
    } else {
      ctx.strokeRect(8, 8, w - 16, h - 16);
    }

    // Title / Badge
    ctx.fillStyle = isEco ? '#10b981' : '#06b6d4';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`⚡ ENERGY GRID [${data.optimizationMode || data.mode || 'NORMAL'}]`, w / 2, 48);

    // Metric 1: Power Demand
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 36px "Courier New", monospace';
    const kwVal = data.currentPowerDemandKw !== undefined ? data.currentPowerDemandKw : (data.currentPowerKw ?? '0.96');
    ctx.fillText(`${kwVal} kW`, w / 2, 105);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('LIVE GRID DEMAND', w / 2, 135);

    // Metric 2: Energy Saved
    ctx.fillStyle = isEco ? '#34d399' : '#38bdf8';
    ctx.font = 'bold 26px "Courier New", monospace';
    ctx.fillText(`🌱 SAVED: ${data.energySavedPct ?? 38}%`, w / 2, 185);

    // Footer Hint
    ctx.fillStyle = '#64748b';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('Click to Open Energy Analytics', w / 2, 222);

    this.energyTexture.needsUpdate = true;
  }

  updateEnergyIndicator(metrics) {
    if (this.energyIndicatorGroup && metrics) {
      this.renderEnergyCanvas(metrics);
      if (this.energyCrystalMat) {
        const isEco = metrics.mode === 'ECO' || metrics.optimizationMode === 'ECO';
        this.energyCrystalMat.color.setHex(isEco ? 0x10b981 : 0x06b6d4);
        this.energyCrystalMat.emissive.setHex(isEco ? 0x10b981 : 0x06b6d4);
      }
    }
  }

  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();
    if (this.trafficSystem) {
      this.trafficSystem.update(delta, this.camera);
    }
    if (this.emergencySystem) {
      this.emergencySystem.update(delta, this.camera);
    }
    if (this.vehicleSimulation) {
      this.vehicleSimulation.update(delta);
    }
    if (this.environmentMonitoringSystem) {
      this.environmentMonitoringSystem.update(delta, this.camera);
    }
    if (this.streetLightingSystem) {
      const activeFleet = this.vehicleSimulation ? this.vehicleSimulation.vehicles : [];
      this.streetLightingSystem.update(delta, activeFleet);
    }
    if (this.facilityBuilder) {
      this.facilityBuilder.update(delta, this.lightingManager ? this.lightingManager.isNight : false, this.camera);
    }
    if (this.pedestrianSystem) {
      this.pedestrianSystem.update(delta);
    }
    if (this.energyCrystal) {
      this.energyCrystal.rotation.y += delta * 1.5;
      this.energyCrystal.rotation.x += delta * 0.8;
    }
    if (this.energyBillboard && this.camera) {
      this.energyBillboard.position.y = 4.8 + Math.sin(this.frameCount * 0.04) * 0.06;
      this.energyBillboard.quaternion.copy(this.camera.quaternion);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    this.frameCount++;
    const now = performance.now();
    if (now - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;
      if (this.onFpsUpdate) {
        this.onFpsUpdate(this.fps);
      }
    }
  }
}
