import Matter from 'matter-js';
import MatterAttractors from 'matter-attractors';
import CombinationProperties from './combination_properties';
import $ from 'jquery';

function plantAreaFt2(plant) {
  const avgWidthFt = plant.size.avg_width / 12
  return Math.PI * Math.pow(avgWidthFt / 2, 2)
}

const bedDimensions = { width: 30, depth: 6 }
const bedArea = bedDimensions.width * bedDimensions.depth;

// Load Combination Templates from API
const combinationTemplates = JSON.parse($.ajax({
  method: 'GET',
  url: 'http://api-search.plantwithbloom.com/combination_templates',
  async: false
}).responseText);

// Pick a random template and identify the plants
const template = combinationTemplates[Math.floor(combinationTemplates.length * Math.random())]
const plants = template.starting_plants.map( (p) => { return p.plant });
const colors = ['#1abc9c', '#3498db', '#9b59b6', '#e74c3c']
plants.forEach( (plant, idx) => {
  plant.renderColor = colors[idx];
  plant.size.area = plantAreaFt2(plant)
})



// Pick a random CombiationProperty definition
const combinationProperties = CombinationProperties[plants.length][Math.floor(CombinationProperties[plants.length].length * Math.random())]

// Self-select plants into properties
// Randomly assign
combinationProperties.forEach( (property, idx) => {
  plants[idx].property_type = property
});

// Reassign if better
for(let a = 0; a < plants.length; a++) {
  for(let b = 0; b < plants.length; b++) {
    const plantA = plants[a];
    const plantB = plants[b];

    if(plantA.property_type.property == 'tall_back' && plantB.property_type.property == 'short_front') {
      // Reverse: Shorter plant is taller
      if(plantA.size.avg_height < plantB.size.avg_height) {
        const temp = plantA.property_type
        plantA.property_type = plantB.property_type
        plantB.property_type = temp;
      }
    }
  }
}

let inventory = [];

// Pick an ideal plant count to fill the space
plants.forEach( (plant) => {
  const plantAreaToFill = plant.property_type.area * bedArea
  let plantQuantity = Math.floor(plantAreaToFill / plant.size.area)

  // Odd numbers
  if(plantQuantity > 1 && plantQuantity % 2 == 0) {
    plantQuantity -= 1;
  }

  for(var i = 0; i < plantQuantity; i++) {
    inventory.push(plant.permalink);
  }
});


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

const BOUNDARY_SPACE = 100;
const WORLD_WIDTH = bedDimensions.depth * 12 + 2 * BOUNDARY_SPACE;
const WORLD_HEIGHT = bedDimensions.width * 12 + BOUNDARY_SPACE;

const boundaryFloor = Bodies.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT + BOUNDARY_SPACE / 2 - 1, WORLD_WIDTH + BOUNDARY_SPACE, BOUNDARY_SPACE, { isStatic: true });
const boundaryLeft = Bodies.rectangle(0, WORLD_HEIGHT / 2, BOUNDARY_SPACE, WORLD_HEIGHT, { isStatic: true });
const boundaryRight = Bodies.rectangle(WORLD_WIDTH - 1, WORLD_HEIGHT / 2, BOUNDARY_SPACE, WORLD_HEIGHT, { isStatic: true });
const boundaryCeil = Bodies.rectangle(WORLD_WIDTH / 2, 0 - BOUNDARY_SPACE / 2, WORLD_WIDTH + BOUNDARY_SPACE, BOUNDARY_SPACE, { isStatic: true });

World.add(engine.world, [
    boundaryFloor,
    boundaryLeft,
    boundaryRight

]);

engine.world.gravity.x = 0;
engine.world.gravity.y = 3;

let lastPermalink = inventory[0];
let lastYDrop = bedDimensions.width * 12 - 10;
let dividers = [];
inventory.forEach( (permalink, inventoryIdx) => {
  const plant = plants.find( (plant) => { return plant.permalink == permalink});

  if(lastPermalink != plant.permalink) {
    const dividerBody = Bodies.rectangle(BOUNDARY_SPACE / 2 + (170) / 2, lastYDrop - 200, 170 , 50, { label: 'divider', mass: 100 });
    dividers.push(dividerBody)
    World.add(engine.world, dividerBody);

    lastPermalink = plant.permalink;
    lastYDrop -= 400;
  }

  const xPosn = inventoryIdx % 2 == 0 ? BOUNDARY_SPACE / 2 + plant.size.avg_width + 10 * Math.random() : WORLD_WIDTH - BOUNDARY_SPACE/2 - plant.size.avg_width - 10 * Math.random();
  const yPosn = lastYDrop - 2 * plant.size.avg_width;
  lastYDrop = yPosn;

  const circleBody = Bodies.circle(xPosn, yPosn, plant.size.avg_width, { label: plant.permalink, render: { strokeStyle: plant.renderColor, lineWidth: 1, fillStyle: plant.renderColor}});
  World.add(engine.world, circleBody);
})

let removedDividers = false;
Events.on(engine, 'afterUpdate', (event) => {
  if(event.timestamp > 3000) {
    World.add(engine.world, boundaryCeil);
    engine.world.gravity.x = 0.0;
    engine.world.gravity.y = -1;
  }
  if(event.timestamp > 3500) {
    if(!removedDividers) {
      removedDividers = true;
      World.remove(engine.world, dividers);
    }

    engine.world.gravity.x = 1;
    engine.world.gravity.y = 0.0;
  }

  // Jiggle
  if(event.timestamp > 5000) {
    engine.world.gravity.x = -0.5
    engine.world.gravity.y = -0.5
  }
  if(event.timestamp > 5500) {
    engine.world.gravity.x = 0.5
    engine.world.gravity.y = -0.5
  }
  if(event.timestamp > 6000) {
    engine.world.gravity.x = 0.5
    engine.world.gravity.y = 0.5
  }
  if(event.timestamp > 6500) {
    engine.world.gravity.x = -0.5
    engine.world.gravity.y = 0.5
  }
  if(event.timestamp > 7000) {
    engine.world.gravity.x = 0.1
    engine.world.gravity.y = 0
  }
});
Engine.run(engine);

// run the renderer
render.options.wireframes = false;
Render.run(render);
