import fs from 'fs'
import w from 'wsemi'
import wb from './src/WBackup.mjs'

let fpSetting = './setting.json'
let fpBackup = './testData/output'
let fpKeep = './testData/outputList'
let fnNow = w.strleft(w.now2strp(), 8)

//fsDeleteFolder
w.fsDeleteFolder(fpBackup)

//fsCreateFolder
w.fsCreateFolder(fpKeep)
fs.writeFileSync(fpKeep + '/20200101.zip', 'a1', 'utf8')
fs.writeFileSync(fpKeep + '/20200115.zip', 'a2', 'utf8')
fs.writeFileSync(fpKeep + '/20200201.zip', 'b1', 'utf8')
fs.writeFileSync(fpKeep + '/20200215.zip', 'b2', 'utf8')
fs.writeFileSync(fpKeep + '/20200301.zip', 'c1', 'utf8')
fs.writeFileSync(fpKeep + '/20200315.zip', 'c2', 'utf8')
fs.writeFileSync(fpKeep + '/20200401.zip', 'd1', 'utf8')
fs.writeFileSync(fpKeep + '/20200415.zip', 'd2', 'utf8')
fs.writeFileSync(fpKeep + `/${fnNow}.zip`, 'd3', 'utf8')

//use setting.json
wb(fpSetting)
    .then((msg) => {
        console.log(msg)
    })
    .catch((err) => {
        console.log(err)
    })

// then => [
//     'done: ./testData/output/20200425/test1.zip',
//     'done: ./testData/output/20200425/test2.zip',
//     'done: ./testData/output/20200425/test3.zip',
//     'done: ./testData/output/20200425/unzip/test1',
//     'done: ./testData/output/20200425/unzip/test2',
//     'done: ./testData/output/20200425/unzip/test3',
//     'done: ./testData/outputList',
//     'finish at 20200425'
// ]
