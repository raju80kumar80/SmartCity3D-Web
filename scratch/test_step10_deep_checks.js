/**
 * Deep CDP Verification for Controls, Systems, Modes, and Precision FPS
 */

import { spawn } from 'child_process';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const DEBUG_PORT = 9224;
const TARGET_URL = 'http://localhost:5000';

async function runDeepChecks() {
  console.log('Launching Edge headless with CDP on port', DEBUG_PORT, '...');

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
  const consoleMessages = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map((a) => a.value || a.description).join(' ');
      consoleMessages.push({ type: msg.params.type, text });
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

  console.log('Waiting 6 seconds for city scene to load and stabilize...');
  await new Promise((r) => setTimeout(r, 6000));

  async function evalJs(expr) {
    const res = await sendCommand('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : null;
  }

  const results = {};

  // 1. Controls verification
  console.log('--- Checking 3D Controls ---');
  results.controls = await evalJs(`
    (() => {
      const scene = window.cityScene;
      if (!scene) return { err: 'No scene' };
      
      const hasControls = Boolean(scene.controls);
      const initialCamPos = { x: scene.camera.position.x, y: scene.camera.position.y, z: scene.camera.position.z };
      
      // Test Reset View
      document.getElementById('btn-reset-view')?.click();
      const resetCamPos = { x: scene.camera.position.x, y: scene.camera.position.y, z: scene.camera.position.z };
      
      // Test Grid toggle
      const gridInitial = scene.gridHelper?.visible;
      document.getElementById('btn-toggle-grid')?.click();
      const gridToggled = scene.gridHelper?.visible;
      document.getElementById('btn-toggle-grid')?.click(); // restore
      
      // Test Auto rotate
      const autoRotateInitial = scene.controls.autoRotate;
      document.getElementById('btn-toggle-autorotate')?.click();
      const autoRotateToggled = scene.controls.autoRotate;
      document.getElementById('btn-toggle-autorotate')?.click(); // restore
      
      // Test Day / Night
      const isNightInitial = scene.lightingManager?.isNight;
      document.getElementById('btn-toggle-daynight')?.click();
      const isNightToggled = scene.lightingManager?.isNight;
      document.getElementById('btn-toggle-daynight')?.click(); // restore
      
      return {
        hasControls,
        initialCamPos,
        resetCamPos,
        gridToggled: gridToggled !== gridInitial,
        autoRotateToggled: autoRotateToggled !== autoRotateInitial,
        dayNightToggled: isNightToggled !== isNightInitial
      };
    })()
  `);
  console.log('Controls Result:', results.controls);

  // 2. Facilities 10 list verification
  console.log('--- Checking 10 Facilities ---');
  results.facilities = await evalJs(`
    (() => {
      const list = window.cityScene?.facilityBuilder?.getAllFacilities() || [];
      return {
        count: list.length,
        names: list.map(f => f.name),
        categories: list.map(f => f.category)
      };
    })()
  `);
  console.log('Facilities Result:', results.facilities);

  // 3. Environment Eco-Mist Activation / Deactivation via UI
  console.log('--- Checking Eco-Mist Toggle ---');
  results.ecoMist = await evalJs(`
    (async () => {
      const s = Array.from(window.cityScene?.environmentMonitoringSystem?.sensorsMap?.values() || [])[0]?.data;
      if (!s) return { err: 'No sensor found' };
      
      window.cityScene.onSensorSelect(s);
      const modalActive = !document.getElementById('env-modal')?.classList.contains('hidden');
      const btn = document.getElementById('btn-toggle-eco-filter');
      const initialText = btn?.textContent;
      
      // Click toggle
      btn?.click();
      await new Promise((r) => setTimeout(r, 600));
      const toggledText = btn?.textContent;
      
      // Click toggle back to restore
      btn?.click();
      await new Promise((r) => setTimeout(r, 600));
      const restoredText = btn?.textContent;
      
      document.getElementById('env-modal-close')?.click();
      return {
        sensorId: s.sensorId,
        modalActive,
        initialText,
        toggledText,
        restoredText,
        toggleSuccess: toggledText !== initialText
      };
    })()
  `);
  console.log('Eco-Mist Result:', results.ecoMist);

  // 4. Emergency Green Corridor & Resolve Flow
  console.log('--- Checking Emergency Incident Flow ---');
  results.emergency = await evalJs(`
    (async () => {
      // Wait up to 4s for emergency incidents to populate
      for (let i = 0; i < 16; i++) {
        if (window.cityScene?.emergencySystem?.incidentsMap?.size > 0) break;
        await new Promise(r => setTimeout(r, 250));
      }
      const inc = Array.from(window.cityScene?.emergencySystem?.incidentsMap?.values() || [])[0]?.data;
      if (!inc) return { err: 'No incident found' };
      
      window.cityScene.onIncidentSelect(inc);
      const modalActive = !document.getElementById('emergency-modal')?.classList.contains('hidden');
      const corridorBtn = document.getElementById('btn-toggle-override');
      const resolveBtn = document.getElementById('btn-resolve-incident');
      
      const initialCorridorText = corridorBtn?.textContent;
      // Toggle green corridor
      corridorBtn?.click();
      await new Promise((r) => setTimeout(r, 600));
      const toggledCorridorText = corridorBtn?.textContent;
      
      // Toggle back to restore
      corridorBtn?.click();
      await new Promise((r) => setTimeout(r, 600));
      
      document.getElementById('emergency-modal-close')?.click();
      return {
        incidentId: inc.incidentId,
        modalActive,
        hasResolveBtn: Boolean(resolveBtn),
        initialCorridorText,
        toggledCorridorText,
        corridorToggleSuccess: toggledCorridorText !== initialCorridorText
      };
    })()
  `);
  console.log('Emergency Flow Result:', results.emergency);

  // 5. Energy Modes (Normal, Eco, Optimize)
  console.log('--- Checking Energy Modes & Optimization ---');
  results.energyModes = await evalJs(`
    (async () => {
      document.getElementById('btn-open-energy-panel')?.click();
      await new Promise((r) => setTimeout(r, 500));
      
      const btnEco = document.getElementById('btn-energy-mode-eco');
      const btnNormal = document.getElementById('btn-energy-mode-normal');
      const btnOptimize = document.getElementById('btn-optimize-lighting');
      const modeBadge = document.getElementById('energy-mode-badge')?.textContent;
      
      // Click Eco Mode
      btnEco?.click();
      await new Promise((r) => setTimeout(r, 400));
      const ecoBadge = document.getElementById('energy-mode-badge')?.textContent;
      
      // Click Optimize Lighting
      btnOptimize?.click();
      await new Promise((r) => setTimeout(r, 400));
      const toastVisible = !document.getElementById('energy-optimization-toast')?.classList.contains('hidden');
      
      // Restore Normal Mode
      btnNormal?.click();
      await new Promise((r) => setTimeout(r, 400));
      const restoredBadge = document.getElementById('energy-mode-badge')?.textContent;
      
      document.getElementById('energy-modal-close')?.click();
      return {
        modeBadge,
        ecoBadge,
        restoredBadge,
        toastVisible,
        modeSwitchSuccess: ecoBadge?.includes('ECO')
      };
    })()
  `);
  console.log('Energy Modes Result:', results.energyModes);

  // 6. Detailed FPS Measurements
  console.log('--- Measuring Actual FPS Across Scenarios ---');
  async function measureFPS(durationMs = 2000) {
    return await evalJs(`
      new Promise((resolve) => {
        let frames = 0;
        const start = performance.now();
        function loop() {
          frames++;
          if (performance.now() - start >= ${durationMs}) {
            const elapsed = (performance.now() - start) / 1000;
            resolve(Math.round(frames / elapsed));
          } else {
            requestAnimationFrame(loop);
          }
        }
        requestAnimationFrame(loop);
      })
    `);
  }

  // Idle (16 vehicles default, daytime)
  const fpsIdle = await measureFPS(2000);
  console.log('FPS Idle (16 veh):', fpsIdle);

  // 8 Vehicles
  await evalJs("document.querySelector(\"[data-density='LOW']\")?.click()");
  await new Promise((r) => setTimeout(r, 1000));
  const fps8Veh = await measureFPS(2000);
  console.log('FPS 8 Vehicles:', fps8Veh);

  // 16 Vehicles
  await evalJs("document.querySelector(\"[data-density='MEDIUM']\")?.click()");
  await new Promise((r) => setTimeout(r, 1000));
  const fps16Veh = await measureFPS(2000);
  console.log('FPS 16 Vehicles:', fps16Veh);

  // 24 Vehicles
  await evalJs("document.querySelector(\"[data-density='HIGH']\")?.click()");
  await new Promise((r) => setTimeout(r, 1000));
  const fps24Veh = await measureFPS(2000);
  console.log('FPS 24 Vehicles:', fps24Veh);

  // 24 Pedestrians Active Check
  const pedCount = await evalJs("window.cityScene?.pedestrianSystem?.getAllPedestrians()?.length");
  const fpsPedestrians = await measureFPS(2000);
  console.log('FPS Pedestrians (24 active):', fpsPedestrians, 'count:', pedCount);

  // Night Mode
  await evalJs("document.getElementById('btn-toggle-daynight')?.click()");
  await new Promise((r) => setTimeout(r, 1500));
  const fpsNight = await measureFPS(2000);
  console.log('FPS Night Mode (Luminaires ON):', fpsNight);

  // All Systems Active in Night Mode with 24 vehicles
  const fpsAllActiveNight = await measureFPS(2000);
  console.log('FPS All Systems Active (Night + 24 veh):', fpsAllActiveNight);

  // Switch back to Day Mode & 16 vehicles
  await evalJs("document.getElementById('btn-toggle-daynight')?.click()");
  await evalJs("document.querySelector(\"[data-density='MEDIUM']\")?.click()");

  results.fps = {
    fpsIdle,
    fps8Veh,
    fps16Veh,
    fps24Veh,
    fpsPedestrians,
    fpsNight,
    fpsAllActiveNight,
    pedCount
  };

  // 7. Console error audit
  const errors = consoleMessages.filter((m) => m.type === 'error');
  const warnings = consoleMessages.filter((m) => m.type === 'warning');
  console.log('\n--- Console Audit ---');
  console.log('Total logs:', consoleMessages.length);
  console.log('Errors:', errors.length);
  console.log('Warnings:', warnings.length);

  results.console = {
    total: consoleMessages.length,
    errors,
    warnings
  };

  console.log('\n--- Final Verification Object ---');
  console.log(JSON.stringify(results, null, 2));

  ws.close();
  edgeProc.kill();
}

runDeepChecks().catch((err) => {
  console.error('Deep checks failed:', err);
  process.exit(1);
});
