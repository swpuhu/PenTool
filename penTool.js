let container = document.createElement('div');
container.style.cssText = `
    width: 640px;
    height: 360px;
    border: 1px solid #ccc;
`

document.body.appendChild(container);

let canvas = document.createElement('canvas');
canvas.width = 640;
canvas.height = 360;
document.body.appendChild(canvas);
let ctx = canvas.getContext('2d');

/**
 * 
 * @param {Point[]} points 
 * @param {number} p 
 */
function getPointInBezier(points, p) {
    const invT = 1 - p;
    return Point.add(
        Point.multiple(points[0], invT ** 3),
        Point.multiple(points[1], 3 * p * invT ** 2),
        Point.multiple(points[2], 3 * p ** 2 * invT),
        Point.multiple(points[3], p ** 3)
    )
}

function getBezierPoints(points, step = 10) {
    let ret = [];
    for (let i = 0; i <= step; i++) {
        ret.push(getPointInBezier(points, i / step));
    }
    return ret;
}


function splitBezier(points, t) {
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
function drawPoints(points) {
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
    constructor (x, y) {
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

    push(value) {
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

    find(item) {
        let p = this.head;
        let ret = null;
        while(p) {
            if (p === item) {
                ret = p;
                break;
            }
            p = p.next;
        }
        return ret;
    }

    delete(item) {
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

    init(value = []) {
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

    on(name, fn) {
        if (!this.eventList[name]) {
            this.eventList[name] = [];
        }
        this.eventList[name].push(fn);
    }

    off(name, fn) {
        if (!this.eventList[name]) {
            console.error('no event ' + name);
            return;
        }
        let index = this.eventList[name].indexOf(fn);
        if (index >= 0) {
            this.eventList[name].splice(index, 1);
        }
    }

    dispatch() {
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

    get length() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    multiplyScalar(s) {
        return new Vec2(this.x * s, this.y * s);
    }

    // 逆时针旋转为正方向
    rotate(angle) {
        let sin = Math.sin(angle * Math.PI / 180);
        let cos = Math.cos(angle * Math.PI / 180);
        return new Vec2(this.x * cos - this.y * sin, this.y * cos + this.x * sin);
    }
}


class Path extends Base {
    /**
     * 
     * @param {HTMLElement} container 
     */
    constructor(container) {
        super();
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        let width = container.offsetWidth;
        let height = container.offsetHeight;
        this.svg.setAttribute('width', width);
        this.svg.setAttribute('height', height);
        container.appendChild(this.svg);
        this.container = container;
        this.init();
        this.path = new LinkedList();
        this.currentAnchor = null;
        this.anchorCurveMap = new Map();
        this.head = null;
        this.looped = false;
        this.stroke = '#00ffaa';
        this.fill = 'transparent';
    }

    init() {
        let that = this;
        container.onmousedown = function (e) {
            if (that.looped) return;
            let x = e.offsetX;
            let y = e.offsetY;
            let anchor = new Anchor(x, y);
            that.currentAnchor = anchor;
            if (that.path.length === 0) {
                anchor.isHead = true;
            }
            that.svg.appendChild(anchor.ref);
            let node = that.path.push(anchor);
            anchor.on('loop', function () {
                // that.looped = true;
                // that.path.tail.next = that.path.head;
                // let line = new Line();
                // that.svg.appendChild(line.ref);
            });
            anchor.on('select', function () {
                that.currentAnchor = anchor;
            });
            anchor.on('update', function () {
                that.update(node);
            });
            if (that.path.length > 1) {
                let anchor2 = that.path.tail;
                let anchor1 = anchor2.prev;
                let line = new Line();
                anchor1.value.rightLine = line;
                anchor2.value.leftLine = line;
                anchor2.value.on('delete', function () {
                    if (that.currentAnchor === anchor2.value) {
                        that.currentAnchor = null;
                    }
                    anchor2.value.leftLine && anchor2.value.leftLine.delete();
                    anchor2.value.rightLine && anchor2.value.rightLine.delete();
                    let ret = that.path.find(anchor2);
                    if (ret) {
                        let next = ret.next;
                        let prev = ret.prev;
                        if (next) {
                            next.value.leftLine = null;
                        }
                        if (prev) {
                            prev.value.rightLine = null;
                        }
                        
                        that.path.delete(anchor2);
                        if (next && prev) {
                            let line = new Line(prev.value, next.value);
                            next.value.leftLine = line;
                            prev.value.rightLine = line;
                            that.svg.appendChild(line.ref);
                            that.update(next);
                        }
                    }
                })
                
                that.svg.appendChild(line.ref);
            }
            that.update(node);

            let threshold = 20;
            function move(ev) {
                let offsetX = ev.clientX - e.clientX;
                let offsetY = ev.clientY - e.clientY;
                if (Math.abs(offsetY) <= threshold && Math.abs(offsetX) <= threshold) {
                    return;
                }
                anchor.arm1.x = offsetX - (anchor.size / 2);
                anchor.arm1.y = offsetY - (anchor.size / 2);
                anchor.arm2.x = -(offsetX - (anchor.size / 2));
                anchor.arm2.y = -(offsetY - (anchor.size / 2))
                anchor.update();

            }

            function up() {
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', up);
            }

            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        }
    }

    update (node) {
        let anchor = node.value;
        if (node.prev) {
            anchor.leftLine.update(node.prev.value, anchor);

        }
        if (node.next) {
            anchor.rightLine.update(anchor, node.next.value);
        }

    }

    findAnchor(anchor) {
        let p = this.path.head;
        let ret = null;
        while (p) {
            if (p === anchor) {
                ret = p;
                break;
            }
            p = p.next;
        }
        return ret;
    }
}

class Line extends Base {
    constructor() {
        super();
        this.stroke = '#00ffaa';
        this.fill = 'transparent';
        this.ref = this.getElement();
    }

    update(anchor1, anchor2) {
        this.ref.setAttribute('d', `
                M 
                ${anchor1.x + anchor1.size / 2} ${anchor1.y + anchor1.size / 2}
                C 
                ${anchor1.x + anchor1.arm1.x + anchor1.armSize / 2} ${anchor1.y + anchor1.arm1.y + anchor1.armSize / 2}, 
                ${anchor2.x + anchor2.arm2.x + anchor2.armSize / 2} ${anchor2.y + anchor2.arm2.y + anchor2.armSize / 2}
                ${anchor2.x + anchor2.size / 2} ${anchor2.y + anchor2.size / 2}`);
    }
    getElement() {
        let that = this;
        let curve = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        curve.setAttribute('stroke', that.stroke);
        curve.setAttribute('fill', that.fill);
        return curve;
    }

    delete() {
        this.ref.remove();
    }
}

class Anchor extends Base {
    constructor(x, y) {
        super();
        this.arm1 = new Vec2(0, 0);
        this.arm2 = new Vec2(0, 0);
        this.size = 8;
        this.armSize = this.size / 2;
        this.x = x;
        this.y = y;
        this.fill = '#00ffaa';
        this.lineColor = '#000';
        this.relative = true;
        this.curves = [];
        this.ref = this.getElement();
    }

    getElement() {
        let that = this;
        let wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        let point = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        point.setAttribute('x', this.x);
        point.setAttribute('y', this.y);
        point.setAttribute('width', this.size);
        point.setAttribute('height', this.size);
        point.setAttribute('fill', this.fill);

        let arm1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        arm1.setAttribute('cx', this.x + this.arm1.x + this.size / 2);
        arm1.setAttribute('cy', this.y + this.arm1.y + this.size / 2);
        arm1.setAttribute('r', this.armSize);
        arm1.setAttribute('fill', this.fill);

        let arm2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        arm2.setAttribute('cx', this.x + this.arm2.x + this.size / 2);
        arm2.setAttribute('cy', this.y + this.arm2.y + this.size / 2);
        arm2.setAttribute('r', this.armSize);
        arm2.setAttribute('fill', this.fill);

        let line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line1.setAttribute('stroke', this.fill);
        line1.setAttribute('x1', this.x);
        line1.setAttribute('y1', this.y);
        line1.setAttribute('x2', this.x + this.arm1.x);
        line1.setAttribute('y2', this.y + this.arm1.y);

        let line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line2.setAttribute('stroke', this.fill);
        line2.setAttribute('x1', this.x + this.size / 2);
        line2.setAttribute('y1', this.y + this.size / 2);
        line2.setAttribute('x2', this.x + this.arm2.x + this.armSize / 2);
        line2.setAttribute('y2', this.y + this.arm2.y + this.armSize / 2);
        // arm1.style.display = 'none';
        // arm2.style.display = 'none';


        point.addEventListener('mousedown', function (e) {
            e.stopPropagation();
            e.preventDefault();
            let ctrlKey = e.ctrlKey;
            if (/mac/i.test(navigator.platform)) {
                ctrlKey = e.metaKey;
            }
            if (ctrlKey) {
                let initX = that.x;
                let initY = that.y;
                that.dispatch('select');
                let move = function (ev) {
                    let offsetX = ev.clientX - e.clientX;
                    let offsetY = ev.clientY - e.clientY;
                    that.x = initX + offsetX;
                    that.y = initY + offsetY;
                    that.update();
                }
                let up = function () {
                    document.removeEventListener('mousemove', move);
                    document.removeEventListener('mouseup', up);
                }

                document.addEventListener('mousemove', move);
                document.addEventListener('mouseup', up);
            } else if (e.altKey) {
                let event = new MouseEvent('mousedown', { clientX: e.clientX, clientY: e.clientY });
                arm1.dispatchEvent(event);
            } else if (that.isHead) {
                that.dispatch('loop');
            } else {
                that.delete();
                that = null;
            }
        });
        arm1.onmousedown = function (e) {
            e.preventDefault();
            e.stopPropagation();
            that.dispatch('select');
            let arm1StartPosX = e.clientX;
            let arm1StartPosY = e.clientY;
            let arm1InitPosX = that.arm1.x;
            let arm1InitPosY = that.arm1.y;
            let arm2InitPosX = that.arm2.x;
            let arm2InitPosY = that.arm2.y;
            let move = function (ev) {
                let offsetX = ev.clientX - arm1StartPosX;
                let offsetY = ev.clientY - arm1StartPosY;
                that.arm1.x = arm1InitPosX + offsetX;
                that.arm1.y = arm1InitPosY + offsetY;
                if (that.relative) {
                    that.arm2.x = arm2InitPosX - offsetX;
                    that.arm2.y = arm2InitPosY - offsetY;
                }
                that.update();
            }

            let up = function (e) {
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', up);
            }
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        }


        arm2.onmousedown = function (e) {
            e.preventDefault();
            e.stopPropagation();
            that.dispatch('select');
            let arm2StartPosX = e.clientX;
            let arm2StartPosY = e.clientY;
            let arm1InitPosX = that.arm1.x;
            let arm1InitPosY = that.arm1.y;
            let arm2InitPosX = that.arm2.x;
            let arm2InitPosY = that.arm2.y;
            let move = function (ev) {
                let offsetX = ev.clientX - arm2StartPosX;
                let offsetY = ev.clientY - arm2StartPosY;
                that.arm2.x = arm2InitPosX + offsetX;
                that.arm2.y = arm2InitPosY + offsetY;
                if (that.relative) {
                    that.arm1.x = arm1InitPosX - offsetX;
                    that.arm1.y = arm1InitPosY - offsetY;
                }
                that.update();
            }

            let up = function (e) {
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup', up);
            }
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup', up);
        }

        wrapper.appendChild(line1);
        wrapper.appendChild(line2);
        wrapper.appendChild(arm2);
        wrapper.appendChild(arm1);
        wrapper.appendChild(point);
        this.pointElement = point;
        this.arm1Element = arm1;
        this.arm2Element = arm2;
        this.line1Element = line1;
        this.line2Element = line2;
        return wrapper;

    }

    update() {
        this.pointElement.setAttribute('x', this.x);
        this.pointElement.setAttribute('y', this.y);
        this.arm1Element.setAttribute('cx', this.x + this.arm1.x + this.size / 2);
        this.arm1Element.setAttribute('cy', this.y + this.arm1.y + this.size / 2);
        this.arm2Element.setAttribute('cx', this.x + this.arm2.x + this.size / 2);
        this.arm2Element.setAttribute('cy', this.y + this.arm2.y + this.size / 2);

        this.line1Element.setAttribute('x1', this.x + this.size / 2);
        this.line1Element.setAttribute('y1', this.y + this.size / 2);
        this.line1Element.setAttribute('x2', this.x + this.arm1.x + this.armSize);
        this.line1Element.setAttribute('y2', this.y + this.arm1.y + this.armSize);

        this.line2Element.setAttribute('x1', this.x + this.size / 2);
        this.line2Element.setAttribute('y1', this.y + this.size / 2);
        this.line2Element.setAttribute('x2', this.x + this.arm2.x + this.armSize);
        this.line2Element.setAttribute('y2', this.y + this.arm2.y + this.armSize);
        this.dispatch('update');
    }

    delete () {
        this.ref.remove();
        this.dispatch('delete');
        this.eventList = null;
        this.ref = null;
        this.leftLine = null;
        this.rightLine = null;
    }

    hideArm1() {
        this.arm1Element.style.display = 'none';
    }

    hideArm2() {
        this.arm2Element.style.display = 'none';
    }

    showArm1() {
        this.arm1Element.style.display = 'block';
    }
    showArm2() {
        this.arm2Element.style.display = 'block';
    }

    addCurve(curve) {
        this.curves.push(curve);
    }

    deleteCurve(curve) {
        let index = this.curves.indexOf(curve);
        if (index > -1) {
            this.curves.splice(index ,1);
        }
    }
}


let path = new Path(container);