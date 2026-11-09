import fs from 'fs'
import path from 'path'
import assert from 'assert'


//需求來源: 使用端裁示「改node內建打包,移除pkg」(pkg 5.8.1 有 GHSA-22r3-9w55-cj54 且已停止維護)
//  R01 package.json 不得再依賴 pkg(含其附屬 pkg-fetch)
//  R02 改以 Node 內建單一執行檔(SEA)打包, 須之 postject 列為 devDependencies
//  R03 打包腳本(toolg/*.mjs)、進入點(src/compile.js)、README 皆不再呼叫或指示 pkg
//  R04 toolg/compileBySea.mjs 存在且走 SEA(--experimental-sea-config, postject 之 inject)


let fdRoot = path.resolve('.')
console.log('fdRoot', fdRoot)

let pkgJson = JSON.parse(fs.readFileSync(path.join(fdRoot, 'package.json'), 'utf8'))

function readText(rel) {
    return fs.readFileSync(path.join(fdRoot, rel), 'utf8')
}

//呼叫或依賴 pkg 之形狀: 套件名、.bin/pkg、npx pkg、pkg -t、require/import 'pkg'
let reCallPkg = /(?:\.bin[\\/]pkg\b|\bnpx\s+pkg\b|\bpkg\s+-t\b|\bpkg\s+src\b|(?:require\(|from\s+)['"]pkg(?:-fetch)?['"]|(?:^|[^\w-])pkg(?:-fetch)?@|\bpkg-fetch\b)/m


describe('unit-no-pkg', function() {

    it('R01 package.json 之各類依賴皆不含 pkg 與 pkg-fetch', function() {
        let bad = []
        for (let k of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
            let o = pkgJson[k] || {}
            for (let name of ['pkg', 'pkg-fetch']) {
                if (Object.prototype.hasOwnProperty.call(o, name)) {
                    bad.push(`${k}.${name}`)
                }
            }
        }
        assert.strict.deepEqual(bad, [])
    })

    it('R01 package.json 之 scripts 不呼叫 pkg', function() {
        let bad = Object.entries(pkgJson.scripts || {}).filter(([, v]) => reCallPkg.test(v)).map(([k]) => k)
        assert.strict.deepEqual(bad, [])
    })

    it('R02 postject 列於 devDependencies, 且不在 dependencies(打包工具不隨套件安裝給使用端)', function() {
        assert.strict.equal(typeof (pkgJson.devDependencies || {}).postject, 'string')
        assert.strict.equal((pkgJson.dependencies || {}).postject, undefined)
    })

    it('R03 toolg/*.mjs 皆不呼叫 pkg', function() {
        let fd = path.join(fdRoot, 'toolg')
        let bad = fs.readdirSync(fd).filter(n => n.endsWith('.mjs')).filter(n => reCallPkg.test(readText(`toolg/${n}`)) || /\bpkg\b/.test(readText(`toolg/${n}`)))
        assert.strict.deepEqual(bad, [])
    })

    it('R03 src/compile.js 之程式與註解皆不再提及 pkg', function() {
        assert.strict.equal(/\bpkg\b/.test(readText('src/compile.js')), false)
    })

    it('R03 README 之打包說明不再指示 pkg', function() {
        assert.strict.equal(/\bpkg\b/.test(readText('README.md')), false)
    })

    it('R04 toolg/compileBySea.mjs 存在且走 SEA: --experimental-sea-config 與 postject 之 inject', function() {
        let fp = path.join(fdRoot, 'toolg/compileBySea.mjs')
        assert.strict.equal(fs.existsSync(fp), true)
        let c = fs.readFileSync(fp, 'utf8')
        assert.strict.equal(c.includes('--experimental-sea-config'), true)
        assert.strict.equal(/import\s*\{\s*inject\s*\}\s*from\s*'postject'/.test(c), true)
        assert.strict.equal(c.includes('NODE_SEA_BLOB'), true)
    })

})
