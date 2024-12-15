import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Khởi tạo scene, camera và renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.background = new THREE.Color(0x87ceeb);

// Ánh sáng
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(0, 10, 10);
scene.add(directionalLight);

// Sàn đường ray
const planeGeometry = new THREE.PlaneGeometry(10, 1000);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x555555 });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

// Vạch kẻ đường
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
for (let i = -2.5; i <= 2.5; i += 2.5) {
  if (i == 0) {
    continue;
  } else {
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(i, 0.01, -500),
      new THREE.Vector3(i, 0.01, 500),
    ]);

    const line = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(line);
  }
}

// Nhân vật chính
const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
const playerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.set(0, 0.5, 495);
scene.add(player);

// Tải mô hình .glb
let model;
const loader = new GLTFLoader();
loader.load(
  "/firefly_minecraft.glb", // Đường dẫn đến tệp .glb
  (gltf) => {
    console.log("Model loaded:", gltf);
    model = gltf.scene;
    model.position.set(0, 0, 500);
    scene.add(model);
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded"); // Hiển thị tiến độ tải
  },
  (error) => {
    console.error("An error occurred while loading the model:", error);
  }
);

// Hàm tạo ngẫu nhiên vị trí các vật thể
function generateObjects(
  objectArray,
  geometry,
  material,
  count,
  minZ,
  maxZ,
  type
) {
  const segmentLength = (maxZ - minZ) / count; // Độ dài mỗi đoạn
  for (let i = 0; i < count; i++) {
    const object = new THREE.Mesh(geometry, material);
    const lane = Math.floor(Math.random() * 3) - 1; // Chỉ định làn (-1, 0, 1)
    const zPosition =
      maxZ - i * segmentLength - (Math.random() * segmentLength) / 2;

    object.position.set(
      lane * 3.75, // Xác định làn chạy
      0.5, // Fixed Y position
      zPosition // Random Z position trong đoạn
    );

    // Đảm bảo chướng ngại vật không chồng lên tiền vàng
    if (type === "obstacle") {
      const isColliding = coins.some((coin) => {
        return (
          Math.abs(coin.position.z - object.position.z) < 5 &&
          Math.abs(coin.position.x - object.position.x) < 1
        );
      });
      if (isColliding) continue; // Bỏ qua nếu có va chạm
    }

    scene.add(object);
    objectArray.push(object);
  }
}

const coins = [];
const coinGeometry = new THREE.SphereGeometry(0.3, 16, 16);
const coinMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });

const obstacles = [];
const obstacleGeometry = new THREE.BoxGeometry(1, 1, 1);
const obstacleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

// Tiền vàng
generateObjects(coins, coinGeometry, coinMaterial, 30, -495, 490, "coin");

// Chướng ngại vật
generateObjects(
  obstacles,
  obstacleGeometry,
  obstacleMaterial,
  30,
  -495,
  490,
  "obstacle"
);

// Camera cố định trục X, giữ nguyên vị trí trục Z
camera.position.set(0, 5, 10);
camera.lookAt(new THREE.Vector3(0, 0.5, 0));

// Biến lưu điểm số
let score = 0;
// Biến lưu trạng thái game
let isGameStarted = false; // Game đang chạy hay không
let isPaused = false; // Game tạm dừng hay không
let isGameOver = false;

// Xử lý bàn phím
const keys = { left: false, right: false, up: false };
document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") keys.left = true;
  if (event.key === "ArrowRight") keys.right = true;
  if (event.key === "ArrowUp") keys.up = true;
  if (event.key === "Enter") {
    if (!isGameStarted) {
      isGameStarted = true; // Bắt đầu game nếu chưa bắt đầu
      console.log("Game Start");
    } else if (isPaused) {
      isPaused = false; // Tiếp tục game nếu đang tạm dừng
      console.log("Game Resumed");
    }
  }
  if (event.code === "Space" && isGameStarted) {
    isPaused = true; // Tạm dừng game
    console.log("Game Paused");
  }
});
document.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft") keys.left = false;
  if (event.key === "ArrowRight") keys.right = false;
  if (event.key === "ArrowUp") keys.up = false;
});

// Hàm kiểm tra va chạm
function checkCollision(object1, object2) {
  const box1 = new THREE.Box3().setFromObject(object1);
  const box2 = new THREE.Box3().setFromObject(object2);
  return box1.intersectsBox(box2);
}

// Hàm di chuyển nhân vật giữa các làn
const lanes = [-3.75, 0, 3.75]; // Các vị trí x của làn
let currentLane = 1; // Vị trí làn hiện tại (0: trái, 1: giữa, 2: phải)

function movePlayer() {
  model.position.x = lanes[currentLane];
}

// Animation loop
function animate() {
  if (!model) {
    camera.position.z = model.position.z + 10;
    renderer.render(scene, camera);
    return;
  }
  
  if (!isGameStarted || isPaused) {
    // Nếu game chưa bắt đầu hoặc đang tạm dừng, chỉ render cảnh mà không di chuyển
    camera.position.z = model.position.z + 10;
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  } 
  else {
    if (isGameOver) return; // Dừng game nếu trạng thái là kết thúc

    requestAnimationFrame(animate);

    // Nhân vật chạy về phía trước
    if (player.position.z > -495) {
      player.position.z -= 0.1;
    } else {
      console.log("You reached the end of the road!");
      isGameOver = true; // Dừng game khi đạt cuối đường
      return;
    }

    // Điều khiển nhân vật
    if (keys.left && currentLane > 0) {
      currentLane--;
      movePlayer();
      keys.left = false; // Tránh di chuyển liên tục
    }
    if (keys.right && currentLane < lanes.length - 1) {
      currentLane++;
      movePlayer();
      keys.right = false; // Tránh di chuyển liên tục
    }
    if (keys.up && player.position.y === 0.5) {
      player.position.y += 3;
      setTimeout(() => (player.position.y -= 3), 500); // Nhảy lên rồi trở về vị trí cũ
    }

    // Cập nhật vị trí camera theo trục Z
    camera.position.z = player.position.z + 10;

    // Kiểm tra va chạm với tiền vàng
    coins.forEach((coin, index) => {
      if (checkCollision(player, coin)) {
        scene.remove(coin);
        coins.splice(index, 1);
        score += 10;
        console.log("Score:", score);
      }
    });

    // Kiểm tra va chạm với chướng ngại vật
    obstacles.forEach((obstacle) => {
      if (checkCollision(player, obstacle)) {
        console.log("Game Over!");
        isGameOver = true;
      }
    });

    renderer.render(scene, camera);
  }
}

animate();
