# 累積經驗

本檔為執行工作時特有之累積經驗,留給後續之嘗試、執行與判斷,由agent自行編列、擴充與維護.過長時抽出舊者為`experience_<年月日>.md`,並於本檔註明何時抽出.

## 打包(單一執行檔)

1. **`pkg` 已無法打包 node 20.11**(2024-09 之備忘):`pkg` 5.8.1 已停止維護,不再提供新 node 之基底執行檔;且有 GHSA-22r3-9w55-cj54。2026-11-09 起改用 Node 內建 SEA,已移除 `pkg`。
2. **SEA 之主程式不能 `require` 檔案**:只能取得內建模組。`src/compile.js` 原以 `require('../dist/w-backup.umd.js')` 載入 dist,故 `compileBySea.mjs` 把 dist 內嵌進主程式(取代該行)再打包;dist 本身只 require `path`、`fs`、`child_process` 三個內建模組,不須另行打包相依套件(包含 `w-zip`、`wsemi`、`dayjs`、`lodash-es` 皆已併入 dist)。
3. **SEA 之 `process.argv`**:`[執行檔, 執行檔, 參數1, ...]`,與 `node 腳本 參數1` 之 `[node, 腳本, 參數1, ...]` 對齊,故 `compile.js` 讀 `argv[2]` 不必改(2026-11-09 以 Node 24.22.1 實測 `argv.length` 為 4)。
4. **`disableExperimentalSEAWarning: true` 必設**:否則執行檔於 stderr 多印 `ExperimentalWarning: Single executable application is an experimental feature...`,使輸出異於以 node 執行(2026-11-09 以有/無旗標各建極小執行檔實測)。
5. **`postject` 印 `warning: The signature seems corrupted!` 為預期**:複製之 node.exe 帶 OpenJS 簽章,注入後簽章失效;執行不受影響(2026-11-09 實測 zip、7z 皆正常)。
6. **對照執行檔與 node 之判準**:壓縮檔位元組每次不同(含密碼之 zip/7z 有隨機鹽、`zipFolder` 有時間戳,node 對 node 重跑亦不同),直接比雜湊會誤報;改比①離開碼、stdout、stderr、輸出樹路徑、②非壓縮檔雜湊(copyFile、copyFolder、unzip 輸出)、③壓縮檔以 7z 解開後之內容。2026-11-09 實測(Node 24.22.1):zip 與 7z 各 7 個壓縮檔解開內容全相同;輸出樹 49 項路徑全相同;非壓縮檔雜湊 26 項全相同;stderr 皆空。
7. **舊 `pkg` 執行檔不可當對照基準**:舊 `bin/wb.exe`(2024-03 建置)含舊版原始碼,`keepFiles` 行為與現行不同(對同一設定多留 5 個舊 `.7z`),比對會得到「不同」但與打包方式無關;基準一律用 `node src/compile.js`(現行 dist)。
8. **執行檔不依賴 PATH 上之 node**:以僅含系統目錄之 PATH 執行,zip、7z 皆與以 node 執行相同。
9. **`npm uninstall`/`install` 會把 `package-lock.json` 頂層 `version` 同步成 `package.json` 之值**(本次 1.0.51 → 1.0.52),並把 `package.json` 補上結尾換行;皆非改版號。
