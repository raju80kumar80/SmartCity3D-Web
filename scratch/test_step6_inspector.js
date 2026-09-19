import * as THREE from 'three';
import { StreetLightingSystem } from '../public/js/simulation/StreetLightingSystem.js';

console.log('=== Step 6: Street Light Inspector Verification ===\n');

// 1. Instantiate system
const lightingSystem = new StreetLightingSystem();

console.log(`[PASS] 16 Street lights initialized: ${lightingSystem.lightsMap.size}`);
if (lightingSystem.lightsMap.size !== 16) {
  throw new Error(`Expected 16 lights, got ${lightingSystem.lightsMap.size}`);
}

// 2. Test getLightNode and getLightData
const sl01Node = lightingSystem.getLightNode('SL-01');
const sl01Data = lightingSystem.getLightData('SL-01');
if (!sl01Node || !sl01Data || sl01Data.lightId !== 'SL-01') {
  throw new Error('Failed to retrieve SL-01 via getLightNode/getLightData');
}
console.log(`[PASS] getLightNode('SL-01') returned valid node with status: ${sl01Data.status}`);

const sl08Data = lightingSystem.getLightData('SL-08');
if (!sl08Data || sl08Data.status !== 'FAULT' || !sl08Data.isFaulty || sl08Data.faultType !== 'DRIVER_FAULT') {
  throw new Error('SL-08 is not properly configured as a faulty luminaire with DRIVER_FAULT');
}
console.log(`[PASS] SL-08 correctly shows FAULT / DRIVER_FAULT`);

// 3. Test syncLights updates
const updatedSl01 = {
  ...sl01Data,
  status: 'OFF',
  brightness: 0,
  mode: 'MANUAL'
};
lightingSystem.syncLights([updatedSl01]);
const afterSync = lightingSystem.getLightData('SL-01');
if (afterSync.status !== 'OFF' || afterSync.brightness !== 0 || afterSync.mode !== 'MANUAL') {
  throw new Error('syncLights failed to update SL-01 to OFF / 0 / MANUAL');
}
console.log(`[PASS] syncLights updated SL-01 to OFF (brightness: ${afterSync.brightness}%, mode: ${afterSync.mode})`);

// Turn it back ON with 85%
const turnedOn = {
  ...sl01Data,
  status: 'ON',
  brightness: 85,
  mode: 'AUTO'
};
lightingSystem.syncLights([turnedOn]);
const afterOn = lightingSystem.getLightData('SL-01');
if (afterOn.status !== 'ON' || afterOn.brightness !== 85) {
  throw new Error('syncLights failed to turn SL-01 back ON with 85%');
}
console.log(`[PASS] syncLights turned SL-01 back ON (brightness: ${afterOn.brightness}%)`);

// 4. Test Raycast meshes
const interactiveMeshes = lightingSystem.getInteractiveMeshes();
console.log(`[PASS] Interactive meshes count: ${interactiveMeshes.length}`);
if (interactiveMeshes.length === 0) {
  throw new Error('No interactive meshes registered for street lights');
}

// 5. Test metrics calculation
const metrics = lightingSystem.getLightingHUDMetrics();
console.log(`[PASS] HUD Metrics: ${metrics.activeOnCount}/${metrics.totalLights} active, ${metrics.faultyCount} faulty (${metrics.faultyDetails.join(', ')}), ${metrics.powerKw} kW, mode: ${metrics.dominantMode}`);

console.log('\n=== All Step 6 tests PASSED successfully! ===');
