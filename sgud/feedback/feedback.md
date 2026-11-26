# 回饋

本檔記載任務中發現之自有套件、全域技能、全域設定之調整與抽提提案;只增不改,處置結果另記一列,供主控核實、盤點與整合.欄位:日期、類別(自有套件/全域技能/全域設定)、對象、內容、依據。

| 日期 | 類別 | 對象 | 內容 | 依據 |
|---|---|---|---|---|
| 2026-11-09 | 自有套件 | w-package-tools | 兩個套件(w-backup、w-batch)各自維護近乎相同之 SEA 打包腳本(產 blob、複製 node、`postject` 注入),建議抽提為共用函數(例如以進入檔與輸出路徑為參數),並預設帶 `disableExperimentalSEAWarning: true`;二者之差異僅在「把相依程式併入主程式」之作法(w-batch 為 rollup iife 加改寫標頭、w-backup 為內嵌自含之 UMD) | `toolg/compileBySea.mjs`;同型腳本見 w-batch 之 `toolg/compileBySea.mjs` |
| 2026-11-09 | 自有套件 | w-batch | `sea-config.json` 未設 `disableExperimentalSEAWarning`,執行檔會於 stderr 多印 ExperimentalWarning;若其輸出須與以 node 執行時相同,應加此旗標 | 實測:有/無旗標之極小執行檔 stderr 差異,見 `sgud/exp/experience.md` 第 4 點 |
| 2026-11-09 | 全域設定 | 主控之〈自有套件之發布與建置腳本〉規格,規則 3 | A 型之套件特有前後置列寫「w-backup `pkg`」,已不符:w-backup 已改為 `compileBySea`(與 w-batch 同型);須同步更新,並提醒使用者改 `script.txt` 之該列(agent 不改 `script.txt`) | 該規格之規則 3 之 A 型說明列;`script.txt` 第 9 列 |
| 2026-11-26 | 全域技能 | role-coder-for-test(§10 鏡像根變異) | 鏡像根建在本套件之 `./tmp/` 下時,只複製被變異之 `src/` 檔與測試檔即可(不必複製 `node_modules`、不建目錄連結):裸名匯入向上解析至本套件之 `node_modules`,屬同一套件、不是跨套件之向上解析;結果以 `mocha --reporter json --reporter-option output=<檔>` 寫檔再解析(被測碼若 `console.log`,解析標準輸出會混入非 JSON 文字);錨點取完整呼叫文字且須恰出現一次。建議於 §10 第 4 點或 references 補此作法 | `sgud/exp/experience.md` 第 10 點;本輪 4 個套件之變異皆依此作法 |
| 2026-11-26 | 全域設定 | 主控共通守則(`quiet-run --cwd` 之 log 位置) | 以 `--cwd <他庫>` 跑他庫指令時,`quiet-run` 之 log 與摘要寫在呼叫端工作目錄之 `./tmp/quiet-run/`,而非目標庫之 `./tmp/`:一次跑多個庫時,各庫之 log 混在呼叫端,結束清理須只清呼叫端一處,但他庫之執行紀錄無從留在該庫;建議於共通守則寫明此行為(或提供 `--log-dir`) | 本輪對 3 個他庫以 `--cwd` 執行,log 皆落在呼叫端之 `tmp/quiet-run/` |
