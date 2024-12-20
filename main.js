import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { movingCollisionCheck } from './utils/collisionCheck';
import { updateTitleText } from './utils/textDisplays';
import { createHomePage, setupClickDetection } from './utils/homePage';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

let composer;
const scene = new THREE.Scene();

//THREE.PerspectiveCamera( fov angle, aspect ratio, near depth, far depth );
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ReinhardToneMapping;

const renderScene = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0;
bloomPass.strength = 0;
bloomPass.radius = 1;

const outputPass = new OutputPass();

composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);
composer.addPass(outputPass);


document.body.appendChild( renderer.domElement );
const startGameCameraPosition = new THREE.Vector3(0, 10, 8);
const homeScreenCameraPosition = new THREE.Vector3(0, 12, 10);
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0,10,10); //after demo(5, 10, 5)
controls.target.set(0, 0, 0);
controls.enabled = false; // Enable if you'd like to look at the skybox :)

window.addEventListener('resize', onWindowResize);

let playerPosition = new THREE.Vector3(0, 0, 0);
let playerRotationY = 0;

// Setting up the lights

const ambientLight = new THREE.AmbientLight(0x333e69, 1);
scene.add(ambientLight);


//game states
let gameStart = false; 
let expandedHomepage = false;
const l = 0.5;

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
let playerPA_geometry = new THREE.SphereGeometry(1/4); //Head
let playerPB_geometry = new THREE.ConeGeometry(1/3); //Body
let playerPC_geometry = new THREE.ConeGeometry(1/8,1/2); //Hat
let playerLeftHand_geometry = new THREE.CylinderGeometry(0.1,0.1,0.4,32); //L-Hand
let playerRightHand_geometry = new THREE.CylinderGeometry(0.1,0.1,0.4,32); //R-Hand
let boxPA_geometry = new THREE.ExtrudeGeometry(starShape, {
 depth: 0.2, 
 bevelEnabled: false, //not to smooth the edge
});
let wall_geometry = new THREE.BoxGeometry( 1, 1, 1 ); 
let boxPB_geometry = new THREE.SphereGeometry(1 / 2.5);

///Initialization///
const wall_material = new THREE.MeshPhongMaterial({
 color: 0x808080, //Gray color
 shininess: 100, 
 transparent: true, 
 opacity : 0
});
const playerPA_material = new THREE.MeshPhongMaterial({
    transparent: true,
    color: 0xdbdfe3, // Pure white color
 shininess: 100 
});
const playerPB_material = new THREE.MeshPhongMaterial({
    color: 0x76a6d6, // Light blue color
    shininess: 0.5
});
const playerPC_material = new THREE.MeshPhongMaterial({
    color: 0x76a6d6, // Hat
 shininess: 0.5
});
const playerPD_material = new THREE.MeshPhongMaterial({
    color: 0x76a6d6, // Body
 shininess: 0.5
}); 
const boxPA_material = new THREE.MeshPhongMaterial({
    color: 0xfafad7, // Star
    shininess: 100,
    emissive: 0xfafad7
})
const boxPB_material = new THREE.MeshPhongMaterial({
 color: 0xFFFFFF, // Pure white color
 transparent: true, 
 opacity: 0.3
})
const boxPC_material = new THREE.MeshPhongMaterial({
 color: 0xFFFFFF, // Pure white color
 shininess: 100 
})
const goal_texture = new THREE.TextureLoader().load('assets/finalproj_goal_tile.png');
goal_texture.colorSpace = THREE.SRGBColorSpace;
const box_material = new THREE.MeshStandardMaterial({
    map: goal_texture
});
const ground_texture = new THREE.TextureLoader().load('assets/finalproj_floor_tile.png');
ground_texture.colorSpace = THREE.SRGBColorSpace;
const ground_material = new THREE.MeshStandardMaterial({
    map: ground_texture
});
const sky_texture = new THREE.CubeTextureLoader().load(['assets/skybox_side3.png', 'assets/skybox_side1.png', 'assets/skybox_top.png', 'assets/skybox_bottom.png', 'assets/skybox_side2.png', 'assets/skybox_side4.png']);
sky_texture.colorSpace = THREE.SRGBColorSpace;
scene.background = sky_texture;

// Particle creation function
class winSparkle {
    constructor(scene, x, y, z) {
        this.scene = scene;
        this.die = false;
        const size = 150; // Number of particles
        this.lifetime = 1500; // Milliseconds
        this.createTime = Date.now();

        const positions = new Float32Array(size * 3);
        this.velocities = new Float32Array(size * 3);
        for (let i = 0; i < size; i++) {
            let i3 = i * 3;
            positions[i3] = x;
            positions[i3 + 1] = y;
            positions[i3 + 2] = z;
            this.velocities[i3] = Math.random() * 0.2 - 0.1; // Probably want to modify these but we'll see
            this.velocities[i3 + 1] = Math.random() * 0.2;
            this.velocities[i3 + 2] = Math.random() * 0.2 - 0.1;
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            // Could change to custom particle asset if there's time
            color: 0xfafad7, // Same color as stars
            size: 0.1
        });
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    update() {
        const deltaTime = Date.now() - this.createTime;
        if (Date.now() - this.createTime >= this.lifetime) {
            this.die = true;
            this.scene.remove(this.particles);
        } else {
            const positions = this.particles.geometry.attributes.position.array;

            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += this.velocities[i];
                positions[i + 1] += this.velocities[i + 1];
                positions[i + 2] += this.velocities[i + 2];

                this.velocities[i] -= 0.001; // simulated drag
                this.velocities[i + 1] += (deltaTime / 1000) **2 * -0.008; // gravitational decay
                this.velocities[i + 2] -= 0.001;
            }

            this.particles.geometry.attributes.position.needsUpdate = true;
        }
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
let particleGroups = [];

//determining which map to display
let playerPA_Height = 0.5;
let playerPB_Height = 0.25;
let playerPC_Height = 0.9;
let hat_Width = 0.2;
let hat_Angle = Math.PI*25/180; 
let star_Height = 0.3;
let playerHands_Height = 0.1; // both hands are synced
let previousCameraRotation = 0; //camera rotation in degrees
let lerpingCamera = false;

function initializeScene(flag){
 //reset camera position
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

 //add players to the scene
 playerPosition.set(0,0,0); //Initial position of player
 playerRotationY = 0; //Initial rotation of player
 for (let i = 0; i < 1; i++) {
 let player = new THREE.Group();
 let playerPA = new THREE.Mesh(playerPA_geometry,playerPA_material);
 let playerPB = new THREE.Mesh(playerPB_geometry,playerPB_material);
 let playerPC = new THREE.Mesh(playerPC_geometry,playerPC_material);
 let playerPD = new THREE.Mesh(wall_geometry,playerPD_material);
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
 let playerGlow = new THREE.PointLight(0xfafad7, 0.2, 2, 1);
 player.add(playerPA);
 player.add(playerPB);
 player.add(playerPC);
 player.add(playerPD);
 player.add(playerGlow);
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
  let wall = new THREE.Mesh(wall_geometry, wall_material);
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
  let boxPC = new THREE.Mesh(wall_geometry, boxPC_material); //Just for Boundary detection, invisible
  let glowLight = new THREE.PointLight(0xfafad7, 0.5, 2, 1);
  boxPA.position.set(0,star_Height,0);
  boxPB.position.set(0,star_Height,0);
  boxPC.position.set(0,0,0); //Just for Boundary detection, invisible
  boxPA.add(glowLight);
  box.add(boxPA);
  box.add(boxPB);
  box.add(boxPC);
  boxPC.visible = false; 

  let box_target = new THREE.Mesh(wall_geometry, box_material);
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
     let ground = new THREE.Mesh(wall_geometry, ground_material);
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
    if (movingCollisionCheck(targetPosition,wallsBB[i])){
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
    if (movingCollisionCheck(targetPosition,boxesBB[i])){
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
    if (i != boxIndex && movingCollisionCheck(boxTargetPosition,boxesBB[i])){
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
    if (movingCollisionCheck(boxTargetPosition,wallsBB[i])){
      colliding = true; 
    }
  }
  return colliding
}

//depending on current radians, update the direction of each movement
//returns a set of directions and rotations for each of radian cases


/////Interaction (Player Motion; Boxes-players interaction; Boxes-Boxes interaction)///////////////////////////
let isMoving = false; 
let canMove = true; 
let moveBoxIndex = -1; 
let panLeft = false;
let panRight = false;
let canPan = true;
let resetM = false;
let levelCleared = false;
let pushingHandOffset = 0.2;
let playerRotation = 0; 
let moveDirection = new THREE.Vector3();
let direction = new THREE.Vector3();
let targetPosition = new THREE.Vector3();
let previousPosition = new THREE.Vector3();
let boxPreviousPosition = new THREE.Vector3();
let previousLeftHandPosition = new THREE.Vector3();
let previousRightHandPosition = new THREE.Vector3();
let cameraTargetPosition = new THREE.Vector3(); 
let cameraRadius = 5; // Distance from the camera to the origin
let currentControls = updateDirection(previousCameraRotation);
//add homePage to scene initially
let homePage = createHomePage();
scene.add(homePage);

//only allow player to move if game starts
setupClickDetection(camera, homePage)


function movePlayer(moveDirection, rotation){
  if (canMove && !levelCleared){
    direction.set(moveDirection.x, moveDirection.y, moveDirection.z);
    targetPosition.set(players[0].position.x + direction.x, players[0].position.y + direction.y, players[0].position.z + direction.z);
    previousPosition.copy(players[0].position);
    //rotate player no matter if it moves or not
    players[0].rotation.y = rotation;
    //check if player moving into wall
    if (playerCollisionWall(targetPosition)){
      isMoving = false;
      return;
    }
    //check if player moving into box 
    //index of box to be moved returned if can be moved
    moveBoxIndex = playerCollisionBox(targetPosition, direction);
    if (moveBoxIndex == -2){
      console.log('box collision')
      isMoving = false;
      return;
    } else if (moveBoxIndex != -1){
      players[0].children[5].position.set(players[0].children[5].position.x - pushingHandOffset, players[0].children[5].position.y,players[0].children[5].position.z);
      players[0].children[6].position.set(players[0].children[6].position.x - pushingHandOffset, players[0].children[6].position.y,players[0].children[6].position.z);
      boxPreviousPosition.copy(boxes[moveBoxIndex].position);
    }
    isMoving = true;
  } 
}

function updateDirection(degrees){
  switch(degrees){
    case 0:
      return {
        "W": [new THREE.Vector3(0,0,-1), -Math.PI/2],
        "A": [new THREE.Vector3(-1,0,0), 0],
        "S": [new THREE.Vector3(0,0,1), Math.PI/2],
        "D": [new THREE.Vector3(1,0,0), Math.PI], 
      }
    case 90:
      return {
        "W": [new THREE.Vector3(-1,0,0), 0],
        "A": [new THREE.Vector3(0,0,1), Math.PI/2],
        "S": [new THREE.Vector3(1,0,0), Math.PI],
        "D": [new THREE.Vector3(0,0,-1), -Math.PI/2],
      }
    case 180:
      return {
        "W": [new THREE.Vector3(0,0,1), Math.PI/2],
        "A": [new THREE.Vector3(1,0,0), Math.PI],
        "S": [new THREE.Vector3(0,0,-1), -Math.PI/2],
        "D": [new THREE.Vector3(-1,0,0), 0],
      }
    case 270:
      return {
        "W": [new THREE.Vector3(1,0,0), Math.PI],
        "A": [new THREE.Vector3(0,0,-1), -Math.PI/2],
        "S": [new THREE.Vector3(-1,0,0), 0],
        "D": [new THREE.Vector3(0,0,1), Math.PI/2],
      }
    default:
      console.log("none")
      break;
  }
}



window.addEventListener('keydown', onKeyPress); // onKeyPress is called each time a key is pressed
function onKeyPress(event) {
  if(gameStart){
    switch (event.key) {

      case 'w': 
        playerRotation = currentControls["W"][1];
        moveDirection = currentControls["W"][0];
        console.log(currentControls);
        movePlayer(moveDirection, playerRotation);
        break;

      case 'a': 
        playerRotation = currentControls["A"][1];
        moveDirection = currentControls["A"][0];
        movePlayer(moveDirection, playerRotation);
        break;
      case 's': 
        playerRotation = currentControls["S"][1];
        moveDirection = currentControls["S"][0];
        movePlayer(moveDirection, playerRotation);
        break;

      case 'd': 
        playerRotation = currentControls["D"][1];
        moveDirection = currentControls["D"][0];
        movePlayer(moveDirection, playerRotation);
        break;

      case 'q':
      if (canPan){
        if(previousCameraRotation == 270){
          previousCameraRotation = 0;
        } else {
          previousCameraRotation += 90
        }

        //update controls
        currentControls = updateDirection(previousCameraRotation);
        panLeft = true; // Rotate camera counterclockwise
      }
      break;

      case 'e':
      if (canPan){
        if (previousCameraRotation == 0){
          previousCameraRotation = 270;
        } else {
          previousCameraRotation -= 90
        }

        //update controls
        currentControls = updateDirection(previousCameraRotation);
        panRight = true; // Rotate camera clockwise
      }
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
    if (movingCollisionCheck(checkOnTarget, boxesBB[j])){
      boxIsOnTarget = true;
    } 
  }
  if (boxIsOnTarget){
    boxesOnTargets++;
    
  }
 }
 return boxesOnTargets

}
//play this effect when player wins
function winParticleEffect(){
  // winCameraPosition = new THREE.Vector3(players[0].position.x + 2, 0.5, players[0].position.z);
  // camera.position.copy(winCameraPosition);
    if (!lerpingCamera) {
        lerpingCamera = true;
        console.log("Now lerping");
    }
    if (particleGroups.length === 0) {
        for (let i = 0; i < Bx.length; i++) {
            const sparkle = new winSparkle(scene, boxes_target[i].position.x, boxes_target[i].position.y + 3, boxes_target[i].position.z);
            particleGroups.push(sparkle);
        }
    }
    const start = performance.now();
    const interval = setInterval(() => {
        const elapsed = performance.now() - start;
        if (elapsed >= 2000) {
            clearInterval(interval); // Stop the interval
            for (let i = particleGroups.length - 1; i >= 0; i--) { // At this point there should not be any left in the scene, but just in case
                const sparkle = particleGroups[i];
                scene.remove(sparkle);
                sparkle.particles.geometry.dispose();
                sparkle.particles.material.dispose();
                sparkle.particles = null;
            }
            particleGroups = [];
            resetM = true;
            lerpingCamera = false;
            console.log("Done lerping");
        }
    }, 100); 

  //reset camera
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

///animation////////////////////////////////////////////////////////////////
let animation_time = 0;
let delta_animation_time;
const clock = new THREE.Clock();
let flag = 1; //Map Update
let T_player = 1.5; // Player's floating period in seconds
let T_boxes = 1; // Boxes's floating period in seconds
const duration = 0.5; // Duration of player movement in seconds
let animation_time_movement = 0
const cameraRotationDuration = 0.5;
let camera_animation_time = 0; 
let angle = 0; 
//to animate player movement: 
/*
  - WASD should trigger a target position for player
  - whilst player is moving, player should be unable to move
  - can use time to interpolate between current position and target position


*/
function animate() {
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
 players[0].children[5].position.y = floating_player + playerHands_Height;
 players[0].children[6].position.y = floating_player + playerHands_Height;

 //Box Self-Motion
 let floating_boxes = 0.2*Math.sin(animation_time*2*Math.PI/T_boxes+Math.PI/2);
 for(let i = 0; i < Bx.length; i++){
  boxes[i].children[0].rotation.x = animation_time;
  boxes[i].children[0].rotation.y = animation_time;
  boxes[i].children[0].position.y = floating_boxes + star_Height;
  boxes[i].children[1].position.y = floating_boxes + star_Height;
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
      let armOscilation = Math.sin(progress * Math.PI) * (Math.PI / 2);



      // Update the player's position
      if (moveBoxIndex != -1){
        //console.log(boxes[moveBoxIndex].position);
        boxes[moveBoxIndex].position.set(
          boxPreviousPosition.x + oscilation * direction.x,
          boxPreviousPosition.y + oscilation * direction.y, 
          boxPreviousPosition.z + oscilation * direction.z
        );
        //moving arms of the player
        //left arm
        players[0].children[5].rotation.z = -armOscilation;
        //right arm
        players[0].children[6].rotation.z = -armOscilation;
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
            //move arms back to original 
            players[0].children[5].position.x += pushingHandOffset;
            players[0].children[6].position.x += pushingHandOffset;
            boxesBB[moveBoxIndex].setFromObject(boxes[moveBoxIndex]);
          }
          playersBB[0].setFromObject(players[0]);
          moveBoxIndex = -1; 
          direction.set(0,0,0);
          animation_time_movement = 0; // Reset for future animations
          previousPosition.copy(players[0].position); // Update the start position
          //check for win condition
          if (checkTargetBoxes() == boxes_target.length) {
            levelCleared = true;
            winParticleEffect();
          }
          isMoving = false; 
          canMove = true;
      }
  }

    for (let i = particleGroups.length - 1; i >= 0; i--) {
        const sparkle = particleGroups[i];
        sparkle.update();

        if (sparkle.die) {
            scene.remove(sparkle);
            sparkle.particles.geometry.dispose();
            sparkle.particles.material.dispose();
            particleGroups.splice(i, 1);
            sparkle.particles = null;
        }
    }


 //camera transition

    if (lerpingCamera) {
        camera.position.lerp(new THREE.Vector3(10, -5, 10), 0.1);
    }

  if (panLeft) {  
    canPan = false;
    //can have a hashmap of directions
    camera_animation_time += delta_animation_time;
    let progress = Math.min(camera_animation_time / cameraRotationDuration, 1); // Clamp to [0, 1]
    // Smooth easing
    let oscilation = (Math.PI/4) * (1 - Math.cos(progress * Math.PI)); // From 0 to PI/2
    let newAngle = angle + oscilation;
    // Update camera position (keeping the same radius)
    camera.position.x = cameraRadius * Math.sin(newAngle);
    camera.position.z = cameraRadius * Math.cos(newAngle);

    if (progress >= 1) {
      angle = newAngle;
      panLeft = false; 
      canPan = true; //add if statement to wait for animation to finish
      camera_animation_time = 0;
    }
  }

  if (panRight) {
    canPan = false;
    //can have a hashmap of directions
    camera_animation_time += delta_animation_time;
    let progress = Math.min(camera_animation_time / cameraRotationDuration, 1); // Clamp to [0, 1]
    // Smooth easing
    let oscilation = (Math.PI/4) * (1 - Math.cos(progress * Math.PI)); // From 0 to PI/2
    let newAngle = angle - oscilation;
    // Update camera position (keeping the same radius)
    camera.position.x = cameraRadius * Math.sin(newAngle);
    camera.position.z = cameraRadius * Math.cos(newAngle);

    if (progress >= 1) {
      angle = newAngle;
      panRight = false; 
      canPan = true; //add if statement to wait for animation to finish
      camera_animation_time = 0;
    }
  }



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
      for (let i = particleGroups.length - 1; i >= 0; i--) {
          scene.remove(particleGroups[i]);
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

  //only advance if level cleared and reset camera
    if (levelCleared){
      camera.position.set(startGameCameraPosition.x, startGameCameraPosition.y, startGameCameraPosition.z);
      camera.lookAt(0, 0, 0);
      playerRotation = 0; 
      previousCameraRotation = 0
      console.log(camera.position, "camera position");
      updateDirection(previousCameraRotation);
      console.log(flag, "flag");
      flag = flag + 1;
      levelCleared = false;
    }
    console.log(walls, boxes);
    resetM = false;
    initializeScene(flag);
  }

 //Interaction Implementation
 composer.render();
 
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
    bloomPass.strength = 0.25;
    camera.position.copy(startGameCameraPosition)
}

//fetch map data then intialize and begin animating the game
let mapData; 
fetch ('./maps.json')
.then(response => response.json())
.then(data => {
  mapData = data; 
  initializeScene(1); //initialize scene with map 1
  renderer.setAnimationLoop( animate );
  camera.position.set(0, 10, 10)
})
.catch(error => {
  console.error('Error fetching Maps', error);
})
