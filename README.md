# Stackmat Signal Processor
An Audio Worklet to process Stackmat Signals in real time and communicating an event stream through the Audio Output layer for processing by an Audio Analyzer.


## Example usage
A simple example of how to implement the Stackmat Signal Processor with an Analyser.
```js
async function connect() {
  // Connect to media device
  let stream = await navigator.mediaDevices.getUserMedia({
    "audio": {"optional": [{"echoCancellation": false}]}
  })

  // Get the Audio Context
  const audioContext = new AudioContext({
    "echoCancellation": false,
    "noiseSuppression": false
  })

  // Create relevant Audio Nodes
  const microphone = audioContext.createMediaStreamSource(stream)
  const analyser = audioContext.createAnalyser()

  // setting up som analyser settings
  analyser.fftSize = 2048;

  // Connecting the StackmatSignalProcessor
  await audioContext.audioWorklet.addModule('https://raw.githubusercontent.com/Kubiverse/StackmatSignalProcessor/master/StackmatSignalProcessor.js')

  // Create an Audio Node for the Stackmat Signal Processor
  const stackmatSignal = new AudioWorkletNode(audioContext, 'StackmatSignalProcessor')
    
  // Connect the Audio Nodes: Mic -> Stackmat Signal Processor -> Stackmat Signal Analyser
  microphone.connect(stackmatSignal)
  stackmatSignalNode.connect(analyser)

  // Setup the analyser interval
  setInterval(() => {
    let data = new Uint8Array(analyser.frequencyBinCount)
    // Read and parse data
  }, 100)
```

Note: Do not connect the Audio nodes to the device, as the Stackmat Signal Processor using the audio output for data states, doesn't sound pleasant.

## Audio Signal Output format (Draft)

| Byte Length | From Byte | To Byte | Block Name | Description |
|---|---|---|---|---|
| 1 | 0 | 0 | HeadId | An ID for the current state, states are in theory not unique, but you should not expect to have an overlap |
| 1 | 1 | 1 | HeadState | Bit 0: State Change Flag, Bit 1: State explicitely deduced, Rest: State Id. 0x01000011 = no state change, state 3, 0x11000011 = state change, state 3, 0x10000011 = implicitely deduced state change, state 3 |
| 3 | 2 | 4 | HeadTime | The Current time in milliseconds packed into 3 bytes |
| 2 | 5 | 6 | HeadBuffer | Saving 2 bytes for future functionality |
| 1 | 7 | 7 | PastId1 | An ID for the current state, states are in theory not unique, but you should not expect to have an overlap |
| 1 | 8 | 8 | PastState1 | Bit 0: State Change Flag, Bit 1: State explicitely deduced, Rest: State Id. 0x01000011 = no state change, state 3, 0x11000011 = state change, state 3, 0x10000011 = implicitely deduced state change, state 3 |
| 3 | 9 | 11 | PastTime1 | The Current time in milliseconds packed into 3 bytes |
| 2 | 12 | 13 | PastBuffer1 | Saving 2 bytes for future functionality |
| 1 | 14 | 14 | PastId2 | An ID for the current state, states are in theory not unique, but you should not expect to have an overlap |
| 1 | 15 | 15 | PastState2 | Bit 0: State Change Flag, Bit 1: State explicitely deduced, Rest: State Id. 0x01000011 = no state change, state 3, 0x11000011 = state change, state 3, 0x10000011 = implicitely deduced state change, state 3 |
| 3 | 16 | 18 | PastTime2 | The Current time in milliseconds packed into 3 bytes |
| 2 | 19 | 20 | PastBuffer2 | Saving 2 bytes for future functionality |
| ... | ... | ... | ... | ... |
| 1 | 210 | 210 | PastId30 | An ID for the current state, states are in theory not unique, but you should not expect to have an overlap |
| 1 | 211 | 211 | PastState30 | Bit 0: State Change Flag, Bit 1: State explicitely deduced, Rest: State Id. 0x01000011 = no state change, state 3, 0x11000011 = state change, state 3, 0x10000011 = implicitely deduced state change, state 3 |
| 3 | 212 | 214 | PastTime30 | The Current time in milliseconds packed into 3 bytes |
| 2 | 215 | 216 | PastBuffer30 | Saving 2 bytes for future functionality |

| Byte(s) | Block | Translation |
|---|---|---|
| 0x00000100 | HeadId | Id: 4 |
| 0x10000011 | HeadState | State Change to StateId: 3 |
| 0x00000001<br>0x00011010<br>0x11101111 | HeadTime | Current time on display is: 72431 ms |
| 0x00000000<br>0x00000000 | HeadBuffer | means nothing |
| 0x00000011 | PastId1 | Id: 3 |
| 0x00000000 | PastState1 | State Remained StateId: 0 |
| 0x00000001<br>0x00011010<br>0x11101000 | PastTime1 | Current time on display is: 72424 ms |
| 0x00000000<br>0x00000000 | PastBuffer1 | means nothing |
