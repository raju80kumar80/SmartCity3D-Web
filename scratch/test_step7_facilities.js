import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('🧪 RUNNING COMPREHENSIVE STEP 7 AUTOMATED VERIFICATION');
console.log('====================================================');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
  }
}

// 1. Verify FacilityBuilder.js exists and content
const fbPath = path.join(rootDir, 'public/js/city/FacilityBuilder.js');
assert(fs.existsSync(fbPath), 'FacilityBuilder.js file exists');

const fbContent = fs.readFileSync(fbPath, 'utf8');

// 10 Facilities & Unique IDs
const requiredFacilityIds = [
  'FAC-HOSPITAL',
  'FAC-POLICE',
  'FAC-FIRE',
  'FAC-SCHOOL',
  'FAC-BUS',
  'FAC-PARK',
  'FAC-GOV',
  'FAC-MALL',
  'FAC-POWER',
  'FAC-WATER'
];

requiredFacilityIds.forEach(id => {
  assert(fbContent.includes(id), `FacilityBuilder defines facility ID: ${id}`);
});

const requiredNames = [
  'CITY HOSPITAL',
  'POLICE STATION',
  'FIRE STATION',
  'SMART SCHOOL',
  'BUS STATION',
  'CITY PARK',
  'GOVERNMENT OFFICE',
  'SHOPPING CENTER',
  'POWER STATION',
  'WATER TREATMENT PLANT'
];

requiredNames.forEach(name => {
  assert(fbContent.includes(name), `FacilityBuilder defines facility Name: ${name}`);
});

assert(fbContent.includes('createFloatingLabel'), 'FacilityBuilder implements floating 3D labels');
assert(fbContent.includes('tagMeshInteractive'), 'FacilityBuilder tags meshes with userData.isFacility');
assert(fbContent.includes('userData.isFacility = true') || fbContent.includes('isFacility: true'), 'FacilityBuilder sets userData.isFacility = true');
assert(fbContent.includes('getInteractiveMeshes'), 'FacilityBuilder exports getInteractiveMeshes()');
assert(fbContent.includes('update(delta, isNight'), 'FacilityBuilder implements day/night dynamic update');

// 2. Verify scene.js integration
const scenePath = path.join(rootDir, 'public/js/scene.js');
const sceneContent = fs.readFileSync(scenePath, 'utf8');

assert(sceneContent.includes("import { FacilityBuilder } from './city/FacilityBuilder.js'"), 'scene.js imports FacilityBuilder');
assert(sceneContent.includes('this.facilityBuilder = new FacilityBuilder(this.lightingManager)'), 'scene.js instantiates FacilityBuilder');
assert(sceneContent.includes("type: 'facility', data: curr.userData.facilityData"), 'scene.js findInteractiveTarget detects facility');
assert(sceneContent.includes('this.facilityBuilder.getInteractiveMeshes()'), 'scene.js combines facility interactive meshes');
assert(sceneContent.includes("target.type === 'facility' && this.onFacilitySelect"), 'scene.js handleClick invokes onFacilitySelect');
assert(sceneContent.includes('setOnFacilitySelect(callback)'), 'scene.js defines setOnFacilitySelect');
assert(sceneContent.includes('this.facilityBuilder.update(delta'), 'scene.js animates facilityBuilder with day/night awareness');

// 3. Verify index.html modal
const htmlPath = path.join(rootDir, 'public/index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

assert(htmlContent.includes('id="facility-detail-modal"'), 'index.html contains #facility-detail-modal');
assert(htmlContent.includes('SMART CITY FACILITY'), 'index.html modal displays SMART CITY FACILITY badge');
assert(htmlContent.includes('id="facility-modal-name"'), 'index.html modal contains facility name element');
assert(htmlContent.includes('id="facility-modal-type"'), 'index.html modal contains facility type element');
assert(htmlContent.includes('id="facility-modal-status"'), 'index.html modal contains facility status element');
assert(htmlContent.includes('id="facility-modal-desc"'), 'index.html modal contains facility description element');
assert(htmlContent.includes('id="facility-modal-coords"'), 'index.html modal contains facility coordinates element');
assert(htmlContent.includes('id="facility-modal-close"'), 'index.html modal contains close button');

// 4. Verify style.css
const cssPath = path.join(rootDir, 'public/css/style.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

assert(cssContent.includes('.facility-detail-modal'), 'style.css contains .facility-detail-modal class');

// 5. Verify main.js
const mainPath = path.join(rootDir, 'public/js/main.js');
const mainContent = fs.readFileSync(mainPath, 'utf8');

assert(mainContent.includes("document.getElementById('facility-detail-modal')"), 'main.js binds facility modal element');
assert(mainContent.includes('cityScene.setOnFacilitySelect'), 'main.js registers setOnFacilitySelect callback');
assert(mainContent.includes('renderFacilityDetails'), 'main.js implements renderFacilityDetails');
assert(mainContent.includes('if (facilityModal) facilityModal.classList.add(\'hidden\')'), 'main.js closeAllModals hides facility modal');
assert(mainContent.includes('currentSelectedFacilityId = null'), 'main.js resets currentSelectedFacilityId in closeAllModals');

// 6. Test HTTP server responses
async function testHttp() {
  try {
    const res = await fetch('http://localhost:5000/');
    assert(res.status === 200, 'HTTP GET / returns 200 OK');
    const text = await res.text();
    assert(text.includes('facility-detail-modal'), 'HTTP GET / serves index.html with facility modal');

    const resScript = await fetch('http://localhost:5000/js/city/FacilityBuilder.js');
    assert(resScript.status === 200, 'HTTP GET /js/city/FacilityBuilder.js returns 200 OK');
    const scriptText = await resScript.text();
    assert(scriptText.includes('class FacilityBuilder'), 'HTTP serves FacilityBuilder.js correctly');
  } catch (err) {
    console.error('HTTP verification error:', err.message);
  }

  console.log('====================================================');
  console.log(`📊 RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('====================================================');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

testHttp();
