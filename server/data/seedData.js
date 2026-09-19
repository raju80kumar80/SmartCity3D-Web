import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import ParkingSlot from '../models/ParkingSlot.js';
import TrafficSignal from '../models/TrafficSignal.js';
import EmergencyIncident from '../models/EmergencyIncident.js';
import CityStat from '../models/CityStat.js';
import EnvironmentSensor from '../models/EnvironmentSensor.js';
import StreetLight from '../models/StreetLight.js';

// Setup environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedDatabase = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/smartcity3d';
  console.log('[Seed] Connecting to MongoDB database...');

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('[Seed] Database connected successfully.');

    // 1. Clear existing collections
    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      ParkingSlot.deleteMany({}),
      TrafficSignal.deleteMany({}),
      EmergencyIncident.deleteMany({}),
      CityStat.deleteMany({}),
      EnvironmentSensor.deleteMany({}),
      StreetLight.deleteMany({})
    ]);

    // 2. Seed Users
    console.log('[Seed] Creating default users...');
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@smartcity.com',
      password: 'password123',
      role: 'admin'
    });

    const citizenUser = await User.create({
      username: 'citizen',
      email: 'citizen@smartcity.com',
      password: 'password123',
      role: 'citizen'
    });
    console.log(`[Seed] Created users: admin (${adminUser.email}) and citizen (${citizenUser.email})`);

    // 3. Seed Smart Parking Slots (arranged matching 3D city grid coordinates)
    console.log('[Seed] Seeding parking slots...');
    const parkingData = [
      { slotCode: 'P-01', zone: 'North Plaza', isOccupied: false, vehicleNumber: '', coordinates: { x: -25, z: -25 } },
      { slotCode: 'P-02', zone: 'North Plaza', isOccupied: true,  vehicleNumber: 'KA-01-AB-1234', coordinates: { x: -20, z: -25 } },
      { slotCode: 'P-03', zone: 'North Plaza', isOccupied: false, vehicleNumber: '', coordinates: { x: -15, z: -25 } },
      { slotCode: 'P-04', zone: 'North Plaza', isOccupied: true,  vehicleNumber: 'MH-02-CD-5678', coordinates: { x: -10, z: -25 } },
      { slotCode: 'P-05', zone: 'South Commercial', isOccupied: false, vehicleNumber: '', coordinates: { x: 10, z: 25 } },
      { slotCode: 'P-06', zone: 'South Commercial', isOccupied: false, vehicleNumber: '', coordinates: { x: 15, z: 25 } },
      { slotCode: 'P-07', zone: 'South Commercial', isOccupied: true,  vehicleNumber: 'DL-04-EF-9012', coordinates: { x: 20, z: 25 } },
      { slotCode: 'P-08', zone: 'South Commercial', isOccupied: false, vehicleNumber: '', coordinates: { x: 25, z: 25 } }
    ];
    await ParkingSlot.insertMany(parkingData);
    console.log(`[Seed] Inserted ${parkingData.length} parking slots.`);

    // 4. Seed Traffic Signals
    console.log('[Seed] Seeding traffic signals...');
    const signalData = [
      { junctionId: 'J-NORTH', name: 'North Boulevard Junction', status: 'GREEN', emergencyOverride: false, cycleDuration: 15, coordinates: { x: 0, z: -35 } },
      { junctionId: 'J-SOUTH', name: 'South Highway Junction', status: 'RED', emergencyOverride: false, cycleDuration: 15, coordinates: { x: 0, z: 35 } },
      { junctionId: 'J-EAST',  name: 'East Commercial Avenue', status: 'GREEN', emergencyOverride: false, cycleDuration: 15, coordinates: { x: 35, z: 0 } },
      { junctionId: 'J-WEST',  name: 'West Residential Gate', status: 'RED', emergencyOverride: false, cycleDuration: 15, coordinates: { x: -35, z: 0 } }
    ];
    await TrafficSignal.insertMany(signalData);
    console.log(`[Seed] Inserted ${signalData.length} traffic junctions.`);

    // 5. Seed Initial Emergency Incident
    console.log('[Seed] Seeding sample emergency incident...');
    await EmergencyIncident.create({
      incidentId: 'INC-101',
      type: 'AMBULANCE',
      locationName: 'North Tech Park (Sector 3)',
      coordinates: { x: -14, z: -14 },
      description: 'Paramedic dispatch requested at Sector 3',
      severity: 'HIGH',
      status: 'REPORTED',
      reportedAt: new Date(Date.now() - 1000 * 60 * 20)
    });

    // 6. Seed City Metrics
    console.log('[Seed] Seeding city statistics baseline...');
    await CityStat.create({
      powerConsumptionKw: 1280,
      activeVehicles: 54,
      airQualityIndex: 38,
      waterConsumptionLiters: 9400,
      renewableEnergyPercentage: 72
    });

    // 7. Seed Smart Environmental Monitoring Stations
    console.log('[Seed] Seeding environmental monitoring stations...');
    const sensorData = [
      {
        sensorId: 'ENV-01',
        name: 'Central Eco Park Station',
        zone: 'PARK',
        coordinates: { x: 22, z: 18 },
        temperature: 22.4,
        humidity: 64,
        aqi: 28,
        pm25: 8,
        pm10: 16,
        co2: 395,
        no2: 12,
        status: 'GOOD',
        ecoFilterActive: false
      },
      {
        sensorId: 'ENV-02',
        name: 'Commercial Financial District Station',
        zone: 'COMMERCIAL',
        coordinates: { x: 22, z: -22 },
        temperature: 26.8,
        humidity: 48,
        aqi: 72,
        pm25: 24,
        pm10: 45,
        co2: 480,
        no2: 28,
        status: 'MODERATE',
        ecoFilterActive: false
      },
      {
        sensorId: 'ENV-03',
        name: 'Tech & Innovation Park Station',
        zone: 'TECH',
        coordinates: { x: -22, z: -20 },
        temperature: 24.1,
        humidity: 52,
        aqi: 45,
        pm25: 14,
        pm10: 28,
        co2: 420,
        no2: 19,
        status: 'GOOD',
        ecoFilterActive: false
      },
      {
        sensorId: 'ENV-04',
        name: 'Residential Living District Station',
        zone: 'RESIDENTIAL',
        coordinates: { x: -20, z: 22 },
        temperature: 23.5,
        humidity: 58,
        aqi: 38,
        pm25: 11,
        pm10: 22,
        co2: 405,
        no2: 15,
        status: 'GOOD',
        ecoFilterActive: false
      },
      {
        sensorId: 'ENV-05',
        name: 'Central Traffic Hub Roundabout Station',
        zone: 'TRANSIT',
        coordinates: { x: 6, z: -6 },
        temperature: 27.5,
        humidity: 46,
        aqi: 118,
        pm25: 42,
        pm10: 78,
        co2: 540,
        no2: 36,
        status: 'UNHEALTHY',
        ecoFilterActive: false
      },
      {
        sensorId: 'ENV-06',
        name: 'West Gate Industrial Corridor Station',
        zone: 'INDUSTRIAL',
        coordinates: { x: -45, z: -10 },
        temperature: 25.2,
        humidity: 50,
        aqi: 68,
        pm25: 22,
        pm10: 41,
        co2: 460,
        no2: 24,
        status: 'MODERATE',
        ecoFilterActive: false
      }
    ];
    await EnvironmentSensor.insertMany(sensorData);
    console.log(`[Seed] Inserted ${sensorData.length} environmental monitoring stations.`);

    // 8. Seed Smart Street Lights (16 road-aligned nodes, SL-08 with controlled DRIVER_FAULT)
    console.log('[Seed] Seeding smart street lights...');
    const streetLightData = [
      // North-South Avenue
      { lightId: 'SL-01', name: 'North-South Ave Luminaire 1', zone: 'COMMERCIAL', coordinates: { x: -7.5, y: 0, z: -60, rotationY: 0 }, status: 'ON', brightness: 80, mode: 'AUTO', powerRatingWatts: 120, energyConsumptionKWh: 1.25, energySavedPct: 35, isFaulty: false, faultType: 'NONE' },
      { lightId: 'SL-02', name: 'North-South Ave Luminaire 2', zone: 'COMMERCIAL', coordinates: { x: 7.5, y: 0, z: -40, rotationY: Math.PI }, status: 'ON', brightness: 80, mode: 'AUTO', powerRatingWatts: 120, energyConsumptionKWh: 1.28, energySavedPct: 35, isFaulty: false, faultType: 'NONE' },
      { lightId: 'SL-03', name: 'North-South Ave Luminaire 3', zone: 'TRANSIT', coordinates: { x: -7.5, y: 0, z: -20, rotationY: 0 }, status: 'ON', brightness: 85, mode: 'AUTO', powerRatingWatts: 120, energyConsumptionKWh: 1.34, energySavedPct: 30, isFaulty: false, faultType: 'NONE' },
      { lightId: 'SL-04', name: 'North-South Ave Luminaire 4', zone: 'TRANSIT', coordinates: { x: 7.5, y: 0, z: 20, rotationY: Math.PI }, status: 'ON', brightness: 85, mode: 'AUTO', powerRatingWatts: 120, energyConsumptionKWh: 1.31, energySavedPct: 30, isFaulty: false, faultType: 'NONE' },
      { lightId: 'SL-05', name: 'North-South Ave Luminaire 5', zone: 'RESIDENTIAL', coordinates: { x: -7.5, y: 0, z: 40, rotationY: 0 }, status: 'ON', brightness: 75, mode: 'AUTO', powerRatingWatts: 120, energyConsumptionKWh: 1.18, energySavedPct: 40, isFaulty: false, faultType: 'NONE' },
      { lightId: 'SL-06', name: 'North-South Ave Luminaire 6', zone: 'RESIDENTIAL', coordinates: { x: 7.5, y: 0, z: 60, rotationY: Math.PI }, status: 'ON', brightness: 75, mode: 'AUTO', powerRatingWatts: 120, energyConsumptionKWh: 1.20, energySavedPct: 40, isFaulty: false, faultType: 'NONE' },

      // East-West Avenue
      { lightId: 'SL-07', name: 'East-West Ave Luminaire 1', zone: 'TECH', coordinates: { x: -60, y: 0, z: -7.5, rotationY: Math.PI / 2 }, status: 'ON', brightness: 80, mode: 'AUTO', powerRatingWatts: 120, energyConsumptionKWh: 1.26, energySavedPct: 35, isFaulty: false, faultType: 'NONE' },
      { lightId: 'SL-08', name: 'East-West Ave Luminaire 2 (Faulty)', zone: 'TECH', coordinates: { x: -40, y: 0, z: 7.5, rotationY: -Math.PI / 2 }, status: 'FAULT', brightness: 0, mode: 'MANUAL', powerRatingWatts: 120, energyConsumptionKWh: 0.15, energySavedPct: 90, isFaulty: true, faultType: 'DRIVER_FAULT' },
      { lightId: 'SL-09', name: 'East-West Ave Luminaire 3', zone: 'TRANSIT', coordinates: { x: -20, y: 0, z: -7.5, rotationY: Math.PI / 2 }, status: 'ON', brightness: 85, mode: 'AUTO', powerRatingWatts: 120, energyConsumptionKWh: 1.35, energySavedPct: 30, isFaulty: false, faultType: 'NONE' },
      { lightId: 'SL-10', name: 'East-West Ave Luminaire 4', zone: 'TRANSIT', coordinates: { x: 20, y: 0, z: 7.5, rotationY: -Math.PI / 2 }, status: 'ON', brightness: 85, mode: 'AUTO', powerRatingWatts: 120, energyConsumptionKWh: 1.33, energySavedPct: 30, isFaulty: false, faultType: 'NONE' },
      { lightId: 'SL-11', name: 'East-West Ave Luminaire 5', zone: 'PARK', coordinates: { x: 40, y: 0, z: -7.5, rotationY: Math.PI / 2 }, status: 'ON', brightness: 70, mode: 'AUTO', powerRatingWatts: 120, energyConsumptionKWh: 1.12, energySavedPct: 45, isFaulty: false, faultType: 'NONE' },
      { lightId: 'SL-12', name: 'East-West Ave Luminaire 6', zone: 'PARK', coordinates: { x: 60, y: 0, z: 7.5, rotationY: -Math.PI / 2 }, status: 'ON', brightness: 70, mode: 'AUTO', powerRatingWatts: 120, energyConsumptionKWh: 1.10, energySavedPct: 45, isFaulty: false, faultType: 'NONE' },

      // Ring Road Intersections
      { lightId: 'SL-13', name: 'North-West Ring Intersection', zone: 'TECH', coordinates: { x: -44.5, y: 0, z: -50, rotationY: -Math.PI / 2 }, status: 'ON', brightness: 80, mode: 'AUTO', powerRatingWatts: 120, energyConsumptionKWh: 1.22, energySavedPct: 35, isFaulty: false, faultType: 'NONE' },
      { lightId: 'SL-14', name: 'North-East Ring Intersection', zone: 'COMMERCIAL', coordinates: { x: 44.5, y: 0, z: -50, rotationY: Math.PI / 2 }, status: 'ON', brightness: 80, mode: 'AUTO', powerRatingWatts: 120, energyConsumptionKWh: 1.25, energySavedPct: 35, isFaulty: false, faultType: 'NONE' },
      { lightId: 'SL-15', name: 'South-West Ring Intersection', zone: 'INDUSTRIAL', coordinates: { x: -44.5, y: 0, z: 50, rotationY: -Math.PI / 2 }, status: 'ON', brightness: 80, mode: 'AUTO', powerRatingWatts: 120, energyConsumptionKWh: 1.24, energySavedPct: 35, isFaulty: false, faultType: 'NONE' },
      { lightId: 'SL-16', name: 'South-East Ring Intersection', zone: 'PARK', coordinates: { x: 44.5, y: 0, z: 50, rotationY: Math.PI / 2 }, status: 'ON', brightness: 75, mode: 'AUTO', powerRatingWatts: 120, energyConsumptionKWh: 1.15, energySavedPct: 40, isFaulty: false, faultType: 'NONE' }
    ];
    await StreetLight.insertMany(streetLightData);
    console.log(`[Seed] Inserted ${streetLightData.length} smart street lighting nodes.`);

    console.log('====================================================');
    console.log('🎉 SmartCity3D-Web Database Seed Completed Successfully!');
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ [Seed Error]', error.message);
    console.log('[Seed Notice] Please ensure MongoDB is running or configure MONGO_URI in .env');
    process.exit(1);
  }
};

seedDatabase();
