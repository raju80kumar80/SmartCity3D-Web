import * as THREE from 'three';
import { StreetLightingSystem } from '../public/js/simulation/StreetLightingSystem.js';
import fs from 'fs';
import path from 'path';

console.log('=== Testing Step 5: Live Smart Street Lighting HUD Dashboard ===\n');

// 1. Verify index.html contains all required HUD elements
const htmlPath = path.resolve('public/index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

const requiredElements = [
  'lighting-summary-panel',
  'lighting-sync-dot',
  'lighting-active-count',
  'lighting-faulty-count',
  'lighting-avg-brightness',
  'lighting-power-kw',
  'lighting-energy-saved',
  'lighting-system-mode',
  'lighting-daynight-status',
  'lighting-adaptive-status',
  'lighting-fault-alert',
  'lighting-fault-text'
];

for (const id of requiredElements) {
  if (!htmlContent.includes(id)) {
    throw new Error(`Required HUD element or class '${id}' not found in public/index.html!`);
  }
}
console.log('✔ 1. All 12 HUD dashboard elements and placeholders verified in public/index.html.');

// 2. Fetch live data from MongoDB API
const apiRes = await fetch('http://localhost:5000/api/street-lights');
if (!apiRes.ok) throw new Error(`API fetch failed with status ${apiRes.status}`);
const apiJson = await apiRes.json();
const apiLights = apiJson.data;

console.log(`✔ 2. Retrieved ${apiLights.length} luminaires and summary from GET /api/street-lights.`);

// 3. Instantiate StreetLightingSystem with mock LightingManager
class MockLightingManager {
  constructor() {
    this.isNight = false; // Start in DAY mode
  }
  toggleDayNight() {
    this.isNight = !this.isNight;
    return this.isNight;
  }
}

const mockLM = new MockLightingManager();
const lightingSystem = new StreetLightingSystem(mockLM);
lightingSystem.syncLights(apiLights);

// 4. Verify HUD Metrics in Day Mode
console.log('\n--- Testing HUD Metrics in Day Mode ---');
let hudMetrics = lightingSystem.getLightingHUDMetrics();

console.log('Day HUD Metrics:', JSON.stringify(hudMetrics, null, 2));

if (hudMetrics.totalLights !== 16) throw new Error(`Expected 16 total lights, got ${hudMetrics.totalLights}`);
if (hudMetrics.activeOnCount !== 15) throw new Error(`Expected 15 active lights, got ${hudMetrics.activeOnCount}`);
if (hudMetrics.faultyCount !== 1) throw new Error(`Expected 1 faulty light, got ${hudMetrics.faultyCount}`);
if (hudMetrics.dayNight !== 'DAY') throw new Error(`Expected Day, got ${hudMetrics.dayNight}`);
if (hudMetrics.adaptiveStatus !== 'STANDBY') throw new Error(`Expected STANDBY in Day, got ${hudMetrics.adaptiveStatus}`);
if (!hudMetrics.faultyDetails.some(f => f.includes('SL-08') && f.includes('DRIVER_FAULT'))) {
  throw new Error(`Fault alert details missing SL-08 DRIVER_FAULT: ${hudMetrics.faultyDetails}`);
}
console.log('✔ 3. Day Mode HUD verified: Active=15/16, Faults=1, Day/Night=DAY, Adaptive=STANDBY, Fault Alert="SL-08 • DRIVER_FAULT".');

// 5. Test Night Mode HUD metrics & Power Demand
console.log('\n--- Testing HUD Metrics in Night Mode ---');
mockLM.isNight = true;

// Run update to advance visual brightness
lightingSystem.update(0.1, []);
hudMetrics = lightingSystem.getLightingHUDMetrics();

console.log('Night HUD Metrics:', JSON.stringify(hudMetrics, null, 2));

if (hudMetrics.dayNight !== 'NIGHT') throw new Error(`Expected NIGHT, got ${hudMetrics.dayNight}`);
if (hudMetrics.adaptiveStatus !== 'ACTIVE') throw new Error(`Expected ACTIVE in Night, got ${hudMetrics.adaptiveStatus}`);
if (hudMetrics.avgBrightness !== 79) throw new Error(`Expected average brightness ~79%, got ${hudMetrics.avgBrightness}%`);
if (hudMetrics.dominantMode !== 'AUTO') throw new Error(`Expected dominant mode AUTO, got ${hudMetrics.dominantMode}`);
if (hudMetrics.powerKw <= 0) throw new Error(`Power demand must be positive, got ${hudMetrics.powerKw} kW`);
console.log(`✔ 4. Night Mode HUD verified: Day/Night=NIGHT, Adaptive=ACTIVE, Power Demand=${hudMetrics.powerKw} kW, Avg Brightness=${hudMetrics.avgBrightness}%, Energy Saved=${hudMetrics.avgEnergySaved}%.`);

// 6. Verify existing subsystem endpoints remain functional
const [pk, tf, em, env] = await Promise.all([
  (await (await fetch('http://localhost:5000/api/parking')).json()).count,
  (await (await fetch('http://localhost:5000/api/traffic')).json()).count,
  (await (await fetch('http://localhost:5000/api/incidents')).json()).count,
  (await (await fetch('http://localhost:5000/api/environment')).json()).count
]);

if (pk !== 8 || tf !== 4 || em !== 1 || env !== 6) {
  throw new Error(`Subsystem regression detected: Parking=${pk}, Traffic=${tf}, Emergency=${em}, Environment=${env}`);
}
console.log(`✔ 5. Multi-subsystem validation passed: Parking (${pk}), Traffic (${tf}), Emergency (${em}), Environment (${env}) fully operational.`);

console.log('\n====================================================');
console.log('🎉 STEP 5 HUD DASHBOARD TEST PASSED COMPLETELY!');
console.log('====================================================');
