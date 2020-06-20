import zrender from './zrender/'
import zrColor from './zrender/tool/color'

// 初始化zrender
// 运行完毕之后获得一个ZRender对象
var zr = zrender.init(document.getElementById('Main'))
const height = zr.painter.getHeight()
const width = zr.painter.getWidth()

var uav = {
    shape: 'uav',
    id: zr.newShapeId(),
    position: [100 * Math.random(), 100 * Math.random()],
    scale: [1, 1],
    zlevel:1,
    // rotation: [2 * Math.PI, 0, 0],
    style: {
        w: 5,
        x: 0,
        y: 0,
        brushType: 'both',
        color: zrColor.random(),
        strokeColor: 'rgba(220, 20, 60, 0.8)',
        lineWidth: 2,
        text: 'uav_1',
        textPosition: 'top',
    },
    draggable: true,
}
zr.addShape(uav)

// 网格列表
const gridList = []
for (let column =0; column<5;column++){
    for (let row = 0; row < 5; row ++){
        gridList.push(
            {
                shape  : 'rectangle',
                id     : zr.newShapeId(),
                style  : {
                    x : row * (width / 5),
                    y : column * (height / 5),
                    width : width / 5,
                    height : height / 5,
                    color : zrColor.random(),
                },
            }
        )
    }
}

for(let zone of gridList ){
    zr.addShape(zone)
}



const shapeList = []
for (let i = 0; i < 5; i++) {
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
setInterval(() => {
    const i = Math.floor(Math.random() * 5)
    shapeList[i].position = [600 * Math.random(), 400 * Math.random()]
    zr.modShape(shapeList[i].id, shapeList[i]);
    zr.refresh()
}, 3000)


// 动画, .animate方法查找shapeId对象, path是改变里层属性, 例如style等
zr.animate(uav.id, '')
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
        zr.animate(uav.id)
            .when(2000, {
                rotation: [Math.PI * 2, 0, 0],
            }).start()
    }).start()

zr.animate(uav.id)
    .when(1000, {
        scale: [2, 2],
    })
    .start()
zr.animate(uav.id, 'style')
    .when(1000, {
        w: 100,
    })
    .when(2000, {
        w: 50,
    })
    .when(3000, {
        w: 10,
    })
    .when(4000, {
        w: 50,
    })
    .during(function (target) {
    })
    .start()

