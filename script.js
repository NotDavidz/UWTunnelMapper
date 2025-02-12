
//Graph Definition for Building/Connections 

class Building {
    constructor(name, outNeighbours) {
        this._name = name;  // Use a private variable
        this.outNeighbours = outNeighbours;
    }

    get name() {
        return this._name;
    }
}


// -------------------------- Graph Definition ------------------------------

const nodes = [
    new Building("EXP", ["LHI", "BMH"]),
    new Building("LHI", ["EXP", "BMH", "PAC"]),
    new Building("BMH", ["LHI", "EXP"]),
    new Building("PAC", ["LHI", "SLC"]),
    new Building("SLC", ["PAC", "MC"]),
    new Building("MC", ["C2", "QNC", "SLC"]),
    new Building("C2", ["MC", "DC", "ESC"]),
    new Building("DC", ["C2", "CIM", "M3"]),
    new Building("M4", []),
    new Building("M3", ["DC"]),
    new Building("QNC", ["MC", "B2", "STC"]),
    new Building("B2", ["B1", "QNC"]),
    new Building("B1", ["B2", "ESC"]),
    new Building("STC", ["NH", "B2"]),
    new Building("NH", ["STC"]),
    new Building("ESC", ["C2", "B1", "EIT"]),
    new Building("EIT", ["CIM", "PHY", "ESC"]),
    new Building("CIM", ["DC", "EIT", "E3"]),
    new Building("PHY", ["EIT", "E2"]),
    new Building("RCH", ["E2", "DWE"]),
    new Building("DWE", ["RCH", "E2", "SCH"]),
    new Building("CPH", ["E2"]),
    new Building("E2", ["PHY", "E3", "CPH", "DWE", "RCH"]),
    new Building("E3", ["CIM", "E2", "E5"]),
    new Building("E5", ["E3", "E7"]),
    new Building("E6", ["E7"]),
    new Building("E7", ["E6", "E5"]),
    new Building("EV3", ["EV2"]),
    new Building("EV2", ["EV3", "EV1"]),
    new Building("EV1", ["EV2", "AL"]),
    new Building("AL", ["LIB", "ML", "TC"]),
    new Building("ML", ["AL"]),
    new Building("LIB", ["AL"]),
    new Building("TC", ["AL", "HH", "SCH"]),
    new Building("PAS", ["HH"]),
    new Building("HH", ["TC", "PAS"]),
    new Building("SCH", ["TC", "DWE"])
];
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




