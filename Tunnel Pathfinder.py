#!/usr/bin/env python3
"""
Tunnel Pathfinder - BFS-based shortest path finder for UWaterloo tunnel system.

Usage:
    python "Tunnel Pathfinder.py"

Features:
    - BFS algorithm for optimal shortest path (O(V+E) vs exponential DFS)
    - Shared JSON graph data (graph.json)
    - Input validation and sanitization
    - Handles closed buildings and optional outside paths
"""

import json
import re
import sys
from collections import deque
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


@dataclass
class Building:
    """Represents a building in the tunnel network."""
    name: str
    neighbours: list[str]
    x: int = 0
    y: int = 0


class TunnelGraph:
    """Manages the tunnel network graph with BFS pathfinding."""
    
    def __init__(self, graph_file: str = "graph.json"):
        """Load graph from JSON file."""
        self.graph_file = Path(graph_file)
        self.buildings: dict[str, Building] = {}
        self.closed_buildings: set[str] = set()
        self.closed_tunnels: set[frozenset[str]] = set()
        self.outside_tunnels: set[frozenset[str]] = set()
        
        self._load_graph()
        self._build_lookup()
    
    def _load_graph(self) -> None:
        """Load graph data from JSON file."""
        if not self.graph_file.exists():
            raise FileNotFoundError(f"Graph file not found: {self.graph_file}")
        
        with open(self.graph_file, 'r') as f:
            data = json.load(f)
        
        self._raw_buildings = data.get("buildings", [])
        self.closed_buildings = set(data.get("closedBuildings", []))
        
        # Convert tunnel pairs to frozensets for bidirectional lookup
        self.closed_tunnels = {
            frozenset(pair) for pair in data.get("closedTunnels", [])
        }
        self.outside_tunnels = {
            frozenset(pair) for pair in data.get("outsideTunnels", [])
        }
    
    def _build_lookup(self) -> None:
        """Build O(1) lookup dictionary for buildings."""
        for bdata in self._raw_buildings:
            building = Building(
                name=bdata["name"],
                neighbours=bdata.get("neighbours", []),
                x=bdata.get("x", 0),
                y=bdata.get("y", 0)
            )
            self.buildings[building.name] = building
    
    def find_building(self, name: str) -> Optional[Building]:
        """O(1) lookup for building by name."""
        return self.buildings.get(name)
    
    def is_building_closed(self, name: str) -> bool:
        """Check if a building is closed."""
        return name in self.closed_buildings
    
    def is_tunnel_closed(self, a: str, b: str) -> bool:
        """Check if a tunnel between two buildings is closed."""
        if self.is_building_closed(a) or self.is_building_closed(b):
            return True
        return frozenset([a, b]) in self.closed_tunnels
    
    def is_outside_tunnel(self, a: str, b: str) -> bool:
        """Check if a tunnel is an outside path."""
        return frozenset([a, b]) in self.outside_tunnels
    
    def find_shortest_path(
        self,
        start: str,
        end: str,
        allow_outside: bool = False
    ) -> Optional[list[str]]:
        """
        Find shortest path using BFS (O(V+E) time complexity).
        
        Args:
            start: Starting building code
            end: Destination building code
            allow_outside: Whether to allow outside tunnels
        
        Returns:
            List of building codes representing the path, or None if no path exists
        """
        # Validate inputs
        start_building = self.find_building(start)
        end_building = self.find_building(end)
        
        if not start_building or not end_building:
            return None
        
        # Check if either building is closed
        if self.is_building_closed(start) or self.is_building_closed(end):
            return None
        
        # Trivial case: same building
        if start == end:
            return [start]
        
        # BFS with path tracking
        queue = deque([(start, [start])])
        visited = {start}
        
        while queue:
            current, path = queue.popleft()
            current_building = self.find_building(current)
            
            if not current_building:
                continue
            
            for neighbor in current_building.neighbours:
                # Skip if already visited
                if neighbor in visited:
                    continue
                
                # Skip closed tunnels
                if self.is_tunnel_closed(current, neighbor):
                    continue
                
                # Skip outside tunnels if not allowed
                if not allow_outside and self.is_outside_tunnel(current, neighbor):
                    continue
                
                # Found destination
                if neighbor == end:
                    return path + [neighbor]
                
                visited.add(neighbor)
                queue.append((neighbor, path + [neighbor]))
        
        return None  # No path found
    
    def find_all_paths(
        self,
        start: str,
        end: str,
        allow_outside: bool = False
    ) -> list[list[str]]:
        """
        Find all paths using DFS (for comparison/debugging).
        
        Note: This is exponential in worst case. Use find_shortest_path() for efficiency.
        """
        if start == end:
            return [[start]]
        
        start_building = self.find_building(start)
        if not start_building or self.is_building_closed(start):
            return []
        
        all_paths = []
        
        def dfs(current: str, path: list[str]) -> None:
            if current == end:
                all_paths.append(path[:])
                return
            
            building = self.find_building(current)
            if not building:
                return
            
            for neighbor in building.neighbours:
                if neighbor in path:  # Prevent cycles
                    continue
                if self.is_tunnel_closed(current, neighbor):
                    continue
                if not allow_outside and self.is_outside_tunnel(current, neighbor):
                    continue
                
                path.append(neighbor)
                dfs(neighbor, path)
                path.pop()
        
        dfs(start, [start])
        return sorted(all_paths, key=len)  # Sort by length


def sanitize_input(user_input: str) -> str:
    """
    Sanitize user input to prevent injection attacks.
    
    Only allows uppercase letters, spaces, and basic punctuation.
    """
    # Remove any HTML/JS tags
    user_input = re.sub(r'<[^>]*>', '', user_input)
    # Only allow alphanumeric and spaces
    user_input = re.sub(r'[^A-Z0-9\s]', '', user_input.upper())
    # Strip whitespace
    return user_input.strip()


def main():
    """Main entry point for the tunnel pathfinder."""
    print("=" * 60)
    print("  University of Waterloo Tunnel Pathfinder")
    print("=" * 60)
    print()
    
    # Load graph
    try:
        graph = TunnelGraph()
    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error parsing graph.json: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Get user input
    start_raw = input("Starting Building: ")
    end_raw = input("Destination Building: ")
    
    # Sanitize inputs
    start = sanitize_input(start_raw)
    end = sanitize_input(end_raw)
    
    if not start or not end:
        print("Error: Invalid building codes.", file=sys.stderr)
        sys.exit(1)
    
    # Find shortest path
    shortest_path = graph.find_shortest_path(start, end)
    
    if shortest_path:
        print()
        print(f"✓ Shortest path from {start} to {end}:")
        print("  " + " → ".join(shortest_path))
        print(f"  ({len(shortest_path) - 1} tunnel(s))")
        
        # Check if path uses outside tunnels
        uses_outside = any(
            graph.is_outside_tunnel(shortest_path[i], shortest_path[i+1])
            for i in range(len(shortest_path) - 1)
        )
        if uses_outside:
            print("  ⚠️  Note: This path includes outdoor sections")
    else:
        # Try with outside paths enabled
        outside_path = graph.find_shortest_path(start, end, allow_outside=True)
        
        if outside_path:
            print()
            print(f"⚠️  No indoor path from {start} to {end}")
            print(f"  Outdoor path available:")
            print("  " + " → ".join(outside_path))
        else:
            print()
            print(f"✗ No path found from {start} to {end}")
            print("  Check for closed buildings or disconnected tunnels")
    
    print()
    try:
        input("Press Enter to exit...")
    except EOFError:
        pass  # Non-interactive mode


if __name__ == "__main__":
    main()
