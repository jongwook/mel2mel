importScripts('tensorflow.js');
importScripts('globals.js');

var model = null;
var colormap = null;

async function init() {
    postMessage('Loading Model ...');
    model = await tf.loadModel('model/model.json');
    postMessage('Loading colormap ...');
    colormap = await tf.loadModel('colormaps/viridis/model.json');
    postMessage('Loading complete');
}

onmessage = (e) => {
    const message = e.data;
    if (message === 'init') {                
        init();
    } else {
        if (!model || !colormap) {
            postMessage('Model not yet loaded!');
            return;
        }
        var midiData = message.midiData;
        var instrument = message.instrument;
        if (midiData === undefined || instrument === undefined) {
            postMessage('Invalid message:' + message);
            return;
        }
        tf.tidy(() => {
            var input = tf.tensor3d(midiData, [1, 88*2, MAX_STEPS]);
            
            var transposed = input.transpose([0, 2, 1]);
            postMessage('input is ready');
            var output = model.predict([transposed, tf.tensor2d([[instrument]])]);
            postMessage('prediction done');
            var scaled = tf.mul(tf.add(output, 10), 256 / 12);
            var image = colormap.predict(scaled.reshape([MAX_STEPS, 80]).transpose());
            postMessage('colormap done');
            var buffer = image.dataSync();
            var clamped = Uint8ClampedArray.from(buffer);
            var imageData = new ImageData(clamped, mel.width, mel.height);
            postMessage('image ready');
            postMessage(imageData);
        })
    }
}
