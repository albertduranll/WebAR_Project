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
 * Clase mediante la cual gestionaremos toda la aplicación.
 */
class App{

	constructor(){
    /* HTML CONTAINER*/
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
    
    this.initScene();
    this.setupXR();

    this.initAR();
    
    //Esto permite el refresco de la escena captado por la cámara.
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
    //Creamos geometría para el punto y el circulo.
    let ring = new THREE.RingBufferGeometry(0.045, 0.05, 32).rotateX(- Math.PI / 2);
    let dot = new THREE.CircleBufferGeometry(0.005, 32).rotateX(- Math.PI / 2);
    //Creamos una mesh con un material básico y las geometrías.
    const reticle = new THREE.Mesh(
        BufferGeometryUtils.mergeBufferGeometries([ring, dot]),
        new THREE.MeshBasicMaterial()
    );
    //matrixUpdate a false para que no de problemas con la sesion XR.
    reticle.matrixAutoUpdate = false;

    reticle.visible = false;

    return reticle;
  }

  /**
   * Cargamos el modelo 3D mediante formato .gltf
   */
  loadGLTF(){
    //Creamos el loader
    const loader = new GLTFLoader().setPath('models/');
    const self = this;  

    // Cargamos el modelo GLTF
    loader.load(
      // Nombre del objeto
      'scene.glb', 
      // Llamada cuando el obejeto se ha creado.
      function ( gltf ) {

        self.chair = gltf.scene;
        
        self.chair.visible = false;

        self.scene.add( gltf.scene );
      },
      // Llamada cuando estamos cargando el objeto.
      function ( xhr ) {

      },
      // Llamada cuando hay errores
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
    //Activamos modo XR
    this.renderer.xr.enabled = true;
    
    const self = this;

    //Nos van a servir para las interacciones
    this.hitTestSourceRequested = false;
    this.hitTestSource = null;
      
    function onSelect() {
      if (self.reticle.visible){
        const pt = new THREE.Vector3();
        pt.setFromMatrixPosition(self.reticle.matrix);

        if (self.chair===undefined) return;

        //Colocamos el modelo en la posición de la retícula
        self.chair.position.setFromMatrixPosition( self.reticle.matrix );
        //Añadimos offset en eje Y
        self.chair.position.set(self.chair.position.x, self.chair.position.y +0.6, self.chair.position.z)
        self.chair.scale.set(0.6,0.6,0.6);
        self.chair.rotation.set(0,180,0)

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
    
    //Configuramos aquellos features que necesitemos de la sesion AR.
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

        if (self.chair !== null){
          self.scene.remove( self.chair );
          self.chair = null;
      }
        
        self.renderer.setAnimationLoop( null );
    }

    //Creamos la sesión AR o en caso de existir la finalizamos.
    if ( currentSession === null ) {

        navigator.xr.requestSession( 'immersive-ar', sessionInit ).then( onSessionStarted );

    } else {

        currentSession.end();

    }
  }
  
  /**
   * Solicita la información necesaria para obtener la posición en el viewer de un punto corresponiente al entorno real.
   */
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
  
  /**
   * Gestión de los resultados obtenidos una vez realizado el "requestHitTestSource()".
   * @param {*} frame 
   */
  getHitTestResults( frame ){
    const hitTestResults = frame.getHitTestResults( this.hitTestSource );

    //Si detectamos alguna superficie:
    if ( hitTestResults.length ) {
        
      //Obtenemos la posición del punto en concreto.
      const referenceSpace = this.renderer.xr.getReferenceSpace();
      const hit = hitTestResults[ 0 ];
      const pose = hit.getPose( referenceSpace );

      //Activamos y posicionamos la retícula.
      this.reticle.visible = true;
      this.reticle.matrix.fromArray( pose.transform.matrix );

    } 
    //Si no detectamos superficie:
    else {

      this.reticle.visible = false;
    }

  }            

  /**
   * Función que gestiona el refresco de cada frame.
   * @param {*} timestamp 
   * @param {*} frame 
   */
  render( timestamp, frame ) {
    
    if ( frame ) {

        if ( this.hitTestSourceRequested === false ) this.requestHitTestSource( )

        if ( this.hitTestSource ) this.getHitTestResults( frame );
    }

    this.renderer.render( this.scene, this.camera );
  }
}

export { App };
