import '../style.css'
import * as THREE from 'three'
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

activateXR();

async function activateXR() {
    // Añadimos un canvas e inicializamos el contextp WebGL compatible con WebXR
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    const gl = canvas.getContext("webgl", {xrCompatible: true});
  
  const scene = new THREE.Scene();
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 15, 10);
  scene.add(directionalLight);
  
  // Seteamos el WebGLRenderer, que maneja el renderizado de la capa base de la sesión.
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    preserveDrawingBuffer: true,
    canvas: canvas,
    context: gl
  });
  renderer.autoClear = false;
  
  // La API actualiza directamente las matrices de la camara.
  // Desactivamos el auto update de las matrices para que three.js no intente
  // manejarlas de forma independiente
  const camera = new THREE.PerspectiveCamera();
  camera.matrixAutoUpdate = false;
  
  // Inizializamos la sesion WebXR usando "immersive-ar".
  const session = await navigator.xr.requestSession("immersive-ar", {requiredFeatures: ['hit-test']});
  
  session.updateRenderState({
    baseLayer: new XRWebGLLayer(session, gl)
  });
  
  // Una referencia 'local' del espacio tiene un origen nativo que esta ubicado
  // cerca de la posicion del viewer en el momento en que se crea la sesion.
  const referenceSpace = await session.requestReferenceSpace('local');
  
  // Crea otra XRReferenceSpace que tiene el viewer como origen.
  const viewerSpace = await session.requestReferenceSpace('viewer');
  // Para el hit testing usando el viewer como origin
  const hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
  
  
  const loader = new GLTFLoader();
  let reticle;
  loader.load("https://immersive-web.github.io/webxr-samples/media/gltf/reticle/reticle.gltf", function(gltf) {
    reticle = gltf.scene;
    reticle.visible = false;
    scene.add(reticle);
  })
  
  let flower;
  loader.load("https://immersive-web.github.io/webxr-samples/media/gltf/sunflower/sunflower.gltf", function(gltf) {
    flower = gltf.scene;
  });
  
  session.addEventListener("select", (event) => {
    if (flower) {
      const clone = flower.clone();
      clone.position.copy(reticle.position);
      scene.add(clone);
    }
  });
  
  // Create a render loop that allows us to draw on the AR view.
  const onXRFrame = (time, frame) => {
    // Queue up the next draw request.
    session.requestAnimationFrame(onXRFrame);
  
    // Bind the graphics framebuffer to the baseLayer's framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, session.renderState.baseLayer.framebuffer)
  
    // Retrieve the pose of the device.
    // XRFrame.getViewerPose can return null while the session attempts to establish tracking.
    const pose = frame.getViewerPose(referenceSpace);
    if (pose) {
      // In mobile AR, we only have one view.
      const view = pose.views[0];
  
      const viewport = session.renderState.baseLayer.getViewport(view);
      renderer.setSize(viewport.width, viewport.height)
  
      // Use the view's transform matrix and projection matrix to configure the THREE.camera.
      camera.matrix.fromArray(view.transform.matrix)
      camera.projectionMatrix.fromArray(view.projectionMatrix);
      camera.updateMatrixWorld(true);
  
      const hitTestResults = frame.getHitTestResults(hitTestSource);
      if (hitTestResults.length > 0 && reticle) {
          const hitPose = hitTestResults[0].getPose(referenceSpace);
          reticle.visible = true;
          reticle.position.set(hitPose.transform.position.x, hitPose.transform.position.y, hitPose.transform.position.z)
          reticle.updateMatrixWorld(true);
      }
  
      // Render the scene with THREE.WebGLRenderer.
      renderer.render(scene, camera)
    }
  }
  session.requestAnimationFrame(onXRFrame);
  
}