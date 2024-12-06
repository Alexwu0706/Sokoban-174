import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';


//TODO: 
// create a button function 
// first create a play button that can start the game at any time
// then create a button that can be used to return to the home page
// then create a button for instructions
// then style the billboard to be transparent and have radius
// then add images to instructions

const TITLE = 'The Stars Align';

class BillBoardShader {
    vertexShader(){ 
        return(
        `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `
        )
    }
    fragmentShader(){
        return(
        `
            uniform vec3 color;
            uniform float borderRadius;
            uniform float opacity;
            varying vec2 vUv;

            void main() {
                float radius = borderRadius;
                vec2 uv = vUv * 2.0 - 1.0;
                float dist = length(max(abs(uv) - vec2(1.0 - radius), 0.0)) - radius;
                float alpha = smoothstep(0.01, 0.02, -dist);
                gl_FragColor = vec4(color, opacity * alpha);
            }
        `
        )
    }
}

class ImageShader {
    vertexShader() {
        return `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
    }

    fragmentShader() {
        return `
            uniform sampler2D uTexture;
            uniform float borderRadius;
            uniform float opacity;
            varying vec2 vUv;

            void main() {
                vec4 texColor = texture2D(uTexture, vUv);
                float radius = borderRadius;
                vec2 uv = vUv * 2.0 - 1.0;
                float dist = length(max(abs(uv) - vec2(1.0 - radius), 0.0)) - radius;
                float alpha = smoothstep(0.01, 0.02, -dist);
                gl_FragColor = vec4(texColor.rgb, texColor.a * opacity * alpha);
            }
        `;
    }
}

const pushingBoxImg = new THREE.TextureLoader().load('./assets/boxPush.png');

const imageUniforms = {
    uTexture: { value: pushingBoxImg },
    borderRadius: { value: 0.1 },
    opacity: { value: 1.0 }
};

const billBoardUniforms = {
    color: { value: new THREE.Color(0x808080) }, // White color
    borderRadius: { value: 0.1 }, 
    opacity: { value: 0.8 } 
};

const buttonUniforms = {
    color: { value: new THREE.Color(0x301934) }, // White color
    borderRadius: { value: 0.1 }, 
    opacity: { value: 0.8 } 
}

const titleBoxUniforms ={
    color: { value: new THREE.Color(0x301934) }, // White color
    borderRadius: { value: 0.1 }, 
    opacity: { value: 0 } 
}

let homePage = new THREE.Group();

const billboardGeometry = new THREE.PlaneGeometry(6, 6);
const billBoardMatShader = new BillBoardShader();
const billboardMaterial = new THREE.ShaderMaterial({
    uniforms: billBoardUniforms,
    vertexShader: billBoardMatShader.vertexShader(),
    fragmentShader: billBoardMatShader.fragmentShader(),
    transparent: true
});
const billboardMesh = new THREE.Mesh(billboardGeometry, billboardMaterial);
billboardMesh.position.set(0, 0, 0);

const imageShader = new ImageShader();
const imageMaterial = new THREE.ShaderMaterial({
    uniforms: imageUniforms,
    vertexShader: imageShader.vertexShader(),
    fragmentShader: imageShader.fragmentShader(),
    transparent: true
})


const buttonShader = new BillBoardShader();
const buttonMaterial = new THREE.ShaderMaterial({
    uniforms: buttonUniforms,
    vertexShader: buttonShader.vertexShader(),
    fragmentShader: buttonShader.fragmentShader(),
    transparent: true
});

const titleBoxMaterial = new THREE.ShaderMaterial({
    uniforms: titleBoxUniforms,
    vertexShader: buttonShader.vertexShader(),
    fragmentShader: buttonShader.fragmentShader(),
    transparent: true
});




export function createHomePage(){

    const loader = new FontLoader();
    let title = createTitle(TITLE, eventTrigger())
    //create buttons
    let playButton = createButton('Play', eventTrigger() );
    let instructionsButton = createButton('Instructions', eventTrigger());
    title.position.y += 2;
    instructionsButton.position.y -= 2;
    homePage.add(title); 
    homePage.add(playButton);
    homePage.add(instructionsButton);
    homePage.add(billboardMesh);

    return homePage;
}


function createButton(text, onClick){
    const button = new THREE.Group();
    const loader = new FontLoader();
    loader.load('./assets/font.typeface.json', (font) => {
        // Create Text
        const textGeometry = new TextGeometry(text, {
            font: font,
            size: 0.3,    // Font size
            depth: 0.1,  // Depth of the text
            curveSegments: 12, // Curve quality
            bevelEnabled: true, // Optional beveling
            bevelThickness: 0.03,
            bevelSize: 0.02,
        });
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(0,0,0.01)
        textMesh.name = text + "Button";
        
        //create button background to be wider than text
        const textBox = new THREE.Box3().setFromObject(textMesh);
        const buttonBG = new THREE.PlaneGeometry(textBox.max.x - textBox.min.x + 0.5, textBox.max.y - textBox.min.y + 0.5);
        const buttonMesh = new THREE.Mesh(buttonBG, buttonMaterial);
        buttonMesh.name = text + "BG"
        //center text on button
        centerText(textMesh, buttonMesh);
        button.add(buttonMesh);
        button.add(textMesh);

    });

    button.userData.onClick = onClick;
    return button;

}

//create title with transparent box
function createTitle(text){
    const title = new THREE.Group();
    const loader = new FontLoader();
    loader.load('./assets/font.typeface.json', (font) => {
        // Create Text
        const textGeometry = new TextGeometry(text, {
            font: font,
            size: 0.5,    // Font size
            depth: 0.1,  // Depth of the text
            curveSegments: 12, // Curve quality
            bevelEnabled: true, // Optional beveling
            bevelThickness: 0.03,
            bevelSize: 0.02,
        });
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x0000000 });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(0,0,0.01)
        textMesh.name = text + "Button";
        
        //create button background to be wider than text
        const textBox = new THREE.Box3().setFromObject(textMesh);
        const titleBG = new THREE.PlaneGeometry(textBox.max.x - textBox.min.x + 0.5, textBox.max.y - textBox.min.y + 0.5);
        const titleMesh = new THREE.Mesh(titleBG, titleBoxMaterial);
        titleMesh.name = text + "BG"
        //center text on button
        centerText(textMesh, titleMesh);
        title.add(titleMesh);
        title.add(textMesh);

    });
    return title;

}


//always center the text on billBoard
function centerText(objMesh, billBoardMesh){
    const textBoundaryBox = new THREE.Box3().setFromObject(objMesh);
    const boardBoundaryBox = new THREE.Box3().setFromObject(billBoardMesh);
    
    //substract width of text box and board box
    const boundaryDifferenceX = (boardBoundaryBox.max.x - boardBoundaryBox.min.x) - (textBoundaryBox.max.x - textBoundaryBox.min.x);
    const offSetToCenterX = boardBoundaryBox.min.x + (boundaryDifferenceX / 2);

    const boundaryDifferenceY = (boardBoundaryBox.max.y - boardBoundaryBox.min.y) - (textBoundaryBox.max.y - textBoundaryBox.min.y);
    const offSetToCenterY = boardBoundaryBox.min.y + (boundaryDifferenceY / 2);
    
    objMesh.position.set(offSetToCenterX, offSetToCenterY, 0.01);
}


// Detect Clicks
export function setupClickDetection(camera, billboard) {
    function onDocumentMouseDown(event) {
        console.log('click')
        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(billboard.children, true);
        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            switch(clickedObject.name){
                case 'PlayButton':
                    eventTrigger('Play');
                    break;
                case 'PlayBG': 
                    eventTrigger('Play');
                    break;
                case 'InstructionsButton':
                    expandHomePage();
                    eventTrigger('Instructions');
                    break;
                case 'InstructionsBG':
                    expandHomePage();
                    eventTrigger('Instructions');
                    break;
                case 'Go BackButton':
                    goBackToMenu();
                    break;
                case 'Go BackBG':
                    goBackToMenu();
                    break;
                default:
                    console.log(clickedObject)
            }
        }
    }

    document.addEventListener('mousedown', onDocumentMouseDown, false);
}



//can have an event listener, that throws an event and when event is picked up, it will change boolean 

function eventTrigger(text){
    const event = new CustomEvent('buttonClick', {detail: {button : text}});
    document.dispatchEvent(event);
}


//fade homePage out and fade homePage in
function expandHomePage() {
    homePage.clear(); // Clear all children after scaling
    populateInstructions(); // Add new content
    //         populateInstructions(); // Add new content
    //         populateInstructions(); // Add new content
    // const duration = 1; // Duration of the animation in seconds
    // let currentPosition = new THREE.Vector3();

    // const initialPosition = homePage.position.clone(); // Save current scale
    // const targetPosition = new THREE.Vector3(initialPosition.x, initialPosition.y + 8.0, initialPosition.z); // Desired expanded scale


    // const clock = new THREE.Clock();
    // function animate() {
    //     const elapsed = clock.getElapsedTime();
    //     const t = Math.min(elapsed / duration, 1); // Normalize time to [0, 1]
        
    //     currentPosition.set(targetPosition.x, targetPosition.y * t, targetPosition.z);
    //     homePage.position.set(currentPosition.x, currentPosition.y, currentPosition.z); // Set new scale
    //     if (t >= 1) {
    //         homePage.clear(); // Clear all children after scaling
    //         populateInstructions(); // Add new content
    //     } else {
    //         requestAnimationFrame(animate);
    //     }
    // }

    // clock.start();
    // animate();
}


function populateInstructions() {
    // Add new content to the billboard for instructions


    const loader = new FontLoader();
    loader.load('./assets/font.typeface.json', (font) => {
        const instructionsText = new TextGeometry('Instructions :\nW,A,S,D to move \nR to reset level \nQ or E to change camera angle\nMove all stars to targets\ngood luck !', {
            font: font,
            size: 0.3,
            depth: 0.05,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.02,
        });
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const textMesh = new THREE.Mesh(instructionsText, textMaterial);
        textMesh.position.set(0, 2, 0.01);
        //positioning text
        centerText(textMesh, billboardMesh);
        textMesh.position.y += 4

        //scaling billboard
        billboardMesh.scale.set(3,2,2);
        
        homePage.add(billboardMesh)
        homePage.add(textMesh);
    });
    //button to go back 
    const backButton = createButton('Go Back', goBackToMenu);
    
    //load images of instructions
    const pushingBoxCanvas = new THREE.PlaneGeometry(5,3); 
    const pushingBoxImgMesh = new THREE.Mesh(pushingBoxCanvas, imageMaterial)
    //make bg transparent? 

    homePage.add(pushingBoxImgMesh);
    pushingBoxImgMesh.position.z += 0.01
    pushingBoxImgMesh.position.y -= 1;
    backButton.position.y -= 3;
    homePage.add(backButton);
}

//there is still a bug where the title does not appear
//navigating from instructions to menu
function goBackToMenu(){
    billboardMesh.scale.set(1,1,1);
    homePage.clear();
    homePage = createHomePage();
    
}
