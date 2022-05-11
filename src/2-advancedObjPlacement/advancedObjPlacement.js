import '../style.css'
import * as THREE from 'three'
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js'; 
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

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
    this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
		this.camera.position.set( 0, 1.6, 3 );
        
    /* SCENE */
		this.scene = new THREE.Scene();
    this.scene.background = null;

    /* AMBIENT */
		const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2);
    ambient.position.set( 0.5, 1, 0.25 );
		this.scene.add(ambient);
        
    /* LIGHTS */
    const light = new THREE.DirectionalLight();
    light.position.set( 0.2, 1, 1);
    this.scene.add(light);
			
    /* RENDERER */
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.outputEncoding = THREE.sRGBEncoding;
		container.appendChild( this.renderer.domElement );
        
    const labelContainer = document.createElement('div');
    labelContainer.style.position = 'absolute';
    labelContainer.style.top = '0px';
    labelContainer.style.pointerEvents = 'none';
    labelContainer.setAttribute('id', 'container');
    container.appendChild(labelContainer);
    this.labelContainer = labelContainer;
    
    this.workingVec3 = new THREE.Vector3();
    this.labels = [];
    this.measurements = [];
    
    this.initScene();
    this.setupXR();

    /* BOTÓN AR */
    let btn = document.createElement("button");
    btn.innerHTML = "START AR";
    btn.onclick = this.initAR.bind(this);
    container.appendChild(btn);
    
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
      'chair1.glb', 
      // called when the resource is loaded
      function ( gltf ) {
        // const bbox = new THREE.Box3().setFromObject( gltf.scene );
        // console.log(`min:${bbox.min.x.toFixed(2)},${bbox.min.y.toFixed(2)},${bbox.min.z.toFixed(2)} -  max:${bbox.max.x.toFixed(2)},${bbox.max.y.toFixed(2)},${bbox.max.z.toFixed(2)}`);
        
        gltf.scene.traverse( ( child ) => {
            if (child.isMesh){
                child.material.metalness = 0.2;
            }
        })

        self.rose = gltf.scene;
        
        // self.rose.position.set(0, -10, -10);
        // self.rose.scale.set(.4,.4,.4);
        self.rose.visible = false;

        self.scene.add( gltf.scene );
        
        self.renderer.setAnimationLoop( self.render.bind(self));
      },
      // called while loading is progressing
      function ( xhr ) {

        
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

        // self.measurements.push(pt);
        // if (self.measurements.length == 2) {
        //   const distance = Math.round(self.getDistance(self.measurements) * 100);

        //   const text = document.createElement('div');
        //   text.className = 'label';
        //   text.style.color = 'rgb(255,255,255)';
        //   text.textContent = distance + ' cm';
        //   document.querySelector('#container').appendChild(text);

        //   self.labels.push({div: text, point: self.getCenterPoint(self.measurements)});

        //   self.measurements = [];
        //   self.currentLine = null;
        // } else {
        //   self.currentLine = self.initLine(self.measurements[0]);
        //   self.scene.add(self.currentLine);
        // }

        if (self.rose===undefined) return;

        self.rose.position.setFromMatrixPosition( self.reticle.matrix );
        self.rose.visible = true;
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

      self.scene.background = null;
  
      currentSession = session;
    }

    function onSessionEnded( ) {

        currentSession.removeEventListener( 'end', onSessionEnded );

        currentSession = null;

        if (self.rose !== null){
          self.scene.remove( self.rose );
          self.rose = null;
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

        // self.rose.rotateY( 0.01 );
    }

    this.renderer.render( this.scene, this.camera );
  }
}

export { App };
