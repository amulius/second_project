;function Asterank3D(opts) {
    'use strict';

    var me = this;

    /** Options and defaults **/
    opts.static_prefix = opts.static_prefix || 'static';
    opts.default_camera_position = opts.camera_position || [0, 155, 32];
    opts.camera_fly_around = typeof opts.camera_fly_around === 'undefined' ? true : opts.camera_fly_around;
    opts.jed_delta = opts.jed_delta || 0.005;
    opts.custom_object_fn = opts.custom_object_fn || null;
    opts.object_texture_path = opts.object_texture_path || "static/img/cloud4.png";
    opts.not_supported_callback = opts.not_supported_callback || function () {
    };
    opts.sun_scale = opts.sun_scale || 50;
    opts.show_dat_gui = opts.show_dat_gui || false;
    opts.top_object_color = opts.top_object_color ?
        new THREE.Color(opts.top_object_color) : new THREE.Color(0xDBDB70);
    opts.milky_way_visible = opts.milky_way_visible || true;

    /** Constants **/
    var WEB_GL_ENABLED = true
        , MAX_NUM_ORBITS = 4000
        , PIXELS_PER_AU = 1000
        , EARTH_ADJUST = 214 * 109
        , NUM_BIG_PARTICLES = 25;   // show this many asteroids with orbits

    /** Other variables **/
    var stats, scene, renderer, composer, gui, GUItext, f1, f2
        , camera, cameraControls
        , pi = Math.PI
        , using_webgl = false
        , object_movement_on = true
        , lastHovered
        , added_objects = []
        , planets = []
        , exo_planets = []
        , planet_orbits_visible = false
        , planet_size_visible = true
        , exoPlanetSize = 0
        , exoPlanetSizeOptions = { Accurate: 0, Earth: 1, Jupiter: 2, '3xJupiter': 3, '10xJupiter': 4, '50xJupiter': 5 }
        , jed = toJED(new Date())
        , particle_system_geometry = null
        , exo_particle_system_geometry = null
        , asteroids_loaded = false
        , display_date_last_updated = 0
        , first_loaded = false
        , skyBox = null
        , spectralType = {
            'O': 0x004BFF,
            'B': 0x5578FF,
            'A': 0x7DB9FF,
            'F': 0xC8DCFF,
            'G': 0xFF4BC8,
            'K': 0xFF4B96,
            'M': 0xFFAF64,
            'L': 0xC83200,
            'T': 0x64004B,
            'Y': 0x322842
        };

    // Lock/feature stuff
    var feature_map = {}       // map from object full name to Orbit3D instance
        , locked_object = null
        , locked_object_ellipse = null
        , locked_object_idx = -1
        , locked_object_size = -1
        , locked_object_color = -1;


    // 2012 da14 special case
    var featured_2012_da14 = getParameterByName('2012_DA14') === '1';

    // glsl and webgl stuff
    var attributes
        , uniforms
        , particleSystem
        , exoParticleSystem;

    // Initialization
    init();
//    if (opts.want != 'all') {
        exoPlanetsAPI();
//    }
    if (opts.show_dat_gui) {
        initGUI();
    }
    animate();
    $('#loading').hide();

    $('#btn-toggle-movement').on('click', function () {
        object_movement_on = !object_movement_on;
    });


    function initGUI() {
        var ViewUI = function () {
            this['Speed'] = opts.jed_delta;
            this['Planet orbits'] = planet_orbits_visible;
//            this['Show Sizes'] = planet_size_visible;
            this['Exo planets'] = getExoplanets;
            this['Size?'] = exoPlanetSize;
            this['Milky Way'] = opts.milky_way_visible;
            this['Display date'] = '12/26/2012';
            this['Good data'] = "#FFFFFF";
            this['>= Jupiter'] = "#00FFFF";
            this['Default E Orbit'] = "#FF0000";
            this['Default E Period'] = "#FF0000";
            this['Default E Size'] = "#00FF00";


        };

        window.onload = function () {
            GUItext = new ViewUI();
            gui = new dat.GUI();
            f1 = gui.addFolder('Contols');
            f1.add(GUItext, 'Speed', -1, 1).onChange(function (val) {
                opts.jed_delta = val;
                var was_moving = object_movement_on;
                object_movement_on = opts.jed_delta != 0;
            });
            f1.add(GUItext, 'Planet orbits').onChange(function () {
                togglePlanetOrbits();
            });
            f1.add(GUItext, 'Milky Way').onChange(function () {
                toggleMilkyWay();
            });
//            f1.add(GUItext, 'Show Sizes').onChange(function () {
//                togglePlanetSpheres();
//            });
            f1.add(GUItext, 'Exo planets');
            f1.add(GUItext, 'Size?', exoPlanetSizeOptions).onChange(function (data) {
                changeExoplanetSize(data);
            });
            f1.add(GUItext, 'Display date').onChange(function (val) {
                var newdate = new Date(Date.parse(val));
                if (newdate) {
                    var newjed = toJED(newdate);
                    changeJED(newjed);
                    if (!object_movement_on) {
                        render(true); // force rerender even if simulation isn't running
                    }
                }
            }).listen();
            f1.open();
            f2 = gui.addFolder('Key');
            f2.addColor(GUItext, 'Good data');
            f2.addColor(GUItext, '>= Jupiter');
            f2.addColor(GUItext, 'Default E Orbit');
            f2.addColor(GUItext, 'Default E Period');
            f2.addColor(GUItext, 'Default E Size');
            window.datgui = GUItext;
        }; // end window onload
    } // end initGUI

    function togglePlanetOrbits() {
        planet_orbits_visible = !planet_orbits_visible;
        if (!planet_orbits_visible) {
//        planet_orbits_visible = false;
            for (var i = 0; i < planets.length; i++) {
                scene.remove(planets[i].getEllipse());
            }
        }
        else {
//        planet_orbits_visible = true;
            addSolSystem();
            for (var i = 0; i < planets.length; i++) {
                scene.add(planets[i].getEllipse());
            }
        }
    }

    function changeExoplanetSize(data) {
        var earthSize = PIXELS_PER_AU / EARTH_ADJUST;
        var jupiterSize = 11.209 * earthSize;
        var sizeDict = {
            1: earthSize,
            2: jupiterSize,
            3: jupiterSize * 3,
            4: jupiterSize * 10,
            5: jupiterSize * 50
        };
        var size;
//        console.log(data);
        if (data >= 1) {
            size = sizeDict[data];
            for (var i = 0; i < exo_planets.length; i++) {
                exo_planets[i].planetMeshSize.scale.set(size, size, size);
            }
        }
        else {
            for (var i = 0; i < exo_planets.length; i++) {
                size = exo_planets[i].eph.R * PIXELS_PER_AU / EARTH_ADJUST;
                exo_planets[i].planetMeshSize.scale.set(size, size, size);
            }
        }
    }

    function togglePlanetSpheres() {
        planet_size_visible = !planet_size_visible;
        if (!planet_size_visible) {
            for (var i = 0; i < planets.length; i++) {
                scene.remove(planets[i].planetMeshSize);
            }
        }
        else {
            for (var i = 0; i < planets.length; i++) {
                scene.add(planets[i].planetMeshSize);
            }
        }

//        console.log('sizes', planet_size_visible)
    }

    var getExoplanets = function () {
//      console.log('getting exo planets');
        planet_orbits_visible = false;
        planet_size_visible = false;
        GUItext['Planet orbits'] = planet_orbits_visible;
        GUItext['Show Sizes'] = planet_size_visible;
        for (var i in f1.__controllers) {
            f1.__controllers[i].updateDisplay();
        }
        for (var i = 0; i < planets.length; i++) {
            scene.remove(planets[i].planetMeshSize);
            scene.remove(planets[i].getEllipse());
        }
        if (exo_planets.length == 0) {
            exoPlanetsAPI();
        }
    };

    function toggleMilkyWay() {
        skyBox.visible = opts.milky_way_visible = !opts.milky_way_visible;
    }

    function isWebGLSupported() {
        return WEB_GL_ENABLED && Detector.webgl;
    }

    function init() {
//        console.log('init');
        // Sets up the scene
        $('#loading-text').html('renderer');
        renderer = new THREE.WebGLRenderer(
            {antialias: true
                // to get smoother output
            }
        );
        var $container = $(opts.container);
        var containerHeight = window.innerHeight;//$(window).height()/2;
        var containerWidth = window.innerWidth;  // $(window).width()
        renderer.setSize(window.innerWidth, window.innerHeight);
        opts.container.append(renderer.domElement);

        // create a scene
        scene = new THREE.Scene();

        // put a camera in the scene
        var cameraH = 3;
        var cameraW = cameraH / containerHeight * containerWidth;
        window.cam = camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000000);
        setDefaultCameraPosition();
        THREEx.WindowResize(renderer, camera, opts.container);    // handle window resize
        // Fullscreen api
        if (THREEx.FullScreen && THREEx.FullScreen.available()) {
            THREEx.FullScreen.bindKey();
        }
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        scene.add(camera);

        cameraControls = new THREE.TrackballControls(camera, opts.container);
        cameraControls.staticMoving = true;
        cameraControls.panSpeed = 2;
        cameraControls.zoomSpeed = 3;
        cameraControls.rotateSpeed = 3;
        cameraControls.maxDistance = 100000;
        cameraControls.dynamicDampingFactor = 0.5;
        window.cc = cameraControls;

        // This is stupid but it's how I set up the initial rotation
        cameraControls.forceRotate(
            new THREE.Vector3(0.09133858267716535, 0.4658716047427351, 0.1826620371691377),
            new THREE.Vector3(-0.12932885444884135, 0.35337196181704117, 0.023557202790282953));
        cameraControls.forceRotate(
            new THREE.Vector3(0.5557858773636077, 0.7288978222072244, 0.17927802044881952),
            new THREE.Vector3(-0.0656536826099882, 0.5746939531732201, 0.7470641189675084));

        // Rendering solar system

        // "sun" - 0,0 marker


//    light = new THREE.PointLight( 0xFFFFFF, 1, PIXELS_PER_AU );
//    scene.add( light );
//      light.visible = false;

        // Ellipses
        if (opts.want == 'all') {
            addSun();
//            addSolSystem();
        }
//        else {
//
//        }

        // Skybox
        var geometry = new THREE.SphereGeometry(100000, 60, 40);
        var uniforms = {
            texture: { type: 't', value: loadTexture('static/img/eso_dark.jpg') }
//      texture: { type: 't', value: THREE.ImageUtils.loadTexture('static/img/eso_dark.jpg') }
        };
//    console.log(THREE.ImageUtils.loadTexture('static/img/eso_dark.jpg'));
        var material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: document.getElementById('sky-vertex').textContent,
            fragmentShader: document.getElementById('sky-density').textContent
        });


//      var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );

        skyBox = new THREE.Mesh(geometry, material);
        skyBox.scale.set(-1, 1, 1);
        skyBox.rotation.order = 'XZY';
        skyBox.rotation.z = pi / 2;
        skyBox.rotation.x = pi;
        skyBox.renderDepth = 1000.0;
        scene.add(skyBox);
        window.skyBox = skyBox;
//      console.log(scene);

        $(opts.container).on('mousedown', function () {
            opts.camera_fly_around = false;
        });

        window.renderer = renderer;
    }  // end init

    function setNeutralCameraPosition() {
        // Follow floating path around
        var timer = 0.0001 * Date.now();
        cam.position.x = Math.sin(timer) * 25;
        //cam.position.y = Math.sin( timer ) * 100;
        cam.position.z = 100 + Math.cos(timer) * 20;
    }

    function setDefaultCameraPosition() {
        cam.position.set(opts.default_camera_position[0], opts.default_camera_position[1],
            opts.default_camera_position[2]);
    }

//
//  function setHighlight(full_name) {
//    // Colors the object differently, but doesn't follow it.
//    var mapped_obj = feature_map[full_name];
//    if (!mapped_obj) {
//      alert("Sorry, something went wrong and I can't highlight this object.");
//      return;
//    }
//    var orbit_obj = mapped_obj.orbit;
//    if (!orbit_obj) {
//      alert("Sorry, something went wrong and I can't highlight this object.");
//      return;
//    }
//    var idx = mapped_obj.idx; // this is the object's position in the added_objects array
//    attributes.value_color.value[idx] = new THREE.Color(0x0000ff);
//    attributes.size.value[idx] = 30.0;
//    attributes.locked.value[idx] = 1.0;
//    setAttributeNeedsUpdateFlags();
//  }

    // camera locking fns
    function clearLock(set_default_camera) {
        if (!locked_object) return;

        if (set_default_camera) {
            setDefaultCameraPosition();
        }

        cameraControls.target = new THREE.Vector3(0, 0, 0);

        // restore color and size
        attributes.value_color.value[locked_object_idx] = locked_object_color;
        attributes.size.value[locked_object_idx] = locked_object_size;
        attributes.locked.value[locked_object_idx] = 0.0;
        setAttributeNeedsUpdateFlags();
        if (locked_object_idx >= planets.length) {
            // not a planet
            scene.remove(locked_object_ellipse);
        }

        locked_object = null;
        locked_object_ellipse = null;
        locked_object_idx = -1;
        locked_object_size = -1;
        locked_object_color = null;

        // reset camera pos so subsequent locks don't get into crazy positions
        setNeutralCameraPosition();
    }   // end clearLock

//  function setLock(full_name) {
//    if (locked_object) {
//      clearLock();
//    }
//
//    var mapped_obj = feature_map[full_name];
//    if (!mapped_obj) {
//      alert("Sorry, something went wrong and I can't lock on this object.");
//      return;
//    }
//    var orbit_obj = mapped_obj['orbit'];
//    if (!orbit_obj) {
//      alert("Sorry, something went wrong and I can't lock on this object.");
//      return;
//    }
//    locked_object = orbit_obj;
//    locked_object_idx = mapped_obj['idx']; // this is the object's position in the added_objects array
//    locked_object_color = attributes.value_color.value[locked_object_idx];
//    attributes.value_color.value[locked_object_idx] = full_name === 'earth' ?
//      new THREE.Color(0x00ff00) : new THREE.Color(0xff0000);
//    locked_object_size = attributes.size.value[locked_object_idx];
//    attributes.size.value[locked_object_idx] = 30.0;
//    attributes.locked.value[locked_object_idx] = 1.0;
//    setAttributeNeedsUpdateFlags();
//
//    locked_object_ellipse = locked_object.getEllipse();
//    scene.add(locked_object_ellipse);
//    opts.camera_fly_around = true;
//  } // end setLock

    function handleSimulationResults(e, particles) {
        var data = e.data;
        switch (data.type) {
            case 'result':
                // queue simulation results
                var positions = data.value.positions;

                for (var i = 0; i < positions.length; i++) {
                    particles[i].MoveParticleToPosition(positions[i]);
                }

                if (typeof datgui !== 'undefined') {
                    // update with date
                    var now = new Date().getTime();
                    if (now - display_date_last_updated > 500) {
                        var georgian_date = fromJED(data.value.jed);
                        datgui['display date'] = georgian_date.getMonth() + 1 + "/"
                            + georgian_date.getDate() + "/" + georgian_date.getFullYear();
                        display_date_last_updated = now;
                    }
                }
                break;
            case 'debug':
                console.log(data.value);
                break;
            default:
                console.log('Invalid data type', data.type);
        }
    }

    function createParticleSystem() {
//      console.log('create particles');
        // attributes
        attributes = {
            a: { type: 'f', value: [] },
            e: { type: 'f', value: [] },
            i: { type: 'f', value: [] },
            o: { type: 'f', value: [] },
            ma: { type: 'f', value: [] },
            n: { type: 'f', value: [] },
            w: { type: 'f', value: [] },
            P: { type: 'f', value: [] },
            epoch: { type: 'f', value: [] },
            size: { type: 'f', value: [] },
            value_color: { type: 'c', value: [] },

            // attributes can't be bool or int in some versions of opengl
            locked: { type: 'f', value: [] },
            is_planet: { type: 'f', value: [] }
        };

        uniforms = {
            color: { type: 'c', value: new THREE.Color(0xffffff) },
            jed: { type: 'f', value: jed },
            earth_i: { type: 'f', value: Ephemeris.earth.i },
            earth_om: { type: 'f', value: Ephemeris.earth.om },
            planet_texture: { type: 't', value: loadTexture('static/img/cloud4.png') },
            small_roid_texture: { type: 't', value: loadTexture(opts.object_texture_path) },
            small_roid_circled_texture: { type: 't', value: loadTexture('static/img/cloud4-circled.png') }
        };
        var vertexshader = document.getElementById('vertexshader').textContent
            .replace('{{PIXELS_PER_AU}}', PIXELS_PER_AU.toFixed(1));
        var particle_system_shader_material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            attributes: attributes,
            vertexShader: vertexshader,
            fragmentShader: document.getElementById('fragmentshader').textContent
        });
        particle_system_shader_material.depthTest = false;
        particle_system_shader_material.vertexColor = true;
        particle_system_shader_material.transparent = true;
        particle_system_shader_material.blending = THREE.AdditiveBlending;

        for (var i = 0; i < added_objects.length; i++) {
            if (i < planets.length) {
                attributes.size.value[i] = 75;
                attributes.is_planet.value[i] = 1.0;
            }
            else {
                attributes.size.value[i] = added_objects[i].opts.object_size;
                attributes.is_planet.value[i] = 0.0;
            }

            attributes.a.value[i] = added_objects[i].eph.a;
            attributes.e.value[i] = added_objects[i].eph.e;
            attributes.i.value[i] = added_objects[i].eph.i;
            attributes.o.value[i] = added_objects[i].eph.om;
            attributes.ma.value[i] = added_objects[i].eph.ma;
            attributes.n.value[i] = added_objects[i].eph.n || -1.0;
            attributes.w.value[i] = added_objects[i].eph.w_bar
                || (added_objects[i].eph.w + added_objects[i].eph.om);
            attributes.P.value[i] = added_objects[i].eph.P || -1.0;
            attributes.epoch.value[i] = added_objects[i].eph.epoch;
            // http://threejsdoc.appspot.com/doc/three.js/examples.source/webgl_custom_attributes_lines.html.html
            attributes.value_color.value[i] = added_objects[i].opts.display_color;
            attributes.locked.value[i] = 0.0;
        }  // end added_objects loop

        setAttributeNeedsUpdateFlags();

        particleSystem = new THREE.PointCloud(
            particle_system_geometry,
            particle_system_shader_material
        );
        window.ps = particleSystem;

        // add it to the scene
        scene.add(particleSystem);
    }

    function createExoParticleSystem() {
        exo_particle_system_geometry = new THREE.Geometry();
        for (var i = 0; i < exo_planets.length; i++) {
            // FIXME this is a workaround for the poor handling of PSG vertices in ellipse.js
            // needs to be cleaned up
            exo_particle_system_geometry.vertices.push(new THREE.Vector3(0, 0, 0));
        }
//      console.log('create particles');
        // attributes
        attributes = {
            a: { type: 'f', value: [] },
            e: { type: 'f', value: [] },
            i: { type: 'f', value: [] },
            o: { type: 'f', value: [] },
            ma: { type: 'f', value: [] },
            n: { type: 'f', value: [] },
            w: { type: 'f', value: [] },
            P: { type: 'f', value: [] },
            epoch: { type: 'f', value: [] },
            size: { type: 'f', value: [] },
            value_color: { type: 'c', value: [] },

            // attributes can't be bool or int in some versions of opengl
            locked: { type: 'f', value: [] },
            is_planet: { type: 'f', value: [] }
        };

        uniforms = {
            color: { type: 'c', value: new THREE.Color(0xffffff) },
            jed: { type: 'f', value: jed },
            earth_i: { type: 'f', value: Ephemeris.earth.i },
            earth_om: { type: 'f', value: Ephemeris.earth.om },
            planet_texture: { type: 't', value: loadTexture('static/img/cloud4.png') },
            small_roid_texture: { type: 't', value: loadTexture(opts.object_texture_path) },
            small_roid_circled_texture: { type: 't', value: loadTexture('static/img/cloud4-circled.png') }
        };
        var vertexshader = document.getElementById('vertexshader').textContent
            .replace('{{PIXELS_PER_AU}}', PIXELS_PER_AU.toFixed(1));
        var particle_system_shader_material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            attributes: attributes,
            vertexShader: vertexshader,
            fragmentShader: document.getElementById('fragmentshader').textContent
        });
        particle_system_shader_material.depthTest = false;
        particle_system_shader_material.vertexColor = true;
        particle_system_shader_material.transparent = true;
        particle_system_shader_material.blending = THREE.AdditiveBlending;


        for (var i = 0; i < exo_planets.length; i++) {
//        console.log(exo_planets[i]);

            attributes.size.value[i] = 75;
            attributes.is_planet.value[i] = 1.0;
            attributes.a.value[i] = exo_planets[i].eph.a;
            attributes.e.value[i] = exo_planets[i].eph.e;
            attributes.i.value[i] = exo_planets[i].eph.i;
            attributes.o.value[i] = exo_planets[i].eph.om;
            attributes.ma.value[i] = exo_planets[i].eph.ma;
            attributes.n.value[i] = exo_planets[i].eph.n || -1.0;
            attributes.w.value[i] = exo_planets[i].eph.w_bar
                || (exo_planets[i].eph.w + exo_planets[i].eph.om);
            attributes.P.value[i] = exo_planets[i].eph.P || -1.0;
            attributes.epoch.value[i] = exo_planets[i].eph.epoch;
            attributes.value_color.value[i] = new THREE.Color(exo_planets[i].opts.color);
            attributes.locked.value[i] = 0.0;
        }  // end added_objects loop
        setAttributeNeedsUpdateFlags();

        exoParticleSystem = new THREE.PointCloud(
            exo_particle_system_geometry,
            particle_system_shader_material
        );
        window.eps = exoParticleSystem;

        // add it to the scene
        scene.add(exoParticleSystem);
    }

    function setAttributeNeedsUpdateFlags() {
        attributes.value_color.needsUpdate = true;
        attributes.locked.needsUpdate = true;
        attributes.size.needsUpdate = true;
    }

    function starTexture(color, size) {
        size = (size) ? parseInt(size * 24, 10) : 24;
        var canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        var col = new THREE.Color(color);

        var context = canvas.getContext('2d');
        var gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
        var rgbaString = 'rgba(' + ~~( col.r * 255 ) + ',' + ~~( col.g * 255 ) + ',' + ~~( col.b * 255 ) + ',' + (1) + ')';
        gradient.addColorStop(0, rgbaString);
        gradient.addColorStop(0.1, rgbaString);
        gradient.addColorStop(0.6, 'rgba(125, 20, 0, 0.2)');
        gradient.addColorStop(-1.92, 'rgba(0,0,0,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        return canvas;
    }

    function changeJED(new_jed) {
        jed = new_jed;
    }

    function animate() {
        // animation loop
        if (!asteroids_loaded) {
            render();
            requestAnimationFrame(animate);
            return;
        }
        if (opts.camera_fly_around) {

            if (locked_object) {
                // Follow locked object
                var pos = locked_object.getPosAtTime(jed);
                if (featured_2012_da14 && locked_object.name === 'Earth') {
                    cam.position.set(pos[0] - 20, pos[1] + 20, pos[2] + 20);
                }
                else {
                    //cam.position.set(pos[0]+50, pos[1]+50, pos[2]+50);
                    cam.position.set(pos[0] + 25, pos[1] - 25, pos[2] - 70);
                }
                cameraControls.target = new THREE.Vector3(pos[0], pos[1], pos[2]);
            }
            else {
                setNeutralCameraPosition();
            }
        }

        render();
        requestAnimationFrame(animate);
    }

    function render(force) {
        // render the scene at this timeframe

        // update camera controls
        cameraControls.update();

        // update display date
        var now = new Date().getTime();
        if (now - display_date_last_updated > 500 && typeof datgui !== 'undefined') {
            var georgian_date = fromJED(jed);
            datgui['Display date'] = georgian_date.getMonth() + 1 + "/"
                + georgian_date.getDate() + "/" + georgian_date.getFullYear();
            display_date_last_updated = now;
        }

        if (object_movement_on || force) {
            // update shader vals for asteroid cloud
//            if(opts.want != 'all' && exo_planets.length > 0){
//                uniforms.jed.value = jed;
//            }
            jed += opts.jed_delta;
        }
//    console.log(now);
        for (var i = 0; i < planets.length; i++) {
            planets[i].MoveBody(jed);
        }
        for (var i = 0; i < exo_planets.length; i++) {
            exo_planets[i].MoveBody(jed);
//            exo_planets[i].MoveParticle(jed);
        }


        // actually render the scene
        renderer.render(scene, camera);
    }


    function loadTexture(path) {
//    if (typeof passthrough_vars !== 'undefined' && passthrough_vars.offline_mode) {
//      // same origin policy workaround
//      console.log(path);
        var b64_data = $('img[data-src="' + path + '"]').attr('src');
//      console.log(b64_data);
//
//      var new_image = document.createElement( 'img' );
//      var texture = new THREE.Texture( new_image );
//      new_image.onload = function()  {
//        texture.needsUpdate = true;
//      };
//      new_image.src = b64_data;
////      console.log(texture);
//      return texture;
////    }
//      console.log(path);
        return THREE.ImageUtils.loadTexture(b64_data);
//    return THREE.ImageUtils.loadTexture(path);
    }

    /** Public functions **/

    me.clearRankings = function () {
        // Remove any old setup
        for (var i = 0; i < added_objects.length; i++) {
            scene.remove(added_objects[i].getParticle());
        }
        clearLock(true);
        if (particleSystem) {
            scene.remove(particleSystem);
            particleSystem = null;
        }

        if (lastHovered) {
            scene.remove(lastHovered);
        }
    };

    me.clearLock = function () {
        return clearLock(true);
    };

//  me.setLock = function(full_name) {
//    return setLock(full_name);
//  };

    me.isWebGLSupported = function () {
        return isWebGLSupported();
    };

    me.processAsteroidRankings = function (data) {
//    if (!data) {
//      alert('Sorry, something went wrong and the server failed to return data.');
//      return;
//    }
//    var n = data.length;
        var n = 0;
        // add planets
        added_objects = planets.slice();
        particle_system_geometry = new THREE.Geometry();

        for (var i = 0; i < planets.length; i++) {
            // FIXME this is a workaround for the poor handling of PSG vertices in ellipse.js
            // needs to be cleaned up
            particle_system_geometry.vertices.push(new THREE.Vector3(0, 0, 0));
        }

//    var useBigParticles = !using_webgl;
//    var featured_count = 0;
//    var featured_html = '';
//    for (var i=0; i < n; i++) {
//      if (i === NUM_BIG_PARTICLES) {
//        if (!using_webgl) {
//          // only show objects of interest if there's no particlesystem support
//          break;
//        }
//        useBigParticles = false;
//      }
//      var roid = data[i];
//      var locked = false;
//      var orbit;
//      if (opts.custom_object_fn) {
//        var orbit_params = opts.custom_object_fn(roid);
//        orbit_params.particle_geometry = particle_system_geometry; // will add itself to this geometry
//        orbit_params.jed = jed;
//        orbit = new Orbit3D(roid, orbit_params, useBigParticles);
//      }
//      else {
//        var display_color = i < NUM_BIG_PARTICLES ?
//            opts.top_object_color : displayColorForObject(roid);
//        orbit = new Orbit3D(roid, {
//          color: 0xcccccc,
//          display_color: display_color,
//          width: 2,
//          object_size: i < NUM_BIG_PARTICLES ? 50 : 15, //1.5,
//          jed: jed,
//          particle_geometry: particle_system_geometry // will add itself to this geometry
//        }, useBigParticles);
//      }
//
//      // Add it to featured list
//      feature_map[roid.full_name] = {
//        'orbit': orbit,
//        'idx': added_objects.length
//      };
//      // TODO(@ian) all this specific objects-of-interest/featured stuff
//      // needs to be moved out of 3d code !!
//      if (featured_count++ < NUM_BIG_PARTICLES) {
//        featured_html += '<tr data-full-name="'
//          + roid.full_name
//          + '"><td><a href="#">'
//          + (roid.prov_des || roid.full_name)
//          + '</a></td><td>'
//          + (roid.price < 1 ? 'N/A' : '$' + fuzzy_price(roid.price))
//          + '</td></tr>';
//      }
//
//      // Add to list of objects in scene
//      added_objects.push(orbit);
//    } // end asteroid results for loop

        // handle when view mode is switched - need to clear every row but the sun
//    if (featured_2012_da14) {
//      $('#objects-of-interest tr:gt(2)').remove();
//    }
//    else {
//      $('#objects-of-interest tr:gt(1)').remove();
//    }
//    $('#objects-of-interest').append(featured_html).on('click', 'tr', function() {
//      $('#objects-of-interest tr').css('background-color', '#000');
//      var $e = $(this);
//      var full_name = $e.data('full-name');
//      $('#sun-selector').css('background-color', 'green');
//      switch (full_name) {
//        // special case full names
//        case 'sun':
//          clearLock(true);
//          return false;
//        case '2012 DA14':
//          // highlight the earth too
//          //setHighlight('earth');
//          break;
//      }
//      clearLock();
//
//      // set new lock
//      $e.css('background-color', 'green');
//      $('#sun-selector').css('background-color', '#000');
//      setLock(full_name);
//
//      return false;
//    });
//    $('#objects-of-interest-container').show();

        jed = toJED(new Date());  // reset date
        if (!asteroids_loaded) {
            asteroids_loaded = true;
        }
//    createParticleSystem();   // initialize and start the simulation

//    if (featured_2012_da14) {
//      setLock('earth');
//      $('#sun-selector').css('background-color', 'black');
//      $('#earth-selector').css('background-color', 'green');
//    }
        if (!first_loaded) {
//        console.log('first load');
            animate();
            first_loaded = true;
        }

        $('#loading').hide();

    };    // end processAsteroidRankings

    me.pause = function () {
        object_movement_on = false;
    };

    me.play = function () {
        object_movement_on = true;
    };


    function addSolSystem() {

        if (planets.length == 0) {
//            if (opts.want == 'all') {
//                addSun();
//            }
//          $('#loading-text').html('planets');
            var mercury = new Orbit3D(Ephemeris.mercury,
                {
                    color: 0x913CEE, width: Ephemeris.mercury.R / 10, jed: jed, object_size: 1.7,
                    texture_path: 'static/img/texture-mercury.jpg',
                    display_color: new THREE.Color(0x913CEE),
                    particle_geometry: particle_system_geometry,
                    name: 'Mercury'
                });
            scene.add(mercury.planetMeshSize);
            scene.add(mercury.getEllipse());
            var venus = new Orbit3D(Ephemeris.venus,
                {
                    color: 0xFF7733, width: Ephemeris.venus.R / 10, jed: jed, object_size: 1.7,
                    texture_path: 'static/img/texture-venus.jpg',
                    display_color: new THREE.Color(0xFF7733),
                    particle_geometry: particle_system_geometry,
                    name: 'Venus'
                });
            scene.add(venus.planetMeshSize);
            scene.add(venus.getEllipse());
            var earth = new Orbit3D(Ephemeris.earth,
                {
                    color: 0x009ACD, width: Ephemeris.earth.R / 10, jed: jed, object_size: 1.7,
                    texture_path: 'static/img/texture-earth.jpg',
                    display_color: new THREE.Color(0x009ACD),
                    particle_geometry: particle_system_geometry,
                    name: 'Earth'
                });
            scene.add(earth.planetMeshSize);
            scene.add(earth.getEllipse());
            feature_map['earth'] = {
                orbit: earth,
                idx: 2
            };
            var mars = new Orbit3D(Ephemeris.mars,
                {
                    color: 0xA63A3A, width: Ephemeris.mars.R / 10, jed: jed, object_size: 1.7,
                    texture_path: 'static/img/texture-mars.jpg',
                    display_color: new THREE.Color(0xA63A3A),
                    particle_geometry: particle_system_geometry,
                    name: 'Mars'
                });
            scene.add(mars.planetMeshSize);
            scene.add(mars.getEllipse());
            var jupiter = new Orbit3D(Ephemeris.jupiter,
                {
                    color: 0xFF7F50, width: Ephemeris.jupiter.R / 10, jed: jed, object_size: 1.7,
                    texture_path: 'static/img/texture-jupiter.jpg',
                    display_color: new THREE.Color(0xFF7F50),
                    particle_geometry: particle_system_geometry,
                    name: 'Jupiter'
                });
            scene.add(jupiter.planetMeshSize);
            scene.add(jupiter.getEllipse());

            //    var comet = new Orbit3D(Ephemeris.comet,
            //        {
            //          color: 0xFFFF00, width: 1, jed: jed, object_size: 1.7,
            //          texture_path: 'static/img/texture-jupiter.jpg',
            //          display_color: new THREE.Color(0xFFFF00),
            //          particle_geometry: particle_system_geometry,
            //          name: 'Comet'
            //        });
            //    scene.add(comet.planetMeshSize);
            //    scene.add(comet.getEllipse());
            //    console.log(scene);
            planets = [mercury, venus, earth, mars, jupiter];
        }
    }

    function exoPlanetsAPI() {
//        console.log(opts.want);
        var data = {
            'want': 'exoplanets',
            'which': opts.want
        };
        $.ajax({
            url: "/api/",
            type: "GET",
            data: data,
            success: function (data) {
//                console.log(data.systems);
                if (opts.want != 'all') {
                    addStar(data.systems[0]);
                }
                batchMakeExoPlanet(data.systems);
//                if(opts.want != 'all'){
//                    createExoParticleSystem();
//                }
            },
            error: function (data) {
                console.log('bad');
                console.log(data);
            }
        });
    }

    function batchMakeExoPlanet(systems) {
//        console.log('planet batch');
        for (var i = 0; i < systems.length; i++) {
            var exo_data = {
                full_name: systems[i].pl_name,
                host_name: systems[i].pl_hostname,
                ma: 0, // mean anomaly
                epoch: systems[i].pl_orbtper || 0, //  might be able to not need
                a: systems[i].pl_orbsmax || calculateA(systems[i]), //  Semimajor axis - exoplanet might have
                e: systems[i].pl_orbeccen || 0, //Eccentricity - exoplanet might have
                i: systems[i].pl_orbincl || 0, //Inclination - exoplanet might have
                w_bar: systems[i].pl_orblper || 0, // longitude of perihelion(w + omega) Longitude of the periapsis - exoplanet might have
                w: 0, // argument = (w + omega) - (omega) - if w_bar don't need
                L: 0, // mean longitude - don't need
                om: 0, //Longitude of the ascending node(omega) - if w_bar don't need
                P: systems[i].pl_orbper || calculateP(systems[i]), //Period - exoplanet might have
                R: systems[i].pl_radj * 11.209 || 1 // radius - nice to have
            };
            makeExoPlanet(exo_data);
        }
//        console.log('planet batch done');
    }

    function makeExoPlanet(exo_data) {
        var exoPlanet = new Orbit3D(exo_data,
            {
                color: 0xFFFFFF, width: 1, jed: jed, object_size: 1.7,
                texture_path: 'static/img/cloud4.png',
                display_color: new THREE.Color(0xFFFFFF),
                particle_geometry: particle_system_geometry,
                name: exo_data.full_name
            });
        exo_planets.push(exoPlanet);
        scene.add(exoPlanet.planetMeshSize);
        if (opts.want != 'all') {
            scene.add(exoPlanet.getEllipse());
        }
    }

    function calculateA(planet) {
        var period = planet.pl_orbper;
        var grav = 2.9597 * Math.pow(10, -4);
        var mass = planet.st_mass || 0;
        if (period && mass) {
            var GM = mass * grav;
            var periodOverPi = period / (2 * Math.PI);
            var A = Math.pow(Math.pow(periodOverPi, 2) * GM, 1 / 3);
            return A;
        } else {
            return 1;
        }
    }

    function calculateP(planet) {
        var A = planet.pl_orbsmax;
        var grav = 2.9597 * Math.pow(10, -4);
        var mass = planet.st_mass || 0;
        if (A && mass) {
            var GM = mass * grav;
            var rCube = Math.pow(A, 3);
            var period = (2 * Math.PI) * Math.sqrt(rCube / GM);
            return period;
        } else {
            return 365.256;
        }
    }

    function addStar(planet) {
//        console.log(planet);
        var texture = loadTexture('static/img/sunsprite.png');
        var color = spectralType[planet.st_spstr[0]] || 0xffaa00;
        var radius = planet.st_rad || 1;
//        console.log(color);
        var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: texture,
            blending: THREE.AdditiveBlending,
            useScreenCoordinates: false,
            color: color
        }));
//        console.log(sprite);
        sprite.scale.x = radius * 12 * PIXELS_PER_AU / 214;
        sprite.scale.y = radius * 12 * PIXELS_PER_AU / 214;
        sprite.scale.z = 1;
        scene.add(sprite);
//    console.log(PIXELS_PER_AU / 10);
//    var sun = new THREE.SphereGeometry( PIXELS_PER_AU / 10, 32, 32 );
//      console.log(radius * PIXELS_PER_AU / 214);

//        console.log(radius);
        var sun = new THREE.SphereGeometry(radius * PIXELS_PER_AU / 214, 32, 32);

        var sunMaterial = new THREE.MeshBasicMaterial({ color: color });

        var sunMesh = new THREE.Mesh(sun, sunMaterial);
//        console.log(sunMesh);
        scene.add(sunMesh);
    }

    function addSun() {
        $('#loading-text').html('sun');
        var texture = loadTexture('static/img/sunsprite.png');
        var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: texture,
            blending: THREE.AdditiveBlending,
            useScreenCoordinates: false,
            color: 0xffaa00
        }));
        sprite.scale.x = opts.sun_scale;
        sprite.scale.y = opts.sun_scale;
        sprite.scale.z = 1;
        scene.add(sprite);
//    console.log(PIXELS_PER_AU / 10);
//    var sun = new THREE.SphereGeometry( PIXELS_PER_AU / 10, 32, 32 );
//        console.log(PIXELS_PER_AU / 214);
        var sun = new THREE.SphereGeometry(PIXELS_PER_AU / 214, 32, 32);

        var sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        var sunMesh = new THREE.Mesh(sun, sunMaterial);
        scene.add(sunMesh);
    }
}

