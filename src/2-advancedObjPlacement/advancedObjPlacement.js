import '../style.css'
import * as THREE from 'three'
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'
import { ControllerGestures } from '../utils/ControllerGestures.js';


const container = document.createElement( 'div' );
document.body.appendChild( container );

const clock = new THREE.Clock();

const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.01, 20 );

const scene = new THREE.Scene();

scene.add(camera);

scene.add( new THREE.HemisphereLight( 0x606060, 0x404040 ) );

const light = new THREE.DirectionalLight( 0xffffff );
light.position.set( 1, 1, 1 ).normalize();
scene.add( light );
    
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.outputEncoding = THREE.sRGBEncoding;

container.appendChild( renderer.domElement );

var mesh;
var gestures;
let controller = renderer.xr.getController( 0 );

const origin = new THREE.Vector3();
const euler = new THREE.Euler();
const quaternion = new THREE.Quaternion();

initScene();
setupXR();

window.addEventListener('resize', onWindowResize, false );

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function initScene(){
    
    var geometry = new THREE.BoxBufferGeometry( 0.2, 0.2, 0.2, 4, 4, 4 ).rotateX( Math.PI / 2 );
    var material = new THREE.MeshPhongMaterial( { color: 0xffffff * Math.random() } );
    mesh = new THREE.Mesh( geometry, material );
    mesh.position.set( 0, 0, - 0.3 ).applyMatrix4( controller.matrixWorld );
    mesh.quaternion.setFromRotationMatrix( controller.matrixWorld );
    mesh.visible = false;
    scene.add( mesh );
}

function setupXR(){
    renderer.xr.enabled = true; 

    document.body.appendChild( ARButton.createButton( renderer ) );
    
    gestures = new ControllerGestures( renderer );
    let startPos;
    gestures.addEventListener( 'tap', (ev)=>{
        if (!mesh.visible){
            mesh.visible = true;
            mesh.position.set( 0, -0.3, -0.5 ).add( ev.position );
            scene.add( mesh ); 
        }
        else{
            
        }
    });
    gestures.addEventListener( 'pan', (ev)=>{
        // console.log( ev );
        if (ev.initialise !== undefined){
            startPos = mesh.position.clone();
        }else{
            const pos = startPos.clone().add( ev.delta.multiplyScalar(3) );
            mesh.position.copy( pos );
            // self.ui.updateElement('info', `pan x:${ev.delta.x.toFixed(3)}, y:${ev.delta.y.toFixed(3)}, x:${ev.delta.z.toFixed(3)}` );
        } 
    });
    
    renderer.setAnimationLoop( render );
}

function resize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );  
}

function render( ) {   
    const dt = clock.getDelta();

    if ( renderer.xr.isPresenting ){
        gestures.update();
    }

    renderer.render( scene, camera );
}