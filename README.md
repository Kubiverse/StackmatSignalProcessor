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