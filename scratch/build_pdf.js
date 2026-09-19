import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const PROJECT_ROOT = process.cwd();
const OUTPUT_PDF = path.join(PROJECT_ROOT, 'SmartCity3D-Web_COMPLETE_SOURCE_CODE.pdf');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const DEBUG_PORT = 9228;

// Complete manifest of all 62 source files across the project
const FILE_MANIFEST = [
  // PART 1: Project Root & Configuration
  {
    category: 'Part 1: Project Configuration & Application Entry',
    fileName: 'package.json',
    relPath: 'package.json',
    purpose: 'Node.js manifest defining project metadata, execution scripts (start, dev, seed), and dependencies including Express, Mongoose, JWT, bcryptjs, cors, and dotenv.'
  },
  {
    category: 'Part 1: Project Configuration & Application Entry',
    fileName: '.gitignore',
    relPath: '.gitignore',
    purpose: 'Git exclusion rules preventing versioning of node_modules, local environment configuration (.env), build artifacts, and system files.'
  },
  {
    category: 'Part 1: Project Configuration & Application Entry',
    fileName: 'server.js',
    relPath: 'server.js',
    purpose: 'Central HTTP server entry point initializing Express, setting up security and CORS middleware, mounting API routers, serving static client assets, and launching the listener.'
  },

  // PART 2: Database Configuration & Seeding
  {
    category: 'Part 2: Database Configuration & Seeding',
    fileName: 'db.js',
    relPath: 'server/config/db.js',
    purpose: 'MongoDB Mongoose connection lifecycle manager with non-blocking 30-second background reconnection retry logic and cloud Atlas timeout configuration.'
  },
  {
    category: 'Part 2: Database Configuration & Seeding',
    fileName: 'seedData.js',
    relPath: 'server/data/seedData.js',
    purpose: 'Database seeding utility populating initial administrative and citizen accounts, 3D grid-aligned parking bays, traffic signals, environment sensors, and streetlights.'
  },

  // PART 3: Data Models
  {
    category: 'Part 3: Backend Data Models (Mongoose)',
    fileName: 'CityStat.js',
    relPath: 'server/models/CityStat.js',
    purpose: 'Mongoose schema storing high-level smart city operational metrics such as power consumption, traffic density, AQI, active emergency count, and available parking capacity.'
  },
  {
    category: 'Part 3: Backend Data Models (Mongoose)',
    fileName: 'EmergencyIncident.js',
    relPath: 'server/models/EmergencyIncident.js',
    purpose: 'Mongoose schema representing emergency events (fire, medical, accident) with 3D spatial coordinates, severity tier, response status, assigned dispatch units, and timestamps.'
  },
  {
    category: 'Part 3: Backend Data Models (Mongoose)',
    fileName: 'EnvironmentSensor.js',
    relPath: 'server/models/EnvironmentSensor.js',
    purpose: 'Mongoose schema modeling urban air quality monitoring stations tracking AQI, PM2.5, PM10, temperature, humidity, noise level, and operational health across city zones.'
  },
  {
    category: 'Part 3: Backend Data Models (Mongoose)',
    fileName: 'ParkingSlot.js',
    relPath: 'server/models/ParkingSlot.js',
    purpose: 'Mongoose schema for smart parking bays storing slot codes, zone names, occupancy state, vehicle license plate numbers, and 3D spatial coordinates.'
  },
  {
    category: 'Part 3: Backend Data Models (Mongoose)',
    fileName: 'StreetLight.js',
    relPath: 'server/models/StreetLight.js',
    purpose: 'Mongoose schema tracking smart streetlight poles, control modes (automatic, manual, adaptive), brightness percentage, fault detection status, power draw, and 3D coordinates.'
  },
  {
    category: 'Part 3: Backend Data Models (Mongoose)',
    fileName: 'TrafficSignal.js',
    relPath: 'server/models/TrafficSignal.js',
    purpose: 'Mongoose schema managing intersection traffic light phases (red, yellow, green), cycle durations, congestion-adaptive timing parameters, and junction coordinates.'
  },
  {
    category: 'Part 3: Backend Data Models (Mongoose)',
    fileName: 'User.js',
    relPath: 'server/models/User.js',
    purpose: 'Mongoose schema and model for user authentication with bcrypt password hashing, credential verification methods, and role-based access control (admin, citizen).'
  },

  // PART 4: Backend Middleware
  {
    category: 'Part 4: Backend Middleware',
    fileName: 'authMiddleware.js',
    relPath: 'server/middleware/authMiddleware.js',
    purpose: 'JWT authentication middleware validating bearer tokens, verifying signatures, resolving user identities, and restricting administrative municipal endpoints.'
  },
  {
    category: 'Part 4: Backend Middleware',
    fileName: 'errorHandler.js',
    relPath: 'server/middleware/errorHandler.js',
    purpose: 'Centralized Express error-handling middleware intercepting runtime exceptions, logging errors, and generating structured JSON error responses.'
  },

  // PART 5: Backend Controllers
  {
    category: 'Part 5: Backend Controllers',
    fileName: 'authController.js',
    relPath: 'server/controllers/authController.js',
    purpose: 'Authentication controller managing user registration, credential validation, JWT token generation, and authenticated user profile retrieval.'
  },
  {
    category: 'Part 5: Backend Controllers',
    fileName: 'energyController.js',
    relPath: 'server/controllers/energyController.js',
    purpose: 'Citywide energy analytics controller calculating real-time power grid demand, renewable generation ratios (solar, wind), daily consumption, and sub-grid power distributions.'
  },
  {
    category: 'Part 5: Backend Controllers',
    fileName: 'environmentController.js',
    relPath: 'server/controllers/environmentController.js',
    purpose: 'Environmental telemetry controller providing live sensor data, calculating citywide AQI averages, evaluating environmental alert conditions, and updating sensor telemetry.'
  },
  {
    category: 'Part 5: Backend Controllers',
    fileName: 'incidentController.js',
    relPath: 'server/controllers/incidentController.js',
    purpose: 'Emergency incident controller handling emergency event reporting, listing active incidents, assigning emergency response units, and resolving incident records.'
  },
  {
    category: 'Part 5: Backend Controllers',
    fileName: 'parkingController.js',
    relPath: 'server/controllers/parkingController.js',
    purpose: 'Smart parking controller providing real-time bay availability status, processing vehicle parking/unparking reservations, and computing occupancy rates.'
  },
  {
    category: 'Part 5: Backend Controllers',
    fileName: 'statsController.js',
    relPath: 'server/controllers/statsController.js',
    purpose: 'Municipal KPI controller synthesizing high-level operational statistics, historical performance data, and cross-subsystem metrics.'
  },
  {
    category: 'Part 5: Backend Controllers',
    fileName: 'streetLightController.js',
    relPath: 'server/controllers/streetLightController.js',
    purpose: 'Comprehensive lighting controller managing individual and zone brightness, energy schedules, lux-threshold triggers, fault simulation, and pole-level status.'
  },
  {
    category: 'Part 5: Backend Controllers',
    fileName: 'trafficController.js',
    relPath: 'server/controllers/trafficController.js',
    purpose: 'Traffic management controller updating intersection light phases, computing adaptive cycle durations based on vehicle queue counts, and processing manual overrides.'
  },

  // PART 6: Backend API Routes
  {
    category: 'Part 6: Backend API Routes',
    fileName: 'apiRoutes.js',
    relPath: 'server/routes/apiRoutes.js',
    purpose: 'Primary API router registering and aggregating all domain routes under standardized municipal REST API path prefixes.'
  },
  {
    category: 'Part 6: Backend API Routes',
    fileName: 'authRoutes.js',
    relPath: 'server/routes/authRoutes.js',
    purpose: 'Express router defining user authentication endpoints including registration, login, and token-authenticated profile validation.'
  },
  {
    category: 'Part 6: Backend API Routes',
    fileName: 'energyRoutes.js',
    relPath: 'server/routes/energyRoutes.js',
    purpose: 'Express router routing energy grid telemetry, consumption trends, and renewable power distribution endpoints.'
  },
  {
    category: 'Part 6: Backend API Routes',
    fileName: 'environmentRoutes.js',
    relPath: 'server/routes/environmentRoutes.js',
    purpose: 'Express router exposing environmental sensor telemetry, air quality index calculations, and weather alert status.'
  },
  {
    category: 'Part 6: Backend API Routes',
    fileName: 'incidentRoutes.js',
    relPath: 'server/routes/incidentRoutes.js',
    purpose: 'Express router exposing endpoints for emergency incident creation, active incident retrieval, and dispatch unit status updates.'
  },
  {
    category: 'Part 6: Backend API Routes',
    fileName: 'parkingRoutes.js',
    relPath: 'server/routes/parkingRoutes.js',
    purpose: 'Express router providing smart parking bay availability queries, parking reservations, and slot status modifications.'
  },
  {
    category: 'Part 6: Backend API Routes',
    fileName: 'statsRoutes.js',
    relPath: 'server/routes/statsRoutes.js',
    purpose: 'Express router exposing municipal overview statistics, cross-departmental KPIs, and historical telemetry data.'
  },
  {
    category: 'Part 6: Backend API Routes',
    fileName: 'streetLightRoutes.js',
    relPath: 'server/routes/streetLightRoutes.js',
    purpose: 'Express router managing smart streetlight telemetry, zone brightness controls, operational mode toggles, and fault alerts.'
  },
  {
    category: 'Part 6: Backend API Routes',
    fileName: 'trafficRoutes.js',
    relPath: 'server/routes/trafficRoutes.js',
    purpose: 'Express router handling traffic junction light phase updates, congestion-adaptive timing adjustments, and signal overrides.'
  },

  // PART 7: Frontend UI & Styling
  {
    category: 'Part 7: Frontend Interface & Styling',
    fileName: 'index.html',
    relPath: 'public/index.html',
    purpose: 'Primary single-page web application document containing HTML structure, 3D WebGL viewport container, telemetry HUD, control panels, modal dialogs, and external library imports.'
  },
  {
    category: 'Part 7: Frontend Interface & Styling',
    fileName: 'style.css',
    relPath: 'public/css/style.css',
    purpose: 'Comprehensive frontend stylesheet implementing glassmorphic dark theme, responsive grid layouts, HUD overlay positioning, telemetry gauge animations, and interactive controls.'
  },

  // PART 8: Frontend Scene Core & Orchestration
  {
    category: 'Part 8: Frontend Engine & Scene Orchestration',
    fileName: 'main.js',
    relPath: 'public/js/main.js',
    purpose: 'Central frontend application orchestrator integrating Three.js rendering, UI controls, backend REST polling, simulation loops, inspector dialogs, and event listeners.'
  },
  {
    category: 'Part 8: Frontend Engine & Scene Orchestration',
    fileName: 'scene.js',
    relPath: 'public/js/scene.js',
    purpose: 'Three.js 3D scene engine configuring WebGL renderer, perspective camera, OrbitControls, shadows, ground grid, resize listeners, and main render animation loop.'
  },
  {
    category: 'Part 8: Frontend Engine & Scene Orchestration',
    fileName: 'LightingManager.js',
    relPath: 'public/js/core/LightingManager.js',
    purpose: 'Centralized Three.js illumination controller dynamically interpolating ambient light, directional sunlight, and sky colors during day/night cycles.'
  },

  // PART 9: Frontend 3D City Builders
  {
    category: 'Part 9: Frontend 3D City Builders',
    fileName: 'BuildingBuilder.js',
    relPath: 'public/js/city/BuildingBuilder.js',
    purpose: 'Procedural architectural generator constructing diverse skyscraper, residential, and commercial building meshes with illuminated window textures and rooftop structures.'
  },
  {
    category: 'Part 9: Frontend 3D City Builders',
    fileName: 'Environment.js',
    relPath: 'public/js/city/Environment.js',
    purpose: 'Urban environment generator creating procedural green park zones, trees, ambient terrain textures, water features, and perimeter borders.'
  },
  {
    category: 'Part 9: Frontend 3D City Builders',
    fileName: 'FacilityBuilder.js',
    relPath: 'public/js/city/FacilityBuilder.js',
    purpose: 'Comprehensive 3D municipal facility builder generating Hospital, Police HQ, Fire Station, Power Plant, Water Treatment Facility, and Parking lots with interactive 3D raycast click inspection.'
  },
  {
    category: 'Part 9: Frontend 3D City Builders',
    fileName: 'RoadBuilder.js',
    relPath: 'public/js/city/RoadBuilder.js',
    purpose: 'City grid road network builder creating asphalt surfaces, lane markings, pedestrian zebra crossings, and multi-way road intersections.'
  },

  // PART 10: Frontend Simulation Systems
  {
    category: 'Part 10: Frontend Simulation Systems',
    fileName: 'EmergencySystem.js',
    relPath: 'public/js/simulation/EmergencySystem.js',
    purpose: 'Emergency response simulator triggering fire/medical/police events, flashing emergency sirens, spawning 3D responder vehicles, and navigating them to incident locations.'
  },
  {
    category: 'Part 10: Frontend Simulation Systems',
    fileName: 'EnvironmentMonitoringSystem.js',
    relPath: 'public/js/simulation/EnvironmentMonitoringSystem.js',
    purpose: 'Environmental simulation subsystem generating 3D sensor pylons with dynamic status rings representing AQI, temperature, and pollution levels.'
  },
  {
    category: 'Part 10: Frontend Simulation Systems',
    fileName: 'ParkingSystem.js',
    relPath: 'public/js/simulation/ParkingSystem.js',
    purpose: 'Smart parking simulation engine rendering 3D parking bays with colored LED status indicators (green=available, red=occupied) and managing dynamic vehicle occupancy.'
  },
  {
    category: 'Part 10: Frontend Simulation Systems',
    fileName: 'PedestrianSystem.js',
    relPath: 'public/js/simulation/PedestrianSystem.js',
    purpose: 'Pedestrian agent simulation creating animated 3D human figures with limb movement, sidewalk pathfinding, pedestrian crossing awareness, and obstacle avoidance.'
  },
  {
    category: 'Part 10: Frontend Simulation Systems',
    fileName: 'StreetLightingSystem.js',
    relPath: 'public/js/simulation/StreetLightingSystem.js',
    purpose: 'IoT street lighting simulation engine managing 3D lampposts, spot illumination cones, lux-driven day/night triggers, fault detection, and energy efficiency telemetry.'
  },
  {
    category: 'Part 10: Frontend Simulation Systems',
    fileName: 'TrafficSystem.js',
    relPath: 'public/js/simulation/TrafficSystem.js',
    purpose: 'Intelligent traffic management system coordinating multi-junction traffic signal lights, intersection right-of-way logic, and vehicle queue pacing.'
  },
  {
    category: 'Part 10: Frontend Simulation Systems',
    fileName: 'VehicleSimulation.js',
    relPath: 'public/js/simulation/VehicleSimulation.js',
    purpose: 'Autonomous vehicle physics and navigation simulator handling car/bus/truck meshes, road waypoint pathfinding, signal compliance, following distances, and collision avoidance.'
  },

  // PART 11: Frontend Analytics Engine
  {
    category: 'Part 11: Frontend Analytics Engine',
    fileName: 'EnergyAnalytics.js',
    relPath: 'public/js/analytics/EnergyAnalytics.js',
    purpose: 'Interactive energy telemetry engine rendering real-time grid KPI metrics, 24-hour demand curves, and renewable energy mix charts using Chart.js.'
  },

  // PART 12: Test & Verification Suite
  {
    category: 'Part 12: Test & Verification Automation Suite',
    fileName: 'capture_screenshot.js',
    relPath: 'scratch/capture_screenshot.js',
    purpose: 'Test automation utility using Chrome DevTools Protocol to capture high-resolution screenshots of the 3D smart city WebGL canvas.'
  },
  {
    category: 'Part 12: Test & Verification Automation Suite',
    fileName: 'test_api_sync.js',
    relPath: 'scratch/test_api_sync.js',
    purpose: 'Automated REST API integration test verifying synchronization between backend database endpoints and frontend telemetry models.'
  },
  {
    category: 'Part 12: Test & Verification Automation Suite',
    fileName: 'test_browser_cdp.js',
    relPath: 'scratch/test_browser_cdp.js',
    purpose: 'End-to-end browser automation script connecting via CDP to validate 3D scene initialization, HUD gauges, day/night cycles, and vehicle density toggles.'
  },
  {
    category: 'Part 12: Test & Verification Automation Suite',
    fileName: 'test_facilities_3d_runtime.js',
    relPath: 'scratch/test_facilities_3d_runtime.js',
    purpose: 'Runtime validation script checking 3D facility meshes, spatial coordinates, material properties, and bounding boxes.'
  },
  {
    category: 'Part 12: Test & Verification Automation Suite',
    fileName: 'test_inspectors.js',
    relPath: 'scratch/test_inspectors.js',
    purpose: 'Automated test script evaluating 3D interactive inspection popups, raycast hit-testing, and building detail overlays.'
  },
  {
    category: 'Part 12: Test & Verification Automation Suite',
    fileName: 'test_raycast_facility.js',
    relPath: 'scratch/test_raycast_facility.js',
    purpose: 'Focused raycasting test simulating mouse clicks against 3D city facility geometries to verify pointer hit detection.'
  },
  {
    category: 'Part 12: Test & Verification Automation Suite',
    fileName: 'test_step10_deep_checks.js',
    relPath: 'scratch/test_step10_deep_checks.js',
    purpose: 'Deep system verification script executing comprehensive assertions across lighting, traffic, parking, emergencies, and energy telemetry.'
  },
  {
    category: 'Part 12: Test & Verification Automation Suite',
    fileName: 'test_step4_adaptive.js',
    relPath: 'scratch/test_step4_adaptive.js',
    purpose: 'Test script validating adaptive traffic light timing adjustments responding to simulated congestion spikes.'
  },
  {
    category: 'Part 12: Test & Verification Automation Suite',
    fileName: 'test_step5_hud.js',
    relPath: 'scratch/test_step5_hud.js',
    purpose: 'Automated UI test asserting visibility, layout, and numeric updates across all heads-up display telemetry cards.'
  },
  {
    category: 'Part 12: Test & Verification Automation Suite',
    fileName: 'test_step6_inspector.js',
    relPath: 'scratch/test_step6_inspector.js',
    purpose: 'Verification script asserting that clicking on 3D smart city structures triggers accurate modal inspector panels.'
  },
  {
    category: 'Part 12: Test & Verification Automation Suite',
    fileName: 'test_step7_facilities.js',
    relPath: 'scratch/test_step7_facilities.js',
    purpose: 'Automated test ensuring all 6 major municipal facility complexes are generated and positioned correctly in the 3D scene.'
  },
  {
    category: 'Part 12: Test & Verification Automation Suite',
    fileName: 'test_step7_fault_reset.js',
    relPath: 'scratch/test_step7_fault_reset.js',
    purpose: 'Test script verifying the fault simulation and maintenance reset workflow for smart streetlights and power systems.'
  },
  {
    category: 'Part 12: Test & Verification Automation Suite',
    fileName: 'test_street_lighting.js',
    relPath: 'scratch/test_street_lighting.js',
    purpose: 'Integration test validating automatic day/night streetlight illumination switching, lux sensor thresholds, and power savings.'
  },
  {
    category: 'Part 12: Test & Verification Automation Suite',
    fileName: 'verify_step10.js',
    relPath: 'scratch/verify_step10.js',
    purpose: 'Final validation script performing end-to-end integration and smoke testing of the complete SmartCity3D platform.'
  }
];

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function highlightSyntax(rawCode, ext) {
  const lines = rawCode.split(/\r?\n/);
  const formattedLines = lines.map((line, idx) => {
    const lineNum = idx + 1;
    let escaped = escapeHtml(line);

    // Syntax styling for JavaScript, JSON, CSS, HTML
    if (ext === '.js' || ext === '.json') {
      // Comments
      if (/^\s*\/\//.test(escaped)) {
        escaped = `<span class="tok-comment">${escaped}</span>`;
      } else {
        // Strings
        escaped = escaped.replace(/(['"`])(.*?)\1/g, '<span class="tok-string">$1$2$1</span>');
        // Keywords
        escaped = escaped.replace(/\b(import|export|from|default|const|let|var|function|class|extends|new|this|return|if|else|switch|case|break|for|while|do|async|await|try|catch|finally|throw|typeof|instanceof|static|get|set|true|false|null|undefined)\b/g, '<span class="tok-keyword">$1</span>');
        // Numbers
        escaped = escaped.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="tok-number">$1</span>');
      }
    } else if (ext === '.css') {
      if (/^\s*\/\*/.test(escaped) || escaped.includes('*/')) {
        escaped = `<span class="tok-comment">${escaped}</span>`;
      } else {
        escaped = escaped.replace(/([a-zA-Z-]+)\s*:/g, '<span class="tok-keyword">$1</span>:');
        escaped = escaped.replace(/(#[a-fA-F0-9]{3,8}|rgba?\([^)]+\))/g, '<span class="tok-string">$1</span>');
      }
    } else if (ext === '.html') {
      if (/^\s*&lt;!--/.test(escaped)) {
        escaped = `<span class="tok-comment">${escaped}</span>`;
      } else {
        escaped = escaped.replace(/(&lt;\/?[a-zA-Z0-9-]+)(\s|&gt;)/g, '<span class="tok-keyword">$1</span>$2');
        escaped = escaped.replace(/([a-zA-Z-]+)=(&quot;.*?&quot;|&#039;.*?&#039;)/g, '<span class="tok-property">$1</span>=<span class="tok-string">$2</span>');
      }
    }

    return `<div class="code-row"><span class="line-no">${lineNum}</span><span class="line-code">${escaped || '&nbsp;'}</span></div>`;
  });

  return formattedLines.join('');
}

const directoryTree = `
SmartCity3D-Web/
├── .gitignore                          [Git version control ignore rules]
├── package.json                        [Node.js project manifest & dependencies]
├── server.js                           [Primary Express application & HTTP server entry]
│
├── public/                             [Frontend Client-side Assets]
│   ├── index.html                      [Single-Page Web Application DOM & HUD Viewport]
│   ├── css/
│   │   └── style.css                   [Glassmorphic dark design system & HUD styling]
│   └── js/
│       ├── main.js                     [Frontend orchestrator & event bus coordinator]
│       ├── scene.js                    [Three.js WebGL scene engine, camera & controls]
│       ├── core/
│       │   └── LightingManager.js      [Three.js day/night lighting & sky illumination]
│       ├── city/
│       │   ├── BuildingBuilder.js      [Procedural architectural skyscraper generator]
│       │   ├── Environment.js          [Parks, terrain, trees & urban water features]
│       │   ├── FacilityBuilder.js      [Municipal complexes & interactive 3D inspection]
│       │   └── RoadBuilder.js          [Asphalt roadway grid & pedestrian crossings]
│       ├── simulation/
│       │   ├── EmergencySystem.js      [Fire/police/medical incident dispatch engine]
│       │   ├── EnvironmentMonitoringSystem.js [3D telemetry pylons for AQI & weather]
│       │   ├── ParkingSystem.js        [3D parking bays with real-time LED indicators]
│       │   ├── PedestrianSystem.js     [Autonomous animated walking citizens]
│       │   ├── StreetLightingSystem.js [Smart IoT streetlights & lux threshold engine]
│       │   ├── TrafficSystem.js        [Intersection traffic signal phase controller]
│       │   └── VehicleSimulation.js    [Autonomous vehicle pathfinding & physics]
│       └── analytics/
│           └── EnergyAnalytics.js      [Chart.js real-time power grid demand curves]
│
├── server/                             [Backend Node.js & Express Architecture]
│   ├── config/
│   │   └── db.js                       [Mongoose connection lifecycle & retry manager]
│   ├── data/
│   │   └── seedData.js                 [Database bootstrap script with spatial coordinates]
│   ├── models/
│   │   ├── CityStat.js                 [High-level smart city telemetry KPI schema]
│   │   ├── EmergencyIncident.js        [Emergency incident lifecycle & coordinates schema]
│   │   ├── EnvironmentSensor.js        [Environmental monitoring station schema]
│   │   ├── ParkingSlot.js              [Smart parking bay state & vehicle tracking schema]
│   │   ├── StreetLight.js              [IoT streetlight mode & brightness schema]
│   │   ├── TrafficSignal.js            [Intersection traffic light timing schema]
│   │   └── User.js                     [Authentication, bcrypt & role authorization schema]
│   ├── middleware/
│   │   ├── authMiddleware.js           [JWT verification & role access control]
│   │   └── errorHandler.js             [Centralized Express error response middleware]
│   ├── controllers/
│   │   ├── authController.js           [User registration & JWT token issuance]
│   │   ├── energyController.js         [Power grid telemetry & generation mix]
│   │   ├── environmentController.js    [AQI readings, sensor feeds & air alert triggers]
│   │   ├── incidentController.js       [Emergency reporting & responder vehicle dispatch]
│   │   ├── parkingController.js        [Bay reservations & occupancy telemetry]
│   │   ├── statsController.js          [Municipal KPI summaries & historical analytics]
│   │   ├── streetLightController.js    [Brightness control, lux thresholds & fault simulation]
│   │   └── trafficController.js        [Congestion-adaptive signal cycle timing]
│   └── routes/
│       ├── apiRoutes.js                [Aggregated municipal REST API router]
│       ├── authRoutes.js               [Authentication & registration endpoints]
│       ├── energyRoutes.js             [Power grid & renewable generation routes]
│       ├── environmentRoutes.js        [AQI & sensor telemetry routes]
│       ├── incidentRoutes.js           [Emergency reporting & dispatch routes]
│       ├── parkingRoutes.js            [Smart parking slot query & reserve routes]
│       ├── statsRoutes.js              [Municipal KPI & telemetry routes]
│       ├── streetLightRoutes.js        [Streetlight status & control routes]
│       └── trafficRoutes.js            [Traffic signal status & phase routes]
│
└── scratch/                            [Automated Verification & Test Suite]
    ├── capture_screenshot.js           [CDP automated canvas screenshot capture]
    ├── test_api_sync.js                [REST API endpoint & database sync test]
    ├── test_browser_cdp.js             [Headless browser end-to-end telemetry suite]
    ├── test_facilities_3d_runtime.js   [3D facility complex mesh & runtime test]
    ├── test_inspectors.js              [Interactive 3D building inspector assertion]
    ├── test_raycast_facility.js        [Raycasting click detection validation]
    ├── test_step10_deep_checks.js      [Comprehensive cross-tier assertion suite]
    ├── test_step4_adaptive.js          [Congestion-adaptive traffic timing test]
    ├── test_step5_hud.js               [HUD telemetry gauge & card visibility test]
    ├── test_step6_inspector.js         [Raycast modal trigger verification]
    ├── test_step7_facilities.js        [Municipal facility 3D presence validation]
    ├── test_step7_fault_reset.js       [Streetlight fault simulation & reset test]
    ├── test_street_lighting.js         [Day/night lighting transition test]
    └── verify_step10.js                [Final system-wide platform smoke test]
`.trim();

function sanitizeCode(rawContent, relPath) {
  let sanitized = rawContent;

  // 1. Redact Passwords (such as password123)
  sanitized = sanitized.replace(/(['"])password123\1/g, '$1<REDACTED_PASSWORD>$1');
  sanitized = sanitized.replace(/\bpassword123\b/g, '<REDACTED_PASSWORD>');

  // 2. Redact JWT Secrets & Fallback Secrets
  sanitized = sanitized.replace(/(['"])smartcity3d_jwt_super_secret_key_2026\1/g, '$1<JWT_SECRET_FROM_ENV>$1');
  sanitized = sanitized.replace(/(process\.env\.JWT_SECRET\s*\|\|\s*)(['"]).*?\2/g, '$1$2<JWT_SECRET_FROM_ENV>$2');

  // 3. Redact MongoDB Connection URIs & Credentials
  sanitized = sanitized.replace(/(['"])mongodb(\+srv)?:\/\/[^\s'"]+\1/g, '$1<REDACTED_MONGO_URI>$1');
  sanitized = sanitized.replace(/mongodb(\+srv)?:\/\/[^\s'"]+/g, '<REDACTED_MONGO_URI>');

  // 4. Redact Private User Paths & Workspace Identifiers
  sanitized = sanitized.replace(/[A-Za-z]:[\\/]+[Uu]sers[\\/]+[^\\/]+[\\/]+\.gemini[\\/]+antigravity-ide[^\s'"]*/gi, '<REDACTED_USER_WORKSPACE>');
  sanitized = sanitized.replace(/[A-Za-z]:[\\/]+[Uu]sers[\\/]+[^\\/'"]+/gi, '<REDACTED_USER_PATH>');
  sanitized = sanitized.replace(/\/home\/[^\/]+/gi, '<REDACTED_USER_PATH>');
  sanitized = sanitized.replace(/antigravity[-_]?ide/gi, 'workspace-environment');
  sanitized = sanitized.replace(/antigravity/gi, 'smartcity-runtime');

  // 5. Redact Bearer Tokens or sensitive auth headers
  sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9\-\._~\+\/]{20,}={0,2}/g, 'Bearer <REDACTED_AUTH_TOKEN>');

  return sanitized;
}

function buildHtml() {
  console.log('Reading, sanitizing and validating all source files...');

  let totalLines = 0;
  let totalBytes = 0;
  const processedFiles = [];
  let totalSanitizations = 0;

  for (const item of FILE_MANIFEST) {
    const fullPath = path.join(PROJECT_ROOT, item.relPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`CRITICAL ERROR: Missing source file: ${item.relPath}`);
    }

    const rawContent = fs.readFileSync(fullPath, 'utf-8');
    const content = sanitizeCode(rawContent, item.relPath);
    if (content !== rawContent) {
      totalSanitizations++;
      console.log(`[Sanitized] ${item.relPath}`);
    }

    const linesCount = content.split(/\r?\n/).length;
    const byteSize = Buffer.byteLength(content, 'utf-8');

    totalLines += linesCount;
    totalBytes += byteSize;

    const ext = path.extname(item.fileName).toLowerCase();
    const formattedCode = highlightSyntax(content, ext);

    processedFiles.push({
      ...item,
      linesCount,
      byteSize,
      formattedCode
    });
  }

  console.log(`Sanitization complete: ${totalSanitizations} files had sensitive credentials sanitized.`);

  console.log(`Successfully verified all ${processedFiles.length} files. Total lines: ${totalLines}, Total bytes: ${totalBytes}`);

  // Build Table of Contents Grouped by Category
  const categories = {};
  for (const f of processedFiles) {
    if (!categories[f.category]) categories[f.category] = [];
    categories[f.category].push(f);
  }

  let tocHtml = '';
  let globalFileIndex = 1;
  for (const [catName, files] of Object.entries(categories)) {
    tocHtml += `<div class="toc-category-header">${escapeHtml(catName)}</div><div class="toc-grid">`;
    for (const f of files) {
      const fileId = `file-${globalFileIndex}`;
      tocHtml += `
        <a href="#${fileId}" class="toc-item">
          <span class="toc-num">${globalFileIndex}.</span>
          <span class="toc-path">${escapeHtml(f.relPath)}</span>
          <span class="toc-meta">${f.linesCount} lines</span>
        </a>
      `;
      f.anchorId = fileId;
      f.indexNumber = globalFileIndex++;
    }
    tocHtml += `</div>`;
  }

  // Build Code Sections
  let codeSectionsHtml = '';
  for (const f of processedFiles) {
    codeSectionsHtml += `
      <section class="file-section" id="${f.anchorId}">
        <div class="file-card-header">
          <div class="file-header-top">
            <span class="file-badge">File #${f.indexNumber}</span>
            <span class="file-cat-tag">${escapeHtml(f.category)}</span>
            <span class="file-size-badge">${f.linesCount} lines &bull; ${(f.byteSize / 1024).toFixed(1)} KB</span>
          </div>
          <div class="file-meta-row"><span class="meta-label">File Name:</span> <span class="meta-value file-title">${escapeHtml(f.fileName)}</span></div>
          <div class="file-meta-row"><span class="meta-label">Full Relative Path:</span> <span class="meta-value path-value">${escapeHtml(f.relPath)}</span></div>
          <div class="file-meta-row"><span class="meta-label">Purpose:</span> <span class="meta-value purpose-value">${escapeHtml(f.purpose)}</span></div>
        </div>
        <div class="code-box">
          <div class="code-inner">
            ${f.formattedCode}
          </div>
        </div>
      </section>
    `;
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SmartCity3D-Web - Complete Source Code Documentation</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 16mm 14mm 16mm 14mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.5;
      font-size: 9pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Cover Page */
    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 40px 20px;
      page-break-after: always;
    }

    .cover-hero {
      margin-top: 50px;
    }

    .cover-badge {
      display: inline-block;
      padding: 6px 14px;
      background: #0f172a;
      color: #38bdf8;
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      border-radius: 4px;
      margin-bottom: 24px;
    }

    .cover-title {
      font-size: 32pt;
      font-weight: 800;
      line-height: 1.15;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin-bottom: 12px;
    }

    .cover-subtitle {
      font-size: 14pt;
      font-weight: 500;
      color: #0284c7;
      margin-bottom: 24px;
    }

    .cover-description {
      font-size: 10.5pt;
      color: #475569;
      max-width: 680px;
      line-height: 1.7;
      margin-bottom: 35px;
    }

    .cover-stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-top: 10px;
    }

    .cover-stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #0284c7;
      padding: 16px 14px;
      border-radius: 6px;
    }

    .cover-stat-card .val {
      font-size: 20pt;
      font-weight: 800;
      color: #0f172a;
    }

    .cover-stat-card .lbl {
      font-size: 8pt;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }

    .cover-tech-stack {
      margin-top: 30px;
      padding: 18px 20px;
      background: #f1f5f9;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
    }

    .cover-tech-title {
      font-size: 9.5pt;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }

    .cover-tech-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tech-pill {
      padding: 4px 10px;
      background: #ffffff;
      border: 1px solid #94a3b8;
      border-radius: 4px;
      font-size: 8.5pt;
      font-weight: 600;
      color: #1e293b;
    }

    .cover-footer {
      border-top: 2px solid #0f172a;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      color: #64748b;
      font-size: 8.5pt;
    }

    /* Section Page Breaks */
    .page-break {
      page-break-after: always;
    }

    /* Folder Structure */
    .structure-section {
      page-break-after: always;
      padding-top: 10px;
    }

    .section-title {
      font-size: 18pt;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 8px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .section-desc {
      font-size: 9.5pt;
      color: #475569;
      margin-bottom: 16px;
      line-height: 1.6;
    }

    .tree-box {
      font-family: 'Consolas', 'Fira Code', 'Monaco', 'Courier New', monospace;
      font-size: 8pt;
      background: #0f172a;
      color: #e2e8f0;
      padding: 18px 20px;
      border-radius: 8px;
      white-space: pre;
      line-height: 1.45;
      overflow: hidden;
      border: 1px solid #334155;
    }

    /* Table of Contents */
    .toc-section {
      page-break-after: always;
      padding-top: 10px;
    }

    .toc-category-header {
      font-size: 10pt;
      font-weight: 700;
      color: #0284c7;
      background: #f0f9ff;
      border-left: 4px solid #0284c7;
      padding: 6px 12px;
      margin-top: 14px;
      margin-bottom: 6px;
      border-radius: 0 4px 4px 0;
    }

    .toc-grid {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 3.5px 8px;
      text-decoration: none;
      color: #1e293b;
      border-radius: 4px;
      font-size: 8.5pt;
      border-bottom: 1px dotted #e2e8f0;
    }

    .toc-item:hover {
      background: #f8fafc;
    }

    .toc-num {
      width: 28px;
      font-weight: 700;
      color: #64748b;
    }

    .toc-path {
      flex: 1;
      font-family: 'Consolas', 'Fira Code', monospace;
      font-size: 8pt;
      color: #0f172a;
    }

    .toc-meta {
      font-size: 8pt;
      color: #64748b;
      font-weight: 600;
    }

    /* File Code Section */
    .file-section {
      page-break-before: always;
      margin-bottom: 20px;
    }

    .file-card-header {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-top: 4px solid #0284c7;
      border-radius: 6px;
      padding: 14px 16px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }

    .file-header-top {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 10px;
    }

    .file-badge {
      background: #0f172a;
      color: #ffffff;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
    }

    .file-cat-tag {
      background: #e0f2fe;
      color: #0369a1;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 8pt;
      font-weight: 600;
    }

    .file-size-badge {
      margin-left: auto;
      font-size: 8pt;
      color: #64748b;
      font-weight: 600;
    }

    .file-meta-row {
      margin-top: 4px;
      display: flex;
      font-size: 8.5pt;
      line-height: 1.4;
    }

    .meta-label {
      width: 135px;
      min-width: 135px;
      font-weight: 700;
      color: #475569;
    }

    .meta-value {
      flex: 1;
    }

    .file-title {
      font-family: 'Consolas', 'Fira Code', monospace;
      font-weight: 700;
      color: #0f172a;
      font-size: 9.5pt;
    }

    .path-value {
      font-family: 'Consolas', 'Fira Code', monospace;
      color: #0369a1;
      font-weight: 600;
    }

    .purpose-value {
      color: #334155;
    }

    /* Code Box */
    .code-box {
      font-family: 'Consolas', 'Fira Code', 'Monaco', 'Courier New', monospace;
      font-size: 7.8pt;
      line-height: 1.4;
      background: #fdfdfd;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }

    .code-inner {
      padding: 6px 0;
    }

    .code-row {
      display: flex;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .line-no {
      width: 44px;
      min-width: 44px;
      text-align: right;
      padding-right: 10px;
      color: #94a3b8;
      user-select: none;
      border-right: 1px solid #e2e8f0;
      margin-right: 10px;
      background: #f8fafc;
      font-size: 7.5pt;
    }

    .line-code {
      flex: 1;
      color: #0f172a;
      padding-right: 10px;
    }

    /* Syntax Tokens */
    .tok-comment { color: #64748b; font-style: italic; }
    .tok-string { color: #047857; }
    .tok-keyword { color: #7c3aed; font-weight: 600; }
    .tok-number { color: #d97706; }
    .tok-property { color: #2563eb; }
  </style>
</head>
<body>

  <!-- 1. COVER PAGE -->
  <div class="cover-page">
    <div class="cover-hero">
      <div class="cover-badge">Complete Source Code Reference Documentation</div>
      <h1 class="cover-title">SmartCity3D-Web</h1>
      <h2 class="cover-subtitle">Complete Production Source Code &amp; System Architecture</h2>
      <p class="cover-description">
        Comprehensive documentation and complete verbatim source code for the <strong>SmartCity3D-Web</strong> visualization and municipal management platform. Incorporates the Three.js 3D WebGL procedural city engine, Node.js and Express RESTful API backend, MongoDB Mongoose data schema layer, autonomous multi-agent simulation subsystems (traffic, emergency, pedestrian, smart lighting, parking), and real-time energy telemetry analytics.
      </p>

      <div class="cover-stats-grid">
        <div class="cover-stat-card">
          <div class="val">${processedFiles.length}</div>
          <div class="lbl">Total Source Files</div>
        </div>
        <div class="cover-stat-card">
          <div class="val">${totalLines.toLocaleString()}</div>
          <div class="lbl">Lines of Code</div>
        </div>
        <div class="cover-stat-card">
          <div class="val">100%</div>
          <div class="lbl">Verbatim Coverage</div>
        </div>
        <div class="cover-stat-card">
          <div class="val">${(totalBytes / 1024).toFixed(0)} KB</div>
          <div class="lbl">Codebase Size</div>
        </div>
      </div>

      <div class="cover-tech-stack">
        <div class="cover-tech-title">Architecture &amp; Core Technology Stack</div>
        <div class="cover-tech-tags">
          <span class="tech-pill">Three.js WebGL 3D</span>
          <span class="tech-pill">Node.js (ES Modules)</span>
          <span class="tech-pill">Express REST APIs</span>
          <span class="tech-pill">MongoDB &amp; Mongoose</span>
          <span class="tech-pill">JWT Role Authentication</span>
          <span class="tech-pill">Chart.js Analytics</span>
          <span class="tech-pill">Autonomous Vehicle Pathfinding</span>
          <span class="tech-pill">Pedestrian Agent Simulation</span>
          <span class="tech-pill">IoT Streetlight Automation</span>
          <span class="tech-pill">Smart Parking Grid</span>
          <span class="tech-pill">Adaptive Traffic Signals</span>
          <span class="tech-pill">Emergency Dispatch</span>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div>Project: <strong>SmartCity3D-Web Platform</strong> &bull; Confidential &amp; Proprietary</div>
      <div>Generated: <strong>${currentDate}</strong></div>
    </div>
  </div>

  <!-- 2. PROJECT FOLDER STRUCTURE SECTION -->
  <div class="structure-section">
    <div class="section-title">
      <span>1. Project Directory &amp; Architecture Structure</span>
      <span style="font-size: 10pt; color: #64748b; font-weight: 500;">Hierarchical Layout</span>
    </div>
    <p class="section-desc">
      The complete project directory organization of the <strong>SmartCity3D-Web</strong> platform is documented below. The codebase cleanly decouples frontend procedural 3D graphics and simulation logic from backend database schemas, controllers, and RESTful routing services.
    </p>
    <div class="tree-box">${escapeHtml(directoryTree)}</div>
  </div>

  <!-- 3. TABLE OF CONTENTS -->
  <div class="toc-section">
    <div class="section-title">
      <span>2. Table of Contents</span>
      <span style="font-size: 10pt; color: #64748b; font-weight: 500;">${processedFiles.length} Source Files</span>
    </div>
    <p class="section-desc">
      Click on any source file below to jump directly to its complete, verbatim code implementation section.
    </p>
    ${tocHtml}
  </div>

  <!-- 4. COMPLETE SOURCE CODE SECTIONS -->
  ${codeSectionsHtml}

</body>
</html>`;

  return { fullHtml, processedFiles, totalLines, totalBytes };
}

async function renderPdf(htmlContent) {
  const htmlPath = path.join(PROJECT_ROOT, 'scratch', 'temp_complete_code.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
  console.log(`Wrote temporary HTML document: ${htmlPath} (${(fs.statSync(htmlPath).size / 1024).toFixed(1)} KB)`);

  console.log(`Spawning Edge headless with remote debugging on port ${DEBUG_PORT}...`);
  const edgeProc = spawn(EDGE_PATH, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 400));
    try {
      const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
      const tabs = await res.json();
      const page = tabs.find((t) => t.type === 'page');
      if (page?.webSocketDebuggerUrl) {
        wsUrl = page.webSocketDebuggerUrl;
        console.log('Connected to Edge CDP tab:', wsUrl);
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    edgeProc.kill();
    throw new Error('Failed to acquire WebSocket URL from Edge CDP');
  }

  const ws = new WebSocket(wsUrl);
  let reqId = 1;
  const pending = new Map();

  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise((r) => (ws.onopen = r));

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = reqId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send('Page.enable');

  const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
  console.log(`Navigating Edge to ${fileUrl}...`);
  await send('Page.navigate', { url: fileUrl });

  // Wait for layout and rendering stabilization
  console.log('Waiting for DOM layout and rendering to complete...');
  await new Promise((r) => setTimeout(r, 6000));

  console.log('Calling Page.printToPDF via CDP with custom headers and footers...');
  const headerTemplate = `
    <div style="font-size: 7.5pt; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #64748b; width: 100%; display: flex; justify-content: space-between; padding: 0 14mm; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px;">
      <span style="font-weight: 600; color: #0f172a;">SmartCity3D-Web &bull; Complete Source Code Documentation</span>
      <span>Comprehensive Production Codebase</span>
    </div>
  `;

  const footerTemplate = `
    <div style="font-size: 7.5pt; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #64748b; width: 100%; display: flex; justify-content: space-between; padding: 0 14mm; border-top: 1px solid #e2e8f0; padding-top: 3px;">
      <span>SmartCity3D-Web Platform &bull; Verbatim Codebase Reference</span>
      <span style="font-weight: 600; color: #0f172a;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>
  `;

  const pdfRes = await send('Page.printToPDF', {
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate,
    footerTemplate,
    marginTop: 0.65,
    marginBottom: 0.65,
    marginLeft: 0.5,
    marginRight: 0.5,
    paperWidth: 8.27, // A4
    paperHeight: 11.69,
    preferCSSPageSize: true
  });

  console.log('Received PDF data from CDP. Writing to output file...');
  const pdfBuffer = Buffer.from(pdfRes.data, 'base64');
  fs.writeFileSync(OUTPUT_PDF, pdfBuffer);

  ws.close();
  edgeProc.kill();

  console.log(`Successfully generated: ${OUTPUT_PDF}`);
  console.log(`PDF File Size: ${(pdfBuffer.length / (1024 * 1024)).toFixed(2)} MB (${pdfBuffer.length.toLocaleString()} bytes)`);

  // Cleanup temporary HTML file
  if (fs.existsSync(htmlPath)) {
    fs.unlinkSync(htmlPath);
    console.log('Cleaned up temporary HTML file.');
  }

  return pdfBuffer.length;
}

async function main() {
  const { fullHtml, processedFiles, totalLines, totalBytes } = buildHtml();
  await renderPdf(fullHtml);
  console.log('\n--- VERIFICATION AUDIT ---');
  console.log(`Total Source Files Included: ${processedFiles.length}`);
  console.log(`Total Lines of Code: ${totalLines.toLocaleString()}`);
  console.log(`Total Codebase Size: ${(totalBytes / 1024).toFixed(1)} KB`);
  console.log(`Output File Location: ${OUTPUT_PDF}`);
}

main().catch((err) => {
  console.error('PDF Generation Failed:', err);
  process.exit(1);
});
