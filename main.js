/* ==========================================================================
   🕹️ RE-ALIGNED FRONTEND EVENT HUB & WEBMIDI SCROLLER MATRIX - PART A
   ========================================================================== */

// Tracks real-time cursor screen properties globally across the workspace canvas
window.addEventListener('mousemove', (e) => {
    mouseCurrentX = e.clientX; 
    mouseCurrentY = e.clientY;
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

        // 0x90 = Note On, 0x80 = Note Off
        if (command === 0x90 && velocity > 0) {
            broadcastMidiToNodes(note, velocity);
        } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
            broadcastMidiToNodes(note, 0); // 0 velocity maps a clean Note Off execution path
        }
    }

    function broadcastMidiToNodes(note, velocity) {
        // Dispatches structural messages globally across all compiled synthesizer worklets
        for (let id in modulesRegistry) {
            if (modulesRegistry[id]) {
                modulesRegistry[id].port.postMessage({
                    type: 'midiEvent',
                    note: note,
                    velocity: velocity
                });
            }
        }
        if (modulesRegistry['master']) {
            modulesRegistry['master'].port.postMessage({ type: 'midiEvent', note: note, velocity: velocity });
        }
        
        // Dynamic UI visual text engine notification updates
        const display = document.getElementById('canvasTermHeaderTitle');
        if (display && velocity > 0) {
            display.innerText = `MIDI IN: NOTE [${note}] | HZ [${Math.round(440 * Math.pow(2, (note - 69) / 12))}]`;
        }
    }
})();

/* ==========================================================================
   🎛️ MODULE SPAWNER FACTORY ENGINES
   ========================================================================== */

// ➕ SPAWN NODE: Standard basic block calculator card
document.getElementById('addModuleBtn').addEventListener('click', async () => {
    let nextId;
    if (availableIdsPool.length > 0) { availableIdsPool.sort((a, b) => a - b); nextId = availableIdsPool.shift(); }
    else { moduleCount++; nextId = moduleCount; }
    createModuleBox(nextId); 
    await createModularNode(nextId);
});

// 🎹 SPAWN VST: Instantiates an interactive synth instrument wrapper card
document.getElementById('addVstBtn').addEventListener('click', async () => {
    let nextId;
    if (availableIdsPool.length > 0) { availableIdsPool.sort((a, b) => a - b); nextId = availableIdsPool.shift(); }
    else { moduleCount++; nextId = moduleCount; }
    createVstModuleBox(nextId);
    await createModularNode(nextId); // Registers standard compute graphs under the hood
});

function createModuleBox(id) {
    const box = document.createElement('div');
    box.className = 'node-box'; box.id = `mod_${id}`;
    box.style.left = `50px`; box.style.top = `100px`;
    box.innerHTML = `
        <div class="node-header"><span class="node-title-text">MODULE #${id}</span></div>
        <div class="ports-container">
            <div class="inputs-column">
                <div><span class="port-dot" id="port-in-${id}-0" data-type="input" data-node="${id}" data-index="0"></span> in1</div>
                <div><span class="port-dot" id="port-in-${id}-1" data-type="input" data-node="${id}" data-index="1"></span> in2</div>
            </div>
            <div class="outputs-column"><div>out <span class="port-dot" id="port-out-${id}" data-type="output" data-node="${id}" data-index="0"></span></div></div>
        </div>
    `;
    makeDraggable(box); cameraWorld.appendChild(box); resizeCanvas();
}

/* 🎹 NEW VST WRAPPER INTERFACE GENERATOR */
function createVstModuleBox(id) {
    const box = document.createElement('div');
    box.className = 'node-box'; box.id = `mod_${id}`;
    box.style.left = `80px`; box.style.top = `140px`;
    box.style.width = "180px"; // Slightly widened frame for retro macro control toggles
    
    // Mount custom formula configurations right inside the constructor state parameters
    box.setAttribute('data-saved-code', "hz * t / 128");

    box.innerHTML = `
        <div class="node-header" style="border-color:#ffcc00;"><span class="node-title-text" style="color:#ffcc00;">VST WAVE #${id}</span></div>
        <div style="font-size:12px; text-align:center; margin-top:2px; color:#aaa;">[AUTO MIDI TUNED]</div>
        
        <!-- Retro visual micro selector tags mapping wave expressions -->
        <div style="display:flex; justify-content:space-around; padding:2px; margin-top:4px; font-size:11px;">
            <button class="vst-mode-btn" onclick="document.getElementById('canvasTermTextArea').value='(hz * t / 128) & 255'; document.getElementById('canvasTermTextArea').dispatchEvent(new Event('input'));" style="height:20px!important; padding:0 4px!important; font-size:11px!important;">SAW</button>
            <button class="vst-mode-btn" onclick="document.getElementById('canvasTermTextArea').value='(t * (hz/2) >> 5) | (t * hz >> 6)'; document.getElementById('canvasTermTextArea').dispatchEvent(new Event('input'));" style="height:20px!important; padding:0 4px!important; font-size:11px!important;">CHIP</button>
        </div>

        <div class="ports-container" style="height: calc(100% - 65px);">
            <div class="inputs-column" style="top:32px;">
                <div><span class="port-dot" id="port-in-${id}-0" data-type="input" data-node="${id}" data-index="0"></span> in1</div>
            </div>
            <div class="outputs-column" style="top:32px;">
                <div>out <span class="port-dot" id="port-out-${id}" data-type="output" data-node="${id}" data-index="0"></span></div>
            </div>
        </div>
    `;
    makeDraggable(box); cameraWorld.appendChild(box); resizeCanvas();
}
/* ==========================================================================
   🕹定期 RE-ALIGNED FRONTEND EVENT HUB & WEBMIDI SCROLLER MATRIX - PART B
   ========================================================================== */

// 🔗 SNAP GRID TOGGLE SYSTEM
document.getElementById('gridSnapToggleBtn').addEventListener('click', () => {
    snapGridActive = !snapGridActive;
    const btn = document.getElementById('gridSnapToggleBtn');
    if (snapGridActive) { btn.innerText = "🔗 SNAP GRID: ON"; btn.style.borderColor = "var(--matrix-glow)"; btn.style.color = "var(--matrix-glow)"; }
    else { btn.innerText = "🔗 SNAP GRID: OFF"; btn.style.borderColor = "#555"; btn.style.color = "#555"; }
});

document.getElementById('gridSizeSelect').addEventListener('change', (e) => { snapGridSize = parseInt(e.target.value); });

// ▶ PLAY / ⏸ PAUSE
document.getElementById('playPauseBtn').addEventListener('click', async () => {
    if (!audioCtx) await initAudio();
    transportIsPlaying = !transportIsPlaying;
    const playBtn = document.getElementById('playPauseBtn');
    if (transportIsPlaying) { playBtn.innerText = "⏸ PAUSE"; playBtn.style.borderColor = "#ffcc00"; playBtn.style.color = "#ffcc00"; }
    else { playBtn.innerText = "▶ PLAY"; playBtn.style.borderColor = "var(--matrix-glow)"; playBtn.style.color = "var(--matrix-glow)"; }
    if (modulesRegistry['master']) modulesRegistry['master'].port.postMessage({ type: 'togglePlay', value: transportIsPlaying });
    for (let id in modulesRegistry) { if (modulesRegistry[id]) modulesRegistry[id].port.postMessage({ type: 'togglePlay', value: transportIsPlaying }); }
});

// ⏹ STOP
document.getElementById('stopBtn').addEventListener('click', async () => {
    if (!audioCtx) return;
    transportIsPlaying = false;
    const playBtn = document.getElementById('playPauseBtn');
    playBtn.innerText = "▶ PLAY"; playBtn.style.borderColor = "var(--matrix-glow)"; playBtn.style.color = "var(--matrix-glow)";
    document.getElementById('tCounterDisplay').value = 0;
    if (modulesRegistry['master']) modulesRegistry['master'].port.postMessage({ type: 'stopPlayback' });
    for (let id in modulesRegistry) { if (modulesRegistry[id]) modulesRegistry[id].port.postMessage({ type: 'stopPlayback' }); }
});

// Theme Phosphor coating select triggers
document.getElementById('monochromeColorSelect').addEventListener('change', (e) => {
    const rootStyle = document.documentElement.style;
    const chosenTheme = e.target.value;
    if (chosenTheme === 'matrix') {
        activeMonochromeColor = '#33ff33'; rootStyle.setProperty('--matrix-glow', '#33ff33'); rootStyle.setProperty('--ui-border', '#33ff33'); rootStyle.setProperty('--master-glow', '#ff00ff');
    } else if (chosenTheme === 'amber') {
        activeMonochromeColor = '#ffb000'; rootStyle.setProperty('--matrix-glow', '#ffb000'); rootStyle.setProperty('--ui-border', '#ffb000'); rootStyle.setProperty('--master-glow', '#ff5500');
    } else if (chosenTheme === 'grayscale') {
        activeMonochromeColor = '#ffffff'; rootStyle.setProperty('--matrix-glow', '#ffffff'); rootStyle.setProperty('--ui-border', '#888888'); rootStyle.setProperty('--master-glow', '#aaaaaa');
    }
});

// Scaling adjustments
document.getElementById('zoomLevelSelect').addEventListener('change', (e) => {
    currentZoom = parseFloat(e.target.value); cameraWorld.style.transformOrigin = "50% 50%"; updateCameraMatrix();
});

/* ==========================================================================
   ⌨️ NAVIGATION AND CABLE DROP VECTOR GRAPHICS ROUTINES
   ========================================================================== */
window.addEventListener('keydown', (e) => { if (e.code === 'Space' && !isSpacebarPressed) { isSpacebarPressed = true; workspace.style.cursor = 'grab'; } });
window.addEventListener('keyup', (e) => { if (e.code === 'Space') { isSpacebarPressed = false; isPanningMouseActive = false; workspace.style.cursor = 'default'; } });
workspace.addEventListener('mousedown', (e) => { if (isSpacebarPressed && e.button === 0) { isPanningMouseActive = true; workspace.style.cursor = 'grabbing'; startPanMouseX = e.clientX - panOffsetX; startPanMouseY = e.clientY - panOffsetY; updateCameraMatrix(); } });
window.addEventListener('mousemove', (e) => { if (isPanningMouseActive) { panOffsetX = e.clientX - startPanMouseX; panOffsetY = e.clientY - startPanMouseY; updateCameraMatrix(); } });
window.addEventListener('mouseup', () => { if (isPanningMouseActive) { isPanningMouseActive = false; if (isSpacebarPressed) workspace.style.cursor = 'grab'; } });

workspace.addEventListener('mousedown', (e) => {
    if (!e.target.classList.contains('port-dot') || e.button !== 0) return;
    const dot = e.target;
    activeWireSource = { type: dot.getAttribute('data-type'), node: dot.getAttribute('data-node'), index: parseInt(dot.getAttribute('data-index')) };
    dot.style.background = '#fff';
});

window.addEventListener('mouseup', (e) => {
    if (!activeWireSource) return;
    const targetDot = e.target.classList.contains('port-dot') ? e.target : document.elementFromPoint(e.clientX, e.clientY);
    if (targetDot && targetDot.classList.contains('port-dot')) {
        const targetType = targetDot.getAttribute('data-type');
        const targetNode = targetDot.getAttribute('data-node');
        const targetIdx = parseInt(targetDot.getAttribute('data-index'));
        if (activeWireSource.node !== targetNode && activeWireSource.type !== targetType) {
            const outNode = activeWireSource.type === 'output' ? activeWireSource.node : targetNode;
            const inNode = activeWireSource.type === 'input' ? activeWireSource.node : targetNode;
            const inIdx = activeWireSource.type === 'input' ? activeWireSource.index : targetIdx;
            if (modulesRegistry[outNode] && modulesRegistry[inNode]) {
                modulesRegistry[outNode].connect(modulesRegistry[inNode], 0, inIdx);
                cableConnections.push({ fromNode: outNode, fromPort: 0, toNode: inNode, toPort: inIdx });
            }
        }
    }
    const anchorDot = activeWireSource.type === 'output' ? document.getElementById(`port-out-${activeWireSource.node}`) : document.getElementById(`port-in-${activeWireSource.node}-${activeWireSource.index}`);
    if (anchorDot) anchorDot.style.background = '#000';
    activeWireSource = null;
});

/* 🕹️ UNBREAKABLE REAL-TIME VIEWPORT DRAG HANDLER */
function makeDraggable(el) {
    el.onmousedown = (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.classList.contains('port-dot') || e.target.closest('#moduleContextMenu') || isSpacebarPressed || e.target.tagName === 'TEXTAREA' || e.target.id === 'canvasTermResizeHandle') return;
        if (e.target === workspace) return;
        if (e.target.tagName === 'INPUT') return; 
        
        document.getElementById('moduleContextMenu').style.display = 'none';
        e.preventDefault();
        
        currentlyDraggingElement = el;
        dragGrabX = (e.clientX / currentZoom) - panOffsetX - el.offsetLeft;
        dragGrabY = (e.clientY / currentZoom) - panOffsetY - el.offsetTop;
        
        document.onmouseup = () => { 
            currentlyDraggingElement = null; 
            document.onmouseup = null; 
            document.onmousemove = null; 
        };
        
        document.onmousemove = (ev) => {
            ev.preventDefault();
            updateDraggingModulePosition(ev.clientX, ev.preventDefault ? ev.clientY : ev.clientY);
        };
    };
}

function updateDraggingModulePosition(clientX, clientY) {
    if (!currentlyDraggingElement) return;
    
    let targetLeft = (clientX / currentZoom) - panOffsetX - dragGrabX;
    let targetTop = (clientY / currentZoom) - panOffsetY - dragGrabY;

    let maxTop = 1280 - currentlyDraggingElement.offsetHeight;  
    let maxLeft = 2560 - currentlyDraggingElement.offsetWidth;  

    if (targetTop < 5) targetTop = 5; if (targetTop > maxTop) targetTop = maxTop;
    if (targetLeft < 5) targetLeft = 5; if (targetLeft > maxLeft) targetLeft = maxLeft;

    if (snapGridActive) {
        targetTop = Math.round(targetTop / snapGridSize) * snapGridSize;
        targetLeft = Math.round(targetLeft / snapGridSize) * snapGridSize;
    }
    currentlyDraggingElement.style.top = targetTop + "px"; 
    currentlyDraggingElement.style.left = targetLeft + "px";
}

makeDraggable(document.getElementById('mod_master'));
makeDraggable(document.getElementById('canvasTerminalBox'));
