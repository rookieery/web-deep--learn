// symbol 设置私有属性
const TICK = Symbol("tick");
const TICK_HANDLER = Symbol("tick-handler");
const ANIMATIONS = Symbol("animations");
const START_TIME = Symbol("start-time");
const PAUSE_START = Symbol("pause-start");
const PAUSE_TIME = Symbol("pause-time");

export class TimeLine {
    constructor() {
        this.state = 'init';
        this[ANIMATIONS] = new Set();
        this[START_TIME] = new Map();
    }

    start() {
        if (this.state !== 'init') {
            return;
        }
        this.state = 'start';
        const startTime = Date.now();
        this[PAUSE_TIME] = 0;
        this[TICK] = () => {
            const now = Date.now();
            for (let animation of this[ANIMATIONS]) {
                let t = this[START_TIME].get(animation) < startTime
                    ? now - startTime - this[PAUSE_TIME] - animation.delay
                    : now - this[START_TIME].get(animation) - this[PAUSE_TIME] - animation.delay;

                if (animation.duration < t) {
                    this[ANIMATIONS].delete(animation);
                    t = animation.duration;
                }
                if (t > 0) {
                    animation.receive(t);
                }
            }
            this[TICK_HANDLER] = requestAnimationFrame(this[TICK]);
        }
        this[TICK]();
    }

    // set rate() { }
    // get rate() { }

    pause() {
        if (this.state !== 'start') {
            return;
        }
        this.state = 'pause';
        this[PAUSE_START] = Date.now();
        cancelAnimationFrame(this[TICK_HANDLER]);
    }
    resume() {
        if (this.state !== 'pause') {
            return;
        }
        this.state = 'start';
        this[PAUSE_TIME] += Date.now() - this[PAUSE_START];
        this[TICK]();
    }

    reset() {
        this.pause();
        this.state = 'init';
        this[PAUSE_TIME] = 0;
        this[ANIMATIONS] = new Set();
        this[START_TIME] = new Map();
        this[PAUSE_START] = 0;
        this[TICK_HANDLER] = null;
    }
    add(animation, startTime) {
        if (arguments.length < 2) {
            startTime = Date.now();
        }
        this[ANIMATIONS].add(animation);
        this[START_TIME].set(animation, startTime);
    }
}

export class Animation {
    constructor(object, property, startValue, endValue, duration, delay, timingFunction, template) {
        timingFunction = timingFunction || (v => v);
        template = template || (v => v);
        this.object = object;
        this.property = property;
        this.startValue = startValue;
        this.endValue = endValue;
        this.duration = duration;
        this.timingFunction = timingFunction;
        this.delay = delay;
        this.template = template;
    }
    receive(time) {
        const range = this.endValue - this.startValue;
        const progress = this.timingFunction(time / this.duration);
        this.object[this.property] = this.template(this.startValue + range * progress);
    }
}


// setInterval(() => { });

// let tick = () => {
//     setTimeout(tick, 16);
// }

// let tick = () => {
//     requestAnimationFrame(tick);
// }