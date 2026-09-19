import * as THREE from 'three';
import { FacilityBuilder } from '../public/js/city/FacilityBuilder.js';

console.log('=== Starting 3D Facilities Subsystem Direct Runtime Verification ===\n');

// 1. Instantiate FacilityBuilder
const fb = new FacilityBuilder({ isNight: false });

if (!fb.group || fb.group.name !== 'SmartCityFacilities') {
  throw new Error('FacilityBuilder group was not created properly.');
}
console.log('✔ FacilityBuilder group instantiated successfully.');

// 2. Verify all 10 facilities exist in facilitiesMap
if (fb.facilitiesMap.size !== 10) {
  throw new Error(`Expected 10 facilities, got ${fb.facilitiesMap.size}`);
}
console.log(`✔ Exactly 10 facilities registered in facilitiesMap.`);

// 3. Expected Coordinates
const expectedFacilities = {
  'FAC-HOSPITAL': { name: 'CITY HOSPITAL', type: 'HOSPITAL', zone: 'CIVIC', x: 22, z: -64 },
  'FAC-GOV': { name: 'GOVERNMENT OFFICE', type: 'GOVERNMENT', zone: 'CIVIC', x: -22, z: -64 },
  'FAC-POWER': { name: 'POWER STATION', type: 'UTILITY', zone: 'UTILITY', x: -68, z: -64 },
  'FAC-FIRE': { name: 'FIRE STATION', type: 'FIRE_STATION', zone: 'CIVIC', x: -64, z: -10 },
  'FAC-BUS': { name: 'BUS STATION', type: 'TRANSIT', zone: 'TRANSIT', x: -64, z: 8 },
  'FAC-MALL': { name: 'SHOPPING CENTER', type: 'COMMERCIAL', zone: 'COMMERCIAL', x: 64, z: -10 },
  'FAC-POLICE': { name: 'POLICE STATION', type: 'POLICE', zone: 'CIVIC', x: -22, z: 64 },
  'FAC-SCHOOL': { name: 'SMART SCHOOL', type: 'EDUCATION', zone: 'RESIDENTIAL', x: -32, z: 64 },
  'FAC-PARK': { name: 'CITY PARK', type: 'LEISURE', zone: 'PARK', x: 22, z: 64 },
  'FAC-WATER': { name: 'WATER TREATMENT PLANT', type: 'UTILITY', zone: 'UTILITY', x: 68, z: 64 }
};

for (const [id, exp] of Object.entries(expectedFacilities)) {
  const fac = fb.facilitiesMap.get(id);
  if (!fac) {
    throw new Error(`Facility ${id} missing from facilitiesMap!`);
  }
  if (fac.data.name !== exp.name) {
    throw new Error(`Name mismatch for ${id}: expected ${exp.name}, got ${fac.data.name}`);
  }
  if (fac.data.type !== exp.type) {
    throw new Error(`Type mismatch for ${id}: expected ${exp.type}, got ${fac.data.type}`);
  }
  if (fac.data.zone !== exp.zone) {
    throw new Error(`Zone mismatch for ${id}: expected ${exp.zone}, got ${fac.data.zone}`);
  }
  const pos = fac.group.position;
  if (Math.abs(pos.x - exp.x) > 0.01 || Math.abs(pos.z - exp.z) > 0.01) {
    throw new Error(`Coordinate mismatch for ${id}: expected (${exp.x}, ${exp.z}), got (${pos.x}, ${pos.z})`);
  }
  console.log(`  ✔ [${id}] ${exp.name} verified at (${pos.x}, ${pos.z})`);
}

// 4. Verify interactive meshes
const interactive = fb.getInteractiveMeshes();
if (interactive.length < 50) {
  throw new Error(`Too few interactive meshes: ${interactive.length}`);
}
console.log(`✔ Interactive raycast meshes: ${interactive.length} meshes registered.`);

// 5. Verify every interactive mesh has isFacility=true and facilityData
interactive.forEach((m, idx) => {
  if (!m.userData || !m.userData.isFacility || !m.userData.facilityData) {
    throw new Error(`Interactive mesh ${idx} missing proper userData metadata!`);
  }
});
console.log(`✔ All interactive meshes properly tagged with userData.isFacility = true and facilityData.`);

// 6. Test day/night update
fb.update(0.016, true);
if (fb.windowGlowCoolMat.emissiveIntensity < 0.8) {
  throw new Error('Window glow was not boosted in night mode!');
}
fb.update(0.016, false);
if (fb.windowGlowCoolMat.emissiveIntensity > 0.5) {
  throw new Error('Window glow was not dimmed in day mode!');
}
console.log('✔ Dynamic Day/Night lighting adaptation confirmed.');

console.log('\n====================================================');
console.log('🎉 ALL 3D FACILITIES RUNTIME VERIFICATIONS PASSED!');
console.log('====================================================');
