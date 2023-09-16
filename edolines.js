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

// Storing the prime factorization is desirable, because it would be easier to
// group ratios according to their complexity.

// example 1: ratio 5/4
// - its factorization is 2^-2 * 3^0 * 5.
// - therefore its exponents are -2, 0, and 1. The -2 can be discarded and
//   calculated on init.
// - array would look like [0, 1]

// example 2: ratio 21/16
// - its factorization is 2^-4 * 3 * 5^0 * 7.
// - therefore its exponents are -4, 1, 0, and 1.
// - we would store the array [1, 0, 1] as the -4 can be
//   calculated automatically.
//
// example 3: ratio 21/20
// - its factorization is 2^-2 * 3 * 5^-1 * 7.
// - therefore its exponents are -2, 1, -1, and 1.
// these factors would be stored as [1, -1, 1] and the object might look like:
// { "factors": [1, -1, 1], "name": "septimal minor semitone" }
//

// For future use according to the above:

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
    // sorting method for complexity ranking (not for display):
    // first sort key: the sum of the absolute values of the exponents whose base is not 2.
    // second sort key: the numerator after 2^n normalization.
    // third sort key: the denominator after 2^n normalization.

    // 0 0 1 = 7/4. sum(abs(exponents)) = 1.
    // 0 0 -1 = 8/7. 
    // 0 -1 1 = 7/5. sum(abs(exponents)) = 2.
    // -1 0 1 = 7/6
    // 0 1 -1 = 10/7
    // 1 0 -1 = 12/7
    // 1 0 1 = 21/16
    // -1 0 -1 = 32/21
    // 0 1 1 = 35/32
    // 0 0 2 = 49/32 hmm should these be allowed? maybe change criteria
    // 0 -1 -1 = 64/35
    // 0 0 -2 = 64/49
    // 1 1 -1 = 15/14. sum(abs(exponents)) = 3.
    // 1 -1 1 = 21/20
    // -1 -1 1 = 28/15
    // -1 1 1 = 35/24
    // -1 1 -1 = 40/21
    // 1 -1 -1 = 48/35
    // 0 -1 2 = 49/40
    // -1 0 2 = 49/48 isn't that a comma?
    // 1 1 1 = 105/64
    // -1 -1 -1 = 128/105
    // 0 0 3 = 343/256 ridiculous... what use could this have?
    //
    // sorting method for display: by log2 of the ratio
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
    drawEdo(16);
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
}
