mel2mel = (function(global) {
    const content = document.getElementById('content');
    const title = document.getElementById('title');
    const input = document.getElementById('input');
    const midiMessage = document.getElementById('midi-message');
    const melody = document.getElementById('melody');
    const mel = document.getElementById('mel');
    const status = document.getElementById('status');
    const initialLoader = document.getElementById('initial-loader');
    const loader = document.getElementById('loader');

    const MAX_LENGTH = 10;
    const STEP_SIZE = 128;
    const SAMPLE_RATE = 16000;
    const STEP_RATE = SAMPLE_RATE / STEP_SIZE;
    const MAX_STEPS = Math.floor(MAX_LENGTH * SAMPLE_RATE / STEP_SIZE);
    const midiData = new Float32Array(88*2 * MAX_STEPS);
    const instruments = [
        'Grand Piano', 
        'Electric Piano',
        'Vibraphone',
        'Church Organ',
        'Acoustic Guitar',
        'Pizzicato Strings',
        'Orchestral Harp',
        'String Ensemble',
        'Trumpet',
        'Synth Lead'
    ];

    var timbre = [0, 0];

    function setStatus(text) {
        status.textContent = text;
    }

    function runModel(midiData) {
        
    }

    function update() {
        if (!model) {
            console.error('Model not yet loaded');
            return;
        }

        setStatus('Predicting Mel spectrogram ...');
        mel.getContext('2d').clearRect(0, 0, mel.width, mel.height);
        loader.style.display = 'block';
        
        setTimeout(() => {
            tf.tidy(() => {
                var input = tf.tensor3d(midiData, [1, 88*2, MAX_STEPS]);
                var transposed = input.transpose([0, 2, 1]);
                var output = global.model.predict([transposed, tf.tensor2d([[5]])]);
                var scaled = tf.mul(tf.add(output, 10), 256 / 11);
                var image = global.colormap.predict(scaled.reshape([MAX_STEPS, 80]).transpose());
                var buffer = image.dataSync();
                var clamped = Uint8ClampedArray.from(buffer);
                var imageData = new ImageData(clamped, mel.width, mel.height);
                mel.getContext('2d').putImageData(imageData, 0, 0);
                setStatus('Complete');
                initialLoader.style.display = 'none';
                loader.style.display = 'none';
                content.style.display = 'block';
            })
        }, 10);
    }

    function loadMidiNotes(midi) {
        midiData.fill(0);
        const tracks = midi.tracks;
        const ctx = melody.getContext('2d');
        ctx.clearRect(0, 0, melody.width, melody.height);
        
        for (var i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            const notes = track.notes;
            for (var j = 0; j < notes.length; j++) {
                const note = notes[j];
                if (note.time > MAX_LENGTH) break;

                if (21 <= note.midi && note.midi <= 108) {
                    const pitch = note.midi - 21;
                    const left = Math.round(note.time * STEP_RATE);
                    const right = Math.min(Math.round((note.time + note.duration) * STEP_RATE), MAX_STEPS);
                    midiData.fill(note.velocity, pitch * MAX_STEPS + left, pitch * MAX_STEPS + right);
                    midiData[(88 + pitch) * MAX_STEPS + left] = note.velocity;
                    
                    ctx.fillStyle = 'hsl(212, 62%, 70%)';
                    ctx.fillRect(left, pitch * 4, right - left, 4);
                    ctx.fillStyle = 'hsl(212, 62%, 40%)';
                    ctx.fillRect(left, pitch * 4, 4, 4);
                }
            }
        }

        update();
    }

    function loadMidi(file) {
        if (typeof file === 'string') {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", file, true);
            xhr.responseType = "blob"
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    loadMidi(xhr.response);
                }
            };
            xhr.send();
        } else {
            const reader = new FileReader();
            reader.onload = (e) => loadMidiNotes(MidiConvert.parse(e.target.result));
            reader.readAsBinaryString(file);
        }
    }

    title.addEventListener('dragenter', () => title.classList.add('hover'));
    title.addEventListener('dragleave', () => title.classList.remove('hover'));
    title.addEventListener('drop', () => title.classList.remove('hover'));

    input.addEventListener('change', function(e) {
        const files = e.target.files;
        if (files.length > 0) {
            const file = files[0];
            midiMessage.textContent = file.name;
            loadMidi(file);
        }
    })
    
    async function init() {
        try {
            setStatus('Loading TF model ...');
            global.model = await tf.loadModel('model/model.json');
            global.layers = {}
            for (i = 0; i < global.model.layers.length; i++) {
                if (global.model.layers[i].weights.length > 0) {
                    global.layers[global.model.layers[i].name] = global.model.layers[i];
                }
            }
            global.embeddings = layers.instrument_embedding.embeddings.val;
            tf.tidy(() => {
                // poor man's PCA using QR implementation
                X = tf.dot(global.embeddings.transpose(), global.embeddings);
                rot = tf.eye(2);
                for (var i = 0; i < 30; i++) {
                    QR = tf.qr(X);
                    rot = tf.dot(rot, QR[0]);
                    X = tf.dot(QR[1], QR[0]);
                }
                var coords = tf.dot(rot, global.embeddings.transpose()).transpose().dataSync()
                global.coords = []
                global.minX = global.maxX = coords[0];
                global.minY = global.maxY = coords[1];
                for (var i = 0; i < instruments.length; i++) {
                    var x = coords[i * 2];
                    var y = coords[i * 2 + 1];
                    global.coords.push([x, y]);
                    if (x < global.minX) global.minX = x;
                    if (x > global.maxX) global.maxX = x;
                    if (y < global.minY) global.minY = y;
                    if (y > global.maxY) global.maxY = y;
                }

            });
            setStatus('Loading colormap ...');
            global.colormap = await tf.loadModel('colormaps/viridis/model.json');
            loadMidi('midi/mendelssohn-wedding-march.mid');
        } catch (e) {
            setStatus('Error loading model');
            throw e;
        }
    }

    init();
})(window);
