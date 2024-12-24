import * as THREE from "three";
import {
  gameAttribute,
  playerAttribute,
  model,
  coins,
  obstacles,
  camera,
  cameraAttribute,
} from "./final";

function setShadowsForAllObjects(scene) {
  scene.traverse((object) => {
    if (object.isMesh) {
      // Kiểm tra nếu đối tượng là mesh
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
}

function disableShadowsForAllObjects(scene) {
  scene.traverse((object) => {
    if (object.isMesh) {
      // Kiểm tra nếu đối tượng là mesh
      object.castShadow = false;
      object.receiveShadow = false;
    }
  });
}

function restartGame() {
  // Đặt lại trạng thái game
  gameAttribute.isPlayerReady = false;
  gameAttribute.score = 0; // Đặt lại điểm số
  gameAttribute.isGameStarted = false;
  gameAttribute.isPaused = false;
  gameAttribute.isGameOver = false;
  gameAttribute.isCountReady = false;

  // isPlayerReady: false, // Biến lưu điểm số
  // score: 0, // Biến lưu trạng thái game
  // isGameStarted: false, // Game đang chạy hay không
  // isPaused: false, // Game tạm dừng hay không
  // isGameOver: false,
  // isCountReady: false,

  //model.rotation.set(0, 0, 0); // Đặt lại góc xoay nhân vật
  playerAttribute.velocity = 0;
  playerAttribute.isJumping = false; // Đặt lại trạng thái nhảy
  playerAttribute.isMovingLeft = false;
  playerAttribute.isMovingRight = false;
  playerAttribute.gravity = -0.006;
  playerAttribute.moveSpeed = 0.17;

  // Đặt lại trạng thái nhân vật
  model.position.set(
    playerAttribute.initX,
    playerAttribute.initY,
    playerAttribute.initZ
  ); // Đặt lại vị trí nhân vật

  // velocity: 0, // Vận tốc ban đầu (0 khi đứng yên)
  // isJumping: false, // Trạng thái nhảy
  // isMovingLeft: false,
  // isMovingRight: false,
  // gravity: -0.006, // Gia tốc trọng trường (âm vì vật rơi xuống)
  // moveSpeed: 0.17, // Sức mạnh của cú nhảy (vận tốc ban đầu khi nhảy)
  // initX: 0,
  // initY: 0,
  // initZ: 490,

  // Xóa các vật thể (tiền vàng, chướng ngại vật) đã tạo
  coins.forEach((coin) => scene.remove(coin));
  obstacles.forEach((obstacle) => scene.remove(obstacle));

  // Tạo lại các vật thể mới
  coins.length = 0; // Xóa mảng coins
  obstacles.length = 0; // Xóa mảng obstacles
  // Tạo tiền vàng
  (async () => {
    await loadObsCoModel(GLB_links, "coin");
    await loadObsCoModel(GLB_links, "obstacle");
    await generateObjects(coins, 30, -485, 485, "coin");
    await generateObjects(obstacles, 100, -485, 485, "obstacle");
  })();

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

export { restartGame, disableShadowsForAllObjects, setShadowsForAllObjects };
