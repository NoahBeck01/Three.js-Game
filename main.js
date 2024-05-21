import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import TWEEN from 'https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@18.5.0/dist/tween.esm.js';


//TODO:
/*


HEad Color
*/

//HTNL ELEMEMTS
const scoreEL = document.querySelector("#scoreEL");
const startGameBtn = document.querySelector("#startGameBtn");
const modalEl = document.querySelector("#modalEl");
const bigScoreEL = document.querySelector("#bigScoreEl");
const restartGameBtn = document.querySelector("#restartGameBtn");
const scoreDiv = document.querySelector("#scoreDiv");
const titleText = document.querySelector("#titleText");
const livesEl = document.querySelector("#livesEl");
const shildEl = document.querySelector("#shildEl");
const gameOverEl = document.querySelector("#gameOverEl");
const bulletEl = document.querySelector("#bulletEl");
const ContinueGameBtn = document.querySelector("#ContinueGameBtn");
const pointsEL = document.querySelector("#pointsEL");
restartGameBtn.style.visibility = "hidden";

//VARIABLES
let lives = 3;
let points = 0;
let canJump = true;
let canShoot = true;
let shildLives = 0;
let enemies = [];
let shildItems = [];
let bullets = [];
let nukes = [];
let nukes_modell = [];
let bulletItems = [];
let heartItems = [];
let bulletcount = 0;
let frames = 0;
let spawnrate = 300;
let play = true;
let startTime;
let particles;
let cubeVisible = true;
let particlesSpawned = false;
let timeString;
let EnemyHit = false;
let ShildHit = false;
let bulletHit = false;
let capsuleHit = false;
let elapsedTime = 0;
const fallSpeed = 0.05;
const maxFallTime = 1000;
const removeIntervall = 5000;
let spawnEnemy = true;
let spawnShild = true;
let spawnBullets = true;
let spawnHeart = true;
let nuke_ready = false;
let NukeLastPressTime = 0;
const cooldownDuration = 60000;

const spreadSpeed = 0.3;
let lastSpeedIncreaseTime = Date.now();
const speedIncreaseInterval = 3000;

const loader = new GLTFLoader();

//COLOR OF SHILDS
let shildColor = {
    one: { color: "#93d5ed", opacity: 0.2 },
    two: { color: "#d5e892", opacity: 0.5 },
    three: { color: "#e8f760", opacity: 0.8 },
};

//SCENE & CAMERA
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(4.61, 3.74, 8);
//camera.position.set(30, 13.74, 40);

// RENDERER
const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

renderer.shadowMap.enabled = true;

// CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);

const loaderTexture = new THREE.TextureLoader();
loaderTexture.load("src/background3.jpg", function (texture) {
    scene.background = texture;
});

/*
SHILDITEM CLASS
Class that Create a Sphere Mesh that is added to a box class
*/
class Item extends THREE.Mesh {
    constructor({
        radius = 1, // Radius der Kugel
        color = "#93d5ed", // Farbe der Kugel
        position = { x: 0, y: 0, z: 0 }, // Position der Kugel
        transparent = true,
        opacity = 0.2,
    }) {
        super(
            new THREE.SphereGeometry(radius), // Erstellen Sie eine neue Kugelgeometrie
            new THREE.MeshStandardMaterial({ color, transparent, opacity }) // Verwenden Sie Standardmaterialien mit der angegebenen Farbe
        );

        // Setzen Sie die Position der Kugel
        this.position.set(position.x, position.y, position.z);

        // Berechnen Sie die Mitte der Kugel für die Bewegungslogik
        this.center = new THREE.Vector3(
            this.position.x + radius,
            this.position.y,
            this.position.z + radius
        );
    }
}

class Capsule extends THREE.Mesh {
    constructor({
        radiusTop,
        radiusBottom,
        height,
        color = "green",
        velocity = {
            x: 0,
            y: 0,
            z: 0,
        },
        position = {
            x: 0,
            y: 0,
            z: 0,
        },
        zAcceleration = false,
        transparent = false,
        opacity = 100,
    }) {
        super(
            new THREE.CapsuleGeometry(radiusTop, height, 8, 16),
            new THREE.MeshStandardMaterial({ color, transparent, opacity })
        );
        this.radiusTop = radiusTop;
        this.radiusBottom = radiusBottom;
        this.height = height;

        this.position.set(position.x, position.y, position.z);

        // Berechnung der Seiten der Kapsel
        this.right = this.position.x + this.width / 2;
        this.left = this.position.x - this.width / 2;

        this.front = this.position.z + this.height / 2;
        this.back = this.position.z - this.height / 2;

        this.bottom = this.position.y - this.height / 2;
        this.top = this.position.y + this.height / 2;

        // Berechnung der Mittelpunkte der Kapsel
        this.center = new THREE.Vector3(
            this.position.x,
            this.position.y,
            this.position.z
        );
        this.topCenter = new THREE.Vector3(
            this.center.x,
            this.center.y + this.height / 2,
            this.center.z
        );
        this.bottomCenter = new THREE.Vector3(
            this.center.x,
            this.center.y - this.height / 2,
            this.center.z
        );

        this.velocity = velocity;
        this.gravity = -0.005;

        this.zAcceleration = zAcceleration;
    }

    updateSides() {
        // Aktualisierung der Seiten der Kapsel basierend auf der aktuellen Position
        this.front = this.position.z + this.height / 2;
        this.back = this.position.z - this.height / 2;

        this.bottom = this.position.y - this.height / 2;
        this.top = this.position.y + this.height / 2;
    }

    update(ground) {
        this.updateSides();
        if (this.zAcceleration) this.velocity.z += 0.0005;

        this.position.x += this.velocity.x;
        this.position.z += this.velocity.z;

        this.applyGravity(ground);
    }

    applyGravity(ground) {
        // Anwendung der Schwerkraft
        this.velocity.y += this.gravity;

        if (
            boxCollisiom({
                box1: this,
                box2: ground,
            })
        ) {
            const friction = 0.1;
            this.velocity.y *= friction;
            this.velocity.y = -this.velocity.y;
        } else this.position.y += this.velocity.y;
    }
}


/*
BOX CLASS
Class that Creates Cube Meshes that are used for the Enemy, Player and Ground
*/
const textureLoader = new THREE.TextureLoader();
class Box extends THREE.Mesh {
    constructor({
        width,
        height,
        depth,
        color = "#00ff00",
        points = 100,
        velocity = {
            x: 0,
            y: 0,
            z: 0,
        },
        position = {
            x: 0,
            y: 0,
            z: 0,
        },
        zAcceleration = false,
        transparent = false,
        opacity = 100,
        hover = false,

    }) {
        super(
            new THREE.BoxGeometry(width, height, depth),
            new THREE.MeshStandardMaterial({
                color,
                transparent,
                opacity,

            })
        );
        this.width = width;
        this.height = height;
        this.depth = depth;

        this.points = points;

        this.position.set(position.x, position.y, position.z);

        this.right = this.position.x + this.width / 2;
        this.left = this.position.x - this.width / 2;

        this.front = this.position.z + this.depth / 2;
        this.back = this.position.z - this.depth / 2;

        this.bottom = this.position.y - this.height / 2;
        this.top = this.position.y + this.height / 2;

        this.velocity = velocity;
        this.gravity = -0.005;

        this.zAcceleration = zAcceleration;

        this.hover = hover;
    }

    updateSides() {
        this.right = this.position.x + this.width / 2;
        this.left = this.position.x - this.width / 2;

        this.bottom = this.position.y - this.height / 2;
        this.top = this.position.y + this.height / 2;

        this.front = this.position.z + this.depth / 2;
        this.back = this.position.z - this.depth / 2;
    }

    update(ground) {
        this.updateSides();

        if (this.zAcceleration) this.velocity.z += 0.0005;

        this.position.x += this.velocity.x;
        this.position.z += this.velocity.z;

        this.hoverUpdate(); // Aktualisieren Sie den Hover-Status

        this.applyGravity(ground);
    }

    hoverUpdate() {
        if (this.hover) {
            // Implementieren Sie die Logik, um die Box leicht nach oben und wieder nach unten zu bewegen
            // Zum Beispiel:
            this.position.y += 0.05; // Bewegt die Box leicht nach oben
            this.position.y -= 0.05; // Bewegt die Box leicht nach unten
        }
    }

    applyGravity(ground) {
        //GRAVITY
        this.velocity.y += this.gravity;

        if (
            boxCollisiom({
                box1: this,
                box2: ground,
            })
        ) {
            const friction = 0.1;
            this.velocity.y *= friction;
            this.velocity.y = -this.velocity.y;
        } else this.position.y += this.velocity.y;
    }
}

let portal_inner;

function load_glb() {
    const portal_rotate = new THREE.Object3D();

    loader.load("src/portal.glb", async function (gltf) {
        const model = gltf.scene;

        await renderer.compileAsync(model, camera, scene);

        const box = new THREE.Box3().setFromObject(gltf.scene);
        const c = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        gltf.scene.position.set(-c.x, size.y / 2 - c.y, -c.z);
        portal_rotate.add(gltf.scene);
        portal_rotate.scale.set(1.1, 1.1, 1.1);

        portal_rotate.position.z = -25;
        portal_rotate.position.x = 0.24;
        portal_rotate.position.y -= 2.5;
        portal_rotate.rotation.y += -7.8;

        scene.add(portal_rotate);
        portal_inner = portal_rotate.getObjectByName("Cube");
        portal_inner.material.color.set("#ff0000");
        let portal_frame01 = portal_rotate.getObjectByName("Plane");
        portal_frame01.material.color.set("#000000");
        portal_inner.name = "portal_inner";
    });
}

load_glb();

let startTimes = Date.now(); // Startzeitpunkt für den Farbwechsel
const duration = 2000; // Dauer des Farbwechsels in Millisekunden
let progress = 0; // Fortschritt des Farbwechsels
let start = true;

let animationFrameId = null;

function updateColor() {
    if (portal_inner) {
        if (start) {
            const currentTime = Date.now();
            const elapsedTime = currentTime - startTimes;
            progress = Math.min(elapsedTime / duration, 1); // Aktualisieren des Fortschritts des Farbwechsels

            // Berechnung der neuen Farbe basierend auf dem Fortschritt
            const startColor = new THREE.Color(0xff0000);
            const endColor = new THREE.Color(0x872d2d);

            // Aktualisieren der Farbe des Materials basierend auf dem Fortschritt
            portal_inner.material.color.set(
                startColor.lerp(endColor, progress)
            );

            // Überprüfung, ob der Farbwechsel abgeschlossen ist
            if (progress >= 0.99) {
                // Setzen des Startzeitpunkts zurück, um den Farbwechsel erneut zu starten
                startTimes = Date.now();
                progress = 0; // Reset des Fortschritts, um den Farbwechsel im nächsten Durchlauf zu starten
                start = !start; // Wechseln zwischen start und nicht-start
            }
        } else {
            const currentTime = Date.now();
            const elapsedTime = currentTime - startTimes;
            progress = Math.min(elapsedTime / duration, 1); // Aktualisieren des Fortschritts des Farbwechsels

            // Berechnung der neuen Farbe basierend auf dem Fortschritt
            const endColor = new THREE.Color(0xff0000);
            const startColor = new THREE.Color(0x872d2d);

            // Aktualisieren der Farbe des Materials basierend auf dem Fortschritt
            portal_inner.material.color.set(
                startColor.lerp(endColor, progress)
            );

            // Überprüfung, ob der Farbwechsel abgeschlossen ist
            if (progress >= 0.99) {
                // Setzen des Startzeitpunkts zurück, um den Farbwechsel erneut zu starten
                startTimes = Date.now();
                progress = 0; // Reset des Fortschritts, um den Farbwechsel im nächsten Durchlauf zu starten
                start = !start; // Wechseln zwischen start und nicht-start
            }
        }
    }
}

// Function that test if two boxes collide, very usefull
function boxCollisiom({ box1, box2 }) {
    const xCollision = box1.right >= box2.left && box1.left <= box2.right;
    const yCollsion =
        box1.bottom + box1.velocity.y <= box2.top && box1.top >= box2.bottom;
    const zCollision = box1.front >= box2.back && box1.back <= box2.front;

    return zCollision && xCollision && yCollsion;
}

//GEO & MAT For the Head and the Shild of the Cube/Player

const shildGeometry = new THREE.SphereGeometry(1.5, 32, 32);
const shildMaterial = new THREE.MeshStandardMaterial({
    color: shildColor.one.color,
    transparent: true,
    opacity: shildColor.one.opacity,
});
const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const sphereMaterial = new THREE.MeshStandardMaterial({
    color: "#A5FF29",
});
const shildSphere = new THREE.Mesh(shildGeometry, shildMaterial);
shildSphere.castShadow = true;
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
sphere.castShadow = true;
sphere.position.y += 0.8;

//function that initialize the a Mesh
function initMesh(meshtype) {
    const cube = new Box({
        width: 1,
        height: 1,
        depth: 1,
        position: {
            x: 0,
            y: 0,
            z: 0,
        },
        velocity: {
            x: 0,
            y: -0.01,
            z: 0,
        },
        transparent: true,
        opacity: 0,
    });

    cube.castShadow = true;

    const ground = new Box({
        width: 12,
        height: 0.5,
        depth: 50,
        color: "#ffffff",
        position: {
            x: 0,
            y: -2,
            z: 0,
        },
    });

    if (meshtype == "cube") {
        return cube;
    } else return ground;
}

//set Cube and Ground Mesh
let player_hat;
let player_arm_right;
let cube = initMesh("cube");
let ground = initMesh("ground");
ground.name = "Ground";

const shild_cube = new Box({
    width: 1,
    height: 1,
    depth: 1,
    position: {
        x: 0,
        y: 0,
        z: 0,
    },
    velocity: {
        x: 0,
        y: -0.01,
        z: 0,
    },
    transparent: true,
    opacity: 0,
});

let PlayerModel = new THREE.Object3D();
loader.load("src/Player.glb", function (gltf) {
    renderer.compile(gltf.scene, camera, scene);

    PlayerModel.add(gltf.scene);
    PlayerModel.position.y += 0.5;
    player_hat = PlayerModel.getObjectByName("Hat");
    player_arm_right = PlayerModel.getObjectByName("Cylinder_1");
});
let Player_shild_01 = new THREE.Object3D();
let Player_shild_02 = new THREE.Object3D();
let Player_shild_03 = new THREE.Object3D();

function load_Player_shield() {
    loader.load("src/shild.glb", function (gltf) {
        renderer.compile(gltf.scene, camera, scene);
        gltf.scene.scale.set(2, 2, 2);
        Player_shild_01.add(gltf.scene);
        Player_shild_01.castShadow = true;
    });

    loader.load("src/shild.glb", function (gltf) {
        renderer.compile(gltf.scene, camera, scene);
        gltf.scene.scale.set(2, 2, 2);
        Player_shild_02.add(gltf.scene);
        Player_shild_02.castShadow = true;
    });

    loader.load("src/shild.glb", function (gltf) {
        renderer.compile(gltf.scene, camera, scene);
        gltf.scene.scale.set(2, 2, 2);
        Player_shild_03.add(gltf.scene);
    });
}
load_Player_shield();

Player_shild_01.position.z += 1;
Player_shild_01.position.y += 0.5;

Player_shild_02.position.z -= 0.5;
Player_shild_02.position.x -= 1;
Player_shild_02.rotation.y = 4.2;
Player_shild_02.position.y += 0.5;

Player_shild_03.position.z -= 0.5;
Player_shild_03.position.x += 1;
Player_shild_03.rotation.y = -4.2;
Player_shild_03.position.y += 0.5;

shild_cube.add(Player_shild_01, Player_shild_02, Player_shild_03);
Player_shild_01.visible = false;
Player_shild_02.visible = false;
Player_shild_03.visible = false;
cube.add(shild_cube);
cube.add(PlayerModel);



textureLoader.load("src/rainbow3.jpg", function (texture) {
    // Hier können Sie den Code platzieren, der ausgeführt werden soll, nachdem die Textur geladen wurde.
    // Zum Beispiel, setzen Sie die Textur für die Grundfläche:
    ground.material.map = texture;
    ground.material.needsUpdate = true;
});

scene.add(cube, ground);

// Set Light Mesh
const light = new THREE.DirectionalLight(0xffffff, 3);
light.castShadow = true;

const ambLight = new THREE.AmbientLight(0xffffff, 1);

light.position.y = 3;
light.position.z = 1;
scene.add(light, ambLight);

// Keys for Moving
const keys = {
    a: {
        pressed: false,
    },
    d: {
        pressed: false,
    },
    s: {
        pressed: false,
    },
    w: {
        pressed: false,
    },
    shift: {
        pressed: false,
    },
};
// Junp Cooldown so you dont double jump
function startJumpCooldown() {
    canJump = false;
    setTimeout(() => {
        canJump = true;
    }, 1200);
}
let pause = false;
let nuke_cooldown = true;
let KeyQ = false;
// Key Event Listener down
window.addEventListener("keydown", (event) => {
    if (play || pause) {
        switch (event.code) {
            case "KeyA":
            case "ArrowLeft":
                keys.a.pressed = true;
                break;
            case "KeyD":
            case "ArrowRight":
                keys.d.pressed = true;
                break;
            case "KeyS":
            case "ArrowDown":
                keys.s.pressed = true;
                break;
            case "KeyW":
            case "ArrowUp":
                keys.w.pressed = true;
                break;
            case "Space":
                if (canJump) {
                    cube.velocity.y = 0.17;
                    startJumpCooldown();
                }
                break;

            case "ShiftLeft":
                if (canShoot && bulletcount > 0) {
                    bulletcount -= 1;
                    bulletEl.innerHTML = bulletcount;
                    spawnBullet();
                    canShoot = false;
                    setTimeout(() => {
                        canShoot = true;
                    }, 100);
                }
                break;

            case "KeyQ":
                if (nuke_cooldown) {
                    nuke_cooldown = false;
                    spawnNuke();
                    setTimeout(() => {
                        nuke_cooldown = true;
                    }, 4000);
                }
                break;
            case "Escape":
                // Pausieren des Spiels
                if (!pause) {
                    play = false;
                    pause = true;
                    modalEl.style.visibility = "visible";
                    bigScoreEL.innerHTML = timeString;
                    startGameBtn.classList.add("hidden");
                    ContinueGameBtn.classList.remove("hidden");
                } else {
                    // Fortsetzen des Spiels
                    modalEl.style.visibility = "hidden";
                    ContinueGameBtn.classList.add("hidden");
                    play = true;
                    pause = false;
                    animate();
                }

                break;
        }
    }
});

ContinueGameBtn.addEventListener("click", () => {
    // Fortsetzen des Spiels
    modalEl.style.visibility = "hidden";
    ContinueGameBtn.classList.add("hidden");
    play = true;
    pause = false;
    animate();
});

// Keys Event Listener up
window.addEventListener("keyup", (event) => {
    if (play) {
        switch (event.code) {
            case "KeyA":
                keys.a.pressed = false;
                break;
            case "KeyD":
                keys.d.pressed = false;
                break;
            case "KeyS":
                keys.s.pressed = false;
                break;
            case "KeyW":
                keys.w.pressed = false;
                break;
        }
    }
});

// function that moves the cube/Player

function moveCube() {
    const movespeed = 0.07;

    cube.velocity.x = 0;
    cube.velocity.z = 0;
    if (keys.a.pressed) cube.velocity.x = -movespeed;
    else if (keys.d.pressed) cube.velocity.x = movespeed;
    if (cube.position.z > -18.5) {
        if (keys.w.pressed) cube.velocity.z = -movespeed;
    }
    if (keys.s.pressed) cube.velocity.z = movespeed;
}

// set the shield color relates to how much life you have
function setShildColor(action) {
    shildSphere.material.color.set(shildColor[action].color);
    shildSphere.material.opacity = shildColor[action].opacity;
}

// Spawns partciales with the points mesh
function spawnParticles(mesh, type) {
    let particlesMaterial;
    let particlesGeometry;
    // Initialisieren Sie die Partikel
    if (type == "death") {
        particlesGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(500 * 3); // 1000 Partikel * 3 Koordinaten (x, y, z)

        for (let i = 0; i < 500; i++) {
            const particle = new THREE.Vector3(
                mesh.position.x + Math.random() * 2 - 1,
                mesh.position.y + Math.random() * 2 - 1,
                mesh.position.z + Math.random() * 2 - 1
            );
            positions[i * 3] = particle.x;
            positions[i * 3 + 1] = particle.y;
            positions[i * 3 + 2] = particle.z;
        }

        particlesGeometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3)
        );

        particlesMaterial = new THREE.PointsMaterial({
            size: 0.1,
            sizeAttenuation: true,
            color: 0x00ff00,
        });
    } else if (type == "hit") {
        particlesGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(500 * 3); // 1000 Partikel * 3 Koordinaten (x, y, z)

        for (let i = 0; i < 500; i++) {
            const particle = new THREE.Vector3(
                mesh.position.x + Math.random() * 2 - 1,
                mesh.position.y + Math.random() * 2 - 1,
                mesh.position.z + Math.random() * 2 - 1
            );
            positions[i * 3] = particle.x;
            positions[i * 3 + 1] = particle.y;
            positions[i * 3 + 2] = particle.z;
        }

        particlesGeometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3)
        );

        particlesMaterial = new THREE.PointsMaterial({
            size: 0.2,
            sizeAttenuation: true,
            color: "darkred",
        });
    } else {
        particlesGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(1000 * 3); // 1000 Partikel * 3 Koordinaten (x, y, z)

        for (let i = 0; i < 1000; i++) {
            const particle = new THREE.Vector3(
                mesh.position.x + Math.random() * 2 - 1,
                mesh.position.y + Math.random() * 2 - 1,
                mesh.position.z + Math.random() * 2 - 1
            );
            positions[i * 3] = particle.x;
            positions[i * 3 + 1] = particle.y;
            positions[i * 3 + 2] = particle.z;
        }

        particlesGeometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3)
        );
        let color;
        if (shildLives == 3) {
            color = shildColor.three.color;
        } else if (shildLives == 2) {
            color = shildColor.two.color;
        } else if (shildLives == 1) {
            color = shildColor.one.color;
        }

        particlesMaterial = new THREE.PointsMaterial({
            size: 0.2,
            sizeAttenuation: true,
            color: color,
        });
    }
    particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
}

function displayandUpdateScreenInfos() {
    let elapsedTime = Date.now() - startTime;
    let minutes = Math.floor(elapsedTime / 60000);
    let seconds = Math.floor((elapsedTime % 60000) / 1000);
    timeString = `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    scoreEL.innerHTML = timeString;

    livesEl.innerHTML = lives;

    shildEl.innerHTML = shildLives;
}

function checkIfDeathByFall() {
    if (cube.top <= ground.bottom) {
        cube.velocity.x = 0;
        cube.velocity.z = 0;
        play = false;

        bigScoreEL.innerHTML = timeString;

        resetGame();
    }
}

function checkIfDeathByEnemy() {
    if (lives == 1 && shildLives == 0) {
        lives -= 1;
        bigScoreEL.innerHTML = timeString;

        cube.velocity.x = 0;
        cube.velocity.z = 0;
        keys.w.pressed = false;
        keys.a.pressed = false;
        keys.s.pressed = false;
        keys.d.pressed = false;
        if (cubeVisible) {
            cube.visible = false;
            cubeVisible = false;
            spawnParticles(cube, "death");
        }

        setTimeout(resetGame, 1000);
    } else {
        if (shildLives > 0) {
            shildLives -= 1;
        } else {
            spawnParticles(cube, "hit");
            lives -= 1;
        }
    }

    EnemyHit = true;
}

function unload(target) {
    target.removeFromParent();

    target.traverse(function (child) {
        // Disposing materials
        if (child.material && typeof child.material.dispose === "function") {
            child.material.dispose();
        }

        // Disposing geometries
        if (child.geometry && typeof child.geometry.dispose === "function") {
            child.geometry.dispose();
        }
    });
}

const Nuke_model = new THREE.Object3D();
function spawnNuke() {
    const NukeBox = new Box({
        width: 15,
        height: 5,
        depth: 1,
        position: {
            x: cube.position.x,
            y: cube.position.y + 2,
            z: cube.position.z - 2,
        },
        velocity: {
            x: 0,
            y: 0,
            z: -1,
        },
        transparent: true,
        opacity: 0,
        zAcceleration: false,
    });

    loader.load("src/Fat_Man.glb", function (gltf) {
        renderer.compile(gltf.scene, camera, scene);

        Nuke_model.add(gltf.scene);
        //Nuke_model.scale.set(0.001, 0.001, 0.001);
    });
    Nuke_model.rotation.y = Math.PI / -2;

    NukeBox.add(Nuke_model);
    scene.add(NukeBox);
    nukes.push(NukeBox);
    if (Nuke_model.scale.x == 120) {
        Nuke_model.scale.x = 1;
        Nuke_model.scale.y = 1;
        Nuke_model.scale.z = 1;
    }
    const scaleTween = new TWEEN.Tween(Nuke_model.scale)
        .to({ x: 120, y: 120, z: 120 }, 2000) // Zielwert und Dauer der Skalierung
        .onComplete(() => {
            
            nuke_ready = true;
        })
        .start();
}

function spawnBullet() {
    const bulletbox = new Box({
        width: 1,
        height: 1,
        depth: 1,
        position: {
            x: cube.position.x,
            y: cube.position.y,
            z: cube.position.z - 1,
        },
        velocity: {
            x: 0,
            y: 0,
            z: -1,
        },
        transparent: true,
        opacity: 0,
        zAcceleration: true,
    });

    let BulletModel = new THREE.Object3D();
    loader.load("src/bullet.glb", function (gltf) {
        renderer.compile(gltf.scene, camera, scene);

        BulletModel.add(gltf.scene);
    });

    bulletbox.add(BulletModel);
    scene.add(bulletbox);
    bullets.push(bulletbox);
}

let enemySpeed = 0.05;
let item_speed = 0.06;
function resetGame() {
    renderer.dispose();

    elapsedTime = 0;
    spawnrate = 300;
    lives = 3;
    enemySpeed = 0.05;
    item_speed = 0.06;
    shildLives = 0;

    scene.traverse(function (child) {
        if (child instanceof THREE.Mesh && child.name != "portal_inner") {
            child.geometry.dispose();
            child.material.dispose();
        }
    });

    scene.remove.apply(scene, scene.children);

    lastSpeedIncreaseTime = Date.now();

    keys.w.pressed = false;
    keys.a.pressed = false;
    keys.s.pressed = false;
    keys.d.pressed = false;
    keys.shift.pressed = false;

    enemies = [];
    shildItems = [];
    bulletItems = [];
    bullets = [];

    cube = initMesh("cube");
    ground = initMesh("ground");

    load_glb();
    textureLoader.load("src/rainbow3.jpg", function (texture) {
        ground.material.map = texture;
        ground.material.needsUpdate = true;
        ground.receiveShadow = true;
    });

    let PlayerModel = new THREE.Object3D();

    loader.load("src/Player.glb", function (gltf) {
        renderer.compile(gltf.scene, camera, scene);

        PlayerModel.add(gltf.scene);
        PlayerModel.position.y += 0.5;
        player_hat = PlayerModel.getObjectByName("Hat");
    });

    load_Player_shield();
    shild_cube.add(Player_shild_01, Player_shild_02, Player_shild_03);
    Player_shild_01.visible = false;
    Player_shild_02.visible = false;
    Player_shild_03.visible = false;
   
    cube.add(PlayerModel, shild_cube);

    cube.velocity.x = 0;
    cube.velocity.y = 0;
    cube.velocity.z = 0;

    scene.add(cube, ground, light, ambLight);

    startGameBtn.classList.add("hidden");
    modalEl.style.visibility = "visible";
    titleText.style.visibility = "visible";
    gameOverEl.classList.remove("hidden");
    restartGameBtn.classList.remove("hidden");
    restartGameBtn.style.removeProperty("visibility");

    particlesSpawned = true;
    play = false;
}

function changeHeadColor() {
    if (lives == 3) {
        player_hat.material.color.set("#1DF7DD");
    } else if (lives == 2) {
        player_hat.material.color.set("#f7a71d");
    } else if (lives == 1) {
        player_hat.material.color.set("#f04f43");
    }
}

function updateShild() {
    if (shildLives >= 3) {
        Player_shild_01.visible = true;
        Player_shild_02.visible = true;
        Player_shild_03.visible = true;
        shild_cube.rotation.y += 0.08;
    } else if (shildLives == 2) {
        shild_cube.rotation.y += 0.04;
        Player_shild_01.visible = true;
        Player_shild_02.visible = true;
        Player_shild_03.visible = false;
    } else if (shildLives == 1) {
        shild_cube.rotation.y += 0.02;
        Player_shild_01.visible = true;
        Player_shild_02.visible = false;
        Player_shild_03.visible = false;
    } else {
        Player_shild_01.visible = false;
        Player_shild_02.visible = false;
        Player_shild_03.visible = false;
    }
}

function animate() {
    if (play) {
        if (particlesSpawned) {
            elapsedTime += 1;
        }

        requestAnimationFrame(animate);

        moveCube();
        checkIfDeathByFall();
        if (portal_inner && play != false) {
            updateColor();
        }
        updateShild();
        displayandUpdateScreenInfos();
        changeHeadColor();
        cube.update(ground);
        if (nuke_ready) {
            nukes.forEach((nuk, index) => {
                nuk.update(ground);

                if (nuk.top < ground.bottom) {
                    nukes.splice(index, 1);
                    scene.remove(nuk);
                    unload(nuk);
                    nuke_ready = false;
                }
                enemies.forEach((enem, index_c) => {
                    if (
                        boxCollisiom({
                            box1: nuk,
                            box2: enem,
                        })
                    ) {
                        points += enem.points;
                        pointsEL.innerHTML = points;
                      
                        scene.remove(enem);
                        enemies.splice(index_c, 1);
                        unload(enem);
                    }
                });
            });
        }

        enemies.forEach((enemy, index) => {
            enemy.update(ground);
            if (
                boxCollisiom({
                    box1: cube,
                    box2: enemy,
                })
            ) {
                if (!EnemyHit) {
                    checkIfDeathByEnemy(enemy);
                    scene.remove(enemy);
                    unload(enemy);
                    setTimeout(() => {
                        EnemyHit = false;
                    }, 500);
                }
            }
            bullets.forEach((bullet, index_b) => {
                if (
                    boxCollisiom({
                        box1: enemy,
                        box2: bullet,
                    })
                ) {
                    points += enemy.points;
                    pointsEL.innerHTML = points;
                    
                    unload(enemy);
                    unload(bullet);
                    scene.remove(enemy, bullet);
                    enemies.splice(index, 1);
                    bullets.splice(index_b, 1);
                }
                if (bullet.top < ground.bottom) {
                    bullets.splice(index, 1);
                    unload(bullet);
                    scene.remove(bullet);
                }
            });

            if (enemy.top < ground.bottom) {
                unload(enemy);
                scene.remove(enemy);
                enemies.splice(index, 1);
            }
        });

        bullets.forEach((bullet) => {
            bullet.update(ground);
        });

        bulletItems.forEach((bulletitem, index) => {
            bulletitem.rotation.y += 0.05;
            bulletitem.update(ground);
            if (
                boxCollisiom({
                    box1: cube,
                    box2: bulletitem,
                })
            ) {
                if (!bulletHit) {
                    if (bulletcount < 10) {
                        for (let i = 0; i < 5; i++) {
                            bulletcount++;
                            if (bulletcount == 10) break;
                        }

                        bulletEl.innerHTML = bulletcount;
                    }
                    bulletHit = true;
                    setTimeout(() => {
                        bulletHit = false;
                    }, 1000);
                    scene.remove(bulletitem);
                }
            }
            if (bulletitem.top < ground.bottom) {
                bulletItems.splice(index, 1);
                scene.remove(bulletitem);
                unload(bulletitem);
            }
        });

        heartItems.forEach((HeartBox, index) => {
            HeartBox.update(ground);

            HeartBox.rotation.y += 0.05;

            if (
                boxCollisiom({
                    box1: cube,
                    box2: HeartBox,
                })
            ) {
                if (!bulletHit) {
                    if (lives < 3) {
                        lives += 1;
                        livesEl.innerHTML = lives;
                        changeHeadColor();
                    }
                    capsuleHit = true;
                    setTimeout(() => {
                        capsuleHit = false;
                    }, 1000);
                    scene.remove(HeartBox);
                }
            }
            if (HeartBox.top < ground.bottom) {
                heartItems.splice(index, 1);
                scene.remove(HeartBox);
                unload(HeartBox);
            }
        });

        shildItems.forEach((shild, index) => {
            shild.rotation.y += 0.05;
            shild.update(ground);
            if (
                boxCollisiom({
                    box1: cube,
                    box2: shild,
                })
            ) {
                if (!ShildHit) {
                    if (shildLives < 3) {
                        shildLives += 1;
                        shildItems.splice(index, 1);
                        scene.remove(shild);
                        unload(shild);
                    }
                    ShildHit = true;
                    setTimeout(() => {
                        ShildHit = false;
                    }, 1000);
                }
            }
            if (shild.top < ground.bottom) {
                shildItems.splice(index, 1);
                scene.remove(shild);
                unload(shild);
            }
        });

        if (frames % spawnrate === 0) {
            if (
                Date.now() - lastSpeedIncreaseTime >= speedIncreaseInterval &&
                enemySpeed <= 0.3
            ) {
                // Erhöhen Sie die Geschwindigkeit der Gegner
                enemySpeed += 0.01; // Erhöhen Sie die Geschwindigkeit um 0.01
                item_speed += 0.01;
                // Aktualisieren Sie den Zeitpunkt des letzten Erhöhens
                lastSpeedIncreaseTime = Date.now();
            }

            if (spawnrate > 30) spawnrate -= 30;
            const randomValue = Math.random();
            //const randomValue = 0.025;
            let result;

            if (randomValue <= 0.02) {
                // 2% Chance für "heart"
                result = "heart";
            } else if (randomValue <= 0.07) {
                // 5% Chance für "bullet"
                result = "bullet";
            } else if (randomValue <= 0.12) {
                // 5% Chance für "shield"
                result = "shield";
            } else {
                // Restliche 88% Chance für "enemy"
                result = "enemy";
            }

            if (result == "enemy" && spawnEnemy) {
                const ModelEnemy = new THREE.Object3D();
                const enemy = new Box({
                    width: 1,
                    height: 2,
                    depth: 1,
                    position: {
                        x: (Math.random() - 0.5) * 10.9,
                        y: 2,
                        z: -23,
                    },

                    velocity: {
                        x: 0,
                        y: 0,
                        z: enemySpeed,
                    },
                    color: "darkred",
                    zAcceleration: true,
                    transparent: true,
                    opacity: 0,
                });
                enemy.name = "Enemy";

                loader.load("src/Enemy.glb", function (gltf) {
                    renderer.compile(gltf.scene, camera, scene);

                    ModelEnemy.add(gltf.scene);
                    //ModelEnemy.position.y -= 0.5;
                });

                ModelEnemy.castShadow = true;
                enemy.add(ModelEnemy);
                scene.add(enemy);

                enemies.push(enemy);
            } else if (result == "shield" && spawnShild) {
                const ShildModel = new THREE.Object3D();
                const shilditem = new Box({
                    width: 1,
                    height: 1,
                    depth: 1,
                    position: {
                        x: (Math.random() - 0.5) * 10.9,
                        y: 0.5,
                        z: -20,
                    },
                    velocity: {
                        x: 0,
                        y: 0,
                        z: item_speed,
                    },
                    zAcceleration: true,
                    transparent: true,
                    opacity: 0,
                });
                shilditem.name = "Shield_item";
                loader.load("src/shild.glb", function (gltf) {
                    renderer.compile(gltf.scene, camera, scene);
                    gltf.scene.scale.set(2, 2, 2);
                    ShildModel.add(gltf.scene);
                    ShildModel.castShadow = true;
                    ShildModel.position.y += 0.5;
                });

                shilditem.add(ShildModel);
                scene.add(shilditem);
                shildItems.push(shilditem);
            } else if (result == "bullet" && spawnBullets) {
                const bulletModel = new THREE.Object3D();
                const bulletItem = new Box({
                    width: 1,
                    height: 1,
                    depth: 1,
                    position: {
                        x: (Math.random() - 0.5) * 10.9,
                        y: 1,
                        z: -20,
                    },
                    velocity: {
                        x: 0,
                        y: 0,
                        z: item_speed,
                    },
                    zAcceleration: true,
                    transparent: true,
                    opacity: 0,
                });
                bulletItem.name = "Bullet_item";
                loader.load("src/bullets.glb", function (gltf) {
                    renderer.compile(gltf.scene, camera, scene);

                    bulletModel.add(gltf.scene);
                    bulletModel.castShadow = true;
                });

                bulletItem.add(bulletModel);

                scene.add(bulletItem);
                bulletItems.push(bulletItem);
            } else if (result == "heart" && spawnHeart) {
                const heartModel = new THREE.Object3D();
                const heartBox = new Box({
                    width: 1,
                    height: 1,
                    depth: 1,
                    position: {
                        x: (Math.random() - 0.5) * 10.9,
                        y: 1,
                        z: -20,
                    },
                    velocity: {
                        x: 0,
                        y: 0,
                        z: item_speed,
                    },
                    zAcceleration: true,
                    transparent: true,
                    opacity: 0,
                    hover: true,
                });
                heartBox.name = "heart_item";
                loader.load("src/heart2.glb", function (gltf) {
                    renderer.compile(gltf.scene, camera, scene);

                    //gltf.scene.position.y = -1.8;
                    heartModel.add(gltf.scene);
                });

                heartModel.castShadow = true;
                heartBox.add(heartModel);
                scene.add(heartBox);
                heartItems.push(heartBox);
            }
        }

        if (particles && elapsedTime <= maxFallTime) {
            const positions = particles.geometry.attributes.position.array;

            // Überprüfen, ob alle Partikel unter ground.bottom fallen sind
            let allUnderGround = true;
            for (let i = 0; i < positions.length; i += 3) {
                const y = positions[i + 1]; // Y-Koordinate des Partikels

                if (y >= ground.bottom) {
                    allUnderGround = false;
                    break; // Wenn ein Partikel noch über ground.bottom liegt, stoppen wir die Schleife
                }
            }

            // Wenn alle Partikel unter ground.bottom fallen sind, entfernen wir sie aus der Szene
            if (allUnderGround) {
                scene.remove(particles);
                particles.geometry.dispose();
                particles.material.dispose();
                elapsedTime = 0; // Resetze elapsedTime, falls gewünscht
            } else {
                // Aktualisiere die Positionen der Partikel
                for (let i = 0; i < positions.length; i += 3) {
                    const x = positions[i];
                    const y = positions[i + 1];
                    const z = positions[i + 2];

                    positions[i] =
                        x + Math.random() * spreadSpeed - spreadSpeed / 2;
                    positions[i + 1] = y - fallSpeed;
                    positions[i + 2] =
                        z + Math.random() * spreadSpeed - spreadSpeed / 2;
                }

                particles.geometry.attributes.position.needsUpdate = true;
            }
        }

        //checkIfScored();

        frames++;
    }
    renderer.render(scene, camera);
    TWEEN.update();
}

function startGame() {
    startTime = Date.now();
    animate();
    modalEl.style.visibility = "hidden";
    titleText.style.visibility = "hidden";
    scoreDiv.classList.toggle("hidden");
}

startGameBtn.addEventListener("click", () => {
    startGame();
});

restartGameBtn.addEventListener("click", () => {
    startTime = Date.now();
    play = true;
    cubeVisible = true;
    modalEl.style.visibility = "hidden";
    restartGameBtn.style.visibility = "hidden";
    titleText.style.visibility = "hidden";
    animate();
});
