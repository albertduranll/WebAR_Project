import '../style.css'
import * as THREE from 'three'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'


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
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100 );
    this.camera.position.z = 2
        
    /* SCENE */
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( 0x000000 ); //new THREE.Color( 0xebffe6 )

    /* AMBIENT */
    const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    this.scene.add(ambient);
        
    /* LIGHTS */
    const light = new THREE.DirectionalLight( 0xFFFFFF, 4 );
    light.position.set( 5, 5, -15);
    this.scene.add(light);
   
   /**
    * 3D Text
    */
    self.fontLoader = new FontLoader()
    
    self.textIntroduced = document.getElementById("input-text").value
    self.oldText = textIntroduced;

    this.loadFont(self.fontLoader, self.textIntroduced);
            
    /* RENDERER */
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
    this.renderer.setPixelRatio( Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.physicallyCorrectLights = true;
    container.appendChild( this.renderer.domElement );
    
    this.setupXR();

    /* BOTÓN AR */
    this.btn = document.createElement("button");
    this.btn.id = 'ar-button-ARText'
    this.btn.innerHTML = "START AR";
    this.btn.onclick = this.initAR.bind(this);
    container.appendChild(this.btn);
    
    this.renderer.setAnimationLoop( this.render.bind(this) );
		
		window.addEventListener('resize', this.resize.bind(this));
        
	}

  /**
   * Función para crear un texto en 3D
   * @param {*} fontloader 
   * @param {*} newinput 
   */
  loadFont(fontloader, newinput){
    fontloader.load(
      '/fonts/helvetiker_regular.typeface.json',
      (font) =>
      {
          const self = this;
          // Text
          const textGeometry = new TextGeometry(
            newinput,
              {
                  font: font,
                  size: 0.2,
                  height: 0.05,
                  curveSegments: 5,
                  bevelEnabled: true,
                  bevelThickness: 0.03,
                  bevelSize: 0.015,
                  bevelOffset: 0,
                  bevelSegments: 5
              }
          )
          textGeometry.center()

          var material = new THREE.MeshNormalMaterial({
            // flatShading: true,
            wireframe: true
        });
          self.text = new THREE.Mesh(textGeometry, material)
          self.text.position.y = .6
          this.scene.add(self.text)
      }
  )
  }
	
  /* Control de resolución de camara y renderizado. */
  resize(){ 
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( window.innerWidth, window.innerHeight );  
  }	

  /**
   * Seteamos la escena XR para poder tratar el contenido de Realidad Aumentada.
   */
  setupXR(){

    this.renderer.xr.enabled = true;
    
    const self = this;

    this.hitTestSourceRequested = false;
    this.hitTestSource = null;   
  }

  /**
   * Inizializamos la session de realidad aumentada.
   */
  initAR(){
    let currentSession = null;
    const self = this;
    
    function onSessionStarted( session ) {

      session.addEventListener( 'end', onSessionEnded );

      self.renderer.xr.setReferenceSpaceType( 'local' );
      self.renderer.xr.setSession( session );

      self.btn.style.visibility = 'hidden'
      self.scene.background = null;

      self.text.position.set(0,0,-2);
  
      currentSession = session;
    }

    function onSessionEnded( ) {

        currentSession.removeEventListener( 'end', onSessionEnded );

        currentSession = null;

        if (self.text !== null){
          self.scene.remove( self.text );
          self.text = null;
        }
        
        self.renderer.setAnimationLoop( null );
    }

    if ( currentSession === null ) {

        navigator.xr.requestSession( 'immersive-ar' ).then( onSessionStarted );

    } else {

        currentSession.end();

    }
  }        

  /**
   * Función que gestiona el refresco de cada frame.
   * @param {*} timestamp 
   * @param {*} frame 
   */
  render( timestamp, frame ) {

    const self = this;

    self.textIntroduced = document.getElementById("input-text").value; 

    //Borramos y creamos texto 3D si cambia el texto de input.
    if(self.oldText !== self.textIntroduced)
    {
      this.scene.remove(self.text)
      
      this.loadFont(fontLoader, self.textIntroduced)

      self.oldText = self.textIntroduced
    }

    this.renderer.render( this.scene, this.camera );
  }
}

export { App };