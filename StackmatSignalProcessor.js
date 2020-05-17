class StackmatSignalProcessor extends AudioWorkletProcessor {
  sign = 1
  THRESHOLD_EDGE = 0.7
  THRESHOLD_SCHMIDT = 0.2
  duration = 0
  recentValues = []
  bitSize = 1
  eventTarget;

  bitBuffer = []
  byteBuffer = []
  idleVal = 0
  lastBit = 0
  lastBitLength = 0
  noStateLength = 0
  byteStream = []

  constructor() {
    super()
    this.bitSize = sampleRate / 1200
    this.recentValues.length = Math.ceil(this.bitSize / 6)
    this.byteStream.length = 30
  }

  process(inputs, outputs) {
    let power
    let lastPower = 1
    let gain
    let agcFactor = 0.0001

    inputs[0][0].forEach(input => {
      power = input * input
      lastPower = Math.max(agcFactor, lastPower + (power-lastPower) * agcFactor)
      gain = 1 / Math.sqrt(lastPower)
      this.disectChunks(input*gain)
    })

    const output = outputs[0]
    output.forEach(channel => {
      for (let i = 0; i < this.byteStream.length; i++) {
        channel[i] = this.byteStream[i]
      }
    })
  
    return true
  }

  disectChunks(signal) {
    this.recentValues.unshift(signal)
    let lastValue = this.recentValues.pop()
    this.duration++;

    if ((lastValue - signal) * (this.sign ? 1 : -1) > this.THRESHOLD_EDGE && Math.abs(signal - (this.sign ? 1 : -1)) - 1 > this.THRESHOLD_SCHMIDT && this.duration > this.bitSize * 0.6) {
      for (let i = 0; i < Math.round(this.duration / this.bitSize); i++) {
        this.appendBit(this.sign)
      }
      this.sign ^= 1
      this.duration = 0
    }
  }

  appendBit(bit) {
    this.bitBuffer.push(bit)

    if (bit != this.lastBit) {
      this.lastBitLength = 0
    }
    
    this.lastBit = bit
    this.lastBitLength++

    if (this.lastBitLength > 10) {
      this.idleVal = bit
      this.bitBuffer = []
      this.byteBuffer = []
    }

    if (this.bitBuffer.length == 10) {
      if (this.bitBuffer[0] == this.idleVal || this.bitBuffer[9] != this.idleVal) {
        this.bitBuffer = this.bitBuffer.slice(1)
      } else {
        let val = 0
        for (var i = 8; i > 0; i--) {
					val = val << 1 | (this.bitBuffer[i] == this.idleVal ? 1 : 0)
        }
				this.bitBuffer = []
        this.byteBuffer.push(String.fromCharCode(val))
        this.byteStream.shift()
        this.byteStream.push((val / 128) - 1)
        if (this.byteBuffer.length >= 9) {
          console.log(decode(this.byteBuffer));
        }
      }
    }
  }

  appendByteStream(state, time) {
    return
  }
}

function decode(byteBuffer) {
  let sum = 64
  let time = 0
  const reIsDigit = RegExp('[0-9]')
  const reIsValidState = RegExp('[ ACILSR]')
  const state = byteBuffer.shift(0)
  const digits = byteBuffer.splice(0,6)
  const checksum = byteBuffer.shift(0)
  const semantics = byteBuffer

  console.info({state, digits, checksum, semantics})

  if (!reIsValidState.test(state)) {
    console.info('Failed State check!')
    return
  }

  for (let i = 0; i < digits.length; i++) {
    if (!reIsDigit.test(digits[i])) {
      console.info('Failed digit check!', digits[i])
      return
    }
    sum += ~~digits[i]
  }

  if (checksum.charCodeAt(0) !== sum) {
    console.info('Failed Check sum check!')
    return
  }

  time = ~~digits[0]*60000 + 1000*(~~digits[1]*10 + ~~digits[2]) + ~~digits[3]*100 + ~~digits[4]*10 + ~~digits[5]

  return {
    state: state,
    time: time,
  }
}

registerProcessor('StackmatSignalProcessor', StackmatSignalProcessor);