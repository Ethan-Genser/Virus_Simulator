var simCanvas = document.getElementById("sim-canvas");
var simCtx = simCanvas.getContext("2d");
simCtx.canvas.style.width = "100%";
simCtx.canvas.style.height = "100%";
simCtx.canvas.width = simCtx.canvas.offsetWidth;
simCtx.canvas.height = simCtx.canvas.offsetHeight;
var chartCanvas = document.getElementById("chart-canvas");
var chartCtx = chartCanvas.getContext("2d");
chartCtx.canvas.width = window.innerWidth/2;
chartCtx.canvas.height = window.innerHeight/2;
var populationSlider = document.getElementById("population-slider");
var populationDisp = document.getElementById("population-disp");
var familySlider = document.getElementById("family-slider");
var familyDisp = document.getElementById("family-disp");
var infectivitySlider = document.getElementById("infectivity-slider");
var infectivityDisp = document.getElementById("infectivity-disp");
var radiusSlider = document.getElementById("radius-slider");
var radiusDisp = document.getElementById("radius-disp");
var distancingSlider = document.getElementById("distancing-slider");
var distancingDisp = document.getElementById("distancing-disp");
var familyDistancingSlider = document.getElementById("family-distancing-slider");
var familyDistancingDisp = document.getElementById("family-distancing-disp");
var meetingDistancingSlider = document.getElementById("meeting-distancing-slider");
var meetingDistancingDisp = document.getElementById("meeting-distancing-disp");
var durationSlider = document.getElementById("duration-slider");
var durationDisp = document.getElementById("duration-disp");
var playButton = document.getElementById("play-button");
var pauseButton = document.getElementById("pause-button");
var resetButton = document.getElementById("reset-button");
populationDisp.innerHTML = populationSlider.value;
familyDisp.innerHTML = familySlider.value;
infectivityDisp.innerHTML = infectivitySlider.value;
radiusDisp.innerHTML = radiusSlider.value;
distancingDisp.innerHTML = distancingSlider.value;
familyDistancingDisp.innerHTML = familyDistancingSlider.value;
meetingDistancingDisp.innerHTML = meetingDistancingSlider.value;
durationDisp.innerHTML = durationSlider.value;
var buttonUpColor = "#ededed"
var buttondownColor = "#dbdbdb"
var numOfFamilies = 1;
var population = 100;
var commonZone = false;
var infectivityRate = 0.1;
var infectivityRadius = 20;
var socialDistancing = 0.0;
var interfamilyDistancing = 0.0;
var meetingDistancing = 0.0;
var durationOfInfection = 15; // seconds
var meetingZoneSize = 100;
var familyPadding = 0.1;
var familyColumns = 0;
var familyRows = 0;
var familyColor = "#bbbbbb"
var familySize = findFamilySize();
var families = generateFamilies();
var subjects = generateSubjects();
var susceptibleColor = "#4bc0c0";
var infectedColor = "#f57842";
var removedColor = "#636363";
var subjectRadius = 10;
var subjectMaxVelocity = 1.0;
var INFECTED = 1;
var infectedPopulation = 1;
var SUSCEPTIBLE = 0;
var susceptiblePopulation = population - 1;
var REMOVED = 2;
var removedPopulation = 0;
var meetingVisitationTimer = 0;
var meetingVisitationLastTime = Date.now();
var familyVisitationTimer = 0;
var familyVisitationLastTime = Date.now();
var visitationRate = 1000 // miliseconds
var visitationChance = 0.02;
var chartTimer = 0;
var chartLastTime = Date.now();
var seconds = 0;
var isRunning = false;
var isComplete = false;
var updateRate = 1000; // miliseconds
var inertialMultiplier = 0.05;
var MEETINGZONE = 0;
var visitationDuration = 5000; // miliseconds

// Chart
var chart = new Chart(chartCtx, {
	"type": "line",
	"data": {
		"labels": [0],
		"datasets": [{
				"label": "Susceptible",
				"data": [],
				"fill": true,
				"borderColor": susceptibleColor,
				"lineTension": 0.1
			},
			{
				"label": "Infected",
				"data": [],
				"fill": true,
				"borderColor": infectedColor,
				"lineTension": 0.1
			},
			{
				"label": "Removed",
				"data": [],
				"fill": true,
				"borderColor": removedColor,
				"lineTension": 0.1
			}
		]
	},
	"options": {
		responsive:false
	}
});

// Game rule sliders
populationSlider.oninput = function() {
	population = populationSlider.value;
	populationDisp.innerHTML = populationSlider.value;
	reset();
}
familySlider.oninput = function() {
	numOfFamilies = familySlider.value;
	familyDisp.innerHTML = familySlider.value;
	reset();
}
infectivitySlider.oninput = function() {
	infectivityRate = infectivitySlider.value/100;
	infectivityDisp.innerHTML = infectivitySlider.value;
}
radiusSlider.oninput = function() {
	infectivityRadius = parseInt(radiusSlider.value) + subjectRadius;
	radiusDisp.innerHTML = radiusSlider.value;
	for (var i = 0; i < population; i++) {
		if (subjects[i].isInfected) {
			subjects[i].drawnInfectionRadius = infectivityRadius;
		}
	}
}
distancingSlider.oninput = function() {
	socialDistancing = distancingSlider.value/100;
	distancingDisp.innerHTML = distancingSlider.value;
	reset();
}
familyDistancingSlider.oninput = function() {
	interfamilyDistancing = 1 - familyDistancingSlider.value/100;
	familyDistancingDisp.innerHTML = familyDistancingSlider.value;
}
meetingDistancingSlider.oninput = function() {
	meetingDistancing = 1 - meetingDistancingSlider.value/100;
	meetingDistancingDisp.innerHTML = meetingDistancingSlider.value;
}
durationSlider.oninput = function() {
	durationOfInfection = durationSlider.value;
	durationDisp.innerHTML = durationSlider.value;
}
// Buttons
playButton.onclick = function() {
	if (isComplete) {
		reset();
	}

	playButton.style = "background: " + buttondownColor + "; border-style: inset;";
	playButton.disabled = true;
	pauseButton.style = "background: " + buttonUpColor + "; border-style: outset;";
	pauseButton.disabled = false;
	isRunning = true;

	console.log(infectedPopulation);
}
pauseButton.onclick = function() {
	if (isRunning) {
		isRunning = false;
		playButton.style = "background: " + buttonUpColor + "; border-style: outset;";
		playButton.disabled = false;
		pauseButton.style = "background: " + buttondownColor + "; border-style: inset;";
		pauseButton.disabled = true;
	}
}
resetButton.onclick = function() {
	playButton.style = "background: " + buttonUpColor + "; border-style: outset;";
	playButton.disabled = false;
	pauseButton.style = "background: " + buttondownColor + "; border-style: inset;";
	pauseButton.disabled = true;
	reset();
}


function reset() {
	/* Resets the simulation to its original state, resets the
	 * populations and their respective datasets, and recalculates
	 * the positions and sizes of families and subjects.
	 * 
	 * ~returns: void
	 */

	isRunning = false;
	isComplete = false;
	infectedPopulation = 0;
	susceptiblePopulation = population;
	removedPopulation = 0;
	familySize = findFamilySize();
	families = generateFamilies();
	subjects = generateSubjects();
	chart.data.labels = [0];
	chart.data.datasets[SUSCEPTIBLE].data = [];
	chart.data.datasets[INFECTED].data = [];
	chart.data.datasets[REMOVED].data = [];
	seconds = 0;
}

function isInside(position, rectangle){
    return (
		   position.x > rectangle.x
		&& position.x < rectangle.x+rectangle.width
		&& position.y < rectangle.y+rectangle.height
		&& position.y > rectangle.y
	);
}

function findFamilySize() {
	/* Returns the width and height of the family containers. This
	 * is achieved by first determining the layout of the families,
	 * that is, the rows and collumns, and then calculating the
	 * largest size that would allow each family container to remain
	 * on screen at one time, accounting for padding and the meeting zone.
	 * 
	 * ~returns: int
	 */

	// Finds the number of columns
	if (numOfFamilies <=3) {
		familyColumns = 1;
	}
	else if (numOfFamilies > 3 && numOfFamilies <=6) {
		familyColumns = 2;
	}
	else {
		familyColumns = 3;
	}

	// Finds the number of rows
	if (numOfFamilies == 4) {
		familyRows = 2;
	}
	else if (numOfFamilies > 3) {
		familyRows = 3;
	}
	else {
		familyRows = numOfFamilies;
	}

	var size = ((simCanvas.width - meetingZoneSize)/Math.max(familyRows, familyColumns)) * (1 - familyPadding);
	return size;
}

function generateFamilies() {
	/* Calculates the correct position for each family container
	 * and returns and array of objects containing the position,
	 * width, and height of each family container.
	 * 
	 * ~returns: {int, int, int, int}
	 */

	var _families = [];
	_families[0] = {x: 1, y: simCtx.canvas.height/2 - meetingZoneSize/2, width: meetingZoneSize, height: meetingZoneSize};
	for (var x = 0; x < familyColumns; x++) {
		for (var y = 0; y < familyRows; y++) {
			var index = x * familyRows + y + 1;
			var posX = meetingZoneSize + ((familySize*familyPadding) + (x*familySize + (x)*familySize*(familyPadding)));
			var posY = y*familySize + (y+1)*familySize*(familyPadding);
			if (familyRows > familyColumns) {
				posX = posX + (((familyRows - familyColumns) / 2) * familySize)
			}
			_families[index] = {x: posX, y: posY, width: familySize, height: familySize};
		}
	}
	return _families;
}

function generateSubjects() {
	/* Randomizes the positions and families of the subjects and
	 * assigns the final subject to be the initially infected
	 * subject. Returns and array of objects containing the position,
	 * infection status, velocity, family, time of infection, and
	 * the current size of the drawnInfectionRadius.
	 * 
	 * ~returns: {int, int, bool, bool, float, float, int, int, int, bool, int}
	 */

	var _subjects = [];
	for (var i = 0; i < population; i++) {
		var family = Math.floor(Math.random() * numOfFamilies) + 1;
		var posX = families[family].x + Math.floor(Math.random() * familySize);
		var posY = families[family].y + Math.floor(Math.random() * familySize);
		var distancing = Math.random() < socialDistancing;
		_subjects[i] = {x: posX, y: posY, isInfected: false, isRemoved: false, velX: 0.0, velY: 0.0, homeFamily: family, timeOfInfection: 0, drawnInfectionRadius: 0, isTraveling: false, currentFamily: family, timer: 0, lastTime: 0, isDistancing: distancing}
		
		// Assigning the initially infected subject
		if (i == population-1) {
			_subjects[i].isInfected = true;
			_subjects[i].timeOfInfection = Date.now();
			_subjects[i].drawnInfectionRadius = infectivityRadius;
			infectedPopulation++;
			susceptiblePopulation--;
		}
	}

	return _subjects;
}

function travelTo(subject, family) {
	subjects[subject].isTraveling = true;
	subjects[subject].currentFamily = family;
	var destinationX = families[family].x + families[family].width/2;
	var destinationY = families[family].y + families[family].height/2;
	var deltaX = destinationX - subjects[subject].x;
	var deltaY = destinationY - subjects[subject].y;
	var magnitude = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
	subjects[subject].velX =  deltaX/magnitude * 4;
	subjects[subject].velY = deltaY/magnitude * 4;
}

function updateSubjects() {
	/* Randomizes each subjects' movement, updates their positions
	 * according to their velocities, handles collision detection
	 * with the subjects' family container walls, randomizes whether
	 * a subject within an infected subjects radius will become
	 * infected, and tracks the amount of time a subject has spent
	 * infected, removing it after a set amount of time.
	 * 
	 * ~returns: void
	 */

	for (var i = 0; i < population; i++) {
		if (!subjects[i].isTraveling) {

			// Adds a random force to the subjects' current velocity.
			subjects[i].velX += (Math.floor(Math.random() * 3) - 1) * inertialMultiplier;
			subjects[i].velY += (Math.floor(Math.random() * 3) - 1) * inertialMultiplier;


			for (var j = 0; j < population; j++) {
				if (j != i) {
					var distance = Math.sqrt(Math.pow(subjects[i].x - subjects[j].x, 2) + Math.pow(subjects[i].y - subjects[j].y, 2));
					if (distance < infectivityRadius + subjectRadius) {
						
						// Prevents subjects from standing closely according to social distancing setting.
						if (distance < infectivityRadius + subjectRadius && subjects[i].isDistancing) {
							var deltaX = subjects[j].x - subjects[i].x;
							var deltaY = subjects[j].y - subjects[i].y;
							var magnitude = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
							subjects[i].velX = -deltaX/magnitude;
							subjects[i].velY = -deltaY/magnitude;
						}

						// Checks to see if the infection has spread to the subject.
						if (subjects[j].isInfected && !subjects[i].isInfected && !subjects[i].isRemoved) {
							if (infectivityRate > Math.random()) {
							subjects[i].isInfected = true;
							subjects[i].timeOfInfection = Date.now();
							infectedPopulation++;
							susceptiblePopulation--;
							}
						}
					}
				}
			}

			// Prevents subjects from moving outside their family.
			if (Math.abs(subjects[i].x - families[subjects[i].currentFamily].x) < 10) {
				subjects[i].velX = 1
			}
				
			if (families[subjects[i].currentFamily].x+families[subjects[i].currentFamily].width - subjects[i].x < 10) {
				subjects[i].velX = -1;
			}
			if (Math.abs(subjects[i].y - families[subjects[i].currentFamily].y) < 10) {
				subjects[i].velY = 1;
			}
			if (families[subjects[i].currentFamily].y+families[subjects[i].currentFamily].height - subjects[i].y < 10) {
				subjects[i].velY = -1;
			}

			// Prevents subjects velocity from exceeding the maximum speed allowed.
			if (subjects[i].velX > subjectMaxVelocity) {
				subjects[i].velX -= 0.1;
			}
			else if (subjects[i].velX < -subjectMaxVelocity) {
				subjects[i].velX += 0.1;
			}
			if (subjects[i].velY > subjectMaxVelocity) {
				subjects[i].velY -= 0.1;
			}
			else if (subjects[i].velY < -subjectMaxVelocity) {
				subjects[i].velY += 0.1;
			} 

			// Checks if an infected subject recovers.
			if (subjects[i].isInfected) {
				subjects[i].drawnInfectionRadius += 0.1;
				if (subjects[i].drawnInfectionRadius > infectivityRadius) {
					subjects[i].drawnInfectionRadius = subjectRadius;
				}
				if (Date.now() - subjects[i].timeOfInfection > durationOfInfection * 1000) {
					subjects[i].isInfected = false;
					subjects[i].isRemoved = true;
					infectedPopulation--;
					removedPopulation++;
				}
			}

			// Manages how much time each subject has spent visiting a family or meeting zone.
			if (subjects[i].currentFamily != subjects[i].homeFamily) {
				subjects[i].timer += Date.now() - subjects[i].lastTime;
				subjects[i].lastTime = Date.now();
				if (subjects[i].timer > visitationDuration) {
					travelTo(i, subjects[i].homeFamily);
					subjects[i].timer = 0;
				}
			}
		}

		// Determines if a traveling subject is done traveling.
		else if (isInside({x: subjects[i].x, y: subjects[i].y}, families[subjects[i].currentFamily])) {	
			subjects[i].isTraveling = false;
			subjects[i].lastTime = Date.now();
		}

		// Applies subjects' velocity to move their position.
		subjects[i].x += subjects[i].velX;
		subjects[i].y += subjects[i].velY;
	}
	
	// Determines if a subject will visit the meeting zone.
	meetingVisitationTimer += Date.now() - meetingVisitationLastTime;
	meetingVisitationLastTime = Date.now();
	if (meetingVisitationTimer > visitationRate) {
		meetingVisitationTimer = 0;
		for (var i = 0; i < population; i++) {
			if (Math.random() < visitationChance*meetingDistancing) {
				travelTo(i, 0)
			}
		}
	}

	// Determines if a subject will visit a family.
	familyVisitationTimer += Date.now() - familyVisitationLastTime;
	familyVisitationLastTime = Date.now();
	if (familyVisitationTimer > visitationRate) {
		familyVisitationTimer = 0;
		for (var i = 0; i < population; i++) {
			if (Math.random() < visitationChance*interfamilyDistancing) {
				var newFamily = subjects[i].homeFamily;
				while (newFamily == subjects[i].homeFamily) {
					newFamily = Math.ceil(Math.random() * numOfFamilies)
				}
				travelTo(i, newFamily)
			}
		}
	}
}

function updateChart() {
	/* Pushes the current population data to the chart's datasets
	 * on a set time interval.
	 *
	 * ~returns: void
	 */

	chartTimer += Date.now() - chartLastTime;
	chartLastTime = Date.now();

	if (chartTimer > updateRate) {
		chartTimer = 0;
		seconds++;
		chart.data.labels.push(seconds);
		chart.data.datasets[SUSCEPTIBLE].data.push(susceptiblePopulation);
		chart.data.datasets[INFECTED].data.push(infectedPopulation);
		chart.data.datasets[REMOVED].data.push(removedPopulation);
	}

	chart.update();
}

function drawRect(context, x, y, width, height, color, fill) {
	/* Draws a rectangle to the given canvas context.
	 *
	 * ~params:
	 * * context (canvas.context): target canvas context
	 * * x (int): position.x
	 * * y (int): position.y
	 * * width (int): width
	 * * height (int): height
	 * * color (color): color
	 * * fill (bool): if true, solid rectangle. if false, just an outline.
	 * 
	 * ~returns: void
	 */

	context.beginPath();
	context.rect(x, y, width, height);
	fill ? context.fillStyle = color : context.strokeStyle = color;
	fill ? context.fill() : context.stroke();
	context.closePath();
}

function drawCircle(context, x, y, radius, color, fill) {
	/* Draws a circle to the given canvas context.
	 *
	 * ~params:
	 * * context (canvas.context): target canvas context
	 * * x (int): position.x
	 * * y (int): position.y
	 * * radius (int): radius
	 * * color (color): color
	 * * fill (bool): if true, solid circle. if false, just an outline.
	 * 
	 * ~returns: void
	 */
	context.beginPath();
	context.arc(x, y, radius, 0, 2 * Math.PI);
	fill ? context.fillStyle = color : context.strokeStyle = color;
	fill ? context.fill() : context.stroke();
	context.closePath();
}

function draw() {
	/* Draws everything on screen to its respective canvas.
	 *
	 * ~returns: void
	 */

	// Families
	for (var i = 0; i <= numOfFamilies; i++) {
		drawRect(simCtx, families[i].x, families[i].y, families[i].width, families[i].height, familyColor, true);
	}

	// Meeting zone
	drawRect(simCtx, 1, simCtx.canvas.height/2 - meetingZoneSize/2, meetingZoneSize, meetingZoneSize, familyColor, true);
	
	// Subjects
	for (var i = 0; i < population; i++) {
		// Removed subjects
		if (subjects[i].isRemoved) {
			drawCircle(simCtx, subjects[i].x, subjects[i].y, subjectRadius, removedColor, true);
		}
		// Infected subjects
		else if (subjects[i].isInfected) {
			drawCircle(simCtx, subjects[i].x, subjects[i].y, subjectRadius, infectedColor, true);
			drawCircle(simCtx, subjects[i].x, subjects[i].y, subjects[i].drawnInfectionRadius, infectedColor, false);
		}
		// Susceptible subjects
		else {
			drawCircle(simCtx, subjects[i].x, subjects[i].y, subjectRadius, susceptibleColor, true);
		}
	}
}

function update() {
	/* This is the main loop of the program, called once per tick.
	 *
	 * ~returns: int
	 */

	// Draws the screen
	simCtx.clearRect(0, 0, simCanvas.width, simCanvas.height);
	draw();

	// Checks if simulation is complete
	if (susceptiblePopulation < 0) {
		susceptiblePopulation = 0;
	}
	if (infectedPopulation < 1) {
		var infectedcnt = 0;
		for (var i = 0; i < population; i++) {
			if (subjects[i].isInfected) {
				infectedcnt++;
			}
		}
		if (infectedcnt == 0) {
			playButton.style = "background: " + buttonUpColor + "; border-style: outset;";
			playButton.disabled = false;
			pauseButton.style = "background: " + buttondownColor + "; border-style: inset;";
			pauseButton.disabled = true;
			infectedPopulation = 0;
			isRunning = false;
			isComplete = true;
		}
	}

	// Runs simulation while isRunning == true
	if (isRunning) {
		updateSubjects();
		updateChart();
	}
	requestAnimationFrame(update);

	return -1;
}

update();