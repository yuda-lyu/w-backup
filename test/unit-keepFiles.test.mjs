import fs from 'fs'
import path from 'path'
import assert from 'assert'
import keepFiles from '../src/keepFiles.mjs'


//需求來源: 規則帳本 R5, keepFiles 只處理 fdSrc 第1層之檔案(檔名即日期, 超過保留天數者刪除), 不進入子資料夾.
//背景: wsemi 1.9.80 起列舉函數之 opt.levelLimit 未給即窮舉全部層級(舊版預設1層), 故 src/keepFiles.mjs 須明給 { levelLimit: 1 }.
//  S01 第1層之過期檔被刪除
//  S02 子資料夾(第2層)之過期檔不動
//  S03 更深子資料夾(第3層)之過期檔不動
//  S04 第1層之未過期檔不動(含檔名日期為未來者)
//  S05 第1層之檔名無法解析為日期者不刪, 並回報 invalid fnt(第1層之檔才會被列舉)
//  S06 子資料夾內檔名無法解析為日期者不列入錯誤(證明子層未被列舉, 不只是刪除被擋下)
//合成資料: 各檔之檔名日期與內容皆逐筆相異, 由檔名即可知其所在層級與去留.


let fdRoot = path.resolve('.')
let fdTest = path.join(fdRoot, 'test/_tmp/keepFiles-level')

let paths = {
    l1Old: path.join(fdTest, '20000101.txt'), //第1層, 過期
    l1New: path.join(fdTest, '29991231.txt'), //第1層, 日期為未來(不過期)
    l1Bad: path.join(fdTest, 'notadate.txt'), //第1層, 檔名非日期
    l2Old: path.join(fdTest, 'sub/20000103.txt'), //第2層, 過期
    l2Bad: path.join(fdTest, 'sub/notadate2.txt'), //第2層, 檔名非日期
    l3Old: path.join(fdTest, 'sub/deep/20000104.txt'), //第3層, 過期
}

function writeAll() {
    fs.rmSync(fdTest, { recursive: true, force: true })
    let i = 0
    for (let k of Object.keys(paths)) {
        i++
        fs.mkdirSync(path.dirname(paths[k]), { recursive: true })
        fs.writeFileSync(paths[k], `content-${k}-${i}`, 'utf8')
    }
}

function exist(k) {
    return fs.existsSync(paths[k])
}


describe('unit-keepFiles', function() {

    let r = null
    let rejected = null

    before(async function() {
        writeAll()
        try {
            r = await keepFiles(fdTest, 30)
        }
        catch (err) {
            rejected = err
        }
    })

    after(function() {
        fs.rmSync(fdTest, { recursive: true, force: true })
    })

    it('S01 第1層之過期檔被刪除', function() {
        assert.ok(!exist('l1Old'), '第1層之過期檔應被刪除')
    })

    it('S02 子資料夾(第2層)之過期檔不動', function() {
        assert.ok(exist('l2Old'), '第2層之過期檔不應被列舉與刪除')
    })

    it('S03 更深子資料夾(第3層)之過期檔不動', function() {
        assert.ok(exist('l3Old'), '第3層之過期檔不應被列舉與刪除')
    })

    it('S04 第1層之未過期檔不動', function() {
        assert.ok(exist('l1New'), '第1層之未過期檔不應被刪除')
    })

    it('S05 第1層之檔名非日期者不刪, 並回報 invalid fnt', function() {
        assert.ok(exist('l1Bad'), '檔名非日期者不應被刪除')
        assert.strictEqual(r, null, '有非日期檔名時應 reject')
        assert.ok(typeof rejected === 'string' && rejected.includes('invalid fnt[notadate]'), '應回報第1層之 invalid fnt[notadate]')
    })

    it('S06 子資料夾內之非日期檔名不列入錯誤(子層未被列舉)', function() {
        assert.ok(typeof rejected === 'string', '應 reject 並回報錯誤字串')
        assert.ok(!rejected.includes('notadate2'), '第2層之檔不應被列舉, 不應出現其 invalid fnt')
    })

})
