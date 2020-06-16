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


const shape = {};

const _shapeLibrary = {};     //shape库

/**
 * 定义图形实现
 * @param {Object} name
 * @param {Object} clazz 图形实现
 */
shape.define = function (name, clazz) {
    _shapeLibrary[name] = clazz;
    return shape;
};

/**
 * 获取图形实现
 * @param {Object} name
 */
shape.get = function (name) {
    return _shapeLibrary[name];
};

// 内置图形注册
shape.define('circle', new Circle());
shape.define('ellipse', new Ellipse());
shape.define('line', new Line());
shape.define('polygon', new Polygon());
shape.define('brokenLine', new BrokenLine());
shape.define('rectangle', new Rectangle());
shape.define('ring', new Ring());
shape.define('sector', new Sector());
shape.define('text', new Text());
shape.define('heart', new Heart());
shape.define('droplet', new Droplet());
shape.define('path', new Path());
shape.define('image', new ZImage());
shape.define('beziercurve', new Beziercurve());
shape.define('star', new Star());
shape.define('isogon', new Isogon());
shape.define('trochoid', new Trochoid());
shape.define('rose', new Rose());

export default shape