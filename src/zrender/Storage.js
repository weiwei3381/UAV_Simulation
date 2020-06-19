import util from './tool/util'
import config from './config'
import {logger} from './logger'

/**
 * 内容仓库 (M)
 * @param {Object} shape 图形库
 */
export default function Storage(shape) {
    var self = this;
    const {catchBrushException} = config
    var _idBase = 0;            //图形数据id自增基础

    //所有常规形状，id索引的map
    var _elements = {};

    //所有形状的z轴方向排列，提高遍历性能，zElements[0]的形状在zElements[1]形状下方
    var _zElements = [];

    //高亮层形状，不稳定，动态增删，数组位置也是z轴方向，靠前显示在下方
    var _hoverElements = [];

    var _maxZlevel = 0;         //最大zlevel
    var _changedZlevel = {};    //有数据改变的zlevel

    /**
     * 唯一标识id生成
     * @param {string=} idHead 标识前缀
     */
    function newShapeId(idHead) {
        return (idHead || '') + (++_idBase);
    }

    /**
     * 快速判断标志~
     * e.__silent 是否需要hover判断
     * e.__needTransform 是否需要进行transform
     * e.style.__rect 区域矩阵缓存，修改后清空，重新计算一次
     */
    function _mark(e) {
        // 如果形状可高亮/点击/拖拽等操作, 那么该形状就需要hover判断, 否则不需要
        if (e.hoverable || e.onclick || e.draggable
            || e.onmousemove || e.onmouseover || e.onmouseout
            || e.onmousedown || e.onmouseup
            || e.ondragenter || e.ondragover || e.ondragleave
            || e.ondrop
        ) {
            e.__silent = false;
        } else {
            e.__silent = true;
        }
        // 如果形状的位置/大小/旋转有一个有值,则需要转向
        if (Math.abs(e.rotation[0]) > 0.0001
            || Math.abs(e.position[0]) > 0.0001
            || Math.abs(e.position[1]) > 0.0001
            || Math.abs(e.scale[0] - 1) > 0.0001
            || Math.abs(e.scale[1] - 1) > 0.0001
        ) {
            e.__needTransform = true;
        } else {
            e.__needTransform = false;
        }
        // 设置默认的style属性
        e.style = e.style || {};
        e.style.__rect = null;  // 区域矩阵缓存，修改后清空，重新计算一次
    }

    /**
     * 添加
     * @param {Object} params 形状参数
     */
    function add(params) {
        //默认&必须的参数, 这里不包括style值
        const e = {
            'shape': 'circle',                      // 形状
            'id': params.id || self.newShapeId(),   // 唯一标识
            'zlevel': 0,                            // z轴位置
            'draggable': false,                     // draggable可拖拽
            'clickable': false,                     // clickable可点击响应
            'hoverable': true,                      // hoverable可悬浮响应
            'position': [0, 0],
            'rotation': [0, 0, 0],
            'scale': [1, 1, 0, 0]
        };
        // 合并之后的e就是混合了用户参数和默认参数的形状对象
        util.merge(e, params, {
                'overwrite': true,
                'recursive': true
            }
        );
        // 对形状增加一些标志位,包括"是否hover","是否transform"
        // 并设置默认style属性,并清空style中的区域矩阵缓存
        _mark(e);
        // 把形状id加入索引map
        _elements[e.id] = e;
        // 所有形状的z轴方向排列
        _zElements[e.zlevel] = _zElements[e.zlevel] || [];
        _zElements[e.zlevel].push(e);
        // 获得最大的Z轴方向
        _maxZlevel = Math.max(_maxZlevel, e.zlevel);
        // 有数据改变的zlevel
        _changedZlevel[e.zlevel] = true;

        // 返回的是Storage对象,方便链式调用继续增加对象
        return self;
    }

    /**
     * 根据指定的shapeId获取相应的shape属性
     * @param {string=} idx 唯一标识
     */
    function get(shapeId) {
        return _elements[shapeId];
    }

    /**
     * 删除，shapeId不指定则全清空
     * @param {string=} idx 唯一标识
     */
    function del(shapeId) {
        if (typeof shapeId != 'undefined') {
            if (_elements[shapeId]) {
                _changedZlevel[_elements[shapeId].zlevel] = true;
                var oldList = _zElements[_elements[shapeId].zlevel];
                var newList = [];
                for (var i = 0, l = oldList.length; i < l; i++) {
                    if (oldList[i].id != shapeId) {
                        newList.push(oldList[i]);
                    }
                }
                _zElements[_elements[shapeId].zlevel] = newList;
                delete _elements[shapeId];
            }
        } else {
            //不指定shapeId清空
            _elements = {};
            _zElements = [];
            _hoverElements = [];
            _maxZlevel = 0;         //最大zlevel
            _changedZlevel = {      //有数据改变的zlevel
                all: true
            };
        }

        return self;
    }

    /**
     * 修改
     * @param {string} idx 唯一标识
     * @param {Object} params]参数
     */
    function mod(shapeId, params) {
        var e = _elements[shapeId];
        if (e) {
            _changedZlevel[e.zlevel] = true;
            util.merge(
                e,
                params,
                {
                    'overwrite': true,
                    'recursive': true
                }
            );
            _mark(e);
            _changedZlevel[e.zlevel] = true;
            _maxZlevel = Math.max(_maxZlevel, e.zlevel);
        }

        return self;
    }

    /**
     * 常规形状位置漂移，形状自身定义漂移函数
     * @param {string} idx 形状唯一标识
     *
     */
    function drift(shapeId, dx, dy) {
        var e = _elements[shapeId];
        e.__needTransform = true;
        if (!e.ondrift //ondrift
            //有onbrush并且调用执行返回false或undefined则继续
            || (e.ondrift && !e.ondrift(e, dx, dy))
        ) {
            if (catchBrushException) {
                try {
                    shape.get(e.shape).drift(e, dx, dy);
                } catch (error) {
                    logger.log(error, 'drift error of ' + e.shape, e);
                }
            } else {
                shape.get(e.shape).drift(e, dx, dy);
            }
        }

        _changedZlevel[e.zlevel] = true;

        return self;
    }

    /**
     * 添加高亮层数据
     * @param {Object} params 参数
     */
    function addHover(params) {
        if ((params.rotation && Math.abs(params.rotation[0]) > 0.0001)
            || (params.position
                && (Math.abs(params.position[0]) > 0.0001
                    || Math.abs(params.position[1]) > 0.0001))
            || (params.scale
                && (Math.abs(params.scale[0] - 1) > 0.0001
                    || Math.abs(params.scale[1] - 1) > 0.0001))
        ) {
            params.__needTransform = true;
        } else {
            params.__needTransform = false;
        }

        _hoverElements.push(params);
        return self;
    }

    /**
     * 删除高亮层数据
     */
    function delHover() {
        _hoverElements = [];
        return self;
    }

    /**
     * 是否有高亮图层
     * @returns {boolean}
     */
    function hasHoverShape() {
        return _hoverElements.length > 0;
    }

    /**
     * 遍历迭代器
     * @param {Function} fun 迭代回调函数，return true终止迭代
     * @param {Object=} option 迭代参数，缺省为仅降序遍历常规形状
     *     hover : true 是否迭代高亮层数据
     *     normal : 'down' | 'up' | 'free' 是否迭代常规数据，迭代时是否指定及z轴顺序
     */
    function iterShape(fun, option) {
        if (!option) {
            option = {
                hover: false,
                normal: 'down'
            };
        }
        if (option.hover) {
            //高亮层数据遍历
            for (var i = 0, l = _hoverElements.length; i < l; i++) {
                if (fun(_hoverElements[i])) {
                    return self;
                }
            }
        }

        var zlist;
        var len;
        if (typeof option.normal != 'undefined') {
            //z轴遍历: 'down' | 'up' | 'free'
            switch (option.normal) {
                case 'down':
                    //降序遍历，高层优先
                    for (var l = _zElements.length - 1; l >= 0; l--) {
                        zlist = _zElements[l];
                        if (zlist) {
                            len = zlist.length;
                            while (len--) {
                                if (fun(zlist[len])) {
                                    return self;
                                }
                            }
                        }
                    }
                    break;
                case 'up':
                    //升序遍历，底层优先
                    for (var i = 0, l = _zElements.length; i < l; i++) {
                        zlist = _zElements[i];
                        if (zlist) {
                            len = zlist.length;
                            for (var k = 0; k < len; k++) {
                                if (fun(zlist[k])) {
                                    return self;
                                }
                            }
                        }
                    }
                    break;
                // case 'free':
                default:
                    //无序遍历
                    for (var i in _elements) {
                        if (fun(_elements[i])) {
                            return self;
                        }
                    }
                    break;
            }
        }

        return self;
    }

    function getMaxZlevel() {
        return _maxZlevel;
    }

    function getChangedZlevel() {
        return _changedZlevel;
    }

    function clearChangedZlevel() {
        _changedZlevel = {};
        return self;
    }

    function setChangedZlevle(level) {
        _changedZlevel[level] = true;
        return self;
    }

    /**
     * 释放
     */
    function dispose() {
        _elements = null;
        _zElements = null;
        _hoverElements = null;
        self = null;

        return;
    }

    self.newShapeId = newShapeId;
    self.add = add;
    self.get = get;
    self.del = del;
    self.addHover = addHover;
    self.delHover = delHover;
    self.hasHoverShape = hasHoverShape;
    self.mod = mod;
    self.drift = drift;
    self.iterShape = iterShape;
    self.getMaxZlevel = getMaxZlevel;
    self.getChangedZlevel = getChangedZlevel;
    self.clearChangedZlevel = clearChangedZlevel;
    self.setChangedZlevle = setChangedZlevle;
    self.dispose = dispose;
}