let wb = require('../dist/w-backup.umd.js')

let get = (v, i) => {
    let r = null
    try {
        r = v[i]
    }
    catch (err) {}
    return r
}

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


//Node內建單一執行檔(SEA)之主程式內無法require檔案, 故先用rollup編譯出dist/w-backup.umd.js, 再由compileBySea.mjs把dist內嵌至本檔(取代第1行之require)後打包
//第1行之寫法不可改, compileBySea.mjs以此行為取代依據
//node toolg/gDistRollup.mjs
//node toolg/compileBySea.mjs
