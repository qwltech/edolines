document.addEventListener('DOMContentLoaded', () => {
    drawSVG();
});

const docWidth = 1700;
const docHeight = docWidth * 8 / 13;
const docMargin = 10;
const fontSize = 12;
const frameWidth = docWidth - 20 * docMargin;
const frameHeight = docHeight - 2 * docMargin;
const edoBlockHeight = 90;
const lineTextDistance = 5;

// redesign below table. we need to know:
// - either the rational expression p/q OR the prime factorization
// - color could be determined based on prime limit
// - name
//
// Storing the prime factorization is desirable.
// Octave reducing could be done automatically, reducing burden and from this
// we could deduce the colouration, and the number of factors of a given prime
// is given so we could use that to hide overly complex ratios.
//
//
// example:
// - the ratio 5/4 would be stored as 5, and the octave reducing
// by 2^-2 is assumed.
// - the ratio 15/14 could be stored as [0, 1, 1, -2], but since we are reducing octave automatically we can skip the 0 and store [1, 1, -2] to indicate 1 power of 3, 1 power of 5, and -2 powers of 7
//
// We can also generate the octave complement automatically, but then it is necessary to store both names.
// For example: 21/20 = 3 * 5^-1 * 7
// these factors would be stored as [1, -1, 1] and the object might look like
// { "factors": [1, -1, 1],
//   "name": "septimal minor semitone",
//   "complementName": "septimal acute major seventh"
// }
//
// This introduces a code readability issue. If we store the ratio as P and Q,
// we retain readability. The factors could be generated during an init step.
// To retain readability, let's write a redundant P and Q in the object.

const jiMap = [
    { "factors": [1], "name": "perfect fifth" },
    { "factors": [-1], "name": "perfect fourth" },
    { "factors": [2], "name": "pythagorean whole tone" },
    { "factors": [-2], "name": "pythagorean minor seventh" },
    { "factors": [0, 1], "name": "major third" },
    { "factors": [1, 1], "name": "major seventh" },
    { "factors": [-1, 1], "name": "major sixth" },
    { "factors": [0, -1], "name": "minor sixth" },
    { "factors": [1, -1], "name": "minor third" },
    { "factors": [-1, -1], "name": "diatonic semitone" },
    { "factors": [2, 1], "name": "small pental tritone" },
    { "factors": [2, -1], "name": "pental minor seventh" },
    { "factors": [-2, 1], "name": "pental whole tone" },
];

const jiTable = {
    "primes": [3, 5, 7, 11],
    "blockHeights": {3: 50, 5: 60, 7: 150, 11: 90},
    "colors": {3: "red", 5: "blue", 7: "#8c8", 11: "#fc8"},
    "3": [
        // [256, 243, "Pythagorean diatonic semitone"],
        [9, 8, "whole tone"],
        [4, 3, "perfect fourth"],
        [3, 2, "perfect fifth"],
        [16, 9, "minor seventh"],
        // [243, 128, "Pyth. major seventh"]
    ],
    "5": [
        [16, 15, "diatonic semitone"],
        [10, 9, "pental whole tone"],
        [6, 5, "minor third"],
        [5, 4, "major third"],
        [45, 32, "small pental tritone"],
        [64, 45, "large pental tritone"],
        [8, 5, "minor sixth"],
        [5, 3, "major sixth"],
        [9, 5, "pental minor seventh"],
        [15, 8, "major seventh"]
    ],
    // 7 limit
    // 0 0 1 = 7/4
    // 1 0 1 = 21/16
    // -1 0 1 = 7/6
    // 0 1 1 = 35/32
    // 0 -1 1 = 7/5
    // 1 1 1 = 105/64
    // 1 -1 1 = 21/20
    // -1 1 1 = 35/24
    // -1 -1 1 = 28/15
    // 0 0 -1 = 8/7
    // 1 0 -1 = 12/7
    // -1 0 -1 = 32/21
    // 0 1 -1 = 10/7
    // 0 -1 -1 = 64/35
    // 1 1 -1 = 15/14
    // 1 -1 -1 = 48/35
    // -1 1 -1 = 40/21
    // -1 -1 -1 = 128/105
    //
    "7": [
        [21, 20, "septimal minor semitone"],
        [15, 14, "septimal diatonic semitone"],
        // [35, 32, "septimal neutral second"],
        [8, 7, "supermajor second"],
        [7, 6, "subminor third"],
        // [128, 105, "septimal neutral third"],
        [9, 7, "supermajor third"],
        [21, 16, "septimal subfourth"],
        // [48, 35, "septimal superfourth"],
        [7, 5, "small septimal tritone"],
        [10, 7, "large septimal tritone"],
        // [35, 24, "septimal subfifth"],
        [32, 21, "septimal superfifth"],
        [14, 9, "subminor sixth"],
        // [105, 64, "septimal neutral sixth"],
        [12, 7, "supermajor sixth"],
        [7, 4, "harmonic seventh"],
        // [64, 35, "septimal neutral seventh"],
        [28, 15, "septimal grave major seventh"],
        [40, 21, "septimal acute major seventh"],
    ],
    "11": [
        [12, 11, "small undecimal neutral second"],
        [11, 10, "large undecimal neutral second"],
        [11, 9, "neutral third"],
        [14, 11, "undecimal major third"],
        [11, 8, "undecimal superfourth"],
        [16, 11, "undecimal subfifth"],
        [11, 7, "undecimal minor sixth"],
        [18, 11, "neutral sixth"],
        [20, 11, "small undecimal neutral seventh"],
        [11, 6, "large undecimal neutral seventh"]
    ]
};

function createElementNsSvg(name, atts) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', name);

    if (atts !== undefined)
        for (i in atts)
            e.setAttribute(atts[i][0], atts[i][1]);

    return e;
}

function drawSVG() {
    // Create the SVG element
    const svg = createElementNsSvg('svg', [
        ['width', docWidth],
        ['height', docHeight]]);

    drawFrame();
    var place = docMargin;
    drawJI();
    drawEdo(12);
    drawEdo(19);
    drawEdo(22);
    drawEdo(31);

    // Append the SVG to the container in the HTML
    document.getElementById('svgContainer').appendChild(svg);

    function drawFrame() {
        const frame = createElementNsSvg('rect', [
            ['x', docMargin],
            ['y', docMargin],
            ['width', frameWidth],
            ['height', frameHeight],
            ['fill', 'none'],
            ['stroke', '#000']
        ]);
        svg.appendChild(frame);
    }

    function drawJI() {
        for (var p in jiTable.primes) {
            var prime = jiTable.primes[p];
            console.log(prime);
            drawJISet(jiTable[prime],
                jiTable.colors[prime],
                jiTable.blockHeights[prime]);
        }
    }

    function drawJISet(intervals, color, specificBlockHeight) {
        for (var i = 0; i < intervals.length; i++) {
            var numer = intervals[i][0];
            var denom = intervals[i][1];
            var x = docMargin + frameWidth * Math.log2(numer / denom);
            var y = place + fontSize + 2 * fontSize * i % (specificBlockHeight - fontSize);
            const line = createElementNsSvg('line', [
                ['x1', x],
                ['y1', y],
                ['x2', x],
                ['y2', docHeight - docMargin],
                ['stroke', color]
            ]);
            svg.appendChild(line);

            // if (noText !== undefined) continue;

            const txt = createElementNsSvg('text', [
                ['x', x + lineTextDistance],
                ['y', y],
                ['fill', color]
            ]);
            txt.textContent = numer + "/" + denom;
            if (intervals[i][2] !== undefined)
                txt.textContent += " " + intervals[i][2];
            svg.appendChild(txt);
        }
        place += specificBlockHeight;
    }

    function drawEdo(edo) {
        const g = createElementNsSvg('g');
        const stepSize = frameWidth / edo;
        for (var i = 1; i < edo; i++) {
            var x = docMargin + i * stepSize;
            const line = createElementNsSvg('line', [
                ['x1', x],
                ['y1', place],
                ['x2', x],
                ['y2', place + edoBlockHeight],
                ['stroke', 'black'],
                ['stroke-width', 3]
            ]);
            g.appendChild(line);
            var y = place + fontSize + 1.6 * fontSize * i % (edoBlockHeight - fontSize);
            const txt = createElementNsSvg('text', [
                ['x', x + lineTextDistance],
                ['y', y]
            ]);
            txt.textContent = i + "\\" + edo;
            g.appendChild(txt);
        }
        svg.appendChild(g);

        place += edoBlockHeight;
    }

    function drawJISeparate() {
        drawJI('red', jiTable["3"]);
        drawJI('blue', jiTable["5"]);
        drawJI('green', jiTable["7"]);
        drawJI('orange', jiTable["11"]);
    }

    function drawJICondensed() {
        drawJI('red', jiTable["3"], "no text"); place -= blockHeight;
        drawJI('blue', jiTable["5"], "no text"); place -= blockHeight;
        drawJI('green', jiTable["7"], "no text"); place -= blockHeight;
        drawJI('orange', jiTable["11"], "no text");
    }
}
