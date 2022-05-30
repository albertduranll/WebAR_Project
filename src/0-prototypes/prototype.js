import '../style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import testVertexShader from '../shaders/shader1/vertex.glsl'
import testFragmentShader from '../shaders/shader1/fragment.glsl'

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
 * Objects
 */
const objectsDistance = 6

//--------SIMPLE PARTICLE GEOMETRY---------//
//simpleParticleGeometry()
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

//--------ADVANCED PARTICLE GEOMETRY---------//
function advancedParticleGeometry(){

    const particleGeometry = new THREE.BufferGeometry()
    const count = 500

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

//--------SHADERS---------//
shaderLoader()
var meshWithShader;
function shaderLoader(){

    //MESH
    // const geometry = new THREE.PlaneBufferGeometry(1, 1, 32, 32) 
    const geometry = new THREE.SphereBufferGeometry(6, 32, 32)
    const material = new THREE.ShaderMaterial({
        vertexShader: testVertexShader,
        fragmentShader: testFragmentShader,
        side: THREE.DoubleSide
    })
    const mesh = new THREE.Mesh(geometry,material)
    mesh.scale.set(10, 10, 10)
    meshWithShader = mesh;
    scene.add(mesh)
}

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
 const directionalLight = new THREE.DirectionalLight('#ffffff', 3)
//  directionalLight.castShadow = true
 directionalLight.shadow.camera.far = 15
 directionalLight.shadow.mapSize.set(1024, 1024)
 directionalLight.shadow.normalBias = 0.05
 directionalLight.position.set(0.25, 3, - 2.25)
 scene.add(directionalLight)


// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('.webgl')
})
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(sizes.width, sizes.height)

/**
 * Scroll
 */
let scrollY = window.scrollY
let currentSection = 0

window.addEventListener('scroll', () =>
{
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

/**
 * Loop
 */

const loop = () =>
{ 
    // Animate camera
    camera.position.y = - scrollY / sizes.height * objectsDistance

    // Update
    meshWithShader.rotation.y += 0.003
    // particles.rotation.y += 0.01
    // particles.rotation.z += 0.01

    // Render
    renderer.render(scene, camera)

    // Keep looping
    window.requestAnimationFrame(loop)
}
loop()


let visitedSection1 = false;
let visitedSection2 = false;

simpleParticleGeometry()
advancedParticleGeometry()
sectionAction(0);
function sectionAction(index){
    console.log("Seccion " +  index)

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

        visitedSection2 = true;
    }
}
