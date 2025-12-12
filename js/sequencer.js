/*
 * js/sequencer.js
 * Handles sequencer logic and transport controls.
 */

import { state } from './state.js';
import { SCALES, MIDI_NOTE_NAMES } from './constants.js';
// --- MIDI CHANGE ---
import { sendMidiNoteOn, sendMidiNoteOff } from './midiEngine.js';
// --- END CHANGE ---
import { getArpParams, calculateArpNote, stopArpeggiator, startArpeggiator } from './arpeggiator.js';

let _loadPatternSettings;
let _createGrid;
let _setupKeyMappings;

export function initSequencer(loadPatternFn, createGridFn, setupKeysFn) {
    _loadPatternSettings = loadPatternFn;
    _createGrid = createGridFn;
    _setupKeyMappings = setupKeysFn;
}

export function clearGrid() {
    const NUM_ROWS = 8;
    const NUM_STEPS = 16;
    state.sequence = Array(NUM_ROWS).fill().map(() => Array(NUM_STEPS).fill(0));
    if (_createGrid) _createGrid();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export function randomizeSequence() {
    const NUM_ROWS = 8;
    const NUM_STEPS = 16;
    const noteCount = parseInt(document.getElementById('random-amount').value);
    
    state.sequence = Array(NUM_ROWS).fill().map(() => Array(NUM_STEPS).fill(0));

    const allSteps = [];
    for (let r = 0; r < NUM_ROWS; r++) {
        for (let s = 0; s < NUM_STEPS; s++) {
            allSteps.push({ r, s });
        }
    }
    shuffleArray(allSteps);

    for (let i = 0; i < noteCount; i++) {
        const step = allSteps[i];
        state.sequence[step.r][step.s] = 1;
    }
    
    const scaleKeys = Object.keys(SCALES);
    const randomKey = scaleKeys[Math.floor(Math.random() * scaleKeys.length)];
    document.getElementById('scale-selector').value = randomKey;
    
    loadScale(); 
}

export function loadScale() {
    const scaleKey = document.getElementById('scale-selector').value;
    const scale = SCALES[scaleKey];
    if (!scale) return;

    const NUM_ROWS = 8;
    const offsets = scale.offsets.slice(0, NUM_ROWS);
    
    state.currentScaleMidiNotes = offsets.map(offset => state.baseOctave + offset).reverse();
    
    state.currentScaleNoteNames = state.currentScaleMidiNotes.map(midi => {
        const noteIndex = midi % 12;
        const octave = Math.floor(midi / 12) - 1;
        return `${MIDI_NOTE_NAMES[noteIndex]}${octave}`;
    });

    document.getElementById('sequencer-title').textContent = `16-Step Sequencer (${scale.name})`;
    if (_createGrid) _createGrid();
    if (_setupKeyMappings) _setupKeyMappings();
}

function runStep() {
    const NUM_STEPS = 16;
    const NUM_ROWS = 8;
    
    if (state.isSongPlaying && state.currentStep === 0 && state.nextPatternToLoad) {
        if (_loadPatternSettings) _loadPatternSettings(state.nextPatternToLoad.settings);
        state.sequence = state.nextPatternToLoad.sequence.map(row => [...row]);
        if (_createGrid) _createGrid();
        
        const newBpm = parseInt(state.nextPatternToLoad.settings.bpm) || 120;
        document.getElementById('bpm-input').value = newBpm;
        
        clearInterval(state.sequencerInterval);
        startSequencer(true);
        state.nextPatternToLoad = null;
    }
    
    const prevStep = (state.currentStep - 1 + NUM_STEPS) % NUM_STEPS;
    const bpm = parseInt(document.getElementById('bpm-input').value) || 120;
    const stepDurationMs = (60 / bpm / 4) * 1000;

    document.querySelectorAll('.step.current').forEach(el => el.classList.remove('current'));
    const currentStepEls = document.querySelectorAll(`.step[data-step="${state.currentStep}"]`);
    currentStepEls.forEach(el => el.classList.add('current'));

    const { mode: arpMode } = getArpParams();
    let notesToArp = [];
    for (let row = 0; row < NUM_ROWS; row++) {
        if (state.sequence[row][state.currentStep]) {
            notesToArp.push(state.currentScaleMidiNotes[row]);
        }
    }
    notesToArp.sort((a, b) => a - b);

    if (arpMode !== 'off' && notesToArp.length > 0) {
        // --- ARP LOGIC ---
        // Stop tied notes from previous step to avoid sticking
        for (let row = 0; row < NUM_ROWS; row++) {
            if (state.sequence[row][prevStep]) {
                sendMidiNoteOff(state.currentScaleMidiNotes[row]);
            }
        }
        
        const { rateFactor, octaves, chordSequence } = getArpParams();
        const numArpNotesPerStep = rateFactor;
        const arpNoteDurationMs = stepDurationMs / numArpNotesPerStep;

        for (let i = 0; i < numArpNotesPerStep; i++) {
            setTimeout(() => {
                // MIDI Arp is slightly different: we must ensure we turn off the previous arp note
                // For simplicity here, we'll rely on the short duration.
                // Ideally, we'd track the last played arp note.
                
                const totalArpIndex = (state.currentStep * numArpNotesPerStep) + i; 
                const noteToPlay = calculateArpNote(notesToArp, totalArpIndex, arpMode, octaves, chordSequence);
                
                if (noteToPlay !== null) {
                    sendMidiNoteOn(noteToPlay);
                    setTimeout(() => sendMidiNoteOff(noteToPlay), arpNoteDurationMs * 0.9);
                }
            }, i * arpNoteDurationMs);
        }

    } else {
        // --- SEQUENCER LOGIC ---
        for (let row = 0; row < NUM_ROWS; row++) {
            const midiNote = state.currentScaleMidiNotes[row];
            const isPrevOn = state.sequence[row][prevStep];
            const isCurrOn = state.sequence[row][state.currentStep];

            if (state.sequencerTieMode) {
                if (!isPrevOn && isCurrOn) {
                    sendMidiNoteOn(midiNote);
                } else if (isPrevOn && !isCurrOn) {
                    sendMidiNoteOff(midiNote);
                }
            } else {
                if (isCurrOn) {
                    sendMidiNoteOn(midiNote);
                    setTimeout(() => sendMidiNoteOff(midiNote), stepDurationMs * 0.9);
                }
            }
        }
    }

    state.currentStep = (state.currentStep + 1) % NUM_STEPS;
    
    if (state.isSongPlaying && state.currentStep === 0) {
        if (_advanceSongPattern) _advanceSongPattern();
    }
}

let _advanceSongPattern;
export function setAdvanceSongFn(fn) {
    _advanceSongPattern = fn;
}

export function startSequencer(isSongContinue = false) {
    if (state.isPlaying && !isSongContinue) return;
    
    stopArpeggiator();
    
    state.isPlaying = true;
    if (!isSongContinue) {
        state.currentStep = 0;
    }
    
    const bpm = parseInt(document.getElementById('bpm-input').value) || 120;
    const intervalTimeMs = (60 / bpm / 4) * 1000;
    
    clearInterval(state.sequencerInterval);
    state.sequencerInterval = setInterval(runStep, intervalTimeMs);
    
    document.getElementById('play-btn').textContent = 'PAUSE';
    
    if (!isSongContinue) {
        runStep();
    }
}

let _stopSong;
export function setStopSongFn(fn) {
    _stopSong = fn;
}

export function startStopSequencer() {
    if (state.isSongPlaying) {
        alert("Please stop SONG mode first.");
        return;
    }

    if (state.isPlaying) {
        stopSequencer();
    } else {
        startSequencer();
    }
}

export function stopSequencer() {
    state.isPlaying = false;
    clearInterval(state.sequencerInterval);
    document.getElementById('play-btn').textContent = 'PLAY';
    document.querySelectorAll('.step.current').forEach(el => el.classList.remove('current'));
    
    // Panic Button: Turn off all possible notes
    for (let i = 0; i < 127; i++) sendMidiNoteOff(i);
    
    state.currentStep = 0;
    
    if (state.isSongPlaying && _stopSong) {
        _stopSong();
    }
    
    if (state.heldNotes.length > 0) {
        startArpeggiator(); // Re-enable arp if keys held
    }
}