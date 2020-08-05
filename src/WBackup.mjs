// import process from 'process'
import path from 'path'
import fs from 'fs'
import JSON5 from 'json5'
import dayjs from 'dayjs'
import get from 'lodash/get'
import each from 'lodash/each'
import split from 'lodash/split'
import join from 'lodash/join'
import genPm from 'wsemi/src/genPm.mjs'
import cint from 'wsemi/src/cint.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import pmSeries from 'wsemi/src/pmSeries.mjs'
import fsGetFilesInFolder from 'wsemi/src/fsGetFilesInFolder.mjs'
import fsIsFile from 'wsemi/src/fsIsFile.mjs'
import fsIsFolder from 'wsemi/src/fsIsFolder.mjs'
import replace from 'wsemi/src/replace.mjs'
import now2str from 'wsemi/src/now2str.mjs'
import now2strp from 'wsemi/src/now2strp.mjs'
import strright from 'wsemi/src/strright.mjs'
import o2j from 'wsemi/src/o2j.mjs'
import fsCreateFolder from 'wsemi/src/fsCreateFolder.mjs'
import mZip from 'w-zip/src/mZip.mjs'


let logFd = '' //若由排程呼叫且不給logFd絕對路徑時, 預設是位於C:\Windows\system32


function rep(c) {
    // let c

    // c = `{today}`
    // console.log(c, rep(c))
    // => {today} 20200617

    // c = `{todayYYYY-MM-DD}`
    // console.log(c, rep(c))
    // => {todayYYYY-MM-DD} 2020-06-17

    // c = `{yesterday}`
    // console.log(c, rep(c))
    // => {yesterday} 20200617

    // c = `{yesterdayYYYY-MM-DD}`
    // console.log(c, rep(c))
    // => {yesterdayYYYY-MM-DD} 2020-06-17

    // c = `api.{yesterdayYYYY-MM-DD}.log`
    // console.log(c, rep(c))
    // => api.{yesterdayYYYY-MM-DD}.log api.2020-06-17.log

    //d
    let d = dayjs()

    function cvBasic(c, name) {
        //若為{today},{yesterday}
        if (c.indexOf(`{${name}}`) >= 0) {

            //fmt
            let fmt = 'YYYYMMDD'

            //day
            let day
            if (name === 'yesterday') {
                day = d.add(-1, 'days').format(fmt)
            }
            else {
                day = d.format(fmt)
            }

            //replace
            c = replace(c, `{${name}}`, day)

        }
        return c
    }

    function cvAdv(c, name) {

        //若還有{today
        let j = c.indexOf(`{${name}`)
        if (j >= 0) {

            //indStart, indEnd
            let indStart = j + 1
            let indEnd = null
            for (let i = indStart + 5; i < c.length; i++) {
                let r = c.substring(i, i + 1)
                if (r === '}') {
                    indEnd = i
                    break
                }
            }

            //tag, 取回例如todayYYYY-MM-DD
            let tag = c.substring(indStart, indEnd)

            //fmt, 取得例如YYYY-MM-DD
            let fmt = replace(tag, name, '')

            //day
            let day = d.format(fmt)
            if (name === 'yesterday') {
                day = d.add(-1, 'days').format(fmt)
            }
            else {
                day = d.format(fmt)
            }

            //split and join
            let s = split(c, `{${tag}}`)
            c = join(s, day)

        }
        return c
    }

    function core(c) {
        let changed = false
        let t = c

        c = cvBasic(c, 'today')
        changed = changed || c !== t
        t = c

        c = cvBasic(c, 'yesterday')
        changed = changed || c !== t
        t = c

        c = cvAdv(c, 'today')
        changed = changed || c !== t
        t = c

        c = cvAdv(c, 'yesterday')
        changed = changed || c !== t

        return {
            c,
            changed,
        }
    }

    while (true) {
        let r = core(c)
        c = r.c
        if (!r.changed) {
            break
        }
    }

    return c
}


async function unzip(v) {

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

    //rep
    src = rep(src)
    tar = rep(tar)

    //check
    if (!fsIsFile(src)) {
        return Promise.reject('src is not file: ' + src)
    }

    //unzip
    let r = await mZip.unzip(src, tar)

    return r
}


async function zipFile(v) {

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

    //rep
    src = rep(src)
    tar = rep(tar)

    //check
    if (!fsIsFile(src)) {
        return Promise.reject('src is not file: ' + src)
    }

    //zipFile
    let r = await mZip.zipFile(src, tar)

    return r
}


async function zipFolder(v) {

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

    //rep
    src = rep(src)
    tar = rep(tar)

    //check
    if (!fsIsFolder(src)) {
        return Promise.reject('src is not folder: ' + src)
    }

    //zipFolder
    let r = await mZip.zipFolder(src, tar)

    return r
}


async function keepFiles(v) {

    //params
    let src = get(v, 'src', null)
    let fileType = get(v, 'fileType', null)
    let dayLimit = get(v, 'dayLimit', null)
    let fmt = get(v, 'format', null)

    //check
    if (!src) {
        return Promise.reject('invalid src')
    }
    if (!fsIsFolder(src)) {
        return Promise.reject('src is not folder: ' + src)
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
    if (isestr(fmt)) {
        fmt = 'YYYYMMDD'
    }

    //fsGetFilesInFolder
    let rs = fsGetFilesInFolder(src)

    //dNow
    let dNow = dayjs(dayjs().format('YYYYMMDD'), 'YYYYMMDD') //取完全日, 不含時分秒

    //each
    let errs = []
    each(rs, (v) => {

        //namePure
        let namePure = path.basename(v, `.${fileType}`)

        try {

            //dFd
            let dFd = dayjs(namePure, fmt)

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
        catch (err) {
            errs.push(err)
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

    async function core(inp) {
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

        let msg = []
        try {

            //pmSeries, 需循序操作
            let r
            await pmSeries(s, async (v) => {
                let func = get(v, 'func', null)

                if (func === 'setLogFd') {
                    logFd = get(v, 'tar', '')
                }
                else if (func === 'unzip') {
                    r = await unzip(v)
                    msg.push(r)
                }
                else if (func === 'zipFile') {
                    r = await zipFile(v)
                    msg.push(r)
                }
                else if (func === 'zipFolder') {
                    r = await zipFolder(v)
                    msg.push(r)
                }
                else if (func === 'keepFiles') {
                    r = await keepFiles(v)
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
        let r = `finish at ${now2str()}`
        msg.push(r)

        return msg
    }

    //pm
    let pm = genPm()

    //core
    core(inp)
        .then((msg) => {
            //console.log('then', msg)
            pm.resolve(msg)
        })
        .catch((err) => {
            //console.log('catch', err)

            if (logFd !== '') {

                //logFd
                if (strright(logFd, 1) !== path.sep) {
                    logFd += path.sep
                }

                //check
                fsCreateFolder(logFd)

                //fn
                let fn = `error-${now2strp()}.log`
                fn = logFd + fn
                console.log('output error to: ' + path.resolve(fn))

                //msg
                let msg = o2j(err, true)

                //write
                fs.writeFileSync(fn, msg, 'utf8')

            }

            pm.reject(err)
        })

    return pm
}


export default WBackup
