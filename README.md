# Stackmat Signal Processor
An Audio Worklet to process Stackmat Signals in real time and communicating an event stream through the Worker's message broker.


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

  // Connecting the StackmatSignalProcessor
  await audioContext.audioWorklet.addModule('https://raw.githubusercontent.com/Kubiverse/StackmatSignalProcessor/master/StackmatSignalProcessor.js')

  // Create an Audio Node for the Stackmat Signal Processor
  const stackmatSignal = new AudioWorkletNode(audioContext, 'StackmatSignalProcessor')

  microphone.connect(stackmatSignal)
  stackmatSignal.connect(audioContext.destination)

  stackmatSignal.port.onmessage = event => {
    handle(event.data)
  }
}
```

Note: Do not connect the Audio nodes to the device, as the Stackmat Signal Processor using the audio output for data states, doesn't sound pleasant.

## Message format

```json
{
    "state": {
      "id": 6,
      "descriptor": "LEFT",
    },
    "rightHand": false,
    "leftHand": true,
    "bothHands": false,
    "isReset": false,
    "isRunning": true,
    "time": 12373
  }
```

## Timers Supported so far

✔ Stackmat Timer Gen 4

✔ Stackmat Timer Gen 4 (with faulty pad detection)

❌ Stackmat Timer Gen 3

❌ Yuxin Timer v2

❌ Moyu Timer
