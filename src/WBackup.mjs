// import process from 'process'
import path from 'path'
import fs from 'fs'
import JSON5 from 'json5'
import dayjs from 'dayjs'
import get from 'lodash-es/get.js'
import each from 'lodash-es/each.js'
import split from 'lodash-es/split.js'
import join from 'lodash-es/join.js'
import genPm from 'wsemi/src/genPm.mjs'
import cint from 'wsemi/src/cint.mjs'
import cstr from 'wsemi/src/cstr.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import isstr from 'wsemi/src/isstr.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import isbol from 'wsemi/src/isbol.mjs'
import isint from 'wsemi/src/isint.mjs'
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
import fsCopyFolder from 'wsemi/src/fsCopyFolder.mjs'
// import mZip from 'w-zip/src/mZip.mjs'
import m7z from 'w-zip/src/m7z.mjs'


let logFd = '' //若由排程呼叫且不給logFd絕對路徑時, 預設是位於C:\Windows\system32
let logWhenSuccess = false
let logWhenError = true


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


function ck7z(r) {
    let state = get(r, 'state', '')
    state = cstr(state)
    let msg7z = get(r, 'msg7z', '')
    msg7z = cstr(msg7z)
    if (isestr(msg7z)) {
        //採用7z
        if (msg7z.indexOf('Everything is Ok') >= 0) {
            return state.replace('finish:', 'done:')
        }
        else {
            return msg7z
        }
    }
    else {
        //採用zip
        return r
    }
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
    let r = await m7z.unzip(src, tar)

    //ck7z
    r = ck7z(r)

    return r
}


async function copyFile(v) {

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

    //copyFileSync
    try {
        fs.copyFileSync(src, tar)
    }
    catch (err) {
        return Promise.reject(err)
    }

    return 'done: ' + tar
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

    //level
    let level = get(v, 'level', 1)
    if (!isint(level)) {
        level = 1
    }
    level = cint(level)
    if (level < 0 || level > 9) {
        level = 1
    }

    //pw
    let pw = get(v, 'pw', '')
    if (!isstr(pw)) {
        pw = ''
    }

    //opt
    let opt = {
        level,
        pw,
    }

    //zipFile
    let r = await m7z.zipFile(src, tar, opt)

    //ck7z
    r = ck7z(r)

    return r
}


async function copyFolder(v) {

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

    //fsCopyFolder
    let r = fsCopyFolder(src, tar)

    //check
    if (r.error) {
        return Promise.reject(r.error)
    }

    return 'done: ' + tar
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

    //level
    let level = get(v, 'level', 1)
    if (!isint(level)) {
        level = 1
    }
    level = cint(level)
    if (level < 0 || level > 9) {
        level = 1
    }

    //pw
    let pw = get(v, 'pw', '')
    if (!isstr(pw)) {
        pw = ''
    }

    //opt
    let opt = {
        level,
        pw,
    }

    //zipFolder
    let r = await m7z.zipFolder(src, tar, opt)

    //ck7z
    r = ck7z(r)

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
 * let fpSetting = './setting-zip.json'
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

                //settings
                let settings = get(v, 'settings', null)
                if (settings !== null) {

                    //logFd
                    let _logFd = get(settings, 'logFd', null)
                    if (isestr(_logFd)) {
                        logFd = _logFd
                    }

                    //logWhenSuccess
                    let _logWhenSuccess = get(settings, 'logWhenSuccess', null)
                    if (isbol(_logWhenSuccess)) {
                        logWhenSuccess = _logWhenSuccess
                    }

                    //logWhenError
                    let _logWhenError = get(settings, 'logWhenError', null)
                    if (isbol(_logWhenError)) {
                        logWhenError = _logWhenError
                    }

                    //path7zexe
                    let _path7zexe = get(settings, 'path7zexe', null)
                    if (fsIsFile(_path7zexe)) {
                        m7z.setProg(_path7zexe)
                    }

                    return
                }

                //func
                let func = get(v, 'func', null)

                if (func === 'unzip') {
                    r = await unzip(v)
                }
                else if (func === 'zipFile') {
                    r = await zipFile(v)
                }
                else if (func === 'zipFolder') {
                    r = await zipFolder(v)
                }
                else if (func === 'keepFiles') {
                    r = await keepFiles(v)
                }
                else if (func === 'copyFile') {
                    r = await copyFile(v)
                }
                else if (func === 'copyFolder') {
                    r = await copyFolder(v)
                }
                else {
                    r = 'error: invalid func'
                }
                msg.push(`${func} ${r}`)
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

    function logMsg(type, msg) {
        if (logFd !== '') {

            //logFd
            if (strright(logFd, 1) !== path.sep) {
                logFd += path.sep
            }

            //check
            fsCreateFolder(logFd)

            //fn
            let fn = `${type}-${now2strp()}.log`
            fn = logFd + fn
            console.log(`output ${type} to: ${path.resolve(fn)}`)

            //msg
            msg = o2j(msg, true)

            //write
            fs.writeFileSync(fn, msg, 'utf8')

        }
    }

    //pm
    let pm = genPm()

    //core
    core(inp)
        .then((msg) => {
            //console.log('then', msg)
            if (logWhenSuccess) {
                logMsg('success', msg)
            }
            pm.resolve(msg)
        })
        .catch((err) => {
            //console.log('catch', err)
            if (logWhenError) {
                logMsg('error', err)
            }
            pm.reject(err)
        })

    return pm
}


export default WBackup
