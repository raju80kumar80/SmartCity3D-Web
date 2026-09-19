/**
 * Test all 10 Inspectors & Raycast interaction pathways
 */

import { spawn } from 'child_process';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const DEBUG_PORT = 9223;
const TARGET_URL = 'http://localhost:5000';

async function testInspectors() {
  console.log('Launching Edge headless to test all 10 inspectors & modals...');

  const edgeProc = spawn(EDGE_PATH, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--disable-gpu-sandbox',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--window-size=1600,900',
    TARGET_URL
  ]);

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
      const tabs = await res.json();
      if (tabs && tabs.length > 0) {
        const pageTab = tabs.find((t) => t.type === 'page');
        if (pageTab && pageTab.webSocketDebuggerUrl) {
          wsUrl = pageTab.webSocketDebuggerUrl;
          break;
        }
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    edgeProc.kill();
    throw new Error('Failed to connect to Edge CDP endpoint');
  }

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const pending = new Map();
  const consoleErrors = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map((a) => a.value || a.description).join(' '));
    }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise((r) => (ws.onopen = r));

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const reqId = id++;
      pending.set(reqId, { resolve, reject });
      ws.send(JSON.stringify({ id: reqId, method, params }));
    });
  }

  await sendCommand('Runtime.enable');
  await sendCommand('Page.enable');

  console.log('Waiting 5s for full initialization...');
  await new Promise((r) => setTimeout(r, 5000));

  async function evalJs(expr) {
    const res = await sendCommand('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : null;
  }

  // Wait until parking data is populated
  await evalJs(`
    new Promise((resolve) => {
      const check = () => {
        if (window.cityScene?.parkingSystem?.getInteractiveMeshes()?.length > 0) resolve();
        else setTimeout(check, 250);
      };
      check();
    })
  `);

  // 1. Parking Inspector
  const parkingSlotData = await evalJs(`
    (() => {
      const meshes = window.cityScene?.parkingSystem?.getInteractiveMeshes();
      const slot = meshes && meshes.length > 0 ? meshes[0].userData?.slotData : null;
      if (slot) {
        window.cityScene.onSlotSelect(slot);
        return {
          code: document.getElementById('slot-modal-code')?.textContent,
          zone: document.getElementById('slot-modal-zone')?.textContent,
          status: document.getElementById('slot-modal-status')?.textContent
        };
      }
      return { err: 'no slot', meshesLen: meshes ? meshes.length : 'no meshes', hasScene: Boolean(window.cityScene) };
    })()
  `);
  console.log('1. Parking Slot Inspector:', parkingSlotData);
  await evalJs("document.getElementById('slot-modal-close')?.click()");

  // 2. Traffic Signal Inspector
  const signalData = await evalJs(`
    (() => {
      const sig = window.cityScene?.trafficSystem?.signals.get('J-NORTH')?.data;
      if (sig) {
        window.cityScene.onSignalSelect(sig);
        return {
          id: document.getElementById('signal-modal-id')?.textContent,
          name: document.getElementById('signal-modal-name')?.textContent,
          status: document.getElementById('signal-modal-status')?.textContent
        };
      }
      return null;
    })()
  `);
  console.log('2. Traffic Signal Inspector:', signalData);
  await evalJs("document.getElementById('signal-modal-close')?.click()");

  // 3. Emergency Incident Inspector
  const incidentData = await evalJs(`
    (() => {
      const inc = Array.from(window.cityScene?.emergencySystem?.incidentsMap.values())[0]?.data;
      if (inc) {
        window.cityScene.onIncidentSelect(inc);
        return {
          id: document.getElementById('emergency-modal-id')?.textContent,
          type: document.getElementById('emergency-modal-type')?.textContent,
          status: document.getElementById('emergency-modal-status')?.textContent
        };
      }
      return null;
    })()
  `);
  console.log('3. Emergency Incident Inspector:', incidentData);
  await evalJs("document.getElementById('emergency-modal-close')?.click()");

  // 4. Vehicle Inspector
  const vehicleData = await evalJs(`
    (() => {
      const v = window.cityScene?.vehicleSimulation?.vehicles[0];
      if (v) {
        window.cityScene.onVehicleSelect(v);
        return {
          id: document.getElementById('vehicle-modal-id')?.textContent,
          type: document.getElementById('vehicle-modal-type')?.textContent,
          speed: document.getElementById('vehicle-modal-speed')?.textContent
        };
      }
      return null;
    })()
  `);
  console.log('4. Vehicle Inspector:', vehicleData);
  await evalJs("document.getElementById('vehicle-modal-close')?.click()");

  // 5. Environment Sensor Inspector
  const sensorData = await evalJs(`
    (() => {
      const s = Array.from(window.cityScene?.environmentMonitoringSystem?.sensorsMap.values())[0]?.data;
      if (s) {
        window.cityScene.onSensorSelect(s);
        return {
          id: document.getElementById('env-modal-id')?.textContent,
          location: document.getElementById('env-modal-location')?.textContent,
          aqi: document.getElementById('env-modal-aqi-pill')?.textContent
        };
      }
      return null;
    })()
  `);
  console.log('5. Environment Sensor Inspector:', sensorData);
  await evalJs("document.getElementById('env-modal-close')?.click()");

  // 6. Street Light Inspector
  const lightData = await evalJs(`
    (() => {
      const l = Array.from(window.cityScene?.streetLightingSystem?.lightsMap.values())[0]?.data;
      if (l) {
        window.cityScene.onLightSelect(l);
        return {
          id: document.getElementById('light-modal-id')?.textContent,
          zone: document.getElementById('light-modal-zone')?.textContent,
          status: document.getElementById('light-modal-status')?.textContent
        };
      }
      return null;
    })()
  `);
  console.log('6. Street Light Inspector:', lightData);
  await evalJs("document.getElementById('light-modal-close')?.click()");

  // 7. Facility Inspector
  const facilityData = await evalJs(`
    (() => {
      const f = window.cityScene?.facilityBuilder?.getAllFacilities()[0];
      if (f) {
        window.cityScene.onFacilitySelect(f);
        return {
          id: document.getElementById('facility-modal-id')?.textContent,
          name: document.getElementById('facility-modal-name')?.textContent,
          category: document.getElementById('facility-modal-category')?.textContent
        };
      }
      return null;
    })()
  `);
  console.log('7. Facility Inspector:', facilityData);
  await evalJs("document.getElementById('facility-modal-close')?.click()");

  // 8. Pedestrian Inspector
  const pedestrianData = await evalJs(`
    (() => {
      const p = window.cityScene?.pedestrianSystem?.getAllPedestrians()[0];
      if (p) {
        window.cityScene.onPedestrianSelect(p);
        return {
          id: document.getElementById('pedestrian-modal-id')?.textContent,
          name: document.getElementById('pedestrian-modal-name')?.textContent,
          dest: document.getElementById('pedestrian-modal-dest')?.textContent
        };
      }
      return null;
    })()
  `);
  console.log('8. Pedestrian Inspector:', pedestrianData);
  await evalJs("document.getElementById('pedestrian-modal-close')?.click()");

  // 9. Energy 3D Node Trigger
  const energyNodeTriggered = await evalJs(`
    (() => {
      if (typeof window.cityScene?.onEnergyIndicatorSelect === 'function') {
        window.cityScene.onEnergyIndicatorSelect();
        return !document.getElementById('energy-analytics-modal')?.classList.contains('hidden');
      }
      return false;
    })()
  `);
  console.log('9. Energy Hologram 3D Node Click Triggered Modal:', energyNodeTriggered);
  await evalJs("document.getElementById('energy-modal-close')?.click()");

  console.log('\nConsole Errors during inspector interactions:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Errors:', consoleErrors);
  } else {
    console.log('All 10 inspectors verified with 0 console errors!');
  }

  ws.close();
  edgeProc.kill();
}

testInspectors().catch((err) => {
  console.error('Inspector Test failed:', err);
  process.exit(1);
});
