import G_vmlCanvasManager from './lib/excanvas'
import config from './config'
import {logger} from './logger'

/**
 * 绘图类 (V)
 * @param {HTMLElement} root 绘图区域
 * @param {storage} storage Storage实例
 * @param {Object} shape 图形库
 */
export default function Painter(root, storage, shape) {
    var self = this;
    // 获取配置项
    const {catchBrushException} = config

    var _domList = {};              //canvas dom元素
    var _ctxList = {};              //canvas 2D context对象，与domList对应

    var _maxZlevel = 0;             //最大zlevel，缓存记录
    // 根dom节点
    var _domRoot = document.createElement('div');
    // 避免页面选中的尴尬, 不然根dom节点被选中
    _domRoot.onselectstart = function () {
        return false;
    };

    //宽，缓存记录
    var _width;
    //高，缓存记录
    var _height;

    //retina 屏幕优化
    var _devicePixelRatio = window.devicePixelRatio || 1;

    function _getWidth() {
        var stl = root.currentStyle
            || document.defaultView.getComputedStyle(root);

        return root.clientWidth
            - stl.paddingLeft.replace(/\D/g, '')   // 请原谅我这比较粗暴
            - stl.paddingRight.replace(/\D/g, '');
    }

    function _getHeight() {
        var stl = root.currentStyle
            || document.defaultView.getComputedStyle(root);

        return root.clientHeight
            - stl.paddingTop.replace(/\D/g, '')    // 请原谅我这比较粗暴
            - stl.paddingBottom.replace(/\D/g, '');
    }

    /**
     * 私有方法
     * painter的初始化方法,
     *
     * 根据storage存储的最大zlevel创建canvas,
     * 初始形成根节点domRoot, dom节点列表domList和绘图ctx列表ctxList,
     * 说是列表, 但是都是用object对象实现的, 马上会调用初始化方法
     * @private
     */
    function _init() {
        // 初始化根节点
        _domRoot.innerHTML = '';
        root.innerHTML = '';

        _width = _getWidth();
        _height = _getHeight();

        //没append呢，原谅我这样写，清晰~
        _domRoot.style.position = 'relative';
        _domRoot.style.overflow = 'hidden';
        _domRoot.style.width = _width + 'px';
        _domRoot.style.height = _height + 'px';

        root.appendChild(_domRoot);

        _domList = {};
        _ctxList = {};

        _maxZlevel = storage.getMaxZlevel();

        //  创建各层canvas
        //  创建背景div, 由于不是canvas, 不需要用canvasManager初始化
        _domList['bg'] = _createDom('bg', 'div');
        _domRoot.appendChild(_domList['bg']);

        //  创建实体canvas
        for (var i = 0; i <= _maxZlevel; i++) {
            _domList[i] = _createDom(i, 'canvas');
            _domRoot.appendChild(_domList[i]);
            if (G_vmlCanvasManager) {
                G_vmlCanvasManager.initElement(_domList[i]);
            }
            _ctxList[i] = _domList[i].getContext('2d');
            // 高分屏放大
            _devicePixelRatio != 1
            && _ctxList[i].scale(_devicePixelRatio, _devicePixelRatio);
        }

        // 创建高亮层canvas
        _domList['hover'] = _createDom('hover', 'canvas');
        _domList['hover'].id = '_zrender_hover_';
        _domRoot.appendChild(_domList['hover']);
        if (G_vmlCanvasManager) {
            G_vmlCanvasManager.initElement(_domList['hover']);
        }
        _ctxList['hover'] = _domList['hover'].getContext('2d');
        // 高分屏放大
        _devicePixelRatio !== 1
        && _ctxList['hover'].scale(_devicePixelRatio, _devicePixelRatio);
    }

    /**
     * 检查_maxZlevel是否变大，如是则同步创建需要的Canvas
     */
    function _syncMaxZlevelCanvase() {
        var curMaxZlevel = storage.getMaxZlevel();
        if (_maxZlevel < curMaxZlevel) {
            //实体
            for (var i = _maxZlevel + 1; i <= curMaxZlevel; i++) {
                _domList[i] = _createDom(i, 'canvas');
                _domRoot.insertBefore(_domList[i], _domList['hover']);
                if (G_vmlCanvasManager) {
                    G_vmlCanvasManager.initElement(_domList[i]);
                }
                _ctxList[i] = _domList[i].getContext('2d');
                _devicePixelRatio != 1
                && _ctxList[i].scale(
                    _devicePixelRatio, _devicePixelRatio
                );
            }
            _maxZlevel = curMaxZlevel;
        }
    }

    /**
     * 创建dom
     * @param {string} id dom的id值,待用
     * @param {string} type : dom类型，例如canvas, div等
     */
    function _createDom(id, type) {
        var newDom = document.createElement(type);

        //没append呢，请原谅我这样写，清晰~
        newDom.style.position = 'absolute';
        newDom.style.width = _width + 'px';
        newDom.style.height = _height + 'px';
        newDom.setAttribute('width', _width * _devicePixelRatio);
        newDom.setAttribute('height', _height * _devicePixelRatio);
        //id不作为索引用，避免可能造成的重名，定义为私有属性
        newDom.setAttribute('data-id', id);
        return newDom;
    }

    /**
     * 刷画图形, 返回的是一个函数, 这个函数会被迭代器调用
     * @param {Object} changedZlevel 需要更新的zlevel索引
     */
    function _brush(changedZlevel) {
        return function (e) {
            if ((changedZlevel.all || changedZlevel[e.zlevel])
                && !e.invisible
            ) {
                var ctx = _ctxList[e.zlevel];
                if (ctx) {
                    if (!e.onbrush //没有onbrush
                        //有onbrush并且调用执行返回false或undefined则继续粉刷
                        || (e.onbrush && !e.onbrush(ctx, e, false))
                    ) {
                        if (catchBrushException) {
                            try {
                                shape.get(e.shape).brush(ctx, e, false, update);
                            } catch (error) {
                                logger.log(error, 'brush error of ' + e.shape, e);
                            }
                        } else {
                            var currentShape = shape.get(e.shape)
                            currentShape.brush(ctx, e, false, update);
                        }
                    }
                } else {
                    logger.log('can not find the specific zlevel canvas!');
                }
            }
        };
    }

    /**
     * 鼠标悬浮刷画
     */
    function _brushHover(e) {
        var ctx = _ctxList['hover'];
        if (!e.onbrush //没有onbrush
            //有onbrush并且调用执行返回false或undefined则继续粉刷
            || (e.onbrush && !e.onbrush(ctx, e, true))
        ) {
            // Retina 优化
            if (catchBrushException) {
                try {
                    shape.get(e.shape).brush(ctx, e, true, update);
                } catch (error) {
                    logger.log(
                        error, 'hoverBrush error of ' + e.shape, e
                    );
                }
            } else {
                shape.get(e.shape).brush(ctx, e, true, update);
            }
        }
    }

    /**
     * 首次绘图，创建各种dom和context
     * @param {Function=} callback 绘画结束后的回调函数
     */
    function render(callback) {
        //检查_maxZlevel是否变大，如是则同步创建需要的Canvas
        _syncMaxZlevelCanvase();

        //升序遍历，shape上的zlevel指定绘画图层的z轴层叠
        storage.iterShape(
            // 把储存里面的形状全部刷画下来
            _brush({all: true}),
            {normal: 'up'}
        );

        //update到最新则清空标志位, 把有数据改变的zLevel层清空掉
        storage.clearChangedZlevel();

        if (typeof callback == 'function') {
            callback();
        }

        return self;
    }

    /**
     * 刷新
     * @param {Function=} callback 刷新结束后的回调函数
     */
    function refresh(callback) {
        //检查_maxZlevel是否变大，如是则同步创建需要的Canvas
        _syncMaxZlevelCanvase();

        //仅更新有修改的canvas
        var changedZlevel = storage.getChangedZlevel();
        //擦除有修改的canvas
        if (changedZlevel.all) {
            clear();
        } else {
            for (var k in changedZlevel) {
                if (_ctxList[k]) {
                    _ctxList[k].clearRect(
                        0, 0,
                        _width * _devicePixelRatio,
                        _height * _devicePixelRatio
                    );
                }
            }
        }
        //重绘内容，升序遍历，shape上的zlevel指定绘画图层的z轴层叠
        storage.iterShape(
            _brush(changedZlevel),
            {normal: 'up'}
        );

        //update到最新则清空标志位
        storage.clearChangedZlevel();

        if (typeof callback == 'function') {
            callback();
        }

        return self;
    }


    /**
     * 视图更新
     * @param {Array} shapeList 需要更新的图形元素列表,
     *                          不进入这个list的元素则不进行更新
     * @param {Function} callback  视图更新后回调函数, 默认不传
     */
    function update(shapeList, callback) {
        var shape;
        // 对shapeList中的每个形状, 在storage中更改其内容
        for (var i = 0, l = shapeList.length; i < l; i++) {
            shape = shapeList[i];
            storage.mod(shape.id, shape);
        }
        refresh(callback);
        return self;
    }

    /**
     * 清除hover层外所有内容
     */
    function clear() {
        for (var k in _ctxList) {
            if (k == 'hover') {
                continue;
            }
            _ctxList[k].clearRect(
                0, 0,
                _width * _devicePixelRatio,
                _height * _devicePixelRatio
            );
        }
        return self;
    }

    /**
     * 刷新hover层
     */
    function refreshHover() {
        clearHover();

        storage.iterShape(_brushHover, {hover: true});

        storage.delHover();

        return self;
    }

    /**
     * 清除hover层所有内容
     */
    function clearHover() {
        _ctxList
        && _ctxList['hover']
        && _ctxList['hover'].clearRect(
            0, 0,
            _width * _devicePixelRatio,
            _height * _devicePixelRatio
        );

        return self;
    }


    /**
     * 获取绘图区域宽度
     */
    function getWidth() {
        return _width;
    }

    /**
     * 获取绘图区域高度
     */
    function getHeight() {
        return _height;
    }

    /**
     * 区域大小变化后重绘
     */
    function resize() {
        var width;
        var height;
        var dom;

        _domRoot.style.display = 'none';

        width = _getWidth();
        height = _getHeight();

        _domRoot.style.display = '';

        //优化没有实际改变的resize
        if (_width != width || height != _height) {
            _width = width;
            _height = height;

            _domRoot.style.width = _width + 'px';
            _domRoot.style.height = _height + 'px';

            for (var i in _domList) {
                dom = _domList[i];
                dom.setAttribute('width', _width);
                dom.setAttribute('height', _height);
                dom.style.width = _width + 'px';
                dom.style.height = _height + 'px';
            }

            storage.setChangedZlevle('all');
            refresh();
        }

        return self;
    }

    /**
     * 释放
     */
    function dispose() {
        root.innerHTML = '';

        root = null;
        storage = null;
        shape = null;

        _domRoot = null;
        _domList = null;
        _ctxList = null;

        self = null;

        return;
    }

    function getDomHover() {
        return _domList['hover'];
    }

    function toDataURL(type, args) {
        if (G_vmlCanvasManager) {
            return null;
        }
        var imageDom = _createDom('image', 'canvas');
        _domList['bg'].appendChild(imageDom);
        var ctx = imageDom.getContext('2d');
        _devicePixelRatio != 1
        && ctx.scale(_devicePixelRatio, _devicePixelRatio);

        ctx.fillStyle = '#fff';
        ctx.rect(
            0, 0,
            _width * _devicePixelRatio,
            _height * _devicePixelRatio
        );
        ctx.fill();
        //升序遍历，shape上的zlevel指定绘画图层的z轴层叠
        storage.iterShape(
            function (e) {
                if (!e.invisible) {
                    if (!e.onbrush //没有onbrush
                        //有onbrush并且调用执行返回false或undefined则继续粉刷
                        || (e.onbrush && !e.onbrush(ctx, e, false))
                    ) {
                        if (catchBrushException) {
                            try {
                                shape.get(e.shape).brush(
                                    ctx, e, false, update
                                );
                            } catch (error) {
                                logger.log(
                                    error,
                                    'brush error of ' + e.shape,
                                    e
                                );
                            }
                        } else {
                            shape.get(e.shape).brush(
                                ctx, e, false, update
                            );
                        }
                    }
                }
            },
            {normal: 'up'}
        );
        var image = imageDom.toDataURL(type, args);
        ctx = null;
        _domList['bg'].removeChild(imageDom);
        return image;
    }

    self.render = render;
    self.refresh = refresh;
    self.update = update;
    self.clear = clear;
    self.refreshHover = refreshHover;
    self.clearHover = clearHover;
    self.getWidth = getWidth;
    self.getHeight = getHeight;
    self.resize = resize;
    self.dispose = dispose;
    self.getDomHover = getDomHover;
    self.toDataURL = toDataURL;

    // 调用初始化方法
    _init();
}