#!/usr/bin/env bash

mkdir dist
touch StackmatSignalProcessor.js
echo 'export default `data:application/javascript,` + encodeURI(`' > dist/StackmatSignalProcessor.js
cat src/StackmatSignalProcessor.js >> dist/StackmatSignalProcessor.js
echo '`)' >> dist/StackmatSignalProcessor.js