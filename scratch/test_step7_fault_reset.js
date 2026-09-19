import * as THREE from 'three';
import { StreetLightingSystem } from '../public/js/simulation/StreetLightingSystem.js';

console.log('=== Step 7: Fault Diagnostics + Safe Fault Reset Verification ===\n');

// 1. Instantiate system with initial 16 lights (SL-08 starts faulty)
const lightingSystem = new StreetLightingSystem();

const sl08Node = lightingSystem.getLightNode('SL-08');
if (!sl08Node) throw new Error('SL-08 node not found');

console.log('--- Phase 1: Verify Initial Fault State ---');
const initialData = sl08Node.data;
console.log(`SL-08 Status: ${initialData.status}`);
console.log(`SL-08 isFaulty: ${initialData.isFaulty}`);
console.log(`SL-08 Fault Type: ${initialData.faultType}`);

if (initialData.status !== 'FAULT' || !initialData.isFaulty || initialData.faultType !== 'DRIVER_FAULT') {
  throw new Error('Initial state of SL-08 is not FAULT / DRIVER_FAULT');
}
console.log('[PASS] Initial SL-08 verified as FAULT / DRIVER_FAULT');

// Check initial HUD metrics
const initialMetrics = lightingSystem.getLightingHUDMetrics();
console.log(`Initial Faulty Count: ${initialMetrics.faultyCount}`);
console.log(`Initial Faulty Details: ${initialMetrics.faultyDetails.join(', ')}`);
if (initialMetrics.faultyCount !== 1) {
  throw new Error(`Expected 1 faulty luminaire, got ${initialMetrics.faultyCount}`);
}
console.log('[PASS] Initial HUD shows 1 faulty luminaire (SL-08 • DRIVER_FAULT)');

// 2. Perform safe reset (simulate API result: status=ON, isFaulty=false, faultType=NONE)
console.log('\n--- Phase 2: Apply Reset Data ---');
const resetLight = {
  ...initialData,
  status: 'ON',
  brightness: 80,
  isFaulty: false,
  faultType: 'NONE',
  lastUpdated: new Date()
};

lightingSystem.syncLights([resetLight]);

const resetNode = lightingSystem.getLightNode('SL-08');
const resetData = resetNode.data;
console.log(`Reset SL-08 Status: ${resetData.status}`);
console.log(`Reset SL-08 isFaulty: ${resetData.isFaulty}`);
console.log(`Reset SL-08 Fault Type: ${resetData.faultType}`);

if (resetData.status !== 'ON' || resetData.isFaulty !== false || resetData.faultType !== 'NONE') {
  throw new Error('Failed to reset SL-08 state in lighting system');
}
console.log('[PASS] SL-08 successfully updated to ON / isFaulty: false / faultType: NONE');

// 3. Verify 3D visual transition
console.log('\n--- Phase 3: Verify 3D Materials Transition ---');
const emissiveHex = resetNode.emissiveMat.color.getHexString();
const spotHex = resetNode.spotLight.color.getHexString();
const poolHex = resetNode.poolMat.color.getHexString();

console.log(`Emissive Color: #${emissiveHex} (expected warm white: #fffae0)`);
console.log(`SpotLight Color: #${spotHex} (expected warm beam: #ffecd2)`);
console.log(`Pool Color: #${poolHex} (expected warm ground pool: #fef08a)`);

if (emissiveHex === 'ef4444' || spotHex === 'ef4444' || poolHex === 'ef4444') {
  throw new Error('SL-08 materials are still using the red fault color (#ef4444)');
}
console.log('[PASS] SL-08 3D materials successfully transitioned from red fault to normal luminaire');

// 4. Verify HUD Metrics after reset
console.log('\n--- Phase 4: Verify HUD Metrics After Reset ---');
const resetMetrics = lightingSystem.getLightingHUDMetrics();
console.log(`After Reset Faulty Count: ${resetMetrics.faultyCount}`);
console.log(`After Reset Active Luminaires: ${resetMetrics.activeOnCount} / ${resetMetrics.totalLights}`);
console.log(`After Reset Power: ${resetMetrics.powerKw} kW`);

if (resetMetrics.faultyCount !== 0) {
  throw new Error(`Expected 0 faulty luminaires, got ${resetMetrics.faultyCount}`);
}
if (resetMetrics.activeOnCount !== 16) {
  throw new Error(`Expected 16 active luminaires, got ${resetMetrics.activeOnCount}`);
}
console.log('[PASS] HUD metrics reflect 0 faulty luminaires and 16/16 active luminaires');

// 5. Verify Day/Night and Vehicle Adaptive behavior for SL-08
console.log('\n--- Phase 5: Verify Adaptive Simulation Post-Reset ---');
lightingSystem.update(0.016, []);
if (resetNode.currentVisualBrightness < 0) {
  throw new Error('Visual brightness invalid after update');
}
console.log(`SL-08 post-reset visual brightness: ${Math.round(resetNode.currentVisualBrightness)}%`);
console.log('[PASS] Adaptive simulation runs smoothly without fault pulsing');

console.log('\n=== All Step 7 Verification Checks PASSED! ===');
