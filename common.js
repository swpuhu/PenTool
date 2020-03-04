
/**
 * 
 * @param {Point[]} points 
 * @param {number} p 
 */
function getPointInBezier (points, p) {
    const invT = 1 - p;
    return Point.add(
        Point.multiple(points[0], invT ** 3),
        Point.multiple(points[1], 3 * p * invT ** 2),
        Point.multiple(points[2], 3 * p ** 2 * invT),
        Point.multiple(points[3], p ** 3)
    )
}

function getBezierPoints (points, step = 10) {
    let ret = [];
    for (let i = 0; i <= step; i++) {
        ret.push(getPointInBezier(points, i / step));
    }
    return ret;
}


function splitBezier (points, t) {
    let p01 = Point.add(Point.multiple(points[0], 1 - t), Point.multiple(points[1], t));
    let p11 = Point.add(Point.multiple(points[1], 1 - t), Point.multiple(points[2], t));
    let p21 = Point.add(Point.multiple(points[2], 1 - t), Point.multiple(points[3], t));
    let p02 = Point.add(Point.multiple(p01, 1 - t), Point.multiple(p11, t));
    let p12 = Point.add(Point.multiple(p11, 1 - t), Point.multiple(p21, t));
    let q = Point.add(Point.multiple(p02, 1 - t), Point.multiple(p12, t));
    return [
        [points[0], p01, p02, q],
        [q, p12, p21, points[3]]
    ];
}
function drawPoints (points) {
    ctx.beginPath();
    for (let i = 0; i < points.length - 1; i++) {
        let curPoint = points[i];
        let nextPoint = points[i + 1];
        ctx.moveTo(curPoint.x, curPoint.y);
        ctx.lineTo(nextPoint.x, nextPoint.y);
    }
    ctx.stroke();
}


class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

Point.add = function (...args) {
    let ret = new Point(0, 0);
    for (let i = 0; i < args.length; i++) {
        ret.x += args[i].x;
        ret.y += args[i].y;
    }
    return ret;
}

Point.multiple = function (point, scalar) {
    return new Point(point.x * scalar, point.y * scalar);
}

class LinkedListNode {
    constructor(value) {
        this.value = value;
        this.next = null;
        this.prev = null;
    }
}

class LinkedList {
    constructor(value = []) {
        this.head = null;
        this.tail = null;
        this.currentPos = null;
        this.init(value);
        this.length = 0;
    }

    push (value) {
        let node = new LinkedListNode(value);
        if (!this.head) {
            this.head = node;
            this.tail = node;
            this.currentPos = node;
        } else {
            node.prev = this.tail;
            this.tail.next = node;
            this.tail = node;
        }
        this.length++;
        return node;
    }

    find (item) {
        let p = this.head;
        let ret = null;
        while (p) {
            if (p === item) {
                ret = p;
                break;
            }
            p = p.next;
        }
        return ret;
    }

    delete (item) {
        let pos = this.find(item);
        if (pos === this.head) {
            this.head = this.head.next;
            this.head.prev = null;
        } else if (pos === this.tail) {
            this.tail = this.tail.prev;
            this.tail.next = null;
        } else {
            let prev = pos.prev;
            let next = pos.next;
            prev.next = next;
            next.prev = prev;
        }
        pos = null;
    }

    init (value = []) {
        for (let i = 0; i < value.length; i++) {
            this.push(value[i]);
        }
    }
}

window.LinkedList = LinkedList;


class Base {
    constructor() {
        this.eventList = {};
    }

    on (name, fn) {
        if (!this.eventList[name]) {
            this.eventList[name] = [];
        }
        this.eventList[name].push(fn);
    }

    off (name, fn) {
        if (!this.eventList[name]) {
            console.error('no event ' + name);
            return;
        }
        let index = this.eventList[name].indexOf(fn);
        if (index >= 0) {
            this.eventList[name].splice(index, 1);
        }
    }

    dispatch () {
        let name = Array.prototype.shift.call(arguments);
        let args = Array.prototype.slice.call(arguments);
        if (!this.eventList[name]) {
            console.error('no event ' + name);
            return;
        }
        for (let i = 0; i < this.eventList[name].length; i++) {
            let fn = this.eventList[name][i];
            fn.apply(this, args);
        }
    }
}
class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    get length () {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    multiplyScalar (s) {
        return new Vec2(this.x * s, this.y * s);
    }

    // 逆时针旋转为正方向
    rotate (angle) {
        let sin = Math.sin(angle * Math.PI / 180);
        let cos = Math.cos(angle * Math.PI / 180);
        return new Vec2(this.x * cos - this.y * sin, this.y * cos + this.x * sin);
    }
}
