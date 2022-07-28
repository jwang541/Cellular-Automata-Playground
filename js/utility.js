//
// Various helper functions.
//


// Restricts the value of a number to [min, max]
function clamp(number, min, max) {
    return Math.max(min, Math.min(number, max));
}