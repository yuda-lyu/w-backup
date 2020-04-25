let wb = require('../dist/w-backup.umd.js')
let get = require('lodash/get')

//argv, 第0個為nodejs, 第1個為wb.mjs, 之後才是參數
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

