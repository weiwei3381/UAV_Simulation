import zrender from './zrender/zrender'

console.log("begin")
// 初始化zrender
var zr = zrender.init(document.getElementById('Main'))
var circle = {
    shape: 'circle',
    id: zr.newShapeId(),
    position: [100, 100],
    scale: [1, 1],
    style: {
        x: 0,
        y: 0,
        r: 50,
        brushType: 'both',
        color: 'rgba(220, 20, 60, 0.8)',
        strokeColor: 'rgba(220, 20, 60, 0.8)',
        lineWidth: 5,
        text: 'circle',
        textPosition: 'inside',
    },
    draggable: true,
    onmouseover: function () {
        zr.animate(circle.id, 'style')
            .when(1000, {
                r: 100,
            })
            .when(2000, {
                r: 50,
            })
            .start()
    },
}
zr.addShape(circle)
zr.render()

var tm1 = zr
    .animate(circle.id, '')
    .when(1000, {
        position: [200, 0],
    })
    .when(
        2000,
        {
            position: [200, 200],
        },
        'BounceIn'
    )
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
            })
            .start()
    })
    .start()

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