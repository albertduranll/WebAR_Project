import './style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'

/**
 * Sizes
 */
const sizes = {}
sizes.width = window.innerWidth
sizes.height = window.innerHeight

window.addEventListener('resize', () =>
{
    // Save sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
})

/**
 * Scene
 */
const scene = new THREE.Scene()

/**
 * Camera
 */

// CameraGroup
const cameraGroup = new THREE.Group()
scene.add(cameraGroup)

// Base camera
const camera = new THREE.PerspectiveCamera(65, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 8.8
camera.position.z = 5
cameraGroup.add(camera)

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight( 0xFFFFFF, 1.8 );
directionalLight.position.set( 5, 5, 15);
scene.add(directionalLight);


/**
 * Objects
 */
const objectsDistance = 6

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('.webgl')
})
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(sizes.width, sizes.height)

/**
 * Función para crear una esfera a base de posicionar partículas
 */
function simpleParticleGeometry(){

    const particlesGeometry = new THREE.SphereBufferGeometry(1.2,64,64)
    const materialMaterial = new THREE.PointsMaterial({
        size: 0.01,
        //Controlamos el tamanyo independientemente de la distancia a la que este la camara.
        sizeAttenuation: true
    })
    
    const particles = new THREE.Points(particlesGeometry, materialMaterial);
    particles.position.y = -objectsDistance * 2
    particles.position.z = 0
    scene.add(particles)
}

/**
 * Creamos la galaxia que nos rodea en la escena 3D
 */
function galaxyParticleGeometry(){

    const particleGeometry = new THREE.BufferGeometry()
    const count = 1000


    //Es una array de 1 dimensión con lo cual estara rellena de tal manera que
    //los primeros 3 valores corresponden a la x,y,z del primer punto, los tres
    //siguientes corresponderan al segunto, etc. Si multiplicamos por 3 lo que hacemos
    //es poder seleccionar para cada punto sus posiciones.
    const positions = new Float32Array(count * 3)

    for (let i = 0; i < count * 3; i++) {

        //0.5 para centrar las particulas alrededor del punto 0,0,0
        //Si lo modificamos se colocan del 0 al 1 y de este modo van de -0.5 a 0.5
        positions[i] = (Math.random() - 0.5) * 100
    }

    particleGeometry.setAttribute(
        'position',
        //El segundo parametro hace referencia a que debe coger x,y,z para cada valor.
        new THREE.BufferAttribute(positions,3)
    )

    const particleMaterial = new THREE.PointsMaterial({
        size: 0.15,
        sizeAttenuation: true,
    })

    const meshParticles = new THREE.Points(particleGeometry,particleMaterial)
    scene.add(meshParticles)
}
galaxyParticleGeometry()


/**
 * LOADER GLTF
 */
function loadGLTF(modelName, initialY_Pos, offsetX, offsetY){
    //Creamos el loader
    const loader = new GLTFLoader().setPath('models/');
    const self = this;  

    // Cargamos el modelo GLTF
    loader.load(
        // Nombre del objeto
        modelName, 
        // Llamada cuando el obejeto se ha creado.
        function ( gltf ) {
        
        gltf.scene.visible = true;

        gltf.scene.position.y = initialY_Pos
        gltf.scene.position.set(gltf.scene.position.x + offsetX, gltf.scene.position.y + offsetY, gltf.scene.position.z);
          
        if(modelName !== 'ruler.glb'){

            gltf.scene.scale.set(1.5,1.5,1.5);
            gltf.scene.rotation.set(0,0,0);
        }
        else{
            gltf.scene.scale.set(.1,.1,.1);
            gltf.scene.rotation.set(90,-90,45);
        }
        
        scene.add( gltf.scene );
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
 * 3D Text
 */
 const fontLoader = new FontLoader()

 loadFont(fontLoader, "    WebAR\nExperiments", .35)

 // Función para crear el texto3D
 function loadFont(fontloader, newinput, size){
    fontloader.load(
      '/fonts/helvetiker_regular.typeface.json',
      (font) =>
      {
          // Text
          const textGeometry = new TextGeometry(
            newinput,
              {
                  font: font,
                  size: size,
                  height: 0.1,
                  curveSegments: 8,
                  bevelEnabled: true,
                  bevelThickness: 0.03,
                  bevelSize: 0.015,
                  bevelOffset: 0,
                  bevelSegments: 5
              }
          )
          textGeometry.center()

          var material = new THREE.MeshNormalMaterial({
            flatShading: true,
            });

          const text = new THREE.Mesh(textGeometry, material)

          if(newinput === "(_____)")
            text.position.y = (-objectsDistance * 5) - 0.15
          else
            text.position.y = (-objectsDistance * 0)

           scene.add(text)
      }
  )
  }

/**
 * Scroll
 */
let scrollY = window.scrollY
let currentSection = 0

window.addEventListener('scroll', () =>
{
    //Utilizamos el scroll para detectar las secciones de la página.
    scrollY = window.scrollY
    const newSection = Math.round(scrollY / sizes.height)

    if(newSection != currentSection)
    {
        currentSection = newSection
        
        //Acciones según secciones
        sectionAction(currentSection)
    }
})

/**
 * Cursor
 */
const cursor = {}
cursor.x = 0
cursor.y = 0

window.addEventListener('mousemove', (event) =>
{
    cursor.x = event.clientX / sizes.width - 0.5
    cursor.y = event.clientY / sizes.height - 0.5
})


let visitedSection1 = false;
let visitedSection2 = false;
let visitedSection3 = false;
let visitedSection4 = false;
let visitedSection5 = false;

sectionAction(0);

/**
 * Acciones a realizar según la sección en la que estemos.
 * @param {*} index 
 */
function sectionAction(index){
    // console.log("Seccion " +  index)

    if(index === 0 && !visitedSection1){
        
        let meshList = []
        const numMeshes = 6

        for (let i = 0; i < numMeshes; i++) {
           
            //Geometry
            var geometry = new THREE.OctahedronBufferGeometry( 2, 2 ).rotateX( - Math.PI / 2 );

            //Material
            var material = new THREE.MeshNormalMaterial({
                flatShading: true
            });

            //Mesh
            var mesh = new THREE.Mesh( geometry, material );

            meshList.push(mesh)
        }

        meshList[0].position.set(0, -objectsDistance * (index+1), -1.5)
        meshList[0].scale.set(.4,.4,.4)

        meshList[1].position.set(-1.5, -5, -2)
        meshList[1].scale.set(.2,.2,.2)

        meshList[2].position.set(1.5, -4.5, -1)
        meshList[2].scale.set(.2,.2,.2)

        meshList[3].position.set(-1.9, -7.3, -1)
        meshList[3].scale.set(.2,.2,.2)

        meshList[4].position.set(-0.5, -4.3, -1)
        meshList[4].scale.set(.15,.15,.15)

        meshList[5].position.set(1.5, -7.8, -1.5)
        meshList[5].scale.set(.15,.15,.15)

        scene.add( meshList[0],  meshList[1], meshList[2], meshList[3], meshList[4], meshList[5]);

        visitedSection1 = true;
    }
    else if(index === 1 && !visitedSection2){

        simpleParticleGeometry()
        visitedSection2 = true;
    }
    else if(index === 2 && !visitedSection3){

        loadGLTF(
            "dance1.glb", 
            -objectsDistance * 3, 
            0, -1.2)
        loadGLTF(
            "dance2.glb", 
            -objectsDistance * 3,
            -1.2, -1.2)
        loadGLTF(
            "dance3.glb", 
            -objectsDistance * 3, 
            1.2, -1.2)
        visitedSection3 = true;
    }
    else if(index === 3 && !visitedSection4){
        
        loadGLTF(
            "ruler.glb", 
            -objectsDistance * 4, 
            0, 0)

        loadFont(fontLoader, "(_____)", .5)
        visitedSection4 = true;
    }
}

/**
 * Loop
 */

 const loop = () =>
 { 
     // Animate camera
     camera.position.y = - scrollY / sizes.height * objectsDistance
 
     // Render
     renderer.render(scene, camera)
 
     // Keep looping
     window.requestAnimationFrame(loop)
 }
 loop()
