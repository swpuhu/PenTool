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


class Path extends Base {
    /**
     * 
     * @param {HTMLElement} container 
     */
    constructor(container) {
        container.style.position = 'relative';
        super();
        let canvas = document.createElement('canvas');
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        let width = container.offsetWidth;
        let height = container.offsetHeight;
        this.svg.setAttribute('width', width);
        this.svg.setAttribute('height', height);
        this.ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            z-index: -1;
        `;
        container.appendChild(canvas);
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
        this.ctx.fillStyle = this.fill;
        this.ctx.strokeStyle = this.stroke;
        this.points = [];
    }

    init() {
        let that = this;
        let containerPos = container.getBoundingClientRect();
        let tempAnchor = new Anchor(0, 0, true);
        that.svg.appendChild(tempAnchor.ref);
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
            });
            anchor.on('select', function () {
                that.hideSomeAnchor(node);
            });
            anchor.on('update', function () {
                that.update(node);
            });
            anchor.on('delete', function () {
                if (that.currentAnchor === anchor) {
                    that.currentAnchor = null;
                }
                let ret = that.path.find(anchor);
                if (ret) {
                    that.path.delete(anchor);
                }
                that.update();
            })
            if (that.path.length > 1) {
                let anchor2 = that.path.tail;
                let anchor1 = anchor2.prev;
                
                // that.svg.appendChild(line.ref);
            }
            that.update(node);
            that.hideSomeAnchor(node);

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
        let isInCurve;
        container.onmousemove = function (e) {
            let x = e.clientX - containerPos.x;
            let y = e.clientY - containerPos.y;
            isInCurve = that.isInCurve(x, y);
            if (isInCurve[0]) {
                let [x, y] = [isInCurve[1], isInCurve[2]];
                tempAnchor.x = x - tempAnchor.size / 2;
                tempAnchor.y = y - tempAnchor.size / 2;
                tempAnchor.update();
            }
        }

        container.onclick = function (e) {
            if (isInCurve[0]) {
                let [bool, x, y, point, nextPoint, minI, minJ] = isInCurve;
                let len = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
                let sum = 0;
                for (let i = 0; i <= minJ; i++) {
                    sum += that.points[minI][1][i];
                }
                console.log(sum / that.points[minI][2]);
            }
        }
    }

    update () {
        this.drawCurve();
        this.computePoints();
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

    hideSomeAnchor(node) {
        let anchor = node.value;
        let p = this.path.head;
        while (p) {
            p.value.hideArm1();
            p.value.hideArm2();
            p = p.next;
        }
        anchor.showArm1();
        anchor.showArm2();
        let prev = node.prev;
        let next = node.next;
        if (prev) {
            prev.value.showArm1();
        }
        if (next) {
            next.value.showArm2();
        }
        this.currentAnchor = anchor;
    }

    drawOneCurve(anchor1, anchor2) {
        this.ctx.moveTo(anchor1.x + anchor1.size / 2, anchor1.y + anchor1.size / 2);
        this.ctx.bezierCurveTo(
            anchor1.arm1.x + anchor1.x + anchor1.armSize / 2, anchor1.arm1.y + anchor1.y + anchor1.armSize / 2,
            anchor2.arm2.x + anchor2.x + anchor2.armSize / 2, anchor2.arm2.y + anchor2.y + anchor2.armSize / 2,
            anchor2.x + anchor2.size / 2, anchor2.y + anchor2.size / 2);
    }

    drawCurve() {
        let p = this.path.head;
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.beginPath();
        while(p) {
            let next = p.next;
            if (next) {
                this.drawOneCurve(p.value, next.value);
            }
            p = p.next;
        }
        this.ctx.stroke();
    }

    computePoints () {
        this.points = [];
        let p = this.path.head;
        while(p) {
            let next = p.next;
            if (next) {
                let anchor1 = p.value;
                let anchor2 = next.value;
                let point1 = new Point(anchor1.x + anchor1.size / 2, anchor1.y + anchor1.size / 2);
                let point2 = new Point(anchor1.x + anchor1.arm1.x + anchor1.armSize / 2, anchor1.y + anchor1.arm1.y + anchor1.armSize / 2);
                let point3 = new Point(anchor2.x + anchor2.arm2.x + anchor2.armSize / 2, anchor2.y + anchor2.arm2.y + anchor2.armSize / 2);
                let point4 = new Point(anchor2.x + anchor2.size / 2, anchor2.y + anchor2.size / 2);
                this.points.push(getBezierPoints([
                    point1, point2, point3, point4
                ]));
            }
            p = p.next;
        }
    }

    getDistance(x1, y1, x2, y2, x, y) {
        let A = y1 - y2;
        let B = x2 - x1;
        let C = (x1 - x2) * y1 - (y1 - y2) * x1;
        return Math.abs((A * x + B * y + C) / Math.sqrt(A ** 2 + B ** 2));
    }

    getY (x1, y1, x2, y2, x) {
        let A = y1 - y2;
        let B = x2 - x1;
        let C = (x1 - x2) * y1 - (y1 - y2) * x1;
        return (-C - A * x) / B;
    }
    isInCurve(x, y) {
        let that = this;
        let min = 50000;
        let minI, minJ;
        let minX, minY, maxX, maxY;
        
        for (let i = 0; i < that.points.length; i++) {
            for (let j = 0; j < that.points[i][0].length - 1; j++) {
                let point = that.points[i][0][j];
                let nextPoint = that.points[i][0][j + 1];
                let distance = that.getDistance(point.x, point.y, nextPoint.x, nextPoint.y, x, y);
                minY = Math.min(point.y, nextPoint.y);
                minX = Math.min(point.x, nextPoint.x);
                maxX = Math.max(point.x, nextPoint.x);
                maxY = Math.max(point.y, nextPoint.y);
                if (distance <= min && x >= minX && y >= minY && x <= maxX && y <= maxY) {
                    min = distance;
                    minI = i;
                    minJ = j;
                }
            }
        }
        if (min < 10) {
            let point = that.points[minI][0][minJ];
            let nextPoint = that.points[minI][0][minJ + 1];
            let y = that.getY(point.x, point.y, nextPoint.x, nextPoint.y, x);
            return [true, x, y, point, nextPoint, minI, minJ];
        } else {
            return [false];
        }
    }
}

let path = new Path(container);