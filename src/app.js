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

const boundaryFloor = Bodies.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT - 1, WORLD_WIDTH, 100, { isStatic: true });
const boundaryLeft = Bodies.rectangle(0, WORLD_HEIGHT / 2, 100, WORLD_HEIGHT, { isStatic: true });
const boundaryRight = Bodies.rectangle(WORLD_WIDTH - 1, WORLD_HEIGHT / 2, 100, WORLD_HEIGHT, { isStatic: true });

const dividers = [
  Bodies.rectangle(WORLD_WIDTH / 3, WORLD_HEIGHT / 2, 10, WORLD_HEIGHT, { isStatic: true }),
  Bodies.rectangle(WORLD_WIDTH - WORLD_WIDTH / 3, WORLD_HEIGHT / 2, 10, WORLD_HEIGHT, { isStatic: true })
]


World.add(engine.world, [
    boundaryFloor,
    boundaryLeft,
    boundaryRight

]);
World.add(engine.world, dividers);


const CIRCLE_RADIUS = 10;

for(var i = 0; i < 20; i++) {
  const xPosn = i % 2 == 0 ? 100 + 5 * Math.random() : WORLD_WIDTH - 100 - 5 * Math.random();
  const yPosn = 200 - Math.random() * WORLD_HEIGHT;

  const circleBody = Bodies.circle(xPosn, yPosn, 20, { label: 'my circle', mass: 100});
  World.add(engine.world, circleBody)
}

engine.world.gravity.x = 0;
engine.world.gravity.y = 0.1;

const keyframes = [
  { timestamp: 2000, action: 'remove_dividers', used: false}
];

Events.on(engine, "afterUpdate", function(event) {
  keyframes.forEach( function(keyframe) {
    if(keyframe.timestamp < event.timestamp && !keyframe.used) {
      keyframe.used = true;
      console.log("Keyframe Event:")
      console.log(keyframe)

      switch(keyframe.action) {
        case 'remove_dividers':
          // World.remove(engine.world, dividers)
          break;
        default:
          console.log("Unknown keyframe event!")
          break;
      }
    }
  })
});


// run the engine
for(i = 0; i < 5000; i++) {
  Engine.update(engine)
}
// World.remove(engine.world, dividers)
World.add(engine.world, [
  Bodies.circle(150, 400, 60, {isStatic: true}),
  Bodies.circle(400, 400, 60, {isStatic: true}),
  Bodies.circle(WORLD_WIDTH - 150, 400, 60, {isStatic: true}),
])
for(i = 0; i < 5000; i++) {
  Engine.update(engine)
}
World.remove(engine.world, dividers)
// Engine.run(engine); 

// run the renderer
Render.run(render);
