import * as THREE from 'three';

/**
 * Environment
 * Handles green parks, procedural trees, street lighting poles, and 3D traffic signals.
 */
export class Environment {
  constructor(lightingManager) {
    this.lightingManager = lightingManager;
    this.envGroup = new THREE.Group();
    this.envGroup.name = 'EnvironmentAndUtilities';

    // Shared Materials
    this.grassMat = new THREE.MeshStandardMaterial({
      color: 0x166534, // Lush deep green
      roughness: 0.85
    });

    this.waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Reflective lake blue
      roughness: 0.1,
      metalness: 0.6
    });

    this.trunkMat = new THREE.MeshStandardMaterial({
      color: 0x5a3e2b,
      roughness: 0.9
    });

    this.foliageMats = [
      new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.7 }),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75 }),
      new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.65 })
    ];

    this.metalPoleMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.7,
      roughness: 0.3
    });

    this.lampBulbMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.2
    });
  }

  build() {
    // 1. Central City Park & Lake in South-East (x: 18 to 30, z: 12 to 24)
    this.createCentralPark();

    // 2. Avenue Trees along sidewalks
    this.createTreeNetwork();

    // 3. Street Light Poles along main avenues
    this.createStreetLights();

    return this.envGroup;
  }

  /**
   * Central Civic Green Park with a reflective pond and walking path
   */
  createCentralPark() {
    const parkGroup = new THREE.Group();

    // Park Lawn Ground
    const lawnGeo = new THREE.BoxGeometry(26, 0.28, 20);
    const lawn = new THREE.Mesh(lawnGeo, this.grassMat);
    lawn.position.set(22, 0.14, 18);
    lawn.receiveShadow = true;
    parkGroup.add(lawn);

    // Decorative Lake/Pond
    const pondGeo = new THREE.CylinderGeometry(4.5, 4.5, 0.29, 24);
    const pond = new THREE.Mesh(pondGeo, this.waterMat);
    pond.position.set(22, 0.15, 18);
    pond.receiveShadow = true;
    parkGroup.add(pond);

    // Stone pathway around the lake
    const pathGeo = new THREE.RingGeometry(4.8, 6.2, 24);
    const pathMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.set(22, 0.3, 18);
    path.receiveShadow = true;
    parkGroup.add(path);

    // Park Trees
    const parkTreeCoords = [
      { x: 12, z: 10 }, { x: 16, z: 10 }, { x: 28, z: 10 }, { x: 32, z: 10 },
      { x: 12, z: 26 }, { x: 16, z: 26 }, { x: 28, z: 26 }, { x: 32, z: 26 },
      { x: 11, z: 18 }, { x: 33, z: 18 }
    ];

    parkTreeCoords.forEach(c => {
      parkGroup.add(this.createTree(c.x, c.z, 1.2));
    });

    this.envGroup.add(parkGroup);
  }

  /**
   * Procedural Tree Generator (Low-poly modern style)
   */
  createTree(x, z, scale = 1.0) {
    const tree = new THREE.Group();

    // Trunk
    const trunkHeight = 2.4 * scale;
    const trunkGeo = new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, trunkHeight, 6);
    const trunk = new THREE.Mesh(trunkGeo, this.trunkMat);
    trunk.position.y = trunkHeight / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // Foliage (2 or 3 stacked cones for rich low-poly shape)
    const foliageMat = this.foliageMats[Math.floor(Math.random() * this.foliageMats.length)];
    const layers = 3;
    for (let i = 0; i < layers; i++) {
      const radius = (1.6 - i * 0.35) * scale;
      const height = (1.8 - i * 0.2) * scale;
      const coneGeo = new THREE.ConeGeometry(radius, height, 7);
      const cone = new THREE.Mesh(coneGeo, foliageMat);
      cone.position.y = (trunkHeight * 0.7) + (i * 0.9 * scale) + (height / 2);
      cone.castShadow = true;
      cone.receiveShadow = true;
      tree.add(cone);
    }

    tree.position.set(x, 0, z);
    return tree;
  }

  createTreeNetwork() {
    // Trees planted along main avenue sidewalks
    const treeZ = [-60, -45, -25, -12, 12, 25, 45, 60];
    treeZ.forEach(z => {
      // Along North-South Avenue sidewalks (x = ±8)
      this.envGroup.add(this.createTree(-8, z, 0.9));
      this.envGroup.add(this.createTree(8, z, 0.9));
    });

    const treeX = [-60, -45, -25, -12, 12, 25, 45, 60];
    treeX.forEach(x => {
      // Along East-West Avenue sidewalks (z = ±8)
      this.envGroup.add(this.createTree(x, -8, 0.9));
      this.envGroup.add(this.createTree(x, 8, 0.9));
    });
  }

  /**
   * 3D Street Light Poles with emissive lamps & night point lights
   */
  createStreetLights() {
    const lampPositions = [
      // North-South Avenue
      { x: -7.5, z: -55, rot: 0 },
      { x: 7.5,  z: -40, rot: Math.PI },
      { x: -7.5, z: -20, rot: 0 },
      { x: 7.5,  z: 20,  rot: Math.PI },
      { x: -7.5, z: 40,  rot: 0 },
      { x: 7.5,  z: 55,  rot: Math.PI },
      // East-West Avenue
      { x: -55, z: -7.5, rot: Math.PI / 2 },
      { x: -40, z: 7.5,  rot: -Math.PI / 2 },
      { x: -20, z: -7.5, rot: Math.PI / 2 },
      { x: 20,  z: 7.5,  rot: -Math.PI / 2 },
      { x: 40,  z: -7.5, rot: Math.PI / 2 },
      { x: 55,  z: 7.5,  rot: -Math.PI / 2 }
    ];

    lampPositions.forEach((pos, idx) => {
      const lamp = new THREE.Group();

      // Vertical Pole
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 5.5, 8);
      const pole = new THREE.Mesh(poleGeo, this.metalPoleMat);
      pole.position.y = 2.75;
      pole.castShadow = true;
      lamp.add(pole);

      // Horizontal Overhang Arm
      const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8);
      const arm = new THREE.Mesh(armGeo, this.metalPoleMat);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(0.8, 5.3, 0);
      arm.castShadow = true;
      lamp.add(arm);

      // Lamp Head Bulb (Emissive)
      const bulbGeo = new THREE.BoxGeometry(0.4, 0.15, 0.3);
      const bulb = new THREE.Mesh(bulbGeo, this.lampBulbMat);
      bulb.position.set(1.5, 5.2, 0);
      lamp.add(bulb);

      // PointLight for Night illumination
      if (idx % 2 === 0 && this.lightingManager) {
        const pointLight = new THREE.PointLight(0xf59e0b, 1.5, 12);
        pointLight.position.set(1.5, 5.0, 0);
        pointLight.castShadow = false;
        lamp.add(pointLight);
        this.lightingManager.registerStreetLight(pointLight);
      }

      lamp.position.set(pos.x, 0, pos.z);
      lamp.rotation.y = pos.rot;
      this.envGroup.add(lamp);
    });
  }

  /**
   * 3D Traffic Signals at City Intersections
   */
  createTrafficSignals() {
    const junctions = [
      { id: 'J-NORTH', x: 7.5,  z: -35, rot: Math.PI,     defaultLight: 'GREEN' },
      { id: 'J-SOUTH', x: -7.5, z: 35,  rot: 0,           defaultLight: 'RED' },
      { id: 'J-EAST',  x: 35,   z: 7.5, rot: -Math.PI / 2, defaultLight: 'GREEN' },
      { id: 'J-WEST',  x: -35,  z: -7.5, rot: Math.PI / 2, defaultLight: 'RED' }
    ];

    junctions.forEach(j => {
      const signal = this.createTrafficSignalModel(j.id, j.defaultLight);
      signal.position.set(j.x, 0, j.z);
      signal.rotation.y = j.rot;
      this.envGroup.add(signal);
    });
  }

  createTrafficSignalModel(junctionId, defaultLight) {
    const group = new THREE.Group();
    group.name = `Signal_${junctionId}`;

    // Main Mast Pole
    const mastGeo = new THREE.CylinderGeometry(0.18, 0.22, 6.5, 12);
    const mast = new THREE.Mesh(mastGeo, this.metalPoleMat);
    mast.position.y = 3.25;
    mast.castShadow = true;
    group.add(mast);

    // Cantilever Arm extending toward the road
    const armGeo = new THREE.CylinderGeometry(0.1, 0.1, 3.2, 8);
    const arm = new THREE.Mesh(armGeo, this.metalPoleMat);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(1.6, 6.0, 0);
    arm.castShadow = true;
    group.add(arm);

    // Traffic Signal Box Housing
    const boxGeo = new THREE.BoxGeometry(0.7, 1.8, 0.6);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.set(2.6, 5.8, 0);
    box.castShadow = true;
    group.add(box);

    // Hood visors over lights
    const hoodGeo = new THREE.BoxGeometry(0.45, 0.1, 0.45);

    // 3 Lenses: RED, YELLOW, GREEN
    const redMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: defaultLight === 'RED' ? 1.5 : 0.1
    });
    const yellowMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: defaultLight === 'YELLOW' ? 1.5 : 0.1
    });
    const greenMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: defaultLight === 'GREEN' ? 1.5 : 0.1
    });

    const lensGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.15, 16);

    // Red lens (top)
    const redLens = new THREE.Mesh(lensGeo, redMat);
    redLens.rotation.x = Math.PI / 2;
    redLens.position.set(2.6, 6.35, 0.28);
    redLens.name = `${junctionId}_LENS_RED`;
    group.add(redLens);

    // Yellow lens (middle)
    const yellowLens = new THREE.Mesh(lensGeo, yellowMat);
    yellowLens.rotation.x = Math.PI / 2;
    yellowLens.position.set(2.6, 5.8, 0.28);
    yellowLens.name = `${junctionId}_LENS_YELLOW`;
    group.add(yellowLens);

    // Green lens (bottom)
    const greenLens = new THREE.Mesh(lensGeo, greenMat);
    greenLens.rotation.x = Math.PI / 2;
    greenLens.position.set(2.6, 5.25, 0.28);
    greenLens.name = `${junctionId}_LENS_GREEN`;
    group.add(greenLens);

    return group;
  }
}
