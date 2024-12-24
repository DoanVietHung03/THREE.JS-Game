import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

export default function loadText(
  text,
  textSize,
  textHeight,
  textColor,
  textPosition
) {
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
