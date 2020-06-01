import path from 'path'
import fs from 'fs'
import JSON5 from 'json5'
import dayjs from 'dayjs'
import get from 'lodash/get'
import each from 'lodash/each'
import join from 'lodash/join'
import cint from 'wsemi/src/cint.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import pmSeries from 'wsemi/src/pmSeries.mjs'
import fsGetFilesInFolder from 'wsemi/src/fsGetFilesInFolder.mjs'
import fsIsFile from 'wsemi/src/fsIsFile.mjs'
import fsIsFolder from 'wsemi/src/fsIsFolder.mjs'
import mZip from 'w-zip/src/mZip.mjs'


function getToday() {
    return dayjs().format('YYYYMMDD')
}


function isDay(c) {
    let ct = null
    try {
        ct = dayjs(c).format('YYYYMMDD')
    }
    catch (err) {
        return false
    }
    return c === ct
}


async function unzip(v, today) {

    //params
    let src = get(v, 'src', null)
    let tar = get(v, 'tar', null)

    //check
    if (!src) {
        return Promise.reject('invalid src')
    }
    if (!tar) {
        return Promise.reject('invalid tar')
    }

    //replace
    src = src.replace('{today}', today)
    tar = tar.replace('{today}', today)

    //check
    if (!fsIsFile(src)) {
        return Promise.reject('src is not file')
    }

    //unzip
    let r = await mZip.unzip(src, tar)

    return r
}


async function zipFile(v, today) {

    //params
    let src = get(v, 'src', null)
    let tar = get(v, 'tar', null)

    //check
    if (!src) {
        return Promise.reject('invalid src')
    }
    if (!tar) {
        return Promise.reject('invalid tar')
    }

    //replace
    src = src.replace('{today}', today)
    tar = tar.replace('{today}', today)

    //check
    if (!fsIsFile(src)) {
        return Promise.reject('src is not file')
    }

    //zipFile
    let r = await mZip.zipFile(src, tar)

    return r
}


async function zipFolder(v, today) {

    //params
    let src = get(v, 'src', null)
    let tar = get(v, 'tar', null)

    //check
    if (!src) {
        return Promise.reject('invalid src')
    }
    if (!tar) {
        return Promise.reject('invalid tar')
    }

    //replace
    src = src.replace('{today}', today)
    tar = tar.replace('{today}', today)

    //check
    if (!fsIsFolder(src)) {
        return Promise.reject('src is not folder')
    }

    //zipFolder
    let r = await mZip.zipFolder(src, tar)

    return r
}


async function keepFiles(v, today) {

    //params
    let src = get(v, 'src', null)
    let fileType = get(v, 'fileType', null)
    let dayLimit = get(v, 'dayLimit', null)

    //check
    if (!src) {
        return Promise.reject('invalid src')
    }
    if (!fsIsFolder(src)) {
        return Promise.reject('src is not folder')
    }
    if (!fileType) {
        return Promise.reject('invalid fileType')
    }
    if (!dayLimit) {
        return Promise.reject('invalid dayLimit')
    }
    dayLimit = cint(dayLimit)
    if (dayLimit <= 0) {
        return Promise.reject('dayLimit <= 0')
    }

    //fsGetFilesInFolder
    let rs = fsGetFilesInFolder(src)

    //dNow
    let dNow = dayjs(today, 'YYYYMMDD')

    //each
    let errs = []
    each(rs, (v) => {

        //namePure
        let namePure = path.basename(v, `.${fileType}`)

        //check
        if (isDay(namePure)) {

            //dFd
            let dFd = dayjs(namePure, 'YYYYMMDD')

            //diff
            let i = dNow.diff(dFd, 'days')
            if (i > dayLimit) {
                try {
                    fs.unlinkSync(v)
                    //console.log('delete: ' + v)
                }
                catch (err) {
                    errs.push(err)
                }
            }

        }

    })

    //check
    if (errs.length > 0) {
        return Promise.reject(join(errs, ', '))
    }

    return 'done: ' + src
}


async function readSetting(fpSetting) {

    //check
    if (!fsIsFile(fpSetting)) {
        return Promise.reject('input path is not file')
    }

    //read and parse
    let r = null
    try {

        //readFileSync
        let c = fs.readFileSync(fpSetting, 'utf8')

        //parse
        r = JSON5.parse(c)

    }
    catch (err) {
        return Promise.reject(err)
    }

    return r
}


/**
 * 檔案或資料夾備份
 *
 * @class
 * @param {Array|String} inp 輸入設定陣列或設定檔名稱字串
 * @returns {Promise} 回傳通訊物件，可監聽事件open、error、clientChange、execute、broadcast、deliver，可使用函數broadcast
 * @example
 * import fs from 'fs'
 * import w from 'wsemi'
 * import wb from 'w-backup'
 *
 * let fpSetting = './setting.json'
 * let fpBackup = './testData/output'
 * let fpKeep = './testData/outputList'
 *
 * //fsDeleteFolder
 * w.fsDeleteFolder(fpBackup)
 *
 * //fsCreateFolder
 * w.fsCreateFolder(fpKeep)
 * fs.writeFileSync(fpKeep + '/20200101.zip', 'a1', 'utf8')
 * fs.writeFileSync(fpKeep + '/20200115.zip', 'a2', 'utf8')
 * fs.writeFileSync(fpKeep + '/20200201.zip', 'b1', 'utf8')
 * fs.writeFileSync(fpKeep + '/20200215.zip', 'b2', 'utf8')
 * fs.writeFileSync(fpKeep + '/20200301.zip', 'c1', 'utf8')
 * fs.writeFileSync(fpKeep + '/20200315.zip', 'c2', 'utf8')
 * fs.writeFileSync(fpKeep + '/20200401.zip', 'd1', 'utf8')
 * fs.writeFileSync(fpKeep + '/20200415.zip', 'd2', 'utf8')
 *
 * //use setting.json
 * wb(fpSetting)
 *     .then((msg) => {
 *         console.log(msg)
 *     })
 *     .catch((err) => {
 *         console.log(err)
 *     })
 *
 * // then => [
 * //     'done: ./testData/output/20200425/test1.zip',
 * //     'done: ./testData/output/20200425/test2.zip',
 * //     'done: ./testData/output/20200425/test3.zip',
 * //     'done: ./testData/output/20200425/unzip/test1',
 * //     'done: ./testData/output/20200425/unzip/test2',
 * //     'done: ./testData/output/20200425/unzip/test3',
 * //     'done: ./testData/outputList',
 * //     'finish at 20200425'
 * // ]
 */
async function WBackup(inp) {
    let s

    //check
    if (isearr(inp)) {
        s = inp
    }
    else if (isestr(inp)) {
        s = await readSetting(inp)
    }
    else {
        return Promise.reject('input is not settings(Array) or json file path(String) for settings')
    }

    //today
    let today = getToday()

    let msg = []
    try {

        //pmSeries, 需循序操作
        let r
        await pmSeries(s, async (v) => {
            let func = get(v, 'func', null)

            if (func === 'unzip') {
                r = await unzip(v, today)
                msg.push(r)
            }
            else if (func === 'zipFile') {
                r = await zipFile(v, today)
                msg.push(r)
            }
            else if (func === 'zipFolder') {
                r = await zipFolder(v, today)
                msg.push(r)
            }
            else if (func === 'keepFiles') {
                r = await keepFiles(v, today)
                msg.push(r)
            }
            else {
                msg.push({
                    error: 'invalid func: ', func
                })
            }

        })

    }
    catch (err) {
        return Promise.reject(err)
    }

    //finish
    let r = `finish at ${today}`
    msg.push(r)

    return msg
}


export default WBackup