import * as THREE from 'three';


//takes in player and an object to check for collision return true or false
export function movingCollisionCheck(newPos, objectBB) {
    const maxX = objectBB.max.x;
    const minX = objectBB.min.x;
    const minZ = objectBB.min.z;
    const maxZ = objectBB.max.z;

    if (newPos.x < maxX && newPos.x > minX && newPos.z < maxZ && newPos.z > minZ) {
        return true;
    }
}

//take in target position, 
//use bounding box for walls to check collisions
//update bounding box for boxes after each movement
//can use a target position to check with the bounding box of others

export function boundingBoxCollisionCheck(movingBB, objectBB) {
    if (movingBB.containsBox(objectBB)) {
        return true;
    }
    return false;
}