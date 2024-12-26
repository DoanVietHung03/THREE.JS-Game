import * as THREE from "three";
import { Howl } from "howler";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { gsap } from "gsap";
import * as dat from "dat.gui";
import {
  resumeSound,
  pauseSound,
  stopSound,
  playSound,
  addSound,
  playSoundForDuration,
  createAllSounds,
} from "./game_components/sound";
import { ambientLight, directionalLight } from "./world_components/light";
import { ground } from "./world_components/ground";
import { sky_texture } from "./world_components/sky";
import {
  restartGame,
  disableShadowsForAllObjects,
  setShadowsForAllObjects,
} from "./utils";
import { plane } from "./world_components/plane";
import { lines, startLine, finishLine } from "./world_components/lines";
import { model, playerAttribute } from "./model/player/player";
import { loadReadyTexts } from "./model/text/readyText";
import { camera, cameraAttribute } from "./game_components/camera";
import { renderer } from "./game_components/renderer";
import { scene } from "./game_components/scene";
import { mixers } from "./game_components/animation";

let gameAttribute = {
  isPlayerReady: false, // Biến lưu điểm số
  score: 0, // Biến lưu trạng thái game
  isGameStarted: false, // Game đang chạy hay không
  isPaused: false, // Game tạm dừng hay không
  isGameOver: false,
  isCountReady: false,
};

let soundCache = createAllSounds();

// Các làn (logic)
const lanes = [-3.75, 0, 3.75]; // Các vị trí x của làn
let currentLane = 1; // Vị trí làn hiện tại (0: trái, 1: giữa, 2: phải)
let gui, menuOptions;

document.body.appendChild(renderer.domElement);

// Bầu trời ban ngày
scene.background = sky_texture;

// Ánh sáng môi trường
scene.add(ambientLight);

// Ánh sáng định hướng
scene.add(directionalLight);

//Ground
scene.add(ground);

// Đường đi
scene.add(plane);

// Vạch kẻ đường
scene.add(...lines);

// Vạch xuất phát
scene.add(startLine);

// Vạch đích (cờ caro)
scene.add(...finishLine);

// Tải nhân vật
scene.add(model);

//---background---
const tree_loader = new GLTFLoader();

// Hàm tải mô hình cây
const TreeCache = [];

const Tree_links = ["/GLB_Models/tree_1.glb", "/GLB_Models/tree_2.glb"];

function loadTreeModel(Tree_links) {
  return new Promise((resolve, reject) => {
    if (Tree_links.length === 0) {
      console.log("Không tìm thấy mô hình");
      resolve();
      return;
    }

    const promises = Tree_links.map(
      (treeLinks) =>
        new Promise((resolve) => {
          tree_loader.load(
            treeLinks,
            (gltf) => {
              let trees = new THREE.Object3D();
              trees.add(gltf.scene);
              trees.scale.set(0.7, 0.7, 0.7);
              TreeCache.push(trees);

              resolve();
            },
            undefined,
            (error) => {
              console.error("Lỗi khi tải mô hình:", error);
              resolve();
            }
          );
        })
    );

    Promise.all(promises).then(() => {
      console.log("Tất cả mô hình tree đã được tải:");
      TreeCache.forEach((object, index) => {
        console.log(`Phần tử tree ${index}: ${object.position.x}`, object);
      });
      resolve();
    });
  });
}

// Hàm chọn ngẫu nhiên bên trái hoặc phải và mô hình cây
async function generateTreeRandom(count) {
  // Vùng cấm (vị trí đường)
  const roadWidth = 10; // Chiều rộng đường (tính từ tâm)
  const roadLength = 1000; // Chiều dài đường
  const roadCenterZ = 0; // Tâm đường theo trục Z

  for (let i = 0; i < count; i++) {
    let positionX, positionZ;

    do {
      positionX = Math.random() * 70 - 50; // Ngẫu nhiên 2 bên trên trục X
      positionZ = Math.random() * roadLength - 500; // Ngẫu nhiên trên trục Z
    } while (
      Math.abs(positionX) < roadWidth / 2 && // Tránh vùng đường trên trục X
      positionZ > roadCenterZ - roadLength / 2 &&
      positionZ < roadCenterZ + roadLength / 2
    );

    let object;

    // Đợi tải xong đối tượng từ cache
    while (TreeCache.length === 0) {
      console.log("Đang chờ mô hình tree...");
      await new Promise((resolve) => setTimeout(resolve, 100)); // Chờ 100ms trước khi kiểm tra lại
    }
    object = TreeCache[Math.floor(Math.random() * TreeCache.length)].clone();

    if (!object) {
      console.error(`Không thể load mô hình ${type}`);
      continue;
    }

    // Đặt vị trí cho đối tượng
    object.position.set(positionX, 0.2, positionZ);

    // Thêm đối tượng vào scene và mảng
    scene.add(object);
  }
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
      const promises = modelPath.map(
        (ObsLink) =>
          new Promise((resolve) => {
            obs_co_loader.load(
              ObsLink,
              (gltf) => {
                const obs = new THREE.Object3D();
                obs.add(gltf.scene);
                obs.animations = gltf.animations; // Đính kèm animations từ gltf
                // console.log('obs anim:', obs.animations);
                obs.scale.set(0.7, 0.7, 0.7);
                ObsCache.push(obs.clone());
                
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
          console.log(`Phần tử obs ${index}: ${object.position.x}`, object);
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

      const promises = modelPath.map(
        (CoinLink) =>
          new Promise((resolve) => {
            obs_co_loader.load(
              CoinLink,
              (gltf) => {
                const co = new THREE.Object3D();
                co.add(gltf.scene);
                co.scale.set(0.02, 0.02, 0.02);
                co.rotation.x = Math.PI / 2;
                CoinCache.push(co);

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
          console.log(`Phần tử coin ${index}:`, object);
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
    const zPosition =
      maxZ - i * segmentLength - (Math.random() * segmentLength) / 2;
    const positionX = lane * 3.75; // Xác định vị trí X dựa trên làn chạy

    let object;

    // Đợi tải xong đối tượng từ cache
    if (type === "obstacle") {
      while (ObsCache.length === 0) {
        console.log("Đang chờ mô hình obstacle...");
        await new Promise((resolve) => setTimeout(resolve, 100)); // Chờ 100ms trước khi kiểm tra lại
      }
      let obsRand = Math.floor(Math.random() * ObsCache.length);
      object = ObsCache[obsRand].clone(true); // Clone đối tượng chướng ngại vật
      object.animations = ObsCache[obsRand].animations; //gltf.animations

      // Tạo AnimationMixer nếu mô hình có animation
      console.log('obs clone:', object);

      if (object.animations && object.animations.length > 0) {
        let mixer = new THREE.AnimationMixer(object);

        mixer.timeScale = obsRand === 0 ? 2 : 0.5;
        mixers.push(mixer);
  
        // Duyệt qua các hoạt hình trong mô hình (nếu có) và thêm chúng vào mixer
        object.animations.forEach((clip) => {
          mixer.clipAction(clip).play();
        });
      } else {
        console.log('Object clone không có animation');
      }
    } else if (type === "coin") {
      while (CoinCache.length === 0) {
        console.log("Đang chờ mô hình coin...");
        await new Promise((resolve) => setTimeout(resolve, 100)); // Chờ 100ms trước khi kiểm tra lại
      }
      let coinRand = Math.floor(Math.random() * CoinCache.length);
      object = CoinCache[coinRand].clone(true); // Clone đối tượng tiền vàng
    }

    if (!object) {
      console.error(`Không thể load mô hình ${type}`);
      continue;
    }

    // Đặt vị trí cho đối tượng
    object.position.set(positionX, 0.7, zPosition);

    // Thêm đối tượng vào scene và mảng
    scene.add(object);
    objectArray.push(object);

    // Đảm bảo chướng ngại vật không chồng lên tiền vàng
    if (type === "obstacle") {
      const padding = 1.5;
      const isColliding = coins.some((coin) => {
        const coinBox = new THREE.Box3().setFromObject(coin);
        const obstacleBox = new THREE.Box3().setFromCenterAndSize(
          new THREE.Vector3(positionX, 0, zPosition),
          new THREE.Vector3(1 + padding, 1 + padding, 1 + padding) // Kích thước mặc định của chướng ngại vật
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
  await loadTreeModel(Tree_links);
  await loadObsCoModel(GLB_links, "coin");
  await loadObsCoModel(GLB_links, "obstacle");
  await generateTreeRandom(150);
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
      resumeSound(soundCache, "sound/bg_music.mp3");
    }
  }
  if (event.code === "Space" && gameAttribute.isGameStarted) {
    gameAttribute.isPaused = true; // Tạm dừng game
    console.log("Game Paused");
    pauseSound(soundCache, "sound/bg_music.mp3");
  }
});
document.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft") keys.left = false;
  if (event.key === "ArrowRight") keys.right = false;
  if (event.key === "ArrowUp") keys.up = false;
});

// Hàm kiểm tra va chạm
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

// Animation loop
function animate() {
  if (!gameAttribute.isGameStarted || gameAttribute.isPaused) {
    // Nếu game chưa bắt đầu hoặc đang tạm dừng, chỉ render cảnh mà không di chuyển
    // Thay đổi offset theo thời gian (lặp lại)
    sky_texture.offset.x += 0.00001; // Điều chỉnh tốc độ
    sky_texture.offset.y += 0.000005; // Điều chỉnh tốc độ
    // Nếu game chưa bắt đầu hoặc đang tạm dừng, chỉ render cảnh mà không di chuyển
    camera.position.z = model.position.z + 3;
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  } else if (!gameAttribute.isPlayerReady) {
    // Nếu chưa đếm ngược xong (người chơi chưa sẵn sàng), người chơi không thể di chuyển
    if (!gameAttribute.isCountReady) {
      //Khi đang đếm ngược, in lần lượt những dòng chữ
      loadReadyTexts();
      //Sau khi in xong sẽ tính là đã đếm ngược xong
      gameAttribute.isCountReady = true;
      playSound(soundCache, "sound/bg_music.mp3");
    }
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  } else {
    sky_texture.offset.x += 0.00001; // Điều chỉnh tốc độ
    sky_texture.offset.y += 0.000005; // Điều chỉnh tốc độ

    requestAnimationFrame(animate);
    if (gameAttribute.isGameOver) return; // Dừng game nếu trạng thái là kết thúc

    const delta = clock.getDelta();
    // Cập nhật mixer, tạo animation cho model
    mixers.forEach((mixer) => {
      if (mixer) mixer.update(delta); // Cập nhật tất cả mixers
    });

    // Nhân vật chạy về phía trước
    if (model.position.z > -495) {
      model.position.z -= playerAttribute.moveSpeed;
    } else {
      console.log("You reached the end of the road!");
      gameAttribute.isGameOver = true; // Dừng game khi đạt cuối đường
      return;
    }

    // Điều khiển nhân vật
    if (keys.left && !playerAttribute.isMovingRight) {
      if (!playerAttribute.isMovingLeft && currentLane > 0) {
        playSoundForDuration(soundCache, "sound/jump_effect.mp3");
        model.rotation.z = Math.PI / 4;
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
        playSoundForDuration(soundCache, "sound/jump_effect.mp3");
        model.rotation.z = -Math.PI / 4;
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
      playSoundForDuration(soundCache, "sound/jump_effect.mp3");
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
        camera.position.y = cameraAttribute.initY;
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
        playSoundForDuration(soundCache, "sound/coin_effect.mp3");
      }
    });

    // Kiểm tra va chạm với chướng ngại vật
    obstacles.forEach((obstacle) => {
      if (checkCollision(model, obstacle)) {
        console.log("Game Over!");
        playSoundForDuration(soundCache, "sound/die_sound.mp3", 3000);
        stopSound(soundCache, "sound/bg_music.mp3");
        gameAttribute.isGameOver = true;
        //showGameOverMenu();
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

export {
  scene,
  gameAttribute,
  playerAttribute,
  model,
  coins,
  obstacles,
  camera,
  cameraAttribute,
};
