# 設計決策記錄（decision log）

從 CLAUDE.md 的 UI / Design System 段抽出的「為什麼不走某條路」完整敘事。
**這些結論仍然有效**：想推翻下列任一結論前，先讀完該條的否決過程與實測證據，避免重走死路。CLAUDE.md 對應位置各留有一行指標指到這裡。

## status-bar — iOS 26 PWA 狀態列（2026-06-12 整晚實測，勿再追）

主畫面 web app 的狀態列 letterbox **強制跟隨系統外觀**（深色模式 = 黑、淺色 = 白），頁面端**無法控制**。已逐一實測否決：fixed 背景層有無、wrapper 不透明背景、單一/雙 media `theme-color`、`color-scheme: light`、`apple-mobile-web-app-status-bar-style`（含移除後重裝）——全部無效；同一頁面在 Safari 瀏覽器的 tab 染色卻正常（米白）。head 維持最簡形狀（單一 `theme-color`，**勿加 apple-mobile-web-app-\* meta**，加了只會在重裝時被捕捉、徒增變因）。WebKit 在 iOS 26.x 持續改這塊，未來版本可再驗證；真正的長期解是做深色模式（token 地基已鋪）。

## background-glow — 行程卡背景光暈的三次否決（定案「內側淡彩」D 變體）

**歷史教訓（勿走回頭路）**：(1) 「固定在 viewport 四角的色斑背景」（含當日分類連動染 `--wash-a/b/c/d` @property crossfade）→ 固定位置與內容無關、低明度色票像髒灰陰影、與 DayNav/banner 形成色塊斷層，整組拆除。(2) 「包住整卡的 radial 橢圓光暈（alpha 0.55）」→ 太重、形狀與卡片無關不自然。(3) 下緣色影（C 變體）也試過，user 實機比較後**定案內側淡彩（D）**（C 的實作留在 git history `1d970bd`）。

## glass-refraction — 真折射（Liquid Glass）研究與不採用理由（2026-06-26）

**修正舊結論（2026-06-26 查證 glass.outpacestudios.com）**：先前記「真折射唯一路線是 `feDisplacementMap` + `backdrop-filter: url(#filter)`、Chromium-only、Safari 無解」**只對了一半**。`backdrop-filter: url()`（扭曲背後的 backdrop）確實仍 Chromium-only；但**一般 `filter: url()`（扭曲元素自己的內容）含 `feDisplacementMap` 在 Safari / Firefox 都支援**。真折射可走的 Safari 相容路線是「**refract a copy**」：在玻璃面板內塞一份**背景的複製品**（釘在與真背景相同位置），對這份複製品套一般 `filter: url(#glass)`。Outpace 的 chain = `feImage`（runtime 算出的位移圖 blob，依 squircle 圓頂 + Snell IOR 1.5 + 圓角 SDF）→ 3× `feDisplacementMap` 不同 scale（RGB 色散）→ recombine → `feGaussianBlur`，另疊一層 `backdrop-filter: blur` 當底霜。

**為何本站仍不追**：refract-a-copy 只在「背景是**已知、靜態、可複製、可釘位**的單張圖」時划算。本站玻璃面浮在**會捲動的異質內容**（itinerary 清單 / banner / Leaflet canvas tile）上，要逐 frame 複製背後 DOM 並對齊 + 多層 SVG filter 在 iOS Safari 重算 → 成本與 jank 都不值（連現在 drag 都得拔 `backdrop-filter` 逃生）。**通用 nav/sheet/card 維持 frosted 是正解**；真折射只在**單一玻璃面 × 固定背景**的點狀亮點（如 DayBanner hero 塊、求婚彩蛋等 one-off）才考慮，且動手前須在目標 iPhone PWA 實機測 FPS/發熱。
