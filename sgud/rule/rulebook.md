# 規則帳本

本檔為套件設計與開發階段之規則帳本(藍圖),為要求程式碼須長成什麼樣,或由規格產出之測試(項目/說明/流程)有哪些,包含軸、單一擁有者、已知限制、破壞性變更紀錄,以及對應是哪些測試檔案或指令等,由agent自行編列、擴充與維護.當前已做到哪些記於`sgud/state/state.md`.過長時依類型拆為`rulebook_<類型>.md`,本檔只留索引.

## 打包(單一執行檔)

### R1 不依賴 pkg

- 規則:`package.json` 之各類依賴(含 `pkg-fetch`)與 scripts、`toolg/*.mjs`、`src/compile.js`、`README.md` 皆不得出現 `pkg`(`pkg` 5.8.1 有 GHSA-22r3-9w55-cj54 且已停止維護)。
- 盤點指令:Grep `\bpkg\b`,範圍 `package.json`、`toolg/`、`src/compile.js`、`README.md`;站點全集 4 處,判準:0 處為已套。`script.txt` 由使用者維護,不在本規則之檢查範圍(現況見 state)。
- 測試:`test/unit-no-pkg.test.mjs`(R01、R03)。

### R2 以 Node 內建 SEA 打包(`toolg/compileBySea.mjs`)

- 規則:流程固定為①以 `src/compile.js` 為底、把其第 1 行之 `require('../dist/w-backup.umd.js')` 取代為內嵌 `dist/w-backup.umd.js`(SEA 之主程式內 `require` 只能取得內建模組);②`node --experimental-sea-config` 產 blob,`sea-config.json` 含 `disableExperimentalSEAWarning: true`(否則執行檔於 stderr 多印實驗性警告);③複製 `process.execPath` 為 `bin/wb.exe`;④`postject` 之 `inject` 注入(`NODE_SEA_BLOB`);⑤刪中間產物 `bin/_sea`。路徑皆相對 cwd(套件根),於 `gDistRollup.mjs` 之後執行;僅支援 Windows;`postject` 列 devDependencies。
- 判準:執行檔不依賴 PATH 上之 node;不產生 `bin/_sea` 殘留。
- 測試:`test/unit-no-pkg.test.mjs`(R02、R04)、`test/api-compile-sea.test.mjs`(S1、S3、S4)。

### R3 執行檔行為不得異於 node

- 規則:同一份設定檔(`setting-zip.json`、`setting-7z.json`)與指令列參數,執行檔之備份結果須與 `node src/compile.js` 相同:離開碼、stdout、stderr、輸出樹之路徑、非壓縮檔之雜湊;壓縮檔位元組含時間戳與隨機鹽(每次不同,node 對 node 亦然),改比對解壓內容。
- 盤點指令:`node node_modules/mocha/bin/mocha.js test/api-compile-sea.test.mjs --timeout 180000`;7z 案例需本機有 7-Zip(無則略過並註明)。
- 測試:`test/api-compile-sea.test.mjs`(S2)。

### R4 `src/compile.js` 第 1 行之寫法固定

- 規則:第 1 行須為 `let wb = require('../dist/w-backup.umd.js')`,且全檔僅此一行;`compileBySea.mjs` 以此為取代依據,不符即拋錯(不靜默產出未內嵌 dist 之執行檔)。
- 測試:`test/api-compile-sea.test.mjs`(S1,以副本執行建置腳本;取代依據不符時建置失敗)。
