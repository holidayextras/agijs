#!/usr/local/bin/node

const fs = require('fs')

const agi = require('./agi.js')

agi.on('ready', async () => {
  try {
    await agi.verbose(JSON.stringify(agi))
    await agi.answer()
    await agi.verbose(agi._uniqueid)
    await agi.goSub('subs','00010','1', ['123','456'])
    await agi.variable.set('FOO','BAR')
  } catch (e) {
    fs.appendFileSync('/usr/share/asterisk/agi-bin/error.log',`${e}\n`)
  } finally {
    agi.end()
  }
})
