import * as THREE from 'three';

/**
 * PedestrianSystem
 * Procedural low-poly 3D pedestrian simulation for SmartCity3D-Web.
 * Manages 24 unique citizens across 6 roles (CITIZEN, STUDENT, WORKER, TOURIST, ELDERLY, EMERGENCY_STAFF),
 * procedural walking animations (articulated limbs), waypoint sidewalk navigation, crosswalk safety,
 * vehicle avoidance (reading VehicleSimulation read-only), facility destinations, day/night awareness,
 * and raycast inspection metadata.
 */
export class PedestrianSystem {
  constructor(lightingManager = null, vehicleSimulation = null, facilityBuilder = null) {
    this.lightingManager = lightingManager;
    this.vehicleSimulation = vehicleSimulation;
    this.facilityBuilder = facilityBuilder;

    this.group = new THREE.Group();
    this.group.name = 'PedestrianSimulationSystem';

    this.pedestrians = [];
    this.interactiveMeshes = [];
    this.selectedPedestrian = null;
    this.animationTime = 0;

    // Shared Materials for optimal 60 FPS performance
    this.initSharedMaterials();

    // Overhead Selection Marker (Ring + Chevron)
    this.initSelectionMarker();

    // Pedestrian Waypoint Graph & Facility Hubs
    this.initWaypointGraph();

    // Spawn 24 initial citizens
    this.initPopulation();
  }

  initSharedMaterials() {
    // Skin tones (low-poly stylized)
    this.skinMaterials = [
      new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ color: 0xf1c27d, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ color: 0xc68642, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ color: 0x8d5524, roughness: 0.8 })
    ];

    // Clothing Palette
    this.clothMats = {
      denim: new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.7 }),
      red: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.7 }),
      coral: new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.7 }),
      green: new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 }),
      navy: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 }),
      yellow: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 }),
      orange: new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.6 }),
      purple: new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.7 }),
      teal: new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.6 }),
      cyan: new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.6 }),
      charcoal: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 }),
      khaki: new THREE.MeshStandardMaterial({ color: 0xd4b996, roughness: 0.8 }),
      white: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 }),
      darkGrey: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 }),
      brownLeather: new THREE.MeshStandardMaterial({ color: 0x5a3e2b, roughness: 0.8 }),
      hiVisYellow: new THREE.MeshStandardMaterial({ color: 0xeab308, emissive: 0xca8a04, emissiveIntensity: 0.4, roughness: 0.5 }),
      scrubsTeal: new THREE.MeshStandardMaterial({ color: 0x14b8a6, roughness: 0.6 }),
      policeNavy: new THREE.MeshStandardMaterial({ color: 0x172554, roughness: 0.5 })
    };

    // Hair colors
    this.hairMats = [
      new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9 }) // grey/white for elderly
    ];

    // Shared Geometries (Scaled for ~1.72m tall human)
    this.geos = {
      head: new THREE.BoxGeometry(0.32, 0.35, 0.32),
      hair: new THREE.BoxGeometry(0.34, 0.16, 0.34),
      torso: new THREE.BoxGeometry(0.5, 0.68, 0.28),
      arm: new THREE.BoxGeometry(0.14, 0.56, 0.14),
      leg: new THREE.BoxGeometry(0.18, 0.72, 0.18),
      foot: new THREE.BoxGeometry(0.18, 0.12, 0.26),
      backpack: new THREE.BoxGeometry(0.34, 0.44, 0.2),
      hat: new THREE.CylinderGeometry(0.28, 0.28, 0.1, 10),
      hatBrim: new THREE.CylinderGeometry(0.38, 0.38, 0.04, 12),
      cane: new THREE.CylinderGeometry(0.025, 0.025, 0.95, 6),
      briefcase: new THREE.BoxGeometry(0.12, 0.28, 0.38)
    };
  }

  initSelectionMarker() {
    this.selectionMarker = new THREE.Group();
    this.selectionMarker.name = 'PedestrianSelectionMarker';
    this.selectionMarker.visible = false;

    // Glowing cyan ground ring
    const ringGeo = new THREE.RingGeometry(0.55, 0.75, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    this.selectionMarker.add(ring);

    // Overhead floating chevron
    const chevronGeo = new THREE.ConeGeometry(0.25, 0.45, 4);
    const chevronMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const chevron = new THREE.Mesh(chevronGeo, chevronMat);
    chevron.rotation.x = Math.PI; // point downwards
    chevron.position.y = 2.4;
    this.selectionMarker.add(chevron);

    this.group.add(this.selectionMarker);
  }

  /**
   * Waypoint graph for sidewalks, plazas, and pedestrian crosswalks
   */
  initWaypointGraph() {
    // Strategic pedestrian network coordinates on sidewalks (avoiding vehicle road lanes)
    // Main avenue sidewalks are at |x| = 8.5 and |z| = 8.5.
    this.waypoints = {
      // North-South Avenue Sidewalks (East Side: x = 8.5)
      'NS_E_N64': new THREE.Vector3(8.5, 0.25, -64),
      'NS_E_N35': new THREE.Vector3(8.5, 0.25, -35), // Crosswalk East J-NORTH
      'NS_E_N15': new THREE.Vector3(8.5, 0.25, -15),
      'CORNER_NE': new THREE.Vector3(12.0, 0.25, -12.0),
      'CORNER_SE': new THREE.Vector3(12.0, 0.25, 12.0),
      'NS_E_S15': new THREE.Vector3(8.5, 0.25, 15),
      'NS_E_S35': new THREE.Vector3(8.5, 0.25, 35),  // Crosswalk East J-SOUTH
      'NS_E_S64': new THREE.Vector3(8.5, 0.25, 64),

      // North-South Avenue Sidewalks (West Side: x = -8.5)
      'NS_W_N64': new THREE.Vector3(-8.5, 0.25, -64),
      'NS_W_N35': new THREE.Vector3(-8.5, 0.25, -35), // Crosswalk West J-NORTH
      'NS_W_N15': new THREE.Vector3(-8.5, 0.25, -15),
      'CORNER_NW': new THREE.Vector3(-12.0, 0.25, -12.0),
      'CORNER_SW': new THREE.Vector3(-12.0, 0.25, 12.0),
      'NS_W_S15': new THREE.Vector3(-8.5, 0.25, 15),
      'NS_W_S35': new THREE.Vector3(-8.5, 0.25, 35),  // Crosswalk West J-SOUTH
      'NS_W_S64': new THREE.Vector3(-8.5, 0.25, 64),

      // East-West Avenue Sidewalks (North Side: z = -8.5)
      'EW_N_W64': new THREE.Vector3(-64, 0.25, -8.5),
      'EW_N_W35': new THREE.Vector3(-35, 0.25, -8.5), // Crosswalk North J-WEST
      'EW_N_W15': new THREE.Vector3(-15, 0.25, -8.5),
      'EW_N_E15': new THREE.Vector3(15, 0.25, -8.5),
      'EW_N_E35': new THREE.Vector3(35, 0.25, -8.5),  // Crosswalk North J-EAST
      'EW_N_E64': new THREE.Vector3(64, 0.25, -8.5),

      // East-West Avenue Sidewalks (South Side: z = 8.5)
      'EW_S_W64': new THREE.Vector3(-64, 0.25, 8.5),
      'EW_S_W35': new THREE.Vector3(-35, 0.25, 8.5),  // Crosswalk South J-WEST
      'EW_S_W15': new THREE.Vector3(-15, 0.25, 8.5),
      'EW_S_E15': new THREE.Vector3(15, 0.25, 8.5),
      'EW_S_E35': new THREE.Vector3(35, 0.25, 8.5),   // Crosswalk South J-EAST
      'EW_S_E64': new THREE.Vector3(64, 0.25, 8.5),

      // Crosswalk Midpoints (crossing road)
      'CW_NORTH': new THREE.Vector3(0, 0.15, -35),
      'CW_SOUTH': new THREE.Vector3(0, 0.15, 35),
      'CW_EAST':  new THREE.Vector3(35, 0.15, 0),
      'CW_WEST':  new THREE.Vector3(-35, 0.15, 0),

      // Facility Plazas & Entrances
      'FAC_HOSPITAL':  new THREE.Vector3(18, 0.25, -60),
      'FAC_GOV':       new THREE.Vector3(-18, 0.25, -60),
      'FAC_FIRE':      new THREE.Vector3(-60, 0.25, -8.5),
      'FAC_BUS':       new THREE.Vector3(-60, 0.25, 8.5),
      'FAC_MALL':      new THREE.Vector3(60, 0.25, -8.5),
      'FAC_POLICE':    new THREE.Vector3(-18, 0.25, 60),
      'FAC_SCHOOL':    new THREE.Vector3(-28, 0.25, 60),
      'FAC_PARK':      new THREE.Vector3(18, 0.25, 60)
    };

    // Crosswalk definitions linking two sidewalk nodes
    this.crosswalks = [
      { id: 'J-NORTH', west: 'NS_W_N35', east: 'NS_E_N35', mid: 'CW_NORTH', axis: 'x', coord: -35 },
      { id: 'J-SOUTH', west: 'NS_W_S35', east: 'NS_E_S35', mid: 'CW_SOUTH', axis: 'x', coord: 35 },
      { id: 'J-EAST',  north: 'EW_N_E35', south: 'EW_S_E35', mid: 'CW_EAST', axis: 'z', coord: 35 },
      { id: 'J-WEST',  north: 'EW_N_W35', south: 'EW_S_W35', mid: 'CW_WEST', axis: 'z', coord: -35 }
    ];

    // Destination names
    this.facilityDestinations = [
      'CITY PARK',
      'SMART SCHOOL',
      'BUS STATION',
      'SHOPPING CENTER',
      'CITY HOSPITAL',
      'POLICE STATION',
      'FIRE STATION',
      'GOVERNMENT OFFICE'
    ];

    // Nighttime preferred destinations
    this.nightDestinations = [
      'CITY HOSPITAL',
      'BUS STATION',
      'SHOPPING CENTER',
      'POLICE STATION',
      'FIRE STATION'
    ];

    // Facility name to node key mapping
    this.facilityNodeMap = {
      'CITY PARK': 'FAC_PARK',
      'SMART SCHOOL': 'FAC_SCHOOL',
      'BUS STATION': 'FAC_BUS',
      'SHOPPING CENTER': 'FAC_MALL',
      'CITY HOSPITAL': 'FAC_HOSPITAL',
      'POLICE STATION': 'FAC_POLICE',
      'FIRE STATION': 'FAC_FIRE',
      'GOVERNMENT OFFICE': 'FAC_GOV'
    };

    // Connected adjacency graph for sidewalk & crosswalk navigation
    this.adjacency = {
      // East Avenue Sidewalks
      'NS_E_N64': ['FAC_HOSPITAL', 'NS_E_N35'],
      'NS_E_N35': ['NS_E_N64', 'NS_E_N15', 'CW_NORTH'],
      'NS_E_N15': ['NS_E_N35', 'CORNER_NE'],
      'CORNER_NE': ['NS_E_N15', 'EW_N_E15'],
      'EW_N_E15': ['CORNER_NE', 'EW_N_E35'],
      'EW_N_E35': ['EW_N_E15', 'EW_N_E64', 'CW_EAST'],
      'EW_N_E64': ['EW_N_E35', 'FAC_MALL'],

      // West Avenue Sidewalks
      'NS_W_N64': ['FAC_GOV', 'NS_W_N35'],
      'NS_W_N35': ['NS_W_N64', 'NS_W_N15', 'CW_NORTH'],
      'NS_W_N15': ['NS_W_N35', 'CORNER_NW'],
      'CORNER_NW': ['NS_W_N15', 'EW_N_W15'],
      'EW_N_W15': ['CORNER_NW', 'EW_N_W35'],
      'EW_N_W35': ['EW_N_W15', 'EW_N_W64', 'CW_WEST'],
      'EW_N_W64': ['EW_N_W35', 'FAC_FIRE'],

      // South East Avenue Sidewalks
      'NS_E_S64': ['FAC_PARK', 'NS_E_S35'],
      'NS_E_S35': ['NS_E_S64', 'NS_E_S15', 'CW_SOUTH'],
      'NS_E_S15': ['NS_E_S35', 'CORNER_SE'],
      'CORNER_SE': ['NS_E_S15', 'EW_S_E15'],
      'EW_S_E15': ['CORNER_SE', 'EW_S_E35'],
      'EW_S_E35': ['EW_S_E15', 'EW_S_E64', 'CW_EAST'],
      'EW_S_E64': ['EW_S_E35'],

      // South West Avenue Sidewalks
      'NS_W_S64': ['FAC_POLICE', 'FAC_SCHOOL', 'NS_W_S35'],
      'NS_W_S35': ['NS_W_S64', 'NS_W_S15', 'CW_SOUTH'],
      'NS_W_S15': ['NS_W_S35', 'CORNER_SW'],
      'CORNER_SW': ['NS_W_S15', 'EW_S_W15'],
      'EW_S_W15': ['CORNER_SW', 'EW_S_W35'],
      'EW_S_W35': ['EW_S_W15', 'EW_S_W64', 'CW_WEST'],
      'EW_S_W64': ['EW_S_W35', 'FAC_BUS'],

      // Crosswalks (Bidirectional links crossing lanes)
      'CW_NORTH': ['NS_W_N35', 'NS_E_N35'],
      'CW_SOUTH': ['NS_W_S35', 'NS_E_S35'],
      'CW_EAST':  ['EW_N_E35', 'EW_S_E35'],
      'CW_WEST':  ['EW_N_W35', 'EW_S_W35'],

      // Facilities
      'FAC_HOSPITAL': ['NS_E_N64'],
      'FAC_GOV':      ['NS_W_N64'],
      'FAC_FIRE':     ['EW_N_W64'],
      'FAC_BUS':      ['EW_S_W64'],
      'FAC_MALL':     ['EW_N_E64'],
      'FAC_POLICE':   ['NS_W_S64'],
      'FAC_SCHOOL':   ['NS_W_S64'],
      'FAC_PARK':     ['NS_E_S64']
    };
  }

  /**
   * High-efficiency Breadth-First-Search pathfinder across 28 sidewalk nodes
   */
  findShortestPath(startKey, goalKey) {
    if (startKey === goalKey) return [startKey];
    const queue = [[startKey]];
    const visited = new Set([startKey]);

    while (queue.length > 0) {
      const path = queue.shift();
      const curr = path[path.length - 1];
      const neighbors = this.adjacency[curr] || [];

      for (const next of neighbors) {
        if (next === goalKey) {
          return [...path, next];
        }
        if (!visited.has(next)) {
          visited.add(next);
          queue.push([...path, next]);
        }
      }
    }
    return [startKey, goalKey];
  }

  /**
   * Finds the nearest sidewalk waypoint key to a given 3D position
   */
  findNearestWaypointKey(pos) {
    let bestKey = 'NS_E_N64';
    let bestDist = Infinity;
    for (const [key, wp] of Object.entries(this.waypoints)) {
      const d = pos.distanceTo(wp);
      if (d < bestDist) {
        bestDist = d;
        bestKey = key;
      }
    }
    return bestKey;
  }

  /**
   * Initializes 24 unique pedestrians distributed around facilities
   */
  initPopulation() {
    this.pedestrians = [];
    this.interactiveMeshes = [];

    const specs = [
      // 5 around CITY PARK
      { id: 'PED-01', type: 'CITIZEN', name: 'Alex Mercer', dest: 'CITY PARK', baseSpeed: 1.3, pos: new THREE.Vector3(18, 0.25, 58), cloth: 'denim', pants: 'darkGrey' },
      { id: 'PED-02', type: 'TOURIST', name: 'Marco Rossi', dest: 'CITY PARK', baseSpeed: 1.0, pos: new THREE.Vector3(22, 0.25, 62), cloth: 'teal', pants: 'khaki', accessory: 'sunhat' },
      { id: 'PED-03', type: 'ELDERLY', name: 'Robert Vance', dest: 'CITY PARK', baseSpeed: 0.8, pos: new THREE.Vector3(24, 0.25, 56), cloth: 'khaki', pants: 'charcoal', accessory: 'cane' },
      { id: 'PED-04', type: 'CITIZEN', name: 'Maya Lin', dest: 'CITY PARK', baseSpeed: 1.3, pos: new THREE.Vector3(16, 0.25, 64), cloth: 'coral', pants: 'white' },
      { id: 'PED-05', type: 'STUDENT', name: 'Liam Davies', dest: 'CITY PARK', baseSpeed: 1.5, pos: new THREE.Vector3(20, 0.25, 60), cloth: 'green', pants: 'navy', accessory: 'backpack' },

      // 4 around SMART SCHOOL
      { id: 'PED-06', type: 'STUDENT', name: 'Chloe Bennett', dest: 'SMART SCHOOL', baseSpeed: 1.5, pos: new THREE.Vector3(-28, 0.25, 58), cloth: 'navy', pants: 'charcoal', accessory: 'backpack' },
      { id: 'PED-07', type: 'STUDENT', name: 'Noah Patel', dest: 'SMART SCHOOL', baseSpeed: 1.5, pos: new THREE.Vector3(-32, 0.25, 62), cloth: 'orange', pants: 'darkGrey', accessory: 'backpack' },
      { id: 'PED-08', type: 'STUDENT', name: 'Zoe Kim', dest: 'SMART SCHOOL', baseSpeed: 1.5, pos: new THREE.Vector3(-30, 0.25, 60), cloth: 'purple', pants: 'white', accessory: 'backpack' },
      { id: 'PED-09', type: 'WORKER', name: 'David Wright', dest: 'SMART SCHOOL', baseSpeed: 1.4, pos: new THREE.Vector3(-34, 0.25, 56), cloth: 'brownLeather', pants: 'charcoal', accessory: 'briefcase' },

      // 4 around BUS STATION
      { id: 'PED-10', type: 'CITIZEN', name: 'Ryan Scott', dest: 'BUS STATION', baseSpeed: 1.3, pos: new THREE.Vector3(-58, 0.25, 8.5), cloth: 'denim', pants: 'darkGrey' },
      { id: 'PED-11', type: 'TOURIST', name: 'Sophie Martin', dest: 'BUS STATION', baseSpeed: 1.0, pos: new THREE.Vector3(-62, 0.25, 6.5), cloth: 'yellow', pants: 'navy', accessory: 'backpack' },
      { id: 'PED-12', type: 'WORKER', name: 'Leo Gomez', dest: 'BUS STATION', baseSpeed: 1.4, pos: new THREE.Vector3(-64, 0.25, 9.5), cloth: 'navy', pants: 'navy', accessory: 'cap' },
      { id: 'PED-13', type: 'CITIZEN', name: 'Emma Watson', dest: 'BUS STATION', baseSpeed: 1.3, pos: new THREE.Vector3(-60, 0.25, 7.5), cloth: 'coral', pants: 'charcoal' },

      // 3 around SHOPPING CENTER
      { id: 'PED-14', type: 'CITIZEN', name: 'Lucas Meyer', dest: 'SHOPPING CENTER', baseSpeed: 1.3, pos: new THREE.Vector3(58, 0.25, -8.5), cloth: 'cyan', pants: 'white' },
      { id: 'PED-15', type: 'TOURIST', name: 'Elena Rostova', dest: 'SHOPPING CENTER', baseSpeed: 1.0, pos: new THREE.Vector3(62, 0.25, -6.5), cloth: 'coral', pants: 'khaki', accessory: 'sunhat' },
      { id: 'PED-16', type: 'CITIZEN', name: 'Oliver King', dest: 'SHOPPING CENTER', baseSpeed: 1.3, pos: new THREE.Vector3(64, 0.25, -9.5), cloth: 'charcoal', pants: 'darkGrey' },

      // 3 around CITY HOSPITAL
      { id: 'PED-17', type: 'EMERGENCY_STAFF', name: 'Dr. Sarah Chen', dest: 'CITY HOSPITAL', baseSpeed: 1.6, pos: new THREE.Vector3(18, 0.25, -58), cloth: 'scrubsTeal', pants: 'scrubsTeal' },
      { id: 'PED-18', type: 'EMERGENCY_STAFF', name: 'Paramedic Dan', dest: 'CITY HOSPITAL', baseSpeed: 1.6, pos: new THREE.Vector3(22, 0.25, -62), cloth: 'hiVisYellow', pants: 'navy' },
      { id: 'PED-19', type: 'CITIZEN', name: 'Grace Taylor', dest: 'CITY HOSPITAL', baseSpeed: 1.3, pos: new THREE.Vector3(16, 0.25, -64), cloth: 'purple', pants: 'denim' },

      // 2 around POLICE STATION
      { id: 'PED-20', type: 'EMERGENCY_STAFF', name: 'Officer Hayes', dest: 'POLICE STATION', baseSpeed: 1.6, pos: new THREE.Vector3(-18, 0.25, 58), cloth: 'policeNavy', pants: 'policeNavy', accessory: 'cap' },
      { id: 'PED-21', type: 'WORKER', name: 'Clerk Miller', dest: 'POLICE STATION', baseSpeed: 1.4, pos: new THREE.Vector3(-22, 0.25, 62), cloth: 'cyan', pants: 'charcoal' },

      // 2 around FIRE STATION
      { id: 'PED-22', type: 'EMERGENCY_STAFF', name: 'Firefighter Jack', dest: 'FIRE STATION', baseSpeed: 1.6, pos: new THREE.Vector3(-58, 0.25, -8.5), cloth: 'yellow', pants: 'darkGrey', accessory: 'cap' },
      { id: 'PED-23', type: 'WORKER', name: 'Mechanic Sam', dest: 'FIRE STATION', baseSpeed: 1.4, pos: new THREE.Vector3(-62, 0.25, -10.5), cloth: 'orange', pants: 'navy' },

      // 1 around GOVERNMENT OFFICE
      { id: 'PED-24', type: 'WORKER', name: 'Official Bennett', dest: 'GOVERNMENT OFFICE', baseSpeed: 1.4, pos: new THREE.Vector3(-18, 0.25, -58), cloth: 'charcoal', pants: 'charcoal', accessory: 'briefcase' }
    ];

    specs.forEach((spec, i) => {
      const pedestrian = this.createPedestrianInstance(spec, i);
      this.pedestrians.push(pedestrian);
      this.group.add(pedestrian.group);
    });
  }

  /**
   * Creates a single 3D articulated low-poly pedestrian character (~1.72m tall)
   */
  createPedestrianInstance(spec, index) {
    const characterGroup = new THREE.Group();
    characterGroup.name = `Pedestrian_${spec.id}`;
    characterGroup.position.copy(spec.pos);

    // Randomize speed slightly (±0.08 m/s) so they don't walk identically
    const speedVariation = (Math.sin(index * 1.7) * 0.08);
    const speed = Math.max(0.7, spec.baseSpeed + speedVariation);

    // Pick skin & hair
    const skinMat = this.skinMaterials[index % this.skinMaterials.length];
    const hairMat = spec.type === 'ELDERLY' ? this.hairMats[3] : this.hairMats[index % 3];
    const shirtMat = this.clothMats[spec.cloth] || this.clothMats.denim;
    const pantsMat = this.clothMats[spec.pants] || this.clothMats.darkGrey;

    // Pedestrian Data object
    const pedestrianData = {
      personId: spec.id,
      type: spec.type,
      name: spec.name,
      status: 'WALKING', // WALKING | WAITING | CROSSING | AVOIDING | AT_DESTINATION
      speed: Number(speed.toFixed(2)),
      baseSpeed: Number(speed.toFixed(2)),
      destination: spec.dest,
      coordinates: { x: spec.pos.x, y: spec.pos.y, z: spec.pos.z }
    };

    // 1. Torso / Upper Body (Center at y = 1.05)
    const torsoMesh = new THREE.Mesh(this.geos.torso, shirtMat);
    torsoMesh.position.y = 1.05;
    characterGroup.add(torsoMesh);

    // 2. Head (Center at y = 1.55)
    const headMesh = new THREE.Mesh(this.geos.head, skinMat);
    headMesh.position.y = 1.55;
    characterGroup.add(headMesh);

    // Hair cap
    const hairMesh = new THREE.Mesh(this.geos.hair, hairMat);
    hairMesh.position.set(0, 1.66, -0.02);
    characterGroup.add(hairMesh);

    // 3. Articulated Limbs with Hips/Shoulder pivots
    // Left Leg (Pivot at y = 0.72)
    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.14, 0.72, 0);
    const leftLegMesh = new THREE.Mesh(this.geos.leg, pantsMat);
    leftLegMesh.position.y = -0.36;
    leftLegPivot.add(leftLegMesh);
    const leftFootMesh = new THREE.Mesh(this.geos.foot, this.clothMats.darkGrey);
    leftFootMesh.position.set(0, -0.7, 0.05);
    leftLegPivot.add(leftFootMesh);
    characterGroup.add(leftLegPivot);

    // Right Leg (Pivot at y = 0.72)
    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.14, 0.72, 0);
    const rightLegMesh = new THREE.Mesh(this.geos.leg, pantsMat);
    rightLegMesh.position.y = -0.36;
    rightLegPivot.add(rightLegMesh);
    const rightFootMesh = new THREE.Mesh(this.geos.foot, this.clothMats.darkGrey);
    rightFootMesh.position.set(0, -0.7, 0.05);
    rightLegPivot.add(rightFootMesh);
    characterGroup.add(rightLegPivot);

    // Left Arm (Pivot at y = 1.32)
    const leftArmPivot = new THREE.Group();
    leftArmPivot.position.set(-0.32, 1.32, 0);
    const leftArmMesh = new THREE.Mesh(this.geos.arm, shirtMat);
    leftArmMesh.position.y = -0.28;
    leftArmPivot.add(leftArmMesh);
    const leftHandMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), skinMat);
    leftHandMesh.position.y = -0.56;
    leftArmPivot.add(leftHandMesh);
    characterGroup.add(leftArmPivot);

    // Right Arm (Pivot at y = 1.32)
    const rightArmPivot = new THREE.Group();
    rightArmPivot.position.set(0.32, 1.32, 0);
    const rightArmMesh = new THREE.Mesh(this.geos.arm, shirtMat);
    rightArmMesh.position.y = -0.28;
    rightArmPivot.add(rightArmMesh);
    const rightHandMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), skinMat);
    rightHandMesh.position.y = -0.56;
    rightArmPivot.add(rightHandMesh);
    characterGroup.add(rightArmPivot);

    // 4. Role-specific accessories
    if (spec.accessory === 'backpack') {
      const backpackMesh = new THREE.Mesh(this.geos.backpack, this.clothMats.navy);
      backpackMesh.position.set(0, 1.05, -0.22);
      characterGroup.add(backpackMesh);
    } else if (spec.accessory === 'sunhat') {
      const hatMesh = new THREE.Mesh(this.geos.hatBrim, this.clothMats.khaki);
      hatMesh.position.set(0, 1.74, 0);
      characterGroup.add(hatMesh);
    } else if (spec.accessory === 'cap') {
      const capMesh = new THREE.Mesh(this.geos.hat, this.clothMats.navy);
      capMesh.position.set(0, 1.74, 0);
      characterGroup.add(capMesh);
    } else if (spec.accessory === 'cane') {
      const caneMesh = new THREE.Mesh(this.geos.cane, this.clothMats.brownLeather);
      caneMesh.position.set(0.38, 0.45, 0.1);
      characterGroup.add(caneMesh);
    } else if (spec.accessory === 'briefcase') {
      const briefcaseMesh = new THREE.Mesh(this.geos.briefcase, this.clothMats.brownLeather);
      briefcaseMesh.position.set(0.38, 0.5, 0);
      characterGroup.add(briefcaseMesh);
    }

    // 5. Setup Tagging for Raycasting & Click Inspector
    this.tagPedestrianInteractive(characterGroup, pedestrianData);

    // 6. Navigation waypoint route from starting location to destination
    const pathNodes = this.buildInitialRoute(spec.dest, spec.pos);

    return {
      id: spec.id,
      data: pedestrianData,
      group: characterGroup,
      pivots: {
        leftLeg: leftLegPivot,
        rightLeg: rightLegPivot,
        leftArm: leftArmPivot,
        rightArm: rightArmPivot,
        torso: torsoMesh
      },
      currentWaypointIndex: 0,
      pathWaypoints: pathNodes,
      walkCycleTime: Math.random() * Math.PI * 2,
      destinationWaitTimer: 0,
      avoidanceTimer: 0,
      isWaitingAtCrosswalk: false
    };
  }

  /**
   * Recursively tags all parts of the pedestrian mesh with userData for raycasting
   */
  tagPedestrianInteractive(root, data) {
    if (!root) return;
    if (root.isMesh) {
      root.castShadow = false;
      root.receiveShadow = false;
      root.userData = {
        isPedestrian: true,
        pedestrianData: data
      };
      this.interactiveMeshes.push(root);
    }
    if (root.children && root.children.length > 0) {
      root.children.forEach(child => this.tagPedestrianInteractive(child, data));
    }
  }

  /**
   * Generates a connected sequence of sidewalk and crosswalk waypoints to destination
   */
  buildInitialRoute(destinationName, startPos) {
    const goalKey = this.facilityNodeMap[destinationName] || 'FAC_PARK';
    const startKey = this.findNearestWaypointKey(startPos);
    const keyRoute = this.findShortestPath(startKey, goalKey);

    const pathVectors = [];
    pathVectors.push(startPos.clone());

    keyRoute.forEach(key => {
      const wp = this.waypoints[key];
      if (wp) {
        // Small subtle jitter (±0.3m) so pedestrians don't walk in laser-straight line
        const jitterX = (Math.random() - 0.5) * 0.5;
        const jitterZ = (Math.random() - 0.5) * 0.5;
        pathVectors.push(new THREE.Vector3(wp.x + jitterX, wp.y, wp.z + jitterZ));
      }
    });

    return pathVectors;
  }

  /**
   * Main simulation loop: navigation, collision avoidance, walking animation
   */
  update(delta) {
    this.animationTime += delta;
    const isNight = this.lightingManager ? Boolean(this.lightingManager.isNight) : false;

    // Get active vehicle fleet from VehicleSimulation (read-only)
    const activeVehicles = this.vehicleSimulation?.vehicles || [];

    // Update each pedestrian
    for (let i = 0; i < this.pedestrians.length; i++) {
      const ped = this.pedestrians[i];
      this.updatePedestrian(ped, delta, isNight, activeVehicles);
    }

    // Keep selection marker positioned above selected pedestrian
    if (this.selectedPedestrian && this.selectionMarker.visible) {
      this.selectionMarker.position.set(
        this.selectedPedestrian.group.position.x,
        0,
        this.selectedPedestrian.group.position.z
      );
      // Subtle rotation of selection chevron
      this.selectionMarker.children[1].rotation.y += delta * 2;
    }
  }

  updatePedestrian(ped, delta, isNight, vehicles) {
    const currentPos = ped.group.position;
    const data = ped.data;

    // Apply night-time speed reduction (~15% slower at night for realism)
    const nightSpeedMult = isNight ? 0.85 : 1.0;
    const effectiveSpeed = data.baseSpeed * nightSpeedMult;
    data.speed = Number(effectiveSpeed.toFixed(2));

    // 1. Check Vehicle Proximity (Safety Radius ~4.5 - 6.0 meters, Emergency ~9 - 10 meters)
    const nearestVehicle = this.checkVehicleProximity(currentPos, vehicles);
    let shouldYield = false;

    if (nearestVehicle) {
      const dist = nearestVehicle.dist;
      const v = nearestVehicle.vehicle;
      const isEmergency = v.type === 'AMBULANCE' || v.isEmergencyActive || v.type === 'FIRE' || v.type === 'POLICE';

      // Higher priority for emergency vehicles
      if (isEmergency && dist < 9.5) {
        shouldYield = true;
        data.status = 'YIELDING_EMERGENCY';
      } else if (dist < 5.0) {
        shouldYield = true;
        data.status = 'AVOIDING_VEHICLE';
      }
    }

    if (shouldYield) {
      // Pause walking animation and movement
      this.animateWalkingLimbs(ped, 0);
      data.coordinates = {
        x: Number(currentPos.x.toFixed(1)),
        y: Number(currentPos.y.toFixed(1)),
        z: Number(currentPos.z.toFixed(1))
      };
      return;
    }

    // 2. Handling Pauses at Destination Facility
    if (ped.destinationWaitTimer > 0) {
      ped.destinationWaitTimer -= delta;
      data.status = 'AT_DESTINATION';
      this.animateWalkingLimbs(ped, 0); // idle stance
      return;
    }

    // 3. Waypoint Following
    if (!ped.pathWaypoints || ped.pathWaypoints.length === 0) return;

    if (ped.currentWaypointIndex >= ped.pathWaypoints.length) {
      // Reached end of route: pause at destination facility for 4 - 7 seconds
      ped.destinationWaitTimer = 4.0 + Math.random() * 3.0;
      ped.currentWaypointIndex = 0;

      // Choose next facility destination (prefer illuminated/active facilities at night)
      const pool = isNight ? this.nightDestinations : this.facilityDestinations;
      let nextDest = pool[Math.floor(Math.random() * pool.length)];
      if (nextDest === data.destination && pool.length > 1) {
        nextDest = pool[(pool.indexOf(nextDest) + 1) % pool.length];
      }

      data.destination = nextDest;
      ped.pathWaypoints = this.buildInitialRoute(nextDest, currentPos);
      return;
    }

    const targetWp = ped.pathWaypoints[ped.currentWaypointIndex];
    const dx = targetWp.x - currentPos.x;
    const dz = targetWp.z - currentPos.z;
    const distanceToWp = Math.hypot(dx, dz);

    if (distanceToWp < 0.85) {
      // Reached waypoint: advance to next
      ped.currentWaypointIndex++;
      return;
    }

    // 4. Crosswalk Traffic Safety Check
    const isApproachingCrosswalk = this.isNearCrosswalk(currentPos);
    if (isApproachingCrosswalk) {
      // If any vehicle is within 12m of crosswalk, pause safely on curb
      if (nearestVehicle && nearestVehicle.dist < 12.0) {
        data.status = 'WAITING_CROSSWALK';
        this.animateWalkingLimbs(ped, 0);
        return;
      }
    }

    // 5. Move towards target waypoint
    data.status = isApproachingCrosswalk ? 'CROSSING' : 'WALKING';
    const moveDir = new THREE.Vector2(dx, dz).normalize();
    const moveDist = effectiveSpeed * delta;

    currentPos.x += moveDir.x * moveDist;
    currentPos.z += moveDir.y * moveDist;

    // Smoothly rotate character to face walking direction
    const targetAngle = Math.atan2(moveDir.x, moveDir.y);
    ped.group.rotation.y = THREE.MathUtils.lerp(ped.group.rotation.y, targetAngle, 0.15);

    // 6. Update limb swing animation
    ped.walkCycleTime += delta * effectiveSpeed * 4.5;
    this.animateWalkingLimbs(ped, effectiveSpeed);

    // Keep metadata coordinates updated
    data.coordinates = {
      x: Number(currentPos.x.toFixed(1)),
      y: Number(currentPos.y.toFixed(1)),
      z: Number(currentPos.z.toFixed(1))
    };
  }

  /**
   * Procedural walking animation: alternating leg swing and counter arm swing
   */
  animateWalkingLimbs(ped, currentSpeed) {
    const { leftLeg, rightLeg, leftArm, rightArm, torso } = ped.pivots;

    if (currentSpeed < 0.1) {
      // Idle pose: smoothly return limbs to neutral stance
      leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 0, 0.15);
      rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, 0, 0.15);
      leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, 0, 0.15);
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, 0, 0.15);
      torso.position.y = THREE.MathUtils.lerp(torso.position.y, 1.05, 0.15);
      return;
    }

    const t = ped.walkCycleTime;
    const legSwing = Math.sin(t) * 0.55;
    const armSwing = Math.cos(t) * 0.45;
    const verticalBob = Math.abs(Math.sin(t * 2)) * 0.05;

    leftLeg.rotation.x = legSwing;
    rightLeg.rotation.x = -legSwing;
    leftArm.rotation.x = -armSwing;
    rightArm.rotation.x = armSwing;

    torso.position.y = 1.05 + verticalBob;
  }

  /**
   * Reads vehicles from VehicleSimulation (read-only) and finds closest vehicle within danger threshold
   */
  checkVehicleProximity(pedPos, vehicles) {
    if (!vehicles || vehicles.length === 0) return null;

    let closest = null;
    let minDist = Infinity;

    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      const vPos = v.position || v.meshGroup?.position || v.group?.position;
      if (!vPos) continue;

      const d = pedPos.distanceTo(vPos);
      if (d < minDist) {
        minDist = d;
        closest = { vehicle: v, dist: d };
      }
    }

    return closest;
  }

  /**
   * Checks if coordinates are near any designated crosswalk curb or midpoint
   */
  isNearCrosswalk(pos) {
    for (let i = 0; i < this.crosswalks.length; i++) {
      const cw = this.crosswalks[i];
      const midWp = this.waypoints[cw.mid];
      if (midWp && pos.distanceTo(midWp) < 9.5) {
        return true;
      }
    }
    return false;
  }

  // =========================================================================
  // PUBLIC ACCESSORS & RAYCAST SELECTION
  // =========================================================================

  getInteractiveMeshes() {
    return this.interactiveMeshes;
  }

  selectPedestrian(pedestrianData) {
    if (!pedestrianData) {
      this.clearSelection();
      return;
    }

    const target = this.pedestrians.find(p => p.id === pedestrianData.personId);
    if (target) {
      this.selectedPedestrian = target;
      this.selectionMarker.visible = true;
      this.selectionMarker.position.set(
        target.group.position.x,
        0,
        target.group.position.z
      );
    }
  }

  clearSelection() {
    this.selectedPedestrian = null;
    this.selectionMarker.visible = false;
  }

  getAllPedestrians() {
    return this.pedestrians.map(p => p.data);
  }

  getPedestrianData(personId) {
    const ped = this.pedestrians.find(p => p.id === personId);
    return ped ? ped.data : null;
  }
}
