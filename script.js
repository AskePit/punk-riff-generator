const button = document.querySelector("button");
const input = document.querySelector("input");
const rythmDivs = document.getElementsByClassName('rythm-tile')
const riffText = document.querySelector("p");

let rythmId = 0

// Notes in Hz
const NOTES_HZ = [
    65.41,
    69.30,
    73.42,
    77.78,
    82.41,
    87.31,
    92.50,
    98.00,
    103.83,
    110.00,
    116.54,
    123.47,
    
    130.81,
    138.59,
    146.83,
    155.56,
    164.81,
    174.61,
    185.00,
    196.00,
    207.65,
    220.00,
    233.08,
    246.94,
    
    261.63,
    277.18,
    293.66,
    311.13,
    329.63,
    349.23,
    369.99,
    392.00,
    415.30,
    440.00,
    466.16,
    493.88,
    
    523.25,
    554.37,
    587.33,
    622.25,
    659.25,
    698.46,
    739.99,
    783.99,
    830.61,
    880.00,
    932.33,
    987.77,
    
    1046.50,
    1108.73,
    1174.66,
    1244.51,
    1318.51,
    1396.91,
    1479.98,
    1567.98,
    1661.22,
    1760.00,
    1864.66,
    1975.53,
]

const C2   = NOTES_HZ[0]
const Csh2 = NOTES_HZ[1]
const D2   = NOTES_HZ[2]
const Dsh2 = NOTES_HZ[3]
const E2   = NOTES_HZ[4] // E string
const F2   = NOTES_HZ[5]
const Fsh2 = NOTES_HZ[6]
const G2   = NOTES_HZ[7]
const Gsh2 = NOTES_HZ[8]
const A2   = NOTES_HZ[9] // A string
const Ash2 = NOTES_HZ[10]
const B2   = NOTES_HZ[11]

const C3   = NOTES_HZ[12]
const Csh3 = NOTES_HZ[13]
const D3   = NOTES_HZ[14] // D string
const Dsh3 = NOTES_HZ[15]
const E3   = NOTES_HZ[16]
const F3   = NOTES_HZ[17]
const Fsh3 = NOTES_HZ[18]
const G3   = NOTES_HZ[19] // G string
const Gsh3 = NOTES_HZ[20]
const A3   = NOTES_HZ[21]
const Ash3 = NOTES_HZ[22]
const B3   = NOTES_HZ[23] // B string

const C4   = NOTES_HZ[24]
const Csh4 = NOTES_HZ[25]
const D4   = NOTES_HZ[26]
const Dsh4 = NOTES_HZ[27]
const E4   = NOTES_HZ[28] // e string
const F4   = NOTES_HZ[29]
const Fsh4 = NOTES_HZ[30]
const G4   = NOTES_HZ[31]
const Gsh4 = NOTES_HZ[32]
const A4   = NOTES_HZ[33]
const Ash4 = NOTES_HZ[34]
const B4   = NOTES_HZ[35]

const C5   = NOTES_HZ[36]
const Csh5 = NOTES_HZ[37]
const D5   = NOTES_HZ[38]
const Dsh5 = NOTES_HZ[39]
const E5   = NOTES_HZ[40]
const F5   = NOTES_HZ[41]
const Fsh5 = NOTES_HZ[42]
const G5   = NOTES_HZ[43]
const Gsh5 = NOTES_HZ[44]
const A5   = NOTES_HZ[45]
const Ash5 = NOTES_HZ[46]
const B5   = NOTES_HZ[47]

const C6   = NOTES_HZ[48]
const Csh6 = NOTES_HZ[49]
const D6   = NOTES_HZ[50]
const Dsh6 = NOTES_HZ[51]
const E6   = NOTES_HZ[52]
const F6   = NOTES_HZ[53]
const Fsh6 = NOTES_HZ[54]
const G6   = NOTES_HZ[55]
const Gsh6 = NOTES_HZ[56]
const A6   = NOTES_HZ[57]
const Ash6 = NOTES_HZ[58]
const B6   = NOTES_HZ[59]

// Notes duration in terms of beats per second for 4/4
const FOURTH = 1
const EIGHTH = FOURTH / 2
const SIXTEENTH = EIGHTH / 2
const HALF = FOURTH * 2
const WHOLE = HALF * 2

const FOURTH_DOT = FOURTH * 1.5
const EIGHTH_DOT = EIGHTH * 1.5
const SIXTEENTH_DOT = SIXTEENTH * 1.5
const HALF_DOT = HALF * 1.5

const FOURTH_PAUSE = -FOURTH
const EIGHTH_PAUSE = -EIGHTH
const SIXTEENTH_PAUSE = -SIXTEENTH
const HALF_PAUSE = -HALF
const WHOLE_PAUSE = -WHOLE

const FOURTH_DOT_PAUSE = -FOURTH_DOT
const EIGHTH_DOT_PAUSE = -EIGHTH_DOT
const SIXTEENTH_DOT_PAUSE = -SIXTEENTH_DOT
const HALF_DOT_PAUSE = -HALF_DOT

let context;
let distortion;
let compressor;
let gain;

let soundNodes = []

async function init() {
    context = new AudioContext()

    let reverb = await createReverb()

    gain = context.createGain()
    gain.gain.value = VOLUME

    distortion = context.createWaveShaper()
    distortion.curve = makeDistortionCurve(200)

    compressor = context.createDynamicsCompressor()
    compressor.threshold.setValueAtTime(0, context.currentTime)
    compressor.knee.setValueAtTime(40, context.currentTime)
    compressor.ratio.setValueAtTime(12, context.currentTime)
    compressor.attack.setValueAtTime(0, context.currentTime)
    compressor.release.setValueAtTime(0.25, context.currentTime)

    // cut around 1000 Hz
    let cutNosal = context.createBiquadFilter()
    cutNosal.type = "notch"
    cutNosal.frequency.setValueAtTime(1000, context.currentTime)
    cutNosal.Q.setValueAtTime(4, context.currentTime)

    // cut above 8500 Hz
    let cutHighs = context.createBiquadFilter()
    cutHighs.type = "lowpass"
    cutHighs.frequency.setValueAtTime(22000, context.currentTime)
    cutHighs.Q.setValueAtTime(1, context.currentTime)

    // cut below 120 Hz
    let cutLows = context.createBiquadFilter()
    cutLows.type = "highpass"
    cutLows.frequency.setValueAtTime(250, context.currentTime)
    cutLows.Q.setValueAtTime(0, context.currentTime)

    // boost around 3000 Hz
    let peakMids = context.createBiquadFilter()
    peakMids.type = "peaking"
    peakMids.frequency.setValueAtTime(3150, context.currentTime)
    peakMids.Q.setValueAtTime(1.5, context.currentTime)
    peakMids.gain.setValueAtTime(10, context.currentTime)

    compressor.connect(distortion)
    distortion.connect(reverb)
    cutNosal.connect(cutHighs)
    cutHighs.connect(cutLows)
    cutLows.connect(peakMids)
    peakMids.connect(reverb)
    reverb.connect(gain)
    gain.connect(context.destination)
}
let timeline = 0.0

let BPM = 140
const VOLUME = 0.25
const DAMPING_START = 0
const DAMPING_DURATION = 0.0

async function createReverb() {
    let convolver = context.createConvolver();
  
    // load impulse response from file
    let response = await fetch("./WireGrind_s_0.8s_06w_100Hz_02m.wav")
    let arraybuffer = await response.arrayBuffer()
    convolver.buffer = await context.decodeAudioData(arraybuffer)
  
    return convolver
}

function makeDistortionCurve(k = 20) {
    const n_samples = 256
    const curve = new Float32Array(n_samples)

    for (let i = 0; i < n_samples; ++i ) {
        const x = i * 2 / n_samples - 1;
        curve[i] = (3 + k)*Math.atan(Math.sinh(x*0.25)*5) / (Math.PI + k * Math.abs(x))
    }
    return curve;
}

function playSound(notes, duration) {
    const seconds = duration / (BPM / 60)
    const startTime = context.currentTime + timeline
    const endTime = startTime + seconds

    for (let noteIndex = 0; noteIndex < notes.length; noteIndex++) {
        const oscillator = context.createOscillator()
        oscillator.type = "triangle"
        oscillator.frequency.setValueAtTime(notes[noteIndex], context.currentTime)
        oscillator.connect(compressor)
        
        oscillator.start(startTime)
        oscillator.stop(endTime + DAMPING_DURATION)

        soundNodes.push(oscillator)
    }

    gain.gain.setTargetAtTime(0, endTime - DAMPING_START, DAMPING_DURATION)
    gain.gain.setTargetAtTime(VOLUME, endTime + DAMPING_DURATION, DAMPING_DURATION)

    timeline += seconds
}

function playPause(duration) {
    const seconds = Math.abs(duration) / (BPM / 60)
    timeline += seconds
}

SHORT = 0
FULL = 1

function createPowerChord(tonica, type = FULL) {
    const tonicaIndex = NOTES_HZ.indexOf(tonica)
    return type == SHORT
        ? [NOTES_HZ[tonicaIndex], NOTES_HZ[tonicaIndex + 7]]
        : [NOTES_HZ[tonicaIndex], NOTES_HZ[tonicaIndex + 7], NOTES_HZ[tonicaIndex + 12]]
}

function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

function generateNote(prevNote = undefined) {
    const noteIndex = getRandomInt(4, 16)
    console.log(noteIndex)
    const note = NOTES_HZ[ noteIndex ]
    return note
}

RYTHMS = [
    [EIGHTH, EIGHTH, EIGHTH, EIGHTH],
    [EIGHTH, EIGHTH, EIGHTH, EIGHTH, EIGHTH, EIGHTH, EIGHTH, EIGHTH],
    [FOURTH, EIGHTH, FOURTH, EIGHTH, EIGHTH, EIGHTH],
    [FOURTH_DOT, FOURTH, EIGHTH, EIGHTH, EIGHTH],
    [EIGHTH, EIGHTH, EIGHTH_PAUSE, EIGHTH],
    [EIGHTH, EIGHTH, EIGHTH_PAUSE, EIGHTH, EIGHTH, EIGHTH, EIGHTH_PAUSE, EIGHTH],
]

for (let i = 0; i < rythmDivs.length; ++i) {
    rythmDivs[i].onclick = () => {
        for (let j = 0; j < rythmDivs.length; ++j) {
            if (i == j) {
                rythmDivs[j].classList.add('active')
                rythmId = j
            } else {
                rythmDivs[j].classList.remove('active')
            }
        }
    }
}

button.onclick = async () => {
    if (!context) {
        await init();
    }

    for (let i = 0; i < soundNodes.length; ++i) {
        soundNodes[i].stop(0)
    }
    soundNodes = []

    BPM = input.value
    
    const chords = [
        createPowerChord(generateNote()),
        createPowerChord(generateNote()),
        createPowerChord(generateNote()),
        createPowerChord(generateNote())
    ];

    riffText.textContent = ''
    for(let ch = 0; ch < chords.length; ++ch) {
        const tonica = chords[ch][0]
        const tonicaIndex = NOTES_HZ.indexOf(tonica) % 12
        let tonicaText = ''

        if (tonicaIndex == 0) {
            tonicaText = 'C5'
        } else if (tonicaIndex == 1) {
            tonicaText = 'C#5'
        } else if (tonicaIndex == 2) {
            tonicaText = 'D5'
        } else if (tonicaIndex == 3) {
            tonicaText = 'D#5'
        } else if (tonicaIndex == 4) {
            tonicaText = 'E5'
        } else if (tonicaIndex == 5) {
            tonicaText = 'F5'
        } else if (tonicaIndex == 6) {
            tonicaText = 'F#5'
        } else if (tonicaIndex == 7) {
            tonicaText = 'G5'
        } else if (tonicaIndex == 8) {
            tonicaText = 'G#5'
        } else if (tonicaIndex == 9) {
            tonicaText = 'A5'
        } else if (tonicaIndex == 10) {
            tonicaText = 'A#5'
        } else if (tonicaIndex == 11) {
            tonicaText = 'B5'
        }

        riffText.textContent += tonicaText + ' '
    }

    const rythm = RYTHMS[rythmId]

    for(let bar = 0; bar < 4; ++bar) {
        for(let ch = 0; ch < chords.length; ++ch) {
            for(let i = 0; i < rythm.length; ++i) {
                const duration = rythm[i];
                if (duration >= 0) {
                    playSound(chords[ch], rythm[i])
                } else {
                    playPause(duration)
                }
            }
        }
    }
    timeline = 0
};
