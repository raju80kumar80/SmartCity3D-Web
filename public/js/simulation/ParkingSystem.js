import * as THREE from 'three';

/**
 * ParkingSystem
 * Renders 3D parking bays, real-time vacant/occupied status indicators,
 * slot labels (P-01 to P-08), and 3D parked vehicles based on MongoDB Atlas records.
 */
export class ParkingSystem {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'SmartParkingSystem';

    this.interactiveMeshes = [];
    this.slotsData = [];
    this.dynamicResources = [];

    // Shared Materials
    this.asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x18202f,
      roughness: 0.85,
      metalness: 0.1
    });

    this.lineMat = new THREE.MeshBasicMaterial({
      color: 0xf8fafc
    });

    this.availableIndicatorMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 1.5,
      roughness: 0.2
    });

    this.occupiedIndicatorMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 1.5,
      roughness: 0.2
    });

    this.poleMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.4,
      metalness: 0.7
    });

    // Car Palette for varied parked vehicles
    this.carColors = [0x2563eb, 0xdc2626, 0x475569, 0x0f172a, 0x059669, 0x7c3aed];
  }

  /**
   * Updates all 3D parking bays with fresh data from MongoDB
   */
  updateSlots(slots) {
    this.slotsData = slots || [];

    // Dispose dynamic textures and materials from previous update
    this.dynamicResources.forEach(res => {
      if (res && typeof res.dispose === 'function') {
        res.dispose();
      }
    });
    this.dynamicResources = [];

    // Clear previous slot meshes
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
    }
    this.interactiveMeshes = [];

    // Build each slot according to MongoDB coordinates
    this.slotsData.forEach((slot, index) => {
      const x = slot.coordinates?.x ?? 0;
      const z = slot.coordinates?.z ?? 0;
      const isOccupied = Boolean(slot.isOccupied);
      const slotCode = slot.slotCode || `P-0${index + 1}`;

      const slotGroup = new THREE.Group();
      slotGroup.name = `Slot_${slotCode}`;
      slotGroup.position.set(x, 0, z);

      // Rotate South Commercial bays so they face inwards toward the road
      if (z > 0) {
        slotGroup.rotation.y = Math.PI;
      }

      // 1. Asphalt Bay Pad (Width 3.8, Length 5.5)
      const padGeo = new THREE.PlaneGeometry(3.8, 5.5);
      const pad = new THREE.Mesh(padGeo, this.asphaltMat);
      pad.rotation.x = -Math.PI / 2;
      pad.position.y = 0.05;
      pad.receiveShadow = true;
      pad.userData = { isParkingSlot: true, slotData: slot };
      slotGroup.add(pad);
      this.interactiveMeshes.push(pad);

      // 2. White Parking Bay Boundary Lines
      this.createBayMarkings(slotGroup, slot);

      // 3. 3D On-Ground Slot Code Label (e.g. P-01, P-02)
      const labelMesh = this.createSlotLabelMesh(slotCode, isOccupied, slot);
      slotGroup.add(labelMesh);
      this.interactiveMeshes.push(labelMesh);

      // 4. Smart IoT Sensor Pole & Glowing Status Orb
      const sensorPoleGeo = new THREE.CylinderGeometry(0.06, 0.08, 1.4, 8);
      const sensorPole = new THREE.Mesh(sensorPoleGeo, this.poleMat);
      sensorPole.position.set(-1.6, 0.7, -2.4);
      sensorPole.castShadow = true;
      sensorPole.userData = { isParkingSlot: true, slotData: slot };
      slotGroup.add(sensorPole);
      this.interactiveMeshes.push(sensorPole);

      const orbMat = isOccupied ? this.occupiedIndicatorMat : this.availableIndicatorMat;
      const orbGeo = new THREE.SphereGeometry(0.22, 16, 16);
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.set(-1.6, 1.45, -2.4);
      orb.userData = { isParkingSlot: true, slotData: slot };
      slotGroup.add(orb);
      this.interactiveMeshes.push(orb);

      // Glowing Base Perimeter Ring
      const borderGlowGeo = new THREE.RingGeometry(1.6, 1.85, 4);
      const borderGlowMat = new THREE.MeshBasicMaterial({
        color: isOccupied ? 0xef4444 : 0x10b981,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
      this.dynamicResources.push(borderGlowMat, borderGlowGeo);

      const borderGlow = new THREE.Mesh(borderGlowGeo, borderGlowMat);
      borderGlow.rotation.x = -Math.PI / 2;
      borderGlow.rotation.z = Math.PI / 4;
      borderGlow.position.y = 0.06;
      borderGlow.userData = { isParkingSlot: true, slotData: slot };
      slotGroup.add(borderGlow);
      this.interactiveMeshes.push(borderGlow);

      // 5. If Occupied, spawn a 3D Parked Vehicle
      if (isOccupied) {
        const car = this.createParkedCar(index, slot);
        slotGroup.add(car);
      }

      this.group.add(slotGroup);
    });
  }

  /**
   * Creates high-contrast on-ground canvas badge for slot code (e.g. "P-01")
   */
  createSlotLabelMesh(slotCode, isOccupied, slot) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Background Badge Box
    ctx.fillStyle = isOccupied ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.9)';
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(16, 16, 224, 96, 20);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.stroke();
    } else {
      ctx.fillRect(16, 16, 224, 96);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.strokeRect(16, 16, 224, 96);
    }

    // Text Marking
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 58px Inter, Outfit, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(slotCode, 128, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const labelMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false
    });

    const labelGeo = new THREE.PlaneGeometry(1.9, 0.95);
    this.dynamicResources.push(texture, labelMat, labelGeo);

    const labelMesh = new THREE.Mesh(labelGeo, labelMat);
    labelMesh.rotation.x = -Math.PI / 2;
    // Placed at the entrance of the bay for clear readability
    labelMesh.position.set(0, 0.07, 2.1);
    labelMesh.userData = { isParkingSlot: true, slotData: slot };

    return labelMesh;
  }

  /**
   * Creates U-shaped white boundary lines for parking bay
   */
  createBayMarkings(slotGroup, slot) {
    const lineWidth = 0.15;
    const bayLength = 5.4;
    const bayWidth = 3.6;

    // Left border line
    const leftGeo = new THREE.PlaneGeometry(lineWidth, bayLength);
    const left = new THREE.Mesh(leftGeo, this.lineMat);
    left.rotation.x = -Math.PI / 2;
    left.position.set(-bayWidth / 2, 0.06, 0);
    left.userData = { isParkingSlot: true, slotData: slot };
    slotGroup.add(left);
    this.interactiveMeshes.push(left);

    // Right border line
    const rightGeo = new THREE.PlaneGeometry(lineWidth, bayLength);
    const right = new THREE.Mesh(rightGeo, this.lineMat);
    right.rotation.x = -Math.PI / 2;
    right.position.set(bayWidth / 2, 0.06, 0);
    right.userData = { isParkingSlot: true, slotData: slot };
    slotGroup.add(right);
    this.interactiveMeshes.push(right);

    // Top border line
    const topGeo = new THREE.PlaneGeometry(bayWidth, lineWidth);
    const top = new THREE.Mesh(topGeo, this.lineMat);
    top.rotation.x = -Math.PI / 2;
    top.position.set(0, 0.06, -bayLength / 2);
    top.userData = { isParkingSlot: true, slotData: slot };
    slotGroup.add(top);
    this.interactiveMeshes.push(top);
  }

  /**
   * Builds a stylized 3D parked car
   */
  createParkedCar(index, slot) {
    const carGroup = new THREE.Group();
    carGroup.name = `Car_${slot.slotCode}`;
    carGroup.position.set(0, 0, 0);

    const carColor = this.carColors[index % this.carColors.length];
    const bodyMat = new THREE.MeshStandardMaterial({
      color: carColor,
      roughness: 0.3,
      metalness: 0.7
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.9
    });

    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8
    });

    this.dynamicResources.push(bodyMat, glassMat, wheelMat);

    // Lower Chassis / Body
    const bodyGeo = new THREE.BoxGeometry(2.1, 0.7, 4.2);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.55;
    body.castShadow = true;
    body.receiveShadow = true;
    body.userData = { isParkingSlot: true, slotData: slot };
    carGroup.add(body);
    this.interactiveMeshes.push(body);

    // Cabin / Roof
    const cabinGeo = new THREE.BoxGeometry(1.8, 0.65, 2.2);
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, 1.15, -0.2);
    cabin.castShadow = true;
    cabin.userData = { isParkingSlot: true, slotData: slot };
    carGroup.add(cabin);
    this.interactiveMeshes.push(cabin);

    // Wheels (4 cylinders)
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 12);
    const wheelPositions = [
      { x: -1.05, z: 1.2 },
      { x: 1.05,  z: 1.2 },
      { x: -1.05, z: -1.2 },
      { x: 1.05,  z: -1.2 }
    ];

    wheelPositions.forEach(w => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(w.x, 0.35, w.z);
      wheel.castShadow = true;
      wheel.userData = { isParkingSlot: true, slotData: slot };
      carGroup.add(wheel);
      this.interactiveMeshes.push(wheel);
    });

    // Headlights (glowing yellow/white)
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const headLightGeo = new THREE.BoxGeometry(0.35, 0.15, 0.1);
    const hlLeft = new THREE.Mesh(headLightGeo, lightMat);
    hlLeft.position.set(-0.7, 0.6, 2.12);
    const hlRight = hlLeft.clone();
    hlRight.position.x = 0.7;
    hlLeft.userData = { isParkingSlot: true, slotData: slot };
    hlRight.userData = { isParkingSlot: true, slotData: slot };
    carGroup.add(hlLeft);
    carGroup.add(hlRight);
    this.interactiveMeshes.push(hlLeft, hlRight);

    // Taillights (red)
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const tailLightGeo = new THREE.BoxGeometry(0.35, 0.15, 0.1);
    const tlLeft = new THREE.Mesh(tailLightGeo, tailMat);
    tlLeft.position.set(-0.7, 0.6, -2.12);
    const tlRight = tlLeft.clone();
    tlRight.position.x = 0.7;
    tlLeft.userData = { isParkingSlot: true, slotData: slot };
    tlRight.userData = { isParkingSlot: true, slotData: slot };
    carGroup.add(tlLeft);
    carGroup.add(tlRight);
    this.interactiveMeshes.push(tlLeft, tlRight);

    return carGroup;
  }

  getInteractiveMeshes() {
    return this.interactiveMeshes;
  }
}
