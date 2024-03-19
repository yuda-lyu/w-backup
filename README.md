# w-backup
A backup tool for files and folders.

![language](https://img.shields.io/badge/language-JavaScript-orange.svg) 
[![npm version](http://img.shields.io/npm/v/w-backup.svg?style=flat)](https://npmjs.org/package/w-backup) 
[![license](https://img.shields.io/npm/l/w-backup.svg?style=flat)](https://npmjs.org/package/w-backup) 
[![gzip file size](http://img.badgesize.io/yuda-lyu/w-backup/master/dist/w-backup.umd.js.svg?compression=gzip)](https://github.com/yuda-lyu/w-backup)
[![npm download](https://img.shields.io/npm/dt/w-backup.svg)](https://npmjs.org/package/w-backup) 
[![npm download](https://img.shields.io/npm/dm/w-backup.svg)](https://npmjs.org/package/w-backup) 
[![jsdelivr download](https://img.shields.io/jsdelivr/npm/hm/w-backup.svg)](https://www.jsdelivr.com/package/npm/w-backup)

## Documentation
To view documentation or get support, visit [docs](https://yuda-lyu.github.io/w-backup/WBackup.html).

## Installation
### Using npm(ES6 module):
> **Note:** `w-backup` is mainly dependent on `w-zip` and `json5`.

> **Note:** `w-backup` can be compiled into an executable file by using `pkg`. 

```alias
npm i w-backup
```

#### Example:
> **Link:** [[dev source code](https://github.com/yuda-lyu/w-backup/blob/master/g.mjs)]
```alias
import fs from 'fs'
import w from 'wsemi'
import wb from 'w-backup'

let fpSetting = './setting-zip.json'
let fpBackup = './testData/output'
let fpKeep = './testData/outputList'

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

//use setting.json
wb(fpSetting)
    .then((msg) => {
        console.log(msg)
    })
    .catch((err) => {
        console.log(err)
    })

// then => output success to: path/to/testLog/success-20200806193318.log
// [
//   'done: ./testData/output/20200805/test-y1.zip',
//   'done: ./testData/output/2020-08-05/test-y2.zip',
//   'done: ./testData/output/20-08-05/test-y3.zip',
//   'done: ./testData/output/2020-08-06/test-t1.zip',
//   'done: ./testData/output/20200806/test1.zip',
//   'done: ./testData/output/20200806/test2.zip',
//   'done: ./testData/output/20200806/test3.zip',
//   'done: ./testData/output/20200806/unzip/test1',
//   'done: ./testData/output/20200806/unzip/test2',
//   'done: ./testData/output/20200806/unzip/test3',
//   'done: ./testData/outputList',
//   'finish at 2020-08-06T19:33:18+08:00'
// ]
```

## Build an executable file:
You can use `./src/compile.js` and `pkg` to compile `w-backup` into an executable file.

> **Compile for windows:**
```
./node_modules/.bin/pkg -t win src/compile.js --output bin/wb.exe

```

> **Run for windows:**
```
path/to/wb.exe path/to/setting.json
```
