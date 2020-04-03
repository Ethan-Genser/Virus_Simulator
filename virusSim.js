// Canvas initialization
var simCanvas = document.getElementById("simCanvas");
var simCtx = simCanvas.getContext("2d");
simCtx.canvas.width = window.innerWidth/2;
simCtx.canvas.height = window.innerHeight;
var chartCanvas = document.getElementById("chartCanvas");
var chartCtx = chartCanvas.getContext("2d");
chartCtx.canvas.width = window.innerWidth/2;
chartCtx.canvas.height = window.innerHeight/2;

var subjects = [];
var numOfFamilies = 9;
var population = 20;
var commonZone = false;
var infectivityRate = 0.1;
var infectivityRadius = 10;
var socialDistancing = 1.0;
var interfamilyDistancing = 1.0;
var duration = 10;

var familyPadding = 0.1;
var familyColumns = 0;
var familyRows = 0;
var familyColor = "#bbbbbb"
var familySize = findFamilySize();
var families = generateFamilies();

var chart = new Chart(chartCtx, {
	"type": "line",
	"data": {
		"labels": [1,2,3,4,5,6,7],
		"datasets": [{
			"label": "My First Dataset",
			"data": [65,59,80,81,56,55,40],
			"fill": true,
			"borderColor": "rgb(75, 192, 192)",
			"lineTension": 0
		}]
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

function drawRect(x, y, width, height, color) {
	simCtx.beginPath();
	simCtx.rect(x, y, width, height);
	simCtx.fillStyle = color;
	simCtx.fill();
	simCtx.closePath();
}

function draw() {
	simCtx.clearRect(0, 0, simCanvas.width, simCanvas.height);

	// Families
	for (var i = 0; i < numOfFamilies; i++) {
		drawRect(families[i].x, families[i].y, families[i].width, families[i].height, familyColor);
	}
	
	requestAnimationFrame(draw);
}

draw();