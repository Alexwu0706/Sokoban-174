import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { collisionCheck } from './utils/collisionCheck';
import { updateTitleText } from './utils/textDisplays';

const scene = new THREE.Scene();

//THREE.PerspectiveCamera( fov angle, aspect ratio, near depth, far depth );
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 10, 2); 
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
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

///Initialization////////////////////////////////////////////////////////////////
const wall_material = new THREE.MeshPhongMaterial({
  color: 0x808080, //Gray color
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
const ground_material = new THREE.MeshPhongMaterial({
  color: 0xffffff, // White color
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


//storing map info 
let players = []; // array of players
let playersBB = []; // bounding box of players
let Wx = []; // x pos of wall
let Wz = []; // z pos of wall
let Bx = []; // x pos of boxes player can push
let Bz = []; // z pos of boxes player can push
let Btx = []; // x pos of boxes target
let Btz = []; // z pos of boxes target
let Gx = []; // x pos of ground
let Gz = []; // z pos of ground
let walls = []; // array of walls
let wallsBB = []; // bounding box of walls
let boxes = []; // boxes player can push
let boxesBB = []; //bounding box of boxes
let boxes_target = []; //boxes target
let grounds = [];
let boxes_TargetBB = []; //bounding box of boxes target if all target boxes have a box in contact, then a win is triggered



//determining which map to display
function initializeScene(flag){
  if (flag > 3){
    flag = 1; // reset to first map
  }
  const map = mapData[flag - 1];
  console.log(map,"map inside initializeScene");


  Wx = map.Wx;
  Wz = map.Wz; 
  Bx = map.Bx;
  Bz = map.Bz;  
  Gx = map.Gx;
  Gz = map.Gz;
  Btx = map.Btx;
  Btz = map.Btz;

  console.log(Wx, "This is the data fetched for walls X")

  //add players to the scene
  for (let i = 0; i < 1; i++) {
    let player = new THREE.Mesh(custom_cube_geometry, player_material);
    let playerBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()); //Takes in Far and Near points
    playerBB.setFromObject(player); //Set the bounding box of the player
    player.matrixAutoUpdate = false;
    players.push(player); 
    console.log(players, "players")
    console.log(playersBB, "playersBB")
    playersBB.push(playerBB);
    scene.add(player);
  }

  //Initialization


  //add walls to scene
  for (let i = 0; i < Wx.length; i++) {
    let wall = new THREE.Mesh(custom_cube_geometry, wall_material);     //Todo: geometry and material are adjustable (refer to assignment 3)
    let wallBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()); //Takes in Far and Near points
    wallBB.setFromObject(wall); //Set the bounding box of the wall
    wall.matrixAutoUpdate = false;
    wallsBB.push(wallBB);
    walls.push(wall);
    scene.add(wall);     
  }
  //add boxes to scene
  for (let i = 0; i < Bx.length; i++) {
    let box = new THREE.Mesh(custom_cube_geometry, box_material);
    let box_target = new THREE.Mesh(custom_cube_geometry, box_material);
    let boxBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
    let box_TargetBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());

    boxBB.setFromObject(box);
    box_TargetBB.setFromObject(box_target);
    box.matrixAutoUpdate = false;
    box_target.matrixAutoUpdate = false;

    boxes.push(box);
    boxes_target.push(box_target);
    boxesBB.push(boxBB);
    boxes_TargetBB.push(box_TargetBB);

    scene.add(box);
    scene.add(box_target);
  }
  //add ground tiles to scene
  for (let i=0; i< Gx.length; i++){
    let ground = new THREE.Mesh(custom_cube_geometry, ground_material);
    ground.matrixAutoUpdate = false;
    grounds.push(ground);
    scene.add(ground);
  }
  ///Transformation////////////////////////////////////////////////////////////////

  //move walls in map to their respective positions
  for (let i=0; i< Wx.length; i++){
    walls[i].matrix.multiply(translationMatrix(Wx[i],0,Wz[i]));
    wallsBB[i].setFromObject(walls[i]);
  }
  //move boxes in map to their respective positions
  for (let i=0; i< Bx.length; i++){
    boxes[i].matrix.multiply(translationMatrix(Bx[i],0,Bz[i]));;
    boxes_target[i].matrix.multiply(translationMatrix(Btx[i],-l,Btz[i])).multiply(scalingMatrix(1,1/50,1));
    boxes_TargetBB[i].setFromObject(boxes_target[i]);
    boxesBB[i].setFromObject(boxes[i]);
  }
  for (let i=0; i< Gx.length; i++){
    grounds[i].matrix.multiply(translationMatrix(Gx[i],-l,Gz[i])).multiply(scalingMatrix(1,1/1000,1));
  }

  //add grid to scene
  createGrid(walls.length, walls.length);
  updateTitleText(flag);
}

//m x n grid
function createGrid(m,n){
  let grid = new THREE.GridHelper(m,n);
  let translation = new THREE.Matrix4().makeTranslation(0, 1, 0); // Adjust the y value (1) as needed
  grid.applyMatrix4(translation);
  scene.add(grid);
}

//translate target boxes l up and check for collision with boxes
//check if all boxes are on their targets
function checkTargetBoxes(){
  let boxesOnTargets = 0;
  let boxIsOnTarget = false;
  for (let i= 0; i < boxes_target.length; i++){
    boxIsOnTarget = false;
    boxes_target[i].matrix.multiply(translationMatrix(0,l,0));
    boxes_TargetBB[i].setFromObject(boxes_target[i]);
    for (let j = 0; j < boxesBB.length; j++){
      //if there is a collision with any box update count
      if (collisionCheck(boxesBB[j],boxes_TargetBB[i])){
        boxIsOnTarget = true;
      } 
    }
    boxes_target[i].matrix.multiply(translationMatrix(0,-l,0));
    boxes_TargetBB[i].setFromObject(boxes_target[i]);
    if (boxIsOnTarget){
      boxesOnTargets++;
    }
  }
  return boxesOnTargets

}


///animation////////////////////////////////////////////////////////////////
let animation_time = 0;
let delta_animation_time;
const clock = new THREE.Clock();
let levelCleared = false;
let flag = 1; //Map Update


function animate() {
  let previousMovement = [0,0]; // x,z movement
	renderer.render( scene, camera );
    controls.update();
    
    //Player Motion (could maybe set delay to prevent player from moving too fast or hold key down)
    if(forward){
      players[0].matrix.multiply(translationMatrix(0,0,-1));
      previousMovement = [0,-1];
      forward = false;
    }else if(backward){
      players[0].matrix.multiply(translationMatrix(0,0,1));
      previousMovement = [0,1];
      backward = false;
    }else if(right){
      players[0].matrix.multiply(translationMatrix(1,0,0));
      previousMovement = [1,0];
      right = false;
    }else if(left){
      players[0].matrix.multiply(translationMatrix(-1,0,0));
      previousMovement = [-1,0];
      left = false;
    }

    //update boundary boxes
    
    playersBB[0].setFromObject(players[0]);


    //collision detections////////////////////////////////////////////

    //do not let player move through walls
    for (let i = 0; i < wallsBB.length; i++){
      if (collisionCheck(playersBB[0],wallsBB[i])){
        players[0].matrix.multiply(translationMatrix(-previousMovement[0],0,-previousMovement[1]));
      }
    }
    //player can push boxes
    //cannot push 2 boxes at once
    //boxes cannot push through walls
    for (let i = 0; i < boxesBB.length; i++){
      if (collisionCheck(playersBB[0], boxesBB[i])){
        //intial move forward
        boxes[i].matrix.multiply(translationMatrix(previousMovement[0],0,previousMovement[1])); 
        boxesBB[i].setFromObject(boxes[i]);
        //move back if collision with wall
        for (let j = 0; j < wallsBB.length; j++){
          if (collisionCheck(boxesBB[i],wallsBB[j])){
            boxes[i].matrix.multiply(translationMatrix(-previousMovement[0],0,-previousMovement[1]));
            boxesBB[i].setFromObject(boxes[i]);
          }
        }
        //move back if collision with another box
        //j is the other boxes
        for (let j = 0; j < boxesBB.length; j++){
          if (i != j && collisionCheck(boxesBB[i],boxesBB[j])){
            boxes[i].matrix.multiply(translationMatrix(-previousMovement[0],0,-previousMovement[1]));
            boxesBB[i].setFromObject(boxes[i]);
          }
        }
        //check if boxes are on target
        
      }
    }
    //do not let player move through boxes
    for (let i = 0; i < boxesBB.length; i++){
      if (collisionCheck(playersBB[0],boxesBB[i])){
        players[0].matrix.multiply(translationMatrix(-previousMovement[0],0,-previousMovement[1]));
      }
    }
    //all boxes are on targets
    if (checkTargetBoxes() == boxes_target.length){
      resetM = true;
      levelCleared = true;
    }
    
    //can press r to reset the current level but won't advance to next level
    if (resetM) {
      for (let i = 0; i < Wx.length; i++) {
        scene.remove(walls[i]);

      }
      for (let i = 0; i < Bx.length; i++) {
        scene.remove(boxes[i]);
        scene.remove(boxes_target[i]);
      }
      for (let i = 0; i < Gx.length; i++){
        scene.remove(grounds[i]);
      }
      for (let i = 0; i < players.length; i++) {  
        scene.remove(players[i]);
      }
        // Empty the arrays
        walls.length = 0;
        wallsBB.length = 0;
        boxes.length = 0;
        boxes_target.length = 0;
        boxesBB.length = 0;
        boxes_TargetBB.length = 0;
        grounds.length = 0;
        players.length = 0;
        playersBB.length = 0;

        //only advance if level cleared
        if (levelCleared){
          console.log(flag, "flag");
          flag = flag + 1;
          levelCleared = false;
        }
        console.log(walls, boxes);
        resetM = false;
        initializeScene(flag);
    }

    //Interaction Implementation
           
                                              
}

//fetch map data then intialize and begin animating the game
let mapData; 
fetch ('./maps.json')
  .then(response => response.json())
  .then(data => {
    mapData = data; 
    initializeScene(1); //initialize scene with map 1
    renderer.setAnimationLoop( animate );
  })
  .catch(error => {
    console.error('Error fetching Maps', error);
  })