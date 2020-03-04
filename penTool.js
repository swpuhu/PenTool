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
                that.hideSomeAnchor(node);
            });
            anchor.on('update', function () {
                that.update(node);
            });
            if (that.path.length > 1) {
                let anchor2 = that.path.tail;
                let anchor1 = anchor2.prev;
                // let line = new Line();
                // anchor1.value.rightLine = line;
                // anchor2.value.leftLine = line;
                anchor2.value.on('delete', function () {
                    if (that.currentAnchor === anchor2.value) {
                        that.currentAnchor = null;
                    }
                    // anchor2.value.leftLine && anchor2.value.leftLine.delete();
                    // anchor2.value.rightLine && anchor2.value.rightLine.delete();
                    let ret = that.path.find(anchor2);
                    if (ret) {
                        let next = ret.next;
                        let prev = ret.prev;
                        if (next) {
                            // next.value.leftLine = null;
                        }
                        if (prev) {
                            // prev.value.rightLine = null;
                        }
                        
                        that.path.delete(anchor2);
                        if (next && prev) {
                            // let line = new Line(prev.value, next.value);
                            // next.value.leftLine = line;
                            // prev.value.rightLine = line;
                            // that.svg.appendChild(line.ref);
                            // that.update(next);
                        }
                    }
                    that.update();
                })
                
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
    }

    update (node) {
        // let anchor = node.value;
        // if (node.prev) {
        //     // anchor.leftLine.update(node.prev.value, anchor);

        // }
        // if (node.next) {
        //     // anchor.rightLine.update(anchor, node.next.value);
        // }
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
}

let path = new Path(container);