import zrender from './zrender/'
import zrColor from './zrender/tool/color'

// 初始化zrender
// 运行完毕之后获得一个ZRender对象
var zr = zrender.init(document.getElementById('Main'))
var circle = {
    shape: 'circle',
    id: zr.newShapeId(),
    position: [100 * Math.random(), 100 * Math.random()],
    scale: [1, 1],
    style: {
        x: 0,
        y: 0,
        r: 50,
        brushType: 'both',
        color: zrColor.random(),
        strokeColor: 'rgba(220, 20, 60, 0.8)',
        lineWidth: 5,
        text: 'circle',
        textPosition: 'inside',
    },
    draggable: true,
}
zr.addShape(circle)
const shapeList = []
for (let i = 0; i < 20; i++) {
    shapeList[i] = {
        shape: 'circle',
        id: zr.newShapeId(),
        position: [600 * Math.random(), 400 * Math.random()],
        scale: [1, 1],
        style: {
            x: 0,
            y: 0,
            r: 50,
            brushType: 'both',
            color: zrColor.random(),
            strokeColor: 'rgba(220, 20, 60, 0.8)',
            lineWidth: 5,
            text: `circle_${i}`,
            textPosition: 'inside',
        },
        draggable: true,
    }
    zr.addShape(shapeList[i])
}
//首次绘图，创建各种dom和context, 并且把图形刷画出来
zr.render()
// 通过修改属性值改变图像样式, 数据驱动
setInterval(()=>{
    const i = Math.floor(Math.random()*20)
    shapeList[i].position = [600 * Math.random(), 400 * Math.random()]
    zr.modShape(shapeList[i].id, shapeList[i]);
    zr.refresh()
},500)


// 动画, .animate方法查找shapeId对象, path是改变里层属性, 例如style等
zr.animate(circle.id, '')
    .when(1000, {
        position: [200, 0],
    })
    .when(2000, {
        position: [200, 200],
    }, 'BounceIn')
    .when(3000, {
        position: [0, 200],
    })
    .when(4000, {
        position: [100, 100],
    })
    .done(function () {
        zr.animate(circle.id)
            .when(2000, {
                rotation: [Math.PI * 2, 0, 0],
            }).start()
    }).start()

zr.animate(circle.id)
    .when(1000, {
        scale: [2, 2],
    })
    .start()
zr.animate(circle.id, 'style')
    .when(1000, {
        r: 100,
    })
    .when(2000, {
        r: 50,
    })
    .when(3000, {
        r: 10,
    })
    .when(4000, {
        r: 50,
    })
    .during(function (target) {
    })
    .start()

