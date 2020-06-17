import dayjs from 'dayjs'
import split from 'lodash/split'
import join from 'lodash/join'
import replace from 'wsemi/src/replace.mjs'

let d1 = dayjs('1921-01-01')
console.log(d1.format('YY-MM-DD'))

let d2 = dayjs('ex20-01-01', 'exYY-MM-DD')
console.log(d2.format('YY-MM-DD'))

//node --experimental-modules --es-module-specifier-resolution=node g.mjs
