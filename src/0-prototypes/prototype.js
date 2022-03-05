import '../style.css'
import * as THREE from 'three'
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'
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
const objectsDistance = 7

//--------SIMPLE PARTICLE GEOMETRY---------//
// simpleParticleGeometry()
function simpleParticleGeometry(){

    const particlesGeometry = new THREE.SphereBufferGeometry(1,32,32)
    const materialMaterial = new THREE.PointsMaterial({
        size: 0.01,
        //Controlamos el tamanyo independientemente de la distancia a la que este la camara.
        sizeAttenuation: true
    })
    
    const particles = new THREE.Points(particlesGeometry, materialMaterial);
    particles.position.z = .5
    scene.add(particles)
}

//--------ADVANCED PARTICLE GEOMETRY---------//
// advancedParticleGeometry()
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
        positions[i] = (Math.random() - 0.5) * 10
    }

    particleGeometry.setAttribute(
        'position',
        //El segundo parametro hace referencia a que debe coger x,y,z para cada valor.
        new THREE.BufferAttribute(positions,3)
    )

    const particleMaterial = new THREE.PointsMaterial({
        size: 0.02,
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
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 3
cameraGroup.add(camera)


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



/**
 * ////////////PROTOTYPES////////////////
 */
function sphereWithEffect(){

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
     * Environnements
     */
    // Scene
    const scene = new THREE.Scene()
    
    // Objects
    const objectsDistance = 7
    
    const cube = new THREE.Mesh(new THREE.SphereBufferGeometry(1.5,50,50, 1,100), new THREE.MeshNormalMaterial())
    scene.add(cube)
    
    
    /**
     * Camera
     */
    
    // CameraGroup
    const cameraGroup = new THREE.Group()
    scene.add(cameraGroup)
    
    // Base camera
    const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
    camera.position.z = 3
    cameraGroup.add(camera)
    
    
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
    const clock = new THREE.Clock()
    let previousTime = 0
    
    const loop = () =>
    {
        const elapsedTime = clock.getElapsedTime()
        const deltaTime = elapsedTime - previousTime
        previousTime = elapsedTime
    
        // Animate camera
        camera.position.y = - scrollY / sizes.height * objectsDistance
    
        //Efecto parallax
        const parallaxX = cursor.x * 0.5
        const parallaxY = - cursor.y * 0.5
        cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * 2 * deltaTime
        cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * 2 * deltaTime
    
        // Update
        cube.rotation.y += 0.01
    
        // Render
        renderer.render(scene, camera)
    
        // Keep looping
        window.requestAnimationFrame(loop)
    }
    loop()

}