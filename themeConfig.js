/**
 * 📟 MODULAR MATRIX SYNTHESIZER MASTER PREFERENCES VARIABLE CONFIGURATION ENGINE v3.0
 * 
 * Centralized variable registry matrix block controlling all pixel distance ratios, 
 * monochrome phosphor color preset profiles, absolute dimensional boundaries, and text string labels.
 * 
 * Tweak any integer step parameter value here, and your layout canvas will scale dynamically on load!
 */

const ThemeConfig = {
    // 🎨 MONOCHROMATIC phosphor SCREEN COLOR COATING MARKS
    colors: {
        matrixGreen: {
            glow: '#33ff33',
            dim: '#052205',
            uiBorder: '#33ff33',
            masterGlow: '#ff00ff',
            masterDim: '#220522'
        },
        vintageAmber: {
            glow: '#ffb000',
            dim: '#221100',
            uiBorder: '#ffb000',
            masterGlow: '#ff5500',
            masterDim: '#330a00'
        },
        crtGrayscale: {
            glow: '#ffffff',
            dim: '#1a1a1a',
            uiBorder: '#888888',
            masterGlow: '#aaaaaa',
            masterDim: '#222222'
        }
    },

    // 🧱 MECHANICAL CHASSIS & FACEPLATE BOX SPATIAL FOOTPRINTS
    dimensions: {
        // Standard generator element modules frame sizing scales
        moduleWidth: 180,           // Width footprint of standard hardware blocks in pixels
        moduleBaseHeight: 120,      // Compact default vertical profile height for 2 fixed ports

        // Central visual text editor overlay canvas panel dimensions
        editorWidth: 320,           // Default width profile sizing scale of code editor modules
        editorBaseHeight: 100,      // Baseline initialization height lock profile for line 1 of code
        editorLineGrowthStep: 20,   // Predictable linear integer pixel addition stride for every extra line typed
        editorZIndexActive: 100,    // High stack order layout lock forcing the open terminal cleanly over wires
        editorZIndexInactive: 6,    // Lowered inactive depth index clearing background collision masks

        // Viewport workspace bounding parameters
        workspaceMaxWidth: 2000,
        workspaceMaxHeight: 2000
    },

    // 🔌 ABSOLUTE GRAPH PORT SNAP GRID POSITION VECTORS
    // Measured in exact pixel offsets relative to parent module border frames
    ports: {
        // Left wall input ports columns tracking arrays
        inputLeftOffset: 10,        // Horizontal pixel distance shift from the left border edge
        inputTopOffset: 5,         // Vertical drop from the header line to space jacks below titles
        inputRowGapDistance: 10,    // Pure vertical clearance stride spacing gap between in1 and in2 rows
        portDotSize: 12,            // Backing scale footprint diameter size for wire jacking dots

        // Right wall output port channel triggers
        outputRightOffset: 10,      // Horizontal pixel distance shift from the right border edge
        outputTopOffset: 61,        // Absolute vertical row axis lock centering out ports inside 120px frames
        wireLineThickness: 3        // Line stroke radius thickness parameters for canvas trace wires
    },

    // 🔤 TYPOGRAPHY ENGINE FONTS & GLOW PARAMETERS
    typography: {
        fontFamily: "'VT323', monospace",
        baseFontSize: '20px',
        headerFontSize: '36px',
        moduleFontSize: '22px',
        renameMaxCharacterLimit: 12  // Equalized text length value limits across all form fields
    },

    // 📝 TEXT STRING REGISTRY TERMINAL INTERFACE MESSAGES
    strings: {
        appMainTitle: "MODULAR WORKSPACE v3.0",
        masterOutHeaderLabel: "MASTER OUT",
        contextEditExpressionRow: "⚙️ EDIT EXPRESSION",
        contextDeleteNodeRow: "❌ DELETE NODE",
        terminalHeaderPrefix: "EDIT CODE: MODULE #",
        terminalHeaderMaster: "EDIT CODE: MASTER OUT"
    }
};

// Handle bridge exposure routing across both Electron isolated processes and standard DOM environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeConfig;
} else {
    window.ThemeConfig = ThemeConfig;
}
