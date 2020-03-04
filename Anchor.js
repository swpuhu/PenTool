
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

    getElement () {
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

    update () {
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

    hideArm1 () {
        this.arm1Element.style.display = 'none';
    }

    hideArm2 () {
        this.arm2Element.style.display = 'none';
    }

    showArm1 () {
        this.arm1Element.style.display = 'block';
    }
    showArm2 () {
        this.arm2Element.style.display = 'block';
    }

    addCurve (curve) {
        this.curves.push(curve);
    }

    deleteCurve (curve) {
        let index = this.curves.indexOf(curve);
        if (index > -1) {
            this.curves.splice(index, 1);
        }
    }
}
