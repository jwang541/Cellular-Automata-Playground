//
// Adds event triggers to the HTML elements so the user can interact with the 
// board, modify the simulation settings, and modify the playback settings.
// 
function initControls(globals) {

    // On click, gets the mouse position relative to the main canvas and
    // toggles the state of the cell at the corresponding position in the
    // cellular automaton.
    $("#canvas").click(function () {
        var pos = globals.draw.mousePos(event);
        var row = Math.floor(pos.y / globals.cellSize);
        var col = Math.floor(pos.x / globals.cellSize);

        globals.cellularAutomaton.toggle(row, col);
        globals.draw.clear();
        globals.draw.cellularAutomaton();
    });

    // On change, enables/disables the transition rule input fields based on
    // the value in the dropdown menu. Also updates the background colors of
    // the fields accordingly.
    $("#rule-select").change(function () {
        var input1 = $("#alive-alive");
        var input2 = $("#dead-alive");
        if (this.value == "custom") {
            input1.prop("disabled", false);
            input2.prop("disabled", false);
            input1.css("background-color", "#ffffff");
            input2.css("background-color", "#ffffff");
        } else {
            switch (this.value) {
                case "conway":
                    input1.val("alive(neighbors(1)) in set(2, 3)");
                    input2.val("alive(neighbors(1)) = 3");
                    break;
                case "mazectric":
                    input1.val("alive(neighbors(1)) in set(1, 2, 3, 4)");
                    input2.val("alive(neighbors(1)) = 3");
                    break;
                case "replicator":
                    input1.val("alive(neighbors(1)) in set(1, 3, 5, 7)");
                    input2.val("alive(neighbors(1)) in set(1, 3, 5, 7)");
                    break;
                case "seeds":
                    input1.val("false");
                    input2.val("alive(neighbors(1)) = 2");
                    break;
                case "downwards":
                    input1.val("alive(set(-1, 0)) = 1");
                    input2.val("alive(set(-1, 0)) = 1");
                    break;
            }
            input1.prop("disabled", true);
            input2.prop("disabled", true);
            input1.css("background-color", "#f7f7f7");
            input2.css("background-color", "#f7f7f7");
        }
    });

    // Initializes the values of the board dimensions input fields.
    $("#board-rows").prop("value", globals.cellularAutomaton.getDimensions().rows);
    $("#board-columns").prop("value", globals.cellularAutomaton.getDimensions().cols);

    // On click, updates the following properties of the cellular automaton:
    // 1.) Transition rules
    // 2.) Board dimentions (rows & columns)
    // 3.) Topology (bounded/wrapped)
    // If the transition rules are invalid, then instead of updating the 
    // cellular automaton, will highlight the invalid rules in red.
    $("#update-configuration").click(function () {
        var ruleInput1 = $("#alive-alive");
        var ruleInput2 = $("#dead-alive");
        var source1 = ruleInput1.prop("value");
        var source2 = ruleInput2.prop("value");

        // Safely tests if source1 and source2 can be interpreted as valid
        // abstract syntax trees.
        var valid = true;
        var valid1 = new AST(source1, globals.cellularAutomaton.getLibrary()).valid();
        var valid2 = new AST(source2, globals.cellularAutomaton.getLibrary()).valid();

        // If either source1 or source2 fails, then highlight their
        // corresponding input field in red and exit the function.
        // Otherwise, update the transition rules in globals.cellularAutomaton.
        if (!valid1) {
            ruleInput1.css("background-color", "#ffcccb");
            valid = false;
        }
        if (!valid2) {
            ruleInput2.css("background-color", "#ffcccb");
            valid = false;
        }
        if (valid) {
            if ($("#rule-select").prop("value") == "custom") {
                ruleInput1.css("background-color", "#ffffff");
                ruleInput2.css("background-color", "#ffffff");
            } else {
                ruleInput1.css("background-color", "#f7f7f7");
                ruleInput2.css("background-color", "#f7f7f7");
            }
            globals.cellularAutomaton.setRules(
                source1,
                source2
            );
        }
        else {
            return;
        }

        // Updates the topology of globals.cellularAutomaton.
        var topology = $("input[name='topology']:checked").val();
        globals.cellularAutomaton.setWrap(topology == "wrapped");

        // Reads the new row count and clamps it to a min and max.
        var rowsInput = $("#board-rows");
        var rows = Number(rowsInput.prop("value"));
        if (rows.isNaN) rows = 10;
        else rows = clamp(rows, Number(rowsInput.prop("min")), Number(rowsInput.prop("max")));
        rowsInput.prop("value", rows);

        // Reads the new column count and clamps it to a min and max.
        var colsInput = $("#board-columns");
        var cols = Number(colsInput.prop("value"));
        if (cols.isNaN) cols = 10;
        else cols = clamp(cols, Number(colsInput.prop("min")), Number(colsInput.prop("max")));
        colsInput.prop("value", cols);

        // Resizes the board in globals.cellularAutomaton based on the new
        // rows and columns.
        globals.cellularAutomaton.resize(rows, cols);

        // Resizes the main canvas to accomodate the new board size.
        globals.canvas.width = globals.cellSize * globals.cellularAutomaton.getDimensions().cols;
        globals.canvas.height = globals.cellSize * globals.cellularAutomaton.getDimensions().rows;

        // Clears the main canvas and draws the cellular automaton.
        globals.draw.clear();
        globals.draw.cellularAutomaton();
    });

    // On click, toggles the auto-play of the cellular automaton.
    $("#play-simulation").click(function () {
        this.textContent = (globals.playSimulation) ? "Play" : "Pause";
        globals.playSimulation = !globals.playSimulation;
    });

    // On click, iterates the cellular automaton by 1 generation,
    // then redraws the cellular automaton onto the main canvas.
    $("#step-simulation").click(function () {
        if (!globals.playSimulation) globals.draw.cellularAutomatonStep();
    });

    // On change, sets the playback speed (in generations/second) of the 
    // draw.loop(). Also synchronizes the value in the numerical input.
    $("#speed-slider").change(function () {
        $("#speed-input").prop("value", this.value);
        globals.stepsPerSecond = this.value;
    });

    // On change, sets the playback speed (in generations/second) of the 
    // draw.loop(). Also synchronizes the value in the slider input.
    $("#speed-input").change(function () {
        var speed = Number(this.value);
        if (isNaN(speed)) speed = globals.defaultStepsPerSecond;
        else speed = clamp(speed, Number(this.min), Number(this.max));
        this.value = speed;
        $("#speed-slider").prop("value", speed);
        globals.stepsPerSecond = speed;
    });

    // On click, toggles grid visibility when drawing the cellular automaton.
    // Also redraws the cellular automaton.
    $("#grid-visible").click(function () {
        this.textContent = (globals.showGrid) ? "Show grid" : "Hide grid";
        globals.showGrid = !globals.showGrid;
        globals.draw.clear();
        globals.draw.cellularAutomaton();
    });

    // On click, sets every cell in the cellular automaton to false.
    // Then, clears the main canvas and draws the cellular automaton.
    $("#blank-board").click(function () {
        globals.cellularAutomaton.clearState();
        globals.draw.clear();
        globals.draw.cellularAutomaton();
    });

    // On change, sets the value of globals.randomBoardProbability to the value
    // in the input field. Also clamps the input value to a min and max.
    $("#random-board-probability").change(function () {
        var prob = Number(this.value);
        if (isNaN(prob)) prob = global.defaultRandomBoardProbability;
        else prob = clamp(prob, Number(this.min), Number(this.max));
        globals.randomBoardProbability = prob;
        this.value = prob;
    });

    // On click, randomizes the board of the automaton according to
    // globals.randomBoardProbability.
    $("#random-board").click(function () {
        globals.cellularAutomaton.randomizeState(globals.randomBoardProbability);
        globals.draw.clear();
        globals.draw.cellularAutomaton();
    });


    return {

    }
}
