import * as THREE from 'three';

/**
 * VehicleSimulation
 * Procedural 3D vehicle traffic simulation for SmartCity3D-Web.
 * Manages Cars, Buses, Taxis, and Ambulances navigating city avenues and ring roads,
 * obeying traffic signals, collision avoidance (IDM), emergency corridor response,
 * interactive raycasting inspection, and dynamic camera tracking.
 */

// Reusable temporary vectors to eliminate per-frame GC allocations (60 FPS optimization)
const _tempDirVec = new THREE.Vector3();
const _tempToOtherVec = new THREE.Vector3();

export class VehicleSimulation {
  constructor(trafficSystem, camera) {
    this.trafficSystem = trafficSystem;
    this.camera = camera;
    this.group = new THREE.Group();
    this.group.name = 'VehicleTrafficSimulation';

    this.vehicles = [];
    this.interactiveMeshes = [];
    this.selectedVehicle = null;
    this.followedVehicle = null;

    // Density settings
    this.density = 'MEDIUM'; // 'LOW' (8), 'MEDIUM' (16), 'HIGH' (24)
    this.targetCount = 16;

    // Shared Materials for high performance (60 FPS)
    this.initSharedMaterials();

    // Overhead Selection Marker
    this.initSelectionMarker();

    // Define Road Network Routes & Lane Waypoints
    this.initRoutes();

    // Spawn initial vehicle fleet
    this.initFleet();
  }

  initSharedMaterials() {
    // Tire & Rubber
    this.tireMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.9,
      metalness: 0.1
    });

    // Rim Metal
    this.rimMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.8,
      roughness: 0.2
    });

    // Dark Tinted Glass (MeshStandardMaterial avoids Three.js full-scene transmission render pass)
    this.glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.3,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85
    });

    // Chrome Trim
    this.chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.1
    });

    // Headlight Lens Material
    this.headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfef08a,
      emissiveIntensity: 1.5,
      roughness: 0.2
    });

    // Taillight / Brake Material (can be boosted dynamically on braking)
    this.taillightOffMat = new THREE.MeshStandardMaterial({
      color: 0x7f1d1d,
      emissive: 0xef4444,
      emissiveIntensity: 0.5,
      roughness: 0.3
    });

    this.taillightBrakeMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xff0000,
      emissiveIntensity: 2.8,
      roughness: 0.2
    });

    // Taxi Sign Material
    this.taxiSignMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.8,
      roughness: 0.3
    });

    // Bus Livery Material
    this.busBodyMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      metalness: 0.3,
      roughness: 0.3
    });
    this.busWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.4
    });

    // Emergency Ambulance Body & Siren Materials
    this.ambulanceBodyMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.2
    });
    this.ambulanceRedStripeMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.4
    });

    this.sirenRedMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xff0000,
      emissiveIntensity: 3.0
    });
    this.sirenBlueMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x0066ff,
      emissiveIntensity: 3.0
    });

    // Car Body Paint Palette (Vibrant modern & cyber metallic tones)
    this.paintPalette = [
      0x0284c7, // Sky Cyber Blue
      0xdc2626, // Crimson Red
      0x059669, // Emerald Green
      0xd97706, // Amber Gold
      0x7c3aed, // Electric Violet
      0x0284c7, // Cool Slate
      0xf1f5f9, // Pearl White
      0x0f172a, // Executive Obsidian
      0x475569  // Graphite Grey
    ];
  }

  initSelectionMarker() {
    // Floating holographic marker that hovers above the clicked vehicle
    const markerGeo = new THREE.OctahedronGeometry(0.8, 0);
    const markerMat = new THREE.MeshStandardMaterial({
      color: 0x00f2fe,
      emissive: 0x00f2fe,
      emissiveIntensity: 2.2,
      wireframe: true,
      transparent: true,
      opacity: 0.9
    });
    this.selectionMarker = new THREE.Mesh(markerGeo, markerMat);
    this.selectionMarker.visible = false;
    this.group.add(this.selectionMarker);
  }

  /**
   * Initializes City Road Network Routes based on RoadBuilder geometry:
   * Main Avenues (X=0 and Z=0, width 12, bounds [-80, 80])
   * Ring Roads (X=±50, Z=±50, width 9, bounds [-80, 80])
   */
  initRoutes() {
    this.routes = [
      // 1. North-South Avenue: Southbound (X = -3.0, Z: -80 -> +80)
      {
        id: 'ROUTE_NS_SOUTH',
        roadName: 'North-South Ave (Southbound)',
        signalJunction: 'J-NORTH',
        stopCheckZ: -38.5,
        signalDirection: 'southbound',
        signals: [
          { junctionId: 'J-NORTH', stopCoord: -38.5 },
          { junctionId: 'J-SOUTH', stopCoord: 31.5 }
        ],
        waypoints: [
          new THREE.Vector3(-3.0, 0, -82),
          new THREE.Vector3(-3.0, 0, -38.5),
          new THREE.Vector3(-3.0, 0, -10),
          new THREE.Vector3(-3.0, 0, 35),
          new THREE.Vector3(-3.0, 0, 82)
        ]
      },
      // 2. North-South Avenue: Northbound (X = +3.0, Z: +80 -> -80)
      {
        id: 'ROUTE_NS_NORTH',
        roadName: 'North-South Ave (Northbound)',
        signalJunction: 'J-SOUTH',
        stopCheckZ: 38.5,
        signalDirection: 'northbound',
        signals: [
          { junctionId: 'J-SOUTH', stopCoord: 38.5 },
          { junctionId: 'J-NORTH', stopCoord: -31.5 }
        ],
        waypoints: [
          new THREE.Vector3(3.0, 0, 82),
          new THREE.Vector3(3.0, 0, 38.5),
          new THREE.Vector3(3.0, 0, 10),
          new THREE.Vector3(3.0, 0, -35),
          new THREE.Vector3(3.0, 0, -82)
        ]
      },
      // 3. East-West Avenue: Eastbound (Z = +3.0, X: -80 -> +80)
      {
        id: 'ROUTE_EW_EAST',
        roadName: 'East-West Ave (Eastbound)',
        signalJunction: 'J-WEST',
        stopCheckX: -38.5,
        signalDirection: 'eastbound',
        signals: [
          { junctionId: 'J-WEST', stopCoord: -38.5 },
          { junctionId: 'J-EAST', stopCoord: 31.5 }
        ],
        waypoints: [
          new THREE.Vector3(-82, 0, 3.0),
          new THREE.Vector3(-38.5, 0, 3.0),
          new THREE.Vector3(-10, 0, 3.0),
          new THREE.Vector3(35, 0, 3.0),
          new THREE.Vector3(82, 0, 3.0)
        ]
      },
      // 4. East-West Avenue: Westbound (Z = -3.0, X: +80 -> -80)
      {
        id: 'ROUTE_EW_WEST',
        roadName: 'East-West Ave (Westbound)',
        signalJunction: 'J-EAST',
        stopCheckX: 38.5,
        signalDirection: 'westbound',
        signals: [
          { junctionId: 'J-EAST', stopCoord: 38.5 },
          { junctionId: 'J-WEST', stopCoord: -31.5 }
        ],
        waypoints: [
          new THREE.Vector3(82, 0, -3.0),
          new THREE.Vector3(38.5, 0, -3.0),
          new THREE.Vector3(10, 0, -3.0),
          new THREE.Vector3(-35, 0, -3.0),
          new THREE.Vector3(-82, 0, -3.0)
        ]
      },
      // 5. West Ring Road: Southbound (X = -52.2, Z: -80 -> +80)
      {
        id: 'ROUTE_RING_WEST_SOUTH',
        roadName: 'West Ring Rd (Southbound)',
        signalJunction: null,
        waypoints: [
          new THREE.Vector3(-52.2, 0, -82),
          new THREE.Vector3(-52.2, 0, 0),
          new THREE.Vector3(-52.2, 0, 82)
        ]
      },
      // 6. West Ring Road: Northbound (X = -47.8, Z: +80 -> -80)
      {
        id: 'ROUTE_RING_WEST_NORTH',
        roadName: 'West Ring Rd (Northbound)',
        signalJunction: null,
        waypoints: [
          new THREE.Vector3(-47.8, 0, 82),
          new THREE.Vector3(-47.8, 0, 0),
          new THREE.Vector3(-47.8, 0, -82)
        ]
      },
      // 7. East Ring Road: Southbound (X = 47.8, Z: -80 -> +80)
      {
        id: 'ROUTE_RING_EAST_SOUTH',
        roadName: 'East Ring Rd (Southbound)',
        signalJunction: null,
        waypoints: [
          new THREE.Vector3(47.8, 0, -82),
          new THREE.Vector3(47.8, 0, 0),
          new THREE.Vector3(47.8, 0, 82)
        ]
      },
      // 8. East Ring Road: Northbound (X = 52.2, Z: +80 -> -80)
      {
        id: 'ROUTE_RING_EAST_NORTH',
        roadName: 'East Ring Rd (Northbound)',
        signalJunction: null,
        waypoints: [
          new THREE.Vector3(52.2, 0, 82),
          new THREE.Vector3(52.2, 0, 0),
          new THREE.Vector3(52.2, 0, -82)
        ]
      },
      // 9. North Ring Road: Westbound (Z = -52.2, X: +80 -> -80)
      {
        id: 'ROUTE_RING_NORTH_WEST',
        roadName: 'North Ring Rd (Westbound)',
        signalJunction: null,
        waypoints: [
          new THREE.Vector3(82, 0, -52.2),
          new THREE.Vector3(0, 0, -52.2),
          new THREE.Vector3(-82, 0, -52.2)
        ]
      },
      // 10. South Ring Road: Eastbound (Z = 47.8, X: -80 -> +80)
      {
        id: 'ROUTE_RING_SOUTH_EAST',
        roadName: 'South Ring Rd (Eastbound)',
        signalJunction: null,
        waypoints: [
          new THREE.Vector3(-82, 0, 47.8),
          new THREE.Vector3(0, 0, 47.8),
          new THREE.Vector3(82, 0, 47.8)
        ]
      }
    ];
  }

  /**
   * Initializes the starting vehicle fleet distributed across routes
   */
  initFleet() {
    this.vehicles = [];
    this.interactiveMeshes = [];

    // Distribute vehicles evenly across available routes
    for (let i = 0; i < this.targetCount; i++) {
      const route = this.routes[i % this.routes.length];
      const vehicle = this.spawnVehicleOnRoute(route, i);
      this.vehicles.push(vehicle);
    }
  }

  /**
   * Spawns a vehicle instance on a specific route with staggered spacing
   */
  spawnVehicleOnRoute(route, index) {
    // Determine vehicle type (Mix: ~60% Car, 15% Bus, 15% Taxi, 10% Ambulance)
    const rand = Math.random();
    let type = 'CAR';
    if (rand < 0.12) {
      type = 'AMBULANCE';
    } else if (rand < 0.28) {
      type = 'BUS';
    } else if (rand < 0.44) {
      type = 'TAXI';
    }

    const vehicleId = `VEH-${100 + index + Math.floor(Math.random() * 800)}`;
    const plate = `SC-${Math.floor(1000 + Math.random() * 9000)}`;

    // Stagger progress along the route path (0.0 to 0.85)
    // Compute total approximate length
    const waypoints = route.waypoints;
    const pStart = waypoints[0];
    const pEnd = waypoints[waypoints.length - 1];
    const t = 0.08 + ((index * 0.28 + Math.random() * 0.15) % 0.82);

    const initialPos = new THREE.Vector3().lerpVectors(pStart, pEnd, t);

    // Calculate heading vector
    const dir = _tempDirVec.subVectors(pEnd, pStart).normalize();
    const heading = Math.atan2(dir.x, dir.z);

    // Target cruising speed with small individual personality factor (±10%)
    const personality = 0.9 + Math.random() * 0.2;
    let baseSpeed = 14;
    if (type === 'BUS') baseSpeed = 10;
    if (type === 'TAXI') baseSpeed = 16;
    if (type === 'AMBULANCE') baseSpeed = 22;

    const targetSpeed = baseSpeed * personality;

    // Build the 3D model
    const vehicleData = {
      id: vehicleId,
      plate: plate,
      type: type,
      speed: targetSpeed,
      targetSpeed: targetSpeed,
      status: 'CRUISING',
      currentRoadName: route.roadName,
      nextSignalInfo: route.signalJunction ? `${route.signalJunction} (Active)` : 'None (Free Ring)',
      route: route,
      tProgress: t,
      position: initialPos.clone(),
      heading: heading,
      meshGroup: null,
      wheels: [],
      brakeLights: [],
      sirenLights: [],
      sirenTimer: 0
    };

    const meshGroup = this.createVehicleMesh(vehicleData);
    meshGroup.position.copy(initialPos);
    meshGroup.rotation.y = heading;

    vehicleData.meshGroup = meshGroup;
    this.group.add(meshGroup);

    return vehicleData;
  }

  /**
   * Procedurally builds a low-poly 3D vehicle model based on type
   */
  createVehicleMesh(vehicleData) {
    const group = new THREE.Group();
    group.name = `Vehicle_${vehicleData.id}`;

    // Tag root and descendants for raycasting click selection
    group.userData = { isVehicle: true, vehicleData: vehicleData };

    if (vehicleData.type === 'BUS') {
      this.buildBusModel(group, vehicleData);
    } else if (vehicleData.type === 'AMBULANCE') {
      this.buildAmbulanceModel(group, vehicleData);
    } else if (vehicleData.type === 'TAXI') {
      this.buildTaxiModel(group, vehicleData);
    } else {
      this.buildCarModel(group, vehicleData);
    }

    // Register interactive sub-meshes
    group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.userData = { isVehicle: true, vehicleData: vehicleData };
        this.interactiveMeshes.push(child);
      }
    });

    return group;
  }

  /**
   * Builds a sleek personal Sedan / SUV model
   */
  buildCarModel(group, vehicleData) {
    const color = this.paintPalette[Math.floor(Math.random() * this.paintPalette.length)];
    const bodyMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.35,
      metalness: 0.5
    });

    // 1. Lower Chassis
    const chassisGeo = new THREE.BoxGeometry(1.9, 0.55, 4.2);
    const chassis = new THREE.Mesh(chassisGeo, bodyMat);
    chassis.position.y = 0.5;
    group.add(chassis);

    // 2. Cabin Roof & Glass
    const cabinGeo = new THREE.BoxGeometry(1.6, 0.48, 2.3);
    const cabin = new THREE.Mesh(cabinGeo, this.glassMat);
    cabin.position.set(0, 0.95, -0.2);
    group.add(cabin);

    // Roof Top
    const roofGeo = new THREE.BoxGeometry(1.5, 0.08, 2.2);
    const roof = new THREE.Mesh(roofGeo, bodyMat);
    roof.position.set(0, 1.22, -0.2);
    group.add(roof);

    // 3. Wheels
    this.addWheels(group, vehicleData, 1.8, 0.38, 2.6, 0.38);

    // 4. Headlights & Taillights
    this.addLights(group, vehicleData, 0.7, 0.5, 2.12);
  }

  /**
   * Builds an iconic bright yellow City Taxi model with roof sign
   */
  buildTaxiModel(group, vehicleData) {
    const taxiMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.4,
      metalness: 0.2
    });

    // 1. Lower Chassis
    const chassisGeo = new THREE.BoxGeometry(1.9, 0.55, 4.2);
    const chassis = new THREE.Mesh(chassisGeo, taxiMat);
    chassis.position.y = 0.5;
    group.add(chassis);

    // 2. Cabin
    const cabinGeo = new THREE.BoxGeometry(1.6, 0.5, 2.3);
    const cabin = new THREE.Mesh(cabinGeo, this.glassMat);
    cabin.position.set(0, 0.96, -0.2);
    group.add(cabin);

    const roofGeo = new THREE.BoxGeometry(1.5, 0.08, 2.2);
    const roof = new THREE.Mesh(roofGeo, taxiMat);
    roof.position.set(0, 1.23, -0.2);
    group.add(roof);

    // 3. Illuminated Roof Taxi Sign
    const signGeo = new THREE.BoxGeometry(0.7, 0.22, 0.35);
    const sign = new THREE.Mesh(signGeo, this.taxiSignMat);
    sign.position.set(0, 1.38, -0.2);
    group.add(sign);

    // 4. Wheels & Lights
    this.addWheels(group, vehicleData, 1.8, 0.38, 2.6, 0.38);
    this.addLights(group, vehicleData, 0.7, 0.5, 2.12);
  }

  /**
   * Builds a dual-axle City Transit Bus model
   */
  buildBusModel(group, vehicleData) {
    // 1. Bus Main Body
    const bodyGeo = new THREE.BoxGeometry(2.5, 2.1, 8.2);
    const body = new THREE.Mesh(bodyGeo, this.busBodyMat);
    body.position.y = 1.35;
    group.add(body);

    // White Top Section
    const topGeo = new THREE.BoxGeometry(2.52, 0.9, 8.22);
    const top = new THREE.Mesh(topGeo, this.busWhiteMat);
    top.position.y = 1.9;
    group.add(top);

    // 2. Front Windshield & Windows Strip
    const frontWindowGeo = new THREE.BoxGeometry(2.35, 0.95, 0.2);
    const frontWindow = new THREE.Mesh(frontWindowGeo, this.glassMat);
    frontWindow.position.set(0, 1.75, 4.12);
    group.add(frontWindow);

    const sideWindowGeo = new THREE.BoxGeometry(2.54, 0.7, 6.8);
    const sideWindow = new THREE.Mesh(sideWindowGeo, this.glassMat);
    sideWindow.position.set(0, 1.75, -0.3);
    group.add(sideWindow);

    // 3. Roof AC Units
    const acGeo = new THREE.BoxGeometry(1.4, 0.25, 2.2);
    const ac = new THREE.Mesh(acGeo, this.chromeMat);
    ac.position.set(0, 2.45, -0.5);
    group.add(ac);

    // 4. Wheels (6 wheels for dual rear axle)
    this.addWheels(group, vehicleData, 2.4, 0.46, 5.0, 0.46);

    // 5. Lights
    this.addLights(group, vehicleData, 0.95, 0.6, 4.12);
  }

  /**
   * Builds a first-responder Emergency Ambulance model with sirens
   */
  buildAmbulanceModel(group, vehicleData) {
    // 1. Front Cab
    const cabGeo = new THREE.BoxGeometry(2.1, 1.2, 2.2);
    const cab = new THREE.Mesh(cabGeo, this.ambulanceBodyMat);
    cab.position.set(0, 0.85, 1.4);
    group.add(cab);

    // Cab windshield
    const windshieldGeo = new THREE.BoxGeometry(1.9, 0.55, 0.15);
    const windshield = new THREE.Mesh(windshieldGeo, this.glassMat);
    windshield.position.set(0, 1.15, 2.48);
    group.add(windshield);

    // 2. Rear Medical Module Box
    const boxGeo = new THREE.BoxGeometry(2.25, 1.7, 3.4);
    const box = new THREE.Mesh(boxGeo, this.ambulanceBodyMat);
    box.position.set(0, 1.2, -1.2);
    group.add(box);

    // Red Cross / Chevron Stripe
    const stripeGeo = new THREE.BoxGeometry(2.28, 0.35, 3.42);
    const stripe = new THREE.Mesh(stripeGeo, this.ambulanceRedStripeMat);
    stripe.position.set(0, 1.2, -1.2);
    group.add(stripe);

    // 3. Flashing Lightbar Sirens on Cab Roof
    const sirenBarGeo = new THREE.BoxGeometry(1.4, 0.15, 0.25);
    const sirenBar = new THREE.Mesh(sirenBarGeo, this.chromeMat);
    sirenBar.position.set(0, 1.52, 1.4);
    group.add(sirenBar);

    // Red Siren Beacon
    const sirenRedGeo = new THREE.BoxGeometry(0.4, 0.18, 0.22);
    const sirenRed = new THREE.Mesh(sirenRedGeo, this.sirenRedMat);
    sirenRed.position.set(-0.45, 1.62, 1.4);
    group.add(sirenRed);
    vehicleData.sirenLights.push(sirenRed);

    // Blue Siren Beacon
    const sirenBlueGeo = new THREE.BoxGeometry(0.4, 0.18, 0.22);
    const sirenBlue = new THREE.Mesh(sirenBlueGeo, this.sirenBlueMat);
    sirenBlue.position.set(0.45, 1.62, 1.4);
    group.add(sirenBlue);
    vehicleData.sirenLights.push(sirenBlue);

    // 4. Wheels & Standard Lights
    this.addWheels(group, vehicleData, 2.05, 0.42, 3.0, 0.42);
    this.addLights(group, vehicleData, 0.8, 0.55, 2.5);
  }

  /**
   * Helper to construct rotating wheels for a vehicle
   */
  addWheels(group, vehicleData, trackWidth, wheelRadius, wheelBase, yPos) {
    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.24, 12);
    wheelGeo.rotateZ(Math.PI / 2);

    const halfTrack = trackWidth / 2;
    const halfBase = wheelBase / 2;

    const positions = [
      [halfTrack, yPos, halfBase],   // Front Right
      [-halfTrack, yPos, halfBase],  // Front Left
      [halfTrack, yPos, -halfBase],  // Rear Right
      [-halfTrack, yPos, -halfBase]  // Rear Left
    ];

    positions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeo, this.tireMat);
      wheel.position.set(pos[0], pos[1], pos[2]);

      // Hubcap rim
      const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.55, wheelRadius * 0.55, 0.26, 8);
      rimGeo.rotateZ(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, this.rimMat);
      wheel.add(rim);

      group.add(wheel);
      vehicleData.wheels.push(wheel);
    });
  }

  /**
   * Helper to construct headlights and dynamic brake taillights
   */
  addLights(group, vehicleData, spreadX, heightY, zDist) {
    const lightGeo = new THREE.BoxGeometry(0.28, 0.15, 0.08);

    // Front Headlights
    const hlRight = new THREE.Mesh(lightGeo, this.headlightMat);
    hlRight.position.set(spreadX, heightY, zDist);
    group.add(hlRight);

    const hlLeft = new THREE.Mesh(lightGeo, this.headlightMat);
    hlLeft.position.set(-spreadX, heightY, zDist);
    group.add(hlLeft);

    // Rear Taillights / Brake Lights
    const tailRight = new THREE.Mesh(lightGeo, this.taillightOffMat);
    tailRight.position.set(spreadX, heightY, -zDist);
    group.add(tailRight);
    vehicleData.brakeLights.push(tailRight);

    const tailLeft = new THREE.Mesh(lightGeo, this.taillightOffMat);
    tailLeft.position.set(-spreadX, heightY, -zDist);
    group.add(tailLeft);
    vehicleData.brakeLights.push(tailLeft);
  }

  /**
   * Main per-frame physics & kinematics update loop (60 FPS)
   */
  update(delta = 0.016) {
    // 1. Check for Emergency Override (Green Corridor)
    const isEmergencyCorridor = this.checkEmergencyCorridorActive();

    // 2. Update each vehicle kinematics & signal reactions
    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];
      this.updateVehicle(v, delta, isEmergencyCorridor, i);
    }

    // 3. Animate selection marker hovering over selected vehicle
    if (this.selectedVehicle && this.selectedVehicle.meshGroup) {
      this.selectionMarker.visible = true;
      const vPos = this.selectedVehicle.meshGroup.position;
      const hoverY = vPos.y + (this.selectedVehicle.type === 'BUS' ? 3.8 : 2.6);
      this.selectionMarker.position.set(vPos.x, hoverY + Math.sin(performance.now() * 0.005) * 0.2, vPos.z);
      this.selectionMarker.rotation.y += delta * 2.5;
    } else {
      this.selectionMarker.visible = false;
    }

    // 4. Update Camera Follow Tracking if active
    if (this.followedVehicle && this.followedVehicle.meshGroup) {
      this.updateCameraFollow(delta);
    }
  }

  /**
   * Identifies the next upcoming traffic signal along the vehicle's route.
   */
  getNextSignalForVehicle(v) {
    const route = v.route;
    if (!this.trafficSystem || !this.trafficSystem.signals) return null;

    const signalList = route.signals || (route.signalJunction ? [{
      junctionId: route.signalJunction,
      stopCoord: route.stopCheckZ !== undefined ? route.stopCheckZ : route.stopCheckX
    }] : []);

    for (const sigDef of signalList) {
      let dist = 999;
      if (route.signalDirection === 'southbound') {
        dist = sigDef.stopCoord - v.position.z;
      } else if (route.signalDirection === 'northbound') {
        dist = v.position.z - sigDef.stopCoord;
      } else if (route.signalDirection === 'eastbound') {
        dist = sigDef.stopCoord - v.position.x;
      } else if (route.signalDirection === 'westbound') {
        dist = v.position.x - sigDef.stopCoord;
      }

      // Check if vehicle has not yet passed this junction's stop zone (buffer -1.5m behind stop line)
      if (dist >= -1.5) {
        const signal = this.trafficSystem.signals.get(sigDef.junctionId);
        if (signal && signal.data) {
          return {
            junctionId: sigDef.junctionId,
            stopCoord: sigDef.stopCoord,
            distToStopLine: dist,
            status: signal.data.status,
            remaining: signal.data.remainingTime
          };
        }
      }
    }

    return null;
  }

  /**
   * Updates an individual vehicle's kinematics, signal response, and collision avoidance
   */
  updateVehicle(v, delta, isEmergencyCorridor, index) {
    const route = v.route;
    const waypoints = route.waypoints;
    const pStart = waypoints[0];
    const pEnd = waypoints[waypoints.length - 1];

    // Direction vector of the route lane (reusing module vector)
    const dir = _tempDirVec.subVectors(pEnd, pStart).normalize();
    const totalDist = pStart.distanceTo(pEnd);

    // --- A. TRAFFIC SIGNAL LOGIC ---
    let signalSpeedLimit = v.targetSpeed;
    let nextSignalDesc = 'No Signal (Clear)';

    const nextSig = this.getNextSignalForVehicle(v);
    if (nextSig) {
      const status = nextSig.status; // 'RED', 'YELLOW', 'GREEN'
      const remaining = nextSig.remaining;
      nextSignalDesc = `${nextSig.junctionId} [${status} - ${remaining}s]`;

      const distToStopLine = nextSig.distToStopLine;
      const isApproachingStop = distToStopLine >= -1.5 && distToStopLine < 28;
      const isEmergencyExempt = v.type === 'AMBULANCE' && isEmergencyCorridor;

      if (isApproachingStop && !isEmergencyExempt) {
        if (status === 'RED') {
          if (distToStopLine <= 0.8) {
            signalSpeedLimit = 0; // Full stop before crosswalk / stop line
            if (distToStopLine <= 0.2) {
              v.speed = Math.min(v.speed, 0.5); // Clamp residual speed to prevent creep past line
            }
          } else {
            // Smooth physics-based deceleration profile (v^2 = 2*a*d) landing at 0 before stop line
            signalSpeedLimit = Math.min(v.targetSpeed, Math.sqrt(2 * 3.5 * Math.max(0, distToStopLine - 0.8)));
          }
        } else if (status === 'YELLOW') {
          // Dilemma zone: if within 6.0 units, proceed through safely; if further, brake
          if (distToStopLine > 6.0) {
            signalSpeedLimit = Math.min(v.targetSpeed, Math.sqrt(2 * 3.5 * Math.max(0, distToStopLine - 0.8)));
          }
        }
      }
    }
    v.nextSignalInfo = nextSignalDesc;

    // --- B. EMERGENCY CORRIDOR YIELDING ---
    if (isEmergencyCorridor) {
      if (v.type === 'AMBULANCE') {
        // High priority speed for ambulance
        v.targetSpeed = 24;
      } else if (route.signalJunction || (route.signals && route.signals.length > 0)) {
        // Civilian vehicles in main corridor slow down to yield
        signalSpeedLimit = Math.min(signalSpeedLimit, 6.0);
      }
    }

    // --- C. CAR-FOLLOWING COLLISION AVOIDANCE (IDM) ---
    let leaderDistance = 999;
    for (let j = 0; j < this.vehicles.length; j++) {
      if (index === j) continue;
      const other = this.vehicles[j];
      if (other.route.id === v.route.id) {
        // Same route & lane
        const gap = v.position.distanceTo(other.position);
        // Check if other is ahead of v (reusing module vector)
        const vecToOther = _tempToOtherVec.subVectors(other.position, v.position);
        if (vecToOther.dot(dir) > 0) {
          if (gap < leaderDistance) {
            leaderDistance = gap;
          }
        }
      }
    }

    // Following distance buffer (min safe distance = 4.5m)
    let collisionSpeedLimit = v.targetSpeed;
    if (leaderDistance < 4.2) {
      collisionSpeedLimit = 0; // Stop behind leader
    } else if (leaderDistance < 10.0) {
      // Smoothly throttle down to match leader gap
      collisionSpeedLimit = Math.min(v.targetSpeed, ((leaderDistance - 4.2) / 5.8) * v.targetSpeed);
    }

    // Desired effective speed is minimum of target, signal limit, and collision gap
    const desiredSpeed = Math.max(0, Math.min(v.targetSpeed, signalSpeedLimit, collisionSpeedLimit));

    // Smooth acceleration / deceleration
    if (v.speed > desiredSpeed) {
      v.speed = Math.max(desiredSpeed, v.speed - 9.5 * delta); // Decel
      if (desiredSpeed === 0 && v.speed < 0.05) {
        v.speed = 0;
      }
      v.status = v.speed < 0.5 ? 'STOPPED' : 'DECELERATING';
      this.setBrakeLights(v, true);
    } else if (v.speed < desiredSpeed) {
      v.speed = Math.min(desiredSpeed, v.speed + 4.8 * delta); // Accel
      v.status = 'ACCELERATING';
      this.setBrakeLights(v, false);
    } else {
      v.status = v.speed < 0.5 ? 'STOPPED' : 'CRUISING';
      this.setBrakeLights(v, v.status === 'STOPPED');
    }

    // --- D. ADVANCE POSITION ALONG LANE ---
    const stepDist = v.speed * delta;
    v.position.addScaledVector(dir, stepDist);
    v.meshGroup.position.copy(v.position);

    // --- E. WHEEL ROTATION ---
    const wheelRadius = v.type === 'BUS' ? 0.46 : 0.38;
    const wheelRotDelta = stepDist / wheelRadius;
    v.wheels.forEach((w) => {
      w.rotation.x += wheelRotDelta;
    });

    // --- F. AMBULANCE STROBE SIRENS ---
    if (v.type === 'AMBULANCE') {
      v.sirenTimer = (v.sirenTimer || 0) + delta * 12;
      const toggle = Math.sin(v.sirenTimer) > 0;
      if (v.sirenLights[0]) {
        v.sirenLights[0].material.emissiveIntensity = toggle ? 3.5 : 0.2;
      }
      if (v.sirenLights[1]) {
        v.sirenLights[1].material.emissiveIntensity = !toggle ? 3.5 : 0.2;
      }
    }

    // --- G. ROUTE END RE-LOOPING / RESPAWN ---
    // If vehicle reaches boundary (|X| > 82 or |Z| > 82), loop cleanly to start
    const distToEnd = v.position.distanceTo(pEnd);
    if (distToEnd < 2.0 || Math.abs(v.position.x) > 85 || Math.abs(v.position.z) > 85) {
      v.position.copy(pStart);
      v.meshGroup.position.copy(v.position);
      v.speed = v.targetSpeed * 0.7; // Enter at smooth cruising speed
    }
  }

  /**
   * Toggles taillights between low running light and intense brake glow
   */
  setBrakeLights(vehicle, isBraking) {
    const mat = isBraking ? this.taillightBrakeMat : this.taillightOffMat;
    vehicle.brakeLights.forEach((light) => {
      light.material = mat;
    });
  }

  /**
   * Checks whether any junction has emergencyOverride active
   */
  checkEmergencyCorridorActive() {
    if (!this.trafficSystem || !this.trafficSystem.signals) return false;
    for (const signal of this.trafficSystem.signals.values()) {
      if (signal.data && signal.data.emergencyOverride) {
        return true;
      }
    }
    return false;
  }

  /**
   * Third-Person Camera Tracking behind followed vehicle
   */
  updateCameraFollow(delta) {
    if (!this.followedVehicle || !this.followedVehicle.meshGroup || !this.camera) return;

    const vPos = this.followedVehicle.meshGroup.position;
    const heading = this.followedVehicle.heading;

    // Camera offset: behind and elevated
    const distance = this.followedVehicle.type === 'BUS' ? 22 : 16;
    const height = this.followedVehicle.type === 'BUS' ? 9 : 7;

    const targetCamX = vPos.x - Math.sin(heading) * distance;
    const targetCamZ = vPos.z - Math.cos(heading) * distance;
    const targetCamY = vPos.y + height;

    const targetPos = new THREE.Vector3(targetCamX, targetCamY, targetCamZ);
    this.camera.position.lerp(targetPos, 0.08);

    // Look slightly ahead of the vehicle hood
    const lookTarget = new THREE.Vector3(
      vPos.x + Math.sin(heading) * 4,
      vPos.y + 1.2,
      vPos.z + Math.cos(heading) * 4
    );
    this.camera.lookAt(lookTarget);
  }

  /**
   * Selects or deselects a vehicle for tracking/inspection
   */
  selectVehicle(vehicleData) {
    this.selectedVehicle = vehicleData;
  }

  /**
   * Sets camera to follow a specific vehicle
   */
  setFollowVehicle(vehicleData) {
    this.followedVehicle = vehicleData;
  }

  /**
   * Cancels camera follow tracking
   */
  clearFollowVehicle() {
    this.followedVehicle = null;
  }

  /**
   * Adjusts traffic density preset ('LOW' | 'MEDIUM' | 'HIGH')
   */
  setDensity(density) {
    this.density = density;
    if (density === 'LOW') {
      this.targetCount = 8;
    } else if (density === 'HIGH') {
      this.targetCount = 24;
    } else {
      this.density = 'MEDIUM';
      this.targetCount = 16;
    }

    // If we need more vehicles, spawn them
    while (this.vehicles.length < this.targetCount) {
      const idx = this.vehicles.length;
      const route = this.routes[idx % this.routes.length];
      const vehicle = this.spawnVehicleOnRoute(route, idx);
      this.vehicles.push(vehicle);
    }

    // If we have excess vehicles, remove excess from the tail
    while (this.vehicles.length > this.targetCount) {
      const removed = this.vehicles.pop();
      if (removed && removed.meshGroup) {
        this.group.remove(removed.meshGroup);
      }
      if (this.selectedVehicle && this.selectedVehicle.id === removed.id) {
        this.selectedVehicle = null;
      }
      if (this.followedVehicle && this.followedVehicle.id === removed.id) {
        this.followedVehicle = null;
      }
    }
  }

  /**
   * Returns telemetry metrics for the Smart Traffic HUD
   */
  getTrafficMetrics() {
    const count = this.vehicles.length;
    if (count === 0) return { activeCount: 0, avgSpeedKmH: 0, flowQuality: 'Smooth' };

    let totalSpeed = 0;
    let stoppedCount = 0;

    for (const v of this.vehicles) {
      totalSpeed += v.speed;
      if (v.status === 'STOPPED') stoppedCount++;
    }

    const avgSpeedUnits = totalSpeed / count;
    // Conversion: 1 world unit/s ~ 3.6 km/h scale
    const avgSpeedKmH = Math.round(avgSpeedUnits * 3.6);

    let flowQuality = '🟢 Smooth / Free Flow';
    if (stoppedCount >= count * 0.4) {
      flowQuality = '🔴 Congested (Signals Hold)';
    } else if (stoppedCount >= count * 0.2) {
      flowQuality = '🟡 Moderate Queueing';
    }

    return {
      activeCount: count,
      avgSpeedKmH: avgSpeedKmH,
      flowQuality: flowQuality
    };
  }

  /**
   * Returns all interactive meshes for raycast selection
   */
  getInteractiveMeshes() {
    return this.interactiveMeshes;
  }
}
