import Matter from 'matter-js';

var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Events = Matter.Events;

// create an engine
window.engine = Engine.create();

// create a renderer
var render = Render.create({
    element: document.body,
    engine: engine
});


World.add(engine.world, [   
    Bodies.rectangle(400, 610, 810, 60, { isStatic: true }),
    Bodies.rectangle(0, 0, 60, 1220, { isStatic: true }),
    Bodies.rectangle(800, 0, 60, 1220, { isStatic: true }),
    Bodies.circle(150, 400, 80, {isStatic: true}),
    Bodies.circle(400, 400, 80, {isStatic: true}),
    Bodies.circle(650, 400, 80, {isStatic: true}),
]);

const circleDiameter = 20;
const launchOffset = 10;
for(var i = 0; i < 20; i++) {
    const circle = Bodies.circle(400 + i, launchOffset - i * circleDiameter, circleDiameter, { label: 'circle-left'})
    World.add(engine.world, circle)
}
// create two boxes and a ground

// var boxA = Bodies.rectangle(450, 50, 80, 80);
// var boxB = Bodies.rectangle(450, 50, 80, 80);


engine.world.gravity.x = -2;
engine.world.gravity.y = 5;

// add all of the bodies to the world

let sideChangeTriggered = false;
Events.on(engine, 'afterUpdate', function(timestamp) {
    if(timestamp.timestamp > 5000 && !sideChangeTriggered) {
        sideChangeTriggered = true;
        engine.world.bodies.forEach( function(body) {
            if(body.label == 'circle-left') {
                body.isStatic = true;
            }
        });

        engine.world.gravity.x = 2;
        for(var i = 0; i < 20; i++) {
            const circle = Bodies.circle(400 - i, launchOffset - i * circleDiameter, circleDiameter, { label: 'circle-left'})
            World.add(engine.world, circle)
        }
    }
})

// run the engine
Engine.run(engine);

// run the renderer
Render.run(render);