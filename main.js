function intRBGtoFloat(int) {
  float = 1.0/255*int
  return float
}

window.chairOffset = 0.0;
window.chairLastPosition = "in";

var modelMatrix = new Matrix4(); // The model matrix
var viewMatrix = new Matrix4();  // The view matrix
var projMatrix = new Matrix4();  // The projection matrix
var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

var ANGLE_STEP = 3.0;  // The increments of rotation angle (degrees)
// var g_xAngle = 0.0;    // The rotation x angle (degrees)
// var g_yAngle = 0.0;    // The rotation y angle (degrees)
var g_xAngle = 10.0;    // The rotation x angle (degrees)
var g_yAngle = -40.0;    // The rotation y angle (degrees)

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  var VSHADER_SOURCE = document.getElementById("vertex_chair").text
  var FSHADER_SOURCE = document.getElementById("fragment_chair").text

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Set clear color and enable hidden surface removal
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Get the storage locations of uniform attributes
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');

  // Trigger using lighting or not
  var u_isLighting = gl.getUniformLocation(gl.program, 'u_isLighting'); 

  if (!u_ModelMatrix || !u_ViewMatrix || !u_NormalMatrix ||
      !u_ProjMatrix || !u_LightColor || !u_LightDirection ||
      !u_isLighting ) { 
    console.log(
      'Failed to Get the storage locations of u_ModelMatrix, u_ViewMatrix, and/or u_ProjMatrix');
    return;
  }

  // Set the light color (white)
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  // Set the light direction (in the world coordinate)
  var lightDirection = new Vector3([0.5, 3.0, 4.0]);
  lightDirection.normalize();     // Normalize
  gl.uniform3fv(u_LightDirection, lightDirection.elements);

  // Calculate the view matrix and the projection matrix
    // Matrix4.setLookAt(eyeX, eyeY, eyeZ, atX, atY, atZ, upX, upY, upZ)
    //  (position of camera, position along the direction looking at, up axis)
  viewMatrix.setLookAt(0, 0, 50, 0, 0, -100, 0, 1, 0);
    // Matrix4.setPerspective(fov, aspect, near, far)
    //  Field of View (fov): Angle of view, formed by top and bottom planes
    //  Aspect:     Specifies the aspect ratio of the near plane (width/height)
    //  Near, Far:  Specifies the distances to the near and far clipping
    //              planes along the line of sight (>0)
    //                      40
  projMatrix.setPerspective(40, canvas.width/canvas.height, 1, 100);
  // Pass the model, view, and projection matrix to the uniform variable respectively
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);


  document.onkeydown = function(ev){
    keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
  };

  setInterval(function(){
    draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
  }, 1000)
  
}

function keydown(ev, gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {
  switch (ev.keyCode) {
    case 40: // Up arrow key -> the positive rotation of arm1 around the y-axis
      g_xAngle = (g_xAngle + ANGLE_STEP) % 360;
      draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
      break;
    case 38: // Down arrow key -> the negative rotation of arm1 around the y-axis
      g_xAngle = (g_xAngle - ANGLE_STEP) % 360;
      draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
      break;
    case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
      g_yAngle = (g_yAngle + ANGLE_STEP) % 360;
      draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
      break;
    case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
      g_yAngle = (g_yAngle - ANGLE_STEP) % 360;
      draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
      break;
    case 83: // s key
      start = null;
      window.requestAnimationFrame(function aStep(timestamp){
        if (!start) start = timestamp;
        var progress = timestamp - start;
        console.log(progress)
        if (window.chairLastPosition == "in") {
          window.chairOffset = Math.min((progress/1000)*2.0, 2.0);
        } else {
          window.chairOffset = Math.max(2.0-(progress/1000)*2.0, 0.0);
        }
        draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting);
        if (progress < 1000) {
          window.requestAnimationFrame(aStep);
        } else {
          if (window.chairLastPosition == "in") {
            window.chairLastPosition = "out";
          } else {
            window.chairLastPosition = "in";
          }
        }
      })
      
      break;
    default: return; // Skip drawing at no effective action
  }

}


function initVertexBuffers(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([   // Coordinates
     0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, // v0-v1-v2-v3 front
     0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5, // v0-v3-v4-v5 right
     0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
    -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
     0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  // v4-v7-v6-v5 back
  ]);


  var colors = new Float32Array([    // Colors
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v1-v2-v3 front
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v3-v4-v5 right
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v5-v6-v1 up
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v1-v6-v7-v2 left
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v7-v4-v3-v2 down
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0　    // v4-v7-v6-v5 back
 ]);


  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);


  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initVertexBuffersCustomColour(gl, r, g, b) {
  // Convert int to float RBG
  r = intRBGtoFloat(r)
  g = intRBGtoFloat(g)
  b = intRBGtoFloat(b)

  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([   // Coordinates
     0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, // v0-v1-v2-v3 front
     0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5, // v0-v3-v4-v5 right
     0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
    -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
     0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  // v4-v7-v6-v5 back
  ]);


  var colors = new Float32Array([    // Colors
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v0-v1-v2-v3 front
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v0-v3-v4-v5 right
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v0-v5-v6-v1 up
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v1-v6-v7-v2 left
    r, g, b,   r, g, b,   r, g, b,  r, g, b,     // v7-v4-v3-v2 down
    r, g, b,   r, g, b,   r, g, b,  r, g, b　    // v4-v7-v6-v5 back
 ]);


  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);


  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer (gl, attribute, data, num, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return true;
}

function initAxesVertexBuffers(gl) {

  var verticesColors = new Float32Array([
    // Vertex coordinates and color (for axes)
    -20.0,  0.0,   0.0,  1.0,  1.0,  1.0,  // (x,y,z), (r,g,b) 
     20.0,  0.0,   0.0,  1.0,  1.0,  1.0,
     0.0,  20.0,   0.0,  1.0,  1.0,  1.0, 
     0.0, -20.0,   0.0,  1.0,  1.0,  1.0,
     0.0,   0.0, -20.0,  1.0,  1.0,  1.0, 
     0.0,   0.0,  20.0,  1.0,  1.0,  1.0 
  ]);
  var n = 6;

  // Create a buffer object
  var vertexColorBuffer = gl.createBuffer();  
  if (!vertexColorBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  //Get the storage location of a_Position, assign and enable buffer
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
  gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

  // Get the storage location of a_Position, assign buffer and enable
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
  gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return n;
}

var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
  return g_matrixStack.pop();
}

function draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting) {

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniform1i(u_isLighting, false); // Will not apply lighting

  // Set the vertex coordinates and color (for the x, y axes)

  var n = initAxesVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Calculate the view matrix and the projection matrix
  modelMatrix.setTranslate(0, 0, 0);  // No Translation
  // Pass the model matrix to the uniform variable
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  // Draw x and y axes
  gl.drawArrays(gl.LINES, 0, n);

  gl.uniform1i(u_isLighting, true); // Will apply lighting

  // Rotate, and then translate
  modelMatrix.setTranslate(0, 0, 0);  // Translation (No translation is supported here)
  modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis

  // CLASSROOM
  drawClassroom(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [0,0,0])

  // TABLES AND CHAIRS
  drawTable(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [-13.5,-7.25,-2.75])
    drawChair(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [-15.0,-8.0,window.chairOffset+-0.25])
    drawChair(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [-12.0,-8.0,window.chairOffset+-0.25])

  drawTable(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [-13.5,-7.25,6.75])
    drawChair(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [-15.0,-8.0,window.chairOffset+9.0])
    drawChair(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [-12.0,-8.0,window.chairOffset+9.0])

  drawTable(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [-4.5,-7.25,-2.75])
    drawChair(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [-6.0,-8.0,window.chairOffset+-0.25])
    drawChair(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [-3.0,-8.0,window.chairOffset+-0.25])

  drawTable(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [-4.5,-7.25,6.75])
    drawChair(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [-6.0,-8.0,window.chairOffset+9.0])
    drawChair(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [-3.0,-8.0,window.chairOffset+9.0])

  drawTable(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [4.5,-7.25,-2.75])
    drawChair(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [6.0,-8.0,window.chairOffset+-0.25])
    drawChair(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [3.0,-8.0,window.chairOffset+-0.25])

  drawTable(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [4.5,-7.25,6.75])
    drawChair(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [6.0,-8.0,window.chairOffset+9.0])
    drawChair(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [3.0,-8.0,window.chairOffset+9.0])

  drawTable(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [13.5,-7.25,-2.75])
    drawChair(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [15.0,-8.0,window.chairOffset+-0.25])
    drawChair(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [12.0,-8.0,window.chairOffset+-0.25])

  drawTable(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [13.5,-7.25,6.75])
    drawChair(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [15.0,-8.0,window.chairOffset+9.0])
    drawChair(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [12.0,-8.0,window.chairOffset+9.0])

  // WHITEBOARD
  drawWhiteboard(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [-5.0,-2.0,-12.25])

  // WINDOWS
  drawWindow(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [-19.9,0,6])
  drawWindow(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [-19.9,0,-6])

  // DOOR
  drawDoor(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [13.5,-5.0,-12.25])

  // CLOCK
  drawClock(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, [7.5,0.0,-12.25]) // [8,-5.0,-12.25]
}

function drawClassroom(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, centrePoint) {
  // Set the vertex coordinates and color (for the cube)
  var n = initVertexBuffersCustomColour(gl, 112, 128, 144);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Model the chair seat
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0], centrePoint[1]-10, centrePoint[2])
    modelMatrix.scale(40.0, 0.1, 25.0); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the back wall
  pushMatrix(modelMatrix);
    modelMatrix.translate(centrePoint[0]+0.0, centrePoint[1]-2.5, centrePoint[2]-12.45);  // Translation
    modelMatrix.scale(40.0, 15.0, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the left wall
  pushMatrix(modelMatrix);
    modelMatrix.translate(centrePoint[0]-19.95, centrePoint[1]-2.5, centrePoint[2]-0.0);  // Translation
    modelMatrix.scale(0.1, 15.0, 25.0); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  
}

function drawChair(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, centrePoint) {
  // Set the vertex coordinates and color (for the cube)
  var n = initVertexBuffersCustomColour(gl, 205, 133, 63);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Model the chair seat
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0], centrePoint[1], centrePoint[2])
    modelMatrix.scale(2.0, 0.5, 2.0); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the chair back
  pushMatrix(modelMatrix);
    modelMatrix.translate(centrePoint[0], centrePoint[1]+1.25, centrePoint[2]+0.75);  // Translation
    modelMatrix.scale(2.0, 2.0, 0.5); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the chair front right leg
  pushMatrix(modelMatrix);
    modelMatrix.translate(centrePoint[0]+0.75, centrePoint[1]-0.75, centrePoint[2]-0.75);  // Translation
    modelMatrix.scale(0.5, 2.0, 0.5); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the chair front left leg
  pushMatrix(modelMatrix);
    modelMatrix.translate(centrePoint[0]-0.75, centrePoint[1]-0.75, centrePoint[2]-0.75);  // Translation
    modelMatrix.scale(0.5, 2.0, 0.5); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the chair back right leg
  pushMatrix(modelMatrix);
    modelMatrix.translate(centrePoint[0]+0.75, centrePoint[1]-0.75, centrePoint[2]+0.75);  // Translation
    modelMatrix.scale(0.5, 2.0, 0.5); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the chair back left leg
  pushMatrix(modelMatrix);
    modelMatrix.translate(centrePoint[0]-0.75, centrePoint[1]-0.75, centrePoint[2]+0.75);  // Translation
    modelMatrix.scale(0.5, 2.0, 0.5); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}

function drawTable(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, centrePoint) {
  // Set the vertex coordinates and color (for the cube)
  var n = initVertexBuffersCustomColour(gl, 244, 164, 96);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Model the table top
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0], centrePoint[1], centrePoint[2])
    modelMatrix.scale(6.0, 0.5, 3.5); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the back right leg
  pushMatrix(modelMatrix);
    modelMatrix.translate(centrePoint[0]+2.75, centrePoint[1]-1.25, centrePoint[2]-1.5);  // Translation
    modelMatrix.scale(0.5, 2.75, 0.5); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the back left leg
  pushMatrix(modelMatrix);
    modelMatrix.translate(centrePoint[0]-2.75, centrePoint[1]-1.25, centrePoint[2]-1.5);  // Translation
    modelMatrix.scale(0.5, 2.75, 0.5); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the front right leg
  pushMatrix(modelMatrix);
    modelMatrix.translate(centrePoint[0]+2.75, centrePoint[1]-1.25, centrePoint[2]+1.5);  // Translation
    modelMatrix.scale(0.5, 2.75, 0.5); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the front left leg
  pushMatrix(modelMatrix);
    modelMatrix.translate(centrePoint[0]-2.75, centrePoint[1]-1.25, centrePoint[2]+1.5);  // Translation
    modelMatrix.scale(0.5, 2.75, 0.5); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}

function drawWhiteboard(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, centrePoint) {
  // Set the vertex coordinates and color (for the cube)
  var n = initVertexBuffersCustomColour(gl, 0, 0, 0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Model the black back
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0], centrePoint[1], centrePoint[2])
    modelMatrix.scale(11.0, 6.5, 0.25); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the left speaker back
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0]-6.5, centrePoint[1]+0.3, centrePoint[2]+0.375)
    modelMatrix.scale(1.1, 5.0, 0.75); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the right speaker back
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0]+6.5, centrePoint[1]+0.3, centrePoint[2]+0.375)
    modelMatrix.scale(1.1, 5.0, 0.75); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the holder frame
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0], centrePoint[1]-3.6, centrePoint[2]+0.5)
    modelMatrix.scale(8, 0.7, 1.0); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Set the vertex coordinates and color (for the cube)
  var n = initVertexBuffersCustomColour(gl, 255, 255, 255);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Model the white screen
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0], centrePoint[1], centrePoint[2]+0.15)
    modelMatrix.scale(10.6, 6.1, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the white pen frame
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0], centrePoint[1]-3.0, centrePoint[2]+0.6)
    modelMatrix.scale(1.5, 0.1, 0.6); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Set the vertex coordinates and color (for the cube)
  var n = initVertexBuffersCustomColour(gl, 255, 0, 0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Model the red pen frame
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0]-2.5, centrePoint[1]-3.0, centrePoint[2]+0.6)
    modelMatrix.scale(1.5, 0.1, 0.6); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Set the vertex coordinates and color (for the cube)
  var n = initVertexBuffersCustomColour(gl, 0, 255, 0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Model the green pen frame
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0]+2.5, centrePoint[1]-3.0, centrePoint[2]+0.6)
    modelMatrix.scale(1.5, 0.1, 0.6); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();


  // Set the vertex coordinates and color (for the cube)
  var n = initVertexBuffersCustomColour(gl, 169, 169, 169);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Model the left speaker front
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0]-6.5, centrePoint[1]+0.95, centrePoint[2]+0.8)
    modelMatrix.scale(0.7, 3.0, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the right speaker front
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0]+6.5, centrePoint[1]+0.95, centrePoint[2]+0.8)
    modelMatrix.scale(0.7, 3.0, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

   // Model the left speaker bottom
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0]-6.5, centrePoint[1]-1.5, centrePoint[2]+0.8)
    modelMatrix.scale(0.7, 0.7, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the right speaker bottom
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0]+6.5, centrePoint[1]-1.5, centrePoint[2]+0.8)
    modelMatrix.scale(0.7, 0.7, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}

function drawWindow(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, centrePoint) {
  // Set the vertex coordinates and color (for the cube)
  var n = initVertexBuffersCustomColour(gl, 255, 255, 255);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Model the table top
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0], centrePoint[1], centrePoint[2])
    modelMatrix.scale(0.1, 4.0, 5.5); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Set the vertex coordinates and color (for the cube)
  var n = initVertexBuffersCustomColour(gl, 0, 0, 0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Model the horizontal middle
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0]+0.1, centrePoint[1], centrePoint[2])
    modelMatrix.scale(0.2, 0.2, 5.5); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the horizontal top
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0]+0.1, centrePoint[1]+2.1, centrePoint[2])
    modelMatrix.scale(0.2, 0.2, 5.5); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the vertical middle
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0]+0.1, centrePoint[1], centrePoint[2])
    modelMatrix.scale(0.2, 4.0, 0.2); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the vertical right
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0]+0.1, centrePoint[1], centrePoint[2]-2.85)
    modelMatrix.scale(0.2, 4.4, 0.2); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the vertical left
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0]+0.1, centrePoint[1], centrePoint[2]+2.85)
    modelMatrix.scale(0.2, 4.4, 0.2); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the window sill
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0]+0.30, centrePoint[1]-2.125, centrePoint[2])
    modelMatrix.scale(0.75, 0.4, 5.7); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}

function drawDoor(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, centrePoint) {
  // Set the vertex coordinates and color (for the cube)
  var n = initVertexBuffersCustomColour(gl, 129, 69, 19);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Model the table top
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0], centrePoint[1], centrePoint[2])
    modelMatrix.scale(4.5, 10.0, 0.25); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Set the vertex coordinates and color (for the cube)
  var n = initVertexBuffersCustomColour(gl, 169, 169, 169);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Model the table top
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0]+1, centrePoint[1], centrePoint[2]+0.15)
    modelMatrix.scale(1.25, 1.0, 0.15); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Set the vertex coordinates and color (for the cube)
  var n = initVertexBuffersCustomColour(gl, 0, 0, 0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Model the table top
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0]+1, centrePoint[1], centrePoint[2]+0.25)
    modelMatrix.scale(0.3, 0.3, 0.15); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();
}

function drawClock(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, centrePoint) {
  // Set the vertex coordinates and color (for the cube)
  var n = initVertexBuffersCustomColour(gl, 255, 255, 255);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Model the white back
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0], centrePoint[1], centrePoint[2])
    modelMatrix.scale(2.5, 2.5, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Set the vertex coordinates and color (for the cube)
  var n = initVertexBuffersCustomColour(gl, 0, 0, 0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Model the frame left
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0]-1.35, centrePoint[1], centrePoint[2])
    modelMatrix.scale(0.2, 2.5, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the frame right
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0]+1.35, centrePoint[1], centrePoint[2])
    modelMatrix.scale(0.2, 2.5, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the frame top
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0], centrePoint[1]+1.35, centrePoint[2])
    modelMatrix.scale(2.9, 0.2, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the frame top
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0], centrePoint[1]-1.35, centrePoint[2])
    modelMatrix.scale(2.9, 0.2, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();



  // Work out the time
  function toAngle(x, p) { return (x%p) / (p/360); }
  var now = new Date();

  // Model the hours hand
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0], centrePoint[1], centrePoint[2]+0.1)
  modelMatrix.rotate(-toAngle(now.getHours(), 12), 0, 0, 1.0)
  modelMatrix.translate(0, 0.35, 0)
    modelMatrix.scale(0.05, 0.7, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Model the minutes hand
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0], centrePoint[1], centrePoint[2]+0.1)
  modelMatrix.rotate(-toAngle(now.getMinutes(), 60), 0, 0, 1.0)
  modelMatrix.translate(0, 0.5, 0)
    modelMatrix.scale(0.05, 1.0, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

  // Set the vertex coordinates and color (for the cube)
  var n = initVertexBuffersCustomColour(gl, 240, 0, 0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Model the seconds hand
  pushMatrix(modelMatrix);
  modelMatrix.translate(centrePoint[0], centrePoint[1], centrePoint[2]+0.1)
  modelMatrix.rotate(-toAngle(now.getSeconds(), 60), 0, 0, 1.0)
  modelMatrix.translate(0, 0.625, 0)
    modelMatrix.scale(0.05, 1.25, 0.1); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
  modelMatrix = popMatrix();

}

function drawbox(gl, u_ModelMatrix, u_NormalMatrix, n) {
  pushMatrix(modelMatrix);

    // Pass the model matrix to the uniform variable
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix.setInverseOf(modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

    // Draw the cube
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

  modelMatrix = popMatrix();
}
