// audioNode.js - Manages Audio Worklets inside the Main Window
let audioCtx = null;
let modulesRegistry = {}; // Explicit storage tracking map

async function initAudio() {
    if (audioCtx) return audioCtx;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Inject the multi-channel background synthesis file
    await audioCtx.audioWorklet.addModule('processorModular.js');
    return audioCtx;
}

async function createModularNode(id) {
    if (!audioCtx) await initAudio();

    // Create an independent worker node instance
    const node = new AudioWorkletNode(audioCtx, 'modular-processor', {
        numberOfInputs: 1,  // Accepts 1 input patch cable
        numberOfOutputs: 1  // Outputs 1 signal stream
    });

    modulesRegistry[id] = node;

    // Default connection fallback straight to speakers
    node.connect(audioCtx.destination);
    return node;
}

function connectModules(fromId, toId) {
    if (modulesRegistry[fromId] && modulesRegistry[toId]) {
        modulesRegistry[fromId].connect(modulesRegistry[toId]);
        console.log(`Piped Audio Stream: Mod #${fromId} -> Mod #${toId}`);
    }
}

function disconnectModule(id) {
    if (modulesRegistry[id]) {
        modulesRegistry[id].disconnect();
        modulesRegistry[id].connect(audioCtx.destination); 
    }
}
