let wb = require('../dist/w-backup.umd.js')
let get = require('lodash/get')

//argv, 第0個為nodejs, 第1個為compile.js, 之後才是參數
let argv = process.argv

//fpSetting
let fpSetting = get(argv, 2, null)

//check
if (!fpSetting) {
    console.log('invalid file path for settings')
}
else {
    wb(fpSetting)
        .then((msg) => {
            console.log(msg)
        })
        .catch((err) => {
            console.log(err)
        })

}


//pkg還不能打包*.mjs檔, 故需要先用rollup編譯成js
//node --experimental-modules --es-module-specifier-resolution=node toolg/gDistRollup.mjs
//./node_modules/.bin/pkg -t win src/compile.js --output bin/wb.exe
