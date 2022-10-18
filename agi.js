const fs = require('fs')
const EventEmitter = require('events')
const eventEmitter = new EventEmitter
const agi = module.exports = eventEmitter

agi._isReady = false
agi._commandRunning = false

agi._ready = () => {
  process.stdin.off('data', agi._initCallback)
  agi._isReady = true
  eventEmitter.emit('ready')
}

agi._initCallback = data => {
  data = data.toString()
  data = data.split('\n')
  data.pop()
  data.forEach(val => {
    if (val.length === 0) return agi._ready()
    const key = val.substr(0, val.indexOf(':')).replace(/agi_/g,'_')
    const value = val.substr(val.indexOf(':') + 2)
    agi[key] = value
  })
}

process.stdin.on('data', agi._initCallback)

agi._issueCommand = (command) => {
  return new Promise((resolve, reject) => {
    if (!agi._isReady) return reject('Process is not ready to issue commands')
    if (agi._commandRunning) return reject(`Overlapping command "${command}".  Did you forget to await the previous command?`)
    agi._commandRunning = true
    process.stdin.once('data', data => {  
      data = data.toString().trim()
      const result = data.substr(11)
      agi._commandRunning = false
      if (data.substr(0,3) !== '200') return reject(result)
      return resolve(result)
    })
    process.stdout.write(`${command}\n`)
  })
}

agi.end = () => {
  process.exit(0)
}

agi.answer = () => {
  return agi._issueCommand('ANSWER')
}

agi.asyncagiBreak = () => {
  return agi._issueCommand('ASYNCAGI BREAK')
}

agi.channelStatus = channelName => {
  return agi._issueCommand(`CHANNEL STATUS ${channelName}`)
}

agi.exec = (application, options) => {
  return agi._issueCommand(`EXEC ${application} ${options}`)
}

agi.getData = (file, timeout, maxDigits) => {
  return agi._issueCommand(`GET DATA "${file}" "${timeout}" "${maxDigits}"`)
}

agi.getOption = (filename, escapeDigits, timeout) => {
  return agi._issueCommand(`GET OPTION "${filename}" "${escapeDigits}" "${timeout}"`)
}

agi.goSub = (context, extension, priority, optArgs = []) => {
  let command = `GOSUB "${context}" "${extension}" "${priority}"`
  if (optArgs.length > 0) {
    command += ` "${optArgs.join(',')}"`
  }
  return agi._issueCommand(command)
}

agi.verbose = (message, level = 3) => {
  message = message.trim().replace(/"/g,'\\"')
  return agi._issueCommand(`VERBOSE "${message}" ${level}`)
}


//-----STREAM FILE-----
agi.streamFile = (filename, escapeDigits, sample, offset) => {
  return agi._issueCommand(`STREAM FILE "${filename}" "${escapeDigits}" "${sample}" "${offset}"`)
}

agi.streamFile.control = (filename, escapeDigits, skipms, ffchar = '#', rewchr = '*', pausechr, offsetms) => {
  return agi._issueCommand(`CONTROL STREAM FILE "${filename}" "${escapeDigits}" "${skipms}" "${ffchar}" "${pausechr}" "${offsetms}"`)
}


//-----DATABASE-----
agi.database = {}

agi.database.del = (family, key) => {
  return agi._issueCommand(`DATABASE DEL "${family}" "${key}"`)
}

agi.database.deltree = (family, keytree) => {
  return agi._issueCommand(`DATABASE DELTREE "${family}" "${keytree}"`)
}

agi.database.get = (family, key) => {
  return agi._issueCommand(`DATABASE GET "${family}" "${key}"`)
}

agi.database.put = (family, key, value) => {
  return agi._issueCommand(`DATABASE PUT "${family}" "${key}" "${value}"`)
}

//-----VARIABLE-----
agi.variable = {}

agi.variable.get = variableName => {
  return new Promise(async (resolve, reject) => {
    const result = await agi._issueCommand(`GET VARIABLE "${variableName}"`)
    if (result.substr(0,1) === '0') return reject('No such variable')
    const matches = result.match(/1 \((.*)\)/)
    return resolve(matches[1])
  })
}

agi.variable.getFull = (variableName, channel = agi._channel) => {
  return new Promise(async (resolve, reject) => {
    const result = await agi._issueCommand(`GET FULL VARIABLE "${variableName}" "${channel}"`)
    if (result.substr(0,1) === '0') return reject('No such variable')
    const matches = result.match(/1 \((.*)\)/)
    return resolve(matches[1])
  })
}

agi.variable.set = (variableName, variableValue) => {
  return agi._issueCommand(`SET VARIABLE "${variableName}" "${variableValue}"`)
}

//-----SAY-----
agi.say = {}

agi.say.alpha = (string, escapeDigits) => {
  return agi._issueCommand(`SAY ALPHA "${string}" "${escapeDigits}"`)
}

agi.say.date = (unixTime, escapeDigits) => {
  return agi._issueCommand(`SAY DATE "${unixTime}" "${escapeDigits}"`)
}

agi.say.datetime = (unixTime, escapeDigits, format = 'ABdY \'digits/at\' IMp', timezone = Intl.DateTimeFormat().resolvedOptions().timeZone) => {
  return agi._issueCommand(`SAY DATETIME "${unixTime}" "${escapeDigits}" "${format}" "${timezone}"`)
}

agi.say.digits = (number, escapeDigits) => {
  return agi._issueCommand(`SAY DIGITS "${number}" "${escapeDigits}"`)
}

agi.say.number = (number, escapeDigits, gender) => {
  return agi._issueCommand(`SAY NUMBER "${number}" "${escapeDigits}" "${gender}"`)
}

agi.say.phonetic = (string, escapeDigits) => {
  return agi._issueCommand(`SAY PHONETIC "${string}" "${escapeDigits}"`)
}

agi.say.time = (unixTime, escapeDigits) => {
  return agi._issueCommand(`SAY TIME "${unixTime}" "${escapeDigits}"`)
}
