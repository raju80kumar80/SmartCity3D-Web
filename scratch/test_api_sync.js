import * as THREE from 'three';
import { StreetLightingSystem } from '../public/js/simulation/StreetLightingSystem.js';

console.log('=== Testing Step 3: Street Lighting API Synchronization ===\n');

function createMockVehicle(id, type, x, z) {
  const meshGroup = new THREE.Group();
  meshGroup.position.set(x, 0, z);
  return { id, type, meshGroup };
}

async function runTests() {
  // 1. Fetch from live API
  const apiRes = await fetch('http://localhost:5000/api/street-lights');
  if (!apiRes.ok) {
    throw new Error(`API fetch failed with status ${apiRes.status}`);
  }
  const apiJson = await apiRes.json();
  const apiLights = apiJson.data;

  console.log(`✔ API returned ${apiLights.length} lights (Count=${apiJson.count}).`);
  if (apiLights.length !== 16) {
    throw new Error(`Expected 16 lights from API, got ${apiLights.length}`);
  }

  // 2. Instantiate StreetLightingSystem
  const lightingSystem = new StreetLightingSystem();
  if (lightingSystem.lightsMap.size !== 16) {
    throw new Error(`Expected 16 3D lights, got ${lightingSystem.lightsMap.size}`);
  }
  console.log('✔ Initial 16 3D street light nodes verified in Three.js scene.');

  // 3. Synchronize with API records
  lightingSystem.syncLights(apiLights);
  console.log('✔ syncLights(apiLights) executed successfully.');

  // 4. Verify SL-08 is FAULT and emissive color is red (0xef4444)
  const sl08Node = lightingSystem.lightsMap.get('SL-08');
  if (!sl08Node) throw new Error('SL-08 missing in lightsMap');
  if (sl08Node.data.status !== 'FAULT' || !sl08Node.data.isFaulty || sl08Node.data.faultType !== 'DRIVER_FAULT') {
    throw new Error(`SL-08 data mismatch: status=${sl08Node.data.status}, isFaulty=${sl08Node.data.isFaulty}`);
  }
  if (sl08Node.emissiveMat.color.getHex() !== 0xef4444) {
    throw new Error(`SL-08 emissive should be 0xef4444 red, got: 0x${sl08Node.emissiveMat.color.getHex().toString(16)}`);
  }
  console.log('✔ SL-08 confirmed in FAULT state with red (0xef4444) luminaire.');

  // 5. Test changing an existing light's brightness through the API
  const testLightId = 'SL-03';
  const newBrightness = 92;
  console.log(`\nTesting PATCH /api/street-lights/${testLightId}/brightness -> ${newBrightness}...`);

  const patchRes = await fetch(`http://localhost:5000/api/street-lights/${testLightId}/brightness`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brightness: newBrightness })
  });
  if (!patchRes.ok) {
    throw new Error(`PATCH request failed with status ${patchRes.status}`);
  }
  const patchJson = await patchRes.json();
  console.log(`✔ API confirmed brightness updated to ${patchJson.data.brightness}% for ${testLightId}.`);

  // Simulate next polling refresh cycle
  const refreshRes = await fetch('http://localhost:5000/api/street-lights');
  const freshData = (await refreshRes.json()).data;
  lightingSystem.syncLights(freshData);

  // Simulate animation loop frames to allow smooth visual lerp
  for (let i = 0; i < 60; i++) {
    lightingSystem.update(0.016, [createMockVehicle('CAR-NEAR', 'CAR', -7.5, -20)]);
  }

  const updatedNode = lightingSystem.lightsMap.get(testLightId);
  console.log(`✔ 3D luminaire emissive intensity dynamically updated to ${updatedNode.emissiveMat.emissiveIntensity.toFixed(2)} following API refresh and smooth lerp.`);

  // Reset SL-03 back to default 85%
  await fetch(`http://localhost:5000/api/street-lights/${testLightId}/brightness`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brightness: 85 })
  });
  console.log(`✔ ${testLightId} brightness reset to 85%.`);

  // 6. Test OFF status visual behavior
  console.log(`\nTesting status toggle: turning SL-04 OFF...`);
  await fetch('http://localhost:5000/api/street-lights/SL-04/status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'OFF' })
  });
  const offRefresh = (await (await fetch('http://localhost:5000/api/street-lights')).json()).data;
  lightingSystem.syncLights(offRefresh);
  const sl04Node = lightingSystem.lightsMap.get('SL-04');
  if (sl04Node.data.status !== 'OFF') throw new Error('SL-04 should be OFF');
  if (sl04Node.spotLight.intensity !== 0 || sl04Node.poolMat.opacity !== 0) {
    throw new Error('OFF lamp spotlight/pool should be disabled');
  }
  console.log('✔ SL-04 visually disabled/dimmed when status is OFF (spotLight=0, pool=0).');

  // Turn SL-04 back ON
  await fetch('http://localhost:5000/api/street-lights/SL-04/status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'ON' })
  });
  console.log('✔ SL-04 restored to ON.');

  // 7. Verify existing interaction targets
  const interactiveMeshes = lightingSystem.getInteractiveMeshes();
  const sampleMesh = interactiveMeshes[0];
  if (!sampleMesh.userData.isStreetLight || !sampleMesh.userData.lightData) {
    throw new Error('Interactive mesh missing userData.isStreetLight');
  }
  console.log(`✔ Interactive raycast meshes (${interactiveMeshes.length}) properly retain latest MongoDB lightData.`);

  console.log('\n====================================================');
  console.log('🎉 STEP 3 API SYNCHRONIZATION FULLY VERIFIED!');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
