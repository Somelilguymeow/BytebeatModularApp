/* ==========================================================================
   🕹️ RE-ALIGNED FRONTEND EVENT HUB & WEBMIDI SCROLLER MATRIX - PART 1
   ========================================================================== */

// Tracks real-time cursor screen properties globally across the workspace canvas
window.addEventListener('mousemove', (e) => {
    window.mouseCurrentX = e.clientX; 
    window.mouseCurrentY = e.clientY;
});

/* 🎹 NATIVE WEBMIDI HARDWARE INTEGRATION HUB */
(function initializeMidiScanners() {
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess()
            .then(onMidiSuccess, () => console.log("MIDI access denied by host environment."));
    } else {
        console.log("WebMIDI API not supported natively on this browser compilation profile.");
    }

    function onMidiSuccess(midiAccess) {
        const inputs = midiAccess.inputs.values();
        for (let input of inputs) {
            input.onmidimessage = handleInboundMidiSignals;
        }
        midiAccess.onstatechange = (e) => {
            if (e.port.type === 'input' && e.port.state === 'connected') {
                e.port.onmidimessage = handleInboundMidiSignals;
            }
        };
    }

    function handleInboundMidiSignals(message) {
        const command = message.data & 0xf0;
        const note = message.data;
        const velocity = message.data;

        if (command === 0x90 && velocity > 0) {
            broadcastMidiToNodes(note, velocity);
        } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
            broadcastMidiToNodes(note, 0); 
        }
    }

    function broadcastMidiToNodes(note, velocity) {
        for (let id in window.modulesRegistry) {
            if (window.modulesRegistry[id]) {
                window.modulesRegistry[id].port.postMessage({
                    type: 'midiEvent',
                    note: note,
                    velocity: velocity
                });
            }
        }
        if (window.modulesRegistry && window.modulesRegistry['master']) {
            window.modulesRegistry['master'].port.postMessage({ type: 'midiEvent', note: note, velocity: velocity });
        }
        
        const display = document.getElementById('canvasTermHeaderTitle');
        if (display && velocity > 0) {
            display.innerText = `MIDI IN: NOTE [${note}] | HZ [${Math.round(440 * Math.pow(2, (note - 69) / 12))}]`;
        }
    }
})();

/* ==========================================================================
   🎛️ MODULE SPAWNER FACTORY ENGINES
   ========================================================================== */

document.getElementById('addModuleBtn').addEventListener('click', async () => {
    let nextId;
    if (window.availableIdsPool && window.availableIdsPool.length > 0) { 
        window.availableIdsPool.sort((a, b) => a - b); 
        nextId = window.availableIdsPool.shift(); 
    } else { 
        window.moduleCount = (window.moduleCount || 0) + 1; 
        nextId = window.moduleCount; 
    }
    if (typeof createModuleBox === 'function') createModuleBox(nextId); 
    if (typeof createModularNode === 'function') await createModularNode(nextId);
});

document.getElementById('addVstBtn').addEventListener('click', () => {
    let nextId;
    if (window.availableIdsPool && window.availableIdsPool.length > 0) { 
        window.availableIdsPool.sort((a, b) => a - b); 
        nextId = window.availableIdsPool.shift(); 
    } else { 
        window.moduleCount = (window.moduleCount || 0) + 1; 
        nextId = window.moduleCount; 
    }
    createVstModuleBox(nextId);
});

function createVstModuleBox(id) {
    const box = document.createElement('div');
    box.className = 'node-box'; box.id = `mod_${id}`;
    box.style.left = `80px`; box.style.top = `140px`;
    box.style.width = "180px";
    box.style.borderColor = "#ffcc00";

    box.innerHTML = `
        <div class="node-header" style="border-color:#ffcc00;"><span class="node-title-text" style="color:#ffcc00;">VST HOST #${id}</span></div>
        <div style="font-size:12px; text-align:center; margin-top:12px;">
            <button onclick="alert('To load native C++ binary .vst3/.dll files, Electron requires a native Node addon module wrapper path like node-vst-host compiled via node-gyp.')" style="font-size:12px!important; height:24px!important; border-color:#ffcc00!important; color:#ffcc00!important;">📁 LOAD .VST3</button>
        </div>
        <div class="ports-container" style="height: calc(100% - 65px);">
            <div class="inputs-column" style="top:32px;"><div><span class="port-dot" id="port-in-${id}-0" data-type="input" data-node="${id}" data-index="0"></span> in1</div></div>
            <div class="outputs-column" style="top:32px;"><div>out <span class="port-dot" id="port-out-${id}" data-type="output" data-node="${id}" data-index="0"></span></div></div>
        </div>
    `;
    if (typeof makeDraggable === 'function') makeDraggable(box); 
    if (window.cameraWorld) window.cameraWorld.appendChild(box); 
    if (typeof resizeCanvas === 'function') resizeCanvas();
}
/* ==========================================================================
   🕹️ SHARED WORKSPACE CORE CONFIGURATORS - PART 2
   ========================================================================== */

document.getElementById('gridSnapToggleBtn').addEventListener('click', () => {
    window.snapGridActive = !window.snapGridActive;
    const btn = document.getElementById('gridSnapToggleBtn');
    if (window.snapGridActive) { btn.innerText = "🔗 SNAP GRID: ON"; btn.style.borderColor = "var(--matrix-glow)"; btn.style.color = "var(--matrix-glow)"; }
    else { btn.innerText = "🔗 SNAP GRID: OFF"; btn.style.borderColor = "#555"; btn.style.color = "#555"; }
});

document.getElementById('gridSizeSelect').addEventListener('change', (e) => { window.snapGridSize = parseInt(e.target.value); });

document.getElementById('playPauseBtn').addEventListener('click', async () => {
    if (typeof initAudio === 'function') await initAudio();
    window.transportIsPlaying = !window.transportIsPlaying;
    const playBtn = document.getElementById('playPauseBtn');
    if (window.transportIsPlaying) { playBtn.innerText = "⏸ PAUSE"; playBtn.style.borderColor = "#ffcc00"; playBtn.style.color = "#ffcc00"; }
    else { playBtn.innerText = "▶ PLAY"; playBtn.style.borderColor = "var(--matrix-glow)"; playBtn.style.color = "var(--matrix-glow)"; }
    if (window.modulesRegistry && window.modulesRegistry['master']) window.modulesRegistry['master'].port.postMessage({ type: 'togglePlay', value: window.transportIsPlaying });
    for (let id in window.modulesRegistry) { if (window.modulesRegistry[id]) window.modulesRegistry[id].port.postMessage({ type: 'togglePlay', value: window.transportIsPlaying }); }
});

document.getElementById('stopBtn').addEventListener('click', async () => {
    if (!window.audioCtx) return;
    window.transportIsPlaying = false;
    const playBtn = document.getElementById('playPauseBtn');
    playBtn.innerText = "▶ PLAY"; playBtn.style.borderColor = "var(--matrix-glow)"; playBtn.style.color = "var(--matrix-glow)";
    document.getElementById('tCounterDisplay').value = 0;
    if (window.modulesRegistry && window.modulesRegistry['master']) window.modulesRegistry['master'].port.postMessage({ type: 'stopPlayback' });
    for (let id in window.modulesRegistry) { if (window.modulesRegistry[id]) window.modulesRegistry[id].port.postMessage({ type: 'stopPlayback' }); }
});

document.getElementById('monochromeColorSelect').addEventListener('change', (e) => {
    const rootStyle = document.documentElement.style;
    const chosenTheme = e.target.value;
    if (chosenTheme === 'matrix') {
        window.activeMonochromeColor = '#33ff33'; rootStyle.setProperty('--matrix-glow', '#33ff33'); rootStyle.setProperty('--ui-border', '#33ff33'); rootStyle.setProperty('--master-glow', '#ff00ff');
    } else if (chosenTheme === 'amber') {
        window.activeMonochromeColor = '#ffb000'; rootStyle.setProperty('--matrix-glow', '#ffb000'); rootStyle.setProperty('--ui-border', '#ffb000'); rootStyle.setProperty('--master-glow', '#ff5500');
    } else if (chosenTheme === 'grayscale') {
        window.activeMonochromeColor = '#ffffff'; rootStyle.setProperty('--matrix-glow', '#ffffff'); rootStyle.setProperty('--ui-border', '#888888'); rootStyle.setProperty('--master-glow', '#aaaaaa');
    }
});

document.getElementById('zoomLevelSelect').addEventListener('change', (e) => {
    window.currentZoom = parseFloat(e.target.value); 
    if (window.cameraWorld) window.cameraWorld.style.transformOrigin = "50% 50%"; 
    if (typeof updateCameraMatrix === 'function') updateCameraMatrix();
});

/* ==========================================================================
   ⌨️ NAVIGATION AND CABLE DROP VECTOR GRAPHICS ROUTINES
   ========================================================================== */
window.addEventListener('keydown', (e) => { if (e.code === 'Space' && !window.isSpacebarPressed) { window.isSpacebarPressed = true; if (window.workspace) window.workspace.style.cursor = 'grab'; } });
window.addEventListener('keyup', (e) => { if (e.code === 'Space') { window.isSpacebarPressed = false; window.isPanningMouseActive = false; if (window.workspace) window.workspace.style.cursor = 'default'; } });
if (window.workspace) {
    window.workspace.addEventListener('mousedown', (e) => { if (window.isSpacebarPressed && e.button === 0) { window.isPanningMouseActive = true; window.workspace.style.cursor = 'grabbing'; window.startPanMouseX = e.clientX - window.panOffsetX; window.startPanMouseY = e.clientY - window.panOffsetY; if (typeof updateCameraMatrix === 'function') updateCameraMatrix(); } });
}
window.addEventListener('mousemove', (e) => { if (window.isPanningMouseActive) { window.panOffsetX = e.clientX - window.startPanMouseX; window.panOffsetY = e.clientY - window.startPanMouseY; if (typeof updateCameraMatrix === 'function') updateCameraMatrix(); } });
window.addEventListener('mouseup', () => { if (window.isPanningMouseActive) { window.isPanningMouseActive = false; if (window.isSpacebarPressed && window.workspace) window.workspace.style.cursor = 'grab'; } });

if (window.workspace) {
    window.workspace.addEventListener('mousedown', (e) => {
        if (!e.target.classList.contains('port-dot') || e.button !== 0) return;
        const dot = e.target;
        window.activeWireSource = { type: dot.getAttribute('data-type'), node: dot.getAttribute('data-node'), index: parseInt(dot.getAttribute('data-index')) };
        dot.style.background = '#fff';
    });
}

window.addEventListener('mouseup', (e) => {
    if (!window.activeWireSource) return;
    const targetDot = e.target.classList.contains('port-dot') ? e.target : document.elementFromPoint(e.clientX, e.clientY);
    if (targetDot && targetDot.classList.contains('port-dot')) {
        const targetType = targetDot.getAttribute('data-type');
        const targetNode = targetDot.getAttribute('data-node');
        const targetIdx = parseInt(targetDot.getAttribute('data-index'));
        if (window.activeWireSource.node !== targetNode && window.activeWireSource.type !== targetType) {
            const outNode = window.activeWireSource.type === 'output' ? window.activeWireSource.node : targetNode;
            const inNode = window.activeWireSource.type === 'input' ? window.activeWireSource.node : targetNode;
            const inIdx = window.activeWireSource.type === 'input' ? window.activeWireSource.index : targetIdx;
            if (window.modulesRegistry && window.modulesRegistry[outNode] && window.modulesRegistry[inNode]) {
                window.modulesRegistry[outNode].connect(window.modulesRegistry[inNode], 0, inIdx);
                if (window.cableConnections) window.cableConnections.push({ fromNode: outNode, fromPort: 0, toNode: inNode, toPort: inIdx });
            }
        }
    }
    const anchorDot = window.activeWireSource.type === 'output' ? document.getElementById(`port-out-${window.activeWireSource.node}`) : document.getElementById(`port-in-${window.activeWireSource.node}-${window.activeWireSource.index}`);
    if (anchorDot) anchorDot.style.background = '#000';
    window.activeWireSource = null;
});
