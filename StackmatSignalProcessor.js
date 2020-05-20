const THRESHOLD_EDGE = 0.7

class StackmatSignalProcessor extends AudioWorkletProcessor {
  bitSampleRate
  sign = 1
  signalDuration = 0
  signalBuffer = []
  byteBuffer = []

  constructor() {
    super()
    this.bitSampleRate = sampleRate / 1200 // Stackmat only
    this.signalBuffer.length = Math.ceil(this.bitSampleRate / 6)
    this.bits = new BitStream()
  }

  process(inputs, outputs) {
    let power
    let gain
    let lastPower = 1
    let agcFactor = 0.0001

    inputs[0][0].forEach(input => {
      power = input * input
      lastPower = Math.max(agcFactor, lastPower + (power-lastPower) * agcFactor)
      gain = 1 / Math.sqrt(lastPower)
      this.processSignal(input*gain)
    })
  
    return true
  }

  processSignal(signal) {
    this.signalBuffer.unshift(signal)
    let lastSignal = this.signalBuffer.pop()
    this.signalDuration++;

    if (this.signalIsEdge(signal, lastSignal)) {
      for (let i = 0; i < Math.round(this.signalDuration / this.bitSampleRate); i++) {
        this.bits.append(this.sign)

        if (this.bits.isEmpty()) {
          this.byteBuffer = [] // align byte blocks
        }
        
        if (this.bits.isFull()) {
          this.byteBuffer.push(this.bits.dump())

          if (this.byteBuffer.length >= 10) {
            this.processByteBlock()
          }
        }
      }
      this.sign ^= 1
      this.signalDuration = 0
    }
  }

  signalIsEdge(signal, lastSignal) {
    return Math.abs(lastSignal - signal) > THRESHOLD_EDGE && this.signalDuration > this.bitSampleRate * 0.6
  }

  processByteBlock() {
    const state = decodeByteBlock(this.byteBuffer) || {...StackmatStates.get('X')}
    this.byteBuffer = []

    this.port.postMessage(state)
  }
}

class BitStream {
  buffer = []
  idleValue = 0
  lastBit = 0
  lastBitLength = 0

  append(bit) {
    this.buffer.push(bit)
    this.lastBitLength = bit === this.lastBit ? this.lastBitLength + 1 : 1
    this.lastBit = bit

    if (this.lastBitLength > 10) {
      this.idleValue = bit
      this.reset(bit)
    }
  }

  reset() {
    this.buffer = []
  }

  isEmpty() {
    return this.buffer.length === 0
  }

  isFull() {
    if (this.buffer.length >= 10) {
      if (this.buffer[0] == this.idleValue || this.buffer[9] != this.idleValue) {
        this.buffer = this.buffer.slice(1)
        return false
      } else {
        return true
      }
    }
    return false
  }

  toByte() {
    let byte = 0
    for (var i = 8; i > 0; i--) {
      byte = byte << 1 | this.buffer[i] === this.idleValue
    }
    return String.fromCharCode(byte)
  }

  dump() {
    const byte = this.toByte()
    this.reset()

    return byte
  }
}


function decodeByteBlock(byteBuffer) {
  let sum = 64
  let time = 0
  const reIsDigit = RegExp('[0-9]')
  const reIsValidState = RegExp('[ ACILSR]')
  const state = byteBuffer.shift(0)
  const digits = byteBuffer.splice(0,6)
  const checksum = byteBuffer.shift(0)
  const semantics = byteBuffer

  if (!reIsValidState.test(state)) {
    return
  }

  for (let i = 0; i < digits.length; i++) {
    if (!reIsDigit.test(digits[i])) {
      return
    }
    sum += ~~digits[i]
  }

  if (checksum.charCodeAt(0) !== sum) {
    return
  }

  time += ~~digits[0]*60000 // minutes
  time += 1000*(~~digits[1]*10 + ~~digits[2]) // seconds
  time += ~~digits[3]*100 + ~~digits[4]*10 + ~~digits[5] // milliseconds

  return {
    ...StackmatStates.get(state),
    time: time,
    isReset: time === 0,
  }
}

const StackmatStates = {
  base: {
    state: {
      id: -1,
      descriptor: "ERROR",
    },
    rightHand: false,
    leftHand: false,
    bothHands: false,
    isReset: false,
    isRunning: false,
    time: 0
  },
  get: stateCode => {
    switch(stateCode) {
      case " ":
        StackmatStates.base.isRunning = true
        StackmatStates.base.isreset = false
        return {
          ...StackmatStates.base,
          state: {
            id: 1,
            descriptor: "RUNNING",
          },
        }
      case "A":
        return {
          ...StackmatStates.base,
          state: {
            id: 2,
            descriptor: "STARTING",
          },
          rightHand: true,
          leftHand: true,
          bothHands: true,
        }
      case "C":
        StackmatStates.base.isRunning = false
        return {
          ...StackmatStates.base,
          state: {
            id: 3,
            descriptor: "BOTH_HANDS",
          },
          rightHand: true,
          leftHand: true,
          bothHands: true,
        }
      case "I":
        StackmatStates.base.isRunning = false
        return {
          ...StackmatStates.base,
          state: {
            id: 4,
            descriptor: "IDLE",
          },
        }
      case "L":
        return {
          ...StackmatStates.base,
          state: {
            id: 6,
            descriptor: "LEFT",
          },
          leftHand: true,
        }
      case "S":
        StackmatStates.base.isRunning = false
        return {
          ...StackmatStates.base,
          state: {
            id: 7,
            descriptor: "STOPPED",
          },
          rightHand: true,
          leftHand: true,
          bothHands: true,
        }
      case "R":
        return {
          ...StackmatStates.base,
          state: {
            id: 8,
            descriptor: "RIGHT",
          },
          rightHand: true,
        }
      default:
        return {
          ...StackmatStates.base,
          state: {
            id: -1,
            descriptor: "ERROR",
          },
        }
    }
  }
}

registerProcessor('StackmatSignalProcessor', StackmatSignalProcessor);