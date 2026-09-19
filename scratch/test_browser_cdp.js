/**
 * Direct Headless Edge CDP Automated Test & Measurement Script
 * Connects directly to Microsoft Edge Chromium via DevTools Protocol (CDP)
 */

import { spawn } from 'child_process';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const DEBUG_PORT = 9222;
const TARGET_URL = 'http://localhost:5000';

async function runBrowserTest() {
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

  edgeProc.on('error', (err) => {
    console.error('Edge process error:', err);
  });

  // Wait for remote debugging endpoint to be ready
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
          console.log('Connected to Edge CDP tab:', pageTab.title, wsUrl);
          break;
        }
      }
    } catch (e) {
      // Retrying
    }
  }

  if (!wsUrl) {
    edgeProc.kill();
    throw new Error('Failed to connect to Edge CDP endpoint');
  }

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const pendingRequests = new Map();
  const consoleMessages = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map((a) => a.value || a.description).join(' ');
      consoleMessages.push(`[${msg.params.type}] ${text}`);
    }
    if (msg.id && pendingRequests.has(msg.id)) {
      const { resolve, reject } = pendingRequests.get(msg.id);
      pendingRequests.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise((r) => (ws.onopen = r));

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const reqId = id++;
      pendingRequests.set(reqId, { resolve, reject });
      ws.send(JSON.stringify({ id: reqId, method, params }));
    });
  }

  // Enable Runtime and Page domains
  await sendCommand('Runtime.enable');
  await sendCommand('Page.enable');

  console.log('Waiting 6 seconds for 3D City scene to initialize & stabilize...');
  await new Promise((r) => setTimeout(r, 6000));

  async function evalJs(expr) {
    const res = await sendCommand('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    return res.result ? res.result.value : null;
  }

  // 1. Scene & HUD Telemetry
  const fpsText = await evalJs("document.getElementById('fps-display')?.textContent");
  const backendPill = await evalJs("document.getElementById('backend-status-text')?.textContent");
  const dbPill = await evalJs("document.getElementById('db-status-text')?.textContent");
  const activeLights = await evalJs("document.getElementById('lighting-active-count')?.textContent");
  const parkingAvailable = await evalJs("document.getElementById('parking-available-count')?.textContent");
  const trafficJunctions = await evalJs("document.getElementById('traffic-total-junctions')?.textContent");

  console.log('\n--- Telemetry Readout ---');
  console.log('FPS Display:', fpsText);
  console.log('Backend Status:', backendPill);
  console.log('Database Status Pill:', dbPill);
  console.log('Active Lights HUD:', activeLights);
  console.log('Parking Available:', parkingAvailable);
  console.log('Traffic Junctions:', trafficJunctions);

  // 2. Test 8 / 16 / 24 Vehicles
  console.log('\n--- Vehicle Density Testing ---');
  await evalJs("document.querySelector(\"[data-density='LOW']\")?.click()");
  await new Promise((r) => setTimeout(r, 3000));
  const fpsLow = await evalJs("document.getElementById('fps-display')?.textContent");
  console.log('FPS (8 Vehicles - LOW):', fpsLow);

  await evalJs("document.querySelector(\"[data-density='HIGH']\")?.click()");
  await new Promise((r) => setTimeout(r, 3000));
  const fpsHigh = await evalJs("document.getElementById('fps-display')?.textContent");
  console.log('FPS (24 Vehicles - HIGH):', fpsHigh);

  await evalJs("document.querySelector(\"[data-density='MEDIUM']\")?.click()");
  await new Promise((r) => setTimeout(r, 3000));
  const fpsMed = await evalJs("document.getElementById('fps-display')?.textContent");
  console.log('FPS (16 Vehicles - MEDIUM):', fpsMed);

  // 3. Test Day / Night Toggle
  console.log('\n--- Day / Night Testing ---');
  await evalJs("document.getElementById('btn-toggle-daynight')?.click()");
  await new Promise((r) => setTimeout(r, 3500));
  const fpsNight = await evalJs("document.getElementById('fps-display')?.textContent");
  const nightActiveLights = await evalJs("document.getElementById('lighting-active-count')?.textContent");
  console.log('FPS in Night Mode:', fpsNight);
  console.log('Night Mode Active Lights:', nightActiveLights);

  // Switch back to Day Mode
  await evalJs("document.getElementById('btn-toggle-daynight')?.click()");
  await new Promise((r) => setTimeout(r, 2000));

  // 4. Test Energy Analytics Modal
  console.log('\n--- Energy Analytics Modal Testing ---');
  await evalJs("document.getElementById('btn-open-energy-panel')?.click()");
  await new Promise((r) => setTimeout(r, 1500));
  const modalVisible = await evalJs("!document.getElementById('energy-analytics-modal')?.classList.contains('hidden')");
  const modalPower = await evalJs("document.getElementById('energy-kpi-power')?.textContent");
  const modalDaily = await evalJs("document.getElementById('energy-kpi-daily')?.textContent");
  const modalDailyCost = await evalJs("document.getElementById('energy-kpi-daily-cost')?.textContent");
  console.log('Energy Modal Opened:', modalVisible);
  console.log('Modal Power Demand:', modalPower);
  console.log('Modal Daily kWh:', modalDaily);
  console.log('Modal Daily Cost:', modalDailyCost);

  // Close Modal
  await evalJs("document.getElementById('energy-modal-close')?.click()");

  // 5. Console Error Audit
  console.log('\n--- Console Logs Summary ---');
  const errorLogs = consoleMessages.filter((m) => m.startsWith('[error]'));
  const warnLogs = consoleMessages.filter((m) => m.startsWith('[warning]'));
  console.log(`Total messages: ${consoleMessages.length}, Errors: ${errorLogs.length}, Warnings: ${warnLogs.length}`);
  if (errorLogs.length > 0) {
    console.log('Error logs:', errorLogs);
  } else {
    console.log('No JavaScript runtime application errors detected.');
  }

  // Cleanup
  ws.close();
  edgeProc.kill();
  console.log('\nHeadless Edge test complete.');
}

runBrowserTest().catch((err) => {
  console.error('Browser CDP Test failed:', err);
  process.exit(1);
});
