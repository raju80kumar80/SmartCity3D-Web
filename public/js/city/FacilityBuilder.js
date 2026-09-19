import * as THREE from 'three';

/**
 * FacilityBuilder
 * Procedurally generates 10 recognizable low-poly 3D public and commercial destination facilities:
 * 1. CITY HOSPITAL (FAC-HOSPITAL)
 * 2. POLICE STATION (FAC-POLICE)
 * 3. FIRE STATION (FAC-FIRE)
 * 4. SMART SCHOOL (FAC-SCHOOL)
 * 5. BUS STATION (FAC-BUS)
 * 6. CITY PARK (FAC-PARK)
 * 7. GOVERNMENT OFFICE (FAC-GOV)
 * 8. SHOPPING CENTER (FAC-MALL)
 * 9. POWER STATION (FAC-POWER)
 * 10. WATER TREATMENT PLANT (FAC-WATER)
 *
 * Each facility is crafted with distinctive architectural silhouettes, functional details
 * (ambulance bays, helipads, garage doors, playgrounds, clarifier tanks, transformers),
 * floating architectural labels, day/night lighting awareness, and raycast interaction metadata.
 */
export class FacilityBuilder {
  constructor(lightingManager = null) {
    this.lightingManager = lightingManager;
    this.group = new THREE.Group();
    this.group.name = 'SmartCityFacilities';

    this.interactiveMeshes = [];
    this.facilitiesMap = new Map();
    this.dynamicResources = [];
    this.floatingLabels = [];
    this.animationTime = 0;
    this.lastNightState = null;

    // Animated references (rotators, beacons, water agitators)
    this.animatedObjects = [];

    // Shared Materials Palette
    this.initSharedMaterials();

    // 10 Smart City Facility Definitions
    this.facilityDefinitions = [
      {
        facilityId: 'FAC-HOSPITAL',
        name: 'CITY HOSPITAL',
        type: 'HOSPITAL',
        zone: 'CIVIC',
        status: 'OPERATIONAL',
        description: 'Central regional trauma and healthcare complex featuring 24/7 emergency response, ambulance triage bays, and rooftop medical helipad.',
        extraLabel: 'Emergency Services:',
        extraValue: 'Available (Trauma Level 1)',
        coordinates: { x: 22, y: 0, z: -64 },
        icon: '🏥',
        accentColor: '#38bdf8',
        builder: this.buildHospital.bind(this)
      },
      {
        facilityId: 'FAC-GOV',
        name: 'GOVERNMENT OFFICE',
        type: 'GOVERNMENT',
        zone: 'CIVIC',
        status: 'OPERATIONAL',
        description: 'Municipal administrative center accommodating the Smart City civic council, public registry services, and central governance chambers.',
        extraLabel: 'Public Hours:',
        extraValue: '08:00 - 18:00 (Mon-Fri)',
        coordinates: { x: -22, y: 0, z: -64 },
        icon: '🏛️',
        accentColor: '#f59e0b',
        builder: this.buildGovernmentOffice.bind(this)
      },
      {
        facilityId: 'FAC-POWER',
        name: 'POWER STATION',
        type: 'UTILITY',
        zone: 'UTILITY',
        status: 'OPERATIONAL',
        description: 'High-voltage grid transmission substation with high-capacity step-up transformers, transmission pylons, and automated load balancing.',
        extraLabel: 'Grid Output:',
        extraValue: '28.5 MW Clean Energy',
        coordinates: { x: -68, y: 0, z: -64 },
        icon: '⚡',
        accentColor: '#eab308',
        builder: this.buildPowerStation.bind(this)
      },
      {
        facilityId: 'FAC-FIRE',
        name: 'FIRE STATION',
        type: 'FIRE_STATION',
        zone: 'CIVIC',
        status: 'OPERATIONAL',
        description: 'Metropolitan fire rescue headquarters with 2-bay rapid turnout garages, equipment watch tower, and specialized hazardous incident crew.',
        extraLabel: 'Turnout Readiness:',
        extraValue: 'Rapid Response (90s)',
        coordinates: { x: -64, y: 0, z: -10 },
        icon: '🚒',
        accentColor: '#ef4444',
        builder: this.buildFireStation.bind(this)
      },
      {
        facilityId: 'FAC-BUS',
        name: 'BUS STATION',
        type: 'TRANSIT',
        zone: 'TRANSIT',
        status: 'OPERATIONAL',
        description: 'Central multimodal passenger hub featuring cantilever shelters, multi-platform turnaround bays, and digital passenger route screens.',
        extraLabel: 'Active Platforms:',
        extraValue: '6 Transit Bays',
        coordinates: { x: -64, y: 0, z: 8 },
        icon: '🚏',
        accentColor: '#06b6d4',
        builder: this.buildBusStation.bind(this)
      },
      {
        facilityId: 'FAC-MALL',
        name: 'SHOPPING CENTER',
        type: 'COMMERCIAL',
        zone: 'COMMERCIAL',
        status: 'OPERATIONAL',
        description: 'Contemporary retail galleria with curved multi-story glass atrium, ground-level designer boutiques, dining esplanade, and promenade plaza.',
        extraLabel: 'Retail Directory:',
        extraValue: '48 Stores & Dining',
        coordinates: { x: 64, y: 0, z: -10 },
        icon: '🛍️',
        accentColor: '#ec4899',
        builder: this.buildShoppingCenter.bind(this)
      },
      {
        facilityId: 'FAC-POLICE',
        name: 'POLICE STATION',
        type: 'POLICE',
        zone: 'CIVIC',
        status: 'OPERATIONAL',
        description: 'Metropolitan law enforcement precinct coordinating smart security monitoring, crime prevention patrols, and emergency tactical response.',
        extraLabel: 'Patrol Force:',
        extraValue: 'Active Patrol Units On-Duty',
        coordinates: { x: -22, y: 0, z: 64 },
        icon: '🚓',
        accentColor: '#3b82f6',
        builder: this.buildPoliceStation.bind(this)
      },
      {
        facilityId: 'FAC-SCHOOL',
        name: 'SMART SCHOOL',
        type: 'EDUCATION',
        zone: 'RESIDENTIAL',
        status: 'OPERATIONAL',
        description: 'Modern digital academy with smart interactive classrooms, science and robotics labs, outdoor courtyard, sports court, and playground.',
        extraLabel: 'Student Enrollment:',
        extraValue: '850 Students (K-12)',
        coordinates: { x: -32, y: 0, z: 64 },
        icon: '🏫',
        accentColor: '#10b981',
        builder: this.buildSchool.bind(this)
      },
      {
        facilityId: 'FAC-PARK',
        name: 'CITY PARK',
        type: 'LEISURE',
        zone: 'PARK',
        status: 'OPEN',
        description: 'Expansive public botanical sanctuary with paved walking promenades, stone bridges, central tiered fountain, rest benches, and shade groves.',
        extraLabel: 'Sanctuary Access:',
        extraValue: 'Open 24/7 (Public)',
        coordinates: { x: 22, y: 0, z: 64 },
        icon: '🌳',
        accentColor: '#22c55e',
        builder: this.buildCityPark.bind(this)
      },
      {
        facilityId: 'FAC-WATER',
        name: 'WATER TREATMENT PLANT',
        type: 'UTILITY',
        zone: 'UTILITY',
        status: 'OPERATIONAL',
        description: 'Advanced municipal water purification facility with twin clarifier basins, rotating aerators, pipe manifolds, and pressure pump house.',
        extraLabel: 'Daily Flow:',
        extraValue: '180,000 m³ / day',
        coordinates: { x: 68, y: 0, z: 64 },
        icon: '💧',
        accentColor: '#0284c7',
        builder: this.buildWaterTreatmentPlant.bind(this)
      }
    ];

    this.buildAllFacilities();
  }

  initSharedMaterials() {
    // Structural & Architectural Materials
    this.concreteMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.8,
      metalness: 0.1
    });

    this.darkSlateMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.4
    });

    this.charcoalTrimMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.5,
      metalness: 0.3
    });

    this.stoneBaseMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.85
    });

    this.sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      roughness: 0.9
    });

    this.asphaltDriveMat = new THREE.MeshStandardMaterial({
      color: 0x1e222d,
      roughness: 0.95
    });

    // Glass & Windows
    this.glassBlueMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });

    this.glassDarkMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.9
    });

    // Window Glows for Day/Night
    this.windowGlowCoolMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35,
      roughness: 0.3
    });

    this.windowGlowWarmMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xeab308,
      emissiveIntensity: 0.35,
      roughness: 0.3
    });

    // Accent Colors
    this.emergencyRedMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0xb91c1c,
      emissiveIntensity: 0.4,
      roughness: 0.5
    });

    this.policeBlueMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.4,
      roughness: 0.4
    });

    this.schoolWarmMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.7
    });

    this.hazardYellowMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15
    });

    this.metalChromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.85,
      roughness: 0.2
    });

    this.industrialRustMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.7,
      metalness: 0.5
    });

    this.grassMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.85
    });

    this.waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.08,
      metalness: 0.7
    });

    this.treeTrunkMat = new THREE.MeshStandardMaterial({
      color: 0x451a03,
      roughness: 0.9
    });

    this.treeLeafMats = [
      new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 }),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.65 }),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75 })
    ];
  }

  buildAllFacilities() {
    this.facilityDefinitions.forEach(fac => {
      const facGroup = new THREE.Group();
      facGroup.name = `Facility_${fac.facilityId}`;
      facGroup.position.set(fac.coordinates.x, fac.coordinates.y || 0, fac.coordinates.z);

      // Invoke custom procedural builder
      fac.builder(facGroup, fac);

      // Add to scene group
      this.group.add(facGroup);
      this.facilitiesMap.set(fac.facilityId, {
        data: fac,
        group: facGroup
      });
    });
  }

  /**
   * Recursive tagging helper to make all child meshes interactive and raycast-discoverable
   */
  tagMeshInteractive(mesh, facilityData) {
    if (!mesh) return;
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = {
        isFacility: true,
        facilityData: facilityData
      };
      this.interactiveMeshes.push(mesh);
    }
    if (mesh.children && mesh.children.length > 0) {
      mesh.children.forEach(child => this.tagMeshInteractive(child, facilityData));
    }
  }

  // =========================================================================
  // 1. CITY HOSPITAL (FAC-HOSPITAL)
  // =========================================================================
  buildHospital(group, fac) {
    const root = new THREE.Group();

    // 1. Ground base / Sidewalk & Ambulance Driveway Pad (24 x 20)
    const baseGeo = new THREE.BoxGeometry(24, 0.2, 20);
    const baseMesh = new THREE.Mesh(baseGeo, this.sidewalkMat);
    baseMesh.position.set(0, 0.1, 0);
    root.add(baseMesh);

    // Ambulance bay driveway asphalt strip
    const driveGeo = new THREE.BoxGeometry(10, 0.22, 9);
    const driveMesh = new THREE.Mesh(driveGeo, this.asphaltDriveMat);
    driveMesh.position.set(6, 0.11, 4.5);
    root.add(driveMesh);

    // Hazard cross-hatch marking in ambulance bay
    const crossHatchGeo = new THREE.PlaneGeometry(8, 7);
    const crossHatchMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.6 });
    const crossHatch = new THREE.Mesh(crossHatchGeo, crossHatchMat);
    crossHatch.rotation.x = -Math.PI / 2;
    crossHatch.position.set(6, 0.23, 4.5);
    root.add(crossHatch);

    // 2. Main Central Tower (Width 12, Height 18, Depth 10)
    const towerGeo = new THREE.BoxGeometry(12, 18, 10);
    const towerMesh = new THREE.Mesh(towerGeo, this.concreteMat);
    towerMesh.position.set(-3, 9, -2);
    root.add(towerMesh);

    // Modern blue/cyan glass ribbon panels on tower
    for (let f = 1; f <= 4; f++) {
      const winGeo = new THREE.BoxGeometry(12.1, 1.2, 8);
      const winMesh = new THREE.Mesh(winGeo, this.windowGlowCoolMat);
      winMesh.position.set(-3, f * 3.5 + 1.2, -2);
      root.add(winMesh);
    }

    // 3. Emergency / Trauma Wing (Width 8, Height 8, Depth 8)
    const wingGeo = new THREE.BoxGeometry(8, 8, 8);
    const wingMesh = new THREE.Mesh(wingGeo, this.concreteMat);
    wingMesh.position.set(6, 4, -2);
    root.add(wingMesh);

    // 4. Large Glowing Medical Red Cross on Tower Facade
    const crossGroup = new THREE.Group();
    const crossMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.2,
      roughness: 0.2
    });
    const barV = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.8, 0.4), crossMat);
    const barH = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.2, 0.4), crossMat);
    crossGroup.add(barV);
    crossGroup.add(barH);
    crossGroup.position.set(-3, 14.5, 3.2); // Protrudes on front face
    root.add(crossGroup);

    // Secondary emergency red cross above ambulance bay
    const smallCross = crossGroup.clone();
    smallCross.scale.set(0.55, 0.55, 0.55);
    smallCross.position.set(6, 6.2, 2.2);
    root.add(smallCross);

    // 5. Emergency Entrance Canopy
    const canopyGeo = new THREE.BoxGeometry(7, 0.4, 4);
    const canopyMesh = new THREE.Mesh(canopyGeo, this.darkSlateMat);
    canopyMesh.position.set(6, 3.8, 3.8);
    root.add(canopyMesh);

    // Support pillars for canopy
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.8, 8), this.metalChromeMat);
    p1.position.set(3.2, 1.9, 5.4);
    const p2 = p1.clone();
    p2.position.set(8.8, 1.9, 5.4);
    root.add(p1);
    root.add(p2);

    // 6. Rooftop Helipad
    const helipadGeo = new THREE.CylinderGeometry(4.2, 4.2, 0.35, 24);
    const helipadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const helipad = new THREE.Mesh(helipadGeo, helipadMat);
    helipad.position.set(-3, 18.2, -2);
    root.add(helipad);

    // Helipad 'H' Marking & Outer Ring
    const hRingGeo = new THREE.RingGeometry(3.2, 3.5, 32);
    const hRing = new THREE.Mesh(hRingGeo, this.hazardYellowMat);
    hRing.rotation.x = -Math.PI / 2;
    hRing.position.set(-3, 18.4, -2);
    root.add(hRing);

    // 3D 'H'
    const hGroup = new THREE.Group();
    const hBar1 = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 2.8), this.hazardYellowMat);
    const hBar2 = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 2.8), this.hazardYellowMat);
    const hBarM = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), this.hazardYellowMat);
    hBar1.rotation.x = -Math.PI / 2;
    hBar2.rotation.x = -Math.PI / 2;
    hBarM.rotation.x = -Math.PI / 2;
    hBar1.position.set(-0.8, 0, 0);
    hBar2.position.set(0.8, 0, 0);
    hGroup.add(hBar1);
    hGroup.add(hBar2);
    hGroup.add(hBarM);
    hGroup.position.set(-3, 18.42, -2);
    root.add(hGroup);

    // Rooftop Communications Antenna with Red Beacon
    const antGeo = new THREE.CylinderGeometry(0.08, 0.15, 6, 8);
    const antenna = new THREE.Mesh(antGeo, this.metalChromeMat);
    antenna.position.set(1.5, 21, -4);
    root.add(antenna);

    const beaconGeo = new THREE.SphereGeometry(0.28, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(1.5, 24.2, -4);
    root.add(beacon);
    this.animatedObjects.push({ mesh: beacon, type: 'beacon', speed: 4 });

    // Decorative entrance landscaping
    this.addLandscaping(root, [-10, -7], [7, 7]);

    // Floating 3D Label
    this.createFloatingLabel(root, fac, 21.5);

    this.tagMeshInteractive(root, fac);
    group.add(root);
  }

  // =========================================================================
  // 2. POLICE STATION (FAC-POLICE)
  // =========================================================================
  buildPoliceStation(group, fac) {
    const root = new THREE.Group();

    // Base Pad (22 x 18)
    const baseGeo = new THREE.BoxGeometry(22, 0.2, 18);
    const baseMesh = new THREE.Mesh(baseGeo, this.sidewalkMat);
    baseMesh.position.set(0, 0.1, 0);
    root.add(baseMesh);

    // Main 2-Tier Police HQ Structure (Deep navy & slate)
    const hqGeo = new THREE.BoxGeometry(13, 10, 10);
    const hqMesh = new THREE.Mesh(hqGeo, this.darkSlateMat);
    hqMesh.position.set(-3, 5, -2);
    root.add(hqMesh);

    // Upper command tier
    const topGeo = new THREE.BoxGeometry(9, 4, 7);
    const topMesh = new THREE.Mesh(topGeo, this.concreteMat);
    topMesh.position.set(-3, 12, -2);
    root.add(topMesh);

    // Window bands
    for (let f = 1; f <= 2; f++) {
      const winGeo = new THREE.BoxGeometry(13.1, 0.9, 8);
      const winMesh = new THREE.Mesh(winGeo, this.windowGlowCoolMat);
      winMesh.position.set(-3, f * 3.8 + 0.5, -2);
      root.add(winMesh);
    }

    // Glowing Police Badge / Shield Emblem on facade
    const badgeGroup = new THREE.Group();
    const shieldGeo = new THREE.CylinderGeometry(1.6, 1.2, 0.35, 6);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      emissive: 0x2563eb,
      emissiveIntensity: 1.1,
      roughness: 0.2
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.rotation.x = Math.PI / 2;
    badgeGroup.add(shield);

    // Gold star starburst in center of shield
    const starGeo = new THREE.SphereGeometry(0.45, 6, 6);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.set(0, 0, 0.25);
    badgeGroup.add(star);

    badgeGroup.position.set(-3, 8.8, 3.2);
    root.add(badgeGroup);

    // Entrance Portico with blue accent bar
    const porticoGeo = new THREE.BoxGeometry(6, 0.4, 3.5);
    const portico = new THREE.Mesh(porticoGeo, this.concreteMat);
    portico.position.set(-3, 3.6, 4);
    root.add(portico);

    const blueBarGeo = new THREE.BoxGeometry(6.05, 0.25, 0.2);
    const blueBar = new THREE.Mesh(blueBarGeo, this.policeBlueMat);
    blueBar.position.set(-3, 3.75, 5.76);
    root.add(blueBar);

    // Police Cruiser Dedicated Parking Bay (East side)
    const parkPadGeo = new THREE.BoxGeometry(7, 0.22, 12);
    const parkPad = new THREE.Mesh(parkPadGeo, this.asphaltDriveMat);
    parkPad.position.set(6.5, 0.11, 0);
    root.add(parkPad);

    // White parking bay border lines
    const bayLineGeo = new THREE.PlaneGeometry(0.2, 5.5);
    const bayLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const line1 = new THREE.Mesh(bayLineGeo, bayLineMat);
    line1.rotation.x = -Math.PI / 2;
    line1.position.set(4.2, 0.23, 0);
    const line2 = line1.clone();
    line2.position.set(8.8, 0.23, 0);
    root.add(line1);
    root.add(line2);

    // Parked Low-Poly Police Patrol Cruiser
    const cruiser = this.createMiniPoliceCruiser();
    cruiser.position.set(6.5, 0.22, 0);
    root.add(cruiser);

    // Communications / Radar Mast
    const mastGeo = new THREE.CylinderGeometry(0.12, 0.18, 5, 8);
    const mast = new THREE.Mesh(mastGeo, this.metalChromeMat);
    mast.position.set(-6, 16.5, -4);
    root.add(mast);

    const radarDishGeo = new THREE.CylinderGeometry(1.2, 0.2, 0.3, 16);
    const radarDish = new THREE.Mesh(radarDishGeo, this.metalChromeMat);
    radarDish.rotation.z = Math.PI / 3;
    radarDish.position.set(-6, 18.2, -4);
    root.add(radarDish);
    this.animatedObjects.push({ mesh: radarDish, type: 'rotateY', speed: 0.8 });

    // Trees
    this.addLandscaping(root, [-8], [-6]);

    // Floating 3D Label
    this.createFloatingLabel(root, fac, 16.5);

    this.tagMeshInteractive(root, fac);
    group.add(root);
  }

  // =========================================================================
  // 3. FIRE STATION (FAC-FIRE)
  // =========================================================================
  buildFireStation(group, fac) {
    const root = new THREE.Group();

    // Base Pad (22 x 18)
    const baseGeo = new THREE.BoxGeometry(22, 0.2, 18);
    const baseMesh = new THREE.Mesh(baseGeo, this.sidewalkMat);
    baseMesh.position.set(0, 0.1, 0);
    root.add(baseMesh);

    // Front Turnout Apron (Concrete/asphalt with red/yellow safety cross-hatch)
    const apronGeo = new THREE.BoxGeometry(14, 0.22, 7.5);
    const apron = new THREE.Mesh(apronGeo, this.asphaltDriveMat);
    apron.position.set(-2, 0.11, 4.5);
    root.add(apron);

    // Main Engine House (Crimson red brick/panel, Width 14, Height 9, Depth 10)
    const garageGeo = new THREE.BoxGeometry(14, 9, 10);
    const garageMesh = new THREE.Mesh(garageGeo, this.emergencyRedMat);
    garageMesh.position.set(-2, 4.5, -3);
    root.add(garageMesh);

    // 2 Large Roll-Up Garage Bay Doors with segmented windows
    [-5.5, 1.5].forEach(gx => {
      const doorFrameGeo = new THREE.BoxGeometry(5.2, 6.2, 0.4);
      const doorFrame = new THREE.Mesh(doorFrameGeo, this.charcoalTrimMat);
      doorFrame.position.set(gx, 3.2, 2.1);
      root.add(doorFrame);

      // Roll-up segmented panels
      for (let s = 0; s < 4; s++) {
        const segGeo = new THREE.BoxGeometry(4.8, 1.2, 0.25);
        const segMat = (s === 2) ? this.glassDarkMat : this.emergencyRedMat;
        const seg = new THREE.Mesh(segGeo, segMat);
        seg.position.set(gx, 0.9 + s * 1.35, 2.25);
        root.add(seg);
      }

      // Yellow caution sill beneath garage doors
      const sillGeo = new THREE.BoxGeometry(5.2, 0.15, 0.8);
      const sill = new THREE.Mesh(sillGeo, this.hazardYellowMat);
      sill.position.set(gx, 0.23, 2.4);
      root.add(sill);
    });

    // Tall Watch / Hose-Drying Tower (Width 5, Height 17, Depth 5)
    const towerGeo = new THREE.BoxGeometry(5, 17, 5);
    const towerMesh = new THREE.Mesh(towerGeo, this.emergencyRedMat);
    towerMesh.position.set(7.5, 8.5, -3);
    root.add(towerMesh);

    // Charcoal roof parapet on tower
    const parapetGeo = new THREE.BoxGeometry(5.4, 0.6, 5.4);
    const parapet = new THREE.Mesh(parapetGeo, this.charcoalTrimMat);
    parapet.position.set(7.5, 17.2, -3);
    root.add(parapet);

    // Tower Observation Windows
    const towerWinGeo = new THREE.BoxGeometry(3.6, 1.4, 5.1);
    const towerWin = new THREE.Mesh(towerWinGeo, this.windowGlowWarmMat);
    towerWin.position.set(7.5, 15, -3);
    root.add(towerWin);

    // Emergency Rotating Strobe Siren Beacon atop tower
    const sirenPoleGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
    const sirenPole = new THREE.Mesh(sirenPoleGeo, this.metalChromeMat);
    sirenPole.position.set(7.5, 18, -3);
    root.add(sirenPole);

    const sirenBeaconGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const sirenBeaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const sirenBeacon = new THREE.Mesh(sirenBeaconGeo, sirenBeaconMat);
    sirenBeacon.position.set(7.5, 19, -3);
    root.add(sirenBeacon);
    this.animatedObjects.push({ mesh: sirenBeacon, type: 'beacon', speed: 5 });

    // Floating 3D Label
    this.createFloatingLabel(root, fac, 19.5);

    this.tagMeshInteractive(root, fac);
    group.add(root);
  }

  // =========================================================================
  // 4. SMART SCHOOL (FAC-SCHOOL)
  // =========================================================================
  buildSchool(group, fac) {
    const root = new THREE.Group();

    // Base Pad (26 x 20)
    const baseGeo = new THREE.BoxGeometry(26, 0.2, 20);
    const baseMesh = new THREE.Mesh(baseGeo, this.sidewalkMat);
    baseMesh.position.set(0, 0.1, 0);
    root.add(baseMesh);

    // Main Academic Wing (Warm terracotta / mustard, Width 14, Height 9, Depth 8)
    const mainGeo = new THREE.BoxGeometry(14, 9, 8);
    const mainMesh = new THREE.Mesh(mainGeo, this.schoolWarmMat);
    mainMesh.position.set(-5, 4.5, -4);
    root.add(mainMesh);

    // Classroom window bands (Large modern panels)
    for (let f = 1; f <= 2; f++) {
      const winGeo = new THREE.BoxGeometry(12.5, 1.3, 8.1);
      const winMesh = new THREE.Mesh(winGeo, this.windowGlowWarmMat);
      winMesh.position.set(-5, f * 3.4 + 0.2, -4);
      root.add(winMesh);
    }

    // Science & Library Wing (Off-white stucco, Width 8, Height 7, Depth 10)
    const sciGeo = new THREE.BoxGeometry(8, 7, 10);
    const sciMesh = new THREE.Mesh(sciGeo, this.concreteMat);
    sciMesh.position.set(6, 3.5, -3);
    root.add(sciMesh);

    // Connecting Glass Atrium Entrance
    const atriumGeo = new THREE.BoxGeometry(4, 5, 4);
    const atrium = new THREE.Mesh(atriumGeo, this.glassBlueMat);
    atrium.position.set(1.5, 2.5, -2);
    root.add(atrium);

    // Modern Entrance Archway Canopy
    const canopyGeo = new THREE.BoxGeometry(5, 0.35, 3.5);
    const canopy = new THREE.Mesh(canopyGeo, this.darkSlateMat);
    canopy.position.set(1.5, 4.8, 0);
    root.add(canopy);

    // Outdoor Playground & Sports Area (South/Front area: Turf green)
    const turfGeo = new THREE.BoxGeometry(18, 0.22, 7.5);
    const turf = new THREE.Mesh(turfGeo, this.grassMat);
    turf.position.set(-2, 0.11, 4.5);
    root.add(turf);

    // Mini Basketball Half-Court (Red court marking pad)
    const courtGeo = new THREE.BoxGeometry(7, 0.23, 6);
    const courtMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 });
    const court = new THREE.Mesh(courtGeo, courtMat);
    court.position.set(3, 0.12, 4.5);
    root.add(court);

    // Basketball Hoop
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8);
    const pole = new THREE.Mesh(poleGeo, this.metalChromeMat);
    pole.position.set(6, 1.4, 4.5);
    root.add(pole);

    const backboardGeo = new THREE.BoxGeometry(0.1, 0.8, 1.2);
    const backboardMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const backboard = new THREE.Mesh(backboardGeo, backboardMat);
    backboard.position.set(5.95, 2.6, 4.5);
    root.add(backboard);

    // Playground Slide & Climbing Frame
    const slideFrameGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6);
    const s1 = new THREE.Mesh(slideFrameGeo, this.policeBlueMat);
    s1.position.set(-6, 1.1, 3.5);
    const s2 = s1.clone();
    s2.position.set(-6, 1.1, 5.5);
    root.add(s1);
    root.add(s2);

    const platformGeo = new THREE.BoxGeometry(1.6, 0.2, 2.2);
    const platform = new THREE.Mesh(platformGeo, this.hazardYellowMat);
    platform.position.set(-6, 2.0, 4.5);
    root.add(platform);

    const slideRampGeo = new THREE.BoxGeometry(2.4, 0.15, 1.2);
    const slideRamp = new THREE.Mesh(slideRampGeo, this.emergencyRedMat);
    slideRamp.rotation.z = -0.65;
    slideRamp.position.set(-4.5, 1.1, 4.5);
    root.add(slideRamp);

    // Courtyard Trees
    this.addLandscaping(root, [-10, 10], [0, 6]);

    // Floating 3D Label
    this.createFloatingLabel(root, fac, 14.5);

    this.tagMeshInteractive(root, fac);
    group.add(root);
  }

  // =========================================================================
  // 5. BUS STATION (FAC-BUS)
  // =========================================================================
  buildBusStation(group, fac) {
    const root = new THREE.Group();

    // Main Terminal Ground Pad (24 x 18)
    const baseGeo = new THREE.BoxGeometry(24, 0.2, 18);
    const baseMesh = new THREE.Mesh(baseGeo, this.sidewalkMat);
    baseMesh.position.set(0, 0.1, 0);
    root.add(baseMesh);

    // Asphalt Bus Drive-Through Loop / Bays
    const roadGeo = new THREE.BoxGeometry(22, 0.22, 10);
    const roadMesh = new THREE.Mesh(roadGeo, this.asphaltDriveMat);
    roadMesh.position.set(0, 0.11, 2.5);
    root.add(roadMesh);

    // Yellow tactile safety platform edge markings
    const edgeGeo = new THREE.PlaneGeometry(20, 0.35);
    const edge = new THREE.Mesh(edgeGeo, this.hazardYellowMat);
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(0, 0.23, -2.4);
    root.add(edge);

    // 3 Marked Bus Bay Slots (White bay lines)
    [-6, 0, 6].forEach(bx => {
      const bLineGeo = new THREE.PlaneGeometry(0.25, 6);
      const bLine = new THREE.Mesh(bLineGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
      bLine.rotation.x = -Math.PI / 2;
      bLine.position.set(bx, 0.23, 2.5);
      root.add(bLine);
    });

    // Rear Station Office / Dispatch Building (Width 22, Height 5.5, Depth 4.5)
    const stationGeo = new THREE.BoxGeometry(22, 5.5, 4.5);
    const stationMesh = new THREE.Mesh(stationGeo, this.concreteMat);
    stationMesh.position.set(0, 2.75, -5.5);
    root.add(stationMesh);

    // Modern glass panoramic office windows
    const winGeo = new THREE.BoxGeometry(20, 1.8, 4.6);
    const winMesh = new THREE.Mesh(winGeo, this.windowGlowCoolMat);
    winMesh.position.set(0, 3.2, -5.5);
    root.add(winMesh);

    // Signature Curved Cantilever Glass/Metal Bus Shelter Canopy
    const canopyRoofGeo = new THREE.BoxGeometry(22, 0.35, 7.5);
    const canopyRoof = new THREE.Mesh(canopyRoofGeo, this.darkSlateMat);
    canopyRoof.position.set(0, 5.2, -0.5);
    canopyRoof.rotation.x = -0.06; // Subtle aerofoil slant
    root.add(canopyRoof);

    // Translucent Blue Skylight strip across canopy
    const skylightGeo = new THREE.BoxGeometry(18, 0.4, 2.5);
    const skylight = new THREE.Mesh(skylightGeo, this.glassBlueMat);
    skylight.position.set(0, 5.25, -0.5);
    root.add(skylight);

    // Heavy Cantilever Tubular Pillars
    [-7, 0, 7].forEach(px => {
      const pGeo = new THREE.CylinderGeometry(0.18, 0.22, 5.2, 10);
      const p = new THREE.Mesh(pGeo, this.metalChromeMat);
      p.position.set(px, 2.6, -2.8);
      root.add(p);
    });

    // Passenger Waiting Benches
    [-4, 4].forEach(bx => {
      const benchGeo = new THREE.BoxGeometry(2.5, 0.4, 0.6);
      const bench = new THREE.Mesh(benchGeo, this.charcoalTrimMat);
      bench.position.set(bx, 0.4, -2.8);
      root.add(bench);
    });

    // Glowing Digital Route Timetable Board
    const boardGeo = new THREE.BoxGeometry(2.2, 1.2, 0.2);
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.0,
      roughness: 0.2
    });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(0, 4.2, -2.6);
    root.add(board);

    // Parked Low-Poly City Bus in Bay 1
    const bus = this.createMiniBus();
    bus.position.set(-6, 0.22, 2.5);
    root.add(bus);

    // Floating 3D Label
    this.createFloatingLabel(root, fac, 10.5);

    this.tagMeshInteractive(root, fac);
    group.add(root);
  }

  // =========================================================================
  // 6. CITY PARK (FAC-PARK)
  // =========================================================================
  buildCityPark(group, fac) {
    const root = new THREE.Group();

    // Raised Lush Grassy Base (24 x 20)
    const baseGeo = new THREE.BoxGeometry(24, 0.35, 20);
    const baseMesh = new THREE.Mesh(baseGeo, this.grassMat);
    baseMesh.position.set(0, 0.175, 0);
    root.add(baseMesh);

    // Decorative Stone Curb Border around perimeter
    const curbMat = this.stoneBaseMat;
    const cN = new THREE.Mesh(new THREE.BoxGeometry(24.4, 0.45, 0.4), curbMat);
    cN.position.set(0, 0.225, -10.1);
    const cS = cN.clone();
    cS.position.set(0, 0.225, 10.1);
    const cW = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 20.4), curbMat);
    cW.position.set(-12.1, 0.225, 0);
    const cE = cW.clone();
    cE.position.set(12.1, 0.225, 0);
    root.add(cN);
    root.add(cS);
    root.add(cW);
    root.add(cE);

    // Flagstone Cross Walking Promenades
    const pathMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 });
    const pN = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.05, 20), pathMat);
    pN.position.set(0, 0.38, 0);
    const pE = new THREE.Mesh(new THREE.BoxGeometry(24, 0.05, 3.5), pathMat);
    pE.position.set(0, 0.38, 0);
    root.add(pN);
    root.add(pE);

    // Central Tiered Ornamental Fountain
    const fBaseGeo = new THREE.CylinderGeometry(3.8, 4.2, 0.7, 24);
    const fBase = new THREE.Mesh(fBaseGeo, this.stoneBaseMat);
    fBase.position.set(0, 0.65, 0);
    root.add(fBase);

    // Water Pool in fountain base
    const poolGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.2, 24);
    const pool = new THREE.Mesh(poolGeo, this.waterMat);
    pool.position.set(0, 0.95, 0);
    root.add(pool);

    // Tier 2 Fountain Basin
    const fTier2Geo = new THREE.CylinderGeometry(1.8, 2.1, 0.5, 20);
    const fTier2 = new THREE.Mesh(fTier2Geo, this.stoneBaseMat);
    fTier2.position.set(0, 1.4, 0);
    root.add(fTier2);

    const pool2Geo = new THREE.CylinderGeometry(1.6, 1.6, 0.15, 20);
    const pool2 = new THREE.Mesh(pool2Geo, this.waterMat);
    pool2.position.set(0, 1.65, 0);
    root.add(pool2);

    // Central Spout / Sculpture
    const spoutGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.2, 8);
    const spout = new THREE.Mesh(spoutGeo, this.metalChromeMat);
    spout.position.set(0, 2.2, 0);
    root.add(spout);

    // Park Benches around fountain
    [
      { x: -5, z: 0, r: Math.PI / 2 },
      { x: 5,  z: 0, r: -Math.PI / 2 },
      { x: 0,  z: -5, r: 0 },
      { x: 0,  z: 5,  r: Math.PI }
    ].forEach(bp => {
      const benchGeo = new THREE.BoxGeometry(1.8, 0.35, 0.55);
      const bench = new THREE.Mesh(benchGeo, new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 }));
      bench.position.set(bp.x, 0.55, bp.z);
      bench.rotation.y = bp.r;
      root.add(bench);
    });

    // Flowerbeds in four quadrants (Vibrant low-poly flower boxes)
    [
      { x: -6, z: -6 }, { x: 6, z: -6 },
      { x: -6, z: 6 },  { x: 6, z: 6 }
    ].forEach(fp => {
      const bedGeo = new THREE.BoxGeometry(4, 0.25, 4);
      const bed = new THREE.Mesh(bedGeo, new THREE.MeshStandardMaterial({ color: 0x3f2e1e, roughness: 0.9 }));
      bed.position.set(fp.x, 0.45, fp.z);
      root.add(bed);

      // Colorful flowers (clusters of small spheres)
      const colors = [0xef4444, 0xf59e0b, 0xa855f7, 0xec4899];
      for (let i = 0; i < 6; i++) {
        const flowerGeo = new THREE.SphereGeometry(0.22, 6, 6);
        const flowerMat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length] });
        const flower = new THREE.Mesh(flowerGeo, flowerMat);
        flower.position.set(fp.x + (i % 3 - 1) * 0.9, 0.65, fp.z + (Math.floor(i / 3) - 0.5) * 1.2);
        root.add(flower);
      }
    });

    // Park Trees
    this.addLandscaping(root, [-9, -9, 9, 9], [-7, 7, -7, 7], 1.3);

    // Floating 3D Label on Entrance Monument
    this.createFloatingLabel(root, fac, 9.5);

    this.tagMeshInteractive(root, fac);
    group.add(root);
  }

  // =========================================================================
  // 7. GOVERNMENT OFFICE (FAC-GOV)
  // =========================================================================
  buildGovernmentOffice(group, fac) {
    const root = new THREE.Group();

    // Raised Marble / Concrete Plaza Base (24 x 20)
    const baseGeo = new THREE.BoxGeometry(24, 0.35, 20);
    const baseMesh = new THREE.Mesh(baseGeo, this.concreteMat);
    baseMesh.position.set(0, 0.175, 0);
    root.add(baseMesh);

    // Grand Entrance Stairs (Stepped podium leading up to colonnade)
    for (let s = 0; s < 3; s++) {
      const stairGeo = new THREE.BoxGeometry(16 - s * 1.2, 0.25, 4 + s * 0.6);
      const stair = new THREE.Mesh(stairGeo, this.stoneBaseMat);
      stair.position.set(0, 0.45 + s * 0.25, 2.5 - s * 0.3);
      root.add(stair);
    }

    // Main Civic Hall Structure (Width 18, Height 14, Depth 11)
    const hallGeo = new THREE.BoxGeometry(18, 14, 11);
    const hallMesh = new THREE.Mesh(hallGeo, this.concreteMat);
    hallMesh.position.set(0, 7.8, -4);
    root.add(hallMesh);

    // Neoclassical Colonnade / Stately Pillars (6 front pillars)
    const pillarMat = this.concreteMat;
    [-6.5, -3.9, -1.3, 1.3, 3.9, 6.5].forEach(px => {
      const pGeo = new THREE.CylinderGeometry(0.35, 0.45, 9.5, 12);
      const pillar = new THREE.Mesh(pGeo, pillarMat);
      pillar.position.set(px, 5.75, 1.2);
      root.add(pillar);
    });

    // Grand Classical Entablature / Portico Pediment (Triangular roof pediment)
    const entGeo = new THREE.BoxGeometry(17, 1.2, 3);
    const entablature = new THREE.Mesh(entGeo, this.concreteMat);
    entablature.position.set(0, 11, 1.2);
    root.add(entablature);

    // Triangular Pediment
    const pedimentGeo = new THREE.CylinderGeometry(0.01, 8.5, 2.8, 3);
    const pediment = new THREE.Mesh(pedimentGeo, this.concreteMat);
    pediment.rotation.z = Math.PI / 2;
    pediment.rotation.y = Math.PI / 2;
    pediment.position.set(0, 12.8, 1.2);
    root.add(pediment);

    // Recessed Grand Entrance Doors (Polished glass with brass trim)
    const doorGeo = new THREE.BoxGeometry(4.5, 4.2, 0.4);
    const door = new THREE.Mesh(doorGeo, this.glassDarkMat);
    door.position.set(0, 3.2, 1.4);
    root.add(door);

    // Upper floor ribbon windows
    const winGeo = new THREE.BoxGeometry(18.1, 1.2, 8.5);
    const winMesh = new THREE.Mesh(winGeo, this.windowGlowCoolMat);
    winMesh.position.set(0, 10.5, -4);
    root.add(winMesh);

    // Twin Ceremonial Flagpoles with low-poly flutter flags
    [-6, 6].forEach((fx, idx) => {
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 12, 8);
      const pole = new THREE.Mesh(poleGeo, this.metalChromeMat);
      pole.position.set(fx, 6.2, 6.5);
      root.add(pole);

      // Low-poly flag
      const flagGeo = new THREE.PlaneGeometry(1.6, 1.0);
      const flagMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0x2563eb : 0xef4444,
        side: THREE.DoubleSide
      });
      const flag = new THREE.Mesh(flagGeo, flagMat);
      flag.position.set(fx + 0.85, 11.5, 6.5);
      root.add(flag);
    });

    // Symmetrical Civic Planters
    this.addLandscaping(root, [-9, 9], [6, 6]);

    // Floating 3D Label
    this.createFloatingLabel(root, fac, 18.5);

    this.tagMeshInteractive(root, fac);
    group.add(root);
  }

  // =========================================================================
  // 8. SHOPPING CENTER (FAC-MALL)
  // =========================================================================
  buildShoppingCenter(group, fac) {
    const root = new THREE.Group();

    // Base Pad (26 x 20)
    const baseGeo = new THREE.BoxGeometry(26, 0.2, 20);
    const baseMesh = new THREE.Mesh(baseGeo, this.sidewalkMat);
    baseMesh.position.set(0, 0.1, 0);
    root.add(baseMesh);

    // Main 2-Tier Commercial Galleria Body (Width 22, Height 12, Depth 12)
    const mallGeo = new THREE.BoxGeometry(22, 12, 12);
    const mallMesh = new THREE.Mesh(mallGeo, this.darkSlateMat);
    mallMesh.position.set(0, 6, -3);
    root.add(mallMesh);

    // Expansive Curved Glass Curtain Wall Atrium
    const glassAtriumGeo = new THREE.CylinderGeometry(6, 6, 10, 24, 1, false, 0, Math.PI);
    const glassAtrium = new THREE.Mesh(glassAtriumGeo, this.glassBlueMat);
    glassAtrium.position.set(0, 5.5, 2.9);
    root.add(glassAtrium);

    // Ground-Level Boutique Storefronts with colorful awnings
    const storefrontColors = [0xec4899, 0x8b5cf6, 0x06b6d4, 0xf59e0b];
    [-7.5, -2.5, 2.5, 7.5].forEach((sx, idx) => {
      // Storefront Glass Display
      const shopWinGeo = new THREE.BoxGeometry(3.8, 3.2, 0.3);
      const shopWin = new THREE.Mesh(shopWinGeo, this.windowGlowWarmMat);
      shopWin.position.set(sx, 1.8, 3.1);
      root.add(shopWin);

      // Striped / colorful awning canopy
      const awningGeo = new THREE.BoxGeometry(4.0, 0.25, 1.8);
      const awningMat = new THREE.MeshStandardMaterial({
        color: storefrontColors[idx % storefrontColors.length],
        roughness: 0.4
      });
      const awning = new THREE.Mesh(awningGeo, awningMat);
      awning.rotation.x = 0.2;
      awning.position.set(sx, 3.4, 3.8);
      root.add(awning);
    });

    // Rooftop Dome Skylights
    [-5, 0, 5].forEach(dx => {
      const domeGeo = new THREE.SphereGeometry(2.0, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const dome = new THREE.Mesh(domeGeo, this.glassBlueMat);
      dome.position.set(dx, 12.0, -3);
      root.add(dome);
    });

    // Promenade Plaza with Outdoor Cafe Tables & Umbrellas
    [-7, 7].forEach(tx => {
      const tableGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.6, 12);
      const table = new THREE.Mesh(tableGeo, this.metalChromeMat);
      table.position.set(tx, 0.4, 6.5);
      root.add(table);

      // Umbrella
      const uPoleGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6);
      const uPole = new THREE.Mesh(uPoleGeo, this.metalChromeMat);
      uPole.position.set(tx, 1.1, 6.5);
      root.add(uPole);

      const uTopGeo = new THREE.ConeGeometry(1.3, 0.6, 8);
      const uTopMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.5 });
      const uTop = new THREE.Mesh(uTopGeo, uTopMat);
      uTop.position.set(tx, 2.2, 6.5);
      root.add(uTop);
    });

    // Landscaping
    this.addLandscaping(root, [-11, 11], [6, 6]);

    // Floating 3D Label
    this.createFloatingLabel(root, fac, 16.5);

    this.tagMeshInteractive(root, fac);
    group.add(root);
  }

  // =========================================================================
  // 9. POWER STATION (FAC-POWER)
  // =========================================================================
  buildPowerStation(group, fac) {
    const root = new THREE.Group();

    // Industrial Gravel Compound Floor (24 x 20)
    const baseGeo = new THREE.BoxGeometry(24, 0.2, 20);
    const baseMesh = new THREE.Mesh(baseGeo, this.industrialRustMat);
    baseMesh.position.set(0, 0.1, 0);
    root.add(baseMesh);

    // Perimeter Security Chain-Link Fence
    this.createSecurityFence(root, 23.4, 19.4);

    // Heavy Step-Up Transformers (2 Units with radiator cooling fins)
    [-5, 3].forEach(tx => {
      const transGroup = new THREE.Group();

      // Main Tank
      const tankGeo = new THREE.BoxGeometry(4.5, 4.2, 4.0);
      const tank = new THREE.Mesh(tankGeo, this.industrialRustMat);
      tank.position.set(0, 2.1, 0);
      transGroup.add(tank);

      // Cooling radiator fins on both sides
      [-2.35, 2.35].forEach(fx => {
        for (let i = 0; i < 4; i++) {
          const finGeo = new THREE.BoxGeometry(0.12, 3.4, 3.2);
          const fin = new THREE.Mesh(finGeo, this.darkSlateMat);
          fin.position.set(fx, 2.0, (i - 1.5) * 0.8);
          transGroup.add(fin);
        }
      });

      // Ceramic Insulator Bushings (3 per transformer)
      [-1.2, 0, 1.2].forEach(bx => {
        const bushGeo = new THREE.CylinderGeometry(0.18, 0.3, 1.5, 8);
        const bushMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.3 });
        const bush = new THREE.Mesh(bushGeo, bushMat);
        bush.position.set(bx, 4.8, 0);
        transGroup.add(bush);
      });

      // Hazard Warning Symbol
      const warnGeo = new THREE.BoxGeometry(1.2, 1.2, 0.1);
      const warnMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const warn = new THREE.Mesh(warnGeo, warnMat);
      warn.position.set(0, 2.5, 2.1);
      transGroup.add(warn);

      transGroup.position.set(tx, 0.1, -4);
      root.add(transGroup);
    });

    // High-Voltage Electrical Transmission Lattice Pylon Tower (Height 20)
    const pylon = this.createTransmissionPylon();
    pylon.position.set(7, 0.1, 3);
    root.add(pylon);

    // Control Building / Generator Room (Width 8, Height 5, Depth 7)
    const controlGeo = new THREE.BoxGeometry(8, 5, 7);
    const controlMesh = new THREE.Mesh(controlGeo, this.concreteMat);
    controlMesh.position.set(-7, 2.5, 4.5);
    root.add(controlMesh);

    // Industrial Steel Door & Warning Strip
    const doorGeo = new THREE.BoxGeometry(2.2, 3.2, 0.2);
    const door = new THREE.Mesh(doorGeo, this.darkSlateMat);
    door.position.set(-7, 1.6, 8.05);
    root.add(door);

    const hazardStripeGeo = new THREE.PlaneGeometry(8, 0.4);
    const hazardStripe = new THREE.Mesh(hazardStripeGeo, this.hazardYellowMat);
    hazardStripe.position.set(-7, 4.5, 8.06);
    root.add(hazardStripe);

    // Glowing energy core element (Subtle cyan pulse)
    const coreGeo = new THREE.SphereGeometry(0.6, 8, 8);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(-1, 5.5, -4);
    root.add(core);
    this.animatedObjects.push({ mesh: core, type: 'beacon', speed: 2 });

    // Floating 3D Label
    this.createFloatingLabel(root, fac, 21.5);

    this.tagMeshInteractive(root, fac);
    group.add(root);
  }

  // =========================================================================
  // 10. WATER TREATMENT PLANT (FAC-WATER)
  // =========================================================================
  buildWaterTreatmentPlant(group, fac) {
    const root = new THREE.Group();

    // Industrial Gravel/Concrete Base (24 x 20)
    const baseGeo = new THREE.BoxGeometry(24, 0.2, 20);
    const baseMesh = new THREE.Mesh(baseGeo, this.industrialRustMat);
    baseMesh.position.set(0, 0.1, 0);
    root.add(baseMesh);

    // Perimeter Fence
    this.createSecurityFence(root, 23.4, 19.4);

    // Twin Circular Clarifier / Aeration Basins (Radius 4.8, Height 2.2)
    [-5.5, 5.5].forEach(cx => {
      const tankGroup = new THREE.Group();

      // Outer Concrete Basin Wall
      const wallGeo = new THREE.CylinderGeometry(4.8, 4.8, 2.2, 28, 1, true);
      const wallMat = this.concreteMat;
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.y = 1.1;
      tankGroup.add(wall);

      // Tank Concrete Rim
      const rimGeo = new THREE.RingGeometry(4.4, 4.8, 28);
      const rim = new THREE.Mesh(rimGeo, this.stoneBaseMat);
      rim.rotation.x = -Math.PI / 2;
      rim.position.y = 2.21;
      tankGroup.add(rim);

      // Treated / Aerated Water Surface
      const waterGeo = new THREE.CylinderGeometry(4.4, 4.4, 0.2, 28);
      const water = new THREE.Mesh(waterGeo, this.waterMat);
      water.position.y = 1.95;
      tankGroup.add(water);

      // Center Pivot Column
      const pivotGeo = new THREE.CylinderGeometry(0.5, 0.6, 2.8, 12);
      const pivot = new THREE.Mesh(pivotGeo, this.metalChromeMat);
      pivot.position.y = 1.4;
      tankGroup.add(pivot);

      // Rotating Mechanical Scraper Bridge
      const bridgeGroup = new THREE.Group();
      const bridgeGeo = new THREE.BoxGeometry(8.4, 0.3, 0.6);
      const bridge = new THREE.Mesh(bridgeGeo, this.hazardYellowMat);
      bridge.position.y = 2.45;
      bridgeGroup.add(bridge);

      // Scraper blades dipping into water
      const bladeGeo = new THREE.BoxGeometry(3.6, 0.6, 0.15);
      const blade1 = new THREE.Mesh(bladeGeo, this.industrialRustMat);
      blade1.position.set(2, 2.0, 0);
      const blade2 = blade1.clone();
      blade2.position.set(-2, 2.0, 0);
      bridgeGroup.add(blade1);
      bridgeGroup.add(blade2);

      tankGroup.add(bridgeGroup);
      this.animatedObjects.push({ mesh: bridgeGroup, type: 'rotateY', speed: 0.35 });

      tankGroup.position.set(cx, 0.1, -3.5);
      root.add(tankGroup);
    });

    // Filtration & High-Pressure Pumping House (Width 16, Height 6.5, Depth 6)
    const pumpHouseGeo = new THREE.BoxGeometry(16, 6.5, 6);
    const pumpHouse = new THREE.Mesh(pumpHouseGeo, this.concreteMat);
    pumpHouse.position.set(0, 3.25, 5.5);
    root.add(pumpHouse);

    // Overhead Industrial Piping Manifold (Blue & Silver Conduits connecting clarifiers to pumphouse)
    [-5.5, 5.5].forEach(px => {
      // Vertical pipe out of basin
      const p1Geo = new THREE.CylinderGeometry(0.25, 0.25, 3.2, 8);
      const p1 = new THREE.Mesh(p1Geo, this.policeBlueMat);
      p1.position.set(px, 1.7, 1.2);
      root.add(p1);

      // Horizontal conduit run to pump house
      const p2Geo = new THREE.CylinderGeometry(0.25, 0.25, 4.2, 8);
      const p2 = new THREE.Mesh(p2Geo, this.metalChromeMat);
      p2.rotation.x = Math.PI / 2;
      p2.position.set(px, 3.2, 3.2);
      root.add(p2);
    });

    // Rooftop Air Scrubber / Chemical Tanks
    [-4, 4].forEach(sx => {
      const scrubGeo = new THREE.CylinderGeometry(1.1, 1.1, 2.2, 16);
      const scrub = new THREE.Mesh(scrubGeo, this.metalChromeMat);
      scrub.position.set(sx, 7.6, 5.5);
      root.add(scrub);
    });

    // Floating 3D Label
    this.createFloatingLabel(root, fac, 11.5);

    this.tagMeshInteractive(root, fac);
    group.add(root);
  }

  // =========================================================================
  // HELPER SUB-ASSEMBLIES & 3D LABELS
  // =========================================================================

  /**
   * Creates an architectural 3D floating billboard label above each facility.
   * Uses high-resolution HTML Canvas rendering with glassmorphic pill background,
   * accent border, facility icon, and crisp readable typography.
   */
  createFloatingLabel(group, fac, heightOffset) {
    let labelMat;

    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 140;
      const ctx = canvas.getContext('2d');

      // Transparent clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background Pill Box (Dark Glassmorphic Cyber Style)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(10, 10, 492, 120, 24);
        ctx.fill();
        ctx.strokeStyle = fac.accentColor || '#06b6d4';
        ctx.lineWidth = 6;
        ctx.stroke();
      } else {
        ctx.fillRect(10, 10, 492, 120);
        ctx.strokeStyle = fac.accentColor || '#06b6d4';
        ctx.lineWidth = 6;
        ctx.strokeRect(10, 10, 492, 120);
      }

      // Icon
      ctx.font = '52px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(fac.icon || '🏢', 65, 70);

      // Facility Name (Uppercase, bold, high-contrast)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Outfit, Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(fac.name, 120, 52);

      // Subtitle: Zone Badge & Status
      ctx.fillStyle = fac.accentColor || '#38bdf8';
      ctx.font = '600 22px Inter, system-ui, sans-serif';
      ctx.fillText(`ZONE: ${fac.zone}  •  ${fac.status}`, 120, 95);

      // Create Three.js Texture & Material
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      this.dynamicResources.push(texture);

      labelMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      });
      this.dynamicResources.push(labelMat);
    } else {
      labelMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        side: THREE.DoubleSide
      });
    }

    // Proportioned 3D Billboard Plane
    const labelGeo = new THREE.PlaneGeometry(6.2, 1.7);
    const labelMesh = new THREE.Mesh(labelGeo, labelMat);
    labelMesh.position.set(0, heightOffset, 0);
    labelMesh.name = `Label_${fac.facilityId}`;

    // Tag for raycasting & billboarding
    labelMesh.userData = {
      isFacility: true,
      facilityData: fac
    };
    this.interactiveMeshes.push(labelMesh);
    this.floatingLabels.push(labelMesh);

    group.add(labelMesh);
    return labelMesh;
  }

  /**
   * Helper: Transmission Pylon for Power Station
   */
  createTransmissionPylon() {
    const pylon = new THREE.Group();
    const pMat = this.metalChromeMat;

    // 4 Splayed Legs
    const legGeo = new THREE.CylinderGeometry(0.12, 0.18, 14, 6);
    [-1.2, 1.2].forEach(lx => {
      [-1.2, 1.2].forEach(lz => {
        const leg = new THREE.Mesh(legGeo, pMat);
        leg.position.set(lx * 0.7, 7, lz * 0.7);
        leg.rotation.z = -lx * 0.08;
        leg.rotation.x = lz * 0.08;
        pylon.add(leg);
      });
    });

    // Upper Mast & Cross Arms
    const mastGeo = new THREE.CylinderGeometry(0.2, 0.35, 8, 8);
    const mast = new THREE.Mesh(mastGeo, pMat);
    mast.position.set(0, 17, 0);
    pylon.add(mast);

    const crossArm1 = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.3, 0.3), pMat);
    crossArm1.position.set(0, 16, 0);
    pylon.add(crossArm1);

    const crossArm2 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.3, 0.3), pMat);
    crossArm2.position.set(0, 18.5, 0);
    pylon.add(crossArm2);

    // Hanging Insulators
    [-2.6, 2.6, -1.8, 1.8].forEach(ix => {
      const insGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.2, 6);
      const ins = new THREE.Mesh(insGeo, new THREE.MeshStandardMaterial({ color: 0x93c5fd }));
      ins.position.set(ix, 15.2, 0);
      pylon.add(ins);
    });

    return pylon;
  }

  /**
   * Helper: Industrial security fence perimeter
   */
  createSecurityFence(group, w, d) {
    const fenceMat = this.metalChromeMat;
    const postMat = this.darkSlateMat;
    const fenceH = 1.4;

    const posts = [
      { x: -w / 2, z: -d / 2 }, { x: w / 2, z: -d / 2 },
      { x: -w / 2, z: d / 2 },  { x: w / 2, z: d / 2 },
      { x: 0, z: -d / 2 },      { x: 0, z: d / 2 },
      { x: -w / 2, z: 0 },      { x: w / 2, z: 0 }
    ];

    posts.forEach(pt => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, fenceH + 0.2, 6), postMat);
      post.position.set(pt.x, fenceH / 2 + 0.1, pt.z);
      group.add(post);
    });

    // Horizontal top & bottom safety rails
    const railMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
    const rN = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, 0.08), railMat);
    rN.position.set(0, fenceH + 0.1, -d / 2);
    const rS = rN.clone();
    rS.position.set(0, fenceH + 0.1, d / 2);
    const rW = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, d), railMat);
    rW.position.set(-w / 2, fenceH + 0.1, 0);
    const rE = rW.clone();
    rE.position.set(w / 2, fenceH + 0.1, 0);

    group.add(rN);
    group.add(rS);
    group.add(rW);
    group.add(rE);
  }

  /**
   * Helper: Low-poly police patrol cruiser
   */
  createMiniPoliceCruiser() {
    const cruiser = new THREE.Group();

    // Chassis (White & navy blue)
    const bodyGeo = new THREE.BoxGeometry(2.0, 0.85, 4.4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.55;
    cruiser.add(body);

    // Navy Blue door panels
    const doorGeo = new THREE.BoxGeometry(2.05, 0.5, 2.2);
    const doorMat = this.policeBlueMat;
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 0.55, 0);
    cruiser.add(door);

    // Cabin glass
    const cabinGeo = new THREE.BoxGeometry(1.7, 0.65, 2.0);
    const cabin = new THREE.Mesh(cabinGeo, this.glassDarkMat);
    cabin.position.set(0, 1.15, -0.2);
    cruiser.add(cabin);

    // Emergency Lightbar (Red / Blue)
    const barGeo = new THREE.BoxGeometry(1.2, 0.18, 0.3);
    const barMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(0, 1.55, -0.2);
    cruiser.add(bar);

    // 4 Wheels
    [-1.0, 1.0].forEach(wx => {
      [-1.3, 1.3].forEach(wz => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12), this.darkSlateMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.35, wz);
        cruiser.add(wheel);
      });
    });

    return cruiser;
  }

  /**
   * Helper: Low-poly commuter bus
   */
  createMiniBus() {
    const bus = new THREE.Group();

    // Bus Body (Cyan & white transit livery)
    const bodyGeo = new THREE.BoxGeometry(2.4, 2.2, 7.2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.35;
    bus.add(body);

    // White upper roof cap
    const capGeo = new THREE.BoxGeometry(2.42, 0.4, 7.22);
    const cap = new THREE.Mesh(capGeo, this.concreteMat);
    cap.position.set(0, 2.45, 0);
    bus.add(cap);

    // Side panoramic passenger windows
    const winGeo = new THREE.BoxGeometry(2.45, 0.9, 6.2);
    const win = new THREE.Mesh(winGeo, this.glassDarkMat);
    win.position.set(0, 1.5, 0);
    bus.add(win);

    // Front windshield
    const frontGeo = new THREE.BoxGeometry(2.2, 1.1, 0.2);
    const frontWin = new THREE.Mesh(frontGeo, this.glassBlueMat);
    frontWin.position.set(0, 1.5, 3.61);
    bus.add(frontWin);

    // Wheels
    [-1.2, 1.2].forEach(wx => {
      [-2.2, 2.2].forEach(wz => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12), this.darkSlateMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.42, wz);
        bus.add(wheel);
      });
    });

    return bus;
  }

  /**
   * Helper: Procedural low-poly cypress/shade trees
   */
  addLandscaping(group, xArr, zArr, scale = 1.0) {
    const count = Math.min(xArr.length, zArr.length);
    for (let i = 0; i < count; i++) {
      const tree = new THREE.Group();

      const trunkH = 1.8 * scale;
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15 * scale, 0.22 * scale, trunkH, 6),
        this.treeTrunkMat
      );
      trunk.position.y = trunkH / 2;
      tree.add(trunk);

      const leafMat = this.treeLeafMats[i % this.treeLeafMats.length];
      for (let l = 0; l < 3; l++) {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry((1.3 - l * 0.28) * scale, (1.6 - l * 0.15) * scale, 7),
          leafMat
        );
        cone.position.y = (trunkH * 0.7) + (l * 0.75 * scale) + (0.8 * scale);
        tree.add(cone);
      }

      tree.position.set(xArr[i], 0.1, zArr[i]);
      group.add(tree);
    }
  }

  // =========================================================================
  // PUBLIC ACCESSORS & ANIMATION LOOP
  // =========================================================================

  getInteractiveMeshes() {
    return this.interactiveMeshes;
  }

  getFacilityData(facilityId) {
    const fac = this.facilitiesMap.get(facilityId);
    return fac ? fac.data : null;
  }

  getAllFacilities() {
    return this.facilityDefinitions;
  }

  /**
   * Per-frame animation, dynamic Day/Night lighting adaptation & camera-facing billboarding
   */
  update(delta, isNight = false, camera = null) {
    this.animationTime += delta;

    // 1. Day / Night Emissive Lighting Transitions
    if (this.lastNightState !== isNight) {
      this.lastNightState = isNight;
      const glowBoost = isNight ? 0.95 : 0.35;

      if (this.windowGlowCoolMat) {
        this.windowGlowCoolMat.emissiveIntensity = glowBoost;
      }
      if (this.windowGlowWarmMat) {
        this.windowGlowWarmMat.emissiveIntensity = glowBoost;
      }
    }

    // 2. Camera-facing billboarding for all 10 facility labels
    if (camera && this.floatingLabels.length > 0) {
      for (let i = 0; i < this.floatingLabels.length; i++) {
        this.floatingLabels[i].quaternion.copy(camera.quaternion);
      }
    }

    // 3. Continuous Micro-Animations (Rotators, Strobe Beacons)
    this.animatedObjects.forEach(item => {
      if (item.type === 'rotateY' && item.mesh) {
        item.mesh.rotation.y += delta * item.speed;
      } else if (item.type === 'beacon' && item.mesh) {
        // Soft pulsing intensity
        const s = 0.5 + 0.5 * Math.sin(this.animationTime * item.speed);
        item.mesh.scale.setScalar(0.85 + 0.3 * s);
      }
    });
  }

  dispose() {
    this.dynamicResources.forEach(res => {
      if (res && typeof res.dispose === 'function') {
        res.dispose();
      }
    });
    this.dynamicResources = [];
  }
}
