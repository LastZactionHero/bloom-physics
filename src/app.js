// TODO:
// - Fetch similar plants, filtering by bed width
// - Fetch only plants with widths

import Matter from 'matter-js';
import MatterAttractors from 'matter-attractors';
import $ from 'jquery';

function plantAreaFt2(plant) {
  const avgWidthFt = plant.size.avg_width / 12
  return Math.PI * Math.pow(avgWidthFt / 2, 2)
}

var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Events = Matter.Events,
    Constraint = Matter.Constraint,
    Composites = Matter.Composites,
    Composite = Matter.Composite;

// create an engine
window.engine = Engine.create();
engine.world.gravity.x = 0.5;
engine.world.gravity.y = 0;

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 1200;

// create a renderer
var render = Render.create({
    element: document.body,
    engine: engine,
    options: {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT
    }
});


const bedDimensions = { width: 15, depth: 5 } // feet
const bedArea = bedDimensions.width * bedDimensions.depth; // feet^2

const BOUNDARY_BUFFER = 400;

const COLOR_CHUTE = "#2c3e50";
const COLOR_CHUTE_EXT = "#95a5a6";

const boundaryTop = Bodies.rectangle(
  CANVAS_WIDTH / 2,
  CANVAS_HEIGHT / 2 - bedDimensions.depth * 12 / 2 - BOUNDARY_BUFFER / 2,
  bedDimensions.width * 12,
  BOUNDARY_BUFFER,
  { isStatic: true, render: { fillStyle: COLOR_CHUTE } });
World.add(engine.world, boundaryTop);

const boundaryBottom = Bodies.rectangle(
  CANVAS_WIDTH / 2,
  CANVAS_HEIGHT / 2 + bedDimensions.depth * 12 / 2 + BOUNDARY_BUFFER / 2,
  bedDimensions.width * 12,
  BOUNDARY_BUFFER,
  { isStatic: true, render: { fillStyle: COLOR_CHUTE } });
World.add(engine.world, boundaryBottom);

const boundaryRight= Bodies.rectangle(
  CANVAS_WIDTH / 2 + BOUNDARY_BUFFER / 2 + bedDimensions.width * 12 / 2,
  CANVAS_HEIGHT / 2,
  BOUNDARY_BUFFER,
  BOUNDARY_BUFFER * 2 + bedDimensions.depth * 12,
  { isStatic: true, render: { fillStyle: COLOR_CHUTE } });
World.add(engine.world, boundaryRight);

const boundaryExtTop = Bodies.rectangle(
  CANVAS_WIDTH / 2 - bedDimensions.width * 12,
  CANVAS_HEIGHT / 2 - bedDimensions.depth * 12 / 2 - BOUNDARY_BUFFER / 2,
  bedDimensions.width * 12,
  BOUNDARY_BUFFER,
  { isStatic: true, render: { fillStyle: COLOR_CHUTE_EXT } });
World.add(engine.world, boundaryExtTop);

const boundaryExtBottom = Bodies.rectangle(
  CANVAS_WIDTH / 2 - bedDimensions.width * 12,
  CANVAS_HEIGHT / 2 + bedDimensions.depth * 12 / 2 + BOUNDARY_BUFFER / 2,
  bedDimensions.width * 12,
  BOUNDARY_BUFFER,
  { isStatic: true, render: { fillStyle: COLOR_CHUTE_EXT } });
World.add(engine.world, boundaryExtBottom);

const boundaryCap = Bodies.rectangle(
  CANVAS_WIDTH / 2 - bedDimensions.width * 12,
  CANVAS_HEIGHT / 2,
  bedDimensions.width * 12,
  bedDimensions.depth * 12,
  { isStatic: true, render: { fillStyle: COLOR_CHUTE } });


// // Load Combination Templates from API
const combinationTemplates = JSON.parse($.ajax({
  method: 'GET',
  url: 'http://api-search.plantwithbloom.com/combination_templates',
  async: false
}).responseText);

// // Pick a random template and identify the plants
// const template = combinationTemplates[Math.floor(combinationTemplates.length * Math.random())]
const template  = combinationTemplates[8];
let plants = template.starting_plants.map( (p) => {
  const plant = p.plant
  plant.property_type = { property: p.placement, area: p.area }
  return plant
});
console.log(template)

const colors = ['#1abc9c', '#3498db', '#9b59b6', '#e74c3c']
plants.forEach( (plant, idx) => {
  plant.renderColor = colors[idx];
  plant.size.area = plantAreaFt2(plant)
});

const sortOrder = ['lone', 'tall_back', 'short_front']

// Sort by property type
plants = plants.sort( (a,b) => {
  return sortOrder.indexOf(a.property_type.property) > sortOrder.indexOf(b.property_type.property)
});

let inventory = [];

// Pick an ideal plant count to fill the space
plants.forEach( (plant) => {
  const plantAreaToFill = plant.property_type.area * bedArea
  let plantQuantity = Math.floor(plantAreaToFill / plant.size.area)

  // Odd numbers
  if(plantQuantity > 1 && plantQuantity % 2 == 0) {
    plantQuantity -= 1;
  }

  // Force atleast 1
  if(plantQuantity < 1) {
    plantQuantity = 1;
  }

  let inventoryPlant = []
  for(var i = 0; i < plantQuantity; i++) {
    inventoryPlant.push(plant.permalink);
  }

  inventory.push(inventoryPlant)
});


let dividers = [];
let lastPermalink = inventory[0][0];
let lastXPosition = 0;
let tallBackStartXPosition = 0;
const DIVIDER_SIZE = 20;

inventory.forEach( (inventoryPlant, inventoryPlantIdx) => {
  let rope = Composites.stack();

  inventoryPlant.forEach( (permalink, inventoryIdx) => {
    const plant = plants.find( (plant) => { return plant.permalink == permalink});

    if(lastPermalink && lastPermalink != plant.permalink) {
      if(plant.property_type.property == 'short_front') {
        lastXPosition = tallBackStartXPosition;
      } else {
        lastXPosition -= DIVIDER_SIZE;
        const dividerBody = Bodies.rectangle(lastXPosition, CANVAS_HEIGHT / 2, DIVIDER_SIZE, bedDimensions.depth * 12, { label: 'divider', mass: 10 });
        dividers.push(dividerBody)
        World.add(engine.world, dividerBody);
      
        lastXPosition - 200;
      }
    }
    
    let xPosn = null;
    if(lastXPosition == 0) {
      xPosn = CANVAS_WIDTH / 2 + bedDimensions.width * 12 / 2 - plant.size.avg_width;
    } else {
      xPosn = lastXPosition -= plant.size.avg_width;
    }

    if(lastPermalink != plant.permalink && plant.property_type.property == 'tall_back') {
      tallBackStartXPosition = xPosn;
    }

    let yPosn = CANVAS_HEIGHT / 2 + ( inventoryIdx % 2 == 0 ? 10 * Math.random() : -10 * Math.random() )
    if(plant.property_type.property == 'tall_back') {
      yPosn = CANVAS_HEIGHT / 2 - (bedDimensions.depth * 12 / 2) + plant.size.avg_width / 2;
      if(inventoryIdx % 2 == 0) {
        yPosn += plant.size.avg_width / 2;
      }
    } else if (plant.property_type.property == 'short_front') {
      if(inventoryIdx % 2 == 0) {
        yPosn += plant.size.avg_width / 2;
      }
      yPosn = CANVAS_HEIGHT / 2 + (bedDimensions.depth * 12 / 2) - plant.size.avg_width / 2;
    }

    const circleBody = Bodies.circle(xPosn, yPosn, plant.size.avg_width / 2, { label: plant.permalink, render: { strokeStyle: plant.renderColor, lineWidth: 1, fillStyle: plant.renderColor}});

    if(plant.property_type.property == 'tall_back' || plant.property_type.property == 'short_front') {
      rope.bodies.push(circleBody);
    } else {
      World.add(engine.world, circleBody);
    }
    
    if(rope.bodies.length > 0 && inventoryIdx == inventoryPlant.length - 1) {
      Composites.chain(rope, 0, 0, 0, 0, { stiffness: 0.2, length: plant.size.avg_width * 1.125 });
      World.add(engine.world, rope);
    }

    lastXPosition = xPosn - plant.size.avg_width / 4;
    lastPermalink = plant.permalink;
  });


});


let removedDividers = false;
const DROP_END_TIME = 4000;

Events.on(engine, 'afterUpdate', (event) => {
  if(event.timestamp > DROP_END_TIME) {
    
    engine.world.gravity.x = 0.0;
    engine.world.gravity.y = 0.01;
    World.add(engine.world, boundaryCap);
  }
  if(event.timestamp > DROP_END_TIME + 500) {
    if(!removedDividers) {
      removedDividers = true;
      // World.remove(engine.world, dividers);
    }

    engine.world.gravity.x = 0.0;
    engine.world.gravity.y = 0.1;
  }
});

Engine.run(engine);

// run the renderer
render.options.wireframes = false;
Render.run(render);
