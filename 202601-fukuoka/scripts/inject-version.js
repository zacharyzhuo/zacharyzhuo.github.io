const fs = require("fs");
const path = require("path");

// 生成版本號（使用時間戳記）
const buildTime = Date.now();
const version = `v${buildTime}`;

// Service Worker 檔案路徑
const swPath = path.join(__dirname, "../build/service-worker.js");

// 檢查檔案是否存在
if (fs.existsSync(swPath)) {
  // 讀取檔案內容
  let content = fs.readFileSync(swPath, "utf8");

  // 替換版本號 placeholder
  content = content.replace(/__BUILD_TIME__/g, version);

  // 寫回檔案
  fs.writeFileSync(swPath, content, "utf8");

  console.log(`✅ Service Worker 版本號已更新: ${version}`);
} else {
  console.warn("⚠️  Service Worker 檔案不存在，跳過版本號注入");
}
