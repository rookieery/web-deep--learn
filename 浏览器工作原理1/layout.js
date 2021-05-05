function getStyle(element) {
    if (!element.style) {
        element.style = {};
    }
    for (let prop in element.computedStyle) {
        element.style[prop] = element.computedStyle[prop].value;
        if (element.style[prop].toString().match(/px$/)) {
            element.style[prop] = parseInt(element.style[prop]);
        }
        if (element.style[prop].toString().match(/^[0-9\.]+$/)) {
            element.style[prop] = parseInt(element.style[prop]);
        }
    }
    return element.style;
}

function layout(element) {
    if (!element.computedStyle) {
        return;
    }
    const elementStyle = getStyle(element);
    if (elementStyle.display !== 'flex') {
        return;
    }
    const items = element.children.filter(e => e.type === 'element');
    items.sort((a, b) => (a.order || 0) - (b.order || 0));

    const style = elementStyle;
    ['width', 'height'].forEach(size => {
        if (style[size] === 'auto' || style[size] === '') {
            style[size] = null;
        }
    });

    if (!style["flex-direction"] || style["flex-direction"] === 'auto') {
        style["flex-direction"] = 'row';
    }
    if (!style["align-items"] || style["align-items"] === 'auto') {
        style["align-items"] = 'stretch';
    }
    if (!style["justify-content"] || style["justify-content"] === 'auto') {
        style["justify-content"] = 'flex-start';
    }
    if (!style["flex-wrap"] || style["flex-wrap"] === 'auto') {
        style["flex-wrap"] = 'nowrap'
    }
    if (!style["align-content"]|| style["align-content"]=== 'auto') {
        style["align-content"]= 'stretch';
    }

    let mainSize; //主轴元素大小
    let mainStart; //主轴元素起点
    let mainEnd; //主轴元素终点
    let mainSign; // 排布方向
    let mainBase; // 记录那些已经显示设定大小的元素值
    let crossSize;
    let crossStart;
    let crossEnd;
    let crossSign;
    let crossBase;
    if (style["flex-direction"] === 'row') {
        mainSize = 'width';
        mainStart = 'left';
        mainEnd = 'right';
        mainSign = +1;
        mainBase = 0;

        crossSize = 'height';
        crossStart = 'top';
        crossEnd = 'bottom';
    }
    if (style["flex-direction"] === 'row-reverse') {
        mainSize = 'width';
        mainStart = 'right';
        mainEnd = 'left';
        mainSign = -1;
        mainBase = style.width;

        crossSize = 'height';
        crossStart = 'top';
        crossEnd = 'bottom';
    }
    if (style["flex-direction"] === 'column') {
        mainSize = 'height';
        mainStart = 'top';
        mainEnd = 'bottom';
        mainSign = +1;
        mainBase = 0;

        crossSize = 'width';
        crossStart = 'left';
        crossEnd = 'right';
    }
    if (style["flex-direction"] === 'column-reverse') {
        mainSize = 'height';
        mainStart = 'bottom';
        mainEnd = 'top';
        mainSign = -1;
        mainBase = style.height;

        crossSize = 'width';
        crossStart = 'left';
        crossEnd = 'right';
    }
    // 只受交叉轴的影响
    if (style["flex-wrap"] === 'wrap-reverse') {
        const tmp = crossStart;
        crossStart = crossEnd;
        crossEnd = tmp;
        crossSize = -1;
    } else {
        crossBase = 0;
        crossSign = 1;
    }

    let isAutoMainSize = false;
    if (!style[mainSize]) { // auto sizing
        elementStyle[mainSize] = 0;
        items.forEach(item => {
            const itemStyle = getStyle(item);
            if (itemStyle[mainSize] !== null || itemStyle[mainSize] !== (void 0)) {
                elementStyle[mainSize] = elementStyle[mainSize] + itemStyle[mainSize];
            }
        })
        isAutoMainSize = true;
    }

    let flexLine = []; // 一行
    const flexLines = [flexLine];
    let mainSpace = elementStyle[mainSize];//剩余空间
    let crossSpace = 0;// 交叉轴的高度(行高)

    items.forEach(item => {
        const itemStyle = getStyle(item);
        if (itemStyle[mainSize] === null) {
            itemStyle[mainSize] = 0;
        }

        if (itemStyle.flex) {// flex属性 如flex:1
            flexLine.push(item);
        } else if (style["flex-wrap"] === 'nowrap' && isAutoMainSize) {
            mainSpace -= itemStyle[mainSize];
            if (itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0)) {
                crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
            }
            flexLine.push(item);
        } else {
            if (itemStyle[mainSize] > style[mainSize]) { // 子元素比父元素大
                itemStyle[mainSign] = style[mainSize];
            }
            if (mainSpace < itemStyle[mainSize]) {
                flexLine.mainSpace = mainSpace;
                flexLine.crossSpace = crossSpace;

                flexLine = [];
                flexLine.push(item);
                flexLines.push(flexLine);
                mainSpace = style[mainSize];
                crossSpace = 0;
            } else {
                flexLine.push(item);
            }
            if (itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0)) {
                crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
            }
            mainSpace -= itemStyle[mainSize];
        }
    });
    flexLine.mainSpace = mainSpace; // 最后一行的剩余空间

    if (style["flex-wrap"] === 'nowrap' || isAutoMainSize) {
        flexLine.crossSpace = (style[crossSize] !== (void 0)) ? style[crossSize] : crossSpace;
    } else {
        flexLine.crossSpace = crossSpace;
    }

    if (mainSpace < 0) {
        // 等比压缩 （只可能是单行即最后一行）
        const scale = style[mainSize] / (style[mainSize] - mainSpace);
        let currentMain = mainBase;
        items.forEach(item => {
            const itemStyle = getStyle(item);
            if (itemStyle.flex) {
                itemStyle[mainSize] = 0;
            }

            itemStyle[mainSize] = itemStyle[mainSize] * scale;
            itemStyle[mainStart] = currentMain;
            itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
            currentMain = itemStyle[mainEnd];
        });
    } else {
        // 多行
        flexLines.forEach(items => {
            let mainSpace = items.mainSpace;
            let flexTotal = 0;
            items.forEach(item => {
                const itemStyle = getStyle(item);
                if ((itemStyle.flex !== null) && (itemStyle.flex !== (void 0))) {
                    flexTotal += itemStyle.flex;
                }
            });

            if (flexTotal > 0) {
                // 均匀分配
                let currentMain = mainBase;
                items.forEach(item => {
                    const itemStyle = getStyle(item);
                    if (itemStyle.flex) {
                        itemStyle[mainSize] = (mainSpace / flexTotal) * itemStyle.flex;
                    }
                    itemStyle[mainStart] = currentMain;
                    itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
                    currentMain = itemStyle[mainEnd];
                });
            } else {
                // 根据justifyContent进行分配
                let currentMain;
                let step; //间隔
                if (style["justify-content"] === 'flex-start') {
                    currentMain = mainBase;
                    step = 0;
                }
                if (style["justify-content"] === 'flex-end') {
                    currentMain = mainSpace * mainSign + mainBase;
                    step = 0;
                }
                if (style["justify-content"] === 'center') {
                    currentMain = mainSpace / 2 * mainSign + mainBase;
                    step = 0;
                }
                if (style["justify-content"] === 'space-between') {
                    currentMain = mainBase;
                    step = mainSpace / (items.length - 1) * mainSign;
                }
                if (style["justify-content"] === 'space-around') {
                    step = mainSpace / items.length * mainSign;
                    currentMain = step / 2 + mainBase;
                }
                items.forEach(item => {
                    const itemStyle = getStyle(item);
                    itemStyle[mainStart] = currentMain;
                    itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
                    currentMain = itemStyle[mainEnd] + step;
                })
            }
        })
    }

    //计算交叉轴尺寸
    if (!style[crossSize]) { // 自动填充
        crossSpace = 0;
        elementStyle[crossSize] = 0;
        flexLines.forEach(flexLine => {
            elementStyle[crossSize] = elementStyle[crossSize] + flexLine.crossSpace;
        });
    } else {
        crossSpace = style[crossSize];
        flexLines.forEach(flexLine => {
            crossSpace -= flexLine.crossSpace;
        });
    }

    // 分配 crossSpace
    if (style["flex-wrap"] === 'wrap-reverse') {
        crossBase = style[crossSize];
    } else {
        crossBase = 0;
    }

    let step;
    if (style["align-content"]=== 'flex-start') {
        crossBase += 0;
        step = 0;
    }
    if (style["align-content"]=== 'flex-end') {
        crossBase += crossSign * crossSpace;
        step = 0;
    }
    if (style["align-content"]=== 'center') {
        crossBase += crossSign * crossSpace / 2;
        step = 0;
    }
    if (style["align-content"]=== 'space-between') {
        crossBase += 0;
        step = crossSpace / (flexLines.length - 1);
    }
    if (style["align-content"]=== 'space-around') {
        crossBase += crossSign * step / 2;
        step = crossSpace / (flexLines.length);
    }
    if (style["align-content"]=== 'stretch') {
        crossBase += 0;
        step = 0;
    }
    flexLines.forEach(items => {
        const lineCrossSize = style["align-content"]=== 'stretch'
            ? items.crossSpace + crossSpace / flexLines.length
            : items.crossSpace;
        items.forEach(item => {
            const itemStyle = getStyle(item);
            const align = itemStyle["align-self"] || style["align-items"];
            if (itemStyle[crossSize] === null) {
                itemStyle[crossSize] = (align === 'stretch') ? lineCrossSize : 0;
            }
            if (align === 'flex-start') {
                itemStyle[crossStart] = crossBase;
                itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
            }
            if (align === 'flex-end') {
                itemStyle[crossEnd] = crossBase + crossSign * lineCrossSize;
                itemStyle[crossStart] = itemStyle[crossEnd] - crossSign * itemStyle[crossSize];
            }
            if (align === 'center') {
                itemStyle[crossStart] = crossBase + crossSign * (lineCrossSize - itemStyle[crossSize]) / 2;
                itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
            }
            if (align === 'stretch') {
                itemStyle[crossStart] = crossBase;
                itemStyle[crossEnd] = crossBase + crossSign * ((itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0)) ? itemStyle[crossSize] : lineCrossSize);
                itemStyle[crossSize] = crossSign * (itemStyle[crossEnd] - itemStyle[crossStart]);
            }
        });
        crossBase += crossSign*(lineCrossSize+step);
    })
}

module.exports = layout;