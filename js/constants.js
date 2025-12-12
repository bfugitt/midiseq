/*
 * js/constants.js
 * Static data for MIDI sequencing.
 */

export const MIDI_NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const SCALES = {
    'major': { name: "Ionian (Major)", offsets: [0, 2, 4, 5, 7, 9, 11, 12] },
    'dorian': { name: "Dorian", offsets: [0, 2, 3, 5, 7, 9, 10, 12] },
    'phrygian': { name: "Phrygian", offsets: [0, 1, 3, 5, 7, 8, 10, 12] },
    'lydian': { name: "Lydian", offsets: [0, 2, 4, 6, 7, 9, 11, 12] },
    'mixolydian': { name: "Mixolydian", offsets: [0, 2, 4, 5, 7, 9, 10, 12] },
    'minor': { name: "Aeolian (Minor)", offsets: [0, 2, 3, 5, 7, 8, 10, 12] },
    'locrian': { name: "Locrian", offsets: [0, 1, 3, 5, 6, 8, 10, 12] }
};

export const ARP_CHORD_INTERVALS = {
    'held_notes': null,
    'major_triad': [0, 4, 7],
    'minor_triad': [0, 3, 7],
    'seventh_chord': [0, 4, 7, 10],
    'fifth_chord': [0, 7]
};