/**
 * zrender: core核心类
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @desc zrender是一个轻量级的Canvas类库，MVC封装，数据驱动，提供类Dom事件模型。
 * @author Kener (@Kener-林峰, linzhifeng@baidu.com)
 *
 */
import ZRender from './ZRender'

const zrender = {};  // 提供MVC内部反向使用静态方法；

let _idx = 0;           //ZRender instance's id
let _instances = {};    //ZRender实例map索引

/**
 * zrender初始化
 * 不让外部直接new ZRender实例，为啥？
 * 不为啥，提供全局可控同时减少全局污染和降低命名冲突的风险！
 *
 * @param {HTMLElement} dom dom对象，不帮你做document.getElementById了
 * @param {Object=} params 个性化参数，如自定义shape集合，带进来就好
 *
 * @return {ZRender} ZRender实例
 */
zrender.init = function (dom, params) {
    var zi = new ZRender(++_idx + '', dom, params || {});
    _instances[_idx] = zi;
    return zi;
};

/**
 * zrender实例销毁，记在_instances里的索引也会删除了
 * 管生就得管死，可以通过zrender.dispose(zi)销毁指定ZRender实例
 * 当然也可以直接zi.dispose()自己销毁
 *
 * @param {ZRender=} zi ZRender对象，不传则销毁全部
 */
zrender.dispose = function (zi) {
    if (zi) {
        zi.dispose();
    } else {
        for (var z in _instances) {
            _instances[z].dispose();
        }
        _instances = {};
    }
    return zrender;
};

/**
 * 获取zrender实例
 *
 * @param {string} id ZRender对象索引
 */
zrender.getInstance = function (id) {
    return _instances[id];
};

/**
 * 删除zrender实例，ZRender实例dispose时会调用，
 * 删除后getInstance则返回undefined
 * ps: 仅是删除，删除的实例不代表已经dispose了~~
 *     这是一个摆脱全局zrender.dispose()自动销毁的后门，
 *     take care of yourzrender~
 *
 * @param {string} id ZRender对象索引
 */
zrender.delInstance = function (id) {
    if (_instances[id]) {
        //只是对垃圾回收上的友好照顾，不写也大不了~
        _instances[id] = null;
        delete _instances[id];
    }
    return zrender;
};

export default zrender;