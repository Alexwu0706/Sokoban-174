import * as THREE from 'three';


//takes in player and an object to check for collision return true or false
export function collisionCheck(movingBB, objectBB) {
    if (movingBB.containsBox(objectBB)) {
        return true;
    }
    return false;
}