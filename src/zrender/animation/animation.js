/**
 * 动画主类, 调度和管理所有动画控制器
 *
 * @author lang(shenyi01@baidu.com)
 *
 * @class : Animation
 * @config : stage(optional) 绘制类, 需要提供update接口
 * @config : fps(optional) 帧率, 是自动更新动画的时候需要提供
 * @config : onframe(optional)
 * @method : add
 * @method : remove
 * @method : update
 * @method : start
 * @method : stop
 */
import Controller from './controller'
import util from '../tool/util'

var Animation = function (options) {

    options = options || {};
    //  stage(optional) 绘制类, 需要提供update接口
    this.stage = options.stage || {};
    // 每次动画运行完的回调函数
    this.onframe = options.onframe || function () {
    };

    // 私有属性
    this._controllerPool = [];

    this._running = false;
};

// 帧数默认为60帧, 需传入回调函数,保证每秒执行60次
const requrestAnimationFrame = window.requrestAnimationFrame
    || window.mozRequestAnimationFrame
    || window.webkitRequestAnimationFrame
    || function (callback) {
        window.setTimeout(
            callback, 1000 / 60
        );
    };

Animation.prototype = {
    add: function (controller) {
        this._controllerPool.push(controller);
    },
    remove: function (controller) {
        var idx = util.indexOf(this._controllerPool, controller);
        if (idx >= 0) {
            this._controllerPool.splice(idx, 1);
        }
    },
    // 动画更新函数, 每隔16ms运行一次
    update: function () {
        // 记录开始时间
        const time = new Date().getTime();
        // 控制池
        const cp = this._controllerPool;
        // 控制池大小
        let len = cp.length;

        const deferredEvents = [];
        const deferredCtls = [];
        for (let i = 0; i < len; i++) {
            const controller = cp[i];
            // 根据当前时间获得控制器
            const e = controller.step(time);
            // 需要在stage.update之后调用的事件，例如destroy
            if (e) {
                deferredEvents.push(e);
                deferredCtls.push(controller);
            }
        }
        if (this.stage && this.stage.update && this._controllerPool.length
        ) {
            this.stage.update();
        }

        // 删除动画完成的控制器
        const newArray = [];
        for (let i = 0; i < len; i++) {
            if (!cp[i]._needsRemove) {
                newArray.push(cp[i]);
                cp[i]._needsRemove = false;
            }
        }
        this._controllerPool = newArray;

        len = deferredEvents.length;
        for (var i = 0; i < len; i++) {
            deferredCtls[i].fire(deferredEvents[i]);
        }
        // 每次动画运行完的回调
        this.onframe();

    },
    // 启用start函数之后每隔1000/60毫秒(fps默认为60)事件就会刷新
    // 也可以不使用animation的start函数
    // 手动每一帧去调用update函数更新状态
    start: function () {
        var self = this;
        // 开始运行设置为true, 修改animation的_running可以停止
        this._running = true;
        // 下述方法只能保证每一帧运行完之后,间隔1000/60毫秒执行下一次,
        // 但是由于运行update()也需要时间, 所以并不能保证最后结果是60帧
        function step() {
            if (self._running) {
                self.update();
                requrestAnimationFrame(step);
            }
        }

        requrestAnimationFrame(step);
    },
    // 停止运行动画
    stop: function () {
        this._running = false;
    },
    clear: function () {
        this._controllerPool = [];
    },
    // target是目标图形(shape或者属性), loop表示是否循环
    animate: function (target, loop, getter, setter) {
        var deferred = new Deferred(target, loop, getter, setter);
        deferred.animation = this;
        return deferred;
    }
};
Animation.prototype.constructor = Animation;

// 默认从target上读属性的函数
function _defaultGetter(target, key) {
    return target[key];
}

// 默认从target上写属性的函数
function _defaultSetter(target, key, value) {
    target[key] = value;
}

// 递归做插值
// TODO 对象的插值
function _interpolate(
    prevValue,
    nextValue,
    percent,
    target,
    propName,
    getter,
    setter
) {
    // 遍历数组做插值
    if (prevValue instanceof Array && nextValue instanceof Array) {
        const minLen = Math.min(prevValue.length, nextValue.length);
        var largerArray;
        var maxLen;
        var result = [];
        if (minLen === prevValue.length) {
            maxLen = nextValue.length;
            largerArray = nextValue;
        } else {
            maxLen = prevValue.length;
            largerArray = prevValue.length;
        }
        for (var i = 0; i < minLen; i++) {
            // target[propName] 作为新的target,
            // i 作为新的propName递归进行插值
            result.push(_interpolate(
                prevValue[i],
                nextValue[i],
                percent,
                getter(target, propName),
                i,
                getter,
                setter
            ));
        }
        // 赋值剩下不需要插值的数组项
        for (var i = minLen; i < maxLen; i++) {
            result.push(largerArray[i]);
        }

        setter(target, propName, result);
    } else {
        prevValue = parseFloat(prevValue);
        nextValue = parseFloat(nextValue);
        if (!isNaN(prevValue) && !isNaN(nextValue)) {
            var value = (nextValue - prevValue) * percent + prevValue;
            setter(target, propName, value);
            return value;
        }
    }
}

/**
 * 动画延后展示的类
 * @param target : 某个目标的属性, 一般是shape对象或者style属性
 * @param loop : 是否循环
 * @param getter : 默认从target上取属性的函数
 * @param setter : 默认从target上写属性的函数
 */
function Deferred(target, loop, getter, setter) {
    // 记录类, 记录各个属性情况
    this._tracks = {};
    // 目标是需要shape对象或者style属性
    this._target = target;
    // 默认不进行循环
    this._loop = loop || false;
    // getter和setter的默认值
    this._getter = getter || _defaultGetter;
    this._setter = setter || _defaultSetter;
    // 当前控制器数量
    this._controllerCount = 0;
    // 已经完成的控制器数量
    this._doneList = [];

    this._onframeList = [];

    this._controllerList = [];
}

Deferred.prototype = {
    // 使用when方法设置帧
    when: function (time /* ms */, props, easing) {
        for (var propName in props) {
            if (!this._tracks[propName]) {
                this._tracks[propName] = [];
                // 初始状态, 并没有easing(缓动)属性
                this._tracks[propName].push({
                    time: 0,
                    value: this._getter(this._target, propName)
                });
            }
            this._tracks[propName].push({
                time: time,
                value: props[propName],
                easing: easing
            });
        }
        return this;
    },
    during: function (callback) {
        this._onframeList.push(callback);
        return this;
    },
    start: function () {
        var self = this;
        var delay;
        var track;
        var trackMaxTime;

        function createOnframe(now, next, propName) {
            // 复制出新的数组，不然动画的时候改变数组的值也会影响到插值
            var prevValue = clone(now.value);
            var nextValue = clone(next.value);
            return function (target, schedule) {
                _interpolate(
                    prevValue,
                    nextValue,
                    schedule,
                    target,
                    propName,
                    self._getter,
                    self._setter
                );
                for (var i = 0; i < self._onframeList.length; i++) {
                    self._onframeList[i](target, schedule);
                }
            };
        }

        function ondestroy() {
            self._controllerCount--;
            if (self._controllerCount === 0) {
                var len = self._doneList.length;
                // 所有动画完成
                for (var i = 0; i < len; i++) {
                    self._doneList[i]();
                }
            }
        }

        for (var propName in this._tracks) {
            delay = 0;
            track = this._tracks[propName];
            // 获得的track是数组, 所以需要判断数组情况
            if (track.length) {
                // 获得最大时间, 不过这里只考虑用户按时间大小插入, 不考虑非线性情况
                trackMaxTime = track[track.length - 1].time;
            } else {
                continue;
            }
            for (var i = 0; i < track.length - 1; i++) {
                var now = track[i],
                    next = track[i + 1];

                var controller = new Controller({
                    target: self._target,
                    life: next.time - now.time,
                    delay: delay,
                    loop: self._loop,
                    // gap是循环的间隔时间,也就是loop如果为真的话,这一段下次多久开始
                    // 用整个这段时间 - 这个控制器用时, 就是等待时间
                    gap: trackMaxTime - (next.time - now.time),
                    easing: next.easing,
                    onframe: createOnframe(now, next, propName),
                    ondestroy: ondestroy
                });
                this._controllerList.push(controller);

                this._controllerCount++;
                delay = next.time;

                self.animation.add(controller);
            }
        }
        return this;
    },
    stop: function () {
        for (var i = 0; i < this._controllerList.length; i++) {
            var controller = this._controllerList[i];
            this.animation.remove(controller);
        }
    },
    done: function (func) {
        this._doneList.push(func);
        return this;
    }
};

function clone(value) {
    if (value && value instanceof Array) {
        return Array.prototype.slice.call(value);
    } else {
        return value;
    }
}

export default Animation;
