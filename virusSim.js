// Canvas initialization
var simCanvas = document.getElementById("simCanvas");
var simCtx = simCanvas.getContext("2d");
simCtx.canvas.width = window.innerWidth/2;
simCtx.canvas.height = window.innerHeight;
var chartCanvas = document.getElementById("chartCanvas");
var chartCtx = chartCanvas.getContext("2d");
chartCtx.canvas.width = window.innerWidth/2;
chartCtx.canvas.height = window.innerHeight/2;
var uiCanvas = document.getElementById("uiCanvas");
var uiCtx = uiCanvas.getContext("2d");
uiCtx.canvas.width = window.innerWidth/2;
uiCtx.canvas.height = window.innerHeight/2;

var numOfFamilies = 1;
var population = 100;
var commonZone = false;
var infectivityRate = 0.1;
var infectivityRadius = 20;
var socialDistancing = 1.0;
var interfamilyDistancing = 1.0;
var durationOfInfection = 15;

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
var subjectMaxVelocity = 1;

var INFECTED = 1;
var infectedPopulation = 0;
var infectedData = [infectedPopulation];
var SUSCEPTIBLE = 0;
var susceptiblePopulation = population;
var susceptibleData = [susceptiblePopulation];
var REMOVED = 2;
var removedPopulation = 0;
var removedData = [removedPopulation];

var timer = 0;
var lastTime = Date.now();
var seconds = 0;
var simulationComplete = true;

uiCanvas.addEventListener('click', function(event) {
	var mousePosition = getMousePosition(uiCanvas, event);

	if (isInside(mousePosition, startButton)) {
		simulationComplete = false;
		update();
	}
});
var startButton = {x: uiCanvas.width/2 - 75, y: uiCanvas.height - 100, width: 150, height: 75, color: "#636363"}

var chart = new Chart(chartCtx, {
	"type": "line",
	"data": {
		"labels": [0],
		"datasets": [{
				"label": "Healthy",
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

function findFamilySize() {
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

	return ((simCanvas.width)/Math.max(familyRows, familyColumns)) * (1 - familyPadding);
}

function generateFamilies() {
	var _families = [];
	for (var x = 0; x < familyColumns; x++) {
		for (var y = 0; y < familyRows; y++) {
			var index = x * familyRows + y;
			var posX = (familySize*familyPadding) + (x*familySize + (x)*familySize*(familyPadding));
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
	var _subjects = [];
	for (var i = 0; i < population; i++) {
		var family = Math.floor(Math.random() * numOfFamilies);
		var posX = families[family].x + Math.floor(Math.random() * familySize);
		var posY = families[family].y + Math.floor(Math.random() * familySize);
		_subjects[i] = {x: posX, y: posY, isInfected: false, isRemoved: false, velX: 0.0, velY: 0.0, family: family, timeOfInfection: 0, drawnInfectionRadius: 0}
		if (i == population-1) {
			_subjects[i].isInfected = true;
			_subjects[i].timeOfInfection = Date.now();
			infectedPopulation++;
			susceptiblePopulation--;
		}
	}

	return _subjects;
}

function updateSubjects() {
	for (var i = 0; i < population; i++) {
		var _family = families[subjects[i].family];

		// Adds a random force to the subjects' current velocity
		subjects[i].velX += (Math.floor(Math.random() * 3) - 1) * 0.1;
		subjects[i].velY += (Math.floor(Math.random() * 3) - 1) * 0.1;

		// Prevents subjects from moving outside their family
		if (Math.abs(subjects[i].x - _family.x) < 10) {
			subjects[i].velX = 1
		}
			
		if (_family.x+familySize - subjects[i].x < 10) {
			subjects[i].velX = -1;
		}
		if (Math.abs(subjects[i].y - _family.y) < 10) {
			subjects[i].velY = 1;
		}
		if (_family.y+familySize - subjects[i].y < 10) {
			subjects[i].velY = -1;
		}

		// Prevents subjects velocity from exceeding the maximum speed allowed
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

		// Applies subjects' velocity to move their position
		subjects[i].x += subjects[i].velX;
		subjects[i].y += subjects[i].velY;

		// Checks to see if the infection has spread to the subject
		if (!subjects[i].isInfected && !subjects[i].isRemoved) {
			for (var j = 0; j < population; j++) {
				if (subjects[j].isInfected) {
					var distance = Math.sqrt(Math.pow(subjects[i].x - subjects[j].x, 2) + Math.pow(subjects[i].y - subjects[j].y, 2))
					if (distance < infectivityRadius) {
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

		// Checks if an infected subject recovers
		if (subjects[i].isInfected) {
			subjects[i].drawnInfectionRadius += 0.1;
			if (subjects[i].drawnInfectionRadius > infectivityRadius + subjectRadius/2) {
				subjects[i].drawnInfectionRadius = subjectRadius/2;
			}
			if (Date.now() - subjects[i].timeOfInfection > durationOfInfection * 1000) {
				subjects[i].isInfected = false;
				subjects[i].isRemoved = true;
				infectedPopulation--;
				removedPopulation++;
			}
		}
	}
}

function updateChart() {
	susceptibleData.push(susceptiblePopulation);
	infectedData.push(infectedPopulation);
	removedData.push(removedPopulation);

	timer += Date.now() - lastTime;
	lastTime = Date.now();
	if (timer > 1000) {
		timer = 0;
		seconds++;
		chart.data.labels.push(seconds);
		chart.data.datasets[SUSCEPTIBLE].data.push(susceptiblePopulation);
		chart.data.datasets[INFECTED].data.push(infectedPopulation);
		chart.data.datasets[REMOVED].data.push(removedPopulation);
	}

	chart.update();
}

function getMousePosition(canvas, event) {
	var rectangle = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rectangle.left,
        y: event.clientY - rectangle.top
    };
}

function isInside(position, rectangle){
    return position.x > rectangle.x && position.x < rectangle.x+rectangle.width && position.y < rectangle.y+rectangle.height && position.y > rectangle.y
}

function drawRect(context, x, y, width, height, color) {
	context.beginPath();
	context.rect(x, y, width, height);
	context.fillStyle = color;
	context.fill();
	context.closePath();
}

function drawCircle(context, x, y, radius, color, fill) {
	context.beginPath();
	context.arc(x, y, radius, 0, 2 * Math.PI);
	fill ? simCtx.fillStyle = color : simCtx.strokeStyle = color;
	fill ? simCtx.fill() : simCtx.stroke();
	context.closePath();
}

function update() {
	simCtx.clearRect(0, 0, simCanvas.width, simCanvas.height);

	if (susceptiblePopulation < 0) {
		susceptiblePopulation = 0;
	}
	if (infectedPopulation <= 5) {
		var infectedcnt = 0;
		for (var i = 0; i < population; i++) {
			if (subjects[i].isInfected) {
				infectedcnt++;
			}
		}
		if (infectedcnt == 0) {
			infectedPopulation = 0;
			simulationComplete = true;
		}
	}

	// Draw Families
	for (var i = 0; i < numOfFamilies; i++) {
		drawRect(simCtx, families[i].x, families[i].y, families[i].width, families[i].height, familyColor);
	}
	
	// Draw Subjects
	for (var i = 0; i < population; i++) {
		if (subjects[i].isRemoved) {
			drawCircle(simCtx, subjects[i].x, subjects[i].y, subjectRadius, removedColor, true);
		}
		else if (subjects[i].isInfected) {
			drawCircle(simCtx, subjects[i].x, subjects[i].y, subjectRadius, infectedColor, true);
			drawCircle(simCtx, subjects[i].x, subjects[i].y, subjects[i].drawnInfectionRadius, infectedColor, false);
		}
		else {
			drawCircle(simCtx, subjects[i].x, subjects[i].y, subjectRadius, susceptibleColor, true);
		}
	}

	// Draw UI
	drawRect(uiCtx, startButton.x, startButton.y, startButton.width, startButton.height, startButton.color);

	if (!simulationComplete) {
		updateSubjects();
		updateChart();
		requestAnimationFrame(update);
	}
}

update();