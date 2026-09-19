import { CityScene } from './scene.js';
import { EnergyAnalytics, ELECTRICITY_RATE_PER_KWH } from './analytics/EnergyAnalytics.js';

/**
 * SmartCity3D-Web Master Frontend Entry Point
 * Coordinates 3D Scene, API health checks, Smart Parking, Smart Traffic Management, and Emergency Ops.
 */
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Status & Navigation
  const container = document.getElementById('canvas-container');
  const fpsDisplay = document.getElementById('fps-display');
  const backendPill = document.getElementById('backend-status-pill');
  const backendText = document.getElementById('backend-status-text');
  const dbPill = document.getElementById('db-status-pill');
  const dbText = document.getElementById('db-status-text');

  // DOM Elements - Controls
  const btnToggleDayNight = document.getElementById('btn-toggle-daynight');
  const btnResetCam = document.getElementById('btn-reset-cam');
  const btnToggleGrid = document.getElementById('btn-toggle-grid');
  const btnToggleRotation = document.getElementById('btn-toggle-rotation');

  // DOM Elements - Parking Dashboard
  const parkingTotalCount = document.getElementById('parking-total-count');
  const parkingAvailableCount = document.getElementById('parking-available-count');
  const parkingOccupiedCount = document.getElementById('parking-occupied-count');
  const parkingOccupancyRate = document.getElementById('parking-occupancy-rate');
  const parkingSyncDot = document.getElementById('parking-sync-dot');

  // DOM Elements - Parking Detail Modal
  const parkingModal = document.getElementById('parking-detail-modal');
  const slotModalCode = document.getElementById('slot-modal-code');
  const slotModalZone = document.getElementById('slot-modal-zone');
  const slotModalStatus = document.getElementById('slot-modal-status');
  const slotModalVehicle = document.getElementById('slot-modal-vehicle');
  const slotModalCoords = document.getElementById('slot-modal-coords');
  const slotModalClose = document.getElementById('slot-modal-close');

  // DOM Elements - Traffic Dashboard
  const trafficTotalJunctions = document.getElementById('traffic-total-junctions');
  const trafficGreenCount = document.getElementById('traffic-green-count');
  const trafficRedCount = document.getElementById('traffic-red-count');
  const trafficCycleTime = document.getElementById('traffic-cycle-time');
  const trafficCorridorStatus = document.getElementById('traffic-corridor-status');
  const trafficSyncDot = document.getElementById('traffic-sync-dot');

  // DOM Elements - Traffic Detail Modal
  const trafficModal = document.getElementById('traffic-detail-modal');
  const signalModalId = document.getElementById('signal-modal-id');
  const signalModalName = document.getElementById('signal-modal-name');
  const signalModalStatus = document.getElementById('signal-modal-status');
  const signalModalTimer = document.getElementById('signal-modal-timer');
  const signalModalEmergency = document.getElementById('signal-modal-emergency');
  const signalModalCoords = document.getElementById('signal-modal-coords');
  const signalModalClose = document.getElementById('signal-modal-close');
  const btnCyclePhase = document.getElementById('btn-cycle-phase');
  const btnToggleOverride = document.getElementById('btn-toggle-override');

  // DOM Elements - Emergency Dashboard
  const emergencyTotalCount = document.getElementById('emergency-total-count');
  const emergencyMedCount = document.getElementById('emergency-med-count');
  const emergencyFireCount = document.getElementById('emergency-fire-count');
  const emergencyPoliceCount = document.getElementById('emergency-police-count');
  const emergencyHighestSeverity = document.getElementById('emergency-highest-severity');
  const emergencyCorridorStatus = document.getElementById('emergency-corridor-status');
  const emergencySyncDot = document.getElementById('emergency-sync-dot');

  // DOM Elements - Emergency Detail Modal
  const emergencyModal = document.getElementById('emergency-detail-modal');
  const emergencyModalIcon = document.getElementById('emergency-modal-icon');
  const emergencyModalId = document.getElementById('emergency-modal-id');
  const emergencyModalLocation = document.getElementById('emergency-modal-location');
  const emergencyModalType = document.getElementById('emergency-modal-type');
  const emergencyModalSeverity = document.getElementById('emergency-modal-severity');
  const emergencyModalStatus = document.getElementById('emergency-modal-status');
  const emergencyModalDesc = document.getElementById('emergency-modal-desc');
  const emergencyModalCoords = document.getElementById('emergency-modal-coords');
  const emergencyModalClose = document.getElementById('emergency-modal-close');
  const btnEmergencyCorridorAction = document.getElementById('btn-emergency-corridor-action');
  const btnResolveIncident = document.getElementById('btn-resolve-incident');

  // DOM Elements - Moving Traffic & Telemetry
  const trafficMovingCount = document.getElementById('traffic-moving-count');
  const trafficAvgSpeed = document.getElementById('traffic-avg-speed');
  const trafficFlowStatus = document.getElementById('traffic-flow-status');
  const trafficDensityPills = document.querySelectorAll('#traffic-density-pills .density-pill');

  // DOM Elements - Vehicle Detail Inspector Modal
  const vehicleModal = document.getElementById('vehicle-detail-modal');
  const vehicleModalIcon = document.getElementById('vehicle-modal-icon');
  const vehicleModalId = document.getElementById('vehicle-modal-id');
  const vehicleModalPlate = document.getElementById('vehicle-modal-plate');
  const vehicleModalType = document.getElementById('vehicle-modal-type');
  const vehicleModalSpeed = document.getElementById('vehicle-modal-speed');
  const vehicleModalStatus = document.getElementById('vehicle-modal-status');
  const vehicleModalRoad = document.getElementById('vehicle-modal-road');
  const vehicleModalSignal = document.getElementById('vehicle-modal-signal');
  const vehicleModalClose = document.getElementById('vehicle-modal-close');
  const btnFollowVehicle = document.getElementById('btn-follow-vehicle');

  // DOM Elements - Smart Environment Dashboard
  const environmentSyncDot = document.getElementById('environment-sync-dot');
  const envCityAqi = document.getElementById('env-city-aqi');
  const envTempHumidity = document.getElementById('env-temp-humidity');
  const envPrimaryPollutant = document.getElementById('env-primary-pollutant');
  const envEcoStatus = document.getElementById('env-eco-status');
  const envAlertRow = document.getElementById('env-alert-row');
  const envAlertText = document.getElementById('env-alert-text');

  // DOM Elements - Environment Detail Inspector Modal
  const environmentModal = document.getElementById('environment-detail-modal');
  const envModalId = document.getElementById('env-modal-id');
  const envModalLocation = document.getElementById('env-modal-location');
  const envModalClose = document.getElementById('env-modal-close');
  const envModalAqiPill = document.getElementById('env-modal-aqi-pill');
  const envModalClimate = document.getElementById('env-modal-climate');
  const envModalPm = document.getElementById('env-modal-pm');
  const envModalGases = document.getElementById('env-modal-gases');
  const envModalZone = document.getElementById('env-modal-zone');
  const envModalCoords = document.getElementById('env-modal-coords');
  const btnToggleEcoFilter = document.getElementById('btn-toggle-eco-filter');

  // DOM Elements - Smart Street Lighting Dashboard
  const lightingSyncDot = document.getElementById('lighting-sync-dot');
  const lightingActiveCount = document.getElementById('lighting-active-count');
  const lightingFaultyCount = document.getElementById('lighting-faulty-count');
  const lightingAvgBrightness = document.getElementById('lighting-avg-brightness');
  const lightingPowerKw = document.getElementById('lighting-power-kw');
  const lightingEnergySaved = document.getElementById('lighting-energy-saved');
  const lightingSystemMode = document.getElementById('lighting-system-mode');
  const lightingDayNightStatus = document.getElementById('lighting-daynight-status');
  const lightingAdaptiveStatus = document.getElementById('lighting-adaptive-status');
  const lightingFaultAlert = document.getElementById('lighting-fault-alert');
  const lightingFaultText = document.getElementById('lighting-fault-text');

  // DOM Elements - Street Light Detail Inspector Modal
  const lightModal = document.getElementById('light-detail-modal');
  const lightModalId = document.getElementById('light-modal-id');
  const lightModalName = document.getElementById('light-modal-name');
  const lightModalZone = document.getElementById('light-modal-zone');
  const lightModalStatusPill = document.getElementById('light-modal-status-pill');
  const lightModalBrightnessVal = document.getElementById('light-modal-brightness-val');
  const lightModalModeVal = document.getElementById('light-modal-mode-val');
  const lightModalLampType = document.getElementById('light-modal-lamp-type');
  const lightModalPowerRating = document.getElementById('light-modal-power-rating');
  const lightModalLivePower = document.getElementById('light-modal-live-power');
  const lightModalEnergySaved = document.getElementById('light-modal-energy-saved');
  const lightModalFaultPill = document.getElementById('light-modal-fault-pill');
  const lightModalFaultRow = document.getElementById('light-modal-fault-row');
  const lightModalFaultText = document.getElementById('light-modal-fault-text');
  const lightModalCoords = document.getElementById('light-modal-coords');
  const lightModalClose = document.getElementById('light-modal-close');
  const btnToggleLightPower = document.getElementById('btn-toggle-light-power');
  const lightModeSelect = document.getElementById('light-mode-select');
  const lightBrightnessSlider = document.getElementById('light-brightness-slider');
  const lightSliderIndicator = document.getElementById('light-slider-indicator');
  const lightFaultActionContainer = document.getElementById('light-fault-action-container');
  const btnResetLightFault = document.getElementById('btn-reset-light-fault');
  const lightControlFeedback = document.getElementById('light-control-feedback');

  // DOM Elements - Smart City Facilities Inspector Modal
  const facilityModal = document.getElementById('facility-detail-modal');
  const facilityModalIcon = document.getElementById('facility-modal-icon');
  const facilityModalName = document.getElementById('facility-modal-name');
  const facilityModalZone = document.getElementById('facility-modal-zone');
  const facilityModalId = document.getElementById('facility-modal-id');
  const facilityModalType = document.getElementById('facility-modal-type');
  const facilityModalStatus = document.getElementById('facility-modal-status');
  const facilityModalDesc = document.getElementById('facility-modal-desc');
  const facilityModalExtraRow = document.getElementById('facility-modal-extra-row');
  const facilityModalExtraLabel = document.getElementById('facility-modal-extra-label');
  const facilityModalExtraVal = document.getElementById('facility-modal-extra-val');
  const facilityModalCoords = document.getElementById('facility-modal-coords');
  const facilityModalClose = document.getElementById('facility-modal-close');

  // DOM Elements - Pedestrian Detail Inspector Modal
  const pedestrianModal = document.getElementById('pedestrian-detail-modal');
  const pedestrianModalName = document.getElementById('pedestrian-modal-name');
  const pedestrianModalId = document.getElementById('pedestrian-modal-id');
  const pedestrianModalType = document.getElementById('pedestrian-modal-type');
  const pedestrianModalStatus = document.getElementById('pedestrian-modal-status');
  const pedestrianModalDest = document.getElementById('pedestrian-modal-dest');
  const pedestrianModalSpeed = document.getElementById('pedestrian-modal-speed');
  const pedestrianModalCoords = document.getElementById('pedestrian-modal-coords');
  const pedestrianModalClose = document.getElementById('pedestrian-modal-close');

  // DOM Elements - Smart City Energy Optimization & Analytics (Step 9)
  const energyHudPower = document.getElementById('energy-hud-power');
  const energyHudDaily = document.getElementById('energy-hud-daily');
  const energyHudMonthly = document.getElementById('energy-hud-monthly');
  const energyHudCost = document.getElementById('energy-hud-cost');
  const energyHudSaved = document.getElementById('energy-hud-saved');
  const energyHudActive = document.getElementById('energy-hud-active');
  const energyModeBadge = document.getElementById('energy-mode-badge');
  const btnOpenEnergyPanel = document.getElementById('btn-open-energy-panel');

  const energyAnalyticsModal = document.getElementById('energy-analytics-modal');
  const energyModalClose = document.getElementById('energy-modal-close');
  const energyModalModeStatus = document.getElementById('energy-modal-mode-status');
  const btnEnergyModeNormal = document.getElementById('btn-energy-mode-normal');
  const btnEnergyModeEco = document.getElementById('btn-energy-mode-eco');
  const btnOptimizeLighting = document.getElementById('btn-optimize-lighting');
  const energyOptimizationToast = document.getElementById('energy-optimization-toast');

  const energyKpiPower = document.getElementById('energy-kpi-power');
  const energyKpiConnected = document.getElementById('energy-kpi-connected');
  const energyKpiPowerBar = document.getElementById('energy-kpi-power-bar');
  const energyKpiSaved = document.getElementById('energy-kpi-saved');
  const energyKpiSavedBar = document.getElementById('energy-kpi-saved-bar');
  const energyKpiDaily = document.getElementById('energy-kpi-daily');
  const energyKpiMonthly = document.getElementById('energy-kpi-monthly');
  const energyKpiDailyCost = document.getElementById('energy-kpi-daily-cost');
  const energyKpiMonthlyCost = document.getElementById('energy-kpi-monthly-cost');
  const energyTariffRate = document.getElementById('energy-tariff-rate');
  const zoneAnalyticsList = document.getElementById('zone-analytics-list');
  const energyAlertsCount = document.getElementById('energy-alerts-count');
  const energyAlertsContainer = document.getElementById('energy-alerts-container');

  const lightModalBrightnessEnergy = document.getElementById('light-modal-brightness-energy');
  const lightModalDailyEnergy = document.getElementById('light-modal-daily-energy');
  const lightModalZoneContrib = document.getElementById('light-modal-zone-contrib');

  // Instantiate Energy Analytics Engine
  const energyAnalytics = new EnergyAnalytics();

  // State cache
  let latestSignals = [];
  let latestIncidents = [];
  let latestSensors = [];
  let latestStreetLights = [];
  let isStreetLightDataLoaded = false;
  let isStreetLightDataFailed = false;
  let isEmergencyOverrideActive = false;
  let currentSelectedSlotCode = null;
  let currentSelectedJunctionId = null;
  let currentSelectedIncidentId = null;
  let currentSelectedVehicle = null;
  let currentSelectedSensorId = null;
  let currentSelectedSensor = null;
  let currentSelectedLight = null;
  let currentSelectedFacilityId = null;
  let currentSelectedPedestrian = null;
  let currentSelectedPersonId = null;
  let isFollowingVehicle = false;

  // 1. Initialize 3D Three.js Scene
  const cityScene = new CityScene(container, (fps) => {
    if (fpsDisplay) {
      fpsDisplay.textContent = `${fps} FPS`;
    }
  });
  window.cityScene = cityScene;

  // Helper to close all modals for clean UI exclusivity
  function closeAllModals() {
    if (parkingModal) parkingModal.classList.add('hidden');
    if (trafficModal) trafficModal.classList.add('hidden');
    if (emergencyModal) emergencyModal.classList.add('hidden');
    if (vehicleModal) vehicleModal.classList.add('hidden');
    if (environmentModal) environmentModal.classList.add('hidden');
    if (lightModal) lightModal.classList.add('hidden');
    if (facilityModal) facilityModal.classList.add('hidden');
    if (pedestrianModal) pedestrianModal.classList.add('hidden');
    if (energyAnalyticsModal) energyAnalyticsModal.classList.add('hidden');
    currentSelectedSlotCode = null;
    currentSelectedJunctionId = null;
    currentSelectedIncidentId = null;
    currentSelectedVehicle = null;
    currentSelectedSensorId = null;
    currentSelectedSensor = null;
    currentSelectedLight = null;
    currentSelectedFacilityId = null;
    currentSelectedPedestrian = null;
    currentSelectedPersonId = null;
    if (cityScene.pedestrianSystem) {
      cityScene.pedestrianSystem.clearSelection();
    }
    if (isFollowingVehicle) {
      cityScene.clearFollowVehicle();
      isFollowingVehicle = false;
      if (btnFollowVehicle) {
        btnFollowVehicle.classList.remove('active');
        btnFollowVehicle.innerHTML = '🎯 Follow Vehicle';
      }
    }
  }

  // 2. Setup Parking Slot Click Inspector
  cityScene.setOnSlotSelect((slot) => {
    if (!slot || !parkingModal) return;
    closeAllModals();
    currentSelectedSlotCode = slot.slotCode;
    renderSlotDetails(slot);
    parkingModal.classList.remove('hidden');
  });

  function renderSlotDetails(slot) {
    if (!slot) return;
    slotModalCode.textContent = `Slot ${slot.slotCode}`;
    slotModalZone.textContent = slot.zone || 'City Parking District';

    const isOccupied = Boolean(slot.isOccupied);
    if (isOccupied) {
      slotModalStatus.className = 'status-pill status-error';
      slotModalStatus.innerHTML = '<span class="status-dot"></span> OCCUPIED';
      slotModalVehicle.textContent = slot.vehicleNumber || 'Vehicle Detected';
      slotModalVehicle.style.color = 'var(--accent-rose)';
    } else {
      slotModalStatus.className = 'status-pill status-online';
      slotModalStatus.innerHTML = '<span class="status-dot"></span> AVAILABLE';
      slotModalVehicle.textContent = 'None (Vacant)';
      slotModalVehicle.style.color = 'var(--accent-emerald)';
    }

    const x = slot.coordinates?.x ?? 0;
    const z = slot.coordinates?.z ?? 0;
    slotModalCoords.textContent = `X: ${x}, Z: ${z}`;
  }

  if (slotModalClose && parkingModal) {
    slotModalClose.addEventListener('click', () => {
      parkingModal.classList.add('hidden');
      currentSelectedSlotCode = null;
    });
  }

  // 3. Setup Traffic Signal Click Inspector
  cityScene.setOnSignalSelect((signal) => {
    if (!signal || !trafficModal) return;
    closeAllModals();
    currentSelectedJunctionId = signal.junctionId;
    renderSignalDetails(signal);
    trafficModal.classList.remove('hidden');
  });

  function renderSignalDetails(signal) {
    if (!signal) return;
    if (signalModalId) signalModalId.textContent = `Junction ${signal.junctionId}`;
    if (signalModalName) signalModalName.textContent = signal.name || 'City Intersection';

    const status = (signal.status || 'GREEN').toUpperCase();
    if (signalModalStatus) {
      if (status === 'GREEN') {
        signalModalStatus.className = 'status-pill status-online';
        signalModalStatus.innerHTML = '<span class="status-dot"></span> GREEN (GO)';
      } else if (status === 'YELLOW') {
        signalModalStatus.className = 'status-pill status-loading';
        signalModalStatus.innerHTML = '<span class="status-dot"></span> YELLOW (CAUTION)';
      } else {
        signalModalStatus.className = 'status-pill status-error';
        signalModalStatus.innerHTML = '<span class="status-dot"></span> RED (STOP)';
      }
    }

    const remaining = signal.remainingTime !== undefined ? signal.remainingTime : 15;
    if (signalModalTimer) {
      signalModalTimer.textContent = `${remaining}s remaining`;
    }

    const isOverride = Boolean(signal.emergencyOverride || isEmergencyOverrideActive);
    if (signalModalEmergency) {
      signalModalEmergency.textContent = isOverride ? '🚨 ACTIVE PRIORITY' : 'Standard Cycle';
      signalModalEmergency.style.color = isOverride ? 'var(--accent-rose)' : 'var(--text-primary)';
    }

    if (btnToggleOverride) {
      btnToggleOverride.classList.toggle('active', isOverride);
      btnToggleOverride.textContent = isOverride ? '🚨 Cancel Priority' : '🚨 Emergency Corridor';
    }

    const x = signal.coordinates?.x ?? 0;
    const z = signal.coordinates?.z ?? 0;
    if (signalModalCoords) {
      signalModalCoords.textContent = `X: ${x}, Z: ${z}`;
    }
  }

  if (signalModalClose && trafficModal) {
    signalModalClose.addEventListener('click', () => {
      trafficModal.classList.add('hidden');
      currentSelectedJunctionId = null;
    });
  }

  // 4. Setup Emergency Incident Click Inspector
  cityScene.setOnIncidentSelect((incident) => {
    if (!incident || !emergencyModal) return;
    closeAllModals();
    currentSelectedIncidentId = incident.incidentId;
    renderIncidentDetails(incident);
    emergencyModal.classList.remove('hidden');
  });

  function renderIncidentDetails(incident) {
    if (!incident) return;
    const type = (incident.type || 'AMBULANCE').toUpperCase();
    const severity = (incident.severity || 'HIGH').toUpperCase();
    const status = (incident.status || 'REPORTED').toUpperCase();

    if (emergencyModalIcon) {
      emergencyModalIcon.textContent = type === 'FIRE' ? '🚒' : (type === 'POLICE' ? '🚓' : '🚑');
    }
    if (emergencyModalId) emergencyModalId.textContent = `Incident ${incident.incidentId}`;
    if (emergencyModalLocation) emergencyModalLocation.textContent = incident.locationName || 'City Sector';

    if (emergencyModalType) {
      emergencyModalType.textContent = type;
      emergencyModalType.className = `status-pill ${type === 'FIRE' ? 'status-error' : (type === 'POLICE' ? 'status-neutral' : 'status-cyan')}`;
    }

    if (emergencyModalSeverity) {
      emergencyModalSeverity.textContent = `${severity} ALERT`;
      emergencyModalSeverity.className = `status-pill ${severity === 'CRITICAL' || severity === 'HIGH' ? 'status-error' : 'status-loading'}`;
    }

    if (emergencyModalStatus) {
      emergencyModalStatus.textContent = status;
      emergencyModalStatus.className = `status-pill ${status === 'RESOLVED' ? 'status-online' : (status === 'DISPATCHED' ? 'status-loading' : 'status-error')}`;
    }

    if (emergencyModalDesc) {
      emergencyModalDesc.textContent = incident.description || 'Emergency services active on scene.';
    }

    const x = incident.coordinates?.x ?? 0;
    const z = incident.coordinates?.z ?? 0;
    if (emergencyModalCoords) {
      emergencyModalCoords.textContent = `X: ${x}, Z: ${z}`;
    }

    if (btnEmergencyCorridorAction) {
      btnEmergencyCorridorAction.classList.toggle('active', isEmergencyOverrideActive);
      btnEmergencyCorridorAction.textContent = isEmergencyOverrideActive ? '🚨 Cancel Priority' : '🚨 Green Corridor';
    }

    if (btnResolveIncident) {
      btnResolveIncident.style.display = status === 'RESOLVED' ? 'none' : 'inline-flex';
    }
  }

  if (emergencyModalClose && emergencyModal) {
    emergencyModalClose.addEventListener('click', () => {
      emergencyModal.classList.add('hidden');
      currentSelectedIncidentId = null;
    });
  }

  // Action Button: Priority Green Corridor Trigger from Emergency Modal
  if (btnEmergencyCorridorAction) {
    btnEmergencyCorridorAction.addEventListener('click', async () => {
      await toggleEmergencyCorridor();
      if (currentSelectedIncidentId) {
        const inc = latestIncidents.find(i => i.incidentId === currentSelectedIncidentId);
        if (inc) renderIncidentDetails(inc);
      }
    });
  }

  // Action Button: Resolve Incident
  if (btnResolveIncident) {
    btnResolveIncident.addEventListener('click', async () => {
      if (!currentSelectedIncidentId) return;

      const inc = latestIncidents.find(i => i.incidentId === currentSelectedIncidentId);
      if (inc) {
        inc.status = 'RESOLVED';
        renderIncidentDetails(inc);
      }

      // Optimistically update 3D scene & HUD
      cityScene.updateEmergencyIncidents(latestIncidents);
      updateEmergencyHUD(latestIncidents);

      try {
        const res = await fetch(`/api/incidents/${currentSelectedIncidentId}/resolve`, {
          method: 'PATCH'
        });
        if (res.ok) {
          console.log(`[Emergency API] Incident ${currentSelectedIncidentId} marked as RESOLVED`);
        }
      } catch (err) {
        console.warn('[Emergency API] Failed to resolve incident:', err.message);
      }
    });
  }

  // 4b. Setup Vehicle Click Inspector & Controls
  cityScene.setOnVehicleSelect((vehicle) => {
    if (!vehicle || !vehicleModal) return;
    closeAllModals();
    currentSelectedVehicle = vehicle;
    renderVehicleDetails(vehicle);
    vehicleModal.classList.remove('hidden');
  });

  function renderVehicleDetails(vehicle) {
    if (!vehicle) return;
    const type = vehicle.type || 'CAR';
    let icon = '🚗';
    let typeName = 'Personal Sedan / SUV';
    if (type === 'BUS') {
      icon = '🚌';
      typeName = 'City Transit Bus';
    } else if (type === 'TAXI') {
      icon = '🚕';
      typeName = 'City Taxi Cab';
    } else if (type === 'AMBULANCE') {
      icon = '🚑';
      typeName = 'Emergency Ambulance';
    }

    if (vehicleModalIcon) vehicleModalIcon.textContent = icon;
    if (vehicleModalId) vehicleModalId.textContent = vehicle.id;
    if (vehicleModalPlate) vehicleModalPlate.textContent = `Plate: ${vehicle.plate}`;
    if (vehicleModalType) vehicleModalType.textContent = typeName;

    const speedKmH = Math.round(vehicle.speed * 3.6);
    if (vehicleModalSpeed) {
      if (speedKmH === 0) {
        vehicleModalSpeed.className = 'status-pill status-error';
        vehicleModalSpeed.innerHTML = '<span class="status-dot"></span> 0 km/h (Stopped)';
      } else if (speedKmH > 50) {
        vehicleModalSpeed.className = 'status-pill status-cyan';
        vehicleModalSpeed.innerHTML = `<span class="status-dot"></span> ${speedKmH} km/h (Priority)`;
      } else {
        vehicleModalSpeed.className = 'status-pill status-online';
        vehicleModalSpeed.innerHTML = `<span class="status-dot"></span> ${speedKmH} km/h`;
      }
    }

    if (vehicleModalStatus) {
      vehicleModalStatus.textContent = vehicle.status;
    }
    if (vehicleModalRoad) {
      vehicleModalRoad.textContent = vehicle.currentRoadName || 'City Boulevard';
    }
    if (vehicleModalSignal) {
      vehicleModalSignal.textContent = vehicle.nextSignalInfo || 'Clear';
    }
  }

  if (vehicleModalClose && vehicleModal) {
    vehicleModalClose.addEventListener('click', () => {
      vehicleModal.classList.add('hidden');
      currentSelectedVehicle = null;
      if (isFollowingVehicle) {
        cityScene.clearFollowVehicle();
        isFollowingVehicle = false;
        if (btnFollowVehicle) {
          btnFollowVehicle.classList.remove('active');
          btnFollowVehicle.innerHTML = '🎯 Follow Vehicle';
        }
      }
    });
  }

  if (btnFollowVehicle) {
    btnFollowVehicle.addEventListener('click', () => {
      if (!currentSelectedVehicle) return;
      isFollowingVehicle = !isFollowingVehicle;
      if (isFollowingVehicle) {
        cityScene.followVehicle(currentSelectedVehicle);
        btnFollowVehicle.classList.add('active');
        btnFollowVehicle.innerHTML = '🛑 Stop Following';
      } else {
        cityScene.clearFollowVehicle();
        btnFollowVehicle.classList.remove('active');
        btnFollowVehicle.innerHTML = '🎯 Follow Vehicle';
      }
    });
  }

  // 4c. Setup Environment Sensor Click Inspector & Controls
  cityScene.setOnSensorSelect((sensor) => {
    if (!sensor || !environmentModal) return;
    closeAllModals();
    currentSelectedSensorId = sensor.sensorId;
    currentSelectedSensor = sensor;
    renderSensorDetails(sensor);
    environmentModal.classList.remove('hidden');
  });

  function renderSensorDetails(sensor) {
    if (!sensor) return;

    // Keep active sensor reference updated
    currentSelectedSensor = sensor;
    currentSelectedSensorId = sensor.sensorId;

    if (envModalId) envModalId.textContent = `${sensor.name || 'Sensor Station'} (${sensor.sensorId})`;
    if (envModalLocation) envModalLocation.textContent = `${sensor.zone || 'District'} Meteorological Node`;

    const aqi = sensor.aqi ?? 50;
    if (envModalAqiPill) {
      if (aqi <= 50) {
        envModalAqiPill.className = 'status-pill status-online';
        envModalAqiPill.innerHTML = `AQI ${aqi} • GOOD`;
      } else if (aqi <= 100) {
        envModalAqiPill.className = 'status-pill status-neutral';
        envModalAqiPill.innerHTML = `AQI ${aqi} • MODERATE`;
      } else {
        envModalAqiPill.className = 'status-pill status-error';
        envModalAqiPill.innerHTML = `AQI ${aqi} • UNHEALTHY`;
      }
    }

    const temp = sensor.temperature !== undefined ? `${sensor.temperature}°C` : '22°C';
    const humidity = sensor.humidity !== undefined ? `${sensor.humidity}% RH` : '55% RH';
    if (envModalClimate) envModalClimate.textContent = `${temp}  |  ${humidity}`;

    const pm25 = sensor.pm25 !== undefined ? `${sensor.pm25} µg/m³` : '12 µg/m³';
    const pm10 = sensor.pm10 !== undefined ? `${sensor.pm10} µg/m³` : '24 µg/m³';
    if (envModalPm) envModalPm.textContent = `PM2.5: ${pm25}  |  PM10: ${pm10}`;

    const co2 = sensor.co2 !== undefined ? `${sensor.co2} ppm` : '410 ppm';
    const no2 = sensor.no2 !== undefined ? `${sensor.no2} µg/m³` : '18 µg/m³';
    if (envModalGases) envModalGases.textContent = `CO2: ${co2}  |  NO2: ${no2}`;

    if (envModalZone) envModalZone.textContent = `${sensor.zone || 'URBAN'} Zone Node`;

    const x = sensor.coordinates?.x ?? 0;
    const z = sensor.coordinates?.z ?? 0;
    if (envModalCoords) envModalCoords.textContent = `X: ${x}, Z: ${z}`;

    if (btnToggleEcoFilter) {
      const isFilterOn = Boolean(sensor.ecoFilterActive);
      btnToggleEcoFilter.classList.toggle('active', isFilterOn);
      btnToggleEcoFilter.textContent = isFilterOn
        ? '💧 Deactivate Eco Mist Filter'
        : '💧 Activate Eco Mist Filter';
      btnToggleEcoFilter.disabled = false;
    }
  }

  if (envModalClose && environmentModal) {
    envModalClose.addEventListener('click', () => {
      environmentModal.classList.add('hidden');
      currentSelectedSensorId = null;
      currentSelectedSensor = null;
    });
  }

  // Action Button: Eco-Mist Filter Trigger on Clicked Station
  if (btnToggleEcoFilter) {
    btnToggleEcoFilter.addEventListener('click', async () => {
      // 1. Verify sensor ID and find target sensor (with fallback to currentSelectedSensor)
      const targetSensorId = currentSelectedSensorId || currentSelectedSensor?.sensorId;
      if (!targetSensorId) {
        console.warn('[Environment UI] Cannot toggle Eco-Filter: No sensor currently selected.');
        return;
      }

      let sensor = latestSensors.find(s => s.sensorId === targetSensorId);
      if (!sensor) {
        if (currentSelectedSensor && currentSelectedSensor.sensorId === targetSensorId) {
          console.warn(`[Environment UI] Sensor ${targetSensorId} not found in latestSensors, falling back to currentSelectedSensor.`);
          sensor = currentSelectedSensor;
        } else {
          console.warn(`[Environment UI] Sensor ${targetSensorId} could not be resolved from telemetry cache.`);
          return;
        }
      }

      // 2. Prevent duplicate clicks & show loading state
      btnToggleEcoFilter.disabled = true;
      const prevFilterState = Boolean(sensor.ecoFilterActive);
      btnToggleEcoFilter.textContent = '💧 Updating...';

      console.log('[Environment UI] Toggling Eco-Filter for', targetSensorId);

      try {
        const res = await fetch(`/api/environment/${targetSensorId}/eco-filter`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        console.log('[Environment UI] Eco-Filter response', json);

        if (json.success && json.data) {
          const updatedSensor = json.data;

          // Update active selection reference
          currentSelectedSensor = updatedSensor;
          currentSelectedSensorId = updatedSensor.sensorId;

          // Keep latestSensors synchronized
          const idx = latestSensors.findIndex(s => s.sensorId === updatedSensor.sensorId);
          if (idx !== -1) {
            latestSensors[idx] = updatedSensor;
          } else {
            latestSensors.push(updatedSensor);
          }

          // Immediately update 3D eco-mist visuals and tags
          cityScene.updateEnvironmentSensors(latestSensors);

          // Re-render modal details and update button state
          renderSensorDetails(updatedSensor);
        } else {
          throw new Error(json.message || 'Server returned unsuccessful response');
        }
      } catch (err) {
        console.error('[Environment UI] Failed to toggle eco filter:', err.message);
        btnToggleEcoFilter.disabled = false;
        btnToggleEcoFilter.textContent = prevFilterState
          ? '💧 Deactivate Eco Mist Filter'
          : '💧 Activate Eco Mist Filter';
      }
    });
  }

  // Traffic Density Switcher Controls
  if (trafficDensityPills && trafficDensityPills.length > 0) {
    trafficDensityPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        trafficDensityPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        const density = pill.dataset.density;
        cityScene.setTrafficDensity(density);
      });
    });
  }

  // Reusable Green Corridor Toggle Function
  async function toggleEmergencyCorridor() {
    const nextOverride = !isEmergencyOverrideActive;
    isEmergencyOverrideActive = nextOverride;

    // Optimistic local update for traffic signals
    latestSignals.forEach(s => {
      s.emergencyOverride = nextOverride;
      if (nextOverride) s.status = 'GREEN';
    });
    cityScene.updateTrafficSignals(latestSignals);

    // Update traffic and emergency HUDs
    updateTrafficHUD(latestSignals);
    updateEmergencyHUD(latestIncidents);

    if (btnToggleOverride) {
      btnToggleOverride.classList.toggle('active', nextOverride);
      btnToggleOverride.textContent = nextOverride ? '🚨 Cancel Priority' : '🚨 Emergency Corridor';
    }

    try {
      const res = await fetch('/api/traffic/emergency-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable: nextOverride })
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          latestSignals = json.data;
          cityScene.updateTrafficSignals(latestSignals);
        }
      }
    } catch (err) {
      console.warn('[Traffic API] Emergency override toggle failed:', err.message);
    }
  }

  // Interactive Signal Actions
  if (btnCyclePhase) {
    btnCyclePhase.addEventListener('click', async () => {
      if (!currentSelectedJunctionId) return;

      const target = latestSignals.find(s => s.junctionId === currentSelectedJunctionId);
      const currStatus = target ? target.status : 'GREEN';
      let nextStatus = 'GREEN';
      if (currStatus === 'GREEN') nextStatus = 'YELLOW';
      else if (currStatus === 'YELLOW') nextStatus = 'RED';
      else nextStatus = 'GREEN';

      // Instant local 3D update
      cityScene.setTrafficSignalStatus(currentSelectedJunctionId, nextStatus);
      if (target) {
        target.status = nextStatus;
        renderSignalDetails(target);
      }

      try {
        const res = await fetch(`/api/traffic/${currentSelectedJunctionId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            updateTrafficHUD(latestSignals);
          }
        }
      } catch (err) {
        console.warn('[Traffic API] Manual cycle phase failed:', err.message);
      }
    });
  }

  if (btnToggleOverride) {
    btnToggleOverride.addEventListener('click', toggleEmergencyCorridor);
  }

  // Live ticker for traffic signals, vehicle telemetry, and HUD metrics
  setInterval(() => {
    // 1. Refresh active traffic signal modal
    if (currentSelectedJunctionId && trafficModal && !trafficModal.classList.contains('hidden')) {
      const current = latestSignals.find(s => s.junctionId === currentSelectedJunctionId);
      if (current) {
        renderSignalDetails(current);
      }
    }

    // 2. Refresh active vehicle inspector card
    if (currentSelectedVehicle && vehicleModal && !vehicleModal.classList.contains('hidden')) {
      renderVehicleDetails(currentSelectedVehicle);
    }

    // 2b. Refresh active pedestrian inspector card
    if (currentSelectedPersonId && pedestrianModal && !pedestrianModal.classList.contains('hidden')) {
      const currentPed = cityScene.pedestrianSystem ? cityScene.pedestrianSystem.getPedestrianData(currentSelectedPersonId) : null;
      if (currentPed) {
        renderPedestrianDetails(currentPed);
      }
    }

    // 3. Refresh live vehicle metrics in Smart Traffic HUD
    const metrics = cityScene.getTrafficMetrics();
    if (metrics) {
      if (trafficMovingCount) trafficMovingCount.textContent = `${metrics.activeCount} Active`;
      if (trafficAvgSpeed) trafficAvgSpeed.textContent = `${metrics.avgSpeedKmH} km/h`;
      if (trafficFlowStatus) trafficFlowStatus.textContent = metrics.flowQuality;
    }

    // 4. Refresh Smart Street Lighting HUD metrics
    updateLightingHUD();

    // 4b. Refresh Smart City Energy Optimization & Analytics
    updateEnergyGrid();
  }, 500);

  // 5. Toolbar Actions
  if (btnToggleDayNight) {
    btnToggleDayNight.addEventListener('click', () => {
      const isNight = cityScene.toggleDayNight();
      btnToggleDayNight.classList.toggle('active', isNight);
      btnToggleDayNight.innerHTML = isNight
        ? '<span class="btn-icon">☀️</span> Day Mode'
        : '<span class="btn-icon">🌙</span> Night Mode';
      updateLightingHUD();
    });
  }

  if (btnResetCam) {
    btnResetCam.addEventListener('click', () => {
      if (isFollowingVehicle) {
        isFollowingVehicle = false;
        if (btnFollowVehicle) {
          btnFollowVehicle.classList.remove('active');
          btnFollowVehicle.innerHTML = '🎯 Follow Vehicle';
        }
      }
      cityScene.resetCamera();
    });
  }

  if (btnToggleGrid) {
    btnToggleGrid.addEventListener('click', () => {
      const isVisible = cityScene.toggleGrid();
      btnToggleGrid.classList.toggle('active', isVisible);
    });
  }

  if (btnToggleRotation) {
    btnToggleRotation.addEventListener('click', () => {
      const isRotating = cityScene.toggleAutoRotate();
      btnToggleRotation.classList.toggle('active', isRotating);
    });
  }

  // 6. Load Live Parking Data
  const runParkingFetch = () => {
    fetchParkingData(
      cityScene,
      parkingTotalCount,
      parkingAvailableCount,
      parkingOccupiedCount,
      parkingOccupancyRate,
      parkingSyncDot,
      (updatedSlots) => {
        if (currentSelectedSlotCode && !parkingModal.classList.contains('hidden')) {
          const freshSlot = updatedSlots.find(s => s.slotCode === currentSelectedSlotCode);
          if (freshSlot) {
            renderSlotDetails(freshSlot);
          }
        }
      }
    );
  };
  runParkingFetch();
  setInterval(runParkingFetch, 10000);

  // 7. Load Live Traffic Data
  const runTrafficFetch = () => {
    fetchTrafficData(
      cityScene,
      (signals) => {
        latestSignals = signals;
        updateTrafficHUD(signals);
        if (currentSelectedJunctionId && !trafficModal.classList.contains('hidden')) {
          const freshSig = signals.find(s => s.junctionId === currentSelectedJunctionId);
          if (freshSig) {
            renderSignalDetails(freshSig);
          }
        }
      },
      trafficSyncDot
    );
  };
  runTrafficFetch();
  setInterval(runTrafficFetch, 8000);

  function updateTrafficHUD(signals) {
    if (!Array.isArray(signals)) return;
    const total = signals.length;
    const green = signals.filter(s => s.status === 'GREEN').length;
    const yellow = signals.filter(s => s.status === 'YELLOW').length;
    const red = signals.filter(s => s.status === 'RED').length;
    const isOverride = signals.some(s => s.emergencyOverride) || isEmergencyOverrideActive;

    if (trafficTotalJunctions) trafficTotalJunctions.textContent = `${total} Junctions`;
    if (trafficGreenCount) trafficGreenCount.textContent = `${green} Green`;
    if (trafficRedCount) trafficRedCount.textContent = `${red + yellow} Red`;

    if (trafficCorridorStatus) {
      if (isOverride) {
        trafficCorridorStatus.className = 'metric-value metric-danger';
        trafficCorridorStatus.textContent = '🚨 Emergency Corridor';
      } else {
        trafficCorridorStatus.className = 'metric-value metric-success';
        trafficCorridorStatus.textContent = 'Normal Flow';
      }
    }
  }

  // 8. Load Live Emergency Incident Data
  const runEmergencyFetch = () => {
    fetchEmergencyData(
      cityScene,
      (incidents) => {
        latestIncidents = incidents;
        updateEmergencyHUD(incidents);
        if (currentSelectedIncidentId && !emergencyModal.classList.contains('hidden')) {
          const freshInc = incidents.find(i => i.incidentId === currentSelectedIncidentId);
          if (freshInc) {
            renderIncidentDetails(freshInc);
          }
        }
      },
      emergencySyncDot
    );
  };
  runEmergencyFetch();
  setInterval(runEmergencyFetch, 8000);

  function updateEmergencyHUD(incidents) {
    if (!Array.isArray(incidents)) return;
    const active = incidents.filter(i => i.status !== 'RESOLVED');
    const totalActive = active.length;

    const med = active.filter(i => (i.type || '').toUpperCase() === 'AMBULANCE').length;
    const fire = active.filter(i => (i.type || '').toUpperCase() === 'FIRE').length;
    const police = active.filter(i => (i.type || '').toUpperCase() === 'POLICE').length;

    if (emergencyTotalCount) {
      emergencyTotalCount.textContent = totalActive;
      emergencyTotalCount.className = totalActive > 0 ? 'metric-value metric-danger' : 'metric-value metric-success';
    }

    if (emergencyMedCount) emergencyMedCount.textContent = `${med} 🚑`;
    if (emergencyFireCount) emergencyFireCount.textContent = `${fire} 🚒`;
    if (emergencyPoliceCount) emergencyPoliceCount.textContent = `${police} 🚓`;

    if (emergencyHighestSeverity) {
      if (active.some(i => i.severity === 'CRITICAL')) {
        emergencyHighestSeverity.textContent = 'CRITICAL';
        emergencyHighestSeverity.className = 'metric-value metric-danger';
      } else if (active.some(i => i.severity === 'HIGH')) {
        emergencyHighestSeverity.textContent = 'HIGH ALERT';
        emergencyHighestSeverity.className = 'metric-value metric-danger';
      } else if (active.some(i => i.severity === 'MEDIUM')) {
        emergencyHighestSeverity.textContent = 'MEDIUM';
        emergencyHighestSeverity.className = 'metric-value';
      } else {
        emergencyHighestSeverity.textContent = totalActive > 0 ? 'LOW' : 'NORMAL';
        emergencyHighestSeverity.className = 'metric-value metric-success';
      }
    }

    if (emergencyCorridorStatus) {
      if (isEmergencyOverrideActive) {
        emergencyCorridorStatus.className = 'metric-value metric-danger';
        emergencyCorridorStatus.textContent = '🚨 Active Priority';
      } else {
        emergencyCorridorStatus.className = 'metric-value metric-success';
        emergencyCorridorStatus.textContent = 'Standby';
      }
    }
  }

  // 9. Load Live Smart Environment Monitoring Data
  const runEnvironmentFetch = () => {
    fetchEnvironmentData(
      cityScene,
      (sensors, summary) => {
        latestSensors = sensors;
        updateEnvironmentHUD(summary);
        if (currentSelectedSensorId && !environmentModal.classList.contains('hidden')) {
          const freshSensor = sensors.find(s => s.sensorId === currentSelectedSensorId);
          if (freshSensor) {
            renderSensorDetails(freshSensor);
          }
        }
      },
      environmentSyncDot
    );
  };
  runEnvironmentFetch();
  setInterval(runEnvironmentFetch, 10000);

  function updateEnvironmentHUD(summary) {
    if (!summary) return;

    if (envCityAqi) {
      const aqi = summary.avgAqi ?? '--';
      envCityAqi.textContent = `${aqi} AQI`;
      if (aqi <= 50) {
        envCityAqi.className = 'metric-value metric-success';
      } else if (aqi <= 100) {
        envCityAqi.className = 'metric-value';
      } else {
        envCityAqi.className = 'metric-value metric-danger';
      }
    }

    if (envTempHumidity) {
      const temp = summary.avgTemperature !== undefined ? `${summary.avgTemperature}°C` : '--°C';
      const hum = summary.avgHumidity !== undefined ? `${summary.avgHumidity}%` : '--%';
      envTempHumidity.textContent = `${temp} | ${hum}`;
    }

    if (envPrimaryPollutant) {
      envPrimaryPollutant.textContent = summary.primaryPollutant || 'PM2.5: Low';
    }

    if (envEcoStatus) {
      envEcoStatus.textContent = summary.ecoZoneHealth || '🌿 Optimal';
    }

    if (envAlertRow && envAlertText) {
      if (summary.highPollutionWarning) {
        envAlertRow.classList.remove('hidden');
        envAlertText.textContent = `⚠️ High AQI (${summary.warningStation || 'Industrial Zone'})`;
      } else {
        envAlertRow.classList.add('hidden');
      }
    }
  }

  // 9b. Load Live Smart Street Lighting Data (Step 3: MongoDB API Synchronization & Step 5 HUD)
  const runStreetLightFetch = () => {
    fetchStreetLightData(
      cityScene,
      (lights) => {
        isStreetLightDataLoaded = true;
        isStreetLightDataFailed = false;
        latestStreetLights = lights;
        updateLightingHUD();
        updateEnergyGrid();
        // Keep active inspector synchronized with latest MongoDB data
        if (currentSelectedLight && lightModal && !lightModal.classList.contains('hidden')) {
          const fresh = lights.find(l => l.lightId === currentSelectedLight.lightId);
          if (fresh) {
            renderLightDetails(fresh);
          }
        }
      },
      lightingSyncDot,
      (err) => {
        if (!isStreetLightDataLoaded) {
          isStreetLightDataFailed = true;
          setEnergyHudUnavailable();
        }
      }
    );
  };
  runStreetLightFetch();
  setInterval(runStreetLightFetch, 10000);

  function updateLightingHUD() {
    const metrics = cityScene ? cityScene.getStreetLightingMetrics() : null;
    if (!metrics) return;

    if (lightingActiveCount) {
      lightingActiveCount.textContent = `${metrics.activeOnCount} / ${metrics.totalLights}`;
    }
    if (lightingFaultyCount) {
      lightingFaultyCount.textContent = metrics.faultyCount;
      lightingFaultyCount.className = metrics.faultyCount > 0 ? 'metric-value metric-danger' : 'metric-value metric-success';
    }
    if (lightingAvgBrightness) {
      lightingAvgBrightness.textContent = `${metrics.avgBrightness}%`;
    }
    if (lightingPowerKw) {
      lightingPowerKw.textContent = `${metrics.powerKw} kW`;
    }
    if (lightingEnergySaved) {
      lightingEnergySaved.textContent = `${metrics.avgEnergySaved}%`;
    }
    if (lightingSystemMode) {
      lightingSystemMode.textContent = metrics.dominantMode;
    }
    if (lightingDayNightStatus) {
      lightingDayNightStatus.textContent = metrics.dayNight;
      lightingDayNightStatus.className = metrics.dayNight === 'NIGHT' ? 'metric-value metric-cyan' : 'metric-value metric-amber';
    }
    if (lightingAdaptiveStatus) {
      lightingAdaptiveStatus.textContent = metrics.adaptiveStatus;
      lightingAdaptiveStatus.className = metrics.adaptiveStatus === 'ACTIVE' ? 'metric-value metric-cyan' : 'metric-value metric-neutral';
    }
    if (lightingFaultText) {
      if (metrics.faultyCount > 0) {
        lightingFaultText.textContent = `⚠️ ${metrics.faultyDetails.join(', ')}`;
        lightingFaultText.className = 'metric-value metric-danger';
      } else {
        lightingFaultText.textContent = 'SYSTEM NORMAL';
        lightingFaultText.className = 'metric-value metric-success';
      }
    }
  }

  // 9c. Street Light Inspector (Step 6)
  let lightFeedbackTimer = null;
  function showLightFeedback(message, isError = false) {
    if (!lightControlFeedback) return;
    clearTimeout(lightFeedbackTimer);
    lightControlFeedback.textContent = message;
    lightControlFeedback.className = isError ? 'light-feedback error' : 'light-feedback success';
    lightControlFeedback.classList.remove('hidden');
    lightFeedbackTimer = setTimeout(() => {
      lightControlFeedback.classList.add('hidden');
    }, 4000);
  }

  function renderLightDetails(light) {
    if (!light) return;
    currentSelectedLight = light;

    const isFault = Boolean(light.isFaulty || light.status === 'FAULT');
    const isOn = light.status === 'ON';

    if (lightModalId) lightModalId.textContent = light.lightId;
    if (lightModalName) lightModalName.textContent = light.name || `Luminaire ${light.lightId}`;
    if (lightModalZone) lightModalZone.textContent = light.zone || 'COMMERCIAL';

    // Status Pill
    if (lightModalStatusPill) {
      if (isFault) {
        lightModalStatusPill.className = 'status-pill status-error';
        lightModalStatusPill.innerHTML = '<span class="status-dot"></span> FAULT';
      } else if (isOn) {
        lightModalStatusPill.className = 'status-pill status-online';
        lightModalStatusPill.innerHTML = '<span class="status-dot"></span> ON';
      } else {
        lightModalStatusPill.className = 'status-pill status-neutral';
        lightModalStatusPill.innerHTML = '<span class="status-dot"></span> OFF';
      }
    }

    // Brightness
    if (lightModalBrightnessVal) {
      lightModalBrightnessVal.textContent = isFault ? '0%' : `${light.brightness ?? 80}%`;
    }

    // Mode
    const currentMode = light.mode || 'AUTO';
    if (lightModalModeVal) {
      lightModalModeVal.textContent = currentMode;
    }

    // Lamp Type
    if (lightModalLampType) {
      lightModalLampType.textContent = light.lampType || 'LED_SMART_LUMINAIRE';
    }

    // Power Rating
    const powerRating = light.powerRatingWatts || 120;
    if (lightModalPowerRating) {
      lightModalPowerRating.textContent = `${powerRating} W`;
    }

    // Live Power:
    // For OFF: 0 W. For FAULT: 15 W. For ON: calculated from effective/visual brightness.
    let liveWatts = 0;
    if (isFault) {
      liveWatts = 15;
    } else if (isOn) {
      const node = cityScene?.getStreetLightNode ? cityScene.getStreetLightNode(light.lightId) : null;
      const visualB = (node && node.currentVisualBrightness !== undefined) ? node.currentVisualBrightness : (light.brightness ?? 80);
      liveWatts = Math.round(powerRating * (visualB / 100));
    } else {
      liveWatts = 0;
    }
    if (lightModalLivePower) {
      lightModalLivePower.textContent = `${liveWatts} W`;
    }

    // Energy Saved
    if (lightModalEnergySaved) {
      lightModalEnergySaved.textContent = `${light.energySavedPct ?? 35}%`;
    }

    // Step 9: Detailed Energy Telemetry Section in Inspector
    if (energyAnalytics) {
      const breakdown = energyAnalytics.getLightEnergyBreakdown(light);
      if (breakdown) {
        if (lightModalBrightnessEnergy) {
          lightModalBrightnessEnergy.textContent = `${breakdown.currentBrightness}%`;
        }
        if (lightModalLivePower) {
          lightModalLivePower.textContent = `${breakdown.livePowerWatts} W (${breakdown.livePowerKw} kW)`;
        }
        if (lightModalDailyEnergy) {
          lightModalDailyEnergy.textContent = `${breakdown.dailyEnergyKwh} kWh`;
        }
        if (lightModalZoneContrib) {
          lightModalZoneContrib.textContent = `${breakdown.zone} (${breakdown.zoneContributionPct}% zone load)`;
        }
      }
    }

    // Fault Type & Diagnostic Telemetry
    if (lightModalFaultPill) {
      if (isFault) {
        lightModalFaultPill.className = 'status-pill status-error';
        lightModalFaultPill.textContent = light.faultType || 'DRIVER_FAULT';
      } else {
        lightModalFaultPill.className = 'status-pill status-online';
        lightModalFaultPill.textContent = 'NONE';
      }
    }

    if (lightModalFaultRow) {
      if (isFault) {
        lightModalFaultRow.classList.remove('hidden');
        if (lightModalFaultText) {
          lightModalFaultText.textContent = `⚠️ Diagnostic fault active: ${light.faultType || 'DRIVER_FAULT'}`;
        }
      } else {
        lightModalFaultRow.classList.add('hidden');
      }
    }

    // Coordinates: X, Y, Z from MongoDB light record, rounded for display
    if (lightModalCoords) {
      const coords = light.coordinates || {};
      const x = typeof coords.x === 'number' ? coords.x.toFixed(1) : '0.0';
      const y = typeof coords.y === 'number' ? coords.y.toFixed(1) : '0.0';
      const z = typeof coords.z === 'number' ? coords.z.toFixed(1) : '0.0';
      lightModalCoords.textContent = `X: ${x}, Y: ${y}, Z: ${z}`;
    }

    // Controls state:
    if (isFault) {
      // Diagnostic fault active: normal controls disabled
      if (btnToggleLightPower) {
        btnToggleLightPower.disabled = true;
        btnToggleLightPower.textContent = '⚠️ FAULT ACTIVE';
        btnToggleLightPower.className = 'action-btn btn-danger-action';
        btnToggleLightPower.title = 'Diagnostic fault active: manual control disabled';
      }
      if (lightBrightnessSlider) {
        lightBrightnessSlider.disabled = true;
        lightBrightnessSlider.value = 0;
      }
      if (lightSliderIndicator) {
        lightSliderIndicator.textContent = '0%';
      }
      if (lightModeSelect) {
        lightModeSelect.disabled = true;
        lightModeSelect.value = currentMode;
      }
      // Show Fault Reset Action ONLY for faulty lights
      if (lightFaultActionContainer) {
        lightFaultActionContainer.classList.remove('hidden');
      }
      if (btnResetLightFault) {
        btnResetLightFault.disabled = false;
        btnResetLightFault.textContent = '🛠️ RESET FAULT';
      }
    } else {
      // Normal operating light
      if (btnToggleLightPower) {
        btnToggleLightPower.disabled = false;
        if (isOn) {
          btnToggleLightPower.textContent = '💡 Turn Light OFF';
          btnToggleLightPower.className = 'action-btn btn-amber-action';
          btnToggleLightPower.title = 'Turn luminaire OFF';
        } else {
          btnToggleLightPower.textContent = '💡 Turn Light ON';
          btnToggleLightPower.className = 'action-btn btn-success-action';
          btnToggleLightPower.title = 'Turn luminaire ON';
        }
      }

      if (lightBrightnessSlider) {
        lightBrightnessSlider.disabled = !isOn;
        lightBrightnessSlider.value = light.brightness ?? 80;
      }
      if (lightSliderIndicator) {
        lightSliderIndicator.textContent = `${light.brightness ?? 80}%`;
      }

      if (lightModeSelect) {
        lightModeSelect.disabled = false;
        lightModeSelect.value = currentMode;
      }

      // Hide Fault Reset Action for normal lights
      if (lightFaultActionContainer) {
        lightFaultActionContainer.classList.add('hidden');
      }
    }
  }

  // Setup Street Light Click Selection
  cityScene.setOnLightSelect((light) => {
    if (!light || !lightModal) return;
    closeAllModals();

    const targetId = light.lightId;
    const fresh = latestStreetLights.find(l => l.lightId === targetId) || light;
    currentSelectedLight = fresh;
    renderLightDetails(fresh);
    lightModal.classList.remove('hidden');
    console.log(`[StreetLighting] Inspector opened for ${fresh.lightId}: Status=${fresh.status}, Brightness=${fresh.brightness}%, Mode=${fresh.mode || 'AUTO'}`);
  });

  // Setup Smart City Facility Click Selection
  cityScene.setOnFacilitySelect((facility) => {
    if (!facility || !facilityModal) return;
    closeAllModals();

    currentSelectedFacilityId = facility.facilityId;
    renderFacilityDetails(facility);
    facilityModal.classList.remove('hidden');
    console.log(`[Facility System] Inspector opened for ${facility.facilityId}: ${facility.name} (${facility.type})`);
  });

  function renderFacilityDetails(facility) {
    if (!facility) return;
    if (facilityModalIcon) facilityModalIcon.textContent = facility.icon || '🏢';
    if (facilityModalName) facilityModalName.textContent = facility.name || 'Smart City Facility';
    if (facilityModalZone) facilityModalZone.textContent = `Zone: ${facility.zone || 'CIVIC'}`;
    if (facilityModalId) facilityModalId.textContent = facility.facilityId || 'FAC-00';

    if (facilityModalType) {
      facilityModalType.textContent = facility.type || 'FACILITY';
      facilityModalType.className = 'status-pill status-cyan';
    }

    if (facilityModalStatus) {
      const isNormal = facility.status === 'OPERATIONAL' || facility.status === 'OPEN';
      facilityModalStatus.className = isNormal ? 'status-pill status-online' : 'status-pill status-loading';
      facilityModalStatus.innerHTML = `<span class="status-dot"></span> ${facility.status || 'OPERATIONAL'}`;
    }

    if (facilityModalDesc) {
      facilityModalDesc.textContent = facility.description || 'Smart municipal destination facility.';
    }

    if (facilityModalExtraRow) {
      if (facility.extraLabel && facility.extraValue) {
        facilityModalExtraRow.classList.remove('hidden');
        if (facilityModalExtraLabel) facilityModalExtraLabel.textContent = facility.extraLabel;
        if (facilityModalExtraVal) facilityModalExtraVal.textContent = facility.extraValue;
      } else {
        facilityModalExtraRow.classList.add('hidden');
      }
    }

    const x = facility.coordinates?.x ?? 0;
    const y = facility.coordinates?.y ?? 0;
    const z = facility.coordinates?.z ?? 0;
    if (facilityModalCoords) {
      facilityModalCoords.textContent = `X: ${x}, Y: ${y}, Z: ${z}`;
    }
  }

  // Close Facility Inspector Button
  if (facilityModalClose && facilityModal) {
    facilityModalClose.addEventListener('click', () => {
      facilityModal.classList.add('hidden');
      currentSelectedFacilityId = null;
    });
  }

  // Setup Pedestrian Click Selection
  cityScene.setOnPedestrianSelect((pedestrian) => {
    if (!pedestrian || !pedestrianModal) return;
    closeAllModals();

    currentSelectedPedestrian = pedestrian;
    currentSelectedPersonId = pedestrian.personId;
    renderPedestrianDetails(pedestrian);
    pedestrianModal.classList.remove('hidden');
    console.log(`[Pedestrian System] Inspector opened for ${pedestrian.personId}: ${pedestrian.name} (${pedestrian.type})`);
  });

  function renderPedestrianDetails(pedestrian) {
    if (!pedestrian) return;
    if (pedestrianModalName) pedestrianModalName.textContent = pedestrian.name || 'Citizen';
    if (pedestrianModalId) pedestrianModalId.textContent = `ID: ${pedestrian.personId || 'PED-00'}`;

    if (pedestrianModalType) {
      pedestrianModalType.textContent = pedestrian.type || 'CITIZEN';
      pedestrianModalType.className = `status-pill ${
        pedestrian.type === 'EMERGENCY_STAFF' ? 'status-error' :
        (pedestrian.type === 'STUDENT' ? 'status-online' : 'status-cyan')
      }`;
    }

    if (pedestrianModalStatus) {
      const isMoving = pedestrian.status === 'WALKING' || pedestrian.status === 'CROSSING';
      pedestrianModalStatus.className = isMoving ? 'status-pill status-online' : 'status-pill status-loading';
      pedestrianModalStatus.innerHTML = `<span class="status-dot"></span> ${pedestrian.status || 'WALKING'}`;
    }

    if (pedestrianModalDest) {
      pedestrianModalDest.textContent = pedestrian.destination || 'CITY PARK';
    }

    if (pedestrianModalSpeed) {
      pedestrianModalSpeed.textContent = `${pedestrian.speed || 1.3} m/s`;
    }

    const x = pedestrian.coordinates?.x ?? 0;
    const y = pedestrian.coordinates?.y ?? 0;
    const z = pedestrian.coordinates?.z ?? 0;
    if (pedestrianModalCoords) {
      pedestrianModalCoords.textContent = `X: ${x} / Y: ${y} / Z: ${z}`;
    }
  }

  // Close Pedestrian Inspector Button
  if (pedestrianModalClose && pedestrianModal) {
    pedestrianModalClose.addEventListener('click', () => {
      pedestrianModal.classList.add('hidden');
      currentSelectedPedestrian = null;
      currentSelectedPersonId = null;
      if (cityScene.pedestrianSystem) {
        cityScene.pedestrianSystem.clearSelection();
      }
    });
  }

  // =========================================================================
  // STEP 9: ENERGY ANALYTICS & OPTIMIZATION INTEGRATION
  // =========================================================================

  // Energy HUD Loading / Unavailable state handlers (Fix 3)
  function setEnergyHudLoading() {
    if (energyHudPower) energyHudPower.textContent = 'Loading...';
    if (energyHudDaily) energyHudDaily.textContent = 'Loading...';
    if (energyHudMonthly) energyHudMonthly.textContent = 'Loading...';
    if (energyHudCost) energyHudCost.textContent = 'Loading...';
    if (energyHudSaved) energyHudSaved.textContent = 'Loading...';
    if (energyHudActive) energyHudActive.textContent = 'Loading...';
  }

  function setEnergyHudUnavailable() {
    if (energyHudPower) energyHudPower.textContent = 'Unavailable';
    if (energyHudDaily) energyHudDaily.textContent = 'Unavailable';
    if (energyHudMonthly) energyHudMonthly.textContent = 'Unavailable';
    if (energyHudCost) energyHudCost.textContent = 'Unavailable';
    if (energyHudSaved) energyHudSaved.textContent = 'Unavailable';
    if (energyHudActive) energyHudActive.textContent = 'Unavailable';
  }

  function updateEnergyGrid() {
    if (!energyAnalytics) return;
    if (!isStreetLightDataLoaded) {
      if (isStreetLightDataFailed) {
        setEnergyHudUnavailable();
      } else {
        setEnergyHudLoading();
      }
      return;
    }
    const isNight = cityScene?.lightingManager ? Boolean(cityScene.lightingManager.isNight) : true;
    const fleet = cityScene?.vehicleSimulation ? cityScene.vehicleSimulation.vehicles : [];
    const summary = energyAnalytics.calculateAnalytics(latestStreetLights, isNight, fleet, isEmergencyOverrideActive);
    updateEnergyAnalyticsUI(summary);
    if (cityScene?.updateEnergyIndicator) {
      cityScene.updateEnergyIndicator(summary.metrics);
    }
  }

  function updateEnergyAnalyticsUI(summary) {
    if (!summary || !summary.metrics) return;
    const m = summary.metrics;

    // 1. Update Compact HUD Panel
    if (energyHudPower) energyHudPower.textContent = `${m.currentPowerDemandKw} kW`;
    if (energyHudDaily) energyHudDaily.textContent = `${m.estimatedDailyKwh} kWh`;
    if (energyHudMonthly) energyHudMonthly.textContent = `${m.estimatedMonthlyKwh} kWh`;
    if (energyHudCost) energyHudCost.textContent = `₹${m.dailyCost}`;
    if (energyHudSaved) energyHudSaved.textContent = `${m.energySavedPct}%`;
    if (energyHudActive) energyHudActive.textContent = `${m.activeLights} / ${m.totalLights}`;
    if (energyModeBadge) {
      energyModeBadge.textContent = m.optimizationMode;
      energyModeBadge.className = `status-pill ${m.optimizationMode === 'ECO' ? 'status-online' : 'status-cyan'}`;
    }

    // 2. Update Modal if visible
    if (energyAnalyticsModal && !energyAnalyticsModal.classList.contains('hidden')) {
      if (energyModalModeStatus) {
        energyModalModeStatus.textContent = `${m.optimizationMode} MODE ACTIVE`;
        energyModalModeStatus.className = `status-pill ${m.optimizationMode === 'ECO' ? 'status-online' : 'status-cyan'}`;
      }
      if (energyKpiPower) energyKpiPower.textContent = `${m.currentPowerDemandKw} kW`;
      if (energyKpiConnected) energyKpiConnected.textContent = `${m.totalConnectedLoadKw}`;
      if (energyKpiPowerBar) {
        const pct = Math.min(100, Math.round((m.currentPowerDemandKw / (m.totalConnectedLoadKw || 1.92)) * 100));
        energyKpiPowerBar.style.width = `${pct}%`;
      }
      if (energyKpiSaved) energyKpiSaved.textContent = `${m.energySavedPct}%`;
      if (energyKpiSavedBar) energyKpiSavedBar.style.width = `${m.energySavedPct}%`;
      if (energyKpiDaily) energyKpiDaily.textContent = `${m.estimatedDailyKwh} kWh`;
      if (energyKpiMonthly) energyKpiMonthly.textContent = `${m.estimatedMonthlyKwh} kWh`;
      if (energyKpiDailyCost) energyKpiDailyCost.textContent = `₹${m.dailyCost}`;
      if (energyKpiMonthlyCost) energyKpiMonthlyCost.textContent = `₹${m.monthlyCost}`;
      if (energyTariffRate) energyTariffRate.textContent = `${summary.tariffPerKwh || 8.0}`;

      renderZoneAnalytics(summary.zones);
      renderEnergyAlerts(summary.alerts);
    }
  }

  function renderZoneAnalytics(zones) {
    if (!zoneAnalyticsList || !zones) return;
    let html = '';
    const zoneKeys = Object.keys(zones);

    zoneKeys.forEach(k => {
      const z = zones[k];
      const maxKw = 0.6; // Scale reference for CSS bar
      const barPct = Math.min(100, Math.max(10, Math.round((z.currentPowerKw / maxKw) * 100)));

      html += `
        <div class="zone-bar-item">
          <div class="zone-item-header">
            <span class="zone-name">${z.name}</span>
            <span class="zone-power-val">${z.currentPowerKw} kW <small style="color:var(--text-muted);">(${z.dailyKwh} kWh/day)</small></span>
          </div>
          <div class="zone-bar-row">
            <div class="zone-meter" title="Demand: ${z.currentPowerKw} kW">
              <div class="zone-meter-fill" style="width: ${barPct}%;"></div>
            </div>
            <span class="status-pill status-cyan" style="font-size:0.68rem; padding: 0.1rem 0.4rem;">${z.energySavedPct}% SAVED</span>
          </div>
          <div class="zone-sub-info">
            <span>Luminaires: ${z.activeLights} / ${z.totalLights} Active</span>
            <span>Avg Brightness: ${z.avgBrightness}%</span>
          </div>
        </div>
      `;
    });

    zoneAnalyticsList.innerHTML = html;
  }

  function renderEnergyAlerts(alerts) {
    if (!energyAlertsContainer) return;
    if (!Array.isArray(alerts) || alerts.length === 0) {
      energyAlertsContainer.innerHTML = '<div class="alert-empty">✅ All municipal energy sub-grids operating within optimal efficiency thresholds.</div>';
      if (energyAlertsCount) energyAlertsCount.textContent = '0 Active';
      return;
    }

    if (energyAlertsCount) energyAlertsCount.textContent = `${alerts.length} Active`;
    let html = '';
    alerts.forEach(a => {
      let alertClass = 'alert-info';
      if (a.type === 'WARNING') alertClass = 'alert-warning';
      else if (a.type === 'FAULT') alertClass = 'alert-fault';
      else if (a.type === 'SUCCESS') alertClass = 'alert-success';

      html += `
        <div class="alert-item ${alertClass}">
          <span class="alert-badge">${a.badge}</span>
          <span>${a.message}</span>
        </div>
      `;
    });
    energyAlertsContainer.innerHTML = html;
  }

  function openEnergyAnalyticsModal() {
    closeAllModals();
    if (!energyAnalyticsModal) return;
    energyAnalyticsModal.classList.remove('hidden');
    updateEnergyGrid();
  }

  if (btnOpenEnergyPanel) {
    btnOpenEnergyPanel.addEventListener('click', openEnergyAnalyticsModal);
  }

  if (energyModalClose) {
    energyModalClose.addEventListener('click', () => {
      if (energyAnalyticsModal) energyAnalyticsModal.classList.add('hidden');
    });
  }

  cityScene.setOnEnergyIndicatorSelect(() => {
    openEnergyAnalyticsModal();
  });

  let toastTimer = null;
  function showOptimizationToast(message) {
    if (!energyOptimizationToast) return;
    clearTimeout(toastTimer);
    energyOptimizationToast.textContent = message;
    energyOptimizationToast.classList.remove('hidden');
    toastTimer = setTimeout(() => {
      energyOptimizationToast.classList.add('hidden');
    }, 3500);
  }

  if (btnEnergyModeNormal) {
    btnEnergyModeNormal.addEventListener('click', () => {
      energyAnalytics.setMode('NORMAL');
      btnEnergyModeNormal.classList.add('active');
      if (btnEnergyModeEco) btnEnergyModeEco.classList.remove('active');
      showOptimizationToast('🟢 Normal Mode activated: standard adaptive vehicle radar lighting.');
      updateEnergyGrid();
    });
  }

  if (btnEnergyModeEco) {
    btnEnergyModeEco.addEventListener('click', () => {
      energyAnalytics.setMode('ECO');
      btnEnergyModeEco.classList.add('active');
      if (btnEnergyModeNormal) btnEnergyModeNormal.classList.remove('active');
      showOptimizationToast('🌿 Eco Mode activated: deep standby dimming (12-18%) on quiet avenues.');
      updateEnergyGrid();
    });
  }

  if (btnOptimizeLighting) {
    btnOptimizeLighting.addEventListener('click', () => {
      energyAnalytics.setMode('ECO');
      if (btnEnergyModeEco) btnEnergyModeEco.classList.add('active');
      if (btnEnergyModeNormal) btnEnergyModeNormal.classList.remove('active');
      showOptimizationToast('⚡ One-Click Optimization applied: grid tuned to Eco Mode with safety margins.');
      updateEnergyGrid();
    });
  }

  // Close Inspector Button
  if (lightModalClose && lightModal) {
    lightModalClose.addEventListener('click', () => {
      lightModal.classList.add('hidden');
      currentSelectedLight = null;
    });
  }

  // Status Control Button (ON / OFF)
  if (btnToggleLightPower) {
    btnToggleLightPower.addEventListener('click', async () => {
      if (!currentSelectedLight) return;
      const isFault = Boolean(currentSelectedLight.isFaulty || currentSelectedLight.status === 'FAULT');
      if (isFault) return; // Do not allow manual status change on faulty lights

      const currentStatus = currentSelectedLight.status;
      const targetStatus = currentStatus === 'ON' ? 'OFF' : 'ON';
      const targetId = currentSelectedLight.lightId;

      btnToggleLightPower.disabled = true;
      try {
        const result = await updateStreetLightStatus(targetId, targetStatus);
        const updatedLight = result.data;

        // Immediately update local cache
        const idx = latestStreetLights.findIndex(l => l.lightId === targetId);
        if (idx !== -1) latestStreetLights[idx] = updatedLight;
        currentSelectedLight = updatedLight;

        // Immediately update 3D scene & HUD
        cityScene.updateStreetLights([updatedLight]);
        updateLightingHUD();

        // Immediately re-render inspector
        renderLightDetails(updatedLight);
        showLightFeedback(`Status successfully updated to ${targetStatus}`);
        console.log(`[StreetLighting] Status PATCH succeeded: ${targetId} -> ${targetStatus}`);
      } catch (err) {
        console.error(`[StreetLighting] Status PATCH failed:`, err.message);
        showLightFeedback(`Status update failed: ${err.message}`, true);
        renderLightDetails(currentSelectedLight);
      } finally {
        if (currentSelectedLight && !currentSelectedLight.isFaulty && currentSelectedLight.status !== 'FAULT') {
          btnToggleLightPower.disabled = false;
        }
      }
    });
  }

  // Brightness Slider Control with Debounce (300-500ms)
  let brightnessDebounceTimer = null;
  if (lightBrightnessSlider) {
    lightBrightnessSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (lightSliderIndicator) {
        lightSliderIndicator.textContent = `${val}%`;
      }

      if (!currentSelectedLight) return;
      const isFault = Boolean(currentSelectedLight.isFaulty || currentSelectedLight.status === 'FAULT');
      if (isFault) return;

      clearTimeout(brightnessDebounceTimer);
      brightnessDebounceTimer = setTimeout(async () => {
        if (!currentSelectedLight) return;
        const targetId = currentSelectedLight.lightId;
        const targetBrightness = parseInt(lightBrightnessSlider.value, 10);

        try {
          const result = await updateStreetLightBrightness(targetId, targetBrightness);
          const updatedLight = result.data;

          // Immediately update local cache
          const idx = latestStreetLights.findIndex(l => l.lightId === targetId);
          if (idx !== -1) latestStreetLights[idx] = updatedLight;
          currentSelectedLight = updatedLight;

          // Immediately update 3D scene & HUD
          cityScene.updateStreetLights([updatedLight]);
          updateLightingHUD();

          // Immediately re-render inspector
          renderLightDetails(updatedLight);
          showLightFeedback(`Brightness successfully set to ${targetBrightness}%`);
          console.log(`[StreetLighting] Brightness PATCH succeeded: ${targetId} -> ${targetBrightness}%`);
        } catch (err) {
          console.error(`[StreetLighting] Brightness PATCH failed:`, err.message);
          showLightFeedback(`Brightness update failed: ${err.message}`, true);
          if (currentSelectedLight) {
            lightBrightnessSlider.value = currentSelectedLight.brightness ?? 80;
            if (lightSliderIndicator) {
              lightSliderIndicator.textContent = `${currentSelectedLight.brightness ?? 80}%`;
            }
          }
        }
      }, 400);
    });
  }

  // Mode Selector Control (AUTO / MANUAL / ECO_RADAR)
  if (lightModeSelect) {
    lightModeSelect.addEventListener('change', async (e) => {
      if (!currentSelectedLight) return;
      const isFault = Boolean(currentSelectedLight.isFaulty || currentSelectedLight.status === 'FAULT');
      if (isFault) return;

      const newMode = e.target.value;
      const targetId = currentSelectedLight.lightId;
      const oldMode = currentSelectedLight.mode || 'AUTO';

      lightModeSelect.disabled = true;
      try {
        const result = await updateStreetLightMode(targetId, newMode);
        const updatedLight = result.data;

        // Immediately update local cache
        const idx = latestStreetLights.findIndex(l => l.lightId === targetId);
        if (idx !== -1) latestStreetLights[idx] = updatedLight;
        currentSelectedLight = updatedLight;

        // Immediately update 3D scene & HUD
        cityScene.updateStreetLights([updatedLight]);
        updateLightingHUD();

        // Immediately re-render inspector
        renderLightDetails(updatedLight);
        showLightFeedback(`Operating mode set to ${newMode}`);
        console.log(`[StreetLighting] Mode PATCH succeeded: ${targetId} -> ${newMode}`);
      } catch (err) {
        console.error(`[StreetLighting] Mode PATCH failed:`, err.message);
        showLightFeedback(`Mode update failed: ${err.message}`, true);
        lightModeSelect.value = oldMode;
      } finally {
        if (currentSelectedLight && !currentSelectedLight.isFaulty && currentSelectedLight.status !== 'FAULT') {
          lightModeSelect.disabled = false;
        }
      }
    });
  }

  // Fault Reset Button (Visible ONLY for faulty lights)
  if (btnResetLightFault) {
    btnResetLightFault.addEventListener('click', async () => {
      if (!currentSelectedLight) return;
      const isFault = Boolean(currentSelectedLight.isFaulty || currentSelectedLight.status === 'FAULT');
      if (!isFault) return;

      const targetId = currentSelectedLight.lightId;

      // 1. Disable the button temporarily
      btnResetLightFault.disabled = true;

      // 2. Show: "Resetting diagnostic fault..."
      btnResetLightFault.textContent = '⏳ Resetting diagnostic fault...';
      showLightFeedback('Resetting diagnostic fault...');

      try {
        // 3. Call PATCH /api/street-lights/:lightId/reset-fault with body {}
        const result = await resetStreetLightFaultApi(targetId);
        const updatedLight = result.data;

        // 4. Update local cache, 3D system, HUD, and inspector
        const idx = latestStreetLights.findIndex(l => l.lightId === targetId);
        if (idx !== -1) latestStreetLights[idx] = updatedLight;
        currentSelectedLight = updatedLight;

        cityScene.updateStreetLights([updatedLight]);
        updateLightingHUD();
        renderLightDetails(updatedLight);

        // 5. Show success message
        showLightFeedback('Fault cleared successfully');
        console.log(`[StreetLighting] Fault reset succeeded for ${targetId}: Status=ON, isFaulty=false`);
      } catch (err) {
        console.error(`[StreetLighting] Fault reset failed:`, err.message);
        showLightFeedback(err.message || 'Fault reset failed', true);
        if (btnResetLightFault) {
          btnResetLightFault.disabled = false;
          btnResetLightFault.textContent = '🛠️ RESET FAULT';
        }
      }
    });
  }

  // 10. System Health Check
  checkSystemStatus(backendPill, backendText, dbPill, dbText);
  setInterval(() => {
    checkSystemStatus(backendPill, backendText, dbPill, dbText);
  }, 15000);
});

/**
 * Fetch real-time parking records from GET /api/parking
 */
async function fetchParkingData(
  cityScene,
  totalEl,
  availableEl,
  occupiedEl,
  rateEl,
  syncDotEl,
  onDataUpdated
) {
  try {
    const response = await fetch('/api/parking');
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const json = await response.json();
    const slots = Array.isArray(json.data) ? json.data : [];

    // Update 3D scene visual parking slots
    cityScene.updateParkingSlots(slots);

    // Calculate metrics
    const total = slots.length;
    const occupied = slots.filter((s) => s.isOccupied).length;
    const available = total - occupied;
    const occupancyPct = total > 0 ? Math.round((occupied / total) * 100) : 0;

    // Update HUD summary
    if (totalEl) totalEl.textContent = total;
    if (availableEl) availableEl.textContent = available;
    if (occupiedEl) occupiedEl.textContent = occupied;
    if (rateEl) rateEl.textContent = `${occupancyPct}%`;

    if (syncDotEl) {
      syncDotEl.className = 'status-dot status-online';
      syncDotEl.title = `Live MongoDB: ${total} slots (${available} vacant, ${occupied} occupied)`;
    }

    if (typeof onDataUpdated === 'function') {
      onDataUpdated(slots);
    }
  } catch (error) {
    console.warn('[Parking API] Could not load live parking data:', error.message);
    if (syncDotEl) {
      syncDotEl.className = 'status-dot status-error';
      syncDotEl.title = 'Parking API Sync Offline - Retrying...';
    }
  }
}

/**
 * Fetch real-time traffic signals from GET /api/traffic
 */
async function fetchTrafficData(cityScene, onDataUpdated, syncDotEl) {
  try {
    const response = await fetch('/api/traffic');
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const json = await response.json();
    const signals = Array.isArray(json.data) ? json.data : [];

    // Update 3D signals
    cityScene.updateTrafficSignals(signals);

    if (syncDotEl) {
      syncDotEl.className = 'status-dot status-online';
      syncDotEl.title = `Live MongoDB: ${signals.length} traffic junctions active`;
    }

    if (typeof onDataUpdated === 'function') {
      onDataUpdated(signals);
    }
  } catch (error) {
    console.warn('[Traffic API] Could not load live traffic data:', error.message);
    if (syncDotEl) {
      syncDotEl.className = 'status-dot status-error';
      syncDotEl.title = 'Traffic API Sync Offline - Retrying...';
    }
  }
}

/**
 * Fetch real-time emergency incidents from GET /api/incidents
 */
async function fetchEmergencyData(cityScene, onDataUpdated, syncDotEl) {
  try {
    const response = await fetch('/api/incidents');
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const json = await response.json();
    const incidents = Array.isArray(json.data) ? json.data : [];

    // Update 3D emergency markers and vehicles
    cityScene.updateEmergencyIncidents(incidents);

    if (syncDotEl) {
      const activeCount = incidents.filter(i => i.status !== 'RESOLVED').length;
      syncDotEl.className = 'status-dot status-online';
      syncDotEl.title = `Live MongoDB: ${activeCount} active emergencies`;
    }

    if (typeof onDataUpdated === 'function') {
      onDataUpdated(incidents);
    }
  } catch (error) {
    console.warn('[Emergency API] Could not load live emergency data:', error.message);
    if (syncDotEl) {
      syncDotEl.className = 'status-dot status-error';
      syncDotEl.title = 'Emergency API Sync Offline - Retrying...';
    }
  }
}

/**
 * Fetch health status from Express /api/status endpoint
 */
async function checkSystemStatus(backendPill, backendText, dbPill, dbText) {
  try {
    const response = await fetch('/api/status');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (backendPill && backendText) {
      backendPill.className = 'status-pill status-online';
      backendText.textContent = `Backend: ${data.status.toUpperCase()}`;
    }

    if (dbPill && dbText) {
      if (data.database && data.database.status === 'Connected') {
        dbPill.className = 'status-pill status-online';
        dbText.textContent = 'DB: Connected';
      } else {
        dbPill.className = 'status-pill status-error';
        dbText.textContent = 'DB: Disconnected';
      }
    }
  } catch (error) {
    console.warn('[Status Check] Backend unreachable:', error.message);
    if (backendPill && backendText) {
      backendPill.className = 'status-pill status-error';
      backendText.textContent = 'Backend: Offline';
    }
    if (dbPill && dbText) {
      dbPill.className = 'status-pill status-error';
      dbText.textContent = 'DB: Disconnected';
    }
  }
}

/**
 * Fetch real-time environment sensor readings and city summary from GET /api/environment
 */
async function fetchEnvironmentData(cityScene, onDataUpdated, syncDotEl) {
  try {
    const response = await fetch('/api/environment');
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const json = await response.json();
    const sensors = Array.isArray(json.data) ? json.data : [];
    const summary = json.summary || null;

    // Update 3D scene visual environment sensor towers
    cityScene.updateEnvironmentSensors(sensors);

    if (syncDotEl) {
      syncDotEl.className = 'status-dot status-online';
      syncDotEl.title = `Live Environment API: ${sensors.length} stations active`;
    }

    if (typeof onDataUpdated === 'function') {
      onDataUpdated(sensors, summary);
    }
  } catch (error) {
    console.warn('[Environment API] Could not load live environment data:', error.message);
    if (syncDotEl) {
      syncDotEl.className = 'status-dot status-error';
      syncDotEl.title = 'Environment API Sync Offline - Retrying...';
    }
  }
}

/**
 * Fetch real-time smart street lighting records from GET /api/street-lights
 */
async function fetchStreetLightData(cityScene, onDataUpdated, syncDotEl, onError) {
  try {
    const response = await fetch('/api/street-lights');
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const json = await response.json();
    const lights = Array.isArray(json.data) ? json.data : [];

    // Synchronize existing 3D street light nodes (matches API records by lightId SL-01 to SL-16)
    if (cityScene && typeof cityScene.updateStreetLights === 'function') {
      cityScene.updateStreetLights(lights);
    }

    if (syncDotEl) {
      syncDotEl.className = 'status-dot status-online';
      syncDotEl.title = `Live Street Lighting API: ${lights.length} luminaires synchronized`;
    }

    if (typeof onDataUpdated === 'function') {
      onDataUpdated(lights, json.summary);
    }
  } catch (error) {
    console.warn('[StreetLighting API] Failed to fetch live street light data:', error.message);
    if (syncDotEl) {
      syncDotEl.className = 'status-dot status-error';
      syncDotEl.title = 'Street Lighting API Sync Offline - Retrying...';
    }
    if (typeof onError === 'function') {
      onError(error);
    }
  }
}

/**
 * PATCH /api/street-lights/:lightId/status
 * Updates status to 'ON' or 'OFF'
 */
async function updateStreetLightStatus(lightId, status) {
  const response = await fetch(`/api/street-lights/${encodeURIComponent(lightId)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status })
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || `HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * PATCH /api/street-lights/:lightId/brightness
 * Updates brightness level (10 - 100%)
 */
async function updateStreetLightBrightness(lightId, brightness) {
  const response = await fetch(`/api/street-lights/${encodeURIComponent(lightId)}/brightness`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ brightness })
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || `HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * PATCH /api/street-lights/:lightId/mode
 * Updates operating mode (AUTO, MANUAL, ECO_RADAR)
 */
async function updateStreetLightMode(lightId, mode) {
  const response = await fetch(`/api/street-lights/${encodeURIComponent(lightId)}/mode`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ mode })
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || `HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * PATCH /api/street-lights/:lightId/reset-fault
 * Clears diagnostic fault safely
 */
async function resetStreetLightFaultApi(lightId) {
  const response = await fetch(`/api/street-lights/${encodeURIComponent(lightId)}/reset-fault`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || `HTTP ${response.status}`);
  }

  return await response.json();
}
