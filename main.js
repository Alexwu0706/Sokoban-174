import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';


const scene = new THREE.Scene();

//THREE.PerspectiveCamera( fov angle, aspect ratio, near depth, far depth );
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 5, 10);
controls.target.set(0, 5, 0);

// Rendering 3D axis
const createAxisLine = (color, start, end) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineBasicMaterial({ color: color });
    return new THREE.Line(geometry, material);
};
const xAxis = createAxisLine(0xff0000, new THREE.Vector3(0, 0, 0), new THREE.Vector3(3, 0, 0)); // Red
const yAxis = createAxisLine(0x00ff00, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 3, 0)); // Green
const zAxis = createAxisLine(0x0000ff, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 3)); // Blue
// scene.add(xAxis);
// scene.add(yAxis);
// scene.add(zAxis);

// Project
// Setting up the lights
const pointLight = new THREE.PointLight(0xffffff, 100, 100);
pointLight.position.set(5, 5, 5); // Position the light
scene.add(pointLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0.5, .0, 1.0).normalize();
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0x505050);  // Soft white light
scene.add(ambientLight);

const phong_material = new THREE.MeshPhongMaterial({
    color: 0x00ff00, // Green color
    shininess: 100   // Shininess of the material
});


// Start here.
///secion 1////////////////////////////////////////////////////////////////
const l = 0.5
const positions = new Float32Array([
    // Front face
    -l, -l,  l, // 0
     l, -l,  l, // 1
     l,  l,  l, // 2
    -l,  l,  l, // 3

    // Left face
    -l, -l, -l, // 4
    -l, -l,  l, // 5
    -l,  l,  l, // 6 
    -l,  l, -l, // 7
  
    // Top face
   -l,  l,  l, // 8 
    l,  l,  l, // 9 
    l,  l, -l, // 10 
   -l,  l, -l, // 11  
  
    // Bottom face
   -l, -l,  l, // 12 
    l, -l,  l, // 13
    l, -l, -l, // 14 
   -l, -l, -l, // 15  
   
    // Right face
    l, -l, -l, // 16
    l, -l,  l, // 17
    l,  l,  l, // 18
    l,  l, -l, // 19

     // Back face
    -l, -l,  -l, // 20
     l, -l,  -l, // 21
     l,  l,  -l, // 22
    -l,  l,  -l, // 23
  ]);
  
  const indices = [
    //Use Right hand Rule to determine the order of your triangular faces (Thumb is ur desire face, your vertices need to follow the direction of curl)
    // Front face
    0, 1, 2,
    0, 2, 3,
  
    // Left face
    4, 5, 6,
    4, 6, 7,
  
    // Top face
    8, 9, 10,
    8, 10, 11,

    // Bottom face
    15, 14, 13,
    15, 13, 12,
  
    // Right face
    19, 18, 17,
    19, 17, 16,

    // Back face
    20, 23, 22,
    20, 22, 21,
  ];
  
  // Compute normals
  const normals = new Float32Array([
    // Front face(Z axis)
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
  
    // Left face(X axis)
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
  
    // Top face(Y axis)
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
  
    // Bottom face
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
    0, -1, 0,
  
    // Right face
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,
    1, 0, 0,

    // Back face
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
  ]);
const custom_cube_geometry = new THREE.BufferGeometry();
custom_cube_geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
custom_cube_geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
custom_cube_geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));

///secion 2////////////////////////////////////////////////////////////////
const wireframe_vertices = new Float32Array([
  // Front face
      -l, -l, l, //(x,y,z)
      -l, l, l,
      -l, l, l,
      l, l, l,
      l, l, l,
      l, -l, l,
      l, -l, l,
      -l, -l, l,
  // Left face
      -l, l, l,
      -l, l, -l,
      -l, l, -l,
      -l, -l, -l,
      -l, -l, -l,
      -l, -l, l,
  // Top face
     l,l,l,
     l,l,-l,
     l,l,-l,
     -l,l,-l,
  // Right face
    l,l,-l,
    l,-l,-l,
    l,-l,-l,
    l,-l, l,
  // Bottom face
    -l,-l,-l,
    l,-l,-l,
]);
const wireframe_greometry = new THREE.BufferGeometry();
wireframe_greometry.setAttribute( 'position', new THREE.BufferAttribute( wireframe_vertices, 3 ) );

///secion 3////////////////////////////////////////////////////////////////
function translationMatrix(tx, ty, tz) {
	return new THREE.Matrix4().set(
		1, 0, 0, tx,
		0, 1, 0, ty,
		0, 0, 1, tz,
		0, 0, 0, 1
	);
}

function rotationMatrixZ(theta) {
	return new THREE.Matrix4().set(
    Math.cos(theta),-1*Math.sin(theta), 0,      0,
    Math.sin(theta), Math.cos(theta), 0,      0,
    0,          0,          1,      0,
    0,          0,          0,      1, 
	);
}

function scalingMatrix(sx, sy, sz) {
  return new THREE.Matrix4().set(
    sx,  0 ,  0,   0,
    0,  sy,   0,   0,
    0,   0,   sz,  0,
    0,   0,   0,   1,
  );
}

///secion 4////////////////////////////////////////////////////////////////
let cubes = [];
let cubes_wireframe = []; 

for (let i = 0; i < 7; i++) {
	let cube = new THREE.Mesh(custom_cube_geometry, phong_material);
	cube.matrixAutoUpdate = false;
	cubes.push(cube);
	scene.add(cube);
}

for (let i = 0; i < 7; i++) {
	const line = new THREE.LineSegments(wireframe_greometry );
	line.matrixAutoUpdate = false;
	cubes_wireframe.push(line);
	scene.add(line);
}

///secion 5////////////////////////////////////////////////////////////////
let still = false;
let visible  = false;
window.addEventListener('keydown', onKeyPress); // onKeyPress is called each time a key is pressed
// Function to handle keypress
function onKeyPress(event) {
    switch (event.key) {
        case 's': // Note we only do this if s is pressed.
            still = !still;
            break;
        case 'w':
            visible = !visible;
            break;
        default:
            console.log(`Key ${event.key} pressed`);
    }
}

let animation_time = 0;
let delta_animation_time;
let rotation_angle;
const clock = new THREE.Clock();
let MAX_ANGLE = 20 * Math.PI/360; // 10 degrees converted to radians
let T = 3; // oscilation persiod in seconds

function animate() {

  const translation = translationMatrix(0, 3*l, 0); // 
  let stack_cube = new THREE.Matrix4(); // model transformation matrix we will update (identity matrix)
  let Transform_M  = new THREE.Matrix4();

	renderer.render( scene, camera );
    controls.update();
    delta_animation_time = clock.getDelta();
    animation_time += delta_animation_time; 

    if (still){
      rotation_angle = MAX_ANGLE;
    }else{
      rotation_angle = MAX_ANGLE*(0.5+0.5*Math.sin(animation_time*2*Math.PI/T+Math.PI/2));
    }

    //operational order = T(l,l,0) -> R(theta) -> T(-l,l,0)

    Transform_M.multiply(translationMatrix(-l,(l+0.25),0)).multiply(rotationMatrixZ(rotation_angle)).multiply(translationMatrix(l,(l+0.25),0));

    if(visible){
      for (let i = 0; i < cubes_wireframe.length; i++) {
        cubes[i].visible = false;
        cubes_wireframe[i].visible = true;
      } 
      for (let i = 0; i < cubes_wireframe.length; i++) {
        cubes_wireframe[i].matrix.copy(stack_cube);
        stack_cube.multiplyMatrices(translation, stack_cube);   // stack_cube  = stack _cube * translation
      }

      for (let i = 0; i < cubes_wireframe.length; i++) {
        cubes_wireframe[i].matrix.multiplyMatrices(scalingMatrix(1, 1.5, 1),cubes_wireframe[i].matrix);
      }

      for (let i = 1; i < cubes_wireframe.length; i++) {
        cubes_wireframe[i].matrix.multiplyMatrices(Transform_M,cubes_wireframe[i-1].matrix);
      }

    }else{
      for (let i = 0; i < cubes.length; i++) {
        cubes_wireframe[i].visible = false;
        cubes[i].visible = true;
      } 
      for (let i = 0; i < cubes.length; i++) {
        cubes[i].matrix.copy(stack_cube);
        stack_cube.multiplyMatrices(translation, stack_cube);
      }
      for (let i = 0; i < cubes.length; i++) {
        cubes[i].matrix.multiplyMatrices(scalingMatrix(1, 1.5, 1),cubes[i].matrix);
      }
      for (let i = 1; i < cubes.length; i++) {
        cubes[i].matrix.multiplyMatrices(Transform_M,cubes[i-1].matrix);
      }

    }



}
renderer.setAnimationLoop( animate );


