from dataclasses import dataclass
from typing import List

@dataclass
class Building:
    name: str
    out_neighbours: List[str]

# -------------------------- Graph Definition ------------------------------

# All Buildings
nodes = [
    #NW
    Building("EXP", ["LHI", "BMH"]),
    Building("LHI", ["EXP", "BMH", "PAC"]),
    Building("BMH", ["LHI", "EXP"]),
    Building("PAC", ["LHI", "SLC"]),
    Building("SLC", ["PAC", "MC"]),

    #CENTRAL 
    Building("MC", ["C2", "QNC", "SLC"]),
    ## exp MC Building("MC", ["C2", "QNC", "M3", "DC"])
    Building("C2", ["MC", "DC", "ESC"]),
    Building("DC", ["C2", "CIM", "M3"]),
    ## exp DC Building("DC", ["C2", "CIM", "M3", "MC"])
    Building("M4", []),
    Building("M3", ["DC"]),
    ## exp M3 Building("M3", ["DC", "MC"])
    Building("QNC", ["MC", "B2", "STC"]),
    Building("B2", ["B1", "QNC"]),
    Building("B1", ["B2", "ESC"]),
    Building("STC", ["NH", "B2"]),
    Building("NH", ["STC"]),
    Building("ESC", ["C2", "B1", "EIT"]),
    Building("EIT", ["CIM", "PHY", "ESC"]),
    Building("CIM", ["DC", "EIT", "E3"]), 
    Building("PHY", ["EIT", "E2"]), 
    Building("RCH", ["E2", "DWE"]),
    Building("DWE", ["RCH", "E2", "SCH"]),
    Building("CPH", ["E2"]),

    #ENGINEERING
    Building("E2", ["PHY", "E3", "CPH", "DWE", "RCH"]), 
    Building("E3", ["CIM", "E2", "E5"]), 
    Building("E5", ["E3", "E7"]), 
    Building("E6", ["E7"]), 
    Building("E7", ["E6", "E5"]), 

    #SOUTH
    Building("EV3", ["EV2"]), 
    Building("EV2", ["EV3", "EV1"]), 
    Building("EV1", ["EV2", "AL"]), 

    Building("AL", ["LIB", "ML"]), 
    Building("ML", ["AL"]), 
    Building("LIB", ["AL"]), 
    Building("TC", ["AL", "HH", "SCH"]), 
    Building("PAS", ["HH"]), 
    Building("HH", ["TC", "PAS"]), 
    Building("SCH", ["TC", "DWE"])
]

# -------------------------- Helper Functions ------------------------------

# Returns the Building corresponding to a name
def find_building(name: str):
    for node in nodes:
        if node.name == name:
            return node
    print("Building " + name +" not found")
    return -1

# DFS algorithm that finds all the paths
def find_all_paths(start: str, end: str, path = None):
    if path is None:
        path = []
    path = path + [start]

    if start == end:
        return [path]

    all_paths = []

    current_building = find_building(start)

    for neighbor in current_building.out_neighbours:
        if neighbor not in path:
            new_paths = find_all_paths(neighbor, end, path)
            for p in new_paths:
                all_paths.append(p)

    return all_paths

#Sort the paths from shortest to longest
def sort_paths(paths):
    length = len(paths)
    for i in range (length - 1):
        for j in range (length - 1):
            length_l = len(paths[j])
            length_r = len(paths[j+1])
            if (length_l > length_r):
                temp = paths[j]
                paths[j] = paths[j+1]
                paths[j+1] = temp

    return paths

# -------------------------- Main Function ----------------------------------

start = input("Starting Building: ").upper()
end = input("Destination Building: ").upper()


all_paths = find_all_paths(start, end)
if all_paths:
    all_paths = sort_paths(all_paths)

    print("The most efficient path from " + start + " to " + end + ":" )
    print(" -> ".join(all_paths[0]) + "\n")

    print("All paths from " + start + " to " + end + ":" )
    for path in all_paths:
        print(" -> ".join(path))
else:
    print("No paths found from " + start + " to " + end + ".")

delay = input("")

