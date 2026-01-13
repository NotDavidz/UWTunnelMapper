
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
    new Building("LHI", ["EXP", "BMH", "PAC"], 180, 90),
    
    //Main Cluster
    new Building("PAC", ["SLC", "LHI"], 180, 180),
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
    new Building("NH", ["STC", "EV3"], 180, 540),
    new Building("E3", ["CIM", "E2", "E5"], 630, 360),
    new Building("E5", ["E3", "E7"], 720, 270),
    new Building("E7", ["E6", "E5"], 720, 180),
    new Building("E6", ["E7"], 720, 90),
    new Building("EIT", ["CIM", "PHY", "ESC"], 540, 360),
    new Building("PHY", ["EIT", "E2"], 540, 450),
    new Building("E2", ["PHY", "E3", "CPH", "DWE", "RCH"], 630, 450),
    new Building("DWE", ["RCH", "E2", "CPH", "RES", "SCH"], 630, 540),
    new Building("RCH", ["E2", "DWE"], 540, 540),
    new Building("CPH", ["E2", "DWE"], 720, 450),
    new Building("RES", ["DWE"], 720, 630),
    new Building("DP", ["AL"], 360, 540),
    
    //South Cluster
    new Building("EV3", ["EV2", "NH"], 90, 630),
    new Building("EV2", ["EV3", "EV1", "PAS"], 180, 720),
    new Building("EV1", ["EV2", "AL", "HH", "ML"], 270, 630),
    new Building("HH", ["EV1"], 360, 720),
    new Building("PAS", ["EV2"], 270, 720),
    new Building("ML", ["AL", "EV1"], 270, 540),
    new Building("TC", ["AL", "SCH"], 450, 630),
    new Building("AL", ["ML", "TC", "EV1", "DP"], 360, 630),
    new Building("SCH", ["TC", "DWE"], 540, 630)
]

// -------------------------- Closures and Special Tunnels------------------------------
const closedBuildings = ["M4", "RES"]; 
const closedTunnels = [["TC", "SCH"]]; 
const outsideTunnels = [["PAC", "LHI"], ["DP", "AL"], ["EV3", "NH"], ["DWE", "SCH"]]; 


// -------------------------- Helper Functions ------------------------------

// 1. NEW: Function to toggle the button visual state
function toggleOutside() {
    const btn = document.getElementById("outside_btn");
    
    // Toggle the visual class
    btn.classList.toggle("active-blue");

    // Check if it is now active to change the text
    if (btn.classList.contains("active-blue")) {
        // Add Checkmark (✔)
        btn.innerHTML = "Use Outside Paths: On";
    } else {
        // Reset to original text
        btn.innerHTML = "Use Outside Paths: Off";
    }
}

// Returns the Building corresponding to a name
function findBuilding(name) {
    return nodes.find(node => node.name === name) || null;
}

function isBuildingClosed(name) {
    return closedBuildings.includes(name);
}

function isTunnelClosed(nodeA, nodeB) {
    const isClosed = closedTunnels.some(pair => 
        (pair[0] === nodeA && pair[1] === nodeB) || 
        (pair[0] === nodeB && pair[1] === nodeA)
    );
    return isClosed || isBuildingClosed(nodeA) || isBuildingClosed(nodeB);
}

function isOutsideTunnel(nodeA, nodeB) {
    return outsideTunnels.some(pair => 
        (pair[0] === nodeA && pair[1] === nodeB) || 
        (pair[0] === nodeB && pair[1] === nodeA)
    );
}

function findAllPaths(start, end, allowOutside = false, path = []) {
    path = [...path, start];

    // Stop if start/end nodes are closed
    if (isBuildingClosed(start) || isBuildingClosed(end)) return [];

    if (start === end) return [path];

    let allPaths = [];
    const currentBuilding = findBuilding(start);
    if (!currentBuilding) return [];

    for (const neighbor of currentBuilding.outNeighbours) {
        // Prevent cycles
        if (path.includes(neighbor)) continue;

        // Check if CLOSED
        if (isTunnelClosed(start, neighbor)) continue;

        // Check if OUTSIDE (skip if outside is not allowed)
        if (isOutsideTunnel(start, neighbor) && !allowOutside) continue;

        const newPaths = findAllPaths(neighbor, end, allowOutside, path);
        allPaths = allPaths.concat(newPaths);
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

// ==========================================
// 4. MAP VISUALIZATION (D3)
// ==========================================

function initMap() {
    // 1. Generate Links Data
    const links = [];
    nodes.forEach(source => {
        source.outNeighbours.forEach(targetName => {
            const target = findBuilding(targetName);
            if (target) {
                links.push({ source: source, target: target });
            }
        });
    });

    // 2. Setup SVG
    const width = 800;
    const height = 800;
    const svg = d3.select("#subway-map")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("width", "100%")
        .attr("height", "100%"); 

    const g = svg.append("g"); 

    // 3. Draw Links
    const linkElements = g.selectAll(".link")
        .data(links)
        .enter().append("line")
        .attr("class", d => {
            let classes = "link";
            const u = d.source.name;
            const v = d.target.name;

            // Priority 1: Closed (Red)
            if (isTunnelClosed(u, v)) return "link closed";
            
            // Priority 2: Outside (Dashed)
            if (isOutsideTunnel(u, v)) classes += " outside";
            
            return classes;
        })
        .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x).attr("y2", d => d.target.y);

    // 4. Draw Nodes

    const nodeElements = g.selectAll(".node")
        .data(nodes)
        .enter().append("g")
        .attr("class", d => isBuildingClosed(d.name) ? "node closed" : "node")
        .attr("id", d => `node-${d.name}`)
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .style("cursor", "pointer") // Makes mouse look like a hand pointer
        
        // --- CLICK EVENT LISTENER ---
        .on("click", function(event, d) {
            // Get current values
            const startInput = document.getElementById("start_txtfield");
            const endInput = document.getElementById("end_txtfield");
            
            // Logic: Where should we put this building name?
            if (startInput.value === "") {
                // 1. If Start is empty, fill Start
                startInput.value = d.name;
            } else if (endInput.value === "") {
                // 2. If Start is full but End is empty, fill End
                endInput.value = d.name;
            } else {
                // 3. If both are full, overwrite Destination
                endInput.value = d.name;
            }

            // Update visuals (Green box/Checkmark)
            if (typeof updateFieldColor === "function") {
                updateFieldColor();
            }
        });

    nodeElements.append("circle").attr("r", 8);
    nodeElements.append("text")
        .attr("dx", 12).attr("dy", ".35em").text(d => d.name);

    // Store globally (existing code)
    window.mapVisuals = { svg, linkElements, nodeElements };
}

// ==========================================
// 5. USER INTERACTION
// ==========================================

function calculatePath() {
    let start = document.getElementById("start_txtfield").value.toUpperCase();
    let end = document.getElementById("end_txtfield").value.toUpperCase();
    const outputText = document.getElementById("output");
    
    // --- UPDATED LINE ---
    // Check if the button has the blue class
    const btn = document.getElementById("outside_btn");
    const useOutside = btn ? btn.classList.contains("active-blue") : false;

    if (!findBuilding(start) || !findBuilding(end)) {
        alert("Invalid buildings");
        return;
    }

    // ... (Rest of your calculatePath logic stays exactly the same) ...
    let allPaths = findAllPaths(start, end, useOutside);
    let forcedOutside = false;

    if (allPaths.length === 0 && !useOutside) {
        const outsidePaths = findAllPaths(start, end, true);
        if (outsidePaths.length > 0) {
            allPaths = outsidePaths;
            forcedOutside = true;
        }
    }
    
    if (allPaths.length > 0) {
        let bestPath = sortPaths(allPaths)[0];
        let msg = "";

        if (forcedOutside) {
            msg = "⚠️ Outdoor path in use (No indoor route)<br>";
            outputText.innerHTML = msg; 
            outputText.style.color = "#00438aff"; 
        } else {
            outputText.textContent = msg;
            outputText.style.color = "rgb(234, 171, 0)"; 
        }

        highlightMap(bestPath);
    } else {
        alert("No path found (Check for closed buildings/tunnels).");
        clearMapVisualsOnly();
    }
}

function highlightMap(pathArray) {
    if (!window.mapVisuals) return;
    const { svg, linkElements, nodeElements } = window.mapVisuals;
    
    // Dim Everything
    svg.classed("focus-mode", true);
    
    // Reset previous actives
    svg.selectAll(".active").classed("active", false);

    // Highlight Nodes
    nodeElements.filter(d => pathArray.includes(d.name))
        .classed("active", true);

    // Highlight Edges
    linkElements.each(function(d) {
        const u = d.source.name;
        const v = d.target.name;
        
        let isPathEdge = false;
        // Check if this link connects two nodes that are adjacent in the path
        for (let i = 0; i < pathArray.length - 1; i++) {
            if ((pathArray[i] === u && pathArray[i+1] === v) || 
                (pathArray[i] === v && pathArray[i+1] === u)) {
                isPathEdge = true;
                break;
            }
        }

        if (isPathEdge) {
            d3.select(this).classed("active", true);
        }
    });
}

// 3. UPDATE: clearMap (Turn off the blue button)
function clearMap() {
    document.getElementById("start_txtfield").value = "";
    document.getElementById("end_txtfield").value = "";
    
    // --- RESET TOGGLE BUTTON ---
    const btn = document.getElementById("outside_btn");
    if (btn) {
        btn.classList.remove("active-blue"); // Remove Blue Color
        btn.innerHTML = "Use Outside Paths: Off"; // Remove Checkmark
    }
    
    const output = document.getElementById("output");
    output.textContent = "";
    
    if (typeof updateFieldColor === "function") {
        updateFieldColor(); 
    }
    
    clearMapVisualsOnly();
}
function clearMapVisualsOnly() {
    if (window.mapVisuals) {
        const { svg } = window.mapVisuals;
        svg.classed("focus-mode", false);
        svg.selectAll(".active").classed("active", false);
    }
}

// Initialize on load
window.onload = function() {
    initMap();
};

// --- KEYBOARD SHORTCUTS ---
document.addEventListener("keydown", function(event) {
    // 1. ENTER Key -> Find Path
    if (event.key === "Enter") {

        calculatePath();
    }
    
    // 2. 'O' or 'o' Key -> Toggle Outside Mode
    // We check if the user is NOT typing in a text box (to avoid typing 'o' in a name)
    else if (event.key.toLowerCase() === "o") {
        const activeTag = document.activeElement.tagName;
        if (activeTag !== "INPUT" && activeTag !== "TEXTAREA") {
            toggleOutside();
        }
    }

    // 3. ESCAPE Key -> Clear Map
    else if (event.key === "Escape") {
        clearMap();
        // Optional: Remove focus from inputs so you can use 'O' immediately
        document.activeElement.blur(); 
    }
});