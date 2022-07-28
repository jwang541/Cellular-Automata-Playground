
var globals = {};

$(function () {

    globals = initGlobals();
    globals.cellularAutomaton = initCellularAutomaton(globals);
    globals.draw = initDraw(globals);
    globals.controls = initControls(globals);

});

