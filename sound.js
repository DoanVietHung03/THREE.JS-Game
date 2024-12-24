import { Howl } from "howler";

// Hàm tạo âm thanh và lưu vào cache
function createSound(src, volume = 0.5) {
  const sound = new Howl({
    src: [src],
    volume, // Điều chỉnh âm lượng
  });
  if (src === "sound/bg_music.mp3") {
    sound.loop(true);
  } else {
    sound.loop(false);
  }
  //console.log(`Âm thanh từ "${src}" đã được tạo.`);
  return sound;
}

// Hàm phát âm thanh bất đồng bộ với thời gian dừng mượt mà
async function playSoundForDuration(soundCache, src, duration = 1000) {
  const sound = soundCache[src];
  if (!sound) {
    throw new Error(
      `Âm thanh từ "${src}" chưa được tạo. Vui lòng gọi createSound trước.`
    );
  }

  // Phát âm thanh
  sound.play();
  //console.log(`Đang phát âm thanh từ "${src}".`);

  // Đợi hiệu ứng fade-out hoàn tất
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Dừng hoàn toàn âm thanh
  // sound.seek(0);
  console.log(
    `Âm thanh từ "${src}" đã dừng sau ${
      duration / 1000
    } giây với hiệu ứng fade.`
  );
}

// Hàm phát âm thanh bất đồng bộ mà không có fade-out hoặc dừng âm thanh
async function playSound(soundCache, src) {
  const sound = soundCache[src];
  if (!sound) {
    throw new Error(
      `Âm thanh từ "${src}" chưa được tạo. Vui lòng gọi createSound trước.`
    );
  }

  // Phát âm thanh ngay lập tức
  sound.play();
  //console.log(`Đang phát âm thanh từ "${src}".`);
}

// Hàm phát âm thanh bất đồng bộ mà không có fade-out hoặc dừng âm thanh
async function stopSound(soundCache, src) {
  const sound = soundCache[src];
  if (!sound) {
    throw new Error(
      `Âm thanh từ "${src}" chưa được tạo. Vui lòng gọi createSound trước.`
    );
  }

  // Phát âm thanh ngay lập tức
  sound.stop();
  //console.log(`Đã dừng âm thanh "${src}".`);
}

// Hàm tạo tất cả âm thanh từ thư mục
function createAllSounds() {
  let cache = {};
  // Sử dụng import.meta.glob để tự động lấy tất cả tệp .mp3 từ thư mục /sounds
  const soundFiles = import.meta.glob("/sound/*.mp3"); // Lấy tất cả tệp mp3 trong thư mục sounds

  // Đếm số lượng phần tử trong soundCache
  const soundCount = Object.keys(soundFiles).length;
  //console.log(`Số lượng âm thanh trong soundCount: ${soundCount}`);

  const promises = Object.keys(soundFiles).map(async (filePath) => {
    // Đường dẫn tệp cần tạo
    const resolvedPath = filePath.replace(/^\//, ""); // Loại bỏ `/public` để có URL chính xác
    //console.log(`resolved path: ${resolvedPath}`);
    cache[resolvedPath] = createSound(resolvedPath); // Tạo âm thanh từ file và lưu vào cache

    //console.log(`cache[${resolvedPath}]:${cache[resolvedPath]}`);
  });

  //console.log("Đã tạo và lưu tất cả âm thanh vào cache.");

  return cache;
}

// Hàm addSound để thêm một âm thanh mới vào soundCache
function addSound(soundCache, filePath, loop) {
  // Sử dụng createSound để tạo âm thanh mới
  const newSound = createSound(filePath, loop);

  // Thêm âm thanh vào soundCache
  soundCache[filePath] = newSound;

  //console.log(`Âm thanh từ "${filePath}" đã được thêm vào cache.`);
}

function pauseSound(sound) {
  sound.pause();
}
function resumeSound(sound) {
  sound.play();
}

export {
  resumeSound,
  pauseSound,
  stopSound,
  playSound,
  addSound,
  playSoundForDuration,
  createAllSounds,
};
