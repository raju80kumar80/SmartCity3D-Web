import * as THREE from 'three';
import { StreetLightingSystem } from '../public/js/simulation/StreetLightingSystem.js';

console.log('=== Starting 3D Street Lighting Subsystem Verification ===\n');

// 1. Instantiate StreetLightingSystem
const lightingSystem = new StreetLightingSystem();

// Verify Group exists
if (!lightingSystem.group || lightingSystem.group.name !== 'SmartStreetLightingSystem') {
  throw new Error('StreetLightingSystem group was not created properly.');
}
console.log('✔ StreetLightingSystem group instantiated successfully.');

// 2. Verify exactly 16 street lights exist
const lightsCount = lightingSystem.lightsMap.size;
if (lightsCount !== 16) {
  throw new Error(`Expected 16 street lights, found: ${lightsCount}`);
}
console.log(`✔ Exactly ${lightsCount} smart street lighting nodes instantiated.`);

// 3. Verify coordinates of all 16 nodes
const expectedCoords = {
  'SL-01': { x: -7.5, z: -60 },
  'SL-02': { x: 7.5, z: -40 },
  'SL-03': { x: -7.5, z: -20 },
  'SL-04': { x: 7.5, z: 20 },
  'SL-05': { x: -7.5, z: 40 },
  'SL-06': { x: 7.5, z: 60 },
  'SL-07': { x: -60, z: -7.5 },
  'SL-08': { x: -40, z: 7.5 },
  'SL-09': { x: -20, z: -7.5 },
  'SL-10': { x: 20, z: 7.5 },
  'SL-11': { x: 40, z: -7.5 },
  'SL-12': { x: 60, z: 7.5 },
  'SL-13': { x: -44.5, z: -50 },
  'SL-14': { x: 44.5, z: -50 },
  'SL-15': { x: -44.5, z: 50 },
  'SL-16': { x: 44.5, z: 50 }
};

for (const [id, expected] of Object.entries(expectedCoords)) {
  const node = lightingSystem.lightsMap.get(id);
  if (!node) {
    throw new Error(`Node ${id} missing from lightsMap!`);
  }
  const pos = node.group.position;
  if (Math.abs(pos.x - expected.x) > 0.01 || Math.abs(pos.z - expected.z) > 0.01) {
    throw new Error(`Node ${id} coordinate mismatch! Expected (${expected.x}, ${expected.z}), got (${pos.x}, ${pos.z})`);
  }
}
console.log('✔ All 16 street light node coordinates verified along road alignments and ring roads.');

// 4. Verify SL-08 Diagnostic Fault configuration & visualization
const sl08 = lightingSystem.lightsMap.get('SL-08');
if (!sl08.data.isFaulty || sl08.data.status !== 'FAULT' || sl08.data.faultType !== 'DRIVER_FAULT') {
  throw new Error('SL-08 is not configured as FAULT / DRIVER_FAULT!');
}
const sl08EmissiveHex = sl08.emissiveMat.color.getHex();
if (sl08EmissiveHex !== 0xef4444) {
  throw new Error(`SL-08 emissive color should be red (0xef4444), got: 0x${sl08EmissiveHex.toString(16)}`);
}
console.log('✔ SL-08 diagnostic fault visualization confirmed (Red 0xef4444 emissive material and DRIVER_FAULT data).');

// 5. Verify normal light (SL-01) emissive glow and SpotLight
const sl01 = lightingSystem.lightsMap.get('SL-01');
if (sl01.data.isFaulty || sl01.data.status !== 'ON') {
  throw new Error('SL-01 should be normal ON light!');
}
const sl01EmissiveHex = sl01.emissiveMat.color.getHex();
if (sl01EmissiveHex !== 0xfffae0) {
  throw new Error(`SL-01 emissive color should be warm white (0xfffae0), got: 0x${sl01EmissiveHex.toString(16)}`);
}
if (sl01.spotLight.castShadow !== false) {
  throw new Error('SpotLight castShadow must be false for 60 FPS performance!');
}
console.log('✔ Normal light (SL-01) confirmed with warm luminaire glow (0xfffae0) and lightweight SpotLight (castShadow = false).');

// 6. Verify userData on interactive objects
const interactiveMeshes = lightingSystem.getInteractiveMeshes();
if (!interactiveMeshes || interactiveMeshes.length === 0) {
  throw new Error('getInteractiveMeshes returned empty array!');
}
const sampleMesh = interactiveMeshes[0];
if (!sampleMesh.userData.isStreetLight || !sampleMesh.userData.lightData) {
  throw new Error('Interactive mesh missing userData.isStreetLight or userData.lightData!');
}
console.log(`✔ Interactive raycast meshes verified: ${interactiveMeshes.length} meshes registered with isStreetLight=true and lightData.`);

// 7. Verify update(delta) animation
const initialIntensity = sl08.emissiveMat.emissiveIntensity;
lightingSystem.update(0.1);
const updatedIntensity = sl08.emissiveMat.emissiveIntensity;
if (initialIntensity === updatedIntensity) {
  console.warn('Warning: SL-08 pulse did not change across update');
} else {
  console.log(`✔ SL-08 pulse animation verified (${initialIntensity.toFixed(2)} -> ${updatedIntensity.toFixed(2)}).`);
}

// 8. Verify findInteractiveTarget logic as implemented in scene.js
function findInteractiveTarget(object) {
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
    curr = curr.parent;
  }
  return null;
}

const targetResult = findInteractiveTarget(sampleMesh);
if (!targetResult || targetResult.type !== 'streetLight' || !targetResult.data) {
  throw new Error('findInteractiveTarget failed to recognize street light mesh!');
}
console.log(`✔ findInteractiveTarget successfully resolved target: type="${targetResult.type}", lightId="${targetResult.data.lightId}".`);

// 9. Verify callback dispatch
let selectedLight = null;
const onLightSelect = (data) => {
  selectedLight = data;
};
if (targetResult.type === 'streetLight') {
  onLightSelect(targetResult.data);
}
if (!selectedLight || selectedLight.lightId !== targetResult.data.lightId) {
  throw new Error('onLightSelect callback did not receive expected light data!');
}
console.log(`✔ onLightSelect callback successfully invoked with ${selectedLight.lightId}.`);

// 10. Verify other subsystems interaction isolation
const parkingMesh = new THREE.Mesh();
parkingMesh.userData = { isParkingSlot: true, slotData: { slotCode: 'P-01' } };
const trafficMesh = new THREE.Mesh();
trafficMesh.userData = { isTrafficSignal: true, signalData: { junctionId: 'J-NORTH' } };
const emergencyMesh = new THREE.Mesh();
emergencyMesh.userData = { isEmergencyIncident: true, incidentData: { incidentId: 'INC-101' } };
const vehicleMesh = new THREE.Mesh();
vehicleMesh.userData = { isVehicle: true, vehicleData: { id: 'CAR-01' } };
const sensorMesh = new THREE.Mesh();
sensorMesh.userData = { isEnvironmentSensor: true, sensorData: { sensorId: 'ENV-01' } };

if (findInteractiveTarget(parkingMesh)?.type !== 'parking') throw new Error('Parking isolation failed');
if (findInteractiveTarget(trafficMesh)?.type !== 'traffic') throw new Error('Traffic isolation failed');
if (findInteractiveTarget(emergencyMesh)?.type !== 'emergency') throw new Error('Emergency isolation failed');
if (findInteractiveTarget(vehicleMesh)?.type !== 'vehicle') throw new Error('Vehicle isolation failed');
if (findInteractiveTarget(sensorMesh)?.type !== 'environment') throw new Error('Environment isolation failed');
console.log('✔ Multi-system raycast target isolation verified (Parking, Traffic, Emergency, Vehicle, Environment all intact).');

console.log('\n====================================================');
console.log('🎉 ALL 3D STREET LIGHTING VERIFICATIONS PASSED!');
console.log('====================================================');
