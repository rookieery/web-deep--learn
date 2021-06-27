import { Component, STATE, ATTRIBUTE } from './framework.js';
import { enableGesture } from './gesture.js';
import { TimeLine, Animation } from './animation.js';
import { ease, easeIn } from './ease.js';

export { STATE, ATTRIBUTE } from './framework.js';
export class Carousel extends Component {
    constructor() {
        super();
        this.attributes = Object.create(null);
    }

    render() {
        // console.log(this.attributes.src);
        this.root = document.createElement('div');
        this.root.classList.add('carousel');
        for (let record of this[ATTRIBUTE].src) {
            const child = document.createElement('div');
            child.style.backgroundImage = `url(${record.img})`;
            this.root.appendChild(child);
        }

        enableGesture(this.root);
        let timeLine = new TimeLine();
        timeLine.start();
        const children = this.root.children;
        this[STATE].position = 0;
        let t = 0;
        let ax = 0;
        let handler = null;

        this.root.addEventListener('start', e => {
            timeLine.pause();
            clearInterval(handler);
            const progress = (Date.now() - t) / 500;
            ax = ease(progress) * 500 - 500;
        });
        this.root.addEventListener('tap', e => {
            this.triggerEvent("click", {
                data: this[ATTRIBUTE].src[this[STATE].position],
                position: this[STATE].position,
            });
        });
        this.root.addEventListener('pan', e => {
            // ax不对
            const x = e.clientX - e.startX - ax;
            const current = this[STATE].position - ((x - x % 500) / 500);
            for (let offset of [-1, 0, 1]) {
                let pos = current + offset;
                pos = (pos % children.length + children.length) % children.length;
                children[pos].style.transition = 'none';
                children[pos].style.transform = `translateX(${-pos * 500 + offset * 500 + x % 500}px)`;
            }
        });
        this.root.addEventListener('end', e => {

            timeLine.reset();
            timeLine.start();
            handler = setInterval(nextPicture, 3000);

            const x = e.clientX - e.startX - ax;
            const current = this[STATE].position - ((x - x % 500) / 500);
            let direction = Math.round((x % 500) / 500);
            if (e.isFlick) {
                direction = e.velocity < 0 ? Math.ceil((x % 500) / 500) : Math.floor((x % 500) / 500);
            }
            for (let offset of [-1, 0, 1]) {
                let pos = current + offset;
                pos = (pos % children.length + children.length) % children.length;
                children[pos].style.transition = 'none';
                timeLine.add(new Animation(children[pos].style, "transform",
                    -pos * 500 + offset * 500 + x % 500,
                    -pos * 500 + offset * 500 + direction * 500,
                    500, 0, ease, v => `translateX(${v}px)`));
            }
            this[STATE].position = current - direction;
            this[STATE].position = (this[STATE].position % children.length + children.length) % children.length;
            // 开始为0貌似也不对劲
            this.triggerEvent("change", { position: this[STATE].position });
        });

        const nextPicture = () => {
            const children = this.root.children;
            let nextIndex = (this[STATE].position + 1) % children.length;

            let current = children[this[STATE].position];
            let next = children[nextIndex];

            t = Date.now();

            timeLine.add(new Animation(current.style, "transform",
                -this[STATE].position * 500, -500 - this[STATE].position * 500, 500, 0, ease, v => `translateX(${v}px)`));
            timeLine.add(new Animation(next.style, "transform",
                500 - nextIndex * 500, - nextIndex * 500, 500, 0, ease, v => `translateX(${v}px)`));
            this.triggerEvent("change", { position: this[STATE].position });
            this[STATE].position = nextIndex;
        };
        handler = setInterval(nextPicture, 3000);
        // this.root.addEventListener('mousedown', (e) => {
        //     const children = this.root.children;
        //     const startX = e.clientX;
        //     const move = (e) => {
        //         const x = e.clientX - startX;
        //         const current = position - ((x - x % 500) / 500);
        //         // 同时只改变数组内个数的元素的状态（3个）
        //         // 之前是改变所有元素的状态
        //         for (let offset of [-1, 0, 1]) {
        //             let pos = current + offset;
        //             pos = (pos + children.length) % children.length;
        //             children[pos].style.transition = 'none';
        //             children[pos].style.transform = `translateX(${-pos * 500 + offset * 500 + x % 500}px)`;
        //         }
        //     }
        //     const up = (e) => {
        //         const x = e.clientX - startX;
        //         position = position - Math.round(x / 500);
        //         for (let offset of [0, Math.sign(x - 250 * Math.sign(x))]) {
        //             let pos = position + offset;
        //             pos = (pos + children.length) % children.length;
        //             children[pos].style.transition = '';
        //             children[pos].style.transform = `translateX(${-pos * 500 + offset * 500}px)`;
        //         }
        //         document.removeEventListener('mousemove', move);
        //         document.removeEventListener('mouseup', up);
        //     }
        //     document.addEventListener('mousemove', move);
        //     document.addEventListener('mouseup', up);
        // });

        // let currentIndex = 0;
        // setInterval(() => {
        //     const children = this.root.children;
        //     let nextIndex = (currentIndex + 1) % children.length;

        //     let current = children[currentIndex];
        //     let next = children[nextIndex];

        //     next.style.transition = 'none';
        //     next.style.transform = `translateX(${100 - nextIndex * 100}%)`;

        //     setTimeout(() => {
        //         next.style.transition = '';
        //         current.style.transform = `translateX(${-100 - currentIndex * 100}%)`;
        //         next.style.transform = `translateX(${- nextIndex * 100}%)`;
        //         currentIndex = nextIndex;
        //     }, 16);

        // }, 3000);
        return this.root;
    }

    mountTo(parent) {
        parent.appendChild(this.render());
    }
}