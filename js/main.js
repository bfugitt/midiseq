/*
 * js/main.js
 * The central coordinator for the Web MIDI Controller.
 */

import { state } from './state.js';
import { initMidi, selectMidiOutput, sendMidiNoteOn, sendMidiNoteOff } from './midiEngine.js';
import { startArpeggiator, stopArpeggiator } from './arpeggiator.js';
import { 
    initSequencer, clearGrid, loadScale, startStopSequencer, 
    startSequencer, stopSequencer, setAdvanceSongFn, setStopSongFn,
    randomizeSequence 
} from './sequencer.js';
import { 
    initSong, savePattern, deletePattern, loadPattern, 
    advanceSongPattern, startStopSong, stopSong 
} from './song.js';
import { 
    updateRangeLabel, updateBaseOctave, createPianoKeys, 
    createGrid, updatePatternDisplay, populateScaleSelector 
} from './ui.js';

// --- Keyboard Interaction Logic ---
const keyToMidi = {};
function setupKeyMappings() {
    const base = () => state.baseOctave;
    const mappings = {
        'A': () => base(), 'W': () => base() + 1, 'S': () => base() + 2, 'E': () => base() + 3,
        'D': () => base() + 4, 'F': () => base() + 5, 'T': () => base() + 6, 'G': () => base() + 7,
        'Y': () => base() + 8, 'H': () => base() + 9, 'U': () => base() + 10, 'J': () => base() + 11,
        'K': () => base() + 12
    };
    for (const key in keyToMidi) delete keyToMidi[key];
    for (const key in mappings) keyToMidi[key] = mappings[key];
}

function updateHeldNotes(midiNote, isAdding) {
    midiNote = parseInt(midiNote);
    const index = state.heldNotes.indexOf(midiNote);
    if (isAdding && index === -1) {
        state.heldNotes.push(midiNote);
    } else if (!isAdding && index > -1) {
        state.heldNotes.splice(index, 1);
    }
    state.heldNotes.sort((a, b) => a - b);

    const arpMode = document.getElementById('arp-mode').value;
    if (arpMode !== 'off' && !state.isPlaying) {
        if (state.heldNotes.length > 0) {
            startArpeggiator();
        } else {
            stopArpeggiator();
        }
    }
}

function noteOn(midiNote) {
    if (state.isPlaying) return;
    const arpMode = document.getElementById('arp-mode').value;
    if (arpMode === 'off') {
        sendMidiNoteOn(midiNote);
    }
    updateHeldNotes(midiNote, true);
}

function noteOff(midiNote) {
    const arpMode = document.getElementById('arp-mode').value;
    if (arpMode === 'off') {
        sendMidiNoteOff(midiNote);
    }
    updateHeldNotes(midiNote, false);
}

// --- Main Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Connect Modules
    initSequencer(loadPatternSettings, createGrid, setupKeyMappings);
    initSong(stopSequencer, startSequencer);
    setAdvanceSongFn(advanceSongPattern);
    setStopSongFn(stopSong);

    // Initialize Systems
    initMidi(); // Request MIDI access immediately
    populateScaleSelector();
    loadScale();
    createPianoKeys();
    updatePatternDisplay();
    setupKeyMappings();
    
    // --- Helper for sequencer to load non-audio settings ---
    function loadPatternSettings(settings) {
        state.baseOctave = parseInt(settings.baseOctave) || 60;
        document.getElementById('octave-selector').value = state.baseOctave;
        document.getElementById('scale-selector').value = settings.scale_key || 'major';
        document.getElementById('bpm-input').value = settings.bpm || 120;
        document.getElementById('arp-mode').value = settings.arp_mode || 'off';
        document.getElementById('arp-rate').value = settings.arp_rate || '1';
        document.getElementById('arp-chords').value = settings.arp_chords || 'held_notes';
        document.getElementById('arp-octaves').value = settings.arp_octaves || '2';
        
        loadScale(); // Redraws keys and grid
    }

    // --- Listeners ---
    document.getElementById('midi-output-selector').onchange = (e) => selectMidiOutput(e.target.value);

    // Arp
    document.getElementById('arp-mode').onchange = startArpeggiator;
    document.getElementById('arp-rate').onchange = startArpeggiator;
    document.getElementById('arp-chords').onchange = startArpeggiator;
    document.getElementById('arp-octaves').onchange = startArpeggiator;

    // Keyboard
    document.getElementById('octave-selector').onchange = (e) => {
        state.baseOctave = parseInt(e.target.value);
        setupKeyMappings();
        createPianoKeys();
        loadScale();
    };
    
    document.getElementById('piano-keys').addEventListener('mousedown', e => {
        if (e.target.classList.contains('key')) {
            noteOn(e.target.dataset.midi);
            e.target.classList.add('active');
        }
    });
    document.getElementById('piano-keys').addEventListener('mouseup', e => {
        if (e.target.classList.contains('key')) {
            noteOff(e.target.dataset.midi);
            e.target.classList.remove('active');
        }
    });
    document.getElementById('piano-keys').addEventListener('mouseleave', e => {
        if (e.buttons === 1 && e.target.classList.contains('key')) {
            noteOff(e.target.dataset.midi);
            e.target.classList.remove('active');
        }
    }, true);
    
    document.addEventListener('keydown', (e) => {
        if (e.repeat) return;
        const key = e.key.toUpperCase();
        if (keyToMidi[key]) {
            const midiNote = keyToMidi[key]();
            noteOn(midiNote);
            document.getElementById(`key-${midiNote}`)?.classList.add('active');
        }
    });
    document.addEventListener('keyup', (e) => {
        const key = e.key.toUpperCase();
        if (keyToMidi[key]) {
            const midiNote = keyToMidi[key]();
            noteOff(midiNote);
            document.getElementById(`key-${midiNote}`)?.classList.remove('active');
        }
    });

    // Sequencer
    document.getElementById('scale-selector').onchange = loadScale;
    document.getElementById('play-btn').onclick = startStopSequencer;
    document.getElementById('stop-btn').onclick = stopSequencer;
    document.getElementById('clear-btn').onclick = clearGrid;
    document.getElementById('randomize-btn').onclick = randomizeSequence;
    document.getElementById('random-amount').oninput = (e) => updateRangeLabel(e.target);
    document.getElementById('tie-btn').onclick = (e) => {
        state.sequencerTieMode = !state.sequencerTieMode;
        e.target.classList.toggle('active', state.sequencerTieMode);
        e.target.textContent = state.sequencerTieMode ? 'TIE: ON' : 'TIE: OFF';
    };

    // Song
    document.getElementById('save-pattern-btn').onclick = savePattern;
    document.getElementById('play-song-btn').onclick = startStopSong;
    document.getElementById('pattern-display').addEventListener('click', e => {
        const tile = e.target.closest('.pattern-tile');
        if (!tile) return;
        const index = tile.dataset.index;
        if (e.target.classList.contains('delete-btn')) {
            deletePattern(index);
        } else {
            if (state.isPlaying) stopSequencer();
            loadPattern(index);
        }
    });
});