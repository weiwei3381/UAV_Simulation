/**
 * zrender: shape仓库
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @desc zrender是一个轻量级的Canvas类库，MVC封装，数据驱动，提供类Dom事件模型。
 * @author Kener (@Kener-林峰, linzhifeng@baidu.com)
 *
 */
import Circle from './shape/circle'
import Ellipse from './shape/ellipse'
import Line from './shape/line'
import Polygon from './shape/polygon'
import BrokenLine from './shape/brokenLine'
import Rectangle from './shape/rectangle'
import Ring from './shape/ring'
import Sector from './shape/sector'
import Text from './shape/text'
import Heart from './shape/heart'
import Droplet from './shape/droplet'
import Path from './shape/path'
import ZImage from './shape/image'
import Beziercurve from './shape/beziercurve'
import Star from './shape/star'
import Isogon from './shape/isogon'
import Trochoid from './shape/trochoid'
import Rose from './shape/rose'


var self = {};

var _shapeLibrary = {};     //shape库

/**
 * 定义图形实现
 * @param {Object} name
 * @param {Object} clazz 图形实现
 */
self.define = function (name, clazz) {
    _shapeLibrary[name] = clazz;
    return self;
};

/**
 * 获取图形实现
 * @param {Object} name
 */
self.get = function (name) {
    return _shapeLibrary[name];
};

// 内置图形注册
self.define('circle', new Circle());
self.define('ellipse', new Ellipse());
self.define('line', new Line());
self.define('polygon', new Polygon());
self.define('brokenLine', new BrokenLine());
self.define('rectangle', new Rectangle());
self.define('ring', new Ring());
self.define('sector', new Sector());
self.define('text', new Text());
self.define('heart', new Heart());
self.define('droplet', new Droplet());
self.define('path', new Path());
self.define('image', new ZImage());
self.define('beziercurve', new Beziercurve());
self.define('star', new Star());
self.define('isogon', new Isogon());
self.define('trochoid', new Trochoid());
self.define('rose', new Rose());

export default self