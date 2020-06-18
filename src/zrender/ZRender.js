import Animation from './animation/animation'
import shape from './shape'
import util from './tool/util'
import Storage from './Storage'
import Painter from './Painter'
import Handler from './Handler'
import logger from './logger'

/**
 * ZRender接口类，对外可用的所有接口都在这里！！
 * storage（M）、painter（V）、handler（C）为内部私有类，外部接口不可见
 * 非get接口统一返回self支持链式调用~
 *
 * @param {string} id 唯一标识
 * @param {HTMLElement} dom dom对象，不帮你做document.getElementById
 * @param {Object=} params 个性化参数，如自定义shape集合，带进来就好
 *
 * @return {ZRender} ZRender实例
 */
export default class ZRender {
    constructor(id, dom, params) {
        this.id = id
        this.dom = dom
        // 获得图形库
        const shapeLibrary = this.getShapeLibrary(params)
        this.storage = new Storage(shapeLibrary);
        this.painter = new Painter(this.dom, this.storage, shapeLibrary);
        this.handler = new Handler(this.dom, this.storage, this.painter, shapeLibrary);
        this.initAnimate()

    }

    // 动画控制
    initAnimate() {
        // 需要变动的形状集合
        this.animatingShapes = [];
        // stage是绘制类, 需要提供update接口
        this.animation = new Animation({
            stage: {
                // 必须使用箭头函数, 否则this绑定会出错
                update: () => {
                    this.update(this.animatingShapes);
                }
            }
        });
        this.animation.start();
    }

    // 获得图形库
    getShapeLibrary(params) {
        let shapeLibrary = {};

        if (typeof params.shape == 'undefined') {
            //默认图形库
            shapeLibrary = shape;
        } else {
            //自定义图形库，私有化，实例独占
            for (let s in params.shape) {
                shapeLibrary[s] = params.shape[s];
            }
            shapeLibrary.get = function (name) {
                return shapeLibrary[name] || shape.get(name);
            };
        }
        return shapeLibrary
    }


    /**
     * 获取实例唯一标识
     */
    getId() {
        return id;
    };

    /**
     * 添加图形形状
     * @param {Object} shape 形状对象，可用属性全集，详见各shape
     */
    addShape(shape) {
        this.storage.add(shape);
        return this;
    };

    /**
     * 删除图形形状
     * @param {string} shapeId 形状对象唯一标识
     */
    delShape(shapeId) {
        this.storage.del(shapeId);
        return this;
    };

    /**
     * 修改图形形状
     * @param {string} shapeId 形状对象唯一标识
     * @param {Object} shape 形状对象
     */
    modShape(shapeId, shape) {
        this.storage.mod(shapeId, shape);
        return this;
    };

    /**
     * 添加额外高亮层显示，仅提供添加方法，每次刷新后高亮层图形均被清空
     * @param {Object} shape 形状对象
     */
    addHoverShape(shape) {
        this.storage.addHover(shape);
        return this;
    };

    /**
     * 渲染
     * @param {Function} callback  渲染结束后回调函数
     * todo:增加缓动函数
     */
    render(callback) {
        this.painter.render(callback);
        return this;
    };

    /**
     * 视图更新
     * @param {Function} callback  视图更新后回调函数
     */
    refresh(callback) {
        this.painter.refresh(callback);
        return this;
    };

    /**
     * 视图更新
     * @param {Array} shapeList 需要更新的图形元素列表
     * @param {Function} callback  视图更新后回调函数
     */
    update(shapeList, callback) {
        this.painter.update(shapeList, callback);
        return this;
    };

    resize() {
        this.painter.resize();
        return this;
    };

    /**
     * 动画
     * @param {string} shapeId 形状对象唯一标识
     * @param {string} path 需要添加动画的属性获取路径，可以通过a.b.c来获取深层的属性
     * @param {boolean} loop 动画是否循环
     * @return {Object} 动画的Deferred对象
     * Example:
     * zr.animate( circleId, 'style', false)
     *   .when(1000, { x: 10} )
     *   .done( function(){ console.log('Animation done')})
     *   .start()
     */
    animate(shapeId, path, loop) {
        // 获取形状
        const shape = this.storage.get(shapeId);
        if (shape) {
            // 要变更的目标,默认是shape, path存在则给其他属性
            let target = undefined;
            if (path) {
                const pathSplitted = path.split('.');
                let prop = shape;
                for (let i = 0, l = pathSplitted.length; i < l; i++) {
                    if (!prop) {
                        continue;
                    }
                    prop = prop[pathSplitted[i]];
                }
                if (prop) {
                    target = prop;
                }
            } else {
                target = shape;
            }
            if (!target) {
                logger.log(`Property ${path} is not existed in shape ${shapeId}`);//
                return;
            }
            // 动态给图形增加__aniCount的属性, 表示动画数
            if (typeof (shape.__aniCount) === 'undefined') {
                // 正在进行的动画记数
                shape.__aniCount = 0;
            }
            // 动画数为0则证明是刚开始, 则可以加入到需要变动的形状集合
            if (shape.__aniCount === 0) {
                this.animatingShapes.push(shape);
            }
            // 动画数加1
            shape.__aniCount++;
            // target是图形, loop是是否循环
            return this.animation.animate(target, loop)
                .done(()=> {
                    shape.__aniCount--;
                    if (shape.__aniCount === 0) {
                        // 从animatingShapes里移除
                        const idx = util.indexOf(this.animatingShapes, shape);
                        this.animatingShapes.splice(idx, 1);
                    }
                });
        } else {
            logger.log(`Shape ${shapeId} not existed`);
        }
    };


    /**
     * 生成形状唯一ID
     * @param {string} [idPrefix] id前缀
     * @return {string} 不重复ID
     */
    newShapeId(idPrefix) {
        return this.storage.newShapeId(idPrefix);
    };

    /**
     * 获取视图宽度
     */
    getWidth() {
        return this.painter.getWidth();
    };

    /**
     * 获取视图高度
     */
    getHeight() {
        return this.painter.getHeight();
    };

    toDataURL(type, args) {
        return this.painter.toDataURL(type, args);
    };

    /**
     * 事件绑定
     * @param {string} eventName 事件名称
     * @param {Function} eventHandler 响应函数
     */
    on(eventName, eventHandler) {
        this.handler.on(eventName, eventHandler);
        return this;
    };

    /**
     * 事件解绑定，参数为空则解绑所有自定义事件
     * @param {string} eventName 事件名称
     * @param {Function} eventHandler 响应函数
     */
    un(eventName, eventHandler) {
        this.handler.un(eventName, eventHandler);
        return this;
    };

    /**
     * 清除当前ZRender下所有类图的数据和显示，clear后MVC和已绑定事件均还存在在，ZRender可用
     */
    clear() {
        this.storage.del();
        this.painter.clear();
        return this;
    };

    /**
     * 释放当前ZR实例（删除包括dom，数据、显示和事件绑定），dispose后ZR不可用
     */
    dispose() {
        this.animation.stop();
        this.animation = null;
        this.animatingShapes = null;

        this.clear();
        // fixme 类方法中如何将实例置为空
        // self = null;

        this.storage.dispose();
        this.storage = null;

        this.painter.dispose();
        this.painter = null;

        this.handler.dispose();
        this.handler = null;

        //释放后告诉全局删除对自己的索引，没想到啥好方法
        // fixme 模块化以后无法调用全局类
        // zrender.delInstance(id);

        return;
    };
}