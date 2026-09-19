/**
 * Capture High-Resolution Screenshot via Edge CDP
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const DEBUG_PORT = 9230;
const TARGET_URL = 'http://localhost:5000';
const ARTIFACT_DIR = 'C:\\Users\\DELL\\.gemini\\antigravity-ide\\brain\\b008091e-aec0-4704-ad27-6aa118b1d925';
const OUTPUT_PATH = path.join(ARTIFACT_DIR, 'step11_final_polish_screenshot.png');

async function capture() {
  console.log('Capturing screenshot of SmartCity3D-Web...');

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

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
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

  // Wait 6 seconds for 3D City scene to render cleanly
  await new Promise((r) => setTimeout(r, 6000));

  const screenshot = await sendCommand('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true
  });

  if (screenshot && screenshot.data) {
    const buffer = Buffer.from(screenshot.data, 'base64');
    fs.writeFileSync(OUTPUT_PATH, buffer);
    console.log(`Screenshot successfully saved to ${OUTPUT_PATH} (${buffer.length} bytes)`);
  }

  ws.close();
  edgeProc.kill();
}

capture().catch((err) => {
  console.error('Screenshot failed:', err);
  process.exit(1);
});
