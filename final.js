import * as THREE from "three";
import { Howl } from "howler";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { gsap } from "gsap";
import * as dat from "dat.gui";

let playerAttribute = {
  velocity: 0, // Vận tốc ban đầu (0 khi đứng yên)
  isJumping: false, // Trạng thái nhảy
  isMovingLeft: false,
  isMovingRight: false,

  gravity: -0.005, // Gia tốc trọng trường (âm vì vật rơi xuống)
  moveSpeed: 0.17, // Sức mạnh của cú nhảy (vận tốc ban đầu khi nhảy)
};
let cameraAttribute = {
  initX: 0,
  initY: 1,
  initZ: 5,
};
let gameAttribute = {
  isPlayerReady: false,
  // Biến lưu điểm số
  score: 0,
  // Biến lưu trạng thái game
  isGameStarted: false, // Game đang chạy hay không
  isPaused: false, // Game tạm dừng hay không
  isGameOver: false,
  isCountReady: false,
};

// Hàm di chuyển nhân vật giữa các làn
const lanes = [-3.75, 0, 3.75]; // Các vị trí x của làn
let currentLane = 1; // Vị trí làn hiện tại (0: trái, 1: giữa, 2: phải)
let gui, menuOptions;

//------Nhạc nền------
// Tạo đối tượng âm thanh
const bg_sound = new Howl({
  src: ['/sound/bg_music.mp3'],  // Đường dẫn đến file âm thanh
  volume: 0.5,              // Âm lượng
  loop: true                // Lặp lại âm thanh
});

// Phát âm thanh
bg_sound.play();

//-------các âm thanh va chạm-------
function playSoundForDuration(src, duration = 2000) {
  const sound = new Howl({
      src: [src],
      volume: 0.5,  // Điều chỉnh âm lượng (có thể thay đổi theo nhu cầu)
  });

  // Phát âm thanh
  sound.play();

  // Dừng âm thanh sau khoảng thời gian (mặc định là 2 giây)
  setTimeout(() => {
      sound.stop();  // Dừng âm thanh sau thời gian đã chỉ định
      console.log(`Âm thanh đã dừng sau ${duration / 1000} giây.`);
  }, duration);  // duration là thời gian dừng (tính bằng ms)
}


// Khởi tạo scene, camera và renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  50
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMapSoft = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const loader = new THREE.TextureLoader();
const sky_texture = loader.load("texture/sky.jpg");
// Bầu trời ban ngày
scene.background = sky_texture;

// Ánh sáng môi trường
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

// Ánh sáng định hướng
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.castShadow = true;

scene.add(directionalLight);
directionalLight.position.set(-10, 5, 0);
directionalLight.target.position.set(0, 0, 0); // Set target of the light

// Set up the shadow camera for directional light
directionalLight.shadow.camera.left = -500;
directionalLight.shadow.camera.right = 500;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 30;

directionalLight.shadow.bias = -0.00001; // Điều chỉnh bias để bóng không bị lệch
directionalLight.shadow.mapSize.set(8192, 8192); // Đặt độ phân giải bóng cao hơn

function setShadowsForAllObjects(scene) {
  scene.traverse((object) => {
    if (object.isMesh) {
      // Kiểm tra nếu đối tượng là mesh
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
}

//Cát
const sandTexture = loader.load("texture/sand.jpg"); // Đường dẫn tới texture cát
sandTexture.wrapS = THREE.RepeatWrapping; // Lặp texture theo trục S (ngang)
sandTexture.wrapT = THREE.RepeatWrapping; // Lặp texture theo trục T (dọc)
sandTexture.repeat.set(50, 50); // Số lần lặp texture trên mặt đất

// 3. Tạo mặt phẳng mặt đất với texture
const groundGeometry = new THREE.PlaneGeometry(10000, 10000); // Kích thước mặt đất
const groundMaterial = new THREE.MeshStandardMaterial({
  map: sandTexture, // Texture được áp dụng
  roughness: 1, // Độ nhám để làm cát không bóng
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Nằm ngang
ground.position.y = -0.03; // Vị trí mặt đất
ground.receiveShadow = true;
scene.add(ground);

// Đường đi
const planeGeometry = new THREE.PlaneGeometry(10, 1000);
const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;
scene.add(plane);

// Vạch kẻ đường
const LineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
for (let i = -2.5; i <= 2.5; i += 2.5) {
  if (i == 0) {
    continue;
  } else {
    for (let z = 496; z > -494; z -= 5) {
      const LineGeometry = new THREE.PlaneGeometry(0.5, 3);
      const Line = new THREE.Mesh(LineGeometry, LineMaterial);
      Line.rotation.x = -Math.PI / 2;
      Line.position.set(i, 0.03, z - 3);
      scene.add(Line);
    }
  }
}

// Vạch xuất phát
const startLineGeometry = new THREE.PlaneGeometry(10, 1); // Vạch rộng 20, dày 1
const startLineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const startLine = new THREE.Mesh(startLineGeometry, startLineMaterial);
startLine.rotation.x = -Math.PI / 2; // Đặt nằm ngang
startLine.position.set(0, 0.01, 497); // Đặt ở đầu đường đua
scene.add(startLine);

// Vạch đích (cờ caro)
const squareSize = 1; // Kích thước mỗi ô vuông
const numSquares = 10; // Số ô vuông trên mỗi hàng (tùy chỉnh theo chiều rộng đường đua)
const finishLineWidth = numSquares * squareSize; // Chiều rộng của vạch đích
const finishLineLength = 3; // Chiều dài của vạch đích
const startZ = -496; // Vị trí z của vạch đích

for (let row = 0; row < finishLineLength / squareSize; row++) {
  for (let col = 0; col < numSquares; col++) {
    // Tính toán màu xen kẽ
    const isBlack = (row + col) % 2 === 0;
    const color = isBlack ? 0x000000 : 0xffffff;

    // Tạo hình vuông (mặt phẳng nhỏ)
    const squareGeometry = new THREE.PlaneGeometry(squareSize, squareSize);
    const squareMaterial = new THREE.MeshBasicMaterial({ color: color });
    const square = new THREE.Mesh(squareGeometry, squareMaterial);

    // Xoay mặt phẳng để nằm ngang
    square.rotation.x = -Math.PI / 2;

    // Đặt vị trí cho ô vuông
    const x = col * squareSize - finishLineWidth / 2 + squareSize / 2;
    const z = startZ + row * squareSize - finishLineLength / 2;
    square.position.set(x, 0.01, z);

    // Thêm vào cảnh
    scene.add(square);
  }
}

// Tải nhân vật
let model = new THREE.Object3D();

let mixer; // AnimationMixer
const model_loader = new GLTFLoader();
model_loader.load(
  "GLB_Models/firefly_minecraft.glb", // Đường dẫn đến tệp .glb
  (gltf) => {
    model.add(gltf.scene);
    model.position.set(0, 0, 498);
    model.scale.set(0.7, 0.7, 0.7);
    // Lặp qua tất cả các đối tượng trong model
    model.traverse((object) => {
      if (object.isMesh) {
        // Kiểm tra nếu đối tượng là mesh
        object.castShadow = true; // Đặt castShadow cho mesh
        object.receiveShadow = true; // Đặt receiveShadow cho mesh
      }
    });
    scene.add(model);

    mixer = new THREE.AnimationMixer(model);

    // Duyệt qua các hoạt hình trong mô hình (nếu có) và thêm chúng vào mixer
    gltf.animations.forEach((clip) => {
      mixer.clipAction(clip).play();
    });
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded"); // Hiển thị tiến độ tải
  },
  (error) => {
    console.error("An error occurred while loading the model:", error);
  }
);

function loadText(text, textSize, textHeight, textColor, textPosition) {
  return new Promise((resolve, reject) => {
    const text_loader = new FontLoader();
    text_loader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      function (font) {
        const textGeometry = new TextGeometry(text, {
          font: font,
          size: textSize,
          depth: textHeight,
        });

        // Tính toán bounding box của geometry
        textGeometry.computeBoundingBox();
        const boundingBox = textGeometry.boundingBox;
        const width = boundingBox.max.x - boundingBox.min.x;
        const height = boundingBox.max.y - boundingBox.min.y;

        const textMaterial = new THREE.MeshBasicMaterial({
          color: textColor,
        });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);

        // Đặt vị trí trung tâm
        textMesh.position.set(
          -width / 2 + textPosition.x,
          -height / 2 + textPosition.y,
          textPosition.z
        );

        resolve(textMesh); // Trả về textMesh sau khi tạo xong
      },
      undefined,
      function (error) {
        reject(`Loi tai font ${error}`); // Xử lý lỗi nếu tải font thất bại
      }
    );
  });
}

async function loadReadyTexts() {
  // Hàm fade out bên trong loadReadyTexts
  async function fadeOutAndRemove(mesh, duration) {
    return new Promise((resolve) => {
      gsap.to(mesh.material, {
        opacity: 0, // Đặt opacity về 0
        duration: duration / 1000, // Thời gian thực hiện (tính bằng giây)
        onComplete: () => {
          scene.remove(mesh); // Xóa mesh khỏi scene sau khi fade-out xong
          resolve(); // Kết thúc Promise
        },
      });
    });
  }

  let textMesh;
  const textArray = [
    { text: "Ready!", color: 0xffffff },
    { text: "3", color: 0xff0000 },
    { text: "2", color: 0xff0000 },
    { text: "1", color: 0xff0000 },
    { text: "Go!", color: 0x00ff00 },
  ];

  for (const { text, color } of textArray) {
    console.log(`text: ${text}, color: ${color}`);
    textMesh = await loadText(text, 2, 0.5, color, { x: 0, y: 5, z: 480 });
    scene.add(textMesh);
    console.log(`text mesh: ${textMesh}`);
    await new Promise((resolve) => setTimeout(resolve, 200));
    await fadeOutAndRemove(textMesh, 200);
  }
  // Khi hiển thị xong tất cả text
  gameAttribute.isPlayerReady = true;
}

//---background---
const bg_loader = new GLTFLoader();
let mixers = [];

// Hàm tải mô hình cây
function loadTreeModel(modelPath, positionX, positionZ) {
  let tree = new THREE.Object3D();
  bg_loader.load(
    modelPath,
    (gltf) => {
      tree.add(gltf.scene);
      tree.position.set(positionX, 0, positionZ); // Đặt vị trí cây
      tree.scale.set(0.7, 0.7, 0.7);
      scene.add(tree);

      // Tạo AnimationMixer nếu mô hình có animation
      let mixer = new THREE.AnimationMixer(gltf.scene);
      mixers.push(mixer);
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    (error) => {
      console.error("An error occurred while loading the model:", error);
    }
  );
}

// Hàm chọn ngẫu nhiên bên trái hoặc phải và mô hình cây
function getRandomSideAndModel() {
  const models = ["/GLB_Models/tree_1.glb", "/GLB_Models/tree_2.glb"];
  const randomModel = models[Math.floor(Math.random() * models.length)];
  let positionX, positionZ;

  // Vùng cấm (vị trí đường)
  const roadWidth = 10; // Chiều rộng đường (tính từ tâm)
  const roadLength = 1000; // Chiều dài đường
  const roadCenterZ = 0; // Tâm đường theo trục Z

  // Đặt cây ở vùng nằm ngoài đường
  do {
    positionX = Math.random() * 70 - 50; // Ngẫu nhiên từ -50 đến 50 trên trục X
    positionZ = Math.random() * 1000 - 250; // Ngẫu nhiên từ -250 đến 250 trên trục Z
  } while (Math.abs(positionX) < roadWidth / 2 && // Tránh vùng đường trên trục X
           positionZ > roadCenterZ - roadLength / 2 && 
           positionZ < roadCenterZ + roadLength / 2); // Tránh vùng đường trên trục Z
  return { modelPath: randomModel, positionX, positionZ };
}

// Tải mô hình xen kẽ ngẫu nhiên
for (let i = 0; i < 10; i++) {
  const { modelPath, positionX, positionZ } = getRandomSideAndModel();
  loadTreeModel(modelPath, positionX, positionZ);
}

// Load obstacles và coins
const obs_co_loader = new GLTFLoader();

// Đường dẫn đến GLB folders
const GLB_links = [
  "/GLB_Models/flying_car_1.glb",
  "/GLB_Models/flying_car_2.glb",
  "/GLB_Models/coin.glb",
];

// Cache các mô hình đã tải
const ObsCache = [];
const CoinCache = [];

function loadObsCoModel(GLB_links, type) {
  return new Promise((resolve, reject) => {
    if (type === "obstacle") {
      const modelPath = GLB_links.filter((link) => link.includes("car"));
      if (modelPath.length === 0) {
        console.log(`Không tìm thấy mô hình cho ${type}.`);
        resolve(); // Trả về rỗng nếu không có mô hình nào
        return;
      }

      const promises = modelPath.map((ObsLink) =>
        new Promise((resolve) => {
          obs_co_loader.load(
            ObsLink,
            (gltf) => {
              let obs = new THREE.Object3D();
              obs.add(gltf.scene);
              obs.scale.set(0.7, 0.7, 0.7);
              ObsCache.push(obs);

              // Tạo AnimationMixer nếu mô hình có animation
              let mixer = new THREE.AnimationMixer(gltf.scene);
              mixers.push(mixer);

              resolve(); // Hoàn thành việc tải
            },
            undefined,
            (error) => {
              console.error("Lỗi khi tải mô hình:", error);
              resolve(); // Tiếp tục dù có lỗi
            }
          );
        })
      );

      Promise.all(promises).then(() => {
        console.log("Tất cả mô hình obstacle đã được tải:");
        ObsCache.forEach((object, index) => {
          console.log(`Phần tử ${index}: ${object.position.x}`, object);
        });
        resolve();
      });
    } else if (type === "coin") {
      const modelPath = GLB_links.filter((link) => link.includes("coin"));
      if (modelPath.length === 0) {
        console.log(`Không tìm thấy mô hình cho ${type}.`);
        resolve(); // Trả về rỗng nếu không có mô hình nào
        return;
      }

      const promises = modelPath.map((CoinLink) =>
        new Promise((resolve) => {
          obs_co_loader.load(
            CoinLink,
            (gltf) => {
              let co = new THREE.Object3D();
              co.add(gltf.scene);
              co.scale.set(0.02, 0.02, 0.02);
              co.rotation.x = Math.PI / 2;
              CoinCache.push(co);

              // Tạo AnimationMixer nếu mô hình có animation
              let mixer = new THREE.AnimationMixer(gltf.scene);
              mixers.push(mixer);

              resolve(); // Hoàn thành việc tải
            },
            undefined,
            (error) => {
              console.error("Lỗi khi tải mô hình:", error);
              resolve(); // Tiếp tục dù có lỗi
            }
          );
        })
      );

      Promise.all(promises).then(() => {
        console.log("Tất cả mô hình coin đã được tải:");
        CoinCache.forEach((object, index) => {
          console.log(`Phần tử ${index}:`, object);
        });
        resolve();
      });
    } else {
      console.log('Invalid type. Use "obstacle" or "coin".');
      resolve(); // Trả về rỗng nếu type không hợp lệ
    }
  });
}


async function generateObjects(objectArray, count, minZ, maxZ, type) {
  const segmentLength = (maxZ - minZ) / count; // Độ dài mỗi đoạn
  for (let i = 0; i < count; i++) {
    const lane = Math.floor(Math.random() * 3) - 1; // Chỉ định làn (-1, 0, 1)
    const zPosition = maxZ - i * segmentLength - (Math.random() * segmentLength) / 2;
    const positionX = lane * 3.75; // Xác định vị trí X dựa trên làn chạy
    
    let object;
    
    // Đợi tải xong đối tượng từ cache
    if (type === "obstacle") {
      while (ObsCache.length === 0) {
        console.log("Đang chờ mô hình obstacle...");
        await new Promise((resolve) => setTimeout(resolve, 100)); // Chờ 100ms trước khi kiểm tra lại
      }
      object = ObsCache[Math.floor(Math.random() * ObsCache.length)].clone(); // Clone đối tượng chướng ngại vật
    } else if (type === "coin") {
      while (CoinCache.length === 0) {
        console.log("Đang chờ mô hình coin...");
        await new Promise((resolve) => setTimeout(resolve, 100)); // Chờ 100ms trước khi kiểm tra lại
      }
      object = CoinCache[Math.floor(Math.random() * CoinCache.length)].clone(); // Clone đối tượng tiền vàng
    }
    
    if (!object) {
      console.error(`Không thể load mô hình ${type}`);
      continue;
    } 

    // Đặt vị trí cho đối tượng
    object.position.set(positionX, 0.3, zPosition);

    // Thêm đối tượng vào scene và mảng
    scene.add(object);
    objectArray.push(object);
    
    // Đảm bảo chướng ngại vật không chồng lên tiền vàng
    if (type === "obstacle") {
      const isColliding = coins.some((coin) => {
        const coinBox = new THREE.Box3().setFromObject(coin);
        const obstacleBox = new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(positionX, 0, zPosition),
          new THREE.Vector3(1, 1, 1) // Kích thước mặc định của chướng ngại vật
        );
        return coinBox.intersectsBox(obstacleBox);
      });
      if (isColliding) continue; // Bỏ qua nếu có va chạm
    }
  }
}

const coins = [];
const obstacles = [];

(async () => {
  await loadObsCoModel(GLB_links, "coin");
  await loadObsCoModel(GLB_links, "obstacle");
  await generateObjects(coins, 30, -485, 485, "coin");
  await generateObjects(obstacles, 100, -485, 485, "obstacle");
})();

// Camera cố định trục X, giữ nguyên vị trí trục Z
camera.position.set(
  cameraAttribute.initX,
  cameraAttribute.initY,
  cameraAttribute.initZ
);
camera.lookAt(new THREE.Vector3(0, 0.5, 0));

// Xử lý bàn phím
const keys = { left: false, right: false, up: false };
document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") keys.left = true;
  if (event.key === "ArrowRight") keys.right = true;
  if (event.key === "ArrowUp") keys.up = true;
  if (event.key === "Enter") {
    if (!gameAttribute.isGameStarted) {
      gameAttribute.isGameStarted = true; // Bắt đầu game nếu chưa bắt đầu
      console.log("Game Start");
    } else if (gameAttribute.isPaused) {
      gameAttribute.isPaused = false; // Tiếp tục game nếu đang tạm dừng
      console.log("Game Resumed");
    }
  }
  if (event.code === "Space" && gameAttribute.isGameStarted) {
    gameAttribute.isPaused = true; // Tạm dừng game
    console.log("Game Paused");
  }
});
document.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft") keys.left = false;
  if (event.key === "ArrowRight") keys.right = false;
  if (event.key === "ArrowUp") keys.up = false;
});

function checkCollision(object1, object2, scaleFactor = 0.7) {
  const box1 = new THREE.Box3().setFromObject(object1);
  const box2 = new THREE.Box3().setFromObject(object2);

  // Thu nhỏ box1
  const size1 = new THREE.Vector3();
  box1.getSize(size1);
  const center1 = new THREE.Vector3();
  box1.getCenter(center1);
  const scaledBox1 = new THREE.Box3(
    center1.clone().sub(size1.clone().multiplyScalar(0.5 * scaleFactor)),
    center1.clone().add(size1.clone().multiplyScalar(0.5 * scaleFactor))
  );

  // Thu nhỏ box2
  const size2 = new THREE.Vector3();
  box2.getSize(size2);
  const center2 = new THREE.Vector3();
  box2.getCenter(center2);
  const scaledBox2 = new THREE.Box3(
    center2.clone().sub(size2.clone().multiplyScalar(0.5 * scaleFactor)),
    center2.clone().add(size2.clone().multiplyScalar(0.5 * scaleFactor))
  );

  // Kiểm tra va chạm
  return scaledBox1.intersectsBox(scaledBox2);
}

function movePlayer(moveSpeed) {
  model.position.x += moveSpeed;
  camera.position.x = model.position.x;
}

// Vòng lặp render và cập nhật animation
const clock = new THREE.Clock();

let a = 0;
// Animation loop
function animate() {
  if (!gameAttribute.isGameStarted || gameAttribute.isPaused) {
    // Thay đổi offset theo thời gian (lặp lại)
    sky_texture.offset.x += 0.00001; // Điều chỉnh tốc độ
    sky_texture.offset.y += 0.000005; // Điều chỉnh tốc độ
    // Nếu game chưa bắt đầu hoặc đang tạm dừng, chỉ render cảnh mà không di chuyển
    camera.position.z = model.position.z + 3;
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  } else if (!gameAttribute.isPlayerReady) {
    if (!gameAttribute.isCountReady) {
      a++;
      console.log(`a: ${a}`);
      loadReadyTexts();
      gameAttribute.isCountReady = true;
    }
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  } else {
    sky_texture.offset.x += 0.00001; // Điều chỉnh tốc độ
    sky_texture.offset.y += 0.000005; // Điều chỉnh tốc độ
    
    requestAnimationFrame(animate);
    if (gameAttribute.isGameOver) return; // Dừng game nếu trạng thái là kết thúc

    // Cập nhật mixer, tạo animation cho model (đom đóm đập cánhcánh)
    if (mixer) {
      mixer.update(clock.getDelta()); // Cập nhật hoạt hình theo thời gian
    }

    // Nhân vật chạy về phía trước
    if (model.position.z > -495) {
      model.position.z -= 0.2;
    } else {
      console.log("You reached the end of the road!");
      gameAttribute.isGameOver = true; // Dừng game khi đạt cuối đường
      return;
    }

    // Điều khiển nhân vật
    if (keys.left && !playerAttribute.isMovingRight) {
      if (!playerAttribute.isMovingLeft && currentLane > 0) {
        playSoundForDuration("/sound/jump_effect.mp3");
        model.rotation.z = Math.PI/4;
        currentLane--;
        playerAttribute.isMovingLeft = true;
      }
    }
    if (playerAttribute.isMovingLeft) {
      //tọa độ giảm dần với tốc độ là moveSpeed
      movePlayer(-playerAttribute.moveSpeed);

      //Kiểm tra dừng
      if (model.position.x < lanes[currentLane]) {
        model.position.x = lanes[currentLane];
        camera.position.x = model.position.x;
        model.rotation.z = 0;
        playerAttribute.isMovingLeft = false;
        keys.left = false;
      }
    }
    if (keys.right && !playerAttribute.isMovingLeft) {
      if (!playerAttribute.isMovingRight && currentLane < lanes.length - 1) {
        playSoundForDuration("/sound/jump_effect.mp3");
        model.rotation.z = -Math.PI/4;
        currentLane++;
        playerAttribute.isMovingRight = true;
      }
    }
    if (playerAttribute.isMovingRight) {
      //tọa độ tăng dần với tốc độ là moveSpeed
      movePlayer(playerAttribute.moveSpeed);

      //Kiểm tra dừng
      if (model.position.x > lanes[currentLane]) {
        model.position.x = lanes[currentLane];
        camera.position.x = model.position.x;
        model.rotation.z = 0;
        playerAttribute.isMovingRight = false;
        keys.right = false;
      }
    }

    if (keys.up && !playerAttribute.isJumping && model.position.y === 0) {
      playSoundForDuration("/sound/jump_effect.mp3");
      playerAttribute.isJumping = true; // Đánh dấu là đang nhảy
      playerAttribute.velocity = playerAttribute.moveSpeed; // Đặt vận tốc ban đầu khi nhảy
    }

    if (playerAttribute.isJumping) {
      playerAttribute.velocity += playerAttribute.gravity; // Áp dụng lực hấp dẫn

      model.position.y += playerAttribute.velocity; // Cập nhật vị trí của đối tượng
      camera.position.y = model.position.y + cameraAttribute.initY;
      // Kiểm tra khi đối tượng chạm đất
      if (model.position.y <= 0) {
        model.position.y = 0; // Đảm bảo đối tượng không đi dưới mặt đất
        playerAttribute.isJumping = false; // Kết thúc trạng thái nhảy
        playerAttribute.velocity = 0; // Đặt lại vận tốc sau khi chạm đất
      }
    }

    // Cập nhật vị trí camera theo trục Z
    camera.position.z = model.position.z + 3;

    // Kiểm tra va chạm với tiền vàng
    coins.forEach((coin, index) => {
      if (checkCollision(model, coin)) {
        scene.remove(coin);
        coins.splice(index, 1);
        gameAttribute.score += 10;
        console.log("Score:", gameAttribute.score);
        playSoundForDuration('/sound/coin_effect.mp3');
      }
    });

    // Kiểm tra va chạm với chướng ngại vật
    obstacles.forEach((obstacle) => {
      if (checkCollision(model, obstacle)) {
        console.log("Game Over!");
        bg_sound.stop();
        playSoundForDuration('/sound/die_sound.mp3', 3000);
        console.log("sound");
        gameAttribute.isGameOver = true;
        showGameOverMenu();
      }
    });

    renderer.render(scene, camera);
  }
}
setShadowsForAllObjects(scene);
// Đảm bảo texture lặp lại
sky_texture.wrapS = THREE.RepeatWrapping;
sky_texture.wrapT = THREE.RepeatWrapping;
sky_texture.repeat.set(0.5, 0.5);

animate();

function restartGame() {
  // Đặt lại trạng thái game
  gameAttribute.isGameStarted = false;
  gameAttribute.isPaused = false;
  gameAttribute.isGameOver = false;
  gameAttribute.isCountReady = false;
  gameAttribute.score = 0; // Đặt lại điểm số

  // Đặt lại trạng thái nhân vật
  model.position.set(0, 0, 497); // Đặt lại vị trí nhân vật
  //model.rotation.set(0, 0, 0); // Đặt lại góc xoay nhân vật
  playerAttribute.isJumping = false; // Đặt lại trạng thái nhảy
  playerAttribute.isMovingLeft = false;
  playerAttribute.isMovingRight = false;

  // Xóa các vật thể (tiền vàng, chướng ngại vật) đã tạo
  coins.forEach((coin) => scene.remove(coin));
  obstacles.forEach((obstacle) => scene.remove(obstacle));

  // Tạo lại các vật thể mới
  coins.length = 0; // Xóa mảng coins
  obstacles.length = 0; // Xóa mảng obstacles

  generateObjects(coins, coinGeometry, coinMaterial, 30, -485, 485, "coin");

  generateObjects(obstacles, obstacleGeometry, obstacleMaterial, 100, -485, 485, "obstacle");

  // Đặt lại camera
  camera.position.set(
    cameraAttribute.initX,
    cameraAttribute.initY,
    cameraAttribute.initZ
  );
  camera.lookAt(new THREE.Vector3(0, 0.5, 0));

  // Tiến hành reset GUI nếu cần
  if (gui) {
    gui.destroy();
    gui = null;
  }
  animate();
}

// Hàm gọi khi game over
function showGameOverMenu() {
  // Tạo GUI để chọn Play Again hoặc Quit
  gui = new dat.GUI();

  menuOptions = {
    "Play Again": () => {
      console.log("Restarting game...");
      restartGame();
    },
    Quit: () => {
      console.log("Exiting game...");
      //quitGame();
    },
  };

  gui.add(menuOptions, "Play Again");
  gui.add(menuOptions, "Quit");
}
