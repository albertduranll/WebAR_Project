import '../style.css'
import * as THREE from 'three'
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'


var container;
var camera, scene, renderer;
var controller;

init();
animate();

/**
 * Método para la inizialización de la escena con el botón AR.
 */
function init() {

    //Creamos elemento div en el HTML
    container = document.createElement( 'div' );
    document.body.appendChild( container );

    //Scene
    scene = new THREE.Scene();

    //Camera
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );

    //Lights
    var light = new THREE.HemisphereLight( 0xffffff, 0xbbbbff, 1 );
    light.position.set( 0.5, 1, 0.25 );
    scene.add( light );

    //Renderer
    renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.xr.enabled = true;
    container.appendChild( renderer.domElement );

    //AR BUTTON
    document.body.appendChild( ARButton.createButton( renderer ) );

    /* ---------------------------------------------------------------------------------- */

    //Geometry
    var geometry = new THREE.SphereBufferGeometry( 0.05, 32, 32).rotateX( Math.PI / 2 );

    /**
     * Función para controlar lo que sucede al pulsar el botón.
     */
    function onSelect() {

        //Material
        var material = new THREE.MeshPhongMaterial( { color: 0xffffff * Math.random() } );
        
        //Mesh
        var mesh = new THREE.Mesh( geometry, material );
        mesh.position.set( 0, 0, - 0.3 ).applyMatrix4( controller.matrixWorld );
        mesh.quaternion.setFromRotationMatrix( controller.matrixWorld );
        scene.add( mesh );

    }

    //Controller
    controller = renderer.xr.getController( 0 );
    controller.addEventListener( 'select', onSelect );
    scene.add( controller );

    //Window resize
    window.addEventListener( 'resize', onWindowResize, false );

}

/**
 * Método para controlar el el tamaño de la proyección en función de aspect ratio de la cámara. 
 */
function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

/**
 * Método para configurar el que el render se refresque cada frame.
 */
function animate() {

    renderer.setAnimationLoop( render );

}

/**
 * Método para crear el render con la escena y cámara que se han creado.
 */
function render() {

    renderer.render( scene, camera );

}