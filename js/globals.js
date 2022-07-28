
//
// Represents globally shared attributes for the webapp.
//
function initGlobals() {
    var _globals = {
        boardRows: 50,
        boardCols: 100,

        randomBoardProbability: 0.25,
        defaultRandomBoardProbability: 0.25,

        birthSource: "alive(neighbors(1)) = 3",
        survivalSource: "alive(neighbors(1)) in set(2, 3)",

        playSimulation: true,
        stepsPerSecond: 1,
        defaultStepsPerSecond: 1,

        cellSize: 10,
        showGrid: false,
    }; 

    return _globals;
}
