/**
 * EnergyAnalytics.js
 * Smart City 3D - Energy Optimization & Analytics Engine
 * Calculates real-time electrical demand, projected daily/monthly consumption,
 * tariff-based cost estimations, zone-level power breakdowns, adaptive eco-optimization,
 * and grid telemetry advisories for the municipal smart lighting network.
 */

export const ELECTRICITY_RATE_PER_KWH = 8.0; // Configurable tariff constant (currency units per kWh)

export const ZONE_NAMES = {
  COMMERCIAL: 'Commercial Skyscraper District',
  RESIDENTIAL: 'Residential Living District',
  TECH: 'Tech & Innovation Park',
  TRANSIT: 'Transit & Avenue Arteries',
  PARK: 'Central Park & Leisure Zone',
  INDUSTRIAL: 'Industrial District'
};

export class EnergyAnalytics {
  constructor() {
    this.ratePerKwh = ELECTRICITY_RATE_PER_KWH;
    this.mode = 'NORMAL'; // 'NORMAL' | 'ECO'
    this.lastUpdateTime = Date.now();

    // Aggregated grid metrics
    this.metrics = {
      totalConnectedLoadKw: 1.92, // 16 lights * 120W / 1000
      currentPowerDemandKw: 0.96,
      baselinePowerDemandKw: 1.92,
      estimatedDailyKwh: 18.5,
      estimatedMonthlyKwh: 555.0,
      energySavedPct: 38.0,
      dailyCost: 148.0,
      monthlyCost: 4440.0,
      totalLights: 16,
      activeLights: 15,
      faultyLights: 1,
      avgBrightness: 72,
      isNight: true,
      optimizationMode: 'NORMAL'
    };

    // Baseline 5 zone breakdown
    this.zones = {
      COMMERCIAL:  { name: ZONE_NAMES.COMMERCIAL,  totalLights: 3, activeLights: 3, avgBrightness: 80, currentPowerKw: 0.28, dailyKwh: 3.78, energySavedPct: 35 },
      RESIDENTIAL: { name: ZONE_NAMES.RESIDENTIAL, totalLights: 2, activeLights: 2, avgBrightness: 75, currentPowerKw: 0.18, dailyKwh: 2.38, energySavedPct: 40 },
      TECH:        { name: ZONE_NAMES.TECH,        totalLights: 3, activeLights: 2, avgBrightness: 80, currentPowerKw: 0.19, dailyKwh: 2.63, energySavedPct: 45 },
      TRANSIT:     { name: ZONE_NAMES.TRANSIT,     totalLights: 4, activeLights: 4, avgBrightness: 85, currentPowerKw: 0.40, dailyKwh: 5.33, energySavedPct: 30 },
      PARK:        { name: ZONE_NAMES.PARK,        totalLights: 4, activeLights: 4, avgBrightness: 72, currentPowerKw: 0.35, dailyKwh: 4.47, energySavedPct: 42 }
    };

    // Active Grid Alerts
    this.alerts = [];
  }

  /**
   * Set optimization mode ('NORMAL' or 'ECO')
   */
  setMode(mode) {
    if (mode === 'ECO' || mode === 'NORMAL') {
      this.mode = mode;
      this.metrics.optimizationMode = mode;
    }
  }

  getMode() {
    return this.mode;
  }

  /**
   * Calculates comprehensive energy analytics based on live StreetLight records,
   * day/night state, vehicle positions, and emergency corridor status.
   */
  calculateAnalytics(streetLights = [], isNight = true, vehicles = [], isEmergencyCorridor = false) {
    if (!Array.isArray(streetLights) || streetLights.length === 0) {
      return this.getSummary();
    }

    const isEco = this.mode === 'ECO';
    let totalConnectedWatts = 0;
    let currentLiveWatts = 0;
    let healthyCount = 0;
    let activeCount = 0;
    let faultyCount = 0;
    let sumBrightness = 0;
    let totalDailyKwh = 0;

    // Reset zone aggregates with the 5 baseline zones
    const zoneAgg = {
      COMMERCIAL:  { name: ZONE_NAMES.COMMERCIAL,  total: 0, active: 0, sumBrightness: 0, liveWatts: 0, dailyKwh: 0, healthyTotal: 0 },
      RESIDENTIAL: { name: ZONE_NAMES.RESIDENTIAL, total: 0, active: 0, sumBrightness: 0, liveWatts: 0, dailyKwh: 0, healthyTotal: 0 },
      TECH:        { name: ZONE_NAMES.TECH,        total: 0, active: 0, sumBrightness: 0, liveWatts: 0, dailyKwh: 0, healthyTotal: 0 },
      TRANSIT:     { name: ZONE_NAMES.TRANSIT,     total: 0, active: 0, sumBrightness: 0, liveWatts: 0, dailyKwh: 0, healthyTotal: 0 },
      PARK:        { name: ZONE_NAMES.PARK,        total: 0, active: 0, sumBrightness: 0, liveWatts: 0, dailyKwh: 0, healthyTotal: 0 }
    };

    streetLights.forEach(light => {
      const powerRating = light.powerRatingWatts || 120;
      totalConnectedWatts += powerRating;

      // Extract zone safely without forcing INDUSTRIAL to TECH
      let zoneKey = (light.zone || 'COMMERCIAL').toUpperCase().trim();
      if (!zoneAgg[zoneKey]) {
        // Dynamically register zone (e.g. INDUSTRIAL -> "Industrial District")
        const friendlyName = ZONE_NAMES[zoneKey] || `${zoneKey.charAt(0).toUpperCase() + zoneKey.slice(1).toLowerCase()} District`;
        zoneAgg[zoneKey] = {
          name: friendlyName,
          total: 0,
          active: 0,
          sumBrightness: 0,
          liveWatts: 0,
          dailyKwh: 0,
          healthyTotal: 0
        };
      }

      zoneAgg[zoneKey].total++;

      const isFault = Boolean(light.isFaulty || light.status === 'FAULT');
      if (isFault) {
        faultyCount++;
        return; // Faulty luminaires consume 0 live functional power
      }

      healthyCount++;
      zoneAgg[zoneKey].healthyTotal++;

      if (light.status === 'OFF') {
        return; // Switched OFF
      }

      // Calculate effective live brightness and power
      let effectiveBrightness = light.brightness ?? 80;

      if (!isNight) {
        // DAYTIME
        if (light.mode === 'MANUAL') {
          effectiveBrightness = Math.min(30, effectiveBrightness);
        } else {
          effectiveBrightness = 0; // Standby
        }
      } else {
        // NIGHT TIME
        if (light.mode !== 'MANUAL') {
          // Check proximity to vehicle traffic
          let minDist = 999;
          let ambulanceNear = false;

          if (Array.isArray(vehicles) && vehicles.length > 0 && light.coordinates) {
            const lx = light.coordinates.x ?? 0;
            const lz = light.coordinates.z ?? 0;

            for (let i = 0; i < vehicles.length; i++) {
              const v = vehicles[i];
              const vp = v.position || v.meshGroup?.position;
              if (!vp) continue;

              const d = Math.hypot(lx - vp.x, lz - vp.z);
              if (d < minDist) minDist = d;
              if (v.type === 'AMBULANCE' && d <= 25) {
                ambulanceNear = true;
              }
            }
          }

          if (isEmergencyCorridor || ambulanceNear) {
            // Emergency Corridor triggers 100% illumination regardless of mode
            effectiveBrightness = 100;
          } else if (isEco) {
            // ECO MODE: Lower baseline on quiet roads and faster dimming
            if (minDist <= 15) {
              effectiveBrightness = 80;
            } else if (minDist <= 25) {
              effectiveBrightness = 40;
            } else {
              // Deep eco standby
              effectiveBrightness = zoneKey === 'PARK' || zoneKey === 'RESIDENTIAL' ? 12 : 18;
            }
          } else {
            // NORMAL MODE: Standard adaptive radar
            if (minDist <= 18) {
              effectiveBrightness = 88;
            } else if (minDist <= 30) {
              effectiveBrightness = 50;
            } else {
              effectiveBrightness = light.mode === 'ECO_RADAR' ? 15 : 25;
            }
          }
        }
      }

      if (effectiveBrightness > 0) {
        activeCount++;
        zoneAgg[zoneKey].active++;
        sumBrightness += effectiveBrightness;
        zoneAgg[zoneKey].sumBrightness += effectiveBrightness;

        const liveWatts = powerRating * (effectiveBrightness / 100);
        currentLiveWatts += liveWatts;
        zoneAgg[zoneKey].liveWatts += liveWatts;
      }

      // Base daily energy estimate from database or power rating
      const baseDailyKwh = light.energyConsumptionKWh || ((powerRating * 10 * 0.75) / 1000); // ~1.1 to 1.3 kWh
      const ecoFactor = isEco ? 0.82 : 1.0;
      const effectiveDailyKwh = Number((baseDailyKwh * ecoFactor).toFixed(2));

      totalDailyKwh += effectiveDailyKwh;
      zoneAgg[zoneKey].dailyKwh += effectiveDailyKwh;
    });

    // Grid Totals
    const totalConnectedKw = Number((totalConnectedWatts / 1000).toFixed(2));
    const currentDemandKw = Number((currentLiveWatts / 1000).toFixed(2));
    const baselineKw = Number(((healthyCount * 120) / 1000).toFixed(2)); // Baseline: all healthy at 100%

    // Calculate energy saving % relative to full baseline
    let savedPct = 0;
    if (baselineKw > 0) {
      savedPct = Math.round(((baselineKw - currentDemandKw) / baselineKw) * 100);
    }
    savedPct = Math.max(5, Math.min(95, savedPct));

    const avgBright = activeCount > 0 ? Math.round(sumBrightness / activeCount) : 0;
    const finalDailyKwh = Number(totalDailyKwh.toFixed(1));
    const monthlyKwh = Number((finalDailyKwh * 30).toFixed(1));
    const dailyCost = Number((finalDailyKwh * this.ratePerKwh).toFixed(2));
    const monthlyCost = Number((monthlyKwh * this.ratePerKwh).toFixed(2));

    this.metrics = {
      totalConnectedLoadKw: totalConnectedKw,
      currentPowerDemandKw: currentDemandKw,
      baselinePowerDemandKw: baselineKw,
      estimatedDailyKwh: finalDailyKwh,
      estimatedMonthlyKwh: monthlyKwh,
      energySavedPct: savedPct,
      dailyCost: dailyCost,
      monthlyCost: monthlyCost,
      totalLights: streetLights.length,
      activeLights: activeCount,
      faultyLights: faultyCount,
      avgBrightness: avgBright,
      isNight: isNight,
      optimizationMode: this.mode
    };

    // Calculate Zone Breakdowns: preserve base 5 zones, add dynamic zones (such as INDUSTRIAL) only when data exists
    const baseZones = ['COMMERCIAL', 'RESIDENTIAL', 'TECH', 'TRANSIT', 'PARK'];
    const updatedZones = {};

    for (const [key, z] of Object.entries(zoneAgg)) {
      if (baseZones.includes(key) || z.total > 0) {
        const zLiveKw = Number((z.liveWatts / 1000).toFixed(2));
        const zBaseKw = (z.healthyTotal * 120) / 1000;
        let zSaved = 0;
        if (zBaseKw > 0) {
          zSaved = Math.round(((zBaseKw - zLiveKw) / zBaseKw) * 100);
        }
        zSaved = Math.max(5, Math.min(95, zSaved));

        updatedZones[key] = {
          name: z.name,
          totalLights: z.total,
          activeLights: z.active,
          avgBrightness: z.active > 0 ? Math.round(z.sumBrightness / z.active) : 0,
          currentPowerKw: zLiveKw,
          dailyKwh: Number(z.dailyKwh.toFixed(1)),
          energySavedPct: zSaved
        };
      }
    }
    this.zones = updatedZones;

    // Evaluate Informational Grid Alerts
    this.evaluateAlerts();

    this.lastUpdateTime = Date.now();
    return this.getSummary();
  }

  /**
   * Generates non-intrusive informational grid alerts based on live thresholds
   */
  evaluateAlerts() {
    this.alerts = [];

    // 1. High Power Demand Advisory (> 80% of total connected load)
    if (this.metrics.totalConnectedLoadKw > 0) {
      const loadRatio = this.metrics.currentPowerDemandKw / this.metrics.totalConnectedLoadKw;
      if (loadRatio > 0.85) {
        this.alerts.push({
          type: 'WARNING',
          badge: 'HIGH LOAD',
          message: `Grid power demand is at ${(loadRatio * 100).toFixed(0)}% capacity (${this.metrics.currentPowerDemandKw} kW). Consider activating Eco Mode.`
        });
      }
    }

    // 2. Faulty Luminaires Advisory
    if (this.metrics.faultyLights > 0) {
      this.alerts.push({
        type: 'FAULT',
        badge: 'DIAGNOSTIC FAULT',
        message: `${this.metrics.faultyLights} luminaire(s) isolated due to diagnostic driver faults. Excluded from normal active load.`
      });
    }

    // 3. Low Energy Savings Advisory (< 25% savings in night mode)
    if (this.metrics.isNight && this.metrics.energySavedPct < 25) {
      this.alerts.push({
        type: 'INFO',
        badge: 'LOW SAVINGS',
        message: `Adaptive energy savings currently at ${this.metrics.energySavedPct}%. High traffic volume active.`
      });
    }

    // 4. Zone Imbalance Check (> 35% of total grid power consumed in single zone)
    if (this.metrics.currentPowerDemandKw > 0.5) {
      for (const [key, zone] of Object.entries(this.zones)) {
        const zoneRatio = zone.currentPowerKw / this.metrics.currentPowerDemandKw;
        if (zoneRatio > 0.38) {
          this.alerts.push({
            type: 'INFO',
            badge: 'ZONE PEAK',
            message: `${zone.name} accounts for ${(zoneRatio * 100).toFixed(0)}% of live grid demand.`
          });
          break; // Flag at most one peak zone
        }
      }
    }

    // 5. Eco Mode Active Advisory
    if (this.mode === 'ECO') {
      this.alerts.push({
        type: 'SUCCESS',
        badge: 'ECO ACTIVE',
        message: `Dynamic Eco Optimization active. Standby floor reduced to 12-18% on quiet avenues.`
      });
    }
  }

  /**
   * Returns a complete consolidated energy analytics payload
   */
  getSummary() {
    return {
      metrics: { ...this.metrics },
      zones: { ...this.zones },
      alerts: [ ...this.alerts ],
      tariffPerKwh: this.ratePerKwh,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Helper for Street Light Inspector integration
   */
  getLightEnergyBreakdown(light) {
    if (!light) return null;
    const powerRating = light.powerRatingWatts || 120;
    const isFault = Boolean(light.isFaulty || light.status === 'FAULT');
    const isOff = light.status === 'OFF';

    const brightness = isFault || isOff ? 0 : (light.brightness ?? 80);
    const livePowerWatts = Math.round(powerRating * (brightness / 100));
    const livePowerKw = Number((livePowerWatts / 1000).toFixed(3));
    const dailyKwh = Number((light.energyConsumptionKWh || (livePowerWatts * 10 / 1000)).toFixed(2));
    const savedPct = light.energySavedPct || Math.max(0, 100 - brightness);

    let zoneName = (light.zone || 'COMMERCIAL').toUpperCase().trim();
    const zoneData = this.zones[zoneName];

    let zoneContributionPct = 0;
    if (zoneData && zoneData.currentPowerKw > 0) {
      zoneContributionPct = Math.round((livePowerKw / zoneData.currentPowerKw) * 100);
    }

    return {
      powerRatingWatts: powerRating,
      currentBrightness: brightness,
      livePowerWatts: livePowerWatts,
      livePowerKw: livePowerKw,
      dailyEnergyKwh: dailyKwh,
      energySavedPct: savedPct,
      zone: zoneName,
      zoneContributionPct: Math.min(100, zoneContributionPct)
    };
  }
}
