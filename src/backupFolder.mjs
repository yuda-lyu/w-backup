import ot from 'dayjs'
import get from 'lodash-es/get.js'
import cint from 'wsemi/src/cint.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import ispint from 'wsemi/src/ispint.mjs'
import replace from 'wsemi/src/replace.mjs'
import getFileTrueName from 'wsemi/src/getFileTrueName.mjs'
import getPathParent from 'wsemi/src/getPathParent.mjs'
import fsIsFile from 'wsemi/src/fsIsFile.mjs'
import fsIsFolder from 'wsemi/src/fsIsFolder.mjs'
import fsCreateFolder from 'wsemi/src/fsCreateFolder.mjs'
// import mZip from 'w-zip/src/mZip.mjs'
import m7z from 'w-zip/src/m7z.mjs'
import keepFiles from './keepFiles.mjs'


let backupFolder = async(fdSrc, fdTar, opt = {}) => {

    //check
    if (!fsIsFolder(fdSrc)) {
        return {
            state: 'success',
            msg: `fdSrc[${fdSrc}] does not exist`,
        }
    }

    //check
    if (!fsIsFolder(fdTar)) {
        fsCreateFolder(fdTar)
    }

    //level
    let level = get(opt, 'level', 1)
    if (!ispint(level)) {
        level = 1
    }
    level = cint(level)
    if (level < 0 || level > 9) {
        level = 1
    }

    //pw
    let pw = get(opt, 'pw', '')
    if (!isestr(pw)) {
        pw = ''
    }

    //dayLimit
    let dayLimit = get(opt, 'dayLimit', null)
    if (!ispint(dayLimit)) {
        dayLimit = 365
    }
    dayLimit = cint(dayLimit)

    //format
    let fmt = get(opt, 'format', null)
    if (!isestr(fmt)) {
        fmt = 'YYYYMMDD'
    }

    //pre
    let pre = get(opt, 'pre', '')
    if (!isestr(pre)) {
        pre = ''
    }

    //d
    let d = ot()

    //cDay
    let cDay = d.add(-1, 'day').format('YYYYMMDD')

    //fnTar
    let fnTar = `${pre}${cDay}.7z`

    //fdTarDay
    let fdTarDay = `${fdTar}/${fnTar}`

    //check
    if (fsIsFile(fdTarDay)) {
        return {
            state: 'success',
            msg: 'skip',
        }
    }

    //optZip
    let optZip = {
        level,
        pw,
    }

    //zipFolder, 發生錯誤得報錯
    let rZip = await m7z.zipFolder(fdSrc, fdTarDay, optZip)

    //funParseFileName
    let funParseFileName = (fn) => {
        fn = getFileTrueName(fn)
        fn = replace(fn, pre, '')
        return fn
    }

    //keepFiles, 發生錯誤儲存不報錯
    let rKeep = null
    await keepFiles(getPathParent(fdTarDay), dayLimit, { format: fmt, funParseFileName })
        .then((res) => {
            rKeep = res
        })
        .catch((err) => {
            rKeep = err
        })

    //r
    let r = {
        state: 'success',
        msg: {
            zip: get(rZip, 'state', ''),
            keep: rKeep,
        },
    }
    // console.log('r', r)

    return r
}


export default backupFolder
