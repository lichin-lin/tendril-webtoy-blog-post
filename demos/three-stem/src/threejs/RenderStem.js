import * as THREE from 'three';

export default canvas => {
  let width = 256;
  let height = 256;
  console.log('stem')
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera();
  const mesh = createMesh();
  scene.add(mesh);

  function thickness (time) {
    return (Math.sin(time) * 0.5 + 0.5) * 0.1 + 0.01
  }

  function control (time) {
    // Offset the control point a bit to demonstrate the curve
    const angle = time * 0.5 + Math.PI * 2;
    const radius = (Math.sin(time) * 0.5 + 0.5) * 2.0;
    return [ Math.cos(angle) * radius, Math.sin(angle) * radius ];
  }

  function createMesh () {
    const subdivisions = 64;
    const geometry = new THREE.PlaneGeometry(2, 2, subdivisions, 1);
    const shader = new THREE.ShaderMaterial({
      // vertexShader: vertex(),
      // fragmentShader: fragment(),
      uniforms: uniforms(subdivisions),
      side: THREE.BackSide,
      extensions: { derivatives: true }
    });
    const mesh = new THREE.Mesh(geometry, shader);
    return mesh;
  }

  function uniforms (subdivisions) {
    return {
      subdivisions: { value: subdivisions },
      start: { value: new THREE.Vector2(-0.75, -0.75) },
      end: { value: new THREE.Vector2(0.75, 0.75) },
      control: { value: new THREE.Vector2() },
      thickness: { value: 0.025 }
    }
  }

  function render () {
    let time = Date.now() / 1000;
    mesh.material.uniforms.thickness.value = thickness(time);
    mesh.material.uniforms.control.value.fromArray(control(time));
    renderer.render(scene, camera);
  }

  function resize () {
    renderer.setSize(width, height);
    camera.left = -1;
    camera.right = 1;
    camera.top = -1;
    camera.bottom = 1;
    camera.near = -100;
    camera.far = 100;
    camera.updateProjectionMatrix();
  }

  resize();
  renderer.animate(render);
  return renderer.domElement;
}
