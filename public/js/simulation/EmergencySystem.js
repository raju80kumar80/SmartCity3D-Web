import * as THREE from 'three';

/**
 * EmergencySystem
 * Manages 3D emergency incidents, procedural responder vehicles (Ambulance, Fire Engine, Police Cruiser),
 * skyward beacon beams, ground shockwave ripples, flashing strobe sirens, and raycast interactions.
 */
export class EmergencySystem {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'SmartEmergencySystem';

    this.interactiveMeshes = [];
    this.incidentsMap = new Map(); // incidentId -> active incident object
    this.dynamicResources = [];
    this.animationTime = 0;

    // Shared Materials Palette
    this.chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.15
    });

    this.wheelMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85
    });

    this.glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.9
    });
  }

  /**
   * Synchronizes 3D incident markers with records from GET /api/incidents
   */
  updateIncidents(incidents) {
    if (!Array.isArray(incidents)) return;

    // Track which incident IDs are in this payload
    const incomingIds = new Set(incidents.map(i => i.incidentId));

    // Remove any incidents that are no longer in the payload
    for (const [id, incObj] of this.incidentsMap.entries()) {
      if (!incomingIds.has(id)) {
        this.group.remove(incObj.group);
        this.incidentsMap.delete(id);
      }
    }

    // Build or update each incident
    incidents.forEach(incident => {
      const isResolved = incident.status === 'RESOLVED';

      let existing = this.incidentsMap.get(incident.incidentId);
      if (existing) {
        // Update data reference
        existing.data = incident;
        this.updateIncidentVisuals(existing, incident);
      } else {
        // Build new 3D incident representation
        const newObj = this.createIncidentGroup(incident);
        this.group.add(newObj.group);
        this.incidentsMap.set(incident.incidentId, newObj);
      }
    });

    this.rebuildInteractiveMeshes();
  }

  /**
   * Rebuilds the flat list of interactive raycast meshes
   */
  rebuildInteractiveMeshes() {
    this.interactiveMeshes = [];
    this.incidentsMap.forEach(incObj => {
      incObj.group.traverse(child => {
        if (child.isMesh && child.userData && child.userData.isEmergencyIncident) {
          this.interactiveMeshes.push(child);
        }
      });
    });
  }

  /**
   * Creates a complete 3D Emergency Incident Marker
   */
  createIncidentGroup(incident) {
    const group = new THREE.Group();
    group.name = `Incident_${incident.incidentId}`;
    const x = incident.coordinates?.x ?? 0;
    const z = incident.coordinates?.z ?? 0;
    group.position.set(x, 0, z);

    const type = (incident.type || 'AMBULANCE').toUpperCase();
    const severity = (incident.severity || 'HIGH').toUpperCase();
    const isResolved = incident.status === 'RESOLVED';

    // 1. Procedural 3D Emergency Responder Vehicle
    let vehicle = null;
    if (type === 'AMBULANCE') {
      vehicle = this.createAmbulance(incident);
    } else if (type === 'FIRE') {
      vehicle = this.createFireEngine(incident);
    } else if (type === 'POLICE') {
      vehicle = this.createPoliceCruiser(incident);
    } else {
      vehicle = this.createRescueVan(incident);
    }
    group.add(vehicle);

    // 2. Skyward Translucent Beacon Beam (height 18 units)
    const beaconGeo = new THREE.CylinderGeometry(0.5, 1.8, 18, 16, 1, true);
    const beaconColor = this.getTypePrimaryColor(type);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: beaconColor,
      transparent: true,
      opacity: isResolved ? 0.08 : 0.35,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.dynamicResources.push(beaconGeo, beaconMat);

    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 9;
    beacon.userData = { isEmergencyIncident: true, incidentData: incident };
    group.add(beacon);

    // 3. Ground Shockwave Ripple Ring
    const ringGeo = new THREE.RingGeometry(1.5, 2.2, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: isResolved ? 0x10b981 : beaconColor,
      transparent: true,
      opacity: isResolved ? 0.3 : 0.8,
      side: THREE.DoubleSide
    });
    this.dynamicResources.push(ringGeo, ringMat);

    const groundRing = new THREE.Mesh(ringGeo, ringMat);
    groundRing.rotation.x = -Math.PI / 2;
    groundRing.position.y = 0.06;
    groundRing.userData = { isEmergencyIncident: true, incidentData: incident };
    group.add(groundRing);

    // 4. Dynamic Siren Strobe Lights
    const strobeLight1 = new THREE.PointLight(beaconColor, isResolved ? 0 : 2.5, 16);
    strobeLight1.position.set(-0.8, 2.8, 0);
    group.add(strobeLight1);

    const strobeLight2 = new THREE.PointLight(0xffffff, isResolved ? 0 : 2.0, 14);
    strobeLight2.position.set(0.8, 2.8, 0);
    group.add(strobeLight2);

    // 5. Overhead Floating Holographic Tag
    const tagMesh = this.createFloatingTag(incident);
    tagMesh.position.set(0, 5.5, 0);
    group.add(tagMesh);

    return {
      id: incident.incidentId,
      group,
      data: incident,
      vehicle,
      beacon,
      beaconMat,
      groundRing,
      groundRingMat: ringMat,
      strobeLight1,
      strobeLight2,
      tagMesh,
      ringScale: 1.0
    };
  }

  /**
   * Updates visual elements of an existing incident
   */
  updateIncidentVisuals(incObj, incident) {
    const isResolved = incident.status === 'RESOLVED';
    const type = (incident.type || 'AMBULANCE').toUpperCase();
    const beaconColor = this.getTypePrimaryColor(type);

    incObj.beaconMat.opacity = isResolved ? 0.08 : 0.35;
    incObj.groundRingMat.color.setHex(isResolved ? 0x10b981 : beaconColor);
    incObj.groundRingMat.opacity = isResolved ? 0.3 : 0.8;

    incObj.strobeLight1.intensity = isResolved ? 0 : 2.5;
    incObj.strobeLight2.intensity = isResolved ? 0 : 2.0;

    // Refresh tag
    this.drawTagCanvas(incObj.tagMesh.userData.canvas, incident);
    incObj.tagMesh.userData.texture.needsUpdate = true;

    // Refresh child userData
    incObj.group.traverse(child => {
      if (child.userData && child.userData.isEmergencyIncident) {
        child.userData.incidentData = incident;
      }
    });
  }

  /**
   * Procedural 3D Ambulance
   */
  createAmbulance(incident) {
    const carGroup = new THREE.Group();
    carGroup.name = `Ambulance_${incident.incidentId}`;

    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.4 });
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
    const blueStripeMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.4 });

    // Chassis Box
    const bodyGeo = new THREE.BoxGeometry(2.3, 1.4, 4.8);
    const body = new THREE.Mesh(bodyGeo, whiteMat);
    body.position.y = 1.0;
    body.castShadow = true;
    body.userData = { isEmergencyIncident: true, incidentData: incident };
    carGroup.add(body);

    // Red Emergency Stripe along sides
    const stripeGeo = new THREE.BoxGeometry(2.34, 0.25, 4.6);
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = 1.0;
    stripe.userData = { isEmergencyIncident: true, incidentData: incident };
    carGroup.add(stripe);

    // Cab / Windshield Glass
    const cabGeo = new THREE.BoxGeometry(2.1, 0.65, 1.6);
    const cab = new THREE.Mesh(cabGeo, this.glassMat);
    cab.position.set(0, 1.25, 1.3);
    cab.castShadow = true;
    cab.userData = { isEmergencyIncident: true, incidentData: incident };
    carGroup.add(cab);

    // Wheels (4)
    this.addWheels(carGroup, 2.3, 4.8, incident);

    // Roof Lightbar (Dual Red & Blue)
    const barGeo = new THREE.BoxGeometry(1.6, 0.2, 0.4);
    const barMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.5 });
    const lightbar = new THREE.Mesh(barGeo, barMat);
    lightbar.position.set(0, 1.85, 0.8);
    lightbar.userData = { isEmergencyIncident: true, incidentData: incident };
    carGroup.add(lightbar);

    return carGroup;
  }

  /**
   * Procedural 3D Fire Engine Truck
   */
  createFireEngine(incident) {
    const carGroup = new THREE.Group();
    carGroup.name = `FireTruck_${incident.incidentId}`;

    const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35, metalness: 0.5 });
    const darkLockerMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });

    // Main Engine Body (Long heavy truck)
    const bodyGeo = new THREE.BoxGeometry(2.5, 1.6, 6.2);
    const body = new THREE.Mesh(bodyGeo, redMat);
    body.position.y = 1.15;
    body.castShadow = true;
    body.userData = { isEmergencyIncident: true, incidentData: incident };
    carGroup.add(body);

    // Cab Windshield
    const cabGeo = new THREE.BoxGeometry(2.35, 0.7, 1.8);
    const cab = new THREE.Mesh(cabGeo, this.glassMat);
    cab.position.set(0, 1.45, 1.8);
    cab.castShadow = true;
    cab.userData = { isEmergencyIncident: true, incidentData: incident };
    carGroup.add(cab);

    // Roof Ladder Rack
    const ladderGeo = new THREE.BoxGeometry(0.8, 0.15, 4.2);
    const ladder = new THREE.Mesh(ladderGeo, this.chromeMat);
    ladder.position.set(0, 2.05, -0.6);
    ladder.userData = { isEmergencyIncident: true, incidentData: incident };
    carGroup.add(ladder);

    // Dual Axles (6 Wheels)
    const wheelPositions = [
      { x: -1.25, z: 2.0 }, { x: 1.25, z: 2.0 },
      { x: -1.25, z: -1.2 }, { x: 1.25, z: -1.2 },
      { x: -1.25, z: -2.3 }, { x: 1.25, z: -2.3 }
    ];
    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 12);
    wheelPositions.forEach(p => {
      const wheel = new THREE.Mesh(wheelGeo, this.wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(p.x, 0.42, p.z);
      wheel.castShadow = true;
      wheel.userData = { isEmergencyIncident: true, incidentData: incident };
      carGroup.add(wheel);
    });

    // Roof Emergency Red/Amber Beacon
    const beaconGeo = new THREE.BoxGeometry(1.8, 0.22, 0.45);
    const beaconMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.8 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 2.05, 1.8);
    beacon.userData = { isEmergencyIncident: true, incidentData: incident };
    carGroup.add(beacon);

    return carGroup;
  }

  /**
   * Procedural 3D Police Interceptor Cruiser
   */
  createPoliceCruiser(incident) {
    const carGroup = new THREE.Group();
    carGroup.name = `PoliceCruiser_${incident.incidentId}`;

    const blackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.7 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.4 });

    // Chassis (Black)
    const bodyGeo = new THREE.BoxGeometry(2.1, 0.7, 4.4);
    const body = new THREE.Mesh(bodyGeo, blackMat);
    body.position.y = 0.55;
    body.castShadow = true;
    body.userData = { isEmergencyIncident: true, incidentData: incident };
    carGroup.add(body);

    // White Doors Section
    const doorGeo = new THREE.BoxGeometry(2.12, 0.65, 1.9);
    const door = new THREE.Mesh(doorGeo, whiteMat);
    door.position.set(0, 0.58, 0);
    door.userData = { isEmergencyIncident: true, incidentData: incident };
    carGroup.add(door);

    // Tinted Cabin Roof
    const cabinGeo = new THREE.BoxGeometry(1.75, 0.65, 2.2);
    const cabin = new THREE.Mesh(cabinGeo, this.glassMat);
    cabin.position.set(0, 1.15, -0.2);
    cabin.castShadow = true;
    cabin.userData = { isEmergencyIncident: true, incidentData: incident };
    carGroup.add(cabin);

    // Push Bumper Bar (Front)
    const bumperGeo = new THREE.BoxGeometry(1.8, 0.35, 0.2);
    const bumper = new THREE.Mesh(bumperGeo, this.chromeMat);
    bumper.position.set(0, 0.55, 2.25);
    bumper.userData = { isEmergencyIncident: true, incidentData: incident };
    carGroup.add(bumper);

    // Wheels (4)
    this.addWheels(carGroup, 2.1, 4.4, incident);

    // Police Red & Blue Roof Lightbar
    const leftBarGeo = new THREE.BoxGeometry(0.65, 0.15, 0.25);
    const leftBarMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 2.0 });
    const leftBar = new THREE.Mesh(leftBarGeo, leftBarMat);
    leftBar.position.set(-0.4, 1.55, -0.2);
    leftBar.userData = { isEmergencyIncident: true, incidentData: incident };
    carGroup.add(leftBar);

    const rightBarGeo = new THREE.BoxGeometry(0.65, 0.15, 0.25);
    const rightBarMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, emissive: 0x2563eb, emissiveIntensity: 2.0 });
    const rightBar = new THREE.Mesh(rightBarGeo, rightBarMat);
    rightBar.position.set(0.4, 1.55, -0.2);
    rightBar.userData = { isEmergencyIncident: true, incidentData: incident };
    carGroup.add(rightBar);

    return carGroup;
  }

  /**
   * Procedural General Utility Rescue Van
   */
  createRescueVan(incident) {
    const carGroup = new THREE.Group();
    carGroup.name = `RescueVan_${incident.incidentId}`;

    const amberMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4, metalness: 0.5 });
    const bodyGeo = new THREE.BoxGeometry(2.2, 1.2, 4.4);
    const body = new THREE.Mesh(bodyGeo, amberMat);
    body.position.y = 0.9;
    body.castShadow = true;
    body.userData = { isEmergencyIncident: true, incidentData: incident };
    carGroup.add(body);

    const cabGeo = new THREE.BoxGeometry(2.0, 0.6, 1.5);
    const cab = new THREE.Mesh(cabGeo, this.glassMat);
    cab.position.set(0, 1.15, 1.1);
    cab.castShadow = true;
    cab.userData = { isEmergencyIncident: true, incidentData: incident };
    carGroup.add(cab);

    this.addWheels(carGroup, 2.2, 4.4, incident);
    return carGroup;
  }

  addWheels(carGroup, width, length, incident) {
    const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.3, 12);
    const halfW = width / 2;
    const halfL = length / 2 - 0.9;

    const positions = [
      { x: -halfW, z: halfL },
      { x: halfW,  z: halfL },
      { x: -halfW, z: -halfL },
      { x: halfW,  z: -halfL }
    ];

    positions.forEach(p => {
      const wheel = new THREE.Mesh(wheelGeo, this.wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(p.x, 0.36, p.z);
      wheel.castShadow = true;
      wheel.userData = { isEmergencyIncident: true, incidentData: incident };
      carGroup.add(wheel);
    });
  }

  /**
   * Floating Billboard Tag for the incident
   */
  createFloatingTag(incident) {
    const canvas = document.createElement('canvas');
    canvas.width = 280;
    canvas.height = 100;
    this.drawTagCanvas(canvas, incident);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    this.dynamicResources.push(texture);

    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });
    this.dynamicResources.push(mat);

    const geo = new THREE.PlaneGeometry(2.6, 0.95);
    this.dynamicResources.push(geo);

    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { isEmergencyIncident: true, incidentData: incident, canvas, texture };
    return mesh;
  }

  drawTagCanvas(canvas, incident) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isResolved = incident.status === 'RESOLVED';
    const type = (incident.type || 'AMBULANCE').toUpperCase();
    const severity = (incident.severity || 'HIGH').toUpperCase();
    const typeColor = isResolved ? '#10b981' : this.getTypeHexColor(type);

    // Background Card
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(8, 8, 264, 84, 16);
      ctx.fill();
      ctx.strokeStyle = typeColor;
      ctx.lineWidth = 4;
      ctx.stroke();
    } else {
      ctx.fillRect(8, 8, 264, 84);
      ctx.strokeStyle = typeColor;
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, 264, 84);
    }

    // Type Icon & ID
    const icon = this.getTypeIcon(type);
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, 22, 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillText(incident.incidentId, 68, 40);

    // Status / Severity Subtitle
    ctx.font = 'bold 15px Inter, sans-serif';
    if (isResolved) {
      ctx.fillStyle = '#10b981';
      ctx.fillText('RESOLVED', 68, 65);
    } else {
      ctx.fillStyle = severity === 'CRITICAL' ? '#f43f5e' : (severity === 'HIGH' ? '#f59e0b' : '#38bdf8');
      ctx.fillText(`${severity} • ${incident.status}`, 68, 65);
    }
  }

  getTypePrimaryColor(type) {
    if (type === 'FIRE') return 0xdc2626;
    if (type === 'POLICE') return 0x2563eb;
    return 0x06b6d4; // AMBULANCE / MEDICAL
  }

  getTypeHexColor(type) {
    if (type === 'FIRE') return '#dc2626';
    if (type === 'POLICE') return '#2563eb';
    return '#06b6d4';
  }

  getTypeIcon(type) {
    if (type === 'FIRE') return '🚒';
    if (type === 'POLICE') return '🚓';
    return '🚑';
  }

  /**
   * Animation tick for pulsing ground waves, rotating sirens, and billboard orienting
   */
  update(deltaTime = 0.016, camera = null) {
    this.animationTime += deltaTime;

    this.incidentsMap.forEach(incObj => {
      const isResolved = incObj.data.status === 'RESOLVED';
      if (isResolved) return;

      // 1. Expanding and fading ground wave
      incObj.ringScale = 1.0 + ((this.animationTime * 1.6) % 3.0);
      incObj.groundRing.scale.set(incObj.ringScale, incObj.ringScale, 1.0);
      incObj.groundRingMat.opacity = Math.max(0, 0.85 - (incObj.ringScale - 1.0) / 3.0);

      // 2. Alternating flashing sirens
      const flash = Math.sin(this.animationTime * 8) > 0;
      incObj.strobeLight1.intensity = flash ? 3.0 : 0.4;
      incObj.strobeLight2.intensity = flash ? 0.4 : 3.0;

      // 3. Gentle beacon pillar breathing
      incObj.beacon.rotation.y += deltaTime * 0.5;
      incObj.beaconMat.opacity = 0.25 + Math.sin(this.animationTime * 4) * 0.12;

      // 4. Orient floating billboard tag to camera
      if (camera && incObj.tagMesh) {
        incObj.tagMesh.quaternion.copy(camera.quaternion);
      }
    });
  }

  getInteractiveMeshes() {
    return this.interactiveMeshes;
  }
}
