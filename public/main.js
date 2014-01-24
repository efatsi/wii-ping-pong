(function() {

  var SPEED_MULTIPLIER = 20;

  function Light() {
    var light = new THREE.PointLight(0xffffff);
    light.position.set(0, 0, 50);
    return light;
  }

  function Cube() {
    var geometry = new THREE.CubeGeometry(1, 1, 1);
    var material = new THREE.MeshLambertMaterial({ color: 0x0099ff });
    return new THREE.Mesh(geometry, material);
  }

  function App() {
    // setup renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColorHex(0xffffff, 1);

    // setup camera
    this.camera = new THREE.PerspectiveCamera();
    this.camera.position.z = 10;

    // setup controller tracking
    this.controller = {x: 0, y: 0, z: 0, c: 0};

    // setup clock
    this.clock = new THREE.Clock();

    // setup scene
    this.scene = new THREE.Scene();
    this.scene.add(this.camera);

    // add cube
    this.cube = new Cube();
    this.cube.rotation.x = 45 * (Math.PI / 180);
    this.cube.rotation.y = 45 * (Math.PI / 180);
    this.scene.add(this.cube);

    // add light
    var light = new Light();
    this.scene.add(light);

    // attach to DOM
    document.querySelector('#canvas').appendChild(this.renderer.domElement);

    // begin render loop
    this.render();
  }

  App.prototype.update = function(delta) {
    this.cube.position.x += this.controller.x * delta;
    this.cube.position.y += this.controller.y * delta;
    this.cube.position.z += (this.controller.c - this.controller.z) * delta;
  };

  App.prototype.render = function() {
    var _this = this;

    // calculate time change since last render
    var delta = this.clock.getDelta();

    // update
    this.update(delta * SPEED_MULTIPLIER);

    // update attributes particular to example module
    this.cube.rotation.y += 1 * (Math.PI / 180);

    // render updated changes to the canvas
    this.renderer.render(this.scene, this.camera);

    // queue next render iteration
    requestAnimationFrame(function() {
      _this.render();
    });
  };


  // initialize
  $(document).ready(function() {
    window.app = new App();

    var socket = io.connect('http://localhost');

    // error/quit if there are already 2 players
    socket.on('maxplayers', function() {
      alert('Only 2 players can connect at once...');
    });

    socket.on('playerid', function(data) {

      socket.on('player'+data.id, function(data) {
        app.controller = JSON.parse(data);
      });

      $('h1').text('Player '+data.id);

    });
  });

})();
