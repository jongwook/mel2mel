const MAX_LENGTH = 10;
const STEP_SIZE = 128;
const SAMPLE_RATE = 16000;
const STEP_RATE = SAMPLE_RATE / STEP_SIZE;
const MAX_STEPS = Math.floor(MAX_LENGTH * SAMPLE_RATE / STEP_SIZE);
const TIMBRE_MARGIN = 35;

mel2mel = (function(self) {
    const content = document.getElementById('content');
    const title = document.getElementById('title');
    const input = document.getElementById('input');
    const midiMessage = document.getElementById('midi-message');
    const melody = document.getElementById('melody');
    const timbre = document.getElementById('timbre');
    const mel = document.getElementById('mel');
    const status = document.getElementById('status');
    const initialLoader = document.getElementById('initial-loader');
    const loader = document.getElementById('loader');

    self.midiData = new Float32Array(88*2 * MAX_STEPS);
    self.instruments = [
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

    var timbreCoord = [0.5, 0.5];

    function setStatus(text) {
        status.textContent = text;
    }

    function runModel(salience) {
        const coord = tf.tensor1d([
            timbreCoord[0] * (self.maxX - self.minX) + self.minX,
            timbreCoord[1] * (self.maxY - self.minY) + self.minY
        ]);
        const embedding = tf.tensor2d(self.inverseTransform).dot(coord).reshape([1, 1, 2]);
        const gamma1 = self.layers['film1/gamma'].call(embedding);
        const beta1 = self.layers['film1/beta'].call(embedding);
        const gamma2 = self.layers['film2/gamma'].call(embedding);
        const beta2 = self.layers['film2/beta'].call(embedding);
        
        const h1 = self.layers.input_conv.call(salience);
        const h2 = h1.mul(gamma1).add(beta1);
        const h3 = self.layers.bidirectional.call(h2, {});
        const h4 = h3.mul(gamma2).add(beta2);
        const mel = self.layers.output_conv.call(h4);

        return mel;
    }

    function updateTimbre() {
        const ctx = timbre.getContext('2d');
        ctx.clearRect(0, 0, timbre.width, timbre.height);
        ctx.fillStyle = 'hsl(212, 62%, 20%)';
        for (var i = 0; i < self.instruments.length; i++) {
            var x = self.coords[i][0];
            var y = self.coords[i][1];
            x = (x - self.minX) / (self.maxX - self.minX) * (timbre.width - TIMBRE_MARGIN*2) + TIMBRE_MARGIN
            y = (y - self.minY) / (self.maxY - self.minY) * (timbre.height - TIMBRE_MARGIN*2) + TIMBRE_MARGIN
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }
        ctx.beginPath()
        ctx.fillStyle = 'red'
        var r = 4, inset = 2, n = 5;
        var x = timbreCoord[0] * (timbre.width - TIMBRE_MARGIN*2) + TIMBRE_MARGIN;
        var y = timbreCoord[1] * (timbre.height - TIMBRE_MARGIN*2) + TIMBRE_MARGIN
        ctx.save();
        ctx.translate(x, y);
        ctx.moveTo(0,0-r);
        for (var i = 0; i < n; i++) {
            ctx.rotate(Math.PI / n);
            ctx.lineTo(0, 0 - (r * inset));
            ctx.rotate(Math.PI / n);
            ctx.lineTo(0, 0 - r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function updateMel() {
        if (!self.model) {
            console.error('Model not yet loaded');
            return;
        }

        setStatus('Predicting Mel spectrogram ...');
        mel.getContext('2d').clearRect(0, 0, mel.width, mel.height);
        loader.style.display = 'block';
        
        setTimeout(() => {
            tf.tidy(() => {
                const input = tf.tensor3d(self.midiData, [1, 88*2, MAX_STEPS]);
                const transposed = input.transpose([0, 2, 1]);
                const output = runModel(transposed);
                const scaled = tf.mul(tf.add(output, 10), 256 / 11);
                const image = self.colormap.predict(scaled.reshape([MAX_STEPS, 80]).transpose());
                const buffer = image.dataSync();
                const clamped = Uint8ClampedArray.from(buffer);
                const imageData = new ImageData(clamped, mel.width, mel.height);
                mel.getContext('2d').putImageData(imageData, 0, 0);
                setStatus('Complete');
                initialLoader.style.display = 'none';
                loader.style.display = 'none';
                content.style.display = 'block';
            })
        }, 10);
    }

    function loadMidiNotes(midi) {
        self.midiData.fill(0);
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
                    self.midiData.fill(note.velocity, pitch * MAX_STEPS + left, pitch * MAX_STEPS + right);
                    self.midiData[(88 + pitch) * MAX_STEPS + left] = note.velocity;
                    
                    ctx.fillStyle = 'hsl(212, 62%, 70%)';
                    ctx.fillRect(left, pitch * 4, right - left, 4);
                    ctx.fillStyle = 'hsl(212, 62%, 40%)';
                    ctx.fillRect(left, pitch * 4, 4, 4);
                }
            }
        }

        updateMel();
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
    });

    timbre.addEventListener('click', function(e) {
        timbreCoord[0] = (e.layerX - TIMBRE_MARGIN) / (timbre.width - TIMBRE_MARGIN*2);
        timbreCoord[1] = (timbre.height - e.layerY - TIMBRE_MARGIN) / (timbre.height - TIMBRE_MARGIN * 2);
        updateTimbre();
        updateMel();
    });
    
    async function init() {
        try {
            setStatus('Loading TF model ...');
            self.model = await tf.loadModel('model/model.json');
            self.layers = {}
            for (i = 0; i < self.model.layers.length; i++) {
                if (self.model.layers[i].weights.length > 0) {
                    self.layers[self.model.layers[i].name] = self.model.layers[i];
                }
            }
            self.embeddings = self.layers.instrument_embedding.embeddings.val;
            tf.tidy(() => {
                // poor man's PCA using QR implementation
                var X = tf.dot(self.embeddings.transpose(), self.embeddings);
                var rot = tf.eye(2);
                for (var i = 0; i < 30; i++) {
                    QR = tf.qr(X);
                    rot = tf.dot(rot, QR[0]);
                    X = tf.dot(QR[1], QR[0]);
                }

                var coords = tf.dot(rot, self.embeddings.transpose()).transpose().dataSync()
                self.coords = []
                self.minX = self.maxX = coords[0];
                self.minY = self.maxY = coords[1];
                for (var i = 0; i < self.instruments.length; i++) {
                    var x = coords[i * 2];
                    var y = coords[i * 2 + 1];
                    self.coords.push([x, y]);
                    if (x < self.minX) self.minX = x;
                    if (x > self.maxX) self.maxX = x;
                    if (y < self.minY) self.minY = y;
                    if (y > self.maxY) self.maxY = y;
                }

                rot = rot.dataSync();
                self.forwardTransform = [[rot[0], rot[1]], [rot[2], rot[3]]];
                const D = rot[0] * rot[3] - rot[1] * rot[2];
                self.inverseTransform = [[rot[3]/D, -rot[1]/D], [-rot[2]/D, rot[0]/D]];
            });
            updateTimbre();
            setStatus('Loading colormap ...');
            self.colormap = await tf.loadModel('colormaps/viridis/model.json');
            loadMidi('midi/mendelssohn-wedding-march.mid');
        } catch (e) {
            setStatus('Error loading model');
            throw e;
        }
    }

    init();

    self.updateMel = updateMel;
    self.updateTimbre = updateTimbre;

    return self;
})({});
