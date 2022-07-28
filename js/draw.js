//
// Defines the functions related to drawing the cellular automaton.
//
function initDraw(globals) {

    // Save a reference to the main canvas in global variables.
    globals.canvas = $("#canvas").get(0);

    // Returns the mouse's position relative to the position of the main canvas.
    function mousePos(event) {
        var rect = globals.canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) / (rect.right - rect.left) * globals.canvas.width,
            y: (event.clientY - rect.top) / (rect.bottom - rect.top) * globals.canvas.height
        };
    }

    // Clears the main canvas.
    function clear() {
        var ctx = globals.canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Draws a square grid onto the main canvas, with a sidelength of 
    // globals.cellSize.
    function grid() {
        var ctx = globals.canvas.getContext("2d");
        var w = globals.canvas.width;
        var h = globals.canvas.height;

        ctx.beginPath();
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = "f0f0f0";
        for (var x = 0; x <= w; x += globals.cellSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
        }
        for (var y = 0; y <= h; y += globals.cellSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
        }
        ctx.stroke();
    }

    // Draws the cellular automaton onto the main canvas, by drawing black 
    // squares where the cellular automaton has a live cell. Also draws a grid 
    // if enabled in globals.
    function cellularAutomaton() {
        clear();

        var ctx = globals.canvas.getContext("2d");

        if (globals.showGrid) globals.draw.grid();

        var dim = globals.cellularAutomaton.getDimensions();
        var size = globals.cellSize;
        for (var i = 0; i < dim.rows; i++) {
            for (var j = 0; j < dim.cols; j++) {
                if (globals.cellularAutomaton.at(i, j))
                    ctx.fillRect(j * size, i * size, size, size);
            }
        }
    }

    // Iterates the cellular automaton by one (1) generation, then draws it
    // onto the main canvas.
    function cellularAutomatonStep() {
        globals.cellularAutomaton.step();
        cellularAutomaton();
    }

    // Repeatedly interates cellular automaton by one (1) generation, then 
    // draws it onto the main canvas. The delay depends on globals.stepsPerSecond.
    function loop() {
        if (globals.playSimulation) cellularAutomatonStep();
        setTimeout(loop, 1000 / globals.stepsPerSecond);
    }



    // Begins the simulation & drawing loop.
    loop();



    return {
        mousePos: mousePos,
        clear: clear,
        grid: grid,
        cellularAutomaton: cellularAutomaton,
        cellularAutomatonStep: cellularAutomatonStep,
        loop: loop,
    }

}