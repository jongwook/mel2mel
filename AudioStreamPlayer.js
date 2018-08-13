// Main controller for playing chunks enqueued for decoding.
const AudioStreamPlayer = (function() {
    const worker = new Worker('/worker-decoder.js'),
          audioCtx = new (window.AudioContext || window.webkitAudioContext)(),
          audioSrcNodes = []; // Used to fix Safari Bug https://github.com/AnthumChris/fetch-stream-audio/issues/1

    let totalTimeScheduled = 0,   // time scheduled of all AudioBuffers
        playStartedAt = 0,        // audioContext.currentTime of first scheduled play buffer
        abCreated = 0,            // AudioBuffers created
        abEnded = 0;              // AudioBuffers played/ended

    // TODO errors should be signaled to caller
    worker.onerror = event => { console.error(event); };

    worker.onmessage = event => {
        if (event.data.channelData) {
            const decoded = event.data;

            // convert Transferrable ArrayBuffer to Float32Array
            decoded.channelData = decoded.channelData.map(arrayBuffer => new Float32Array(arrayBuffer));

            schedulePlayback(decoded);
        }
    }

    var setStatusCallback = null;
    var setProgressCallback = null;

    function setCallbacks(setStatus, setProgress) {
        setStatusCallback = setStatus;
        setProgressCallback = setProgress;
    }

    // Pause/Resume with space bar
    // document.onkeydown = event => {
    //     if (event.code === 'Space') {
    //         togglePause();
    //     }
    // }

    function onAudioNodeEnded() {
        audioSrcNodes.shift();
        abEnded++;
    }

    // arrayBuffer will be inaccessible to caller after performant Transferable postMessage()
    function enqueueForDecoding(arrayBuffer) {
        worker.postMessage({decode: arrayBuffer}, [arrayBuffer]);
    }

    var interval = null;

    function updateUI() {
        if (audioCtx.currentTime > playStartedAt) {
            if (setStatusCallback) setStatusCallback('Playing audio ...');
            if (setProgressCallback) setProgressCallback(Math.min((audioCtx.currentTime - playStartedAt) / 10, 1));
        }

        if (audioCtx.currentTime > playStartedAt + 10) {
            if (setStatusCallback) setStatusCallback('Complete');
            window.clearInterval(interval);
        }
    }

    function schedulePlayback({channelData, length, numberOfChannels, sampleRate}) {
        const audioSrc = audioCtx.createBufferSource(),
              audioBuffer = audioCtx.createBuffer(numberOfChannels,length, sampleRate);

        audioSrc.onended = onAudioNodeEnded;
        abCreated++;

        // ensures onended callback is fired in Safari
        if (window.webkitAudioContext) {
            audioSrcNodes.push(audioSrc);
        }

        // Use performant copyToChannel() if browser supports it
        for (let c=0; c<numberOfChannels; c++) {
            if (audioBuffer.copyToChannel) {
                audioBuffer.copyToChannel(channelData[c], c)
            } else {
                let toChannel = audioBuffer.getChannelData(c);
                for (let i=0; i<channelData[c].byteLength; i++) {
                    toChannel[i] = channelData[c][i];
                }
            }
        }

        // initialize first play position.  initial clipping/choppiness sometimes occurs and intentional start latency needed
        // read more: https://github.com/WebAudio/web-audio-api/issues/296#issuecomment-257100626
        if (!playStartedAt) {
            const startDelay = 4.5;
            playStartedAt = audioCtx.currentTime + startDelay;
        }

        interval = setInterval(updateUI, 50);
        audioSrc.buffer = audioBuffer
        audioSrc.connect(audioCtx.destination);
        audioSrc.start(playStartedAt+totalTimeScheduled);
        totalTimeScheduled += audioBuffer.duration;
    }

    function togglePause() {
        if(audioCtx.state === 'running') {
            audioCtx.suspend()
        } else if(audioCtx.state === 'suspended') {
            audioCtx.resume()
        }
    }

    return {
        setCallbacks,
        enqueueForDecoding,
        togglePause
    }
})()

