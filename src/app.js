import Matter from 'matter-js';
import MatterAttractors from 'matter-attractors';
Matter.use('matter-attractors');

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

const WORLD_WIDTH = 800;
const WORLD_HEIGHT = 600;

World.add(engine.world, [
    Bodies.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT - 1, WORLD_WIDTH, 10, { isStatic: true }),
    Bodies.rectangle(0, WORLD_HEIGHT / 2, 1, WORLD_HEIGHT, { isStatic: true }),
    Bodies.rectangle(WORLD_WIDTH - 1, WORLD_HEIGHT / 2, 1, WORLD_HEIGHT, { isStatic: true }),
]);



window.MatterAttractors = MatterAttractors;
MatterAttractors.Attractors.gravityConstant = 0.01;

const ATTRACTOR_RADIUS = 10
const leftCornerAttractorBody = Bodies.circle(ATTRACTOR_RADIUS * 1.5, WORLD_HEIGHT + ATTRACTOR_RADIUS, ATTRACTOR_RADIUS, {
  isStatic: true,
  mass: 1000,
  plugin: {
    attractors: [
      MatterAttractors.Attractors.gravity
    ]
  }
});

const rightCornerAttractorBody = Bodies.circle(WORLD_WIDTH - ATTRACTOR_RADIUS * 1.5, WORLD_HEIGHT + ATTRACTOR_RADIUS, ATTRACTOR_RADIUS, {
  isStatic: true,
  mass: 1000,
  plugin: {
    attractors: [
      MatterAttractors.Attractors.gravity
    ]
  }
});

World.add(engine.world, leftCornerAttractorBody)
World.add(engine.world, rightCornerAttractorBody)

for(var i = 0; i < 20; i++) {
  const xPosn = Math.random() * (WORLD_WIDTH - 2 * ATTRACTOR_RADIUS) + ATTRACTOR_RADIUS;
  const yPosn = 200 - Math.random() * WORLD_HEIGHT;
  const circleBody = Bodies.circle(xPosn, yPosn, 20, { label: 'my circle'});
  World.add(engine.world, circleBody)  
}
// const circleDiameter = 20;
// const launchOffset = 10;
// for(var i = 0; i < 20; i++) {
//     const circle = Bodies.circle(400 + i, launchOffset - i * circleDiameter, circleDiameter, { label: 'circle-left'})
//     World.add(engine.world, circle)
// }

engine.world.gravity.x = 0;
engine.world.gravity.y = 0.01;

// let sideChangeTriggered = false;
// Events.on(engine, 'afterUpdate', function(timestamp) {
//     if(timestamp.timestamp > 5000 && !sideChangeTriggered) {
//         sideChangeTriggered = true;
//         engine.world.bodies.forEach( function(body) {
//             if(body.label == 'circle-left') {
//                 body.isStatic = true;
//             }
//         });

//         engine.world.gravity.x = 2;
//         for(var i = 0; i < 20; i++) {
//             const circle = Bodies.circle(400 - i, launchOffset - i * circleDiameter, circleDiameter, { label: 'circle-left'})
//             World.add(engine.world, circle)
//         }
//     }
// })

// run the engine
Engine.run(engine);

// run the renderer
Render.run(render);
