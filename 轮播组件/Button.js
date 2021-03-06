import { Component, STATE, ATTRIBUTE, createElement } from './framework.js';
import { enableGesture } from './gesture.js';

export { STATE, ATTRIBUTE } from './framework.js';
export class Button extends Component {
    constructor() {
        super();
        this.attributes = Object.create(null);
    }

    render() {
        this.childContainer = <span />;
        this.root = (<div>{this.childContainer}</div>).render();
        return this.root;
    }

    appendChild(child) {
        if (!this.childContainer) {
            this.render();
        }
        this.childContainer.appendChild(child);
    }
}