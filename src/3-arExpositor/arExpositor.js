import '../style.css'
import * as THREE from 'three'
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LoadingBar } from '../utils/LoadingBar.js';


init();

function init(){
    document.addEventListener("DOMContentLoaded", function(){
        const app = new App();
        window.app = app;
    });
}

class App{
	constructor(){

		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
		this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
		this.camera.position.set( 0, 4, 14 );
        
		this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0xebffe6 ); //new THREE.Color( 0xebffe6 )
        
		const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.5);
		this.scene.add(ambient);
        
        const light = new THREE.DirectionalLight( 0xFFFFFF, 1.5 );
        light.position.set( 0.2, 1, 1);
        this.scene.add(light);
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.physicallyCorrectLights = true;
        container.appendChild( this.renderer.domElement );

        // //AR BUTTON
        // container.appendChild( ARButton.createButton( this.renderer ) );
        let btn = document.createElement("button");
        btn.innerHTML = "START AR";
        btn.onclick = this.initAR.bind(this);
        container.appendChild(btn);
        
		
        this.loadingBar = new LoadingBar();
        
        this.loadGLTF();
        
        this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        this.controls.target.set(0, 3.5, 0);
        this.controls.update();
        
        window.addEventListener('resize', this.resize.bind(this) );
	}	

    initAR(){
        let currentSession = null;
        const self = this;
        
        const sessionInit = { requiredFeatures: [ 'hit-test' ] };
        
        function onSessionStarted( session ) {

            session.addEventListener( 'end', onSessionEnded );

            self.renderer.xr.setReferenceSpaceType( 'local' );
            self.renderer.xr.setSession( session );

            self.scene.background = null;
            // self.chair.position.set(0,0,0);
       
            currentSession = session;
        }

        function onSessionEnded( ) {

            currentSession.removeEventListener( 'end', onSessionEnded );

            currentSession = null;
            
            // if (self.chair !== null){
            //     self.scene.remove( self.chair );
            //     self.chair = null;
            // }
            
            self.renderer.setAnimationLoop( null );
        }

        if ( currentSession === null ) {

            navigator.xr.requestSession( 'immersive-ar', sessionInit ).then( onSessionStarted );

        } else {

            currentSession.end();

        }
    }
    
    loadGLTF(){
        const loader = new GLTFLoader().setPath('models/');
        const self = this;
		
		// Load a glTF resource
		loader.load(
			// resource URL
			'rose.glb', 
			// called when the resource is loaded
			function ( gltf ) {
                const bbox = new THREE.Box3().setFromObject( gltf.scene );
                console.log(`min:${bbox.min.x.toFixed(2)},${bbox.min.y.toFixed(2)},${bbox.min.z.toFixed(2)} -  max:${bbox.max.x.toFixed(2)},${bbox.max.y.toFixed(2)},${bbox.max.z.toFixed(2)}`);
                
                gltf.scene.traverse( ( child ) => {
                    if (child.isMesh){
                        child.material.metalness = 0.2;
                    }
                })
                self.chair = gltf.scene;

                //self.chair.position.set(0, -10, 0);

                gltf.scene.position.set(0, -5, 0);

				self.scene.add( gltf.scene );
                
                self.loadingBar.visible = false;
				
				self.renderer.setAnimationLoop( self.render.bind(self));
			},
			// called while loading is progressing
			function ( xhr ) {

				self.loadingBar.progress = (xhr.loaded / xhr.total);
				
			},
			// called when loading has errors
			function ( error ) {

				console.log( 'An error happened' );

			}  
        );
    }
    
    loadFBX(){
        const loader = new FBXLoader( ).setPath('./assets/');
        const self = this;
    
        loader.load( 'office-chair.fbx', 
            function ( object ) {    
                self.chair = object;

                self.scene.add( object );
            
                self.loadingBar.visible = false;
            
                self.renderer.setAnimationLoop( self.render.bind(self));
            },
			// called while loading is progressing
			function ( xhr ) {

				self.loadingBar.progress = (xhr.loaded / xhr.total);
				
			},
			// called when loading has errors
			function ( error ) {

				console.log( 'An error happened' );

			} 
        );
    }
    
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
	render( ) {   
        this.chair.rotateY( 0.01 );

        this.renderer.render( this.scene, this.camera );
    }
}

export { App };