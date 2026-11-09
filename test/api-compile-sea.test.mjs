import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import assert from 'assert'
import { spawnSync } from 'child_process'


//需求來源: 使用端裁示「改node內建打包,移除pkg」, 並定:
//  S1 以Node內建單一執行檔(SEA)產出 bin/wb.exe(toolg/compileBySea.mjs), 中間產物不殘留
//  S2 產出之執行檔對使用者之行為不得改變: 同一份設定檔(setting-zip.json, setting-7z.json)與指令列參數, 備份結果與以node執行(src/compile.js)相同
//  S3 無設定檔參數時印出 invalid file path for settings(src/compile.js 之檢查分支)
//  S4 執行檔不於stderr多印SEA之實驗性警告(輸出與以node執行時相同)
//以測試用副本(test/_tmp/compile-sea)並指定cwd執行toolg腳本, 不動套件根之bin/與dist/


let fdRoot = path.resolve('.')
let fdTmp = path.join(fdRoot, 'test/_tmp/compile-sea')
let fpExe = path.join(fdTmp, 'bin/wb.exe')
let fp7z = 'C:\\Program Files\\7-Zip\\7z.exe'
console.log('fdRoot', fdRoot)
console.log('fdTmp', fdTmp)

let isWin = process.platform === 'win32'
let msBuild = null //建置之輸出摘要(供S1)

function sha(fp) {
    return crypto.createHash('sha256').update(fs.readFileSync(fp)).digest('hex')
}

function day(n) {
    let d = new Date(Date.now() - n * 86400000)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

//以node或執行檔於隔離之執行夾跑一次備份, 回傳離開碼, stdout, stderr, 輸出樹(路徑與雜湊)
function runCase(mode, kind) {
    let fd = path.join(fdTmp, `run-${mode}-${kind}`)
    fs.rmSync(fd, { recursive: true, force: true })
    fs.cpSync(path.join(fdRoot, 'testData/input'), path.join(fd, 'testData/input'), { recursive: true })
    fs.mkdirSync(path.join(fd, 'testData/outputList'), { recursive: true })
    fs.mkdirSync(path.join(fd, 'testLog'), { recursive: true })
    for (let n of [120, 90, 60, 30, 15, 0]) { //keepFiles之保留清單, 與 g-zip.mjs 相同之做法
        fs.writeFileSync(path.join(fd, `testData/outputList/${day(n)}.${kind}`), `k${n}`, 'utf8')
    }
    let fn = `setting-${kind}.json`
    fs.copyFileSync(path.join(fdRoot, fn), path.join(fd, fn))
    let r
    if (mode === 'node') {
        r = spawnSync(process.execPath, [path.join(fdTmp, 'src/compile.js'), `./${fn}`], { cwd: fd, windowsHide: true, encoding: 'utf8', timeout: 120000 })
    }
    else {
        r = spawnSync(fpExe, [`./${fn}`], { cwd: fd, windowsHide: true, encoding: 'utf8', timeout: 120000 })
    }
    let tree = {}
    let walk = (d) => {
        for (let n of fs.readdirSync(d).sort()) {
            let fp = path.join(d, n)
            let rel = path.relative(fd, fp).split(path.sep).join('/').replace(/success-\d{14}\.log/, 'success-TS.log')
            if (fs.statSync(fp).isDirectory()) {
                tree[rel + '/'] = null
                walk(fp)
            }
            else if (rel.startsWith('testLog/')) { //記錄檔內含結束時間, 去除時間後再取雜湊
                let c = fs.readFileSync(fp, 'utf8').replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}/g, 'TIME')
                tree[rel] = crypto.createHash('sha256').update(c).digest('hex')
            }
            else {
                tree[rel] = sha(fp)
            }
        }
    }
    walk(fd)
    let norm = (s) => s.split(fd).join('<RUN>').replace(/success-\d{14}\.log/g, 'success-TS.log').replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}/g, 'TIME')
    return { fd, exit: r.status, error: r.error, stdout: norm(r.stdout || ''), stderr: r.stderr || '', tree }
}

//壓縮檔之位元組含時間戳與隨機鹽, 每次執行不同(node對node亦然), 故其內容以解壓回之unzip輸出(unzip步驟)與輸入檔雜湊對照,
//其餘檔案(copyFile, copyFolder, unzip輸出, 輸入, 設定)比對雜湊
let reArchive = /\.(zip|7z)$/

function checkSame(kind) {
    let a = runCase('node', kind)
    let b = runCase('exe', kind)
    //結果相同: 離開碼, stdout, stderr, 輸出樹之路徑, 非壓縮檔之雜湊
    assert.strict.equal(a.exit, 0)
    assert.strict.equal(b.exit, 0)
    assert.strict.equal(b.exit, a.exit)
    assert.strict.equal(b.stdout, a.stdout)
    assert.strict.equal(b.stderr, a.stderr)
    assert.strict.deepEqual(Object.keys(b.tree), Object.keys(a.tree))
    for (let k of Object.keys(a.tree)) {
        if (!reArchive.test(k)) {
            assert.strict.equal(b.tree[k], a.tree[k], k)
        }
    }
    //stdout 須含各步驟之 done 與結尾 finish(確認真的有備份, 不是兩者皆空轉而相同)
    assert.strict.equal(/'zipFile done: /.test(b.stdout), true)
    assert.strict.equal(/'unzip done: /.test(b.stdout), true)
    assert.strict.equal(/'finish at TIME'/.test(b.stdout), true)
    //壓縮再解壓之結果與輸入相同(unzip 輸出由執行檔實際產出)
    let fdIn = path.join(b.fd, 'testData/input')
    let n = 0
    for (let k of Object.keys(b.tree)) {
        let m = k.match(/^testData\/output\/\d{8}\/unzip\/test1\/(.+)$/)
        if (m && b.tree[k] !== null) {
            assert.strict.equal(b.tree[k], sha(path.join(fdIn, m[1])), k)
            n++
        }
    }
    assert.strict.equal(n > 0, true)
}


describe('api-compile-sea', function() {
    this.timeout(180000)

    before(function() {
        if (!isWin) {
            this.skip() //僅支援Windows(同先前之win目標)
        }
        fs.rmSync(fdTmp, { recursive: true, force: true })
        for (let rel of ['dist/w-backup.umd.js', 'src/compile.js', 'toolg/compileBySea.mjs']) {
            fs.mkdirSync(path.dirname(path.join(fdTmp, rel)), { recursive: true })
            fs.copyFileSync(path.join(fdRoot, rel), path.join(fdTmp, rel))
        }
        //於副本內以cwd執行建置腳本(postject由套件根node_modules解析)
        let r = spawnSync(process.execPath, ['toolg/compileBySea.mjs'], { cwd: fdTmp, windowsHide: true, encoding: 'utf8', timeout: 170000 })
        msBuild = { status: r.status, stdout: r.stdout, stderr: r.stderr }
    })

    after(function() {
        fs.rmSync(fdTmp, { recursive: true, force: true })
    })

    it('S1 以SEA產出 bin/wb.exe, 中間產物 bin/_sea 不殘留', function() {
        assert.strict.equal(msBuild.status, 0, msBuild.stdout + msBuild.stderr)
        assert.strict.equal(fs.existsSync(fpExe), true)
        assert.strict.equal(fs.statSync(fpExe).size > 10 * 1024 * 1024, true) //內嵌node, 遠大於一般檔案
        assert.strict.equal(fs.existsSync(path.join(fdTmp, 'bin/_sea')), false)
    })

    it('R4 compile.js 第1行之取代依據不符時建置失敗, 不產出未內嵌dist之執行檔', function() {
        let fd = path.join(fdTmp, 'bad')
        for (let rel of ['dist/w-backup.umd.js', 'toolg/compileBySea.mjs']) {
            fs.mkdirSync(path.dirname(path.join(fd, rel)), { recursive: true })
            fs.copyFileSync(path.join(fdRoot, rel), path.join(fd, rel))
        }
        fs.mkdirSync(path.join(fd, 'src'), { recursive: true })
        let c = fs.readFileSync(path.join(fdRoot, 'src/compile.js'), 'utf8')
        assert.strict.equal(c.includes(`require('../dist/w-backup.umd.js')`), true)
        fs.writeFileSync(path.join(fd, 'src/compile.js'), c.replace(`require('../dist/w-backup.umd.js')`, `require("../dist/w-backup.umd.js")`), 'utf8')
        let r = spawnSync(process.execPath, ['toolg/compileBySea.mjs'], { cwd: fd, windowsHide: true, encoding: 'utf8', timeout: 60000 })
        assert.strict.notEqual(r.status, 0)
        assert.strict.equal(r.stderr.includes('exactly one line'), true)
        assert.strict.equal(fs.existsSync(path.join(fd, 'bin/wb.exe')), false)
    })

    it('S3 S4 無設定檔參數時印出 invalid file path for settings, 離開碼0, stderr為空', function() {
        let r = spawnSync(fpExe, [], { cwd: fdTmp, windowsHide: true, encoding: 'utf8', timeout: 60000 })
        assert.strict.equal(r.status, 0)
        assert.strict.equal(r.stdout.trim(), 'invalid file path for settings')
        assert.strict.equal(r.stderr, '')
    })

    it('S2 setting-zip.json: 執行檔與以node執行之備份結果相同', function() {
        checkSame('zip')
    })

    it('S2 setting-7z.json: 執行檔與以node執行之備份結果相同(需本機已安裝7-Zip)', function() {
        if (!fs.existsSync(fp7z)) {
            this.skip() //設定檔 path7zexe 指向預設安裝位置, 本機無7-Zip時無法執行
        }
        checkSame('7z')
    })

})
