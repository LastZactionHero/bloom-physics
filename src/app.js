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
    Bodies.rectangle(0, 0, 60, 1200, { isStatic: true }),
    Bodies.rectangle(1000, 0, 60, 1200, { isStatic: true })
]);

const circleDiameter = 20;
const launchOffset = 10;
for(var i = 0; i < 20; i++) {
    const circle = Bodies.circle(launchOffset + i * circleDiameter, launchOffset, circleDiameter)
    World.add(engine.world, circle)
}
// create two boxes and a ground

// var boxA = Bodies.rectangle(450, 50, 80, 80);
// var boxB = Bodies.rectangle(450, 50, 80, 80);


engine.world.gravity.x = -0.3;
engine.world.gravity.y = 1;

// add all of the bodies to the world

Events.on(engine, 'afterUpdate', function(timestamp) {
    if(timestamp.timestamp > 2000) {
        engine.world.bodies.forEach( function(body) {
            body.isStatic = true;
        });
    }
})

// run the engine
Engine.run(engine);

// run the renderer
Render.run(render);