/*
 * js/midiEngine.js
 * Handles Web MIDI API connections and sending note data.
 */

let midiAccess = null;
let midiOutput = null;

// Initialize MIDI Access
export async function initMidi() {
    if (!navigator.requestMIDIAccess) {
        alert("Web MIDI API not supported in this browser.");
        return;
    }

    try {
        midiAccess = await navigator.requestMIDIAccess();
        // Populate dropdown with available outputs
        updateOutputList();
        
        // Listen for connection changes (plugging/unplugging)
        midiAccess.onstatechange = updateOutputList;
        
    } catch (err) {
        console.error("Could not access MIDI devices.", err);
    }
}

// Update the dropdown list in the UI
function updateOutputList() {
    const selector = document.getElementById('midi-output-selector');
    if (!midiAccess) return;

    // Clear existing options
    selector.innerHTML = '<option value="">-- Select MIDI Output --</option>';

    const outputs = midiAccess.outputs.values();
    for (let output of outputs) {
        const option = document.createElement('option');
        option.value = output.id;
        option.textContent = output.name || `MIDI Device ${output.id}`;
        selector.appendChild(option);
    }

    // Auto-select the first one if we don't have one selected
    if (!midiOutput && selector.options.length > 1) {
        selector.selectedIndex = 1;
        selectMidiOutput(selector.value);
    }
}

// Called when user changes the dropdown
export function selectMidiOutput(id) {
    if (!midiAccess) return;
    midiOutput = midiAccess.outputs.get(id);
    console.log(`MIDI Output selected: ${midiOutput ? midiOutput.name : 'None'}`);
}

// Send Note On [0x90, note, velocity]
export function sendMidiNoteOn(midiNote, velocity = 100) {
    if (!midiOutput) return;
    // Channel 1 Note On
    midiOutput.send([0x90, midiNote, velocity]);
}

// Send Note Off [0x80, note, velocity]
export function sendMidiNoteOff(midiNote) {
    if (!midiOutput) return;
    // Channel 1 Note Off
    midiOutput.send([0x80, midiNote, 0]);
}