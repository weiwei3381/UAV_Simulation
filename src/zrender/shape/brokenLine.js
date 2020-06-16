/**
 * zrender
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @author Kener (@Kener-林峰, linzhifeng@baidu.com)
 *
 * shape类：折线
 * 可配图形属性：
 {
       // 基础属性
       shape  : 'brokenLine',         // 必须，shape类标识，需要显式指定
       id     : {string},       // 必须，图形唯一标识，可通过zrender实例方法newShapeId生成
       zlevel : {number},       // 默认为0，z层level，决定绘画在哪层canvas中
       invisible : {boolean},   // 默认为false，是否可见

       // 样式属性，默认状态样式样式属性
       style  : {
           pointList     : {Array},   // 必须，各个顶角坐标
           strokeColor   : {color},   // 默认为'#000'，线条颜色（轮廓），支持rgba
           lineType      : {string},  // 默认为solid，线条类型，solid | dashed | dotted
           lineWidth     : {number},  // 默认为1，线条宽度
           lineCap       : {string},  // 默认为butt，线帽样式。butt | round | square
           lineJoin      : {string},  // 默认为miter，线段连接样式。miter | round | bevel
           miterLimit    : {number},  // 默认为10，最大斜接长度，仅当lineJoin为miter时生效

           opacity       : {number},  // 默认为1，透明度设置，如果color为rgba，则最终透明度效果叠加
           shadowBlur    : {number},  // 默认为0，阴影模糊度，大于0有效
           shadowColor   : {color},   // 默认为'#000'，阴影色彩，支持rgba
           shadowOffsetX : {number},  // 默认为0，阴影横向偏移，正值往右，负值往左
           shadowOffsetY : {number},  // 默认为0，阴影纵向偏移，正值往下，负值往上

           text          : {string},  // 默认为null，附加文本
           textFont      : {string},  // 默认为null，附加文本样式，eg:'bold 18px verdana'
           textPosition  : {string},  // 默认为end，附加文本位置。
                                      // start | end
           textAlign     : {string},  // 默认根据textPosition自动设置，附加文本水平对齐。
                                      // start | end | left | right | center
           textBaseline  : {string},  // 默认根据textPosition自动设置，附加文本垂直对齐。
                                      // top | bottom | middle |
                                      // alphabetic | hanging | ideographic
           textColor     : {color},   // 默认根据textPosition自动设置，默认策略如下，附加文本颜色
                                      // 'inside' ? '#000' : color
       },

       // 样式属性，高亮样式属性，当不存在highlightStyle时使用基于默认样式扩展显示
       highlightStyle : {
           // 同style
       }

       // 交互属性，详见shape.Base

       // 事件属性，详见shape.Base
   }
 例子：
 {
       shape  : 'brokenLine',
       id     : '123456',
       zlevel : 1,
       style  : {
           pointList : [[10, 10], [300, 20], [298, 400], [50, 450]],
           strokeColor : '#eee',
           lineWidth : 20,
           text : 'Baidu'
       },
       myName : 'kener',  //可自带任何有效自定义属性

       clickable : true,
       onClick : function(eventPacket) {
           alert(eventPacket.target.myName);
       }
   }
 */

import base from './base'
import Polygon from './polygon'

function BrokenLine() {
    this.type = 'brokenLine';
    this.brushTypeOnly = 'stroke';  //线条只能描边，填充后果自负
    this.textPosition = 'end';
}

BrokenLine.prototype = {
    /**
     * 创建多边形路径
     * @param {Context2D} ctx Canvas 2D上下文
     * @param {Object} style 样式
     */
    buildPath: function (ctx, style) {
        var pointList = style.pointList;
        if (pointList.length < 2) {
            // 少于2个点就不画了~
            return;
        }
        if (!style.lineType || style.lineType == 'solid') {
            //默认为实线
            ctx.moveTo(pointList[0][0], pointList[0][1]);
            for (var i = 1, l = pointList.length; i < l; i++) {
                ctx.lineTo(pointList[i][0], pointList[i][1]);
            }
        } else if (style.lineType == 'dashed'
            || style.lineType == 'dotted'
        ) {
            //画虚线的方法  by loutongbing@baidu.com
            var lineWidth = style.lineWidth || 1;
            var dashPattern = [
                lineWidth * (style.lineType == 'dashed' ? 6 : 1),
                lineWidth * 4
            ];
            ctx.moveTo(pointList[0][0], pointList[0][1]);
            for (var i = 1, l = pointList.length; i < l; i++) {
                var fromX = pointList[i - 1][0];
                var toX = pointList[i][0];
                var fromY = pointList[i - 1][1];
                var toY = pointList[i][1];
                var dx = toX - fromX;
                var dy = toY - fromY;
                var angle = Math.atan2(dy, dx);
                var x = fromX;
                var y = fromY;
                var idx = 0;
                var draw = true;
                var dashLength;
                var nx;
                var ny;

                while (!((dx < 0 ? x <= toX : x >= toX)
                    && (dy < 0 ? y <= toY : y >= toY))
                    ) {
                    dashLength = dashPattern[
                    idx++ % dashPattern.length
                        ];
                    nx = x + (Math.cos(angle) * dashLength);
                    x = dx < 0 ? Math.max(toX, nx) : Math.min(toX, nx);
                    ny = y + (Math.sin(angle) * dashLength);
                    y = dy < 0 ? Math.max(toY, ny) : Math.min(toY, ny);
                    if (draw) {
                        ctx.lineTo(x, y);
                    } else {
                        ctx.moveTo(x, y);
                    }
                    draw = !draw;
                }
            }
        }

        return;
    },

    /**
     * 返回矩形区域，用于局部刷新和文字定位
     * @param {Object} style
     */
    getRect: function (style) {
        return new Polygon().getRect(style);
    }
};

base.derive(BrokenLine);


export default BrokenLine;