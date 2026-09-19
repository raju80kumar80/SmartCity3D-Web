import * as THREE from 'three';

/**
 * LightingManager
 * Handles scene illumination, soft shadows, and Day/Night dynamic transitions.
 */
export class LightingManager {
  constructor(scene) {
    this.scene = scene;
    this.isNight = false;

    this.ambientLight = null;
    this.hemiLight = null;
    this.sunLight = null;
    this.streetLights = [];

    this.init();
  }

  init() {
    // 1. Hemisphere light (subtle sky/ground gradient)
    this.hemiLight = new THREE.HemisphereLight(0xdde6ed, 0x1e293b, 0.6);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    // 2. Ambient light (base visibility)
    this.ambientLight = new THREE.AmbientLight(0xcfd8dc, 0.45);
    this.scene.add(this.ambientLight);

    // 3. Directional Sun/Moon Light with soft shadows
    this.sunLight = new THREE.DirectionalLight(0xfff8e7, 1.4);
    this.sunLight.position.set(65, 95, 45);
    this.sunLight.castShadow = true;

    // High fidelity shadow map settings
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 250;
    this.sunLight.shadow.bias = -0.0005;

    // Shadow frustum covering the full city grid
    const d = 95;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;

    this.scene.add(this.sunLight);
  }

  /**
   * Register a street lamp light source for night activation
   */
  registerStreetLight(pointLight) {
    this.streetLights.push(pointLight);
    pointLight.visible = this.isNight;
  }

  /**
   * Toggle between Day and Night environments
   */
  toggleDayNight() {
    this.isNight = !this.isNight;
    this.applyLightingMode();
    return this.isNight;
  }

  setDayMode() {
    this.isNight = false;
    this.applyLightingMode();
  }

  setNightMode() {
    this.isNight = true;
    this.applyLightingMode();
  }

  applyLightingMode() {
    if (this.isNight) {
      // Night Mode
      this.scene.background = new THREE.Color(0x060913);
      if (this.scene.fog) {
        this.scene.fog.color.setHex(0x060913);
      }
      this.sunLight.color.setHex(0x60a5fa); // Cool moonlight
      this.sunLight.intensity = 0.35;
      this.ambientLight.color.setHex(0x1e293b);
      this.ambientLight.intensity = 0.3;
      this.hemiLight.intensity = 0.25;

      // Turn on all street lights
      this.streetLights.forEach(light => {
        light.visible = true;
      });
    } else {
      // Day Mode
      this.scene.background = new THREE.Color(0x0a0f1d);
      if (this.scene.fog) {
        this.scene.fog.color.setHex(0x0a0f1d);
      }
      this.sunLight.color.setHex(0xfff8e7); // Warm sunlight
      this.sunLight.intensity = 1.4;
      this.ambientLight.color.setHex(0xcfd8dc);
      this.ambientLight.intensity = 0.45;
      this.hemiLight.intensity = 0.6;

      // Turn off street lights in day
      this.streetLights.forEach(light => {
        light.visible = false;
      });
    }
  }
}
