const button = document.querySelector("button");

// Notes in Hz
const C2 = 65.41;
const Csh2 = 69.30;
const D2 = 73.42;
const Dsh2 = 77.78;
const E2 = 82.41;
const F2 = 87.31;
const Fsh2 = 92.50;
const G2 = 98.00;
const Gsh2 = 103.83;
const A2 = 110.00;
const Ash2 = 116.54;
const B2 = 123.47;

const C3 = 130.81;
const Csh3 = 138.59;
const D3 = 146.83;
const Dsh3 = 155.56;
const E3 = 164.81;
const F3 = 174.61;
const Fsh3 = 185.00;
const G3 = 196.00;
const Gsh3 = 207.65;
const A3 = 220.00;
const Ash3 = 233.08;
const B3 = 246.94;

const C4 = 261.63;
const Csh4 = 277.18;
const D4 = 293.66;
const Dsh4 = 311.13;
const E4 = 329.63;
const F4 = 349.23;
const Fsh4 = 369.99;
const G4 = 392.00;
const Gsh4 = 415.30;
const A4 = 440.00;
const Ash4 = 466.16;
const B4 = 493.88;

const C5 = 523.25;
const Csh5 = 554.37;
const D5 = 587.33;
const Dsh5 = 622.25;
const E5 = 659.25;
const F5 = 698.46;
const Fsh5 = 739.99;
const G5 = 783.99;
const Gsh5 = 830.61;
const A5 = 880.00;
const Ash5 = 932.33;
const B5 = 987.77;

const C6 = 1046.50;
const Csh6 = 1108.73;
const D6 = 1174.66;
const Dsh6 = 1244.51;
const E6 = 1318.51;
const F6 = 1396.91;
const Fsh6 = 1479.98;
const G6 = 1567.98;
const Gsh6 = 1661.22;
const A6 = 1760.00;
const Ash6 = 1864.66;
const B6 = 1975.53;

let context;
let distortion;
let reverb;
let gain;
let biquadFilter;

async function init() {
    context = new AudioContext();

    reverb = await createReverb();

    gain = context.createGain();
    gain.gain.value = VOLUME

    distortion = context.createWaveShaper();
    distortion.curve = makeDistortionCurve(40);

    biquadFilter = context.createBiquadFilter();
    biquadFilter.type = "lowpass";
    biquadFilter.frequency.setValueAtTime(20000, context.currentTime);

    distortion.connect(reverb)
    biquadFilter.connect(reverb)
    reverb.connect(gain)
    gain.connect(context.destination)
}
let timeline = 0.0

const VOLUME = 0.25
const DAMPING_START = 0
const DAMPING_DURATION = 0.0

async function createReverb() {
    let convolver = context.createConvolver();
  
    // load impulse response from file
    let response = await fetch("./WireGrind_s_0.8s_06w_100Hz_02m.wav");
    let arraybuffer = await response.arrayBuffer();
    convolver.buffer = await context.decodeAudioData(arraybuffer);
  
    return convolver;
}

function makeDistortionCurve(k = 20) {
    const n_samples = 256
    const curve = new Float32Array(n_samples);

    for (let i = 0; i < n_samples; ++i ) {
        const x = i * 2 / n_samples - 1;
        curve[i] = (3 + k)*Math.atan(Math.sinh(x*0.25)*5) / (Math.PI + k * Math.abs(x));
    }
    return curve;
}

function playSound(notes, seconds) {
    const startTime = context.currentTime + timeline
    const endTime = startTime + seconds

    for (let noteIndex = 0; noteIndex < notes.length; noteIndex++) {
        const oscillator = context.createOscillator();
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(notes[noteIndex], context.currentTime);
        oscillator.connect(distortion);
        
        oscillator.start(startTime)
        oscillator.stop(endTime + DAMPING_DURATION)
    }

    gain.gain.setTargetAtTime(0, endTime - DAMPING_START, DAMPING_DURATION);
    gain.gain.setTargetAtTime(VOLUME, endTime + DAMPING_DURATION, DAMPING_DURATION);

    timeline += seconds
}

button.onclick = async () => {
    if (!context) {
        await init();
    }

    const bpm = 110
    const bps = bpm / 60
    
    const fourth = 1 / bps
    const eighth = fourth / 2
    const half = fourth * 2
    const whole = half * 2

    for(let i = 0; i < 4; ++i) {
        playSound([E3, B3, E4], 1.5 * fourth)
        playSound([E3, B3, E4], eighth)
        playSound([G3, D4, G4], 1.5 * eighth)
        playSound([E3, B3, E4], 1.5 * eighth)
        playSound([D3, A3, D4], eighth)
        playSound([C3, G3, C4], half)
        playSound([B2, Fsh3, B3], half)
    }
    timeline = 0
};
