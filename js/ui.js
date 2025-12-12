/*
 * js/ui.js
 * Handles DOM creation.
 */

import { state } from './state.js';
import { SCALES, MIDI_NOTE_NAMES } from './constants.js';

export function updateRangeLabel(input, unit = '') {
    const valEl = document.getElementById(input.id + '-val');
    if (valEl) {
        valEl.textContent = input.value + unit;
    }
}

export function updateBaseOctave(value) {
    state.baseOctave = parseInt(value);
    createPianoKeys();
}

export function createPianoKeys() {
    const pianoKeys = document.getElementById('piano-keys');
    pianoKeys.innerHTML = '';
    
    const keys = [
        { note: 'C', midi: state.baseOctave, class: 'white', key: 'A' },
        { note: 'C#', midi: state.baseOctave + 1, class: 'black', key: 'W' },
        { note: 'D', midi: state.baseOctave + 2, class: 'white', key: 'S' },
        { note: 'D#', midi: state.baseOctave + 3, class: 'black', key: 'E' },
        { note: 'E', midi: state.baseOctave + 4, class: 'white', key: 'D' },
        { note: 'F', midi: state.baseOctave + 5, class: 'white', key: 'F' },
        { note: 'F#', midi: state.baseOctave + 6, class: 'black', key: 'T' },
        { note: 'G', midi: state.baseOctave + 7, class: 'white', key: 'G' },
        { note: 'G#', midi: state.baseOctave + 8, class: 'black', key: 'Y' },
        { note: 'A', midi: state.baseOctave + 9, class: 'white', key: 'H' },
        { note: 'A#', midi: state.baseOctave + 10, class: 'black', key: 'U' },
        { note: 'B', midi: state.baseOctave + 11, class: 'white', key: 'J' },
        { note: 'C+', midi: state.baseOctave + 12, class: 'white', key: 'K' }
    ];

    keys.forEach(keyData => {
        const keyEl = document.createElement('div');
        keyEl.className = `key ${keyData.class}`;
        keyEl.id = `key-${keyData.midi}`;
        keyEl.dataset.midi = keyData.midi;
        keyEl.innerHTML = `<div>${keyData.note}</div><div style="font-weight:bold; margin-bottom:5px;">${keyData.key}</div>`;
        pianoKeys.appendChild(keyEl);
    });
}

export function createGrid() {
    const sequencerGrid = document.getElementById('sequencer-grid');
    sequencerGrid.innerHTML = ''; 

    const NUM_ROWS = 8;
    const NUM_STEPS = 16;
    for (let row = 0; row < NUM_ROWS; row++) {
        const name = state.currentScaleNoteNames[row];
        const label = document.createElement('div');
        label.className = 'note-label';
        label.textContent = name;
        sequencerGrid.appendChild(label);
        
        for (let step = 0; step < NUM_STEPS; step++) {
            const stepEl = document.createElement('div');
            stepEl.className = 'step';
            stepEl.dataset.row = row;
            stepEl.dataset.step = step;
            if (state.sequence[row][step]) {
                stepEl.classList.add('on');
            }
            stepEl.onclick = () => {
                state.sequence[row][step] = 1 - state.sequence[row][step];
                stepEl.classList.toggle('on');
            };
            sequencerGrid.appendChild(stepEl);
        }
    }
}

export function updatePatternDisplay() {
    const displayEl = document.getElementById('pattern-display');
    displayEl.innerHTML = '';
    
    if (state.songPatterns.length === 0) {
        displayEl.innerHTML = '<p style="margin: 0;">Saved Patterns: None</p>';
        return;
    }
    
    state.songPatterns.forEach((pattern, index) => {
        const tile = document.createElement('div');
        tile.className = 'pattern-tile';
        const scaleName = SCALES[pattern.settings.scale_key]?.name || 'Unknown';
        tile.textContent = `${pattern.name} (${scaleName})`;
        tile.dataset.index = index;

        if (state.isSongPlaying && index === state.currentPatternIndex) {
            tile.classList.add('playing');
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'X';
        tile.appendChild(deleteBtn);
        displayEl.appendChild(tile);
    });
}

export function populateScaleSelector() {
    const selector = document.getElementById('scale-selector');
    selector.innerHTML = '';
    for (const key in SCALES) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = SCALES[key].name;
        selector.appendChild(option);
    }
}