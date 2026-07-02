/* ==========================================================================
   🕹️ RE-ALIGNED FRONTEND USER INTERFACE INTERACTION ENGINE - SECTION 1
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
        for (let input of inputs) { input.onmidimessage = handleInboundMidiSignals; }
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

        if (command === 0x90 && velocity > 0) { broadcastMidiToNodes(note, velocity); } 
        else if (command === 0x80 || (command === 0x90 && velocity === 0)) { broadcastMidiToNodes(note, 0); }
    }

    function broadcastMidiToNodes(note, velocity) {
        for (let id in modulesRegistry) {
            if (modulesRegistry[id]) { modulesRegistry[id].port.postMessage({ type: 'midiEvent', note: note, velocity: velocity }); }
        }
        if (modulesRegistry['master']) { modulesRegistry['master'].port.postMessage({ type: 'midiEvent', note: note, velocity: velocity }); }
        
        const display = document.getElementById('canvasTermHeaderTitle');
        if (display && velocity > 0) {
            display.innerText = `MIDI IN: NOTE [${note}] | HZ [${Math.round(440 * Math.pow(2, (note - 69) / 12))}]`;
        }
    }
})();

/* ==========================================================================
   🎛️ SPAWNER CONTROLLERS
   ========================================================================== */

document.getElementById('addModuleBtn').addEventListener('click', async () => {
    let nextId;
    if (availableIdsPool.length > 0) { availableIdsPool.sort((a, b) => a - b); nextId = availableIdsPool.shift(); }
    else { moduleCount++; nextId = moduleCount; }
    createModuleBox(nextId); 
    await createModularNode(nextId);
});

document.getElementById('addVstBtn').addEventListener('click', () => {
    let nextId;
    if (availableIdsPool.length > 0) { availableIdsPool.sort((a, b) => a - b); nextId = availableIdsPool.shift(); }
    else { moduleCount++; nextId = moduleCount; }
    createVstModuleBox(nextId);
});

function createVstModuleBox(id) {
    const box = document.createElement('div');
    box.className = 'node-box'; box.id = `mod_${id}`;
    box.style.left = `80px`; box.style.top = `140px`;
    box.style.width = "180px";
    box.style.borderColor = "#ffcc00";

    // Re-aligned custom class-based selectors on elements so cable lookups connect precisely
    box.innerHTML = `
        <div class="node-header" style="border-color:#ffcc00;"><span class="node-title-text" style="color:#ffcc00;">VST HOST #${id}</span></div>
        <div style="font-size:12px; text-align:center; margin-top:12px; pointer-events: auto;">
            <button class="vst-load-trigger-btn" onclick="alert('To load native C++ binary .vst3/.dll files, Electron requires a native Node addon module wrapper path like node-vst-host compiled via node-gyp.')" style="font-size:12px!important; height:24px!important; border-color:#ffcc00!important; color:#ffcc00!important; pointer-events:auto!important;">📁 LOAD .VST3</button>
        </div>
        <div class="ports-container" style="height: calc(100% - 65px);">
            <div class="inputs-column" style="top:49px;">
                <div><span class="port-dot" id="port-in-${id}-0" data-type="input" data-node="${id}" data-index="0"></span> in1</div>
            </div>
            <div class="outputs-column" style="top:49px;">
                <div>out <span class="port-dot" id="port-out-${id}" data-type="output" data-node="${id}" data-index="0"></span></div>
            </div>
        </div>
    `;
    makeDraggable(box); 
    if (cameraWorld) cameraWorld.appendChild(box); 
    if (typeof resizeCanvas === 'function') resizeCanvas();
}
/* ==========================================================================
   🕹️ RE-ALIGNED FRONTEND USER INTERFACE INTERACTION ENGINE - SECTION 2
   ========================================================================== */

document.getElementById('gridSnapToggleBtn').addEventListener('click', () => {
    snapGridActive = !snapGridActive;
    const btn = document.getElementById('gridSnapToggleBtn');
    if (snapGridActive) { btn.innerText = "🔗 SNAP GRID: ON"; btn.style.borderColor = "var(--matrix-glow)"; btn.style.color = "var(--matrix-glow)"; }
    else { btn.innerText = "🔗 SNAP GRID: OFF"; btn.style.borderColor = "#555"; btn.style.color = "#555"; }
});

document.getElementById('gridSizeSelect').addEventListener('change', (e) => { snapGridSize = parseInt(e.target.value); });

document.getElementById('playPauseBtn').addEventListener('click', async () => {
    if (typeof initAudio === 'function') await initAudio();
    transportIsPlaying = !transportIsPlaying;
    const playBtn = document.getElementById('playPauseBtn');
    if (transportIsPlaying) { playBtn.innerText = "⏸ PAUSE"; playBtn.style.borderColor = "#ffcc00"; playBtn.style.color = "#ffcc00"; }
    else { playBtn.innerText = "▶ PLAY"; playBtn.style.borderColor = "var(--matrix-glow)"; playBtn.style.color = "var(--matrix-glow)"; }
    if (modulesRegistry && modulesRegistry['master']) modulesRegistry['master'].port.postMessage({ type: 'togglePlay', value: transportIsPlaying });
    for (let id in modulesRegistry) { if (modulesRegistry[id]) modulesRegistry[id].port.postMessage({ type: 'togglePlay', value: transportIsPlaying }); }
});

document.getElementById('stopBtn').addEventListener('click', async () => {
    if (!audioCtx) return;
    transportIsPlaying = false;
    const playBtn = document.getElementById('playPauseBtn');
    playBtn.innerText = "▶ PLAY"; playBtn.style.borderColor = "var(--matrix-glow)"; playBtn.style.color = "var(--matrix-glow)";
    document.getElementById('tCounterDisplay').value = 0;
    if (modulesRegistry && modulesRegistry['master']) modulesRegistry['master'].port.postMessage({ type: 'stopPlayback' });
    for (let id in modulesRegistry) { if (modulesRegistry[id]) modulesRegistry[id].port.postMessage({ type: 'stopPlayback' }); }
});

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

document.getElementById('zoomLevelSelect').addEventListener('change', (e) => {
    currentZoom = parseFloat(e.target.value); 
    if (cameraWorld) cameraWorld.style.transformOrigin = "50% 50%"; 
    if (typeof updateCameraMatrix === 'function') updateCameraMatrix();
});

/* ==========================================================================
   ⌨️ NAVIGATION AND CABLE DROP INTERACTION HOOKS
   ========================================================================== */
window.addEventListener('keydown', (e) => { if (e.code === 'Space' && !isSpacebarPressed) { isSpacebarPressed = true; if (workspace) workspace.style.cursor = 'grab'; } });
window.addEventListener('keyup', (e) => { if (e.code === 'Space') { isSpacebarPressed = false; isPanningMouseActive = false; if (workspace) workspace.style.cursor = 'default'; } });
if (workspace) {
    workspace.addEventListener('mousedown', (e) => { if (isSpacebarPressed && e.button === 0) { isPanningMouseActive = true; workspace.style.cursor = 'grabbing'; startPanMouseX = e.clientX - panOffsetX; startPanMouseY = e.clientY - panOffsetY; if (typeof updateCameraMatrix === 'function') updateCameraMatrix(); } });
}
window.addEventListener('mousemove', (e) => { if (isPanningMouseActive) { panOffsetX = e.clientX - startPanMouseX; panOffsetY = e.clientY - startPanMouseY; if (typeof updateCameraMatrix === 'function') updateCameraMatrix(); } });
window.addEventListener('mouseup', () => { if (isPanningMouseActive) { isPanningMouseActive = false; if (isSpacebarPressed && workspace) workspace.style.cursor = 'grab'; } });

if (workspace) {
    workspace.addEventListener('mousedown', (e) => {
        if (!e.target.classList.contains('port-dot') || e.button !== 0) return;
        const dot = e.target;
        // Supports flexible multi-output channel grids and direct strings lookup parsing
        let indexAttribute = dot.getAttribute('data-index');
        let parsedIndexValue = indexAttribute ? parseInt(indexAttribute) : 0;
        activeWireSource = { type: dot.getAttribute('data-type'), node: dot.getAttribute('data-node'), index: parsedIndexValue };
        dot.style.background = '#fff';
    });
}

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
            
            if (modulesRegistry && modulesRegistry[outNode] && modulesRegistry[inNode]) {
                modulesRegistry[outNode].connect(modulesRegistry[inNode], 0, inIdx);
                cableConnections.push({ fromNode: outNode, fromPort: 0, toNode: inNode, toPort: inIdx });
            }
        }
    }
    const anchorDot = activeWireSource.type === 'output' ? 
        (document.getElementById(`port-out-${activeWireSource.node}-${activeWireSource.index}`) || document.getElementById(`port-out-${activeWireSource.node}`)) : 
        document.getElementById(`port-in-${activeWireSource.node}-${activeWireSource.index}`);
    if (anchorDot) anchorDot.style.background = '#000';
    activeWireSource = null;
});

/* 🕹️ UNBREAKABLE DRAG ENGINE INTERACTION OVERRIDES
   - FIX: Explicit form exceptions allow click triggers to pass natively straight into inputs! */
function makeDraggable(el) {
    el.onmousedown = (e) => {
        // Excludes interactions entirely if user hits a selection list drop, textarea field or nested click button
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA' || e.target.classList.contains('port-dot') || e.target.closest('#moduleContextMenu') || isSpacebarPressed || e.target.id === 'canvasTermResizeHandle' || e.target.classList.contains('vst-load-trigger-btn')) return;
        if (e.target === workspace || e.target.tagName === 'INPUT') return; 
        
        const menu = document.getElementById('moduleContextMenu');
        if (menu) menu.style.display = 'none';
        e.preventDefault();
        
        currentlyDraggingElement = el;
        dragGrabX = (e.clientX / currentZoom) - panOffsetX - el.offsetLeft;
        dragGrabY = (e.clientY / currentZoom) - panOffsetY - el.offsetTop;
        
        document.onmouseup = () => { currentlyDraggingElement = null; document.onmouseup = null; document.onmousemove = null; };
        document.onmousemove = (ev) => { ev.preventDefault(); updateDraggingModulePosition(ev.clientX, ev.clientY); };
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
    currentlyDraggingElement.style.top = targetTop + "px"; currentlyDraggingElement.style.left = targetLeft + "px";
}

if (document.getElementById('mod_master')) makeDraggable(document.getElementById('mod_master'));
if (document.getElementById('canvasTerminalBox')) makeDraggable(document.getElementById('canvasTerminalBox'));
