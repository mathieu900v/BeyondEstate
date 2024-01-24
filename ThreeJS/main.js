// Voyer Mathieu Portfolio
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const renderer = new THREE.WebGLRenderer();

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xbbbbbb );
// const pmremGenerator = new THREE.PMREMGenerator( renderer );
// scene.environment = pmremGenerator.fromScene( new RoomEnvironment( renderer ), 0.0004 ).texture;
const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.0001, 100 );

let sky, sun, arrowHelper;
let exposureLabel = { text: 'Exposure: 1.00' };  // Initial dummy value
let azimuthLabel = { text: 'Azimuth: 180.00' }; // Initial dummy value
const lightSun = new THREE.DirectionalLight(0xffa500, 4);
const ambientLight = new THREE.AmbientLight(0x404040, 10); // Use a color that suits your scene
const targetColor = new THREE.Color(0xffa500); // Orange
const targetExposure = 0.1;

scene.add(ambientLight);
const effectController = {
    turbidity: 10,
    rayleigh: 3,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.94,
    elevation: 2,
    azimuth: 180
};

renderer.setSize( window.innerWidth, window.innerHeight );
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild( renderer.domElement );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.antialias = true;


const geometry = new THREE.BoxGeometry( 5, -0.0001, 5 );
const material = new THREE.MeshBasicMaterial( { color: 0xfbfbfb } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

// var ambient = new THREE.AmbientLight(0xFFFFFF, 3);
// scene.add(ambient);

const controls = new OrbitControls( camera, renderer.domElement );
			controls.target.set( 0, 0.1, 0 );
			controls.enablePan = false;
			controls.enableDamping = true;
            // controls.autoRotate = true;
            // controls.autoRotateSpeed = 0.2;
            controls.maxPolarAngle = Math.PI / 2;
            controls.update();


// Should use gITF for 3d import
const loader = new GLTFLoader();
loader.load( 'Models/HLM1/scene.gltf', function ( gltf ) {

	scene.add( gltf.scene );

}, undefined, function ( error ) {

	console.error( error );

} );

scene.add(lightSun);

const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

arrowHelper = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), sun, 0.0001, 0xffa500, 0.15, 0.075);
scene.add(arrowHelper);

camera.position.z = 4;

function initSky() {

    // Add Sky
    sky = new Sky();
    sky.scale.setScalar( 450000 );
    scene.add( sky );

    sun = new THREE.Vector3();
    /// GUI

    function guiChanged() {

        const uniforms = sky.material.uniforms;
        const phi = THREE.MathUtils.degToRad( 90 - effectController.elevation );
        const theta = THREE.MathUtils.degToRad( effectController.azimuth * (phi/15) );

        sun.setFromSphericalCoords( 1, phi, theta );

        uniforms[ 'sunPosition' ].value.copy( sun );

        renderer.render( scene, camera );

    }

    const gui = new GUI();
    gui.add(azimuthLabel, 'text').name('Azimuth').listen(); // Add Azimuth to the GUI
    gui.add(exposureLabel, 'text').name('Exposure').listen();  // Using 'listen' to make it read-only
    gui.add( effectController, 'elevation', 0, 180, 0.01 ).onChange( guiChanged );
    guiChanged();
}

initSky();

function animate() {
	requestAnimationFrame( animate );
    lightSun.position.copy(sun);
    arrowHelper.position.copy(sun);
    arrowHelper.setDirection(new THREE.Vector3(0, 0, 0).sub(sun).normalize());
	// cube.rotation.x += 0.01;
	// cube.rotation.y += 0.01;
    //pointLight.setFromSphericalCoords( 1, phi, theta);
    let lerpFactor;
    if (effectController.elevation >= 0 && effectController.elevation <= 10) {
        // For elevation values between 0-10, use a lerpFactor that increases towards 1
        lerpFactor = THREE.MathUtils.clamp(effectController.elevation / 10, 0, 0.65);
    } else if (effectController.elevation >= 170 && effectController.elevation <= 180) {
        // For elevation values between 170-180, use a lerpFactor that increases towards 1
        lerpFactor = THREE.MathUtils.clamp((180 - effectController.elevation) / 10, 0, 0.65);
    } else {
        // For other elevation values, use a parabolic pattern with higher exposure values around 90 degrees
        lerpFactor = 0.65;
    }

    azimuthLabel.text = `Azimuth: ${effectController.azimuth.toFixed(2)}`;



    lightSun.color.setRGB(
        targetColor.r + (1 - targetColor.r) * lerpFactor,
        targetColor.g + (1 - targetColor.g) * lerpFactor,
        targetColor.b + (1 - targetColor.b) * lerpFactor
    );
      renderer.toneMappingExposure = THREE.MathUtils.lerp(1, targetExposure, 1 - lerpFactor);

      const colorHex = lightSun.color.getHexString();
      exposureLabel.text = `Exp: ${renderer.toneMappingExposure.toFixed(2)}  | #${colorHex}`;

	renderer.render( scene, camera );

    
}

animate();