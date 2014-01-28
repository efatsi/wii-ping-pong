(function() {

  var WIDTH = window.innerWidth;
  var HEIGHT = window.innerHeight;

  var CALCULATED_FPS = 80;

  var CAMERA = {
    VIEW_ANGLE: 80,
    ASPECT: 1,
    NEAR: 0.1,
    FAR: 10000
  };

  var DEFAULT_LIGHT = {
    COLOR: 0xffffff,
    Y: 0,
    Z: 100,
    INTENSITY: 0.8
  };

  var DEFAULT_BALL_STATE = {
    dirX: 1,
    dirY: 1,
    speed: 4,
    color: 0xffffff
  };

  var DIFFICULTY = 10;
  var QUALITY = 1;

  var BOARD = {
    WIDTH: window.innerWidth * (2 / 3),
    HEIGHT: window.innerWidth * (1 / 3),
    COLOR: 0xffffff
  };

  var BALL = {
    RADIUS: BOARD.HEIGHT * 0.03,
    SEGMENTS: 6,
    RINGS: 10
  };

  var PADDLE = {
    WIDTH: BOARD.WIDTH * 0.01,
    HEIGHT: BOARD.HEIGHT * 0.2,
    DEPTH: BOARD.WIDTH * 0.02,
    COLOR: 0xffffff
  };

  function Sphere() {

    var material = new THREE.MeshLambertMaterial({
      color: 0xffffff
    });

    var sphere = new THREE.Mesh(
        new THREE.SphereGeometry(BALL.RADIUS, BALL.SEGMENTS, BALL.RINGS),
        material
      );

    sphere.position.z = BALL.RADIUS;

    return sphere;
  }

  function Light(opts) {

    var light = new THREE.PointLight(DEFAULT_LIGHT.COLOR);

    light.position.x = opts.x;
    light.position.y = DEFAULT_LIGHT.Y;
    light.position.z = DEFAULT_LIGHT.Z;
    light.intensity = DEFAULT_LIGHT.INTENSITY;

    return light;
  }

  function SpotLight() {

    var light = new THREE.SpotLight(0x0099ff);

    light.position.x = 0;
    light.position.y = 0;
    light.position.z = 100;
    light.intensity = 2;

    light.castShadow = true;

    return light;
  }

  function ParticleSystem(particles) {

    var particle
      , bound = BOARD.WIDTH
      , offset = - (BOARD.WIDTH / 2)
      , colors = [];

    for (var i = 0; i < 100; i++) {
      particle = new THREE.Vector3(Math.random() * bound + offset, Math.random() * bound + offset, Math.random() * HEIGHT);
      particles.vertices.push(particle);

      colors[i] = new THREE.Color(0xffffff);
      colors[i].setHSL( Math.random() * 0.25 + 0.2, Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5 );
    }

    particles.colors = colors;

    var material = new THREE.ParticleBasicMaterial({
      color: 0xeeeeee,
      map: THREE.ImageUtils.loadTexture('/images/particles/ball.png'),
      vertexColors: true,
      transparent: true,
      size: 15
    });

    var system = new THREE.ParticleSystem(particles, material);
    system.sortParticles = true;

    return system;
  }

  function SkyPlane() {

    var material = new THREE.MeshBasicMaterial({
      map: new THREE.ImageUtils.loadTexture('/images/backgrounds/hyrule.jpg')
    });

    var plane = new THREE.Mesh(
        new THREE.PlaneGeometry(WIDTH * 2, WIDTH * 1.6, QUALITY, QUALITY),
        material
      );

    plane.position.x = BOARD.WIDTH/2;
    plane.position.z = BOARD.WIDTH/2;
    plane.rotation.z = -90 * Math.PI/180;
    plane.rotation.y = -90 * Math.PI/180;

    return plane;
  }

  function Board() {

    var material = new THREE.MeshBasicMaterial({
      map: new THREE.ImageUtils.loadTexture('/images/boards/zelda.png'),
      transparent: true,
      opacity: 0.9
    });

    var plane = new THREE.Mesh(
        new THREE.PlaneGeometry(BOARD.WIDTH * 0.95, BOARD.HEIGHT, QUALITY, QUALITY),
        material
      );

    plane.receiveShadow = true;

    return plane;
  }

  function Paddle(opts) {

    var material = new THREE.MeshLambertMaterial({
      color: PADDLE.COLOR,
      transparent: true,
      opacity: 0.5
    });

    var cube = new THREE.Mesh(new THREE.CubeGeometry(
          PADDLE.WIDTH, PADDLE.HEIGHT, PADDLE.DEPTH, QUALITY, QUALITY, QUALITY
        ), material);

    cube.position.x = opts.x;
    cube.position.z = PADDLE.DEPTH;

    return cube;
  }

  function Game() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(WIDTH, HEIGHT);

    this.clock = new THREE.Clock;

    this.canvas = document.getElementById('canvas');
    this.canvas.appendChild(this.renderer.domElement);

    // setup controller tracking
    this.player = {y: 0};
    this.opponent = {y: 0};

    this.scene = new THREE.Scene();

    this.state = {
      status: 'running',
      ball: DEFAULT_BALL_STATE,
      particles: new THREE.Geometry(),
      scores: [0, 0]
    };

    this.state.particles.dynamic = true;

    this.camera = new THREE.PerspectiveCamera(CAMERA.VIEW_ANGLE, CAMERA.ASPECT, CAMERA.NEAR, CAMERA.FAR);

    this.objects = {
      ball: new Sphere(),
      light1: new Light({ x: -BOARD.WIDTH/2 }),
      light2: new Light({ x: BOARD.WIDTH/2 }),
      board: new Board(),
      player: new Paddle({ id: 1, x: -BOARD.WIDTH/2 + PADDLE.WIDTH }),
      opponent: new Paddle({ id: 2, x: BOARD.WIDTH/2 - PADDLE.WIDTH }),
      particleSystem: new ParticleSystem(this.state.particles),
      skyPlane: new SkyPlane()
    };

    this.scene.add(this.objects.camera);
    this.scene.add(this.objects.ball);
    this.scene.add(this.objects.light1);
    this.scene.add(this.objects.light2);
    this.scene.add(this.objects.board);
    this.scene.add(this.objects.player);
    this.scene.add(this.objects.opponent);
    this.scene.add(this.objects.particleSystem);
    this.scene.add(this.objects.skyPlane);

    this.camera.position.z = BOARD.HEIGHT * 0.9;
    this.camera.position.x = this.objects.player.position.x - BOARD.WIDTH * 0.7;
    this.camera.position.y = this.objects.player.position.y;
    this.camera.rotation.z = -90 * Math.PI/180;
    this.camera.rotation.y = -90 * Math.PI/180;

    draw(this);
  }

  Game.prototype.score = function(player, game) {

    game.state.scores[player] += 1;
    console.log("Player " + player + " scored! \nPlayer 1: " + game.state.scores[0] + " Player 2: " + game.state.scores[1]);
    game.resetBall();

  };

  Game.prototype.resetBall = function() {
    this.objects.ball.position.x = 0;
    this.objects.ball.position.y = 0;
    this.state.ball.speed = 0;
    this.state.ball = DEFAULT_BALL_STATE;
  };

  var update = {

    player: function(data, paddle) {
      paddle.position.y = data.y / 100 * (BOARD.HEIGHT/2);
    },

    opponent: function(data, paddle) {
      paddle.position.y = data.y / 100 * (BOARD.HEIGHT/2);
    },

    ball: function(ball, state) {

      ball.position.x += state.dirX * state.speed;
      ball.position.y += state.dirY * state.speed;

      // wall collision
      if (ball.position.y <= -BOARD.HEIGHT/2 || ball.position.y >= BOARD.HEIGHT/2) {
        state.dirY = -state.dirY;
      }
    },

    particles: function(system, state, delta) {
      var particle
        , len = state.particles.vertices.length;

      // rotate system
      system.rotation.z -= delta / 10;

      // make particles fall
      for (var i=0; i < len; i++) {
        particle = state.particles.vertices[i];
        particle.z += delta * 50 + ( i / len * 3 );
        if (particle.z > HEIGHT) particle.z = Math.random() * HEIGHT / 3;
      }
    }

  };

  function draw(game) {

    var delta = game.clock.getDelta();

    game.renderer.render(game.scene, game.camera);

    // move ball
    var ballY = game.objects.ball.position.y;
    var offset = PADDLE.WIDTH * 2;

    //update.ball(game.objects.ball, game.state.ball);
    //if (game.objects.ball.position.x <= -BOARD.WIDTH/2 + offset) {
      //if (ballY < paddle1Y + PADDLE.HEIGHT/2 && ballY > paddle1Y - PADDLE.HEIGHT) {
        //game.state.ball.dirX = -game.state.ball.dirX;
        //game.state.ball.speed = Math.random() * 7 + 4;
      //} else {
        //game.score(1, game);
      //}
    //} else if (game.objects.ball.position.x >= BOARD.WIDTH/2 - offset) {
      //if (ballY < paddle2Y + PADDLE.HEIGHT/2 && ballY > paddle2Y - PADDLE.HEIGHT) {
        //game.state.ball.dirX = -game.state.ball.dirX;
        //game.state.ball.speed = Math.random() * 7 + 4;
      //} else {
        //game.score(0, game);
      //}
    //}

    // animate particle system
    update.particles(game.objects.particleSystem, game.state, delta);
    game.objects.particleSystem.geometry.verticesNeedUpdate = true;

    update.player(game.player, game.objects.player);
    update.opponent(game.opponent, game.objects.opponent);

    setTimeout(function() {
      requestAnimationFrame(function () {
        draw(game);
      });
    }, 1000 / CALCULATED_FPS);

  }


  $(document).ready(function() {

    var game = window.game = new Game();

    //window.addEventListener('click', function() {
      //game.state.ball.speed = 4;
    //}, true);

    var socket = io.connect('http://localhost');

    socket.on('maxplayers', function() {
      alert('Only 2 players can connect at once...');
    });

    socket.on('player', function(data) {
      game.player = data;
    });

    socket.on('opponent', function(data) {
      game.opponent = data;
    });
  });

})();
