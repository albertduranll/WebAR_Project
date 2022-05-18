import '../style.css'
import * as THREE from 'three'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import typefaceFont from 'three/examples/fonts/helvetiker_regular.typeface.json'

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
        // this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
        // this.camera.position.set( 0, 4, -14 );
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100 );
        // this.camera.position.x = 1
        // this.camera.position.y = 1
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
        * Fonts
        */
        const fontLoader = new FontLoader()

        fontLoader.load(
            '/fonts/helvetiker_regular.typeface.json',
            (font) =>
            {
                console.log('loaded')
            }
        )
        
        /**
        * 3D Text
        */
        fontLoader.load(
            '/fonts/helvetiker_regular.typeface.json',
            (font) =>
            {
                const self = this;
                // Text
                const textGeometry = new TextGeometry(
                    'Albert Duran',
                    {
                        font: font,
                        size: 0.2,
                        height: 0.2,
                        curveSegments: 12,
                        bevelEnabled: true,
                        bevelThickness: 0.03,
                        bevelSize: 0.02,
                        bevelOffset: 0,
                        bevelSegments: 5
                    }
                )
                textGeometry.center()

                const textMaterial = new THREE.MeshBasicMaterial({wireframe: true, color: 'green'})
                self.text = new THREE.Mesh(textGeometry, textMaterial)
                this.scene.add(self.text)
            }
        )
                
        /* RENDERER */
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
        this.renderer.setPixelRatio( Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.physicallyCorrectLights = true;
        container.appendChild( this.renderer.domElement );
        
        this.initScene();
        this.setupXR();

        /* BOTÓN AR */
        this.btn = document.createElement("button");
        this.btn.id = 'ar-button'
        this.btn.innerHTML = "START AR";
        this.btn.onclick = this.initAR.bind(this);
        container.appendChild(this.btn);
        
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
   * Inicializamos escena activando la retícula.
   */
  initScene(){
    // this.reticle = this.initReticle();

    // this.loadGLTF();

    // this.scene.add( this.reticle );
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

        // const pt = new THREE.Vector3();
        // pt.setFromMatrixPosition(self.reticle.matrix);

        // if (self.chair===undefined) return;

        // self.chair.scale.set(1.1,1.1,1.1);
        // self.chair.position.setFromMatrixPosition( self.reticle.matrix );
        // self.chair.visible = true;
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

    //   self.chair.visible = false;
       self.text.position.set(0,0,-2);
  
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

    //   this.text.matrix.fromArray( pose.transform.matrix );
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