import fs from 'fs'
import ot from 'dayjs'
import get from 'lodash-es/get.js'
import each from 'lodash-es/each.js'
import join from 'lodash-es/join.js'
import cint from 'wsemi/src/cint.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import ispint from 'wsemi/src/ispint.mjs'
import isfun from 'wsemi/src/isfun.mjs'
import getFileTrueName from 'wsemi/src/getFileTrueName.mjs'
import fsGetFilesInFolder from 'wsemi/src/fsGetFilesInFolder.mjs'
import fsIsFolder from 'wsemi/src/fsIsFolder.mjs'


async function keepFiles(fdSrc, dayLimit, opt = {}) {

    //check fdSrc
    if (!fsIsFolder(fdSrc)) {
        return Promise.reject('fdSrc is not folder: ' + fdSrc)
    }

    //check
    if (!ispint(dayLimit)) {
        return Promise.reject('invalid dayLimit')
    }
    dayLimit = cint(dayLimit)

    //fmt
    let fmt = get(opt, 'format', null)
    if (!isestr(fmt)) {
        fmt = 'YYYYMMDD'
    }

    //funParseFileName
    let funParseFileName = get(opt, 'funParseFileName')

    //vfps
    let vfps = fsGetFilesInFolder(fdSrc)
    // console.log('vfps', vfps)

    //dNow
    let dNow = ot().format(fmt) //格式先取至fmt, 避免存在多餘時間
    dNow = ot(ot().format(fmt)) //再把現在fmt日期轉dayjs物件

    //each
    let errs = []
    each(vfps, (v) => {

        //fnt
        let fnt = ''
        if (isfun(funParseFileName)) {
            fnt = funParseFileName(v.name)
        }
        else {
            fnt = getFileTrueName(v.name)
        }
        // console.log('fnt', fnt)

        //dTar
        let dTar = ot(fnt, fmt)
        // console.log('dTar', dTar, dTar.isValid())

        //check
        if (!dTar.isValid()) {
            errs.push(`invalid fnt[${fnt}]`)
            return true //跳出換下一個
        }

        //diff
        let i = dNow.diff(dTar, 'day')
        // console.log('diff', i)

        //check
        if (i <= dayLimit) {
            return true //跳出換下一個
        }

        //unlinkSync
        try {
            fs.unlinkSync(v.path)
            // console.log('delete: ' + v.path)
        }
        catch (err) {
            errs.push(err)
        }

    })

    //check
    if (errs.length > 0) {
        return Promise.reject(join(errs, ', '))
    }

    return 'done: ' + fdSrc
}


export default keepFiles
