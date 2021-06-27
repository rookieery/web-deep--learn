export class Dispatcher {
    constructor(element) {
        this.element = element;
    }

    dispatch(type, properties) {
        const event = new Event(type);
        for (let name in properties) {
            event[name] = properties[name];
        }
        this.element.dispatchEvent(event);
    }
}

export class Listener {
    constructor(element, recognizer) {
        let isListeningMouse = false;
        const contexts = new Map();
        element.addEventListener("mousedown", e => {
            const context = Object.create(null);
            contexts.set(`mouse${1 << e.button}`, context);
            recognizer.start(e, context);

            const mousemove = e => {
                // e.buttons 0b00011
                let button = 1;
                while (button <= e.buttons) {
                    if (button & e.buttons) {
                        // 调整右键和中键的顺序
                        let key;
                        if (button === 2) {
                            key = 4;
                        } else if (button === 4) {
                            key = 2;
                        } else {
                            key = button;
                        }
                        const context = contexts.get(`mouse${key}`);
                        recognizer.move(e, context);
                    }
                    button = button << 1;
                }
            }
            const mouseup = e => {
                const context = contexts.get(`mouse${1 << e.button}`);
                recognizer.end(e, context);
                contexts.delete(`mouse${1 << e.button}`);
                if (e.buttons === 0) {
                    document.removeEventListener("mousemove", mousemove);
                    document.removeEventListener("mouseup", mouseup);
                    isListeningMouse = false;
                }
            }
            if (!isListeningMouse) {
                document.addEventListener("mousemove", mousemove);
                document.addEventListener("mouseup", mouseup);
                isListeningMouse = true;
            }
        })

        // identifier字段来表示唯一的id
        element.addEventListener("touchstart", e => {
            for (let touch of e.changedTouches) {
                const context = Object.create(null);
                contexts.set(touch.identifier, context);
                recognizer.start(touch, context);
            }
        })

        element.addEventListener("touchmove", e => {
            for (let touch of e.changedTouches) {
                const context = contexts.get(touch.identifier);
                recognizer.move(touch, context);
            }
        })

        element.addEventListener("touchend", e => {
            for (let touch of e.changedTouches) {
                const context = contexts.get(touch.identifier);
                recognizer.end(touch, context);
                contexts.delete(touch.identifier);
            }
        })

        element.addEventListener("touchcancel", e => {
            for (let touch of e.changedTouches) {
                const context = contexts.get(touch.identifier);
                recognizer.cancel(touch, context);
                contexts.delete(touch.identifier);
            }
        })
    }
}

export class Recognizer {
    constructor(dispatcher) {
        this.dispatcher = dispatcher;
    }
    start = (point, context) => {
        context.startX = point.clientX;
        context.startY = point.clientY;
        this.dispatcher.dispatch("start", {
            clientX: point.clientX,
            clientY: point.clientY,
        });
        context.points = [{
            t: Date.now(),
            x: point.clientX,
            y: point.clientY,
        }];
        context.isPan = false;
        context.isTap = true;
        context.isPress = false;
        context.handler = setTimeout(() => {
            context.isPan = false;
            context.isTap = false;
            context.isPress = true;
            context.handler = null;
            this.dispatcher.dispatch("press", {});
        }, 500);
    }

    move = (point, context) => {
        const dx = point.clientX - context.startX;
        const dy = point.clientY - context.startY;
        if (!context.isPan && dx ** 2 + dy ** 2 > 100) {
            context.isPan = true;
            context.isTap = false;
            context.isPress = false;
            context.isVertical = Math.abs(dx) < Math.abs(dy);
            this.dispatcher.dispatch("panStart", {
                startX: context.startX,
                startY: context.startY,
                clientX: point.clientX,
                clientY: point.clientY,
                isVertical: context.isVertical,
            });
            clearTimeout(context.handler);
        }
        if (context.isPan) {
            this.dispatcher.dispatch("pan", {
                startX: context.startX,
                startY: context.startY,
                clientX: point.clientX,
                clientY: point.clientY,
                isVertical: context.isVertical,
            });
        }
        context.points = context.points.filter(point => Date.now() - point.t < 500);
        context.points.push({
            t: Date.now(),
            x: point.clientX,
            y: point.clientY,
        })
    }
    end = (point, context) => {
        if (context.isTap) {
            this.dispatcher.dispatch("tap", {});
            clearTimeout(context.handler);
        }
        if (context.isPress) {
            this.dispatcher.dispatch("pressEnd", {});
        }
        context.points = context.points.filter(point => Date.now() - point.t < 500);
        let d, v;
        if (context.points.length) {
            d = Math.sqrt((point.clientX - context.points[0].x) ** 2 +
                (point.clientY - context.points[0].y) ** 2);
            v = d / (Date.now() - context.points[0].t);
        } else {
            v = 0;
        }

        if (v > 1.5) {
            this.dispatcher.dispatch("flick", {
                startX: context.startX,
                startY: context.startY,
                clientX: point.clientX,
                clientY: point.clientY,
                isVertical: context.isVertical,
                isFlick: context.isFlick,
                velocity: v,
            });
            context.isFlick = true;
        } else {
            context.isFlick = false;
        }
        if (context.isPan) {
            this.dispatcher.dispatch("panEnd", {
                startX: context.startX,
                startY: context.startY,
                clientX: point.clientX,
                clientY: point.clientY,
                isVertical: context.isVertical,
                isFlick: context.isFlick,
                velocity: v,
            });
        }
        this.dispatcher.dispatch("end", {
            startX: context.startX,
            startY: context.startY,
            clientX: point.clientX,
            clientY: point.clientY,
            isVertical: context.isVertical,
            isFlick: context.isFlick,
            velocity: v,
        });
    }
    cancel = (point, context) => {
        this.dispatcher.dispatch("cancel", {});
        clearTimeout(context.handler);
    }
}

export function enableGesture(element) {
    new Listener(element, new Recognizer(new Dispatcher(element)));
}