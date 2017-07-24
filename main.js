let sequence = 'TTGGGGGGACTGGGGCTCCCATTCGTTGCCTTTATAAATCCTTGCAAGCCAATTAACAGGTTGGTGAGGGGCTTGGGTGAAAAGGTGCTTAAGACTCCGT';
let dbr = '...(((((.(...).)))))........(((((.....((..(.((((((..(((.((...)).)))..)))))).).)))))))...............';
let sequenceData = {
	sequenceArray : [],
	nodes : [],
	links : []
}

let svg = d3.select("svg"),
		width = +svg.attr("width"),
		height = +svg.attr("height");

const wrapper = document.querySelector('.wrapper');
const seqInput = wrapper.querySelector('.sequence-input');
const dbrInput = wrapper.querySelector('.dbr-input');
const seqBtn = wrapper.querySelector('.sequence-btn');
const log = wrapper.querySelector('.log');

function setupEvents() {
	seqInput.value = sequence;
	dbrInput.value = dbr;
	seqBtn.addEventListener('click', (e) => {
		e.preventDefault();
		let parse = parseSequenceValues(seqInput.value, dbrInput.value);
		if (parse) {
			resetAndPlot();
		}
	});
}

function parseSequenceValues(input1, input2) {
	if (!input1.length > 0 || !input1.length > 0) return false;
	if (input1.length !== input2.length) {
		log.innerText = ('Both inputs must be of the same length. Please try again. ' +
						'(Sequence: ' + input1.length + ' char, ' +
						'DBR: ' + input2.length + ' char)');
		return false;
	}
	if (!(input1.length % 2 === 0)) {
		log.innerText = 'Input length must an even number.';
		return false;
	}
	log.innerText = '';
	sequenceData = {
		sequenceArray : [],
		nodes : [],
		links : []
	}
	sequenceData.sequenceArray = stringToArray(input1);
	sequenceData.linksArray = stringToArray(input2);
	return true;
}

function mapSequenceNodes(array) {
	let groupSize = 1;

	array.forEach(function(node, index) {
		let obj = {
			name : node,
			id : index,
		}
		sequenceData.nodes.push(obj);
	});
}

function mapSequenceLinks(array) {
	let bracketArray = [];
	let group = 1;
	let lastLink;
	array.forEach(function(link, index) {
		let target, obj;

		if (link !== lastLink) {
			group++;
		}

		if (link === '(' || link === ')') {
			bracket = { index: index, name: link }
			bracketArray.push(bracket);
		}
		obj = {
			name : link,
			source : sequenceData.nodes[index].id,
			target : sequenceData.nodes[index+1] ? sequenceData.nodes[index+1].id : 0,
			value : 1
		}
		sequenceData.links.push(obj);
		sequenceData.nodes[index].group = group;
		lastLink = link;
	});
	for (var i = 0; i < bracketArray.length; i++) {
		if (bracketArray[i].name === ')') return;
		sequenceData.links[bracketArray[i].index].target = bracketArray[(bracketArray.length-1) - i].index;
	}
}

function resetAndPlot() {
	svg.selectAll("*").remove();
	mapSequenceNodes(sequenceData.sequenceArray);
	mapSequenceLinks(sequenceData.linksArray);
	forcePlotter();
}

function stringToArray(string) {
	let array = string.split('');

	if (!(array.length % 2 == 0)) {
		console.log('this sequence is not an even number!');
		return;
	}

	return array;
}

function forcePlotter() {

	const color = d3.scaleOrdinal(d3.schemeCategory20);

	const simulation = d3.forceSimulation()
	    .force("link", d3.forceLink().distance(10).strength(1.0))
		.force("charge", d3.forceManyBody())
		.force("center", d3.forceCenter(width / 2, height / 2));

	const link = svg.append("g")
			.attr("class", "links")
		.selectAll("line")
		.data(sequenceData.links)
		.enter().append("line")
			.attr("stroke-width", d => Math.sqrt(d.value));

	const node = svg.append("g")
			.attr("class", "nodes")
		.selectAll("circle")
		.data(sequenceData.nodes)
		.enter().append("circle")
			.attr("r", 5)
      		.attr("fill", d => color(d.group))
			.attr("class", d => d.name.toLowerCase())
			.call(d3.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended));

	const textElements = svg.append('g')
			.attr("class", "text")
		.selectAll('text')
		.data(sequenceData.nodes)
		.enter().append('text')
			.text(node => node.name)
			.attr('font-size', 15)
			.attr('dx', 15)
			.attr('dy', 4)

	node.append("title")
		.text(d => { return d.name; });

	simulation
		.nodes(sequenceData.nodes)
		.on("tick", ticked);

 	simulation.force("link")
		.links(sequenceData.links);

	function ticked() {
		link
			.attr("x1", d => d.source.x)
			.attr("y1", d => d.source.y)
			.attr("x2", d => d.target.x)
			.attr("y2", d => d.target.y);

		textElements
		    .attr("x", node => node.x)
		    .attr("y", node => node.y);

		node
			.attr("cx", d => d.x)
			.attr("cy", d => d.y);
	}

	function dragstarted(d) {
	  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
	  d.fx = d.x, d.fy = d.y;
	}

	function dragged(d) {
	  d.fx = d3.event.x, d.fy = d3.event.y;
	}

	function dragended(d) {
	  if (!d3.event.active) simulation.alphaTarget(0);
	  d.fx = null, d.fy = null;
	}
}

function dnaSequencer(sequence) {
	if (!typeof sequence === 'string') return;

	// console.log('sequence is', sequence);

	parseSequenceValues(seqInput.value, dbrInput.value);
	mapSequenceNodes(sequenceData.sequenceArray);
	mapSequenceLinks(sequenceData.linksArray);
	forcePlotter();
}

setupEvents();
dnaSequencer(sequence);

