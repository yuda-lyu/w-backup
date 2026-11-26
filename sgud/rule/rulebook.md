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

## 列舉層數(wsemi 列舉函數)

### R5 呼叫 wsemi 列舉函數須明給層數,不依賴預設

- 規則:`fsTreeFolder`、`fsTreeFolderWithHash`、`fsGetFilesInFolder`、`fsGetFilesWithHashInFolder`、`fsGetFoldersInFolder`(含各 `*Core`)之第 2 參數為 `opt` 物件;wsemi 1.9.80 起 `opt.levelLimit` 為有效正整數才限層,**未給即窮舉全部層級**(舊版預設 1 層),第 2 參數給了而非物件(如舊寫法之數字)拋 `invalid opt: must be an object`。本套件之呼叫點須明給 `{ levelLimit: n }`,不省略第 2 參數;`package.json` 之 `wsemi` 下限為 `^1.9.80`。
- 語意:`keepFiles` 只處理 `fdSrc` 第 1 層之檔案(檔名即日期、超過保留天數者刪除),不進入子資料夾;`WBackup` 設定之 `keepFiles` 與 `backupFolder` 之保留清理皆經 `keepFiles`。
- 盤點指令:`git grep -nE "\b(fsTreeFolder|fsTreeFolderWithHash|fsGetFilesInFolder|fsGetFilesWithHashInFolder|fsGetFoldersInFolder)(Core)?\s*\(" -- . ':!dist' ':!docs'`;站點全集 2 處,判準:皆含 `{ levelLimit: 1 }` 為已套,省略或數字為未套。
  - `src/keepFiles.mjs:38`:`{ levelLimit: 1 }`,已套(活碼)。
  - `src/WBackup.mjs:426`:註解內之舊實作範例,已改註解寫法為 `{ levelLimit: 1 }`,已套(非活碼)。
- 測試:`test/unit-keepFiles.test.mjs`(S01~S06:第 1 層過期檔刪、第 2 與第 3 層過期檔不動、子層之非日期檔名不列入錯誤)。變異(鏡像根改回舊寫法)證據見 `sgud/exp/experience.md` 第 10 點。
