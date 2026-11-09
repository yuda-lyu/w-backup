# 狀態(現況)

本檔記載當前已開發功能之最新狀態:各功能做到哪裡、對應之規則帳本條目與測試檔、已知缺口與待辦、最近一次驗證或發布之版本.規則帳本為藍圖(`sgud/rule/rulebook.md`)、本檔為現況,兩者比對即知尚未做到者.只記現況,過程寫入經驗(`sgud/exp/experience.md`).過長時依功能類型拆為`state_<類型>.md`,本檔只留索引.

## 功能與狀態

| 功能 | 狀態 | 規則帳本 | 測試 |
|---|---|---|---|
| 備份函式庫(`src/WBackup.mjs`):依設定檔(JSON5 陣列)依序執行 zipFile、zipFolder、unzip、keepFiles、copyFile、copyFolder;`{today}`、`{yesterday}` 等日期樣板;設定檔格式見 `setting-zip.json`、`setting-7z.json` | 已完成,本輪未改 | — | `test/all.test.mjs`(占位) |
| 命令列進入點(`src/compile.js`):第 1 個參數為設定檔路徑,缺參數印 `invalid file path for settings` | 已完成,本輪僅改註解 | R4 | `test/api-compile-sea.test.mjs`(S3、S4) |
| 單一執行檔 `bin/wb.exe`(Node 內建 SEA + `postject`;`toolg/compileBySea.mjs`):不依賴 `pkg` | 已完成並驗證:與以 `node` 執行 `src/compile.js` 之備份結果相同(zip、7z) | R1、R2、R3 | `test/unit-no-pkg.test.mjs`、`test/api-compile-sea.test.mjs` |

## 打包現況

- 流程:`node toolg/gDistRollup.mjs`(產 `dist/w-backup.umd.js`)→ `node toolg/compileBySea.mjs`(產 `bin/wb.exe`)。
- `bin/` 不入版控(`.gitignore`),`bin/wb.exe` 內嵌建置時所用之 Node(2026-11-09 以 Node 24.22.1 建出為 94,135,808 位元組);僅支援 Windows。
- 需求與測試:Node 20 以上;`postject` 為 devDependencies。

## 已知缺口與待辦

- `script.txt` 之打包列(原 `pkg` 呼叫)仍未改:`script.txt` 由使用者維護,agent 不改;其應改為 `node toolg/compileBySea.mjs`,未改前依該列執行發布流程會因 `pkg` 已移除而失敗。
- 建置時 `postject` 印出 `warning: The signature seems corrupted!`:node.exe 之簽章因注入而失效,不影響執行(經驗 5);未做簽章移除。
- 執行檔約 94 MB,為 `pkg` 版(約 38 MB)之 2.5 倍(內嵌完整 node);未做壓縮。
- 其他平台(Linux、macOS)之執行檔未支援,與先前之 `pkg -t win` 一致。

## 最近一次驗證

- 2026-11-09,版本 1.0.52(尚未發布),Node 24.22.1,Windows 11:新增 `test/unit-no-pkg.test.mjs`、`test/api-compile-sea.test.mjs`;打包與備份對照結果見經驗 6。
