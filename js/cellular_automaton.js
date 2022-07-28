//
// Defines a cellular automaton and associated functions.
// 
function initCellularAutomaton(globals) {
    var rows = globals.boardRows;
    var cols = globals.boardCols;

    // 2D array holding the value of every cell in the board.
    var state = Array(rows);
    for (var i = 0; i < rows; i++) { state[i] = Array(cols).fill(false); }

    // Determines the topology of the board (wrapped or bounded).
    var wrap = false;

    // A collection of AST functions associated with the cellular automaton.
    // When the two (2) transition rules are evaluated, the AST evaluater will
    // use the definitions found in this collection.
    const library = {
        binaryOperators: {
            "=": function (args) {
                var arg1 = args[0];
                var arg2 = args[1];
                return (arg1 === arg2);
            },
            "+": function (args) {
                var num1 = args[0];
                var num2 = args[1];
                return num1 + num2;
            },
            "-": function (args) {
                var num1 = args[0];
                var num2 = args[1];
                return num1 - num2;
            },
            "union": function (args) {
                var set1 = args[0];
                var set2 = args[1];
                return set1.concat(set2);
            },
            "in": function (args) {
                var val = args[0];
                var set = args[1];
                for (var i = 0; i < set.length; i++) {
                    if (set[i] == val) return true;
                }
                return false;
            },
            "and": function (args) {
                var bool1 = args[0];
                var bool2 = args[1];
                return bool1 && bool2;
            },
            "or": function (args) {
                var bool1 = args[0];
                var bool2 = args[1];
                return bool1 || bool2;
            },
        },
        unaryOperators: {
            "not": function (args) {
                var bool = args[0];
                return !bool;
            },
            "!": function (args) {
                var bool = args[0];
                return !bool;
            }
        },
        functions: {
            "neighbors": function (args) {
                var neighbors = [];
                for (var i = 0; i < args.length; i++) {
                    var dist = args[i];
                    if (dist == 0) neighbors.push(...[0, 0]);
                    else {
                        for (var x = -dist; x <= dist; x++) {
                            neighbors.push(...[x, -dist]);
                            neighbors.push(...[x, dist]);
                        }
                        for (var y = -dist + 1; y <= dist - 1; y++) {
                            neighbors.push(...[-dist, y]);
                            neighbors.push(...[dist, y]);
                        }
                    }
                }
                return neighbors;
            },
            "set": function (args) {
                var set = [];
                for (var i = 0; i < args.length; i++) {
                    set.push(args[i]);
                }
                return set;
            },
            "interval": function (args) {
                var min = args[0];
                var max = args[1];
                var interval = [];
                for (var i = min; i <= max; i++) {
                    interval.push(i);
                }
                return interval;
            },
            "alive": (args) => {
                var set = args[0];
                var count = 0;
                for (var i = 0; i < set.length; i += 2) {
                    var x = set[i] + astRow;
                    var y = set[i + 1] + astCol;
                    if (at(x, y)) {
                        count++;
                    }
                }
                return count;
            },
        },
    };

    // These describe the value of the current absolute cell position, which 
    // the AST functions in library use to evaluate relative cell positions.
    var astRow = 0;
    var astCol = 0;

    // birthRule: Dead → alive (birth) transition condition.
    // survivalRule: Alive → alive (survival) transition condition.
    var birthRule = new AST(globals.birthSource, library);
    var survivalRule = new AST(globals.survivalSource, library);

    // These two (2) functions get and modify the dimensions of the board.
    function getDimensions() {
        return { rows: rows, cols: cols };
    }
    function resize(newRows, newCols) {
        var newState = Array(newRows);
        for (var i = 0; i < newRows; i++) { newState[i] = Array(newCols).fill(false); }

        // If the board is expanded, added cells default to dead (false). If 
        // the board is shrunk, then the cells on one side are cut.
        for (var i = 0; i < Math.min(rows, newRows); i++) {
            for (var j = 0; j < Math.min(cols, newCols); j++) {
                newState[i][j] = state[i][j];
            }
        }

        rows = newRows;
        cols = newCols;
        state = newState;
    }

    // These two (2) functions get and modify the topology of the board.
    function getWrap() { return wrap; }
    function setWrap(w) { wrap = w; }

    // These three (3) functions get and modify the value of a specific cell.
    function at(x, y) {
        if (wrap) {
            x = ((x % rows) + rows) % rows;
            y = ((y % cols) + cols) % cols;
            return state[x][y];
        }
        else {
            if (x < 0 || y < 0 || x >= rows || y >= cols) return false;
            else return state[x][y];
        }
    }
    function set(x, y, val) {
        if (x < 0 || y < 0 || x >= rows || y >= cols) return;
        state[x][y] = val;
    }
    function toggle(x, y) {
        if (x < 0 || y < 0 || x >= rows || y >= cols) return;
        state[x][y] = !state[x][y];
    }

    // Iterates the cellular automaton by one (1) generation. All cells have their
    // value in the new generation determined by the two (2) transition rules.
    function step() {
        var newState = Array(rows);
        for (var i = 0; i < state.length; i++) { newState[i] = state[i].slice(); }

        for (var i = 0; i < rows; i++) {
            for (var j = 0; j < cols; j++) {
                // Sets the value of the current absolute cell position, which
                // the AST functions use to evaluate relative cell positions.
                astRow = i;
                astCol = j;

                // If the cell is alive, its state in the next generation will 
                // be determined by the survivalRule (alive → alive transition). 
                if (at(i, j)) {
                    if (survivalRule.evaluate()) newState[i][j] = true;
                    else newState[i][j] = false;
                }
                // If the cell is dead, its state in the next generation will
                // be determined by the birthRule (dead → alive transition).
                else {
                    if (birthRule.evaluate()) newState[i][j] = true;
                    else newState[i][j] = false;
                }
            }
        }

        state = newState;
    }

    // Sets the two (2) transition rules based on two (2) strings.
    function setRules(survivalSource, birthSource) {
        survivalRule = new AST(survivalSource, library);
        birthRule = new AST(birthSource, library);
    }

    // Returns the AST functions associated with cellularAutomaton.
    function getLibrary() { return library; }

    // Sets the value of every cell in the board to false.
    function clearState() {
        state = Array(rows);
        for (var i = 0; i < rows; i++) { state[i] = Array(cols).fill(false); }
    }

    // Randomizes the value of every cell in the board, according to a given
    // probability value.
    function randomizeState(p) {
        for (var i = 0; i < rows; i++) {
            for (var j = 0; j < cols; j++) {
                state[i][j] = (Math.random() < p);
            }
        }
    }



    // Initializes the cellular automaton with a randomized state.
    randomizeState(0.25);

    return {
        at: at,
        set: set,
        toggle: toggle,

        getDimensions: getDimensions,
        resize: resize,

        getWrap: getWrap,
        setWrap: setWrap,

        setRules: setRules,
        getLibrary: getLibrary,

        step: step,
        clearState: clearState,
        randomizeState: randomizeState,
    }
}
