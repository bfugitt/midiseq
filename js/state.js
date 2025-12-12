/*
 * js/state.js
 * Holds the "live" state of the MIDI Sequencer.
 */

export const state = {
    // Sequencer
    currentStep: 0,
    isPlaying: false,
    sequencerInterval: null,
    sequencerTieMode: false,
    
    // Grid Data
    sequence: Array(8).fill().map(() => Array(16).fill(0)), 
    currentScaleNoteNames: [],
    currentScaleMidiNotes: [],

    // Base Settings
    baseOctave: 60, // C4

    // Arpeggiator
    heldNotes: [],
    arpeggiatorInterval: null,
    arpIndex: 0,

    // Song Mode
    songPatterns: [],
    isSongPlaying: false,
    currentPatternIndex: 0,
    nextPatternToLoad: null
};