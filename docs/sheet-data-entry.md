# 寫入 Google Sheet 的型別政策與操作 runbook

從 CLAUDE.md 的「Google Sheets 資料結構」段抽出的完整操作手冊。CLAUDE.md 留有鐵則摘要 + 指標；**任何要往 trip sheet 寫資料的操作，動手前先讀完本檔**。

## 為什麼型別會咬人

App 透過 **gviz CSV 端點**（`.../gviz/tq?tqx=out:csv&sheet=<tab>`）讀 sheet。**gviz 會對每一欄推定單一型別，並把「不符該欄型別」的儲存格輸出成空字串**。所以每個 cell 必須是「該欄正確的型別」，否則資料會在 app 端消失或錯亂。

**踩過的雷**：用 `valueInputOption: RAW` 把 `"6/5"` 寫進 `date` 欄 → 存成**純文字**（cell 顯示 `'6/5`、靠左對齊）→ gviz 認定 date 欄是 Date 型別、把這個文字格輸出成**空字串** → app 收到空 `date` → 該列 `_day=null` → **從當天時間軸消失**（並被地圖當「備選」點）。症狀：**Sheet 裡看得到、網頁卻不顯示**。

**鐵則：任何 cell 的第一個字元都不該是 `'`（forced-text）。出現 `'` 代表型別沒設對。**

## 各欄正確型別

| 欄 | 正確型別 | 怎麼寫 |
|---|---|---|
| `date`（所有 tab） | **日期（DATE）** | `USER_ENTERED` 寫 `6/5`；整欄 numberFormat `type=DATE`（現用 `m/d`）。gviz 輸出 `6/4`，resolveTripDate 吃 `M/D`／`YYYY/MM/DD` |
| `itinerary.time` | **文字（整欄一致）** | 此欄實務上**混了真時鐘（`09:50`）與非時鐘標籤（`晚上`/`上午`/`下午`/`晚餐`/`備選`）**，且這些標籤要照常顯示在時間軸。**整欄一律當文字**：`USER_ENTERED` 寫字串，並把該欄資料範圍 numberFormat 設 `TEXT`（防之後在 UI 輸入 `14:00` 又被自動轉成 TIME 型別、破壞「整欄文字」）。gviz 對「全文字欄」照吐所有值（含 `09:50` 與 `晚上`），安全。**切勿只把部分格轉成真 TIME 型別** → 見下方「同一欄不可混型別」 |
| `accommodation.check_in`/`check_out` | **時間（TIME）** | 這兩欄是 100% 乾淨時鐘時間、無文字標籤 → 整欄 numberFormat `type=TIME, pattern=hh:mm`，再 `USER_ENTERED` 寫 `09:50`。gviz 輸出乾淨 `09:50`（已驗） |
| `lat` / `lng` | **數字（Number）** | `USER_ENTERED` 寫數字字串 `10.4070429`（成 number；gviz 輸出數字） |
| `flights.time`、`hours` 等含**區間/中文**的自由文字 | **文字** | 內容非單一可轉換值（`07:00 - 09:50`、`06:30 – 10:30`、`停留 40 分鐘`）→ Sheets 不會自動轉、本來就無 `'`，直接 `USER_ENTERED` 寫 |
| 其餘文字欄（`name`/`address`/`link`/`description`/`note`/`type`/`area`/…） | 文字 | `USER_ENTERED`；內容非「整格可轉換」不會出現 `'`，免特別處理 |

## 同一欄不可混型別（核心鐵則，實測）

gviz 對一欄只推定**一種**型別，把不符的格吐成空字串。所以真正的規則不是「time 一定要 TIME」，而是「**整欄同型別**」。

- 把 `itinerary.time` 的時鐘格轉成真 TIME、卻保留 `晚上`/`上午` 文字格 → gviz 判整欄為時間型 → **那些文字格被吐成空**（時間軸時間標籤消失）。
- 實測（拋棄式 sheet 驗證）：**全文字欄**（`16:00` 與 `晚上` 都 stringValue）→ gviz 全部照吐；**混型別欄**（`16:00` 是 numberValue＋`晚上` 是 stringValue）→ `晚上` 被吐成 `''`。
- 結論：`itinerary.time` 維持**整欄文字**。只有「該欄 100% 是乾淨時鐘時間」（如 `accommodation.check_in/check_out`）才用真 TIME 型別。

## 操作通則

- 寫 cell 一律 `valueInputOption: USER_ENTERED`（**不要 `RAW`**）；URL 也才會變連結。
- 要把某欄設成特定型別（`date`→DATE、`check_in`/`check_out`→TIME、`lat`/`lng`→NUMBER、`itinerary.time`→TEXT）：先用 `batchUpdate` 的 `repeatCell` 設該欄資料範圍 `userEnteredFormat.numberFormat`（`{type, pattern}`；TEXT 型別用 `{type:"TEXT"}`），再 `USER_ENTERED` 寫值。
- **寫後必驗**：`curl 'https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&sheet=<tab>'`，確認新列該填的欄**非空**、值正確。
- **新建 sheet 必須先設「知道連結的任何人可檢視」**：gviz CSV 端點需要 sheet 對外可讀，否則回傳的是 Google 登入 HTML 而非 CSV，app 端會讀不到資料（症狀：sheet 有資料、網頁全空）。建立後執行 `gws drive permissions create --params "{\"fileId\":\"<ID>\"}" --json '{"role":"reader","type":"anyone"}'`。既有 trip sheet 已分享過則免重設。gviz 另有數分鐘快取，剛寫完可能讀到舊值，要即時驗證改用 `gws sheets +read`。
- 偵測殘留 forced-text：`spreadsheets.get` 帶 `includeGridData` 看 `userEnteredValue` 是否為 `stringValue` 但內容是純數字/純日期（這種就是型別錯）。**例外**：`itinerary.time` 的 `stringValue` 純 `HH:MM` 是**刻意的全欄文字**，不是錯。
- **要在某天中間插列**（保持時間順序，而非丟到表尾）：用 `batchUpdate` 的 `insertDimension`（指定分頁 `sheetId`、`ROWS`、`startIndex`/`endIndex`）插空列，再 `values.update` 寫入；itinerary **無 `day` 欄**，日由 `date` 推。
