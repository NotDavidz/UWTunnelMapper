
//Graph Definition for Building/Connections 

class Building {
    constructor(name, outNeighbours, x, y) {
        this._name = name;
        this.outNeighbours = outNeighbours;
        this.x = x; 
        this.y = y;
    }

    get name() {
        return this._name;
    }
}


// -------------------------- Graph Definition ------------------------------

const nodes = [
    //North Cluster
    new Building("EXP", ["LHI", "BMH"], 90, 90),
    new Building("BMH", ["LHI", "EXP"], 90, 180),
    new Building("LHI", ["EXP", "BMH"], 180, 90),
    
    //Main Cluster
    new Building("PAC", ["SLC"], 180, 180),
    new Building("SLC", ["PAC", "MC"], 270, 180),
    new Building("MC", ["C2", "QNC", "SLC", "M4"], 360,180),
    new Building("M4", ["MC", "DC", "M3"], 450, 180),
    new Building("M3", ["DC", "M4"], 450, 90),
    new Building("DC", ["C2", "CIM", "M3", "M4"], 540, 180),
    new Building("QNC", ["MC", "B2"], 270,270),
    new Building("C2", ["MC", "DC", "ESC"], 450, 270),
    new Building("CIM", ["DC", "EIT", "E3"], 540, 270),
    new Building("ESC", ["C2", "B1", "EIT"], 450, 360),
    new Building("B2", ["B1", "QNC", "STC"], 270, 360),
    new Building("B1", ["B2", "ESC"], 360,360),
    new Building("STC", ["NH", "B2"], 180, 450),
    new Building("NH", ["STC"], 180, 540),
    new Building("E3", ["CIM", "E2", "E5"], 630, 360),
    new Building("E5", ["E3", "E7"], 720, 270),
    new Building("E7", ["E6", "E5"], 720, 180),
    new Building("E6", ["E7"], 720, 90),
    new Building("EIT", ["CIM", "PHY", "ESC"], 540, 360),
    new Building("PHY", ["EIT", "E2"], 540, 450),
    new Building("E2", ["PHY", "E3", "CPH", "DWE", "RCH"], 630, 450),
    new Building("DWE", ["RCH", "E2", "CPH", "RES"], 630, 540),
    new Building("RCH", ["E2", "DWE"], 540, 540),
    new Building("CPH", ["E2", "DWE"], 720, 450),
    new Building("RES", ["DWE"], 720, 630),
    
    //South Cluster
    new Building("EV3", ["EV2"], 90, 630),
    new Building("EV2", ["EV3", "EV1", "PAS"], 180, 720),
    new Building("EV1", ["EV2", "AL", "HH", "ML"], 270, 630),
    new Building("HH", ["EV1"], 360, 720),
    new Building("PAS", ["EV2"], 270, 720),
    new Building("ML", ["AL", "EV1"], 270, 540),
    new Building("TC", ["AL", "SCH"], 450, 630),
    new Building("AL", ["ML", "TC", "EV1"], 360, 630),
    new Building("SCH", ["TC"], 540, 630)
]


// -------------------------- Helper Functions ------------------------------

// Returns the Building corresponding to a name
function findBuilding(name) {
    return nodes.find(node => node.name === name) || null;
}

// DFS algorithm that finds all the paths
function findAllPaths(start, end, path = []) {
    path = [...path, start];

    if (start === end) return [path];

    let allPaths = [];
    const currentBuilding = findBuilding(start);

    for (const neighbor of currentBuilding.outNeighbours) {
        if (!path.includes(neighbor)) {
            const newPaths = findAllPaths(neighbor, end, path);
            allPaths = allPaths.concat(newPaths);
        }
    }

    return allPaths;
}

// Sort the paths from shortest to longest
function sortPaths(paths) {
    return paths.sort((a, b) => a.length - b.length);
}

function updateFieldColor(){
    console.log("Hello!");
    var start_input = document.getElementById("start_txtfield");
    var end_input = document.getElementById("end_txtfield");
    var start_icon = document.getElementById("start_prompt_icon");
    var end_icon = document.getElementById("end_prompt_icon");
    var acc = 0;

    let start = (start_input.value).toUpperCase();
    let end = (end_input.value).toUpperCase();

    acc+= updateFieldHelper(start_input, start_icon, buildingExist(start));
    acc+= updateFieldHelper(end_input, end_icon, buildingExist(end));

    if (acc){
        document.getElementById("calculate").disabled = true;
  
    }else{
        document.getElementById("calculate").disabled = false;

    }

}

function updateFieldHelper(input, icon, status){
    if (status){
        input.style.backgroundColor = "#c1deb5";
        icon.textContent = "✅";
        return 0;
    }else if ((input.value).toUpperCase() == ""){
        input.style.backgroundColor = "#ffffff";
        icon.textContent = "";
        return 1;
    }else{
        input.style.backgroundColor = "#edcfcb";
        icon.textContent = "❌";
        return 1;
    }
    
}


function buildingExist(name){
    for (var i = 0; i < nodes.length; i++){
        console.log(nodes[i]);
        console.log(nodes[i].name);
        if (name === nodes[i].name){
            return true;
        }
    }
    return false;
}


function updateOutput(args){
    return;
    var output = document.getElementById("output");
    output.textContent = args;

    output.style.animation = 'none';
    void output.offsetWidth; 
    output.style.animation="fadeIn 1s";
}

// -------------------------- Main Functions ----------------------------------

function calculatePath(){

    let start = (document.getElementById("start_txtfield").value).toUpperCase();
    let end = (document.getElementById("end_txtfield").value).toUpperCase();

    if (start == "" || end == ""){
        return;
    }

    if (!findBuilding(start)){
        alert(`There is no such building as ${start}`);
        return;
    }else if(!findBuilding(end)){
        alert(`There is no such building as ${end}`);
        return;
    }

    let allPaths = findAllPaths(start, end);
    if (allPaths.length > 0) {
        allPaths = sortPaths(allPaths);
        path = allPaths[0].join(" » ") + "\n";
        //alert(`The most efficient path from ${start} to ${end}: \n ${path}`);
        updateOutput(path);
        
    } else {
        alert(`No paths found from ${start} to ${end}.`);
    }
}

function myFunction() {
    document.getElementById("myDropdown").classList.toggle("show");
  }





//Convert graph to links
const links = [];
nodes.forEach(node => {
    node.outNeighbours.forEach(targetName => {
        const targetNode = nodes.find(n => n.name === targetName);
        if (targetNode) {
            links.push({
                source: node,
                target: targetNode,
                id: `${node.name}-${targetNode.name}` // Unique ID for the edge
            });
        }
    });
});

//Setup SVG
const width = 800;
const height = 800;
const svg = d3.select("#subway-map")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRation", "xMidYMid meet")
    .attr("width", "100%")
    .attr("height", "100%");

const g = svg.append("g"); 

//Draw Edges
const linkElements = g.selectAll(".link")
    .data(links)
    .enter().append("line")
    .attr("class", "link")
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y);

//Draw Nodes
const nodeElements = g.selectAll(".node")
    .data(nodes)
    .enter().append("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.x},${d.y})`);

nodeElements.append("circle");

nodeElements.append("text")
    .attr("dx", 12)
    .attr("dy", ".35em")
    .text(d => d.name);

// --- UPDATE HIGHLIGHT LOGIC ---

// Override or update your existing calculatePath function
const originalCalculatePath = calculatePath; // Keep your old logic if needed

calculatePath = function() {
    // 1. Run your existing logic to get text output
    let startInput = document.getElementById("start_txtfield").value.toUpperCase();
    let endInput = document.getElementById("end_txtfield").value.toUpperCase();
    
    // Check validity using your existing helpers
    if (!findBuilding(startInput) || !findBuilding(endInput)) {
        alert("Invalid buildings");
        return;
    }

    // 2. Get the path array (e.g., ["EXP", "LHI", "PAC"])
    let allPaths = findAllPaths(startInput, endInput);
    if (allPaths.length === 0) return;
    
    let bestPath = sortPaths(allPaths)[0]; // Get shortest path array
    
    updateOutput(bestPath.join(" » ")); // Update text

    // 3. VISUAL HIGHLIGHTING
    const svg = d3.select("#subway-map");
    
    // A. Turn on Focus Mode (grays out everything)
    svg.classed("focus-mode", true);
    
    // B. Reset previous highlights
    svg.selectAll(".active").classed("active", false);

    // C. Highlight Nodes in the path
    nodeElements.filter(d => bestPath.includes(d.name))
        .classed("active", true);

    // D. Highlight Edges (Links) in the path
    linkElements.filter(d => {
        // Check if this link connects two nodes that are adjacent in the path
        // We iterate through the path to find pairs: [A, B], [B, C]...
        for (let i = 0; i < bestPath.length - 1; i++) {
            const u = bestPath[i];
            const v = bestPath[i+1];
            
            // Check direction (since your graph is directed/undirected mix)
            if ((d.source.name === u && d.target.name === v) || 
                (d.source.name === v && d.target.name === u)) {
                return true;
            }
        }
        return false;
    }).classed("active", true);
}