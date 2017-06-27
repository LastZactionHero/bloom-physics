import Matter from 'matter-js';
import MatterAttractors from 'matter-attractors';
import CombinationProperties from './combination_properties';
import $ from 'jquery';

function plantAreaFt2(plant) {
  const avgWidthFt = plant.size.avg_width / 12
  return Math.PI * Math.pow(avgWidthFt / 2, 2)
}

var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Events = Matter.Events;

// create an engine
window.engine = Engine.create();
engine.world.gravity.x = 2;
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

// const bodyBed = Bodies.rectangle(
//   CANVAS_WIDTH / 2,
//   CANVAS_HEIGHT / 2,
//   bedDimensions.width * 12,
//   bedDimensions.depth * 12,
//   { render: { fillStyle: '#FFFFFF' } });
// World.add(engine.world, bodyBed);


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
const template  = combinationTemplates[3];
let plants = template.starting_plants.map( (p) => { return p.plant });
const colors = ['#1abc9c', '#3498db', '#9b59b6', '#e74c3c']
plants.forEach( (plant, idx) => {
  plant.renderColor = colors[idx];
  plant.size.area = plantAreaFt2(plant)
})

// // Pick a random CombiationProperty definition
// const combinationProperties = CombinationProperties[plants.length][Math.floor(CombinationProperties[plants.length].length * Math.random())]
const combinationProperties = CombinationProperties[plants.length][0];
console.log(combinationProperties)

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

// Sort by property type
plants = plants.sort( (a,b) => { return a.property_type.sort > b.property_type.sort } );

let inventory = [];

// Pick an ideal plant count to fill the space
plants.forEach( (plant) => {
  const plantAreaToFill = plant.property_type.area * bedArea
  let plantQuantity = Math.floor(plantAreaToFill / plant.size.area)

  // Odd numbers
  if(plantQuantity > 1 && plantQuantity % 2 == 0) {
    plantQuantity -= 1;
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

const DIVIDER_SIZE = 25;

inventory.forEach( (inventoryPlant, inventoryPlantIdx) => {
  inventoryPlant.forEach( (permalink, inventoryIdx) => {
    const plant = plants.find( (plant) => { return plant.permalink == permalink});

    if(lastPermalink && lastPermalink != plant.permalink) {
      if(plant.property_type.property == 'short_front') {

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

    // const yPosn = CANVAS_HEIGHT / 2 + (inventoryIdx % 2 == 0 ? (bedDimensions.depth / 2 + plant.size.avg_width / 2) : (0 - bedDimensions.depth / 2 - plant.size.avg_width / 2));
    let yPosn = CANVAS_HEIGHT / 2 + ( inventoryIdx % 2 == 0 ? 10 * Math.random() : -10 * Math.random() )
    if(plant.property_type.property == 'tall_back') {
      yPosn = CANVAS_HEIGHT / 2 - (bedDimensions.depth * 12 / 2) + plant.size.avg_width / 2;
    } else if (plant.property_type.property == 'short_front') {
      yPosn = CANVAS_HEIGHT / 2 + (bedDimensions.depth * 12 / 2) - plant.size.avg_width / 2;
    }

    const circleBody = Bodies.circle(xPosn, yPosn, plant.size.avg_width / 2, { label: plant.permalink, render: { strokeStyle: plant.renderColor, lineWidth: 1, fillStyle: plant.renderColor}});
    World.add(engine.world, circleBody);

    lastXPosition = xPosn - plant.size.avg_width;
    lastPermalink = plant.permalink;
  });
});


let removedDividers = false;
Events.on(engine, 'afterUpdate', (event) => {
  if(event.timestamp > 3000) {
    
    engine.world.gravity.x = 0.0;
    engine.world.gravity.y = 1;
    World.add(engine.world, boundaryCap);
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
    engine.world.gravity.x = 0.0
    engine.world.gravity.y = 0.5
  }
});

Engine.run(engine);

// run the renderer
render.options.wireframes = false;
Render.run(render);
