import '../style.css'
import * as THREE from 'three'
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js'; 
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LoadingBar } from '../utils/LoadingBar.js';


/**
 * Inicializamos la App.
 */
init();

function init(){
    document.addEventListener("DOMContentLoaded", function(){
        const app = new App();
        window.app = app;
    });
}

/**
 * Clase mediante la cual gestionaremos toda la aplicación de la herramienta de medidas con Realidad Aumentada.
 */
class App{

	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
    /* CAMERA */
    this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
    this.camera.position.set( 0, 4, -14 );
        
    /* SCENE */
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( 0xebffe6 ); //new THREE.Color( 0xebffe6 )

    /* AMBIENT */
    const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    this.scene.add(ambient);
        
    /* LIGHTS */
    const light = new THREE.DirectionalLight( 0xFFFFFF, 4 );
    light.position.set( 5, 5, -15);
    this.scene.add(light);
			
    /* RENDERER */
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.physicallyCorrectLights = true;
    container.appendChild( this.renderer.domElement );

    this.loadingBar = new LoadingBar();
    
    this.initScene();
    this.setupXR();

    /* BOTÓN AR */
    this.btn = document.createElement("button");
    this.btn.id = 'ar-button'
    this.btn.innerHTML = "START AR";
    this.btn.onclick = this.initAR.bind(this);
    container.appendChild(this.btn);

    this.controls = new OrbitControls( this.camera, this.renderer.domElement );
    this.controls.target.set(0, 3.5, 0);
    this.controls.update();
    
    this.renderer.setAnimationLoop( this.render.bind(this) );
		
		window.addEventListener('resize', this.resize.bind(this));
        
	}
	
  /* Control de resolución de camara y renderizado. */
  resize(){ 
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( window.innerWidth, window.innerHeight );  
  }	

  /**
   * Inicializamos la retícula.
   * @returns 
   */
  initReticle() {
    let ring = new THREE.RingBufferGeometry(0.045, 0.05, 32).rotateX(- Math.PI / 2);
    let dot = new THREE.CircleBufferGeometry(0.005, 32).rotateX(- Math.PI / 2);
    const reticle = new THREE.Mesh(
        BufferGeometryUtils.mergeBufferGeometries([ring, dot]),
        new THREE.MeshBasicMaterial()
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    return reticle;
  }

    /**
    * Cargamos el modelo 3D mediante formato .gltf
    */
    loadGLTF(){
        const loader = new GLTFLoader().setPath('models/');
        const self = this;

        // Load a glTF resource
        loader.load(
            // resource URL
            'scene.glb', 
            // called when the resource is loaded
            function ( gltf ) {

                self.chair = gltf.scene;

                self.chair.position.set(0, 3, 0);
                
                self.chair.scale.set(4,4,4);
                self.chair.rotation.set(0,75,0);

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

  /**
   * Inicializamos escena activando la retícula.
   */
  initScene(){
    this.reticle = this.initReticle();

    this.loadGLTF();

    this.scene.add( this.reticle );
  }

  
  /**
   * Seteamos la escena XR para poder tratar el contenido de Realidad Aumentada.
   */
  setupXR(){

    this.renderer.xr.enabled = true;
    
    const self = this;

    this.hitTestSourceRequested = false;
    this.hitTestSource = null;
      
    function onSelect() {
      if (self.reticle.visible){
        const pt = new THREE.Vector3();
        pt.setFromMatrixPosition(self.reticle.matrix);

        if (self.chair===undefined) return;

        self.chair.scale.set(1.1,1.1,1.1);
        self.chair.position.setFromMatrixPosition( self.reticle.matrix );
        self.chair.visible = true;
      }
    }

    this.controller = this.renderer.xr.getController( 0 );
    this.controller.addEventListener( 'select', onSelect );
    
    this.scene.add( this.controller );    
  }

  /**
   * Inizializamos la session de realidad aumentada.
   */
  initAR(){
    let currentSession = null;
    const self = this;
    
    const sessionInit = { requiredFeatures: [ 'hit-test' ],
                          optionalFeatures: [ 'dom-overlay' ], 
                          domOverlay: { root: document.body }
                        }
    
    function onSessionStarted( session ) {

      session.addEventListener( 'end', onSessionEnded );

      self.renderer.xr.setReferenceSpaceType( 'local' );
      self.renderer.xr.setSession( session );



      self.btn.style.visibility = 'hidden'
      self.scene.background = null;

      self.chair.visible = false;
  
      currentSession = session;
    }

    function onSessionEnded( ) {

        currentSession.removeEventListener( 'end', onSessionEnded );

        currentSession = null;

        if (self.chair !== null){
          self.scene.remove( self.chair );
          self.chair = null;
      }
        
        self.renderer.setAnimationLoop( null );
    }

    if ( currentSession === null ) {

        navigator.xr.requestSession( 'immersive-ar', sessionInit ).then( onSessionStarted );

    } else {

        currentSession.end();

    }
  }
  
  requestHitTestSource(){
    const self = this;
    
    const session = this.renderer.xr.getSession();

    session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {
        
      session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {

        self.hitTestSource = source;

      } );

    } );

    session.addEventListener( 'end', function () {

      self.hitTestSourceRequested = false;
      self.hitTestSource = null;
      self.referenceSpace = null;

    } );

    this.hitTestSourceRequested = true;

  }
  
  getHitTestResults( frame ){
    const hitTestResults = frame.getHitTestResults( this.hitTestSource );

    if ( hitTestResults.length ) {
        
      const referenceSpace = this.renderer.xr.getReferenceSpace();
      const hit = hitTestResults[ 0 ];
      const pose = hit.getPose( referenceSpace );

      this.reticle.visible = true;
      this.reticle.matrix.fromArray( pose.transform.matrix );

    } else {

      this.reticle.visible = false;
    }

  }            

  render( timestamp, frame ) {

    const self = this;
    
    if ( frame ) {

        if ( this.hitTestSourceRequested === false ) this.requestHitTestSource( )

        if ( this.hitTestSource ) this.getHitTestResults( frame );

    }
    else
    {
        // if(this.chair !== undefined)
        //     this.chair.rotateY( 0.01 );
    }


    this.renderer.render( this.scene, this.camera );
  }
}

export { App };