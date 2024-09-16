import fs from 'fs'
import dayjs from 'dayjs'
import w from 'wsemi'
import wb from './src/WBackup.mjs'

let fpSetting = './setting-7z.json'
let fpBackup = './testData/output'
let fpKeep = './testData/outputList'
let fmt = 'YYYY-MM-DD' //'YYYYMMDD'

function getDay(n) {
    return dayjs().add(-n, 'days').format(fmt)
}

//fsDeleteFolder
w.fsDeleteFolder(fpBackup)
// w.fsDeleteFolder(fpKeep)

//fsCreateFolder
w.fsCreateFolder(fpKeep)

fs.writeFileSync(fpKeep + `/${getDay(120)}.7z`, 'a1', 'utf8')
fs.writeFileSync(fpKeep + `/${getDay(105)}.7z`, 'a2', 'utf8')
fs.writeFileSync(fpKeep + `/${getDay(90)}.7z`, 'b1', 'utf8')
fs.writeFileSync(fpKeep + `/${getDay(75)}.7z`, 'b2', 'utf8')
fs.writeFileSync(fpKeep + `/${getDay(60)}.7z`, 'c1', 'utf8')
fs.writeFileSync(fpKeep + `/${getDay(45)}.7z`, 'c2', 'utf8')
fs.writeFileSync(fpKeep + `/${getDay(30)}.7z`, 'd1', 'utf8')
fs.writeFileSync(fpKeep + `/${getDay(15)}.7z`, 'd2', 'utf8')
fs.writeFileSync(fpKeep + `/${getDay(0)}.7z`, 'd3', 'utf8')


//use setting.json
wb(fpSetting)
    .then((msg) => {
        console.log(msg)
    })
    .catch((err) => {
        console.log(err)
    })

// then => [
//   'zipFile done: ./testData/output/20210106/test-y1.7z',
//   'zipFile done: ./testData/output/2021-01-06/test-y2.7z',
//   'zipFile done: ./testData/output/21-01-06/test-y3.7z',
//   'zipFile done: ./testData/output/2021-01-07/test-t1.7z',
//   'zipFile done: ./testData/output/20210107/test1.7z',
//   'zipFile done: ./testData/output/20210107/test2.7z',
//   'zipFolder done: ./testData/output/20210107/test3.7z',
//   'unzip done: ./testData/output/20210107/unzip/test1',
//   'unzip done: ./testData/output/20210107/unzip/test2',
//   'unzip done: ./testData/output/20210107/unzip/test3',
//   'keepFiles done: ./testData/outputList',
//   'copyFile done: ./testData/output/20210107/file1-copyFile.txt',
//   'copyFolder done: ./testData/output/20210107/folder1-copyFolder',
//   'finish at 2021-01-07T15:15:21+08:00'
// ]

//node --experimental-modules g-7z.mjs
