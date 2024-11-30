import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { boundingBoxCollisionCheck, playerCollisionCheck } from './utils/collisionCheck';
import { updateTitleText } from './utils/textDisplays';
import { createHomePage, setupClickDetection } from './utils/homePage';

const scene = new THREE.Scene();

//THREE.PerspectiveCamera( fov angle, aspect ratio, near depth, far depth );
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
const startGameCameraPosition = new THREE.Vector3(0, 10, 5);
const homeScreenCameraPosition = new THREE.Vector3(0, 12, 10);
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0,10,10); //after demo(5, 10, 5)
let camLastPos = new THREE.Vector3(5, 10, 5); // For keeping track of rotation. Not the most elegant
controls.target.set(0, 0, 0);

let playerPosition = new THREE.Vector3(0, 0, 0);
let playerRotationY = 0;

// Project
// Setting up the lights
const pointLight = new THREE.PointLight(0xffffff, 100, 100);
pointLight.position.set(5, 5, 5); // Position the light
scene.add(pointLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0.5, .0, 1.0).normalize();
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0x505050); // Soft white light
scene.add(ambientLight);


///Cube Geometry////////////////////////////////////////////////////////////////
const l = 0.5
const positions = new Float32Array([
 // Front face
 -l, -l, l, // 0
 l, -l, l, // 1
 l, l, l, // 2
 -l, l, l, // 3

 // Left face
 -l, -l, -l, // 4
 -l, -l, l, // 5
 -l, l, l, // 6 
 -l, l, -l, // 7
 
 // Top face
 -l, l, l, // 8 
 l, l, l, // 9 
 l, l, -l, // 10 
 -l, l, -l, // 11 
 
 // Bottom face
 -l, -l, l, // 12 
 l, -l, l, // 13
 l, -l, -l, // 14 
 -l, -l, -l, // 15 
 
 // Right face
 l, -l, -l, // 16
 l, -l, l, // 17
 l, l, l, // 18
 l, l, -l, // 19

 // Back face
 -l, -l, -l, // 20
 l, -l, -l, // 21
 l, l, -l, // 22
 -l, l, -l, // 23
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

//game states

let gameStart = false; 
let expandedHomepage = false;


// Create a Star Shape
function StarShape(outerRadius, innerRadius, points) {
 const shape = new THREE.Shape();
 const angleStep = (Math.PI * 2) / points; // Angle between points

 for (let i = 0; i < points * 2; i++) {
 const angle = i * angleStep / 2;
 const radius = i % 2 === 0 ? outerRadius : innerRadius;
 const x = Math.cos(angle) * radius;
 const y = Math.sin(angle) * radius;

 if (i === 0) {
 shape.moveTo(x, y); // Move to the first point
 } else {
 shape.lineTo(x, y); // Draw a line to the next point
 }
 }

 shape.closePath(); // Close the star shape
 return shape;
}

const outerRadius = 0.2;
const innerRadius = 0.1;
const points = 5;
const starShape = StarShape(outerRadius, innerRadius, points);
const custom_cube_geometry = new THREE.BufferGeometry();
custom_cube_geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
custom_cube_geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
custom_cube_geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));
let playerPA_geometry = new THREE.SphereGeometry(1/4); //Head
let playerPB_geometry = new THREE.ConeGeometry(1/3); //Body
let playerPC_geometry = new THREE.ConeGeometry(1/8,1/2); //Hat
let playerLeftHand_geometry = new THREE.CylinderGeometry(0.1,0.1,0.4,32); //L-Hand
let playerRightHand_geometry = new THREE.CylinderGeometry(0.1,0.1,0.4,32); //R-Hand
let boxPA_geometry = new THREE.ExtrudeGeometry(starShape, {
 depth: 0.2, 
 bevelEnabled: false, //not to smooth the edge
});
let boxPB_geometry = new THREE.SphereGeometry(1 / 2.5); 
let sky_geometry = new THREE.BoxGeometry(50, 50, 50);

function translationMatrix(tx, ty, tz) {
 return new THREE.Matrix4().set(
 1, 0, 0, tx,
 0, 1, 0, ty,
 0, 0, 1, tz,
 0, 0, 0, 1
 );
}

function rotationMatrixY(theta) {
 return new THREE.Matrix4().set(
 Math.cos(theta), 0, Math.sin(theta), 0,
 0, 1, 0, 0,
 -Math.sin(theta), 0, Math.cos(theta), 0,
 0, 0, 0, 1
 );
}

function rotationMatrixZ(theta) {
 return new THREE.Matrix4().set(
 Math.cos(theta),-1*Math.sin(theta), 0, 0,
 Math.sin(theta), Math.cos(theta), 0, 0,
 0, 0, 1, 0,
 0, 0, 0, 1, 
 );
}

function scalingMatrix(sx, sy, sz) {
 return new THREE.Matrix4().set(
 sx, 0 , 0, 0,
 0, sy, 0, 0,
 0, 0, sz, 0,
 0, 0, 0, 1,
 );
}
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Shaders

///Initialization////////////////////////////////////////////////////////////////
const wall_material = new THREE.MeshPhongMaterial({
 color: 0x808080, //Gray color
 shininess: 100 
});
const playerPA_material = new THREE.MeshPhongMaterial({
 color: 0xFFFFFF, // Pure white color
 shininess: 100 
});
const playerPB_material = new THREE.MeshPhongMaterial({
 color: 0x00ff00, // Light blue color
 shininess: 100 
});
const playerPC_material = new THREE.MeshPhongMaterial({
 color: 0x0000FF, // Deep blue color
 shininess: 100 
});
const playerPD_material = new THREE.MeshPhongMaterial({
 color: 0x00ff00, // Green color
 shininess: 100 
}); 
const playerPE_material = new THREE.MeshPhongMaterial({
 color: 0xFFFFFF, // Pure white color
 shininess: 100 
})
const playerPF_material = new THREE.MeshPhongMaterial({
 color: 0xFFFFFF, // Pure white color
 shininess: 100 
})
const boxPA_material = new THREE.MeshPhongMaterial({
 color: 0xFFAA00, // Pure white color
 shininess: 100 
})
const boxPB_material = new THREE.MeshPhongMaterial({
 color: 0xFFFFFF, // Pure white color
 transparent: true, 
 opacity: 0.3, 
})
const boxPC_material = new THREE.MeshPhongMaterial({
 color: 0xFFFFFF, // Pure white color
 shininess: 100 
})
const box_material = new THREE.MeshPhongMaterial({
 color: 0xffff00, // Yellow color
 shininess: 100 
});
const ground_material = new THREE.MeshPhongMaterial({
 color: 0xffffff, // White color
 shininess: 100 
});
// skybox texture needs modification
const sky_texture = new THREE.TextureLoader().load('assets/finalproj_skybox_top_TEMP.png');
sky_texture.wrapS = THREE.RepeatWrapping;
sky_texture.wrapT = THREE.RepeatWrapping;
const sky_material = new THREE.MeshStandardMaterial({
    map: sky_texture,
    side: THREE.BackSide
});



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
let playerPA_Height = 0.5;
let playerPB_Height = 0.25;
let playerPC_Height = 0.9;
let hat_Width = 0.2;
let hat_Angle = Math.PI*25/180; 
let star_Height = 0.3;
let playerHands_Height = 0.1; // both hands are synced
const pushingHand_Height = 0.3;  
const pushingHand_Rotation = 1.5; //radians
//(hat_Angle , 0, 0); (0, playerPC_Height, hat_Width) forward
//(-hat_Angle , 0, 0); (0, playerPC_Height, -hat_Width) backward 
//(0 , 0, hat_Angle); (-hat_Width, playerPC_Height, 0) Right
//(0 , 0, -hat_Angle); (hat_Width, playerPC_Height, 0) Left

function initializeScene(flag){
 flag = flag % 3; 
 if(flag == 0){
  flag = 3;
 }
 const map = mapData[flag - 1];
 console.log(flag);
 console.log(map,"map inside initializeScene");

 Wx = map.Wx;
 Wz = map.Wz; 
 Bx = map.Bx;
 Bz = map.Bz; 
 Gx = map.Gx;
 Gz = map.Gz;
 Btx = map.Btx;
 Btz = map.Btz;
 
 console.log(Wx, "This is the data fetched for walls X");

 // Add skybox to scene
 let skybox = new THREE.Mesh(sky_geometry, sky_material);
 scene.add(skybox);

 //add players to the scene
 playerPosition.set(0,0,0); //Initial position of player
 playerRotationY = 0; //Initial rotation of player
 for (let i = 0; i < 1; i++) {
 let player = new THREE.Group();
 let playerPA = new THREE.Mesh(playerPA_geometry,playerPA_material);
 let playerPB = new THREE.Mesh(playerPB_geometry,playerPB_material);
 let playerPC = new THREE.Mesh(playerPC_geometry,playerPC_material);
 let playerPD = new THREE.Mesh(custom_cube_geometry,playerPD_material);
 let playerRightHand = new THREE.Mesh(playerRightHand_geometry,playerPD_material);
 let playerLeftHand = new THREE.Mesh(playerLeftHand_geometry,playerPD_material);
 playerRightHand.position.set(0,playerHands_Height,-0.3);
 playerRightHand.rotation.set(Math.PI/6,0,0);
 playerLeftHand.position.set(0,playerHands_Height,0.3);
 playerLeftHand.rotation.set(-Math.PI/6,0,0);
 
 playerPA.position.set(0, playerPA_Height, 0); //Head
 playerPB.position.set(0, playerPB_Height, 0); //Body
 playerPC.position.set(hat_Width, playerPC_Height, 0); //Hat
 playerPC.rotation.set(0, 0, -hat_Angle);
 playerPD.position.set(0,0,0) //Just for Boundary detection, invisible
 player.add(playerPA);
 player.add(playerPB);
 player.add(playerPC);
 player.add(playerPD);
 player.add(playerRightHand);
 player.add(playerLeftHand);
 playerPD.visible = false;
 player.position.set(0,0,0);


 let playerBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()); //Takes in Far and Near points
 playerBB.setFromObject(player); //Set the bounding box of the player
 // player.matrixAutoUpdate = false;
 players.push(player); 
 playersBB.push(playerBB);
 scene.add(player);
 }

 //add walls to scene
 for (let i = 0; i < Wx.length; i++) {
  let wall = new THREE.Mesh(custom_cube_geometry, wall_material);
  let wallBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()); //Takes in Far and Near points
  wallBB.setFromObject(wall); //Set the bounding box of the wall
  wallsBB.push(wallBB);
  walls.push(wall);
  scene.add(wall); 
 }
 //add boxes to scene
 for (let i = 0; i < Bx.length; i++) {
  let box = new THREE.Group();
  let boxPA = new THREE.Mesh(boxPA_geometry,boxPA_material); //stars
  let boxPB = new THREE.Mesh(boxPB_geometry,boxPB_material); //transparent sphere
  let boxPC = new THREE.Mesh(custom_cube_geometry,boxPC_material); //Just for Boundary detection, invisible
  boxPA.position.set(0,star_Height,0);
  boxPB.position.set(0,star_Height,0);
  boxPC.position.set(0,0,0); //Just for Boundary detection, invisible
  box.add(boxPA);
  box.add(boxPB);
  box.add(boxPC);
  boxPC.visible = false; 
  let box_target = new THREE.Mesh(custom_cube_geometry, box_material);

  let boxBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
  let box_TargetBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
  boxBB.setFromObject(box);
  box_TargetBB.setFromObject(box_target);

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
  grounds.push(ground);
  scene.add(ground);
 }

 //move walls in map to their respective positions
 for (let i=0; i< Wx.length; i++){
  walls[i].position.set(Wx[i],-l,Wz[i]);
  walls[i].scale.set(1,2,1);
  wallsBB[i].setFromObject(walls[i]);
 }
 //move boxes in map to their respective positions
 for (let i = 0; i < Bx.length; i++) {
  // Update the position of the boxes
  boxes[i].position.set(Bx[i], 0, Bz[i]);

  // Update the position and scale of the target boxes
  boxes_target[i].position.set(Btx[i], -l, Btz[i]);
  boxes_target[i].scale.set(1, 1 / 50, 1);

  // Update the bounding boxes
  boxes_TargetBB[i].setFromObject(boxes_target[i]);
  boxesBB[i].setFromObject(boxes[i]);
}

 for (let i=0; i< Gx.length; i++){
  grounds[i].scale.set(1,1/50,1);
  grounds[i].position.set(Gx[i],-l,Gz[i]);
 }

 //add grid to scene
 //createGrid(walls.length, walls.length);
 updateTitleText(flag);
}

//m x n grid
function createGrid(m,n){
 let grid = new THREE.GridHelper(m,n);
 let translation = new THREE.Matrix4().makeTranslation(0, 1, 0); // Adjust the y value (1) as needed
 grid.applyMatrix4(translation);
 scene.add(grid);
}


////// functions to check for collisions ///// 

//isMove is false if player is colliding with wall
function playerCollisionWall(targetPosition){
  let colliding = false; 
  for (let i = 0; i < wallsBB.length; i++){
    if (playerCollisionCheck(targetPosition,wallsBB[i])){
      colliding = true; 
    }
  }
  return colliding; 
}

//player cannot move into two boxes at the same time
//return the index of box to be moved or -1 if no box is moved after player move
//return -2 if player cannot move box due to collision with another box or wall
function playerCollisionBox(targetPosition, direction){
  let collidingIndex = -1; 
  for (let i = 0; i < boxesBB.length; i++){
    //check if player can move box 
    if (playerCollisionCheck(targetPosition,boxesBB[i])){
      console.log("colliding with box", i);
      //dont move box if it collides with another box 
      collidingIndex = i;
      if (boxCollisionWithBoxes(i, direction)){
        console.log("box collision with box")
        return -2;  // can terminate early at first collision detected
      }
      //dont move box if it collides with wall
      if (boxCollisionWithWalls(i, direction)){
        console.log("box collision with wall")  
        return -2; 
      }
    } 
  
  }
  console.log("hit box",collidingIndex)
  return collidingIndex
}

//check box collision with other boxes
//return true if box is colliding with another box
//return false otherwise
function boxCollisionWithBoxes(boxIndex, direction){
  let colliding = false; 
  let boxTargetPosition = new THREE.Vector3().copy(boxes[boxIndex].position).add(direction);
  for (let i = 0; i < boxesBB.length; i++){
    if (i != boxIndex && playerCollisionCheck(boxTargetPosition,boxesBB[i])){
      colliding = true; 
    }
  }
  return colliding; 
}

//check box collision with walls
//return true if box is colliding with a wall
//return false otherwise
function boxCollisionWithWalls(boxIndex, direction){
  let colliding = false
  let boxTargetPosition = new THREE.Vector3().copy(boxes[boxIndex].position).add(direction);
  for (let i = 0; i < wallsBB.length; i++){
    if (playerCollisionCheck(boxTargetPosition,wallsBB[i])){
      colliding = true; 
    }
  }
  return colliding
}


/////Interaction (Player Motion; Boxes-players interaction; Boxes-Boxes interaction)///////////////////////////
let forward = false;
let backward = false;
let right = false;
let left = false;
let isMoving = false; 
let canMove = true; 
let moveBoxIndex = -1; 
let panLeft = false;
let panRight = false;
let resetM = false;
let direction = new THREE.Vector3();
let targetPosition = new THREE.Vector3();
let previousPosition = new THREE.Vector3();
let boxPreviousPosition = new THREE.Vector3();
//add homePage to scene initially
let homePage = createHomePage();
scene.add(homePage);

//only allow player to move if game starts
window.addEventListener('keydown', onKeyPress); // onKeyPress is called each time a key is pressed
setupClickDetection(camera, homePage)
function onKeyPress(event) {
  if(gameStart){
    switch (event.key) {

      case 'w': 
      if (canMove){
        targetPosition.set(players[0].position.x, players[0].position.y, players[0].position.z - 1);
        previousPosition.copy(players[0].position);
        //rotate player no matter if it moves or not
        players[0].rotation.y = -Math.PI / 2;
        direction.set(0,0,-1);
        //check if player moving into wall
        if (playerCollisionWall(targetPosition)){
          isMoving = false;
          break; 
        }
        //check if player moving into box 
        //index of box to be moved returned if can be moved
        moveBoxIndex = playerCollisionBox(targetPosition, direction);
        if (moveBoxIndex == -2){
          console.log('box collision')
          isMoving = false;
          break;
        } else if (moveBoxIndex != -1){
          boxPreviousPosition.copy(boxes[moveBoxIndex].position);
          boxesBB[moveBoxIndex].setFromObject(boxes[moveBoxIndex]);
        }
        isMoving = true;
      } 
      break;

      case 'a': 
      if (canMove){
        targetPosition.set(players[0].position.x - 1, players[0].position.y, players[0].position.z);
        previousPosition.copy(players[0].position);
        players[0].rotation.y = 0;
        direction.set(-1,0,0);
        //check if player moving into wall
        if (playerCollisionWall(targetPosition)){
          isMoving = false;
          break; 
        }
        //check if player moving into box 
        //index of box to be moved returned if can be moved
        moveBoxIndex = playerCollisionBox(targetPosition, direction);
        if (moveBoxIndex == -2){
          console.log('box collision')
          isMoving = false;
          break;
        } else if (moveBoxIndex != -1){
          console.log(boxes[moveBoxIndex].position, "currentPosition");
          boxPreviousPosition.copy(boxes[moveBoxIndex].position);
          boxesBB[moveBoxIndex].setFromObject(boxes[moveBoxIndex]);
        }
        isMoving = true; 
        break;
      }
      case 's': 
      if (canMove){
        targetPosition.set(players[0].position.x, players[0].position.y, players[0].position.z + 1);
        previousPosition.copy(players[0].position);
        players[0].rotation.y = Math.PI / 2;
        direction.set(0,0,1);
        //check if player moving into wall
        if (playerCollisionWall(targetPosition)){
          isMoving = false;
          break; 
        }
        //check if player moving into box 
        //index of box to be moved returned if can be moved
        moveBoxIndex = playerCollisionBox(targetPosition, direction);
        if (moveBoxIndex == -2){
          console.log('box collision')
          isMoving = false;
          break;
        } else if (moveBoxIndex != -1){
          boxPreviousPosition.copy(boxes[moveBoxIndex].position);
          boxesBB[moveBoxIndex].setFromObject(boxes[moveBoxIndex]);
        }
        
        isMoving = true; 
        break;
      }

      case 'd': 
      if (canMove){
        targetPosition.set(players[0].position.x + 1, players[0].position.y, players[0].position.z);
        previousPosition.copy(players[0].position);
        players[0].rotation.y = Math.PI;
        direction.set(1,0,0);
        //check if player moving into wall
        if (playerCollisionWall(targetPosition)){
          isMoving = false;
          break; 
        }
        //check if player moving into box 
        //index of box to be moved returned if can be moved
        moveBoxIndex = playerCollisionBox(targetPosition, direction);
        if (moveBoxIndex == -2){
          console.log('box collision')
          isMoving = false;
          break;
        } else if (moveBoxIndex != -1){
          boxPreviousPosition.copy(boxes[moveBoxIndex].position);
        }
        isMoving = true; 
        break;
      }

      case 'q':
      panLeft = true; // Rotate camera counterclockwise
      break;

      case 'e':
      panRight = true; // Rotate camera clockwise
      break;

      case 'r':
      resetM = true;
      break; 

      default:
      console.log(`Key ${event.key} pressed`);
     }
  }
}



let checkOnTarget = new THREE.Vector3(); 
//translate target boxes l up and check for collision with boxes
//check if all boxes are on their targets
function checkTargetBoxes(){
 let boxesOnTargets = 0;
 let boxIsOnTarget = false;
 for (let i= 0; i < boxes_target.length; i++){
  boxIsOnTarget = false;
  checkOnTarget.set(boxes_target[i].position.x, boxes_target[i].position.y + l, boxes_target[i].position.z);
  for (let j = 0; j < boxesBB.length; j++){
  //if there is a collision with any box update count
    if (playerCollisionCheck(checkOnTarget, boxesBB[j])){
      boxIsOnTarget = true;
    } 
  }
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
let T_player = 1.5; // Player's floating period in seconds
let T_boxes = 1; // Boxes's floating period in seconds
let duration = 0.5; // Duration of player movement in seconds
let animation_time_movement = 0; 
//to animate player movement: 
/*
  - WASD should trigger a target position for player
  - whilst player is moving, player should be unable to move
  - can use time to interpolate between current position and target position


*/



function animate() {
 renderer.render( scene, camera );
 controls.update();

 delta_animation_time = clock.getDelta();
 animation_time += delta_animation_time; 

 // Make the homepage always in front of the camera
 if (!gameStart && homePage) {
  const distanceFromCamera = 10; 
  const cameraDirection = new THREE.Vector3();

  // Get the direction the camera is facing
  camera.getWorldDirection(cameraDirection);

  // Calculate the target position directly in front of the camera
  const targetPosition = new THREE.Vector3()
    .copy(camera.position)
    .add(cameraDirection.multiplyScalar(distanceFromCamera));

  // Update the homePage position smoothly (lerp for smooth transition)
  homePage.position.copy(targetPosition);
  // Ensure the homePage always faces the camera
  homePage.lookAt(camera.position);
}

 //Player Self-Motion
 let floating_player = 0.15*Math.sin(animation_time*2*Math.PI/T_player+Math.PI/2);
 players[0].children[0].position.y = floating_player + playerPA_Height; 
 players[0].children[1].position.y = floating_player + playerPB_Height; 
 players[0].children[2].position.y = floating_player + playerPC_Height; 
 players[0].children[4].position.y = floating_player + playerHands_Height;
 players[0].children[5].position.y = floating_player + playerHands_Height;

 //(hat_Angle , 0, 0); (0, playerPC_Height, hat_Width) forward
 //(-hat_Angle , 0, 0); (0, playerPC_Height, -hat_Width) backward 
 //(0 , 0, hat_Angle); (-hat_Width, playerPC_Height, 0) Right
 //(0 , 0, -hat_Angle); (hat_Width, playerPC_Height, 0) Left

 //Box Self-Motion
 let floating_boxes = 0.2*Math.sin(animation_time*2*Math.PI/T_boxes+Math.PI/2);
 for(let i = 0; i < Bx.length; i++){
 boxes[i].children[0].position.y = floating_boxes + star_Height;
 //boxes[i].children[1].position.y = floating_boxes + star_Height;
 boxes[i].children[0].rotation.x = animation_time;
 boxes[i].children[0].rotation.y = animation_time;
 //boxes[i].children[0].rotation.z = animation_time;
 }
 //player movement along with box movement
 //need to reset isMoving, direction, moveBoxIndex after player has moved
  if (isMoving) {
      canMove = false; 
      animation_time_movement += delta_animation_time;
      // Calculate the progress normalized to the duration
      let progress = Math.min(animation_time_movement / duration, 1); // Clamp to [0, 1]
      // Smooth easing
      let oscilation = 0.5 * (1 - Math.cos(progress * Math.PI)); // From 0 to 1

      // Update the player's position
      if (moveBoxIndex != -1){
        console.log(boxPreviousPosition, "boxPreviousPosition");
        //console.log(boxes[moveBoxIndex].position);
        boxes[moveBoxIndex].position.set(
          boxPreviousPosition.x + oscilation * direction.x,
          boxPreviousPosition.y + oscilation * direction.y, 
          boxPreviousPosition.z + oscilation * direction.z
        );
      }

      players[0].position.set(
          previousPosition.x + oscilation * direction.x,
          previousPosition.y + oscilation * direction.y, 
          previousPosition.z + oscilation * direction.z
      );
      // Stop the animation when it reaches the end
      if (progress >= 1) {
          //update box bounding boxes
          if (moveBoxIndex != -1){
            boxesBB[moveBoxIndex].setFromObject(boxes[moveBoxIndex]);
          }
          playersBB[0].setFromObject(players[0]);
          canMove = true; 
          isMoving = false;
          moveBoxIndex = -1; 
          direction.set(0,0,0);
          animation_time_movement = 0; // Reset for future animations
          previousPosition.copy(players[0].position); // Update the start position
          //check for win condition
          if (checkTargetBoxes() == boxes_target.length){
            resetM = true;
            levelCleared = true;
          }
      }
  }
 //camera transition
 // if (panLeft) {
 // let camTransform = new THREE.Matrix4();
 // camTransform.multiplyMatrices(translationMatrix(camLastPos.x, camLastPos.y, camLastPos.z), camTransform);
 // camTransform.multiplyMatrices(rotationMatrixY(90), camTransform);
 // let cameraPosition = new THREE.Vector3();
 // cameraPosition.setFromMatrixPosition(camTransform);
 // // lerp is a little janky, makes the camera move upward which I don't like
 // // If there is a way to do a smooth movement while keeping the camera's z-position the same it would be better
 // camera.position.lerp(cameraPosition, 0.12);
 // if (camera.position.distanceTo(cameraPosition) < 0.01) {
 // panLeft = false;
 // camLastPos = cameraPosition;
 // }
 // } else if (panRight) {
 // let camTransform = new THREE.Matrix4();
 // camTransform.multiplyMatrices(translationMatrix(camLastPos.x, camLastPos.y, camLastPos.z), camTransform);
 // camTransform.multiplyMatrices(rotationMatrixY(-90), camTransform);
 // let cameraPosition = new THREE.Vector3();
 // cameraPosition.setFromMatrixPosition(camTransform);
 // camera.position.lerp(cameraPosition, 0.12);
 // if (camera.position.distanceTo(cameraPosition) < 0.01) {
 // panRight = false;
 // camLastPos = cameraPosition;
 // }
 // }




 ///// map resetting logic //// 
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

document.addEventListener('buttonClick', (event) => {
  const button = event.detail.button;
  if (button === 'Play') 
  {
    startGame();
  } else if (button === 'Instructions') {
    console.log("Instructions button clicked");
  }
});



function startGame(){
  gameStart = true; 
  scene.remove(homePage);
  camera.position.copy(startGameCameraPosition)
}

//fetch map data then intialize and begin animating the game
let mapData; 
fetch ('./maps.json')
.then(response => response.json())
.then(data => {
  mapData = data; 
  initializeScene(2); //initialize scene with map 1
  renderer.setAnimationLoop( animate );
})
.catch(error => {
  console.error('Error fetching Maps', error);
})
