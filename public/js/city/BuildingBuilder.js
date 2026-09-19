import * as THREE from 'three';

/**
 * BuildingBuilder
 * Procedurally generates buildings across Commercial, Residential, and Tech zones.
 */
export class BuildingBuilder {
  constructor() {
    this.buildingGroup = new THREE.Group();
    this.buildingGroup.name = 'CityBuildings';

    // Materials palette
    this.commercialMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.8 }), // Glass slate
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.7 }), // Deep navy
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.25, metalness: 0.6 }), // Steel blue
      new THREE.MeshStandardMaterial({ color: 0x1e1e24, roughness: 0.1, metalness: 0.9 })  // Mirror black
    ];

    this.residentialMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6, metalness: 0.2 }),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5, metalness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.7, metalness: 0.1 }), // Warm stone
      new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.65, metalness: 0.15 })
    ];

    this.windowGlowCommercial = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.6,
      roughness: 0.2
    });

    this.windowGlowResidential = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xeab308,
      emissiveIntensity: 0.45,
      roughness: 0.3
    });

    this.roofAccentMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.8
    });
  }

  build() {
    // 1. Commercial / Financial District (North-East: x > 8, z < -8)
    this.buildCommercialZone();

    // 2. Residential Zone (South-West: x < -8, z > 8)
    this.buildResidentialZone();

    // 3. Tech & Innovation Park (North-West: x < -8, z < -8, outside parking bay)
    this.buildTechZone();

    // 4. Mixed Commercial & Civic (South-East: x > 8, z > 8, outside parking bay)
    this.buildMixedZone();

    return this.buildingGroup;
  }

  /**
   * Commercial High-Rise Skyscraper District
   */
  buildCommercialZone() {
    const configs = [
      { x: 18, z: -18, w: 9, d: 9, h: 48, tiers: 3, spire: true },
      { x: 32, z: -18, w: 8, d: 8, h: 38, tiers: 2, helipad: true },
      { x: 18, z: -32, w: 8, d: 10, h: 56, tiers: 3, spire: true },
      { x: 32, z: -32, w: 10, d: 10, h: 42, tiers: 2, helipad: false },
      { x: 25, z: -44, w: 7, d: 8, h: 32, tiers: 1, helipad: false },
      { x: 42, z: -44, w: 8, d: 8, h: 36, tiers: 2, spire: true },
      // Outer peripheral towers
      { x: 62, z: -20, w: 10, d: 10, h: 52, tiers: 2, spire: false },
      { x: 62, z: -36, w: 9, d: 9, h: 64, tiers: 3, spire: true }
    ];

    configs.forEach((cfg, idx) => {
      this.createSkyscraper(cfg, this.commercialMaterials[idx % this.commercialMaterials.length], true);
    });
  }

  /**
   * Residential Mid-Rise Urban Living District
   */
  buildResidentialZone() {
    const configs = [
      { x: -18, z: 18, w: 8, d: 8, h: 18, balconies: true },
      { x: -30, z: 18, w: 9, d: 7, h: 22, balconies: true },
      { x: -18, z: 32, w: 7, d: 9, h: 16, balconies: true },
      { x: -30, z: 32, w: 8, d: 8, h: 24, balconies: true },
      { x: -20, z: 44, w: 8, d: 6, h: 14, balconies: false },
      { x: -34, z: 44, w: 7, d: 7, h: 20, balconies: true },
      // Outer residential blocks
      { x: -62, z: 18, w: 9, d: 8, h: 18, balconies: true },
      { x: -62, z: 32, w: 8, d: 8, h: 22, balconies: true }
    ];

    configs.forEach((cfg, idx) => {
      this.createResidentialBuilding(cfg, this.residentialMaterials[idx % this.residentialMaterials.length]);
    });
  }

  /**
   * Tech Innovation Park (North-West)
   */
  buildTechZone() {
    const configs = [
      { x: -38, z: -16, w: 10, d: 9, h: 30, tiers: 2 },
      { x: -38, z: -34, w: 9, d: 10, h: 36, tiers: 2, spire: true },
      { x: -20, z: -38, w: 8, d: 7, h: 26, tiers: 1 },
      { x: -62, z: -20, w: 10, d: 10, h: 28, tiers: 1 },
      { x: -62, z: -36, w: 9, d: 8, h: 34, tiers: 2 }
    ];

    configs.forEach((cfg, idx) => {
      this.createSkyscraper(cfg, this.commercialMaterials[(idx + 1) % this.commercialMaterials.length], false);
    });
  }

  /**
   * Mixed Commercial & Office Zone (South-East)
   */
  buildMixedZone() {
    const configs = [
      { x: 36, z: 18, w: 9, d: 8, h: 28, tiers: 1 },
      { x: 36, z: 34, w: 8, d: 9, h: 32, tiers: 2, spire: true },
      { x: 18, z: 40, w: 8, d: 7, h: 24, tiers: 1 },
      { x: 62, z: 22, w: 9, d: 9, h: 38, tiers: 2 }
    ];

    configs.forEach((cfg, idx) => {
      this.createSkyscraper(cfg, this.commercialMaterials[idx % this.commercialMaterials.length], true);
    });
  }

  /**
   * Creates a multi-tier commercial skyscraper
   */
  createSkyscraper(cfg, material, isCommercial) {
    const group = new THREE.Group();
    group.name = `Building_Commercial_${cfg.x}_${cfg.z}`;

    const tiers = cfg.tiers || 1;
    let currentY = 0;
    let currentW = cfg.w;
    let currentD = cfg.d;
    const tierHeight = cfg.h / tiers;

    for (let t = 0; t < tiers; t++) {
      const geo = new THREE.BoxGeometry(currentW, tierHeight, currentD);
      const mesh = new THREE.Mesh(geo, material);
      mesh.position.set(0, currentY + tierHeight / 2, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);

      // Add horizontal glowing window ribbon
      const ribbonGeo = new THREE.BoxGeometry(currentW + 0.05, 0.4, currentD + 0.05);
      const ribbon = new THREE.Mesh(ribbonGeo, isCommercial ? this.windowGlowCommercial : this.windowGlowResidential);
      ribbon.position.set(0, currentY + tierHeight * 0.7, 0);
      group.add(ribbon);

      currentY += tierHeight;
      currentW *= 0.82;
      currentD *= 0.82;
    }

    // Rooftop features
    if (cfg.spire) {
      const spireGeo = new THREE.CylinderGeometry(0.1, 0.5, 8, 8);
      const spire = new THREE.Mesh(spireGeo, this.roofAccentMat);
      spire.position.set(0, currentY + 4, 0);
      spire.castShadow = true;
      group.add(spire);

      // Red beacon light at tip
      const beaconGeo = new THREE.SphereGeometry(0.3, 8, 8);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(0, currentY + 8.2, 0);
      group.add(beacon);
    } else if (cfg.helipad) {
      const padGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.3, 16);
      const padMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(0, currentY + 0.15, 0);
      group.add(pad);

      // 'H' marking
      const hRingGeo = new THREE.TorusGeometry(2, 0.15, 8, 24);
      const hRing = new THREE.Mesh(hRingGeo, this.yellowMarkingMat);
      hRing.rotation.x = Math.PI / 2;
      hRing.position.set(0, currentY + 0.32, 0);
      group.add(hRing);
    } else {
      // HVAC Box
      const hvacGeo = new THREE.BoxGeometry(currentW * 0.5, 1.5, currentD * 0.5);
      const hvacMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
      const hvac = new THREE.Mesh(hvacGeo, hvacMat);
      hvac.position.set(0, currentY + 0.75, 0);
      hvac.castShadow = true;
      group.add(hvac);
    }

    group.position.set(cfg.x, 0, cfg.z);
    this.buildingGroup.add(group);
  }

  /**
   * Creates a residential apartment building
   */
  createResidentialBuilding(cfg, material) {
    const group = new THREE.Group();
    group.name = `Building_Residential_${cfg.x}_${cfg.z}`;

    // Main Body
    const geo = new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(0, cfg.h / 2, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Warm residential window strips
    const floors = Math.floor(cfg.h / 4);
    for (let f = 1; f <= floors; f++) {
      const winGeo = new THREE.BoxGeometry(cfg.w + 0.08, 0.6, cfg.d * 0.75);
      const winMesh = new THREE.Mesh(winGeo, this.windowGlowResidential);
      winMesh.position.set(0, f * 3.8, 0);
      group.add(winMesh);
    }

    // Roof parapet
    const parapetGeo = new THREE.BoxGeometry(cfg.w + 0.2, 0.5, cfg.d + 0.2);
    const parapetMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
    const parapet = new THREE.Mesh(parapetGeo, parapetMat);
    parapet.position.set(0, cfg.h + 0.25, 0);
    group.add(parapet);

    group.position.set(cfg.x, 0, cfg.z);
    this.buildingGroup.add(group);
  }
}
