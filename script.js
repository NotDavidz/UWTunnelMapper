// -------------------------- Building Definition ------------------------------

class Building {
    constructor(name, neighbours, x, y) {
        this._name = name;
        this.neighbours = neighbours;
        this.x = x;
        this.y = y;
    }

    get name() {
        return this._name;
    }
}

// -------------------------- Graph Manager ------------------------------

class TunnelGraph {
    constructor() {
        this.buildings = new Map();
        this.closedBuildings = new Set();
        this.closedTunnels = new Set();
        this.outsideTunnels = new Set();
        this.graphData = null;
    }

    async loadGraph(url = 'graph.json') {
        try {
            const response = await fetch(url);
            this.graphData = await response.json();
            
            // Build buildings map for O(1) lookup
            for (const bdata of this.graphData.buildings) {
                const building = new Building(
                    bdata.name,
                    bdata.neighbours || [],
                    bdata.x || 0,
                    bdata.y || 0
                );
                this.buildings.set(building.name, building);
            }
            
            // Load closed buildings
            this.closedBuildings = new Set(this.graphData.closedBuildings || []);
            
            // Convert tunnel pairs to strings for bidirectional lookup
            for (const pair of (this.graphData.closedTunnels || [])) {
                this.closedTunnels.add(this._tunnelKey(...pair));
            }
            for (const pair of (this.graphData.outsideTunnels || [])) {
                this.outsideTunnels.add(this._tunnelKey(...pair));
            }
            
            return true;
        } catch (error) {
            console.error('Failed to load graph:', error);
            return false;
        }
    }

    _tunnelKey(a, b) {
        // Create consistent key regardless of order
        return [a, b].sort().join('-');
    }

    findBuilding(name) {
        return this.buildings.get(name) || null;
    }

    isBuildingClosed(name) {
        return this.closedBuildings.has(name);
    }

    isTunnelClosed(a, b) {
        if (this.isBuildingClosed(a) || this.isBuildingClosed(b)) {
            return true;
        }
        return this.closedTunnels.has(this._tunnelKey(a, b));
    }

    isOutsideTunnel(a, b) {
        return this.outsideTunnels.has(this._tunnelKey(a, b));
    }

    findShortestPath(start, end, allowOutside = false) {
        // BFS for optimal shortest path (O(V+E))
        const startBuilding = this.findBuilding(start);
        const endBuilding = this.findBuilding(end);

        if (!startBuilding || !endBuilding) return null;
        if (this.isBuildingClosed(start) || this.isBuildingClosed(end)) return null;
        if (start === end) return [start];

        const queue = [[start, [start]]];
        const visited = new Set([start]);

        while (queue.length > 0) {
            const [current, path] = queue.shift();
            const building = this.findBuilding(current);

            if (!building) continue;

            for (const neighbor of building.neighbours) {
                if (visited.has(neighbor)) continue;
                if (this.isTunnelClosed(current, neighbor)) continue;
                if (!allowOutside && this.isOutsideTunnel(current, neighbor)) continue;

                if (neighbor === end) {
                    return path.concat(neighbor);
                }

                visited.add(neighbor);
                queue.push([neighbor, path.concat(neighbor)]);
            }
        }

        return null;
    }

    findAllPaths(start, end, allowOutside = false) {
        // DFS for all paths (exponential - use for debugging only)
        if (start === end) return [[start]];
        if (!this.findBuilding(start) || this.isBuildingClosed(start)) return [];

        const allPaths = [];

        const dfs = (current, path) => {
            if (current === end) {
                allPaths.push([...path]);
                return;
            }

            const building = this.findBuilding(current);
            if (!building) return;

            for (const neighbor of building.neighbours) {
                if (path.includes(neighbor)) continue;
                if (this.isTunnelClosed(current, neighbor)) continue;
                if (!allowOutside && this.isOutsideTunnel(current, neighbor)) continue;

                path.push(neighbor);
                dfs(neighbor, path);
                path.pop();
            }
        };

        dfs(start, [start]);
        return allPaths.sort((a, b) => a.length - b.length);
    }
}

// Global graph instance
const graph = new TunnelGraph();

// -------------------------- Utility Functions ------------------------------

// Sanitize user input to prevent XSS
function sanitizeInput(input) {
    // Remove HTML tags
    input = input.replace(/<[^>]*>/g, '');
    // Only allow alphanumeric and spaces
    input = input.replace(/[^A-Z0-9\s]/gi, '');
    return input.trim().toUpperCase();
}

// Debounce function for input handlers
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// -------------------------- UI Functions ------------------------------

function toggleOutside() {
    const btn = document.getElementById("outside_btn");
    btn.classList.toggle("active-blue");

    if (btn.classList.contains("active-blue")) {
        btn.innerHTML = "Use Outside Paths: On";
    } else {
        btn.innerHTML = "Use Outside Paths: Off";
    }
}

function updateFieldHelper(input, icon, valid) {
    if (valid) {
        input.style.backgroundColor = "#c1deb5";
        icon.textContent = "✅";
        return 0;
    } else if (input.value === "") {
        input.style.backgroundColor = "#ffffff";
        icon.textContent = "";
        return 1;
    } else {
        input.style.backgroundColor = "#edcfcb";
        icon.textContent = "❌";
        return 1;
    }
}

function updateFieldColor() {
    const startInput = document.getElementById("start_txtfield");
    const endInput = document.getElementById("end_txtfield");
    const startIcon = document.getElementById("start_prompt_icon");
    const endIcon = document.getElementById("end_prompt_icon");

    const start = sanitizeInput(startInput.value);
    const end = sanitizeInput(endInput.value);

    const startValid = graph.findBuilding(start) !== null;
    const endValid = graph.findBuilding(end) !== null;

    const acc = updateFieldHelper(startInput, startIcon, startValid) +
                updateFieldHelper(endInput, endIcon, endValid);

    const calculateBtn = document.getElementById("calculate");
    calculateBtn.disabled = acc !== 0;
}

// Debounced version for better performance
const debouncedUpdateFieldColor = debounce(updateFieldColor, 150);

// -------------------------- Map Visualization ------------------------------

function initMap() {
    const nodes = Array.from(graph.buildings.values());

    // Generate links
    const links = [];
    nodes.forEach(source => {
        source.neighbours.forEach(targetName => {
            const target = graph.findBuilding(targetName);
            if (target) {
                links.push({ source, target });
            }
        });
    });

    // Initialize SVG
    const width = 800;
    const height = 800;
    const svg = d3.select("#subway-map")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("width", "100%")
        .attr("height", "100%");

    const g = svg.append("g");

    // Draw links
    const linkElements = g.selectAll(".link")
        .data(links)
        .enter().append("line")
        .attr("class", d => {
            let classes = "link";
            const u = d.source.name;
            const v = d.target.name;

            if (graph.isTunnelClosed(u, v)) return "link closed";
            if (graph.isOutsideTunnel(u, v)) classes += " outside";

            return classes;
        })
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    // Draw nodes
    const nodeElements = g.selectAll(".node")
        .data(nodes)
        .enter().append("g")
        .attr("class", d => graph.isBuildingClosed(d.name) ? "node closed" : "node")
        .attr("id", d => `node-${d.name}`)
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .style("cursor", "pointer")
        .on("click", function(event, d) {
            const startInput = document.getElementById("start_txtfield");
            const endInput = document.getElementById("end_txtfield");

            if (startInput.value === "") {
                startInput.value = d.name;
            } else if (endInput.value === "") {
                endInput.value = d.name;
            } else {
                endInput.value = d.name;
            }

            updateFieldColor();
        });

    nodeElements.append("circle").attr("r", 8);
    nodeElements.append("text")
        .attr("dx", 12)
        .attr("dy", ".35em")
        .text(d => d.name);

    // Title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 50)
        .attr("text-anchor", "middle")
        .style("font-family", "Arial, sans-serif")
        .style("font-size", "30px")
        .style("font-weight", "bold")
        .style("fill", "#b88701ff")
        .style("stroke-width", "0.5px")
        .text("University of Waterloo Tunnel and Bridge System Map");

    window.mapVisuals = { svg, linkElements, nodeElements };
}

function highlightMap(pathArray) {
    if (!window.mapVisuals) return;
    const { svg, linkElements, nodeElements } = window.mapVisuals;

    svg.classed("focus-mode", true);
    svg.selectAll(".active").classed("active", false);

    // Highlight nodes
    nodeElements.filter(d => pathArray.includes(d.name))
        .classed("active", true);

    // Highlight edges
    linkElements.each(function(d) {
        const u = d.source.name;
        const v = d.target.name;

        let isPathEdge = false;
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

function clearMapVisualsOnly() {
    if (window.mapVisuals) {
        const { svg } = window.mapVisuals;
        svg.classed("focus-mode", false);
        svg.selectAll(".active").classed("active", false);
    }
}

// -------------------------- Main Functions ------------------------------

function calculatePath() {
    let start = sanitizeInput(document.getElementById("start_txtfield").value);
    let end = sanitizeInput(document.getElementById("end_txtfield").value);
    const outputText = document.getElementById("output");

    const btn = document.getElementById("outside_btn");
    const useOutside = btn ? btn.classList.contains("active-blue") : false;

    if (!graph.findBuilding(start) || !graph.findBuilding(end)) {
        alert("Invalid buildings");
        return;
    }

    let bestPath = graph.findShortestPath(start, end, useOutside);
    let forcedOutside = false;

    // Fallback to outside paths if no indoor path
    if (!bestPath && !useOutside) {
        bestPath = graph.findShortestPath(start, end, true);
        if (bestPath) {
            forcedOutside = true;
        }
    }

    if (bestPath) {
        let msg = "";
        if (forcedOutside) {
            msg = "⚠️ Outdoor path in use (No indoor route)<br>";
            outputText.innerHTML = msg;
            outputText.style.color = "#00438aff";
        } else {
            outputText.textContent = "";
        }
        highlightMap(bestPath);
    } else {
        alert("No path found (Check for closed buildings/tunnels).");
        clearMapVisualsOnly();
    }
}

function clearMap() {
    document.getElementById("start_txtfield").value = "";
    document.getElementById("end_txtfield").value = "";

    const btn = document.getElementById("outside_btn");
    if (btn) {
        btn.classList.remove("active-blue");
        btn.innerHTML = "Use Outside Paths: Off";
    }

    const output = document.getElementById("output");
    output.textContent = "";

    updateFieldColor();
    clearMapVisualsOnly();
}

// -------------------------- Keyboard Shortcuts ------------------------------

document.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        calculatePath();
    } else if (event.key.toLowerCase() === "o") {
        const activeTag = document.activeElement.tagName;
        if (activeTag !== "INPUT" && activeTag !== "TEXTAREA") {
            toggleOutside();
        }
    } else if (event.key === "Escape") {
        clearMap();
        document.activeElement.blur();
    }
});

// -------------------------- Initialize on Load ------------------------------

window.onload = async function() {
    // Load graph data first
    const loaded = await graph.loadGraph('graph.json');
    if (!loaded) {
        alert("Failed to load tunnel data. Please ensure graph.json is available.");
        return;
    }

    // Initialize map visualization
    initMap();

    // Set up debounced input handlers
    const startInput = document.getElementById("start_txtfield");
    const endInput = document.getElementById("end_txtfield");
    
    if (startInput) {
        startInput.addEventListener('input', debouncedUpdateFieldColor);
    }
    if (endInput) {
        endInput.addEventListener('input', debouncedUpdateFieldColor);
    }
};
