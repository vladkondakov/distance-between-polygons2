const fs = require('fs');
const path = require('path');

class Point {
    constructor(x, y) {
        this.x = x
        this.y = y
        // this.polarAngle = 0
    }
}

const getFileData = (p) => {
    let data = fs.readFileSync(p, 'utf-8');

    const lines = data.split(/\r\n|\r|\n/);

    const n = parseInt(lines[0][0]);
    const m = parseInt(lines[0][2]);

    let firstPolygon = [];
    let secondPolygon = [];
    let i = 1; // Current index of line

    //inverse points of the second polygon here
    const addPoint = (lineWithCoords, polygon, k) => {
        const coords = lineWithCoords.split(' ');
        const xCoord = parseInt(coords[0]);
        const yCoord = parseInt(coords[1]);

        (k === 0) ? polygon.push(new Point(xCoord, yCoord)) : polygon.push(new Point(-xCoord, -yCoord));
    }

    for (i; i <= n; i++) {
        addPoint(lines[i], firstPolygon, 0);
    }

    for (i; i <= n + m; i++) {
        addPoint(lines[i], secondPolygon, 1);
    }

    const polygons = {
        firstPolygon,
        secondPolygon
    };

    return polygons;

};

const getMinkSum = (polygons) => {
    let { firstPolygon, secondPolygon } = polygons;

    const n = firstPolygon.length;
    const m = secondPolygon.length;
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
    }(secondPolygon);

    let i = 0;

    firstPolygon.push(new Point(firstPolygon[0].x, firstPolygon[0].y));
    secondPolygon.push(new Point(secondPolygon[0].x, secondPolygon[0].y));

    let minkSum = [];
    minkSum.push({
        point: new Point(firstPolygon[0].x + secondPolygon[j].x, firstPolygon[0].y + secondPolygon[j].y),
        top1: 0,
        top2: j
    });

    const addPoint = (point1, point2, ind1, ind2) => {
        len = minkSum.length;
        minkSum.push({
            point: new Point(minkSum[len - 1].point.x + (point2.x - point1.x), minkSum[len - 1].point.y + (point2.y - point1.y)),
            top1: ind1,
            top2: ind2
        });
    };

    while (!(checkedPoints1[i] && checkedPoints2[j])) {
        if (i == n) { i = 0; }
        if (j == m) { j = 0; }
        if (checkedPoints1[i] || !checkedPoints2[j] &&
            (firstPolygon[i + 1].x - firstPolygon[i].x) * (secondPolygon[j + 1].y - secondPolygon[j].y) -
            (firstPolygon[i + 1].y - firstPolygon[i].y) * (secondPolygon[j + 1].x - secondPolygon[j].x) < 0) {
            addPoint(secondPolygon[j], secondPolygon[j + 1], i, (j + 1));
            checkedPoints2[j] = true;
            j++;
        } else {
            addPoint(firstPolygon[i], firstPolygon[i + 1], (i + 1), j);
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
            return (zVectMult(point1, point2, point3) * zVectMult(point1, point2, point4) < 0 &&
                zVectMult(point3, point4, point1) * zVectMult(point3, point4, point2) < 0);
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
    let curInfo;

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
            top2: "?"
        }
    }

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
    let strData;
    if (data.top1) {
        strData = `Расстояние равно ${data.distance}.\nНомер вершины первого многоугольника: ${data.top1};
Номер вершины второго многоугольника: ${data.top2}.`;
    } else {
        strData = `Расстояние равно ${data.distance}. 
Многоугольники пересекаются или касаются.`;
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