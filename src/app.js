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
engine.world.gravity.x = 0;
engine.world.gravity.y = 2;

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


const bedDimensions = { width: 30, depth: 6 } // feet
const bedArea = bedDimensions.width * bedDimensions.depth; // feet^2

const BOUNDARY_BUFFER = 100;

const COLOR_CHUTE = "#2c3e50";
const COLOR_CHUTE_EXT = "#95a5a6";

const boundaryTop = Bodies.rectangle(
  CANVAS_WIDTH / 2,
  CANVAS_HEIGHT / 2 - bedDimensions.depth * 12 / 2 - BOUNDARY_BUFFER / 2,
  bedDimensions.width * 12,
  BOUNDARY_BUFFER,
  { isStatic: true, render: { fillStyle: COLOR_CHUTE } });
// World.add(engine.world, boundaryTop);

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

const boundaryLeft= Bodies.rectangle(
  CANVAS_WIDTH / 2 - BOUNDARY_BUFFER / 2 - bedDimensions.width * 12 / 2,
  CANVAS_HEIGHT / 2,
  BOUNDARY_BUFFER,
  BOUNDARY_BUFFER * 2 + bedDimensions.depth * 12,
  { isStatic: true, render: { fillStyle: COLOR_CHUTE } });
World.add(engine.world, boundaryLeft);


// // Load Combination Templates from API
const combinationTemplates = JSON.parse($.ajax({
  method: 'GET',
  url: 'http://api-search.plantwithbloom.com/combination_templates',
  async: false
}).responseText);

// // Pick a random template and identify the plants
// const template = combinationTemplates[Math.floor(combinationTemplates.length * Math.random())]
const template  = combinationTemplates[4];
// let plants = template.starting_plants.map( (p) => {
//   const plant = p.plant
//   plant.property_type = { property: p.placement, area: p.area }
//   return plant
// });
console.log(template)

// Group into horizontal segments
let horizontalGroups = [];
let groupLayered = [];
template.starting_plants.forEach( (templatePlant) => {
  if(templatePlant.placement == 'lone') {
    horizontalGroups.push({type: 'single', templatePlants: [templatePlant]});
  }
  if(templatePlant.placement == 'short_front' || templatePlant.placement == 'tall_back') {
    groupLayered.push(templatePlant);
  }
});
if(groupLayered.length > 1) {
  if(groupLayered[0].placement == 'tall_back') {
    const tmp = groupLayered.shift();
    groupLayered.push(tmp);
  }
  horizontalGroups.push({type: 'layered', templatePlants: groupLayered});
}

// Determine the number of plants for each template plant
horizontalGroups.forEach( (horizontalGroup) => {
  horizontalGroup.templatePlants.forEach( (templatePlant) => {
    let plantArea = plantAreaFt2(templatePlant.plant);
    let plantCount = Math.floor((templatePlant.area * bedArea) / plantArea);

    if(plantCount % 2 == 0) {
      plantCount -= 1;
    }
    templatePlant.plant_count = plantCount
  })
})

// Determine the approximate width proportion needed by each horizontal group based on the area used by their plants
horizontalGroups.forEach( (horizontalGroup) => {
  horizontalGroup.area = horizontalGroup.templatePlants.reduce( (sum, templatePlant) => { return sum + templatePlant.area}, 0)
});

const totalAllocatedBedArea =  horizontalGroups.reduce( (sum, horizontalGroup) => { return sum + horizontalGroup.area }, 0)
horizontalGroups.forEach( (horizontalGroup) => {
  horizontalGroup.proportional_area = horizontalGroup.area / totalAllocatedBedArea;
});

let dividers = []
// Build dividers to separate groups during drop in
let lastDividedXAbsolute = (CANVAS_WIDTH / 2) - (bedDimensions.width * 12 / 2);
horizontalGroups.forEach( (horizontalGroup, idx) => {
  if(idx < (horizontalGroups.length - 1)) {
    const dividerXRelative = bedDimensions.width * horizontalGroup.proportional_area;
    const dividerXAbsolute = (CANVAS_WIDTH / 2) - (bedDimensions.width * 12 / 2) + dividerXRelative * 12

    const divider = Bodies.rectangle(
      dividerXAbsolute,
      CANVAS_WIDTH / 2,
      4,
      bedDimensions.depth * 12,
      { mass: 10, isStatic: true, render: { fillStyle: COLOR_CHUTE } });
    World.add(engine.world, divider);
    dividers.push(divider)

    // Save X absolute positions in horizontalGroup
    horizontalGroup.position_range = { xStartAbsolute: lastDividedXAbsolute, xEndAbsolute: dividerXAbsolute}
    lastDividedXAbsolute = dividerXAbsolute;
  } else {
    // Save X absolute positions in horizontalGroup
    horizontalGroup.position_range = { xStartAbsolute: lastDividedXAbsolute, xEndAbsolute: (CANVAS_WIDTH / 2) + (bedDimensions.width * 12 / 2)}
  }
});

// Assign render colors
let colors = ['#1abc9c', '#3498db', '#9b59b6', '#e74c3c']
horizontalGroups.forEach( (horizontalGroup) => {
  horizontalGroup.templatePlants.forEach( (templatePlant) => {
    templatePlant.render_color = colors.pop();
  })
});

let layer = 0;
horizontalGroups.forEach( (horizontalGroup) => {
  let yAbsolute = CANVAS_HEIGHT / 2 - 100 - bedDimensions.depth * 12;
  let xAbsolute = horizontalGroup.position_range.xStartAbsolute + horizontalGroup.templatePlants[0].plant.size.avg_width / 2 + 1;

  horizontalGroup.templatePlants.forEach( (templatePlant) => {
    const plant = templatePlant.plant;
    yAbsolute -= 100;

    // let xCenterAbsolute = (horizontalGroup.position_range.xStartAbsolute + horizontalGroup.position_range.xEndAbsolute) / 2
    for( let i = 0; i < templatePlant.plant_count; i++ ) {
      let airFriction = null;
      if(templatePlant.placement == 'short_front') {

      } else if(templatePlant.placement == 'tall_back') {
        airFriction = 0.1
      }

      const xCenterAbsolute = (horizontalGroup.position_range.xStartAbsolute + horizontalGroup.position_range.xEndAbsolute) / 2
      const xPosn = xCenterAbsolute + (i % 2 == 0 ? -1 : 1) * plant.size.avg_width / 2 + (layer % 2 == 0 ? 0 : plant.size.avg_width / 4) + Math.random() * 3;
      console.log(xPosn)
      const circleBody = Bodies.circle(xPosn, yAbsolute, plant.size.avg_width / 2, { frictionAir: airFriction, label: plant.permalink, render: { strokeStyle: templatePlant.render_color, lineWidth: 1, fillStyle: templatePlant.render_color}});
      World.add(engine.world, circleBody);

      yAbsolute -= plant.size.avg_width;
      xAbsolute += plant.size.avg_width * 1;
      if((xAbsolute + plant.size.avg_width / 2) > horizontalGroup.position_range.xEndAbsolute) {
        xAbsolute = horizontalGroup.position_range.xStartAbsolute + plant.size.avg_width / (layer % 2 == 0 ? 1 : 2);
        yAbsolute -= plant.size.avg_width * 2;
        layer += 1;
      }

    }
  });
});



let removedDividers = false;
const DROP_END_TIME = 6000;

Events.on(engine, 'afterUpdate', (event) => {
  if(event.timestamp > DROP_END_TIME) {
    World.add(engine.world, boundaryTop);
    engine.world.gravity.y = 5;
    // World.remove(engine.world, dividers);
  }
  if(event.timestamp > DROP_END_TIME + 500) {
    engine.world.gravity.x = 10;
  } 
  if(event.timestamp > DROP_END_TIME + 525) {
    engine.world.gravity.x = -10;
  } 
  if(event.timestamp > DROP_END_TIME + 550) {
    engine.world.gravity.x = 0;
    dividers.forEach( (d) => { d.isStatic = false });
  }
});

Engine.run(engine);

// run the renderer
render.options.wireframes = false;
Render.run(render);
