const button = document.querySelector("button");
const input = document.getElementById("bpm");
const rythmDivs = document.getElementsByClassName('rythm-tile')
const riffText = document.getElementById("riff");
const riffHeader = document.querySelector("div#south2 h3");

const C2   = 0
const Csh2 = 1
const D2   = 2
const Dsh2 = 3
const E2   = 4 // E string
const F2   = 5
const Fsh2 = 6
const G2   = 7
const Gsh2 = 8
const A2   = 9 // A string
const Ash2 = 10
const B2   = 11

const C3   = 12
const Csh3 = 13
const D3   = 14 // D string
const Dsh3 = 15
const E3   = 16
const F3   = 17
const Fsh3 = 18
const G3   = 19 // G string
const Gsh3 = 20
const A3   = 21
const Ash3 = 22
const B3   = 23 // B string

const C4   = 24
const Csh4 = 25
const D4   = 26
const Dsh4 = 27
const E4   = 28 // e string
const F4   = 29
const Fsh4 = 30
const G4   = 31
const Gsh4 = 32
const A4   = 33
const Ash4 = 34
const B4   = 35

const C5   = 36
const Csh5 = 37
const D5   = 38
const Dsh5 = 39
const E5   = 40
const F5   = 41
const Fsh5 = 42
const G5   = 43
const Gsh5 = 44
const A5   = 45
const Ash5 = 46
const B5   = 47

const C6   = 48
const Csh6 = 49
const D6   = 50
const Dsh6 = 51
const E6   = 52
const F6   = 53
const Fsh6 = 54
const G6   = 55
const Gsh6 = 56
const A6   = 57
const Ash6 = 58
const B6   = 59

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

const KICK = 1
const SNARE = 2
const HI_HAT = 3

// Settings
let BPM = 140
const VOLUME = 0.1
const DRUMS_VOLUME = 0.7
const GAIN = 400
const DAMPING_START = 0
const DAMPING_DURATION = 0.03
const DEBUG_MODE = false

// Runtime
let rythmId = 3

let effectsChain = []

let context
let distortion
let compressor
let gain
let drumsGain
let reverb
let drumsReverb

let guitarSample
let kickSample
let snareSample
let hiHatSample
let SAMPLE_NOTE

let soundNodes = []

let timeline = 0.0
let drumsTimeline = 0.0

async function init() {
    context = new AudioContext()

    reverb = await createReverb()
    drumsReverb = await createReverb()

    guitarSample = await createGuitarSample()
    kickSample = await loadSample("./sound/drums_kick.wav")
    snareSample = await loadSample("./sound/drums_snare.wav")
    hiHatSample = await loadSample("./sound/drums_hi_hat.wav")

    gain = context.createGain()
    gain.gain.value = VOLUME

    drumsGain = context.createGain()
    drumsGain.gain.value = DRUMS_VOLUME

    distortion = context.createWaveShaper()
    distortion.curve = makeDistortionCurve(GAIN)

    // cut above 8400 Hz
    let cutHighs = context.createBiquadFilter()
    cutHighs.type = "lowpass"
    cutHighs.frequency.setValueAtTime(8400, context.currentTime)
    cutHighs.Q.setValueAtTime(0, context.currentTime)

    // cut around 1500 Hz
    let gumDown = context.createBiquadFilter()
    gumDown.type = "notch"
    gumDown.frequency.setValueAtTime(1500, context.currentTime)
    gumDown.Q.setValueAtTime(5.5, context.currentTime)

    // cut around 4900 Hz
    let cutSand = context.createBiquadFilter()
    cutSand.type = "peaking"
    cutSand.frequency.setValueAtTime(4900, context.currentTime)
    cutSand.Q.setValueAtTime(3, context.currentTime)
    cutSand.gain.setValueAtTime(-8, context.currentTime)

    // cut around 10000 Hz
    let cutSand2 = context.createBiquadFilter()
    cutSand2.type = "peaking"
    cutSand2.frequency.setValueAtTime(10000, context.currentTime)
    cutSand2.Q.setValueAtTime(3, context.currentTime)
    cutSand2.gain.setValueAtTime(-14, context.currentTime)

    // boost below 200 Hz
    let boostLow = context.createBiquadFilter()
    boostLow.type = "lowshelf"
    boostLow.frequency.setValueAtTime(200, context.currentTime)
    boostLow.gain.setValueAtTime(2, context.currentTime)

    // boost around 1350 Hz
    let peakMids = context.createBiquadFilter()
    peakMids.type = "peaking"
    peakMids.frequency.setValueAtTime(1350, context.currentTime)
    peakMids.Q.setValueAtTime(0.5, context.currentTime)
    peakMids.gain.setValueAtTime(7, context.currentTime)

    effectsChain = [
        distortion,
        cutHighs,
        gumDown,
        cutSand,
        cutSand2,
        boostLow,
        peakMids,
        reverb,
        gain,
        context.destination
    ]

    drumsEffectsChain = [
        drumsReverb,
        drumsGain,
        context.destination
    ]

    for (let i = 0; i < effectsChain.length - 1; ++i) {
        effectsChain[i].connect(effectsChain[i + 1])
    }

    for (let i = 0; i < drumsEffectsChain.length - 1; ++i) {
        drumsEffectsChain[i].connect(drumsEffectsChain[i + 1])
    }
}

async function createReverb() {
    const convolver = context.createConvolver();
  
    // load impulse response from file
    convolver.normalize = false;
    convolver.buffer = await fetch("./sound/room.wav")
        .then(response => response.arrayBuffer())
        .then(buffer => context.decodeAudioData(buffer))
  
    return convolver
}

async function loadSample(path) {
    return fetch(path)
        .then(response => response.arrayBuffer())
        .then(buffer => context.decodeAudioData(buffer))
}

async function createGuitarSample() {
    SAMPLE_NOTE = D3;
    return await loadSample("./sound/guitar_d_string.wav")
}

function createSampleSource(noteToPlay) {
    const source = context.createBufferSource()
    source.buffer = guitarSample
    source.playbackRate.value = 2 ** ((noteToPlay - SAMPLE_NOTE) / 12)
    return source
}

function createDrumSource(drumType) {
    const source = context.createBufferSource()
    if (drumType == KICK) {
        source.buffer = kickSample
    } else if (drumType == SNARE) {
        source.buffer = snareSample
    } else {
        source.buffer = hiHatSample
    }
    
    return source
}

function makeDistortionCurve(k = 20) {
    const n_samples = 512
    const curve = new Float32Array(n_samples)

    for (let i = 0; i < n_samples; ++i ) {
        const x = i * 2 / n_samples - 1;

        // Bypass
        //curve[i] = x;

        // Square wave
        //curve[i] = Math.sign(k*x)

        // Distortions
        //curve[i] = Math.tanh(k*x)
        //curve[i] = (3 + k)*Math.atan(Math.sinh(x*0.25)*5) / (Math.PI + k * Math.abs(x))
        //curve[i] = 2/(1 + Math.exp(-k*x))-1
        //curve[i] = (2/Math.PI)*Math.atan(k*x*Math.PI/2)
        curve[i] = x*k/(1 + Math.abs(k*x))

        // Overdrive
        const OVERDRIVE_CLIP_TRESHOLD = 7
        //curve[i] = OVERDRIVE_CLIP_TRESHOLD*(x/(Math.pow(1+Math.pow(Math.abs(OVERDRIVE_CLIP_TRESHOLD*x), k), 1/k)))

        // Rectifier 50%
        //curve[i] = x > 0 ? Math.abs(k*x) : 0

        // Rectifier 100%
        //curve[i] = Math.abs(k*x)
        
    }
    return curve;
}

function playSound(notes, duration) {
    const seconds = duration / (BPM / 60)
    const startTime = context.currentTime + timeline
    const endTime = startTime + seconds

    for (let noteIndex = 0; noteIndex < notes.length; noteIndex++) {
        const sample = createSampleSource(notes[noteIndex])

        sample.connect(effectsChain[0])
        sample.start(startTime)
        sample.stop(endTime + DAMPING_DURATION)

        soundNodes.push(sample)
    }

    //gain.gain.setTargetAtTime(0, endTime - DAMPING_START, DAMPING_DURATION)
    //gain.gain.setTargetAtTime(VOLUME, endTime + DAMPING_DURATION, DAMPING_DURATION)

    timeline += seconds
}

function playPause(duration) {
    const seconds = Math.abs(duration) / (BPM / 60)
    timeline += seconds
}

function playDrum(drumType, duration) {
    const seconds = duration / (BPM / 60)
    const startTime = context.currentTime + drumsTimeline
    const endTime = startTime + seconds

    const sample = createDrumSource(drumType)

    sample.connect(drumsEffectsChain[0])
    sample.start(startTime)
    sample.stop(endTime + DAMPING_DURATION)

    soundNodes.push(sample)

    drumsTimeline += seconds
}

function playKick(duration) {
    playDrum(KICK, duration)
}

function playSnare(duration) {
    playDrum(SNARE, duration)
}

function playHiHat(duration) {
    playDrum(HI_HAT, duration)
}

SHORT = 0
FULL = 1

function createPowerChord(tonica, type = FULL) {
    return type == SHORT
        ? [tonica, tonica + 7]
        : [tonica, tonica + 7, tonica + 12]
}

function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

function generateNote() {
    return getRandomInt(E2, E3)
}

RYTHMS = [
    [EIGHTH, EIGHTH, EIGHTH, EIGHTH],
    [EIGHTH, EIGHTH, EIGHTH, EIGHTH, EIGHTH, EIGHTH, EIGHTH, EIGHTH],
    [FOURTH, EIGHTH, FOURTH, EIGHTH, EIGHTH, EIGHTH],
    [FOURTH_DOT, FOURTH, EIGHTH, EIGHTH, EIGHTH],
    [EIGHTH, EIGHTH, EIGHTH_PAUSE, EIGHTH],
    [EIGHTH, EIGHTH, EIGHTH_PAUSE, EIGHTH, EIGHTH, EIGHTH, EIGHTH_PAUSE, EIGHTH],
]

RYTHMS_RATIOS = [
    1, 2, 2, 2, 1, 2
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

function setRiffText(chords) {
    // form the riff text
    riffText.textContent = ''
    for(let ch = 0; ch < chords.length; ++ch) {
        const tonica = chords[ch][0]
        const tonicaIndex = tonica % 12
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

    // treat # specially
    riffText.innerHTML = riffText.innerHTML.replaceAll('#', '<span class="sharp">#</span>')

    // show header
    riffHeader.innerHTML = 'Your riff&nbsp;:&nbsp;';
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
    
    const chords = DEBUG_MODE
    ? [
        createPowerChord(Fsh2),
        createPowerChord(E2),
        createPowerChord(G2),
        createPowerChord(E2)
    ]
    : [
        createPowerChord(generateNote()),
        createPowerChord(generateNote()),
        createPowerChord(generateNote()),
        createPowerChord(generateNote())
    ];

    setRiffText(chords)

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

    for(let bar = 0; bar < 4; ++bar) {
        for(let ch = 0; ch < chords.length; ++ch) {
            for(let i = 0; i < RYTHMS_RATIOS[rythmId]; ++i) {
                playKick(EIGHTH)
                playKick(EIGHTH)
                //playHiHat(EIGHTH)
                playSnare(FOURTH)
                //playHiHat(EIGHTH)
            }
        }
    }
    timeline = 0
    drumsTimeline = 0
};
