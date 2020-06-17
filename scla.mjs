import fs from 'fs'
import dayjs from 'dayjs'
import w from 'wsemi'
import wb from './src/WBackup.mjs'

let fpSetting = './setting.json'
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

fs.writeFileSync(fpKeep + `/${getDay(120)}.zip`, 'a1', 'utf8')
fs.writeFileSync(fpKeep + `/${getDay(105)}.zip`, 'a2', 'utf8')
fs.writeFileSync(fpKeep + `/${getDay(90)}.zip`, 'b1', 'utf8')
fs.writeFileSync(fpKeep + `/${getDay(75)}.zip`, 'b2', 'utf8')
fs.writeFileSync(fpKeep + `/${getDay(60)}.zip`, 'c1', 'utf8')
fs.writeFileSync(fpKeep + `/${getDay(45)}.zip`, 'c2', 'utf8')
fs.writeFileSync(fpKeep + `/${getDay(30)}.zip`, 'd1', 'utf8')
fs.writeFileSync(fpKeep + `/${getDay(15)}.zip`, 'd2', 'utf8')
fs.writeFileSync(fpKeep + `/${getDay(0)}.zip`, 'd3', 'utf8')


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
