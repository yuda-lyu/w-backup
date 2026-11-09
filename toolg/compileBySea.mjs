import fs from 'fs'
import { execFileSync } from 'child_process'
import { inject } from 'postject'

//以Node內建單一執行檔(SEA)把w-backup編成bin/wb.exe: 組出主程式 → 產生blob → 複製node執行檔 → 注入blob
//須於套件根執行(路徑皆相對cwd), 且於gDistRollup.mjs之後(須先有dist/w-backup.umd.js)
//執行檔內嵌執行本程序之node, 故須以欲內嵌之node版本執行本檔; 僅支援Windows(同先前之win目標)

let fpDist = './dist/w-backup.umd.js'
let fpEntry = './src/compile.js'
let fdBin = './bin'
let fdSea = './bin/_sea' //中間產物夾, 完成後刪除
let fpMain = './bin/_sea/wb.sea.js'
let fpConf = './bin/_sea/sea-config.json'
let fpBlob = './bin/_sea/wb.blob'
let fpExe = './bin/wb.exe'

//SEA主程式內之require只能取得node內建模組, 無法載入檔案, 故把dist內嵌至進入點
//進入點須含此行(compile.js以此載入dist), 取代為立即執行函數回傳dist之module.exports
let reRequire = /^let wb = require\('\.\.\/dist\/w-backup\.umd\.js'\)[ \t]*\r?$/gm

if (process.platform !== 'win32') {
    throw new Error('only supports Windows')
}
for (let fp of [fpDist, fpEntry]) {
    if (!fs.existsSync(fp)) {
        throw new Error(`file not found: ${fp}`)
    }
}

//組出主程式
let cDist = fs.readFileSync(fpDist, 'utf8').replace(/\r?\n\/\/# sourceMappingURL=.*\s*$/, '')
let cEntry = fs.readFileSync(fpEntry, 'utf8')
let ms = cEntry.match(reRequire)
if (!ms || ms.length !== 1) {
    throw new Error(`${fpEntry} must have exactly one line: let wb = require('../dist/w-backup.umd.js')`)
}
let cInline = `let wb = (function() {\nlet module = { exports: {} }\nlet exports = module.exports\n${cDist}\nreturn module.exports\n}).call(globalThis)`
let cMain = cEntry.replace(reRequire, () => cInline)

//mkdirSync
fs.rmSync(fdSea, { recursive: true, force: true })
fs.mkdirSync(fdSea, { recursive: true })
fs.mkdirSync(fdBin, { recursive: true })

//writeFileSync
fs.writeFileSync(fpMain, cMain, 'utf8')
fs.writeFileSync(fpConf, JSON.stringify({
    main: fpMain,
    output: fpBlob,
    disableExperimentalSEAWarning: true, //不於stderr印出SEA實驗性警告, 使執行檔輸出與以node執行時相同
}, null, 4), 'utf8')

//由sea-config.json產生blob
execFileSync(process.execPath, ['--experimental-sea-config', fpConf], { stdio: 'inherit', windowsHide: true })

//刪除舊exe
fs.rmSync(fpExe, { force: true })

//複製node執行檔為exe
fs.copyFileSync(process.execPath, fpExe)

//注入blob至exe
let blob = fs.readFileSync(fpBlob)
await inject(fpExe, 'NODE_SEA_BLOB', blob, {
    sentinelFuse: 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
})

//刪除中間產物
fs.rmSync(fdSea, { recursive: true, force: true })

console.log(`done: ${fpExe} (${fs.statSync(fpExe).size} bytes, node ${process.version})`)

//node toolg/compileBySea.mjs
