import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';


const scene = new THREE.Scene();

//THREE.PerspectiveCamera( fov angle, aspect ratio, near depth, far depth );
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 10, 5); 
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
scene.add(xAxis);
scene.add(yAxis);
scene.add(zAxis);

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


///Cube Geometry////////////////////////////////////////////////////////////////
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

///Initialization////////////////////////////////////////////////////////////////
const wall_material = new THREE.MeshPhongMaterial({
  color: 0x808080, //gray color
  shininess: 100   
});
const player_material = new THREE.MeshPhongMaterial({
color: 0x00ff00, // Green color
shininess: 100   
});
const box_material = new THREE.MeshPhongMaterial({
  color: 0xffff00, // Yellow color
  shininess: 100   
});

/////Interaction (Player Motion; Boxes-players interaction; Boxes-Boxes interaction)///////////////////////////
let forward = false;
let backward = false;
let right = false;
let left = false;
let resetM = false;
window.addEventListener('keydown', onKeyPress); // onKeyPress is called each time a key is pressed
// Function to handle keypress
function onKeyPress(event) {
    switch (event.key) {
        case 'w': 
            forward = true;          //Translation +1z
            break;
        case 'a':
            left = true;           //Translation -1x
            break;
        case 's':
            backward = true;        //Translation -1z
            break;       
        case 'd':
            right = true;          //Translation +1x
            break;     
        case 'r':
            resetM = true;
            break;
        default:
            console.log(`Key ${event.key} pressed`);
    }
}

///Game maps////////////////////////////////////////////////////////////////
//Map1
let Wx_1 = [1,2,3,3,3,2,1,0,0,0,-1,-2,-2,-2,-2,-3,-4,-4,-4,-3,-2,-1,-1,-1,0,1,1,1];
let Wz_1 = [0,0,0,1,2,2,2,2,3,4,4,4,3,2,1,1,1,0,-1,-1,-1,-1,-2,-3,-3,-3,-2,-1];
let Bx_1 = [0,-1,-1,1];
let Bz_1 = [-1,0,1,1];
let Blx_1 = [-3,0,2,-1];
let Blz_1 = [0,-2,1,3];

//Map2
let Wx_2 = [0,0,-1,-2,-3,-3,-3,-3,-3,-2,-2,-1,0,0,0,1,2,2,2,3,4,4,4,4,3,2,1,1];
let Wz_2 = [-1,-2,-2,-2,-2,-1,0,1,2,2,3,3,3,4,5,5,5,4,3,3,3,2,1,0,0,0,0,-1];
let Bx_2 = [0,2,-1];
let Bz_2 = [2,1,1];
let Blx_2 = [-2,-1,1];
let Blz_2 = [0,2,3];

//Map3 (Undefined)
let Wx_3 = [1,2,1,2,-3,-3,-3,-3,-3,-2,-2,-1,0,0,0,1,2,2,2,3,4,4,4,4,3,2,1,1];
let Wz_3 = [1,2,2,2,-2,-1,0,1,2,2,3,3,3,4,5,5,5,4,3,3,3,2,1,0,0,0,0,-1];
let Bx_3 = [0,2,-1];
let Bz_3 = [2,1,1];
let Blx_3 = [-2,-1,1];
let Blz_3 = [0,2,3];

///animation////////////////////////////////////////////////////////////////
let animation_time = 0;
let delta_animation_time;
const clock = new THREE.Clock();
let flag = 1; //Map Update

let players = [];
for (let i = 0; i < 1; i++) {
  let player = new THREE.Mesh(custom_cube_geometry, player_material);
  player.matrixAutoUpdate = false;
  players.push(player);
  scene.add(player);
}
function animate() {
  let Wx = [];
  let Wz = [];
  let Bx = [];
  let Bz = [];
  let Blx = [];
  let Blz = [];
  let wall = [];
  let walls = [];
  let box = [];
  let boxes = [];
  let box_location = [];
  let boxes_location = [];

	renderer.render( scene, camera );
    controls.update();
    // delta_animation_time = clock.getDelta();
    // animation_time += delta_animation_time; 
    
    if (flag > 2) flag = 1;
    if (flag == 1){
      Wx = Wx_1;
      Wz = Wz_1;
      Bx = Bx_1;
      Bz = Bz_1;
      Blx = Blx_1;
      Blz = Blz_1;
    }else if(flag == 2){
      Wx = Wx_2;
      Wz = Wz_2;
      Bx = Bx_2;
      Bz = Bz_2;
      Blx = Blx_2;
      Blz = Blz_2;
    }else if(flag == 3){
      Wx = Wx_3;
      Wz = Wz_3;
      Bx = Bx_3;
      Bz = Bz_3;
      Blx = Blx_3;
      Blz = Blz_3;
    }

    //Initialization
    for (let i = 0; i < Wx.length; i++) {
      wall = new THREE.Mesh(custom_cube_geometry, wall_material);     //geometry and material is adjustable (refer to assignment 3)
      wall.matrixAutoUpdate = false;
      walls.push(wall);
      scene.add(wall);      
    }
    for (let i = 0; i < Bx.length; i++) {
      box = new THREE.Mesh(custom_cube_geometry, box_material);
      box_location = new THREE.Mesh(custom_cube_geometry, box_material);
      box.matrixAutoUpdate = false;
      box_location.matrixAutoUpdate = false;
      boxes.push(box);
      boxes_location.push(box_location);
      scene.add(box);
      scene.add(box_location);
    }

    //Transformation
    for (let i=0; i< Wx.length; i++){
      let Transform_Wall = new THREE.Matrix4();
      Transform_Wall.multiply(translationMatrix(Wx[i],0,Wz[i]));
      walls[i].matrix.copy(Transform_Wall);
    }
    for (let i=0; i< Bx.length; i++){
      let Transform_Box = new THREE.Matrix4();
      let Transform_BoxL = new THREE.Matrix4();
      Transform_Box.multiply(translationMatrix(Bx[i],0,Bz[i]));
      Transform_BoxL.multiply(translationMatrix(Blx[i],-l,Blz[i])).multiply(scalingMatrix(1,1/100,1));
      boxes[i].matrix.copy(Transform_Box);
      boxes_location[i].matrix.copy(Transform_BoxL);
    }

    //Player Motion
    if(forward){
      players[0].matrix.multiply(translationMatrix(0,0,-1));
      forward = false;
    }else if(backward){
      players[0].matrix.multiply(translationMatrix(0,0,1));
      backward = false;
    }else if(right){
      players[0].matrix.multiply(translationMatrix(1,0,0));
      right = false;
    }else if(left){
      players[0].matrix.multiply(translationMatrix(-1,0,0));
      left = false;
    }
    
    //Reset
    // walls.forEach(wall => scene.remove(wall));
    // walls = []; // Clear the walls array
    
    // // Remove boxes
    // boxes.forEach(box => scene.remove(box));
    // boxes = []; // Clear the boxes array
    
    // // Remove box locations
    // boxes_location.forEach(boxLocation => scene.remove(boxLocation));
    // boxes_location = []; // Clear the box locations array
    if (resetM) {
      console.log("yes")
      walls.forEach(wall => scene.remove(wall));
      walls = []; // Clear the walls array
      
      // Remove boxes
      boxes.forEach(box => scene.remove(box));
      boxes = []; // Clear the boxes array
      
      // Remove box locations
      boxes_location.forEach(boxLocation => scene.remove(boxLocation));
      boxes_location = []; // Clear the box locations array
      // Reset flag for next map
      flag = flag + 1;
      resetM = false;
    }


    //Condition for Reset Maps ()
        
    
    //Interaction Implementation
        //console.log((walls[4].matrix)) (Position)

}
renderer.setAnimationLoop( animate );


