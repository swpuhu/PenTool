
class Line extends Base {
    constructor() {
        super();
        this.stroke = '#00ffaa';
        this.fill = 'transparent';
        this.ref = this.getElement();
    }

    update (anchor1, anchor2) {
        this.ref.setAttribute('d', `
                M 
                ${anchor1.x + anchor1.size / 2} ${anchor1.y + anchor1.size / 2}
                C 
                ${anchor1.x + anchor1.arm1.x + anchor1.armSize / 2} ${anchor1.y + anchor1.arm1.y + anchor1.armSize / 2}, 
                ${anchor2.x + anchor2.arm2.x + anchor2.armSize / 2} ${anchor2.y + anchor2.arm2.y + anchor2.armSize / 2}
                ${anchor2.x + anchor2.size / 2} ${anchor2.y + anchor2.size / 2}`);
    }
    getElement () {
        let that = this;
        let curve = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        curve.setAttribute('stroke', that.stroke);
        curve.setAttribute('fill', that.fill);
        return curve;
    }

    delete () {
        this.ref.remove();
    }
}