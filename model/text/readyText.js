import loadText from "./loadText";
import { gsap } from "gsap";
import { scene, gameAttribute } from "../../final";

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
    //console.log(`text: ${text}, color: ${color}`);
    textMesh = await loadText(text, 2, 0.5, color, { x: 0, y: 5, z: 480 });
    scene.add(textMesh);
    console.log(`text mesh: ${textMesh}`);
    await new Promise((resolve) => setTimeout(resolve, 200));
    await fadeOutAndRemove(textMesh, 200);
  }
  // Khi hiển thị xong tất cả text
  gameAttribute.isPlayerReady = true;
}

export { loadReadyTexts };
