import '../style.css'
import * as THREE from 'three'
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js'; 

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
     * Obtención de punto central.
     * @param points 
     * @returns 
     */
    getCenterPoint(points) {
        let line = new THREE.Line3(...points)
        return line.getCenter( new THREE.Vector3() );
    }

    /**
     * Inicializamos la línea a dibujar para tomar medidas.
     * @param point 
     * @returns 
     */
    initLine(point) {
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 5,
            linecap: 'round'
        });

        const lineGeometry = new THREE.BufferGeometry().setFromPoints([point, point]);
        return new THREE.Line(lineGeometry, lineMaterial);
    }

    /**
     * Actualización de la línea de medidas.
     * @param  matrix 
     * @param  line 
     */
    updateLine(matrix, line) {
        const positions = line.geometry.attributes.position.array;
        positions[3] = matrix.elements[12]
        positions[4] = matrix.elements[13]
        positions[5] = matrix.elements[14]
        line.geometry.attributes.position.needsUpdate = true;
        line.geometry.computeBoundingSphere();
    }

    /**
     * Inicializamos la retícula que nos permite indicar puntos de origen y final.
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
     * Cálculo de la distancia entre puntos.
     * @param points 
     * @returns 
     */
    getDistance(points) {
        if (points.length == 2) return points[0].distanceTo(points[1]);
    }
    
    /**
     * Vinculamos los puntos reales con su correspondente punto en la pantalla.
     * @param  point 
     * @param  camera 
     * @returns 
     */
    toScreenPosition(point, camera){
        const width = window.innerWidth;
        const height = window.innerHeight;
        const vec = this.workingVec3;
        
        vec.copy(point);
        vec.project(camera);

        vec.x = (vec.x + 1) * width /2;
        vec.y = (-vec.y + 1) * height/2;
        vec.z = 0;

        return vec

    }
    
    /**
     * Inicializamos escena activando la retícula.
     */
    initScene(){
        this.reticle = this.initReticle();
  
        this.scene.add( this.reticle );
    }
    
    /**
     * Seteamos la escena XR para poder tratar el contenido de Realidad Aumentada.
     */
    setupXR(){
        this.renderer.xr.enabled = true;
        
        // const btn = new ARButton( this.renderer, { sessionInit: { requiredFeatures: [ 'hit-test' ], optionalFeatures: [ 'dom-overlay' ], domOverlay: { root: document.body } } } );
        
        const self = this;

        this.hitTestSourceRequested = false;
        this.hitTestSource = null;
        
        //Función para recoger los datos de los puntos si la retícula esta visible.
        function onSelect() {
            if (self.reticle.visible){
                const pt = new THREE.Vector3();
                pt.setFromMatrixPosition(self.reticle.matrix);
                self.measurements.push(pt);
                if (self.measurements.length == 2) {
                  const distance = Math.round(self.getDistance(self.measurements) * 100);

                  const text = document.createElement('div');
                  text.className = 'label';
                  text.style.color = 'rgb(255,255,255)';
                  text.textContent = distance + ' cm';
                  document.querySelector('#container').appendChild(text);

                  self.labels.push({div: text, point: self.getCenterPoint(self.measurements)});

                  self.measurements = [];
                  self.currentLine = null;
                } else {
                  self.currentLine = self.initLine(self.measurements[0]);
                  self.scene.add(self.currentLine);
                }
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
            
            if (this.currentLine) this.updateLine(this.reticle.matrix, this.currentLine);
                
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
        
        //Refrescamos posición de el label de la distancia entre los puntos en función de la ubicación 
        //la cámara.
        this.labels.forEach( label => {
            const pos = self.toScreenPosition(label.point, self.renderer.xr.getCamera(self.camera));
            label.div.style.transform = `translate(-50%, -50%) translate(${pos.x}px,${pos.y}px)`;
        })

        this.renderer.render( this.scene, this.camera );
    }
}

export { App };
