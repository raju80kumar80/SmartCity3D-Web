import * as THREE from 'three';

/**
 * RoadBuilder
 * Constructs the city road network, lane dividers, sidewalks/curbs, and pedestrian crosswalks.
 */
export class RoadBuilder {
  constructor() {
    this.roadGroup = new THREE.Group();
    this.roadGroup.name = 'RoadNetwork';

    // Shared materials
    this.asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x1a202c,
      roughness: 0.9,
      metalness: 0.1
    });

    this.curbMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.8
    });

    this.yellowMarkingMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15
    });

    this.whiteMarkingMat = new THREE.MeshBasicMaterial({
      color: 0xf8fafc
    });
  }

  build() {
    // 1. Main Avenues (12 units wide)
    this.createRoadSegment(0, 0, 12, 160, 'vertical');   // North-South Avenue (x=0)
    this.createRoadSegment(0, 0, 160, 12, 'horizontal'); // East-West Avenue (z=0)

    // 2. Secondary Ring Roads (9 units wide)
    this.createRoadSegment(-50, 0, 9, 160, 'vertical');  // West Ring Road (x=-50)
    this.createRoadSegment(50, 0, 9, 160, 'vertical');   // East Ring Road (x=50)
    this.createRoadSegment(0, -50, 160, 9, 'horizontal'); // North Ring Road (z=-50)
    this.createRoadSegment(0, 50, 160, 9, 'horizontal');  // South Ring Road (z=50)

    // 3. Central Roundabout / Hub Island (at origin 0, 0)
    this.createCentralHub();

    // 4. Pedestrian Crosswalks at Junctions
    this.createCrosswalk(0, -35, true);  // J-NORTH
    this.createCrosswalk(0, 35, true);   // J-SOUTH
    this.createCrosswalk(35, 0, false);  // J-EAST
    this.createCrosswalk(-35, 0, false); // J-WEST

    return this.roadGroup;
  }

  createRoadSegment(x, z, width, length, orientation) {
    // Asphalt Mesh
    const geo = new THREE.PlaneGeometry(width, length);
    const road = new THREE.Mesh(geo, this.asphaltMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(x, 0.04, z);
    road.receiveShadow = true;
    this.roadGroup.add(road);

    // Sidewalks/Curbs on either side
    const curbHeight = 0.25;
    const curbWidth = 1.2;

    if (orientation === 'vertical') {
      // Curbs on left and right
      const leftCurbGeo = new THREE.BoxGeometry(curbWidth, curbHeight, length);
      const leftCurb = new THREE.Mesh(leftCurbGeo, this.curbMat);
      leftCurb.position.set(x - width / 2 - curbWidth / 2, curbHeight / 2, z);
      leftCurb.castShadow = true;
      leftCurb.receiveShadow = true;
      this.roadGroup.add(leftCurb);

      const rightCurb = leftCurb.clone();
      rightCurb.position.set(x + width / 2 + curbWidth / 2, curbHeight / 2, z);
      this.roadGroup.add(rightCurb);

      // Yellow dashed center line
      this.createDashedLine(x, z, length, 'vertical');
    } else {
      // Curbs on top and bottom
      const topCurbGeo = new THREE.BoxGeometry(length, curbHeight, curbWidth);
      const topCurb = new THREE.Mesh(topCurbGeo, this.curbMat);
      topCurb.position.set(x, curbHeight / 2, z - width / 2 - curbWidth / 2);
      topCurb.castShadow = true;
      topCurb.receiveShadow = true;
      this.roadGroup.add(topCurb);

      const bottomCurb = topCurb.clone();
      bottomCurb.position.set(x, curbHeight / 2, z + width / 2 + curbWidth / 2);
      this.roadGroup.add(bottomCurb);

      // Yellow dashed center line
      this.createDashedLine(x, z, length, 'horizontal');
    }
  }

  createDashedLine(x, z, totalLength, orientation) {
    const dashLength = 3;
    const dashGap = 2;
    const numDashes = Math.floor(totalLength / (dashLength + dashGap));
    const startOffset = -totalLength / 2 + dashLength / 2;

    for (let i = 0; i < numDashes; i++) {
      const pos = startOffset + i * (dashLength + dashGap);
      // Skip dashes near the central junction to keep intersection clear
      if (Math.abs(pos) < 10) continue;

      const geo = orientation === 'vertical'
        ? new THREE.PlaneGeometry(0.3, dashLength)
        : new THREE.PlaneGeometry(dashLength, 0.3);

      const dash = new THREE.Mesh(geo, this.yellowMarkingMat);
      dash.rotation.x = -Math.PI / 2;
      
      if (orientation === 'vertical') {
        dash.position.set(x, 0.06, z + pos);
      } else {
        dash.position.set(x + pos, 0.06, z);
      }
      this.roadGroup.add(dash);
    }
  }

  createCentralHub() {
    // Roundabout island in center (x=0, z=0)
    const islandGeo = new THREE.CylinderGeometry(4.5, 4.5, 0.35, 32);
    const islandMat = new THREE.MeshStandardMaterial({
      color: 0x15803d, // Green lawn
      roughness: 0.8
    });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.set(0, 0.175, 0);
    island.receiveShadow = true;
    island.castShadow = true;
    this.roadGroup.add(island);

    // Modern cyber sculpture / fountain in the roundabout center
    const pillarGeo = new THREE.CylinderGeometry(1.2, 1.6, 6, 8);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.8,
      roughness: 0.2
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(0, 3.3, 0);
    pillar.castShadow = true;
    this.roadGroup.add(pillar);

    // Glowing cyan ring atop central monument
    const ringGeo = new THREE.TorusGeometry(1.5, 0.2, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.9,
      roughness: 0.2
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 6.3, 0);
    this.roadGroup.add(ring);
  }

  createCrosswalk(x, z, isHorizontalStripe) {
    const stripes = 6;
    const stripeWidth = 0.8;
    const stripeLength = 4.5;
    const spacing = 1.4;

    const crosswalkGroup = new THREE.Group();

    for (let i = 0; i < stripes; i++) {
      const offset = (i - (stripes - 1) / 2) * spacing;
      const geo = isHorizontalStripe
        ? new THREE.PlaneGeometry(stripeWidth, stripeLength)
        : new THREE.PlaneGeometry(stripeLength, stripeWidth);

      const stripe = new THREE.Mesh(geo, this.whiteMarkingMat);
      stripe.rotation.x = -Math.PI / 2;

      if (isHorizontalStripe) {
        stripe.position.set(x + offset, 0.055, z);
      } else {
        stripe.position.set(x, 0.055, z + offset);
      }
      crosswalkGroup.add(stripe);
    }

    this.roadGroup.add(crosswalkGroup);
  }
}
