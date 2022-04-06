import '../style.css'
import * as THREE from 'three'
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'
import { ControllerGestures } from '../utils/ControllerGestures.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LoadingBar } from '../utils/LoadingBar.js';
import { Player } from '../utils/Player.js';


const container = document.createElement( 'div' );
document.body.appendChild( container );

const clock = new THREE.Clock();

const loadingBar = new LoadingBar();

const assetsPath = 'models/knight/';

const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
camera.position.set( 0, 1.6, 3 );

const scene = new THREE.Scene();

const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2);
ambient.position.set( 0.5, 1, 0.25 );
scene.add(ambient);

const light = new THREE.DirectionalLight();
light.position.set( 0.2, 1, 1);
scene.add(light);
    
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.outputEncoding = THREE.sRGBEncoding;
container.appendChild( renderer.domElement );
setEnvironment();

const workingVec3 = new THREE.Vector3();

initScene();
setupXR();

window.addEventListener('resize', resize.bind(this)); //TODO SAME AS THE OTHER


function setEnvironment(){
    // const loader = new RGBELoader().setDataType( THREE.UnsignedByteType );
    // const pmremGenerator = new THREE.PMREMGenerator( this.renderer );
    // pmremGenerator.compileEquirectangularShader();
    
    // loader.load( '../../assets/hdr/venice_sunset_1k.hdr', ( texture ) => {
    //   const envMap = pmremGenerator.fromEquirectangular( texture ).texture;
    //   pmremGenerator.dispose();

    //   self.scene.environment = envMap;

    // }, undefined, (err)=>{
    //     console.error( 'An error occurred setting the environment');
    // } );
}

function resize(){ 
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );  
}

function loadKnight(){
    const loader = new GLTFLoader().setPath(assetsPath);
    
    // Load a GLTF resource
    loader.load(
        // resource URL
        `knight2.glb`,
        // called when the resource is loaded
        function ( gltf ) {
            const object = gltf.scene.children[5];
            
            const options = {
                object: object,
                speed: 0.5,
                assetsPath: assetsPath,
                loader: loader,
                animations: gltf.animations,
                clip: gltf.animations[0],
                app: object,
                name: 'knight',
                npc: false
            };
            
            const knight = new Player(options);
            knight.object.visible = false;
            
            knight.action = 'Dance';
            const scale = 0.005;
            knight.object.scale.set(scale, scale, scale); 
            
            loadingBar.visible = false;
            //TODO: SET AS THE OTHE
            renderer.setAnimationLoop( (timestamp, frame) => { render(timestamp, frame); } );//(timestamp, frame) => { self.render(timestamp, frame); } );
        },
        // called while loading is progressing
        function ( xhr ) {

            loadingBar.progress = (xhr.loaded / xhr.total);

        },
        // called when loading has errors
        function ( error ) {

            console.log( 'An error happened' );
            console.log(assetsPath + 'knight2.glb')

        }
    );
}		

function initScene(){
    const reticle = new THREE.Mesh(
        new THREE.RingBufferGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
        new THREE.MeshBasicMaterial()
    );
    
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add( reticle );
    
    loadKnight();
}

function setupXR(){
    renderer.xr.enabled = true;
    
    const btn = new ARButton( renderer, { sessionInit: { requiredFeatures: [ 'hit-test' ], optionalFeatures: [ 'dom-overlay' ], domOverlay: { root: document.body } } } );

    const hitTestSourceRequested = false;
    const hitTestSource = null;
    
    function onSelect() {
        if (knight===undefined) return;
        
        if (reticle.visible){
            if (knight.object.visible){
                workingVec3.setFromMatrixPosition( reticle.matrix );
                knight.newPath(workingVec3);
            }else{
                knight.object.position.setFromMatrixPosition( reticle.matrix );
                knight.object.visible = true;
            }
        }
    }

    const controller = renderer.xr.getController( 0 );
    controller.addEventListener( 'select', onSelect );
    
    scene.add( controller );    
}

function requestHitTestSource(){
    
    const session =renderer.xr.getSession();

    session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {
        
        session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {

        hitTestSource = source;

        } );

    } );

    session.addEventListener( 'end', function () {

    hitTestSourceRequested = false;
    hitTestSource = null;
    referenceSpace = null;

    } );

hitTestSourceRequested = true;

}

function getHitTestResults( frame ){
    const hitTestResults = frame.getHitTestResults( hitTestSource );

    if ( hitTestResults.length ) {
        
        const referenceSpace = this.renderer.xr.getReferenceSpace();
        const hit = hitTestResults[ 0 ];
        const pose = hit.getPose( referenceSpace );

        reticle.visible = true;
        reticle.matrix.fromArray( pose.transform.matrix );

    } else {

        reticle.visible = false;

    }

}

function render( timestamp, frame ) {
    const dt = clock.getDelta();
    if (knight) knight.update(dt);

    if ( frame ) {

        if ( hitTestSourceRequested === false ) requestHitTestSource( )

        if ( hitTestSource ) getHitTestResults( frame );
    }

    renderer.render( scene, camera );
    
    /*if (this.knight.calculatedPath && this.knight.calculatedPath.length>0){
        console.log( `path:${this.knight.calculatedPath[0].x.toFixed(2)}, ${this.knight.calculatedPath[0].y.toFixed(2)}, ${this.knight.calculatedPath[0].z.toFixed(2)} position: ${this.knight.object.position.x.toFixed(2)}, ${this.knight.object.position.y.toFixed(2)}, ${this.knight.object.position.z.toFixed(2)}`);
    }*/
}