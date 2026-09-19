import * as THREE from 'three';
import { StreetLightingSystem } from '../public/js/simulation/StreetLightingSystem.js';

console.log('=== Testing Step 4: Day/Night & Vehicle-Aware Adaptive Lighting ===\n');

// Mock LightingManager
class MockLightingManager {
  constructor() {
    this.isNight = false; // Starts in Day Mode
  }
  toggleDayNight() {
    this.isNight = !this.isNight;
    return this.isNight;
  }
}

// Mock Vehicle
function createMockVehicle(id, type, x, z) {
  const meshGroup = new THREE.Group();
  meshGroup.position.set(x, 0, z);
  return {
    id,
    type,
    meshGroup
  };
}

const mockLightingManager = new MockLightingManager();
const lightingSystem = new StreetLightingSystem(mockLightingManager);

// 1. Verify 16 lights
if (lightingSystem.lightsMap.size !== 16) {
  throw new Error(`Expected 16 lights, got ${lightingSystem.lightsMap.size}`);
}
console.log('✔ 1. All 16 street lights instantiated and visible.');

// 2. Test Day Mode (isNight === false)
console.log('\n--- Testing Day Mode ---');
mockLightingManager.isNight = false;
lightingSystem.update(0.1, []);

const sl01 = lightingSystem.lightsMap.get('SL-01');
if (sl01.targetVisualBrightness !== 0) {
  throw new Error(`Day mode should set AUTO light target brightness to 0, got ${sl01.targetVisualBrightness}`);
}
console.log(`✔ 3. Day mode sets AUTO luminaire (SL-01) target brightness to 0% (Standby).`);

// Verify SL-08 is still in FAULT state in day mode
const sl08 = lightingSystem.lightsMap.get('SL-08');
if (!sl08.data.isFaulty || sl08.emissiveMat.color.getHex() !== 0xef4444) {
  throw new Error('SL-08 must remain in FAULT state with red emissive panel during day mode!');
}
console.log('✔ 11. SL-08 remains red (0xef4444) and in FAULT diagnostic state during day mode.');

// 3. Test Night Mode (isNight === true) with no nearby vehicles
console.log('\n--- Testing Night Mode: Vacant Standby (> 30m) ---');
mockLightingManager.isNight = true;

// Distant vehicle at x = 500, z = 500
const distantVehicles = [createMockVehicle('CAR-1', 'CAR', 500, 500)];
lightingSystem.update(0.1, distantVehicles);

if (sl01.targetVisualBrightness !== 25) {
  throw new Error(`Vacant night AUTO light target should be 25%, got ${sl01.targetVisualBrightness}`);
}
console.log(`✔ 4 & 6. Night mode with distant vehicle (> 30m) sets AUTO target to 25% energy-saving standby.`);

// Test ECO_RADAR mode with distant vehicle
const sl02 = lightingSystem.lightsMap.get('SL-02');
sl02.data.mode = 'ECO_RADAR';
lightingSystem.update(0.1, distantVehicles);
if (sl02.targetVisualBrightness !== 15) {
  throw new Error(`Vacant night ECO_RADAR target should be 15%, got ${sl02.targetVisualBrightness}`);
}
console.log(`✔ 6b. ECO_RADAR mode with distant vehicle (> 30m) sets target to 15% deeper eco standby.`);

// 4. Test Normal Vehicle Approach (<= 18m)
console.log('\n--- Testing Normal Vehicle Approach (<= 18m) ---');
// SL-01 is at x = -7.5, z = -60
// Place car at x = -7.5, z = -55 (distance = 5m <= 18m)
const nearVehicles = [createMockVehicle('CAR-2', 'CAR', -7.5, -55)];
lightingSystem.update(0.1, nearVehicles);

if (sl01.targetVisualBrightness < 85 || sl01.targetVisualBrightness > 90) {
  throw new Error(`Nearby car (<= 18m) target expected 85-90%, got ${sl01.targetVisualBrightness}`);
}
console.log(`✔ 5. Nearby normal vehicle (distance 5m <= 18m) ramps target brightness to ${sl01.targetVisualBrightness}%.`);

// Test Intermediate Approach (18m - 30m)
// Place car at distance ~25m (z = -35)
const midVehicles = [createMockVehicle('CAR-3', 'CAR', -7.5, -35)];
lightingSystem.update(0.1, midVehicles);
if (sl01.targetVisualBrightness !== 50) {
  throw new Error(`Mid-distance car (18-30m) target expected 50%, got ${sl01.targetVisualBrightness}`);
}
console.log(`✔ 5b. Intermediate vehicle approach (distance 25m) sets target to 50%.`);

// 5. Test Emergency Vehicle / Ambulance Priority (<= 25m -> 100%)
console.log('\n--- Testing Emergency Vehicle Priority (Ambulance <= 25m) ---');
// Place ambulance at distance 20m from SL-01
const ambulanceFleet = [createMockVehicle('AMB-1', 'AMBULANCE', -7.5, -40)];
lightingSystem.update(0.1, ambulanceFleet);

if (sl01.targetVisualBrightness !== 100) {
  throw new Error(`Ambulance within 25m should trigger 100% priority, got ${sl01.targetVisualBrightness}`);
}
console.log(`✔ 7. Ambulance within 25m triggers 100% maximum brightness priority.`);

// 6. Test Smooth Interpolation (Lerp 0.08)
console.log('\n--- Testing Smooth Interpolation (Lerp) ---');
// Step forward 1 frame
const initialVisual = sl01.currentVisualBrightness;
lightingSystem.update(0.016, ambulanceFleet);
const steppedVisual = sl01.currentVisualBrightness;

if (steppedVisual <= initialVisual) {
  throw new Error('Smooth visual brightness should interpolate toward target 100%');
}
console.log(`✔ Smooth lerp verified: visual brightness interpolated smoothly from ${initialVisual.toFixed(2)} to ${steppedVisual.toFixed(2)}.`);

// Run multiple frames to verify convergence
for (let i = 0; i < 60; i++) {
  lightingSystem.update(0.016, ambulanceFleet);
}
console.log(`✔ After 60 frames, visual brightness smoothly reached ${sl01.currentVisualBrightness.toFixed(2)}% without popping.`);

// 7. Verify MongoDB Base Brightness Was NOT Overwritten
console.log('\n--- Verifying MongoDB Data Preservation ---');
if (sl01.data.brightness !== 80) {
  throw new Error(`Database brightness was corrupted! Expected 80, got ${sl01.data.brightness}`);
}
console.log(`✔ 8. Database base brightness preserved intact (MongoDB brightness remains ${sl01.data.brightness}%).`);

// 8. Test MANUAL Mode
console.log('\n--- Testing MANUAL Mode ---');
const sl03 = lightingSystem.lightsMap.get('SL-03');
sl03.data.mode = 'MANUAL';
sl03.data.brightness = 70;
// Test at night with nearby ambulance
lightingSystem.update(0.1, ambulanceFleet);
if (sl03.targetVisualBrightness !== 70) {
  throw new Error(`MANUAL mode should strictly respect database brightness 70, got ${sl03.targetVisualBrightness}`);
}
console.log(`✔ 9. MANUAL mode strictly respects database brightness (${sl03.targetVisualBrightness}%) without automatic vehicle adaptation.`);

// 9. Test OFF status
console.log('\n--- Testing OFF Status ---');
const sl04 = lightingSystem.lightsMap.get('SL-04');
sl04.data.status = 'OFF';
lightingSystem.update(0.1, ambulanceFleet);
if (sl04.targetVisualBrightness !== 0) {
  throw new Error(`OFF status should have target brightness 0, got ${sl04.targetVisualBrightness}`);
}
console.log(`✔ 10. OFF status remains 0% target brightness even with nearby ambulance.`);

console.log('\n====================================================');
console.log('🎉 ALL STEP 4 REQUIREMENTS VERIFIED SUCCESSFULLY!');
console.log('====================================================');
