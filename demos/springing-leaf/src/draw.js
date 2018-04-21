import vec2 from "gl-vec2";
import Vertex from "./Vertex";
import randomFloat from "random-float";
let two = [
  {
    start: [0, 0.85],
    end: [0.5, 0.15],
    control: [0.5 , 0.75]
  }, {
    start: [1, 0.85],
    end: [0.75, 0.1],
    control: [0.78, 0.78]
  }
]
const vertices = [new Vertex(two[1].start), new Vertex(two[1].end), new Vertex(two[1].control)];
// const start = new Vertex([0.15 - Math.random() % 0.5, 0.85 - Math.random() % 0.5]);
// const end = new Vertex([0.9 - Math.random() % 0.5, 0.15 - Math.random() % 0.5]);
// let control = new Vertex([0.75 - Math.random() % 0.5, 0.75 - Math.random() % 0.5]);
let originleafWidth = 0.05 + randomFloat(-0.01, 0.025);
let colors = ['#00C88A', '#1ECC92', '#3AB795']
// const vertices = [start, end, control];

const mouseRadius = 0.1;
const mouseStrength = 0.0000045;

export function onClick() {
  // Choose a random point near the end of
  // the line that connects start -> end
  const t = randomFloat(0.5, 0.65);
  const point = vec2.lerp([], start, end, t);

  // Offset the point by some random radius
  const radius = randomFloat(0.2, 0.2);
  const offset = vec2.random([], radius);
  vec2.add(point, point, offset);

  // Set the control to this new point
  control = new Vertex(point);
}

const drawPoint = (context, position, radius, alpha = 1) => {
  // context.beginPath();
  // context.globalAlpha = alpha;
  // context.arc(position[0], position[1], radius, 0, Math.PI * 2, false);
  // context.stroke();
};

export function draw({ context, scale, mousePosition, mouseVelocity, start, end, control }) {
  // Draw mouse pointer & radius
  drawPoint(context, mousePosition, mouseRadius, 0.15);

  // Add the mouse influence and update each vertex
  vertices.forEach(v => {
    v.addMouseInfluence(
      mousePosition,
      mouseVelocity,
      mouseRadius,
      mouseStrength
    );
    v.update();
  });

  // Draw the stem formed by the vertices
  const path = drawStem({
    context,
    start: start.position,
    control: control.position,
    end: end.position,
    segments: 20
  });

  drawLeaves(context, path, 0.005);
}

function drawStem(opt = {}) {
  const { context, start, control, end, segments, radius = 0.02, stroke = true } = opt;

  // First, we draw the line that makes up this stem
  let color = colors[2];
  context.beginPath();
  context.strokeStyle = color;
  context.moveTo(start[0], start[1]);
  if (control) {
    context.quadraticCurveTo(control[0], control[1], end[0], end[1]);
  } else {
    context.lineTo(end[0], end[1]);
  }
  if (stroke) {
    context.globalAlpha = 1;
    context.strokeStyle = color;
    context.stroke();
  }

  // Now, draw the points that make up the stem
  if (radius > 0) {
    const points = [start, control, end].filter(Boolean);
    points.forEach((point, i) => {
      const size = (point === control ? 0.5 : 1) * radius;
      drawPoint(context, point, size);
    });

    if (control && stroke) {
      context.beginPath();
      context.moveTo(start[0], start[1]);
      context.lineTo(control[0], control[1]);
      context.lineTo(end[0], end[1]);
      context.globalAlpha = 0.15;
      context.stroke();
    }
  }

  // Now, get a discrete set of points along that curve
  const path = [];
  for (let i = 0; i < segments; i++) {
    const t = i / Math.max(1, segments - 1);
    const point = control
      ? quadraticCurve([], start, control, end, t)
      : vec2.lerp([], start, end, t);
    path.push(point);
  }
  return path;
}

function drawLeaves(context, stemPath, radius = 0.005) {
  // Now for each point in this stem, extrude out a leaf
  for (let i = 1; i < stemPath.length; i++) {
    const t = i / Math.max(stemPath.length - 1, 1);
    const current = stemPath[i];
    const previous = stemPath[i - 1];

    // Get the direction of the current line segment
    const normal = vec2.subtract([], current, previous);
    vec2.normalize(normal, normal);
    // Get its perpendicular
    const perpendicular = [-normal[1], normal[0]];
    // Extrude out in both directions
    const directions = [-1, 1];
    const leafWidth = 0.5;
    const leafShape = Math.sin(t * Math.PI);
    const extrudeDistance = leafShape * leafWidth / 2;
    const leafWidthParams = (-0.005 * Math.abs(stemPath.length / 2 - i));

    directions.forEach(direction => {
      // angle the leaf outward
      const leafDirection = vec2.copy([], perpendicular);
      const angle = Math.atan2(leafDirection[1], leafDirection[0]);
      const newAngle = angle + 45 * Math.PI / 180 * -direction;
      vec2.set(leafDirection, Math.cos(newAngle), Math.sin(newAngle));

      // Create our new leaf stem, without a quadratic control point
      const leafEnd = vec2.scaleAndAdd(
        [],
        current,
        leafDirection,
        direction * extrudeDistance
      );
      let leafPath = drawStem({ context, start: current, end: leafEnd, radius, segments: 10 });
      // if not the stem's end point, render leafpatten
      if (i !== stemPath.length - 1) {
        drawLeafPatten({context, start: current, end: leafEnd, leafPath: leafPath, radius: 0.0025, leafWidthParams: leafWidthParams});
      }
      drawStem({ context, start: current, end: leafEnd, radius, segments: 10 });
    });
  }
}

function drawLeafPatten (opt = {}) {
  const { context, start, end, leafPath, radius, leafWidthParams } = opt;
  // extend leaf patten
  for (let i = 1; i < leafPath.length; i++) {
    const t = i / Math.max(leafPath.length - 1, 1);
    const current = leafPath[i];
    const previous = leafPath[i - 1];

    // Get the direction of the current line segment
    const normal = vec2.subtract([], current, previous);
    vec2.normalize(normal, normal);
    // Get its perpendicular
    const perpendicular = [-normal[1], normal[0]];
    // Extrude out in both directions
    const directions = [-1, 1];
    const leafWidth = originleafWidth + leafWidthParams;
    const leafShape = Math.sin(t * Math.PI);
    const extrudeDistance = leafShape * leafWidth / 2;
    directions.forEach(direction => {
      // angle the leaf outward
      const leafDirection = vec2.copy([], perpendicular);
      const angle = Math.atan2(leafDirection[1], leafDirection[0]);
      const newAngle = angle + 45 * Math.PI / 180 * -direction;
      vec2.set(leafDirection, Math.cos(newAngle), Math.sin(newAngle));

      // Create our new leaf stem, without a quadratic control point
      const leafEnd = vec2.scaleAndAdd(
        [],
        current,
        leafDirection,
        direction * extrudeDistance
      );
      if (i === 1) {
        const leafborderEnd = vec2.scaleAndAdd(
          [],
          leafPath[5],
          leafDirection,
          direction * extrudeDistance * 6
        );
        context.lineWidth = 0.001;
        context.beginPath();
        context.fillStyle = "#A3E09D";
        context.strokeStyle = "transparent";
        context.moveTo(leafPath[0][0], leafPath[0][1]);
        context.quadraticCurveTo(leafborderEnd[0], leafborderEnd[1], leafPath[leafPath.length-1][0], leafPath[leafPath.length-1][1]);
        context.fill();
        context.stroke();
      }
      drawStem({ context, start: current, end: leafEnd, radius });
    });
  }
}
// Discretize a quadratic curve, approximating the point at arclen "t"
function quadraticCurve(output = [], start, control, end, t) {
  const x1 = start[0];
  const y1 = start[1];
  const x2 = control[0];
  const y2 = control[1];
  const x3 = end[0];
  const y3 = end[1];

  const dt = 1 - t;
  const dtSq = dt * dt;
  const tSq = t * t;
  output[0] = dtSq * x1 + 2 * dt * t * x2 + tSq * x3;
  output[1] = dtSq * y1 + 2 * dt * t * y2 + tSq * y3;
  return output;
}

function leafQuadraticCurveTo() {

}
