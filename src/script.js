import './style.css'
import * as THREE from 'three'
import testVertexShader from './shaders/shader1/vertex.glsl'
import testFragmentShader from './shaders/shader1/fragment.glsl'

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


//--------SHADERS---------//
shaderLoader()
var meshWithShader;
function shaderLoader(){

    //MESH
    const geometry = new THREE.PlaneBufferGeometry(1, 1, 32, 32) 
    // const geometry = new THREE.SphereBufferGeometry(6, 32, 32)
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
camera.position.z = 10
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
    // camera.position.y = - scrollY / sizes.height * objectsDistance

    // Update
    // meshWithShader.rotation.y += 0.003

    // Render
    renderer.render(scene, camera)

    // Keep looping
    window.requestAnimationFrame(loop)
}
loop()