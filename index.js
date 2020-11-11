const fs = require('fs');
const path = require('path');

class Point {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
}

let firstPolygon = [];
let secondPolygon = [];
let invSecondPolygon = [];

const getFileData = (p) => {
    let data = fs.readFileSync(p, 'utf-8');

    const lines = data.split(/\r\n|\r|\n/);

    const n = parseInt(lines[0][0]);
    const m = parseInt(lines[0][2]);

    let i = 1; // Current index of line

    const addPoint = (lineWithCoords, polygon, k) => {
        const coords = lineWithCoords.split(' ');
        const xCoord = parseInt(coords[0]);
        const yCoord = parseInt(coords[1]);
        (k === 0) ? polygon.push(new Point(xCoord, yCoord)) : polygon.push(new Point(-xCoord, -yCoord))
    }

    for (i; i <= n; i++) {
        addPoint(lines[i], firstPolygon, 0);
    }

    for (i; i <= n + m; i++) {
        addPoint(lines[i], secondPolygon, 0);
        addPoint(lines[i], invSecondPolygon, 1);
    }

    const polygons = {
        firstPolygon,
        invSecondPolygon
    };

    return polygons;

};

// Notice that secondPolygon is the invPolygon 
const getMinkSum = (polygons) => {
    let { firstPolygon, invSecondPolygon } = polygons;
    const n = firstPolygon.length;
    const m = invSecondPolygon.length;
    let checkedPoints1 = new Array(n + m);
    let checkedPoints2 = new Array(n + m);

    let j = function leftBottomPointIndex(polygon) {
        let resPoint = new Point(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
        let index = 0;
        for (let i = 0; i < polygon.length; i++) {
            let point = polygon[i];
            if ((point.y < resPoint.y) || (point.y == resPoint.y && point.x < resPoint.x)) {
                resPoint = Object.assign(new Point, point);
                index = i;
            }
        }
        return index;
    }(invSecondPolygon);

    let i = 0;

    firstPolygon.push(new Point(firstPolygon[0].x, firstPolygon[0].y));
    invSecondPolygon.push(new Point(invSecondPolygon[0].x, invSecondPolygon[0].y));

    let minkSum = [];
    minkSum.push({
        point: new Point(firstPolygon[0].x + invSecondPolygon[j].x, firstPolygon[0].y + invSecondPolygon[j].y),
        top1: 0,
        top2: j % invSecondPolygon.length
    });

    const addPoint = (point1, point2, ind1, ind2) => {
        len = minkSum.length;
        minkSum.push({
            point: new Point(minkSum[len - 1].point.x + (point2.x - point1.x), minkSum[len - 1].point.y + (point2.y - point1.y)),
            top1: ind1 % (firstPolygon.length - 1),
            top2: ind2 % (invSecondPolygon.length - 1)
        });
    };

    while (!(checkedPoints1[i] && checkedPoints2[j])) {
        if (i == n) { i = 0; }
        if (j == m) { j = 0; }
        if (checkedPoints1[i] || !checkedPoints2[j] &&
            (firstPolygon[i + 1].x - firstPolygon[i].x) * (invSecondPolygon[j + 1].y - invSecondPolygon[j].y) -
            (firstPolygon[i + 1].y - firstPolygon[i].y) * (invSecondPolygon[j + 1].x - invSecondPolygon[j].x) < 0) {
            addPoint(invSecondPolygon[j], invSecondPolygon[j + 1], i, j + 1);
            checkedPoints2[j] = true;
            j++;
        } else {
            addPoint(firstPolygon[i], firstPolygon[i + 1], i + 1, j);
            checkedPoints1[i] = true;
            i++;
        }
    }

    return minkSum;
};

const getDistance = (minkSum) => {
    const zVectMult = (point1, point2, point3) => {
        return (point2.x - point1.x) * (point3.y - point2.y) - (point2.y - point1.y) * (point3.x - point2.x);
    }

    const nullPoint = new Point(0, 0);
    let resInfo = {
        distance: Number.MAX_VALUE,
        top1: -1,
        top2: -1
    };

    if (!(zVectMult(minkSum[0].point, minkSum[1].point, nullPoint) < 0 ||
        zVectMult(minkSum[0].point, minkSum[minkSum.length - 1].point, nullPoint) > 0)) {
        let left = 1;
        let right = minkSum.length - 1;
        let middle;

        while (right - left > 1) {
            middle = parseInt((right + left) / 2);
            if (zVectMult(minkSum[0].point, minkSum[middle].point, nullPoint) < 0) {
                right = middle;
            } else {
                left = middle;
            }
        }

        const areCrossed = function (point1, point2, point3, point4) {
            return (zVectMult(point1, point2, point3) * zVectMult(point1, point2, point4) <= 0 &&
                zVectMult(point3, point4, point1) * zVectMult(point3, point4, point2) <= 0);
        }(minkSum[0].point, nullPoint, minkSum[left].point, minkSum[right].point);

        if (!areCrossed) {
            return {
                distance: 0,
                status: "Polygons are crossed."
            };
        }
    }

    const isObtuse = (vector1, vector2) => (vector1.x * vector2.x + vector1.y * vector2.y <= 0);
    const vectorModule = (vector) => Math.sqrt(vector.x * vector.x + vector.y * vector.y);

    const getDistanceInfo1 = (minkEl1, minkEl2) => {
        const p1 = minkEl1.point;
        const p2 = minkEl2.point;
        const s1 = vectorModule(p1);
        const s2 = vectorModule(p2);
        if (s1 <= s2) {
            return {
                distance: s1,
                top1: minkEl1.top1,
                top2: minkEl1.top2
            }
        } else {
            return {
                distance: s2,
                top1: minkEl2.top1,
                top2: minkEl2.top2
            }
        }
    }

    const getDistanceInfo2 = (minkEl1, minkEl2) => {
        const p1 = minkEl1.point;
        const p2 = minkEl2.point;
        const distance = Math.abs(p2.x * p1.y - p2.y * p1.x) /
            Math.sqrt((p2.y - p1.y) * (p2.y - p1.y) + (p2.x - p1.x) * (p2.x - p1.x));
        return {
            distance,
            top1: "?",
            top2: "?",
            top11: minkEl1.top1,
            top12: minkEl1.top2,
            top21: minkEl2.top1,
            top22: minkEl2.top2
        }
    }

    let curInfo;

    for (let i = 0; i < minkSum.length - 1; i++) {
        point1 = minkSum[i].point
        point2 = minkSum[i + 1].point
        let vector1 = new Point(point1.x - point2.x, point1.y - point2.y);
        let vector2 = new Point(-point2.x, -point2.y);
        let vector3 = new Point(-vector1.x, -vector1.y);
        let vector4 = new Point(-point1.x, -point1.y);

        if (isObtuse(vector1, vector2) || isObtuse(vector3, vector4)) {
            curInfo = getDistanceInfo1(minkSum[i], minkSum[i + 1]);
        } else {
            curInfo = getDistanceInfo2(minkSum[i], minkSum[i + 1]);
        }

        if (curInfo.distance < resInfo.distance) {
            resInfo = curInfo;
        }
    }

    return resInfo;
};

const getPathsToFiles = () => {

    const inputFile = process.argv[2];
    const outputFile = process.argv[3];

    const p1 = path.join(
        path.dirname(require.main.filename),
        inputFile
    );

    const p2 = path.join(
        path.dirname(require.main.filename),
        outputFile
    );

    return { p1, p2 };
};

const writeToFile = (p, data) => {
    const getDFromPointToSide1 = (t11, t12, t) => {
        const p1 = firstPolygon[t11];
        const p2 = firstPolygon[t12];
        const p3 = secondPolygon[t];
        if (t11 === t12) {
            return Math.sqrt((p1.y - p3.y) * (p1.y - p3.y) + (p1.x - p3.x) * (p1.x - p3.x));
        }
        return Math.abs((p2.y - p1.y) * p3.x - (p2.x - p1.x) * p3.y + p2.x * p1.y - p2.y * p1.x) / 
            Math.sqrt((p2.y - p1.y) * (p2.y - p1.y) + (p2.x - p1.x) * (p2.x - p1.x));
    }

    const getDFromPointToSide2 = (t21, t22, t) => {
        const p1 = secondPolygon[t21];
        const p2 = secondPolygon[t22];
        const p3 = firstPolygon[t];
        if (t21 === t22) {
            return Math.sqrt((p1.y - p3.y) * (p1.y - p3.y) + (p1.x - p3.x) * (p1.x - p3.x));
        }
        return Math.abs((p2.y - p1.y) * p3.x - (p2.x - p1.x) * p3.y + p2.x * p1.y - p2.y * p1.x) / 
            Math.sqrt((p2.y - p1.y) * (p2.y - p1.y) + (p2.x - p1.x) * (p2.x - p1.x));
    }

    const getPointAndSide = (t11, t12, t21, t22) => {
        const d1 = {
            distance: getDFromPointToSide1(t11, t12, t21),
            numOfPoint: t21,
            pointPolygon: "второго",
            side: [t11, t12],
            sidePolygon: "первого"
        };
        const d2 = {
            distance: getDFromPointToSide1(t11, t12, t22),
            numOfPoint: t22,
            pointPolygon: "второго",
            side: [t11, t12],
            sidePolygon: "первого"
        };
        const d3 = {
            distance: getDFromPointToSide2(t21, t22, t11),
            numOfPoint: t11,
            pointPolygon: "первого",
            side: [t21, t22],
            sidePolygon: "второго"
        };
        const d4 = {
            distance: getDFromPointToSide2(t21, t22, t12),
            pointPolygon: "первого",
            numOfPoint: t12,
            side: [t21, t22],
            sidePolygon: "второго"
        };
        const dMin = Math.min(d1.distance, d2.distance, d3.distance, d4.distance);
        let resD;

        switch ([d1.distance, d2.distance, d3.distance, d4.distance].indexOf(dMin)) {
            case 0:
                resD = d1;
                break;
            case 1:
                resD = d2;
                break;
            case 2:
                resD = d3;
                break;
            case 3:
                resD = d4;
                break;
            default:
                console.log("Что-то не так!");
        }

        return resD;
    }

    let strData;
    
    if (data.top1 === undefined) {
        strData = `Расстояние равно ${data.distance}. 
Многоугольники пересекаются или касаются.`;
    } else if (data.top1 === "?") {
        // const info = getPointAndSide(data.top11, data.top12, data.top21, data.top22);
        const info = getPointAndSide(data.top11, data.top21, data.top12, data.top22);
        strData = `Расстояние равно ${data.distance}.\nРасстояние вычислено от вершины номер ${info.numOfPoint} ${info.pointPolygon} многоугольника до
стороны, образованной ${info.side[0]} и ${info.side[1]} вершинами ${info.sidePolygon} многоугольника.`
    } else {
        strData = `Расстояние равно ${data.distance}.\nНомер вершины первого многоугольника: ${data.top1};
Номер вершины второго многоугольника: ${data.top2}.`;
    }
    fs.writeFile(p, strData, err => {
        if (err) {
            console.log("Some error in writting to output file");
        }
    });
};

const start = () => {
    const { p1, p2 } = getPathsToFiles();
    const polygons = getFileData(p1);
    const minkSum = getMinkSum(polygons);
    const result = getDistance(minkSum);
    writeToFile(p2, result);
};

start();