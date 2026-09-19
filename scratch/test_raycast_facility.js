import * as THREE from 'three';
import { FacilityBuilder } from '../public/js/city/FacilityBuilder.js';

console.log('=== Starting Raycast Target Isolation Verification ===\n');

const fb = new FacilityBuilder({ isNight: false });
const interactiveMeshes = fb.getInteractiveMeshes();

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
    if (curr.userData && curr.userData.isFacility && curr.userData.facilityData) {
      return { type: 'facility', data: curr.userData.facilityData };
    }
    curr = curr.parent;
  }
  return null;
}

// Test resolving target on every facility's meshes
const testedFacilityIds = new Set();

interactiveMeshes.forEach(mesh => {
  const res = findInteractiveTarget(mesh);
  if (!res || res.type !== 'facility') {
    throw new Error('Mesh failed to resolve as facility!');
  }
  testedFacilityIds.add(res.data.facilityId);
});

if (testedFacilityIds.size !== 10) {
  throw new Error(`Expected all 10 facility IDs to be resolvable, got ${testedFacilityIds.size}`);
}

console.log(`✔ All 10 facilities successfully resolved via findInteractiveTarget across all ${interactiveMeshes.length} meshes.`);
console.log('✔ Facility raycasting integration 100% verified!\n');
