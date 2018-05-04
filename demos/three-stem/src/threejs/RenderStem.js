import * as THREE from 'three';

export default canvas => {
  const screenDimensions = {
      width: 256, // canvas.width,
      height: 256 // canvas.height
  }

  const scene = buildScene();
  const renderer = buildRender(screenDimensions);
  const camera = buildCamera(screenDimensions);

  const mesh = createMesh();
  scene.add(mesh);

  function buildScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#000");

    return scene;
  }

  function buildRender({ width, height }) {
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);

    return renderer;
  }

  function buildCamera({ width, height }) {
    return new THREE.OrthographicCamera();
  }

  function update() {
    renderer.setSize(screenDimensions.width, screenDimensions.height);
    camera.left = -1;
    camera.right = 1;
    camera.top = -1;
    camera.bottom = 1;
    camera.near = -100;
    camera.far = 100;
    camera.updateProjectionMatrix();
    let time = 123455 / 1000;
    mesh.material.uniforms.thickness.value = thickness(time);
    mesh.material.uniforms.control.value.fromArray(control(time));
    renderer.render(scene, camera);
  }
  function onWindowResize() {
    //...
  }
  return {
    update,
    onWindowResize
  }
}

function control (time) {
  const angle = time * 0.5 + Math.PI * 2;
  const radius = (Math.sin(time) * 0.5 + 0.5) * 2.0;
  return [ Math.cos(angle) * radius, Math.sin(angle) * radius ];
}

function thickness (time) {
  return (Math.sin(time) * 0.5 + 0.5) * 0.1 + 0.01
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

function createMesh () {
  const subdivisions = 64;
  const geometry = new THREE.PlaneGeometry(2, 2, subdivisions, 1);
  const shader = new THREE.ShaderMaterial({
    vertexShader: `
      uniform float subdivisions;
      uniform float thickness;
      uniform vec2 start;
      uniform vec2 end;
      uniform vec2 control;
      varying vec2 vCoord;

      #define PI 3.14

      vec3 sample (float t) {
        // We can also adjust the per-vertex curve thickness by modifying this 0..1 number
        float volume = 1.0;

        // Try replacing the above with:
        // float volume = 1.0 * sin(t * PI);

        // Solve the quadratic curve with the start, control and end points:
        float dt = (1.0 - t);
        float dtSq = dt * dt;
        float tSq = t * t;
        float x = dtSq * start.x + 2.0 * dt * t * control.x + tSq * end.x;
        float y = dtSq * start.y + 2.0 * dt * t * control.y + tSq * end.y;
        return vec3(x, y, volume);

        // Alternatively, you can replace the above with a linear mix() operation
        // This will produce a straight line between the start and end points
        // return vec3(mix(start, end, t), volume);
      }

      void main () {
        // Get the "arc length" in 0..1 space
        float arclen = (position.x * 0.5 + 0.5);

        // How far to offset the line thickness for this vertex in -1..1 space
        float extrusion = position.y;

        // Find next sample along curve
        float nextArclen = arclen + (1.0 / subdivisions);

        // Sample the curve in two places
        // XY is the 2D position, and the Z component is the thickness at that vertex
        vec3 current = sample(arclen);
        vec3 next = sample(nextArclen);

        // Now find the 2D perpendicular to form our line segment
        vec2 direction = normalize(next.xy - current.xy);
        vec2 perpendicular = vec2(-direction.y, direction.x);

        // Extrude
        float computedExtrusion = extrusion * (thickness / 2.0) * current.z;
        vec3 offset = current.xyz + vec3(perpendicular.xy, 0.0) * computedExtrusion;

        // Compute final position
        gl_Position = projectionMatrix * modelViewMatrix * vec4(offset.xyz, 1.0);

        // Pass along the coordinates for texturing/effects
        vCoord = position.xy;
      }
      `,
    fragmentShader: `
      varying vec2 vCoord;

      float aastep (float threshold, float value) {
        float afwidth = fwidth(value) * 0.5;
        return smoothstep(threshold - afwidth, threshold + afwidth, value);
      }

      void main () {
        // How many dashes to show
        float repeat = 1.0;

        // How big is the gap between each dash
        float gapSize = 0.25;

        // Create a dashed line
        float dash = abs(fract(vCoord.x * repeat) - 0.5);

        // Smooth the dashed line to sharp/crisp anti-aliasing
        dash = 1.0; // - aastep(gapSize, dash);

        gl_FragColor = vec4(vec3(dash), 1.0);
      }
      `,
    uniforms: uniforms(subdivisions),
    side: THREE.BackSide,
    extensions: { derivatives: true }
  });
  const mesh = new THREE.Mesh(geometry, shader);
  return mesh;
}
