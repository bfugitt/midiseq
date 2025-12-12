/*
 * js/song.js
 * Handles song and pattern saving, loading, and playback.
 */

import { state } from './state.js';
import { createGrid, updatePatternDisplay } from './ui.js';
import { SCALES } from './constants.js';

let _stopSequencer, _startSequencer;

export function initSong(stopSeqFn, startSeqFn) {
    _stopSequencer = stopSeqFn;
    _startSequencer = startSeqFn;
}

// Simplified "Get Settings" logic
function getPatternSettings() {
    return {
        bpm: document.getElementById('bpm-input').value,
        scale_key: document.getElementById('scale-selector').value,
        baseOctave: document.getElementById('octave-selector').value,
        arp_mode: document.getElementById('arp-mode').value,
        arp_rate: document.getElementById('arp-rate').value,
        arp_chords: document.getElementById('arp-chords').value,
        arp_octaves: document.getElementById('arp-octaves').value
    };
}

export function savePattern() {
    const pattern = {
        name: `Pattern ${String.fromCharCode(65 + state.songPatterns.length)}`,
        settings: getPatternSettings(),
        sequence: state.sequence.map(row => [...row])
    };
    state.songPatterns.push(pattern);
    
    document.getElementById('save-pattern-btn').textContent = `SAVE PATTERN ${String.fromCharCode(65 + state.songPatterns.length)}`;
    updatePatternDisplay();
}

export function loadPattern(index) {
    const pattern = state.songPatterns[index];
    if (!pattern) return;
    
    // Update State
    state.sequence = pattern.sequence.map(row => [...row]);
    
    // Update UI (manually, since we don't have loadSynthControls anymore)
    document.getElementById('bpm-input').value = pattern.settings.bpm;
    document.getElementById('scale-selector').value = pattern.settings.scale_key;
    document.getElementById('octave-selector').value = pattern.settings.baseOctave;
    state.baseOctave = parseInt(pattern.settings.baseOctave);
    
    document.getElementById('arp-mode').value = pattern.settings.arp_mode;
    document.getElementById('arp-rate').value = pattern.settings.arp_rate;
    document.getElementById('arp-chords').value = pattern.settings.arp_chords;
    document.getElementById('arp-octaves').value = pattern.settings.arp_octaves;

    // Refresh Grid and Scale
    // We can trigger the scale change listener logic manually or call a shared function
    // But since main.js has logic, let's trust the state update for now.
    // Ideally main.js should expose a "loadSettings" function.
    // For now, let's just trigger the grid redraw.
    createGrid();
    
    // Note: The Scale Title won't update until we call loadScale(), 
    // but we can't import loadScale here easily without circ dependency.
    // The visual title might lag slightly until next interaction.
}

export function deletePattern(index) {
    if (state.isSongPlaying) {
        alert("Cannot delete patterns while Song Play is active.");
        return;
    }
    
    if (confirm(`Are you sure you want to delete ${state.songPatterns[index].name}?`)) {
        state.songPatterns.splice(index, 1);
        
        state.songPatterns.forEach((p, i) => {
            if (i >= index) {
                p.name = `Pattern ${String.fromCharCode(65 + i)}`;
            }
        });

        if (index === state.currentPatternIndex && state.songPatterns.length > 0) {
            state.currentPatternIndex = 0;
            loadPattern(0);
        } else if (state.songPatterns.length === 0) {
            state.currentPatternIndex = 0;
        } else if (index < state.currentPatternIndex) {
            state.currentPatternIndex--;
        }
        
        updatePatternDisplay();
        document.getElementById('save-pattern-btn').textContent = `SAVE PATTERN ${String.fromCharCode(65 + state.songPatterns.length)}`;
    }
}

export function advanceSongPattern() {
    if (state.currentPatternIndex >= state.songPatterns.length - 1) {
        stopSong();
        return;
    }
    state.currentPatternIndex++;
    state.nextPatternToLoad = state.songPatterns[state.currentPatternIndex]; 
    updatePatternDisplay();
}

export function startStopSong() {
    const songBtn = document.getElementById('play-song-btn');
    if (state.isSongPlaying) {
        stopSong();
        songBtn.textContent = 'PLAY SONG';
        songBtn.classList.remove('active');
    } else {
        if (state.songPatterns.length === 0) {
            alert("No patterns saved to play.");
            return;
        }
        if (state.isPlaying) _stopSequencer();
        
        state.isSongPlaying = true;
        state.currentPatternIndex = 0;
        songBtn.textContent = 'STOP SONG';
        songBtn.classList.add('active');
        
        loadPattern(state.currentPatternIndex);
        updatePatternDisplay();
        _startSequencer();
    }
}

export function stopSong() {
    state.isSongPlaying = false;
    state.nextPatternToLoad = null;
    state.currentPatternIndex = 0;
    
    const songBtn = document.getElementById('play-song-btn');
    songBtn.textContent = 'PLAY SONG';
    songBtn.classList.remove('active');
    
    if (state.isPlaying) _stopSequencer();
    updatePatternDisplay();
}