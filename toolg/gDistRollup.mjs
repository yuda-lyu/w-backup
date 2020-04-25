import rollupFiles from 'w-package-tools/src/rollupFiles.mjs'


let fdSrc = './src'
let fdTar = './dist'


rollupFiles({
    fns: 'WBackup.mjs',
    fdSrc,
    fdTar,
    nameDistType: 'kebabCase',
    globals: {
        'path': 'path',
        'fs': 'fs',
        'child_process': 'child_process',
        'archiver': 'archiver',
        'archiver-zip-encrypted': 'archiver-zip-encrypted',
        'unzipper': 'unzipper',
    },
    external: [
        'path',
        'fs',
        'child_process',
        'archiver',
        'archiver-zip-encrypted',
        'unzipper',
    ],
})

//node --experimental-modules --es-module-specifier-resolution=node toolg/gDistRollup.mjs

