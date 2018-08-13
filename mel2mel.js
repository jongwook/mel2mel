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
    const audio = document.getElementById('audio');

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
    self.icons = [
        'data:image/svg+xml;utf8,<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="transform: rotate(180deg) scaleX(-1);enable-background:new 0 0 512 512;" xml:space="preserve"><polygon style="fill:%23EFE2DD;" points="256,512 512,512 512,384.429 235.984,364.413 "/><polygon style="fill:%23FFF5F5;" points="0,384.429 0,512 256,512 256,364.413 "/><path style="fill:%23323C3C;" d="M512,309.584c0-47.207-38.269-85.476-85.476-85.476h-31.893c-29.593,0-53.584-23.99-53.584-53.584l0,0c0-63.028-34.198-118.063-85.047-147.578l-15,334.722v106.494h30V384.43h37.75v79.732h30V384.43h37.75v79.732h30V384.43h37.75v79.732h30V384.43H512V309.584z"/><path style="fill:%23495959;" d="M256,22.945C230.869,8.358,201.674,0,170.524,0l0,0C76.346,0,0,76.346,0,170.523v213.906h37.75v79.732h30v-79.732h37.75v79.732h30v-79.732h37.75v79.732h30v-79.732H256V22.945z"/></svg>', 
        'data:image/svg+xml;utf8,<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="transform: rotate(180deg) scaleX(-1);enable-background:new 0 0 512 512;" xml:space="preserve"><polygon style="fill:%23EFE2DD;" points="256,394.631 512,394.631 512,202.416 235.984,182.4 "/><polygon style="fill:%23FFF5F5;" points="0,202.416 0,394.631 256,394.631 256,182.4 "/><g><rect x="37.75" y="159.89" style="fill:%23495959;" width="30" height="162.35"/><rect x="105.5" y="159.89" style="fill:%23495959;" width="30" height="162.35"/><rect x="173.25" y="159.89" style="fill:%23495959;" width="30" height="162.35"/></g><g><rect x="241" y="159.89" style="fill:%23323C3C;" width="30" height="162.35"/><rect x="308.75" y="159.89" style="fill:%23323C3C;" width="30" height="162.35"/><rect x="376.5" y="159.89" style="fill:%23323C3C;" width="30" height="162.35"/><rect x="444.25" y="159.89" style="fill:%23323C3C;" width="30" height="162.35"/></g><polygon style="fill:%23046EFF;" points="256,117.369 235.984,159.893 256,202.416 512,202.416 512,117.369 "/><rect y="117.37" style="fill:%236AA9FF;" width="256" height="85.05"/></svg>',
        'data:image/svg+xml;utf8,<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="transform: rotate(180deg) scaleX(-1);enable-background:new 0 0 512 512;" xml:space="preserve"><g><polygon style="fill:%237c7a77;" points="284.072,40.08 201.752,40.08 221.768,471.92 284.072,471.92 	"/><rect x="460.43" y="128" style="fill:%23c78f2c;" width="30" height="347.43"/></g><rect x="159.46" y="40.08" style="fill:%23aeadab;" width="62.3" height="431.84"/><path style="fill:%23C50048;" d="M475.429,438.857l-20.016,36.571L475.429,512C495.626,512,512,495.626,512,475.429C512,455.231,495.626,438.857,475.429,438.857z"/><path style="fill:%23E50058;" d="M438.857,475.429c0,20.198,16.374,36.571,36.571,36.571v-73.143C455.231,438.857,438.857,455.231,438.857,475.429z"/><g><polygon style="fill:%23aeadab;" points="347.858,512 347.858,431.839 221.768,431.839 201.752,471.92 221.768,512 	"/><polygon style="fill:%23aeadab;" points="379.75,368.054 379.75,287.893 221.768,287.893 201.752,327.973 221.768,368.054 	"/><polygon style="fill:%23aeadab;" points="411.643,224.107 411.643,143.946 221.768,143.946 201.752,184.027 221.768,224.107 	"/><polygon style="fill:%23aeadab;" points="443.536,0 221.768,0 201.752,40.08 221.768,80.161 443.536,80.161 	"/></g><g><rect style="fill:%23cfcfce;" width="221.77" height="80.16"/><rect x="31.893" y="143.95" style="fill:%23cfcfce;" width="189.87" height="80.16"/><rect x="63.785" y="287.89" style="fill:%23cfcfce;" width="157.98" height="80.16"/><rect x="95.68" y="431.84" style="fill:%23cfcfce;" width="126.09" height="80.16"/></g></svg>',
        'data:image/svg+xml;utf8,<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="transform: rotate(180deg) scaleX(-1);enable-background:new 0 0 512 512;" xml:space="preserve"><polygon style="fill:%23BC5F19;" points="479.348,96.221 256,96.221 235.984,459.332 415.779,479.348 479.348,479.348 "/><polygon style="fill:%23E27726;" points="32.652,96.221 32.652,479.348 96.221,479.348 256,459.332 256,96.221 "/><polygon style="fill:%238F4813;" points="256,479.348 415.779,479.348 415.779,382.283 235.984,362.267 "/><polygon style="fill:%23BC5F19;" points="96.221,382.283 96.221,479.348 256,479.348 256,362.267 "/><polygon style="fill:%2371390F;" points="256,382.283 415.779,382.283 415.779,318.714 235.984,298.698 "/><polygon style="fill:%238F4813;" points="256,298.698 96.221,318.714 96.221,382.283 256,382.283 "/><polygon style="fill:%23EFE2DD;" points="256,223.36 235.984,271.037 256,318.714 415.779,318.714 415.779,223.36 375.867,223.36 360.867,233.368 345.867,223.36 305.956,223.36 290.956,233.368 275.956,223.36 "/><polygon style="fill:%23FFF5F5;" points="256,223.36 236.044,223.36 221.044,233.368 206.044,223.36 166.133,223.36 151.133,233.368 136.133,223.36 96.221,223.36 96.221,318.714 256,318.714 "/><rect y="81.22" style="fill:%23BC5F19;" width="256" height="30"/><rect x="256" y="81.22" style="fill:%2371390F;" width="256" height="30"/><polygon style="fill:%23EFE2DD;" points="368.102,32.652 256,32.652 235.984,159.791 368.102,159.791 "/><rect x="143.9" y="32.652" style="fill:%23FFF5F5;" width="112.1" height="127.14"/><g><rect x="136.13" y="223.36" style="fill:%23495959;" width="30" height="47.677"/><rect x="206.04" y="223.36" style="fill:%23495959;" width="30" height="47.677"/></g><g><rect x="275.96" y="223.36" style="fill:%23323C3C;" width="30" height="47.677"/><rect x="345.87" y="223.36" style="fill:%23323C3C;" width="30" height="47.677"/></g><polygon style="fill:%2371390F;" points="431.671,174.791 431.671,144.791 256,144.791 245.992,159.791 256,174.791 "/><rect x="80.33" y="144.79" style="fill:%23BC5F19;" width="175.67" height="30"/></svg>',
        'data:image/svg+xml;utf8,<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="transform: rotate(180deg) scaleX(-1);enable-background:new 0 0 512 512;" xml:space="preserve"><rect x="399.853" y="-0.417" transform="matrix(-0.7071 0.7071 -0.7071 -0.7071 736.4937 -225.0314)" style="fill:%23E1BB78;" width="30" height="80.869"/><g><rect x="431.643" y="82.132" transform="matrix(0.7071 0.7071 -0.7071 0.7071 206.9244 -305.2962)" style="fill:%23C78F2C;" width="80.689" height="30"/><rect x="411.282" y="102.486" transform="matrix(0.7071 -0.7071 0.7071 0.7071 23.8583 343.2611)" style="fill:%23C78F2C;" width="30" height="80.689"/></g><g><rect x="328.735" y="70.718" transform="matrix(0.7071 0.7071 -0.7071 0.7071 168.7388 -235.9359)" style="fill:%23E1BB78;" width="80.869" height="30"/><polygon style="fill:%23E1BB78;" points="243.614,243.55 278.851,278.777 511.933,45.696 489.15,22.913 	"/></g><polygon style="fill:%23EDD7B0;" points="466.237,0 233.145,233.092 256.063,256 489.15,22.913 "/><path style="fill:%23BC5F19;" d="M54.21,478.332c43.289,44.512,114.473,44.888,158.234,1.127c19.055-19.055,29.737-43.309,32.053-68.196c1.062-11.415,8.112-21.29,18.484-26.173c9.22-4.34,17.821-10.426,25.303-18.27c30.542-32.02,31.299-82.791,1.652-115.641l-14.526-14.526l-130.27,89.781L43.971,468.093L54.21,478.332z"/><path style="fill:%23E27726;" d="M143.644,225.083c-7.206,7.206-12.842,15.385-16.917,24.113c-4.856,10.403-15.07,17.173-26.497,18.282c-25.328,2.458-49.972,13.586-69.115,33.392c-41.495,42.933-41.382,111.809,0.246,154.613l12.609,12.609l231.44-231.438l-8.322-8.322C234.19,191.88,177.93,190.797,143.644,225.083z"/><path style="fill:%23323C3C;" d="M229.73,327.898c12.596-12.597,12.616-33.005,0.064-45.628l-34.064,14.064l-11.628,31.628C196.726,340.514,217.134,340.494,229.73,327.898z"/><path style="fill:%23495959;" d="M184.035,282.202c-12.618,12.618-12.618,33.077,0,45.695c0.022,0.022,0.045,0.042,0.067,0.064l45.692-45.692c-0.022-0.022-0.042-0.045-0.064-0.067C217.112,269.584,196.653,269.584,184.035,282.202z"/><polygon style="fill:%23323C3C;" points="162.004,418.471 183.217,397.258 149.011,363.052 130.314,365.683 127.798,384.265 "/><rect x="96.956" y="341.487" transform="matrix(0.7071 0.7071 -0.7071 0.7071 287.5835 18.6862)" style="fill:%23495959;" width="48.56" height="30"/></svg>',
        'data:image/svg+xml;utf8,<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="transform: rotate(180deg) scaleX(-1);enable-background:new 0 0 512 512;" xml:space="preserve"><rect x="163.04" y="88.975" style="fill:%23EDD7B0;" width="30" height="340.44"/><g><rect x="241" y="88.975" style="fill:%23E1BB78;" width="30" height="363.02"/><rect x="318.95" y="88.975" style="fill:%23E1BB78;" width="30" height="340.44"/></g><polygon style="fill:%23C78F2C;" points="401,73.975 256,73.975 245.992,88.975 256,103.975 401,103.975 "/><rect x="110.73" y="73.975" style="fill:%23E1BB78;" width="145.27" height="30"/><path style="fill:%23BC5F19;" d="M512,25.237H356.52l50.75,204.361c11.636,46.859,1.251,95.547-28.492,133.58c-29.744,38.033-74.494,59.846-122.777,59.846l-20.016,28.978L256,486.763c68.027,0,131.077-30.734,172.985-84.32c41.906-53.587,56.538-122.186,40.142-188.206L438.021,88.975H512V25.237z"/><path style="fill:%23E27726;" d="M133.223,363.179c-29.743-38.033-40.129-86.721-28.492-133.58L155.48,25.237H0v63.738h73.979L42.873,214.237c-16.396,66.021-1.765,134.62,40.142,188.206c41.908,53.586,104.958,84.32,172.985,84.32v-63.738C207.718,423.025,162.967,401.212,133.223,363.179z"/></svg>',
        'data:image/svg+xml;utf8,<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="transform: rotate(180deg) scaleX(-1);enable-background:new 0 0 512 512;" xml:space="preserve"><g><rect x="-15.256" y="242.854" transform="matrix(-0.2465 -0.9691 0.9691 -0.2465 11.9273 524.9828)" style="fill:%23FFEB99;" width="450.615" height="30.002"/><rect x="92.161" y="267.336" transform="matrix(-0.2465 -0.9691 0.9691 -0.2465 77.9791 625.3019)" style="fill:%23FFEB99;" width="379.831" height="30.002"/></g><g><rect x="213.127" y="229.313" transform="matrix(-0.2465 -0.9691 0.9691 -0.2465 184.7845 632.2977)" style="fill:%23FFD422;" width="250.144" height="30.002"/><rect x="306.867" y="176.164" transform="matrix(-0.2465 -0.9691 0.9691 -0.2465 301.4447 616.7034)" style="fill:%23FFD422;" width="167.199" height="30.002"/></g><path style="fill:%23EEBF00;" d="M419.828,50.845L419.828,50.845c-15.257,0-30.189,4.409-42.999,12.696L354.726,77.84c-28.406,18.376-65.35,16.67-91.941-4.247L256,68.257l-20.016,26.31L256,142.914c17.551,7.423,36.547,11.357,55.736,11.357c27.595,0,54.433-7.924,77.609-22.917l22.103-14.3c2.503-1.618,5.4-2.474,8.381-2.474c6.654,0,10.554,3.591,12.655,6.604s4.122,7.915,1.822,14.158l-115.31,312.924H256l-20.016,33.405L256,512h178.486v-63.734h-47.567l107.189-290.887C513.152,105.697,474.907,50.845,419.828,50.845z"/><path style="fill:%23FFD422;" d="M192.702,448.266L94.912,63.734h46.911c3.444,0,6.83,1.172,9.535,3.301l72.022,56.653c9.993,7.86,20.99,14.308,32.62,19.226V68.257l-65.235-51.315C176.812,5.967,159.575,0,141.822,0H12.94l130.207,512H256v-63.734H192.702z"/></svg>',
        'data:image/svg+xml;utf8,<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="transform: rotate(180deg) scaleX(-1);enable-background:new 0 0 512 512;" xml:space="preserve"><path style="fill:%23BC5F19;" d="M327.043,184.959l-120.681,84.684L71.779,440.223l33.835,33.835c32.729,32.729,86.662,29.66,115.467-6.569l60.617-76.241l-11.629-48.268c25.991,2.697,51.498-4.886,69.856-23.244c28.581-28.581,31.059-74.495,9.256-112.579L327.043,184.959z"/><path style="fill:%23E27726;" d="M305.117,162.976c-38.137-21.97-84.2-19.549-112.85,9.1c-18.358,18.358-25.941,43.866-23.244,69.856l-48.268-11.629l-76.241,60.617c-36.231,28.805-39.298,82.738-6.569,115.467l33.835,33.835l255.264-255.264L305.117,162.976z"/><rect x="125.624" y="286.861" transform="matrix(0.2588 0.9659 -0.9659 0.2588 405.9577 95.6968)" style="fill:%23495959;" width="29.996" height="51.024"/><rect x="174.106" y="356.37" transform="matrix(-0.2588 0.9659 -0.9659 -0.2588 609.9952 274.6641)" style="fill:%23323C3C;" width="51.024" height="29.996"/><polygon style="fill:%2371390F;" points="274.829,237.173 296.996,259.339 445.501,110.834 423.334,70.994 "/><polygon style="fill:%238F4813;" points="401.168,66.501 252.662,215.006 274.829,237.173 432.258,79.744 "/><polygon style="fill:%23BC5F19;" points="423.334,88.667 445.501,110.834 512,44.334 489.834,22.168 445.501,44.334 "/><rect x="429.831" y="-2.689" transform="matrix(-0.7071 -0.7071 0.7071 -0.7071 729.1771 390.6978)" style="fill:%23E27726;" width="31.348" height="94.04"/><polygon style="fill:%2371390F;" points="21.212,512.001 116.112,417.101 138.756,439.745 159.967,418.534 126.717,385.284 109.038,388.298 10.606,501.395 "/><polygon style="fill:%238F4813;" points="72.256,373.245 94.901,395.89 0.001,490.79 10.606,501.395 126.717,385.284 93.467,352.034 "/></svg>',
        'data:image/svg+xml;utf8,<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="transform: rotate(180deg) scaleX(-1);enable-background:new 0 0 512 512;" xml:space="preserve"><path style="fill:%23FFD422;" d="M188.902,43.769L208.918,512h31.893V197.379c0-49.687,19.02-97.489,53.154-133.594L188.902,43.769z"/><path style="fill:%23FFEB99;" d="M123.871,63.785L123.871,63.785c34.135,36.105,53.155,83.907,53.155,133.594V512h31.893V43.769L123.871,63.785z"/><polygon style="fill:%23EEBF00;" points="322.06,0 208.918,0 188.902,31.893 208.918,63.785 322.06,63.785 "/><rect x="95.779" style="fill:%23FFD422;" width="113.14" height="63.785"/><path style="fill:%23EEBF00;" d="M416.221,255.676v-30h-32.839v-14.973c0-43.442-35.343-78.785-78.785-78.785s-78.786,35.343-78.786,78.785v14.973h-16.892l-10.008,15l10.008,15h16.892v33.786h-16.892l-10.008,15l10.008,15h16.892v33.786h-16.892l-10.008,15l10.008,15h16.892v14.974c0,43.442,35.344,78.786,78.786,78.786s78.785-35.343,78.785-78.786v-14.974h32.839v-30h-32.839v-33.786h32.839v-30h-32.839v-33.786L416.221,255.676L416.221,255.676z M255.811,210.703c0-26.9,21.886-48.785,48.786-48.785c26.9,0,48.785,21.885,48.785,48.785v14.973h-97.571V210.703z M353.382,398.221c0,26.9-21.885,48.786-48.785,48.786c-26.9,0-48.786-21.885-48.786-48.786v-14.974h97.571V398.221z M353.382,353.248h-97.571v-33.786h97.571V353.248z M353.382,289.462h-97.571v-33.786h97.571V289.462z"/><polygon style="fill:%23FFD422;" points="208.918,255.676 208.918,225.676 128.24,225.676 128.24,192.837 98.24,192.837 98.24,416.086 128.24,416.086 128.24,383.248 208.918,383.248 208.918,353.248 128.24,353.248 128.24,319.462 208.918,319.462 208.918,289.462 128.24,289.462 128.24,255.676 "/></svg>',
        'data:image/svg+xml;utf8,<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="transform: rotate(180deg) scaleX(-1);enable-background:new 0 0 512 512;" xml:space="preserve"><polygon style="fill:%23323C3C;" points="363.559,481.086 385.521,460.651 276.489,343.467 428.046,180.579 406.083,160.144 256,321.447 245.992,343.499 256,365.487 "/><polygon style="fill:%23495959;" points="83.954,180.579 235.511,343.467 126.479,460.651 148.441,481.086 256,365.487 256,321.447 105.917,160.144 "/><polygon style="fill:%23046EFF;" points="512,126.592 235.984,106.576 256,190.378 512,190.378 "/><polygon style="fill:%236AA9FF;" points="0,126.592 0,190.378 256,190.378 256,106.576 "/><polygon style="fill:%23EFE2DD;" points="512,30.914 474.25,30.914 459.25,30.914 444.25,30.914 406.5,30.914 391.5,40.922 376.5,30.914 338.75,30.914 323.75,40.922 308.75,30.914 271,30.914 245.992,40.922 256,126.592 512,126.592 "/><polygon style="fill:%23FFF5F5;" points="0,30.914 0,126.592 256,126.592 256,40.922 241,30.914 203.25,30.914 188.25,40.922 173.25,30.914 135.5,30.914 120.5,40.922 105.5,30.914 67.75,30.914 52.75,40.922 37.75,30.914 "/><g><rect x="37.75" y="30.914" style="fill:%23495959;" width="30" height="47.84"/><rect x="105.5" y="30.914" style="fill:%23495959;" width="30" height="47.84"/><rect x="173.25" y="30.914" style="fill:%23495959;" width="30" height="47.84"/></g><g><rect x="241" y="30.914" style="fill:%23323C3C;" width="30" height="47.84"/><rect x="308.75" y="30.914" style="fill:%23323C3C;" width="30" height="47.84"/><rect x="376.5" y="30.914" style="fill:%23323C3C;" width="30" height="47.84"/><rect x="444.25" y="30.914" style="fill:%23323C3C;" width="30" height="47.84"/></g></svg>'
    ].map(uri => {
        const image = new Image();
        image.src = uri;
        return image;
    });
    self.notes = [];

    var timbreCoord = [0.5, 0.5];

    function setStatus(text) {
        status.textContent = text;
    }

    function setProgress(progress) {
        audio.style.borderLeftWidth = 1250 * progress;
    }

    AudioStreamPlayer.setCallbacks(setStatus, setProgress);

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
            ctx.drawImage(self.icons[i], 0, 0, 512, 512, x-20, y-20, 40, 40);
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
        audio.classList.remove('ready');
        audio.style.borderRightWidth = 1250;
        
        setTimeout(() => {
            tf.tidy(() => {
                const input = tf.tensor3d(self.midiData, [1, 88*2, MAX_STEPS]);
                const transposed = input.transpose([0, 2, 1]);
                const output = runModel(transposed);
                self.output = output.dataSync();
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
                audio.classList.add('ready');
            })
        }, 10);
    }

    function loadMidiNotes(midi) {
        self.midiData.fill(0);
        const tracks = midi.tracks;
        const ctx = melody.getContext('2d');
        ctx.clearRect(0, 0, melody.width, melody.height);

        self.notes = [];
        
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

                    self.notes.push([note.time, Math.min(note.duration, MAX_LENGTH - note.time), note.midi, note.velocity]);
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

    function playResponseAsStream(response, readBufferSize) {
        if (!response.ok) throw Error(response.status+' '+response.statusText)
        if (!response.body) throw Error('ReadableStream not yet supported in this browser - <a href="https://developer.mozilla.org/en-US/docs/Web/API/Body/body#Browser_Compatibility">browser compatibility</a>')

        const reader = response.body.getReader(),
              contentLength = response.headers.get('content-length'), // requires CORS access-control-expose-headers: content-length
              bytesTotal = contentLength? parseInt(contentLength, 10) : 320000 + 44,
              readBuffer = new ArrayBuffer(readBufferSize),
              readBufferView = new Uint8Array(readBuffer);

        let bytesRead = 0, byte, readBufferPos = 0;

        // TODO errors in underlying Worker must be dealt with here.
        function flushReadBuffer() {
            AudioStreamPlayer.enqueueForDecoding(readBuffer.slice(0, readBufferPos));
            readBufferPos = 0;
        }

        var started = false;

        // Fill readBuffer and flush when readBufferSize is reached
        function read() {
            return reader.read().then(({value, done}) => {
                if (!started) {
                    started = true;
                    setStatus('Buffering audio ...');
                }
                if (done) {
                    flushReadBuffer();
                    return;
                } else {
                    bytesRead += value.byteLength;
                    audio.style.borderRightWidth = 1250 * (1 - bytesRead/bytesTotal);

                    for (byte of value) {
                        readBufferView[readBufferPos++] = byte;
                        if (readBufferPos === readBufferSize) {
                            flushReadBuffer();
                        }
                    }

                    return read();
                }
            })
        }

        return read()
    }

    audio.addEventListener('click', function(e) {
        if (audio.classList.contains('ready')) {
            audio.classList.remove('ready');
            setStatus('Waiting for WaveNet response ...');
            fetch('http://demo.jongwook.kim/cgi-bin/post', {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                body: self.output
            }).then(response => {
                playResponseAsStream(response, 16000 * 2);
            }).then(_ => {
                console.log('all stream bytes queued for decoding');
            }).catch(e => {
                console.error(e);
            })
        }
    })
    
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
                    QR = tf.linalg.qr(X);
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
