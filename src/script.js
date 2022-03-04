import './style.css'
import * as THREE from 'three'
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'


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