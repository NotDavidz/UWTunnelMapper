#!/usr/bin/env python3
"""
Unit tests for Tunnel Pathfinder.

Tests cover:
- BFS shortest path correctness
- Edge cases (same building, no path, closed buildings)
- Outside tunnel handling
- Input sanitization
- Graph loading from JSON
"""

import json
import tempfile
import unittest
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).parent))

# Import from the main module (handle space in filename)
import importlib.util
spec = importlib.util.spec_from_file_location(
    "TunnelPathfinder",
    Path(__file__).parent / "Tunnel Pathfinder.py"
)
TunnelPathfinder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(TunnelPathfinder)

TunnelGraph = TunnelPathfinder.TunnelGraph
sanitize_input = TunnelPathfinder.sanitize_input
Building = TunnelPathfinder.Building


class TestSanitizeInput(unittest.TestCase):
    """Test input sanitization function."""
    
    def test_basic_uppercase(self):
        self.assertEqual(sanitize_input("mc"), "MC")
        self.assertEqual(sanitize_input("Mc"), "MC")
    
    def test_removes_html(self):
        # HTML tags are removed, but content inside may remain
        self.assertEqual(sanitize_input("<script>alert('xss')</script>"), "ALERTXSS")
        self.assertEqual(sanitize_input("<b>MC</b>"), "MC")
    
    def test_removes_special_chars(self):
        # Special chars removed, spaces preserved (consecutive spaces collapsed)
        self.assertEqual(sanitize_input("MC;DROP TABLE"), "MCDROP TABLE")
        self.assertEqual(sanitize_input("MC' OR '1'='1"), "MC OR 11")
    
    def test_strips_whitespace(self):
        self.assertEqual(sanitize_input("  MC  "), "MC")
        self.assertEqual(sanitize_input("\nMC\n"), "MC")
    
    def test_empty_input(self):
        self.assertEqual(sanitize_input(""), "")
        self.assertEqual(sanitize_input("   "), "")


class TestTunnelGraph(unittest.TestCase):
    """Test TunnelGraph class functionality."""
    
    def setUp(self):
        """Create a minimal test graph."""
        self.test_graph = {
            "buildings": [
                {"name": "A", "neighbours": ["B", "C"], "x": 0, "y": 0},
                {"name": "B", "neighbours": ["A", "D"], "x": 10, "y": 0},
                {"name": "C", "neighbours": ["A", "D"], "x": 0, "y": 10},
                {"name": "D", "neighbours": ["B", "C"], "x": 10, "y": 10},
            ],
            "closedBuildings": [],
            "closedTunnels": [],
            "outsideTunnels": []
        }
        
        self.temp_file = tempfile.NamedTemporaryFile(
            mode='w', suffix='.json', delete=False
        )
        json.dump(self.test_graph, self.temp_file)
        self.temp_file.close()
    
    def tearDown(self):
        """Clean up temp file."""
        Path(self.temp_file.name).unlink()
    
    def test_load_graph(self):
        """Test loading graph from JSON."""
        graph = TunnelGraph(self.temp_file.name)
        self.assertEqual(len(graph.buildings), 4)
        self.assertIn("A", graph.buildings)
    
    def test_find_building(self):
        """Test O(1) building lookup."""
        graph = TunnelGraph(self.temp_file.name)
        building = graph.find_building("A")
        self.assertIsNotNone(building)
        self.assertEqual(building.name, "A")
    
    def test_find_building_not_found(self):
        """Test lookup for non-existent building."""
        graph = TunnelGraph(self.temp_file.name)
        self.assertIsNone(graph.find_building("Z"))
    
    def test_shortest_path_simple(self):
        """Test BFS finds shortest path."""
        graph = TunnelGraph(self.temp_file.name)
        path = graph.find_shortest_path("A", "D")
        # Both A->B->D and A->C->D are valid (length 3)
        self.assertEqual(len(path), 3)
        self.assertEqual(path[0], "A")
        self.assertEqual(path[-1], "D")
    
    def test_shortest_path_same_building(self):
        """Test path from building to itself."""
        graph = TunnelGraph(self.temp_file.name)
        path = graph.find_shortest_path("A", "A")
        self.assertEqual(path, ["A"])
    
    def test_shortest_path_no_path(self):
        """Test when no path exists."""
        # Create disconnected graph
        disconnected = {
            "buildings": [
                {"name": "A", "neighbours": [], "x": 0, "y": 0},
                {"name": "B", "neighbours": [], "x": 10, "y": 0},
            ],
            "closedBuildings": [],
            "closedTunnels": [],
            "outsideTunnels": []
        }
        temp = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
        json.dump(disconnected, temp)
        temp.close()
        
        try:
            graph = TunnelGraph(temp.name)
            self.assertIsNone(graph.find_shortest_path("A", "B"))
        finally:
            Path(temp.name).unlink()
    
    def test_closed_building(self):
        """Test that closed buildings block paths."""
        self.test_graph["closedBuildings"] = ["B"]
        temp = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
        json.dump(self.test_graph, temp)
        temp.close()
        
        try:
            graph = TunnelGraph(temp.name)
            self.assertTrue(graph.is_building_closed("B"))
            # Path should go A->C->D instead of A->B->D
            path = graph.find_shortest_path("A", "D")
            self.assertIn("C", path)
            self.assertNotIn("B", path)
        finally:
            Path(temp.name).unlink()
    
    def test_closed_tunnel(self):
        """Test that closed tunnels are avoided."""
        self.test_graph["closedTunnels"] = [["A", "B"]]
        temp = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
        json.dump(self.test_graph, temp)
        temp.close()
        
        try:
            graph = TunnelGraph(temp.name)
            self.assertTrue(graph.is_tunnel_closed("A", "B"))
            # Should use A->C->D
            path = graph.find_shortest_path("A", "D")
            self.assertNotIn("B", path)
        finally:
            Path(temp.name).unlink()
    
    def test_outside_tunnel_disabled(self):
        """Test outside tunnels are avoided when disabled."""
        self.test_graph["outsideTunnels"] = [["A", "B"]]
        temp = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
        json.dump(self.test_graph, temp)
        temp.close()
        
        try:
            graph = TunnelGraph(temp.name)
            # Force use of non-outside path
            path = graph.find_shortest_path("A", "D", allow_outside=False)
            # Should exist via C
            self.assertIsNotNone(path)
        finally:
            Path(temp.name).unlink()
    
    def test_outside_tunnel_enabled(self):
        """Test outside tunnels are used when enabled."""
        self.test_graph["outsideTunnels"] = [["A", "B"]]
        temp = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
        json.dump(self.test_graph, temp)
        temp.close()
        
        try:
            graph = TunnelGraph(temp.name)
            path = graph.find_shortest_path("A", "D", allow_outside=True)
            self.assertIsNotNone(path)
        finally:
            Path(temp.name).unlink()


class TestBFSOptimality(unittest.TestCase):
    """Test that BFS always finds optimal shortest path."""
    
    def setUp(self):
        """Create a graph where DFS would find suboptimal path first."""
        self.test_graph = {
            "buildings": [
                {"name": "S", "neighbours": ["A", "B"], "x": 0, "y": 0},
                {"name": "A", "neighbours": ["S", "C"], "x": 1, "y": 0},
                {"name": "C", "neighbours": ["A", "D"], "x": 2, "y": 0},
                {"name": "D", "neighbours": ["C", "E"], "x": 3, "y": 0},
                {"name": "E", "neighbours": ["D", "F"], "x": 4, "y": 0},
                {"name": "F", "neighbours": ["E", "T"], "x": 5, "y": 0},
                {"name": "T", "neighbours": ["F"], "x": 6, "y": 0},
                {"name": "B", "neighbours": ["S", "T"], "x": 0, "y": 1},  # Short path!
            ],
            "closedBuildings": [],
            "closedTunnels": [],
            "outsideTunnels": []
        }
        
        self.temp_file = tempfile.NamedTemporaryFile(
            mode='w', suffix='.json', delete=False
        )
        json.dump(self.test_graph, self.temp_file)
        self.temp_file.close()
    
    def tearDown(self):
        Path(self.temp_file.name).unlink()
    
    def test_bfs_finds_shortest(self):
        """BFS should find S->B->T (length 3) not S->A->C->D->E->F->T (length 7)."""
        graph = TunnelGraph(self.temp_file.name)
        path = graph.find_shortest_path("S", "T")
        self.assertEqual(len(path), 3)
        self.assertEqual(path, ["S", "B", "T"])


class TestRealGraph(unittest.TestCase):
    """Test with the actual UW tunnel graph."""
    
    def test_graph_loads(self):
        """Test that the real graph.json loads successfully."""
        try:
            graph = TunnelGraph("graph.json")
            self.assertGreater(len(graph.buildings), 0)
        except FileNotFoundError:
            self.skipTest("graph.json not found (expected in test environment)")
    
    def test_known_buildings_exist(self):
        """Test that known UW buildings are in the graph."""
        try:
            graph = TunnelGraph("graph.json")
            self.assertIsNotNone(graph.find_building("MC"))
            self.assertIsNotNone(graph.find_building("DC"))
            self.assertIsNotNone(graph.find_building("E2"))
        except FileNotFoundError:
            self.skipTest("graph.json not found")
    
    def test_known_path_exists(self):
        """Test a known valid path."""
        try:
            graph = TunnelGraph("graph.json")
            path = graph.find_shortest_path("MC", "DC")
            self.assertIsNotNone(path)
            self.assertEqual(path[0], "MC")
            self.assertEqual(path[-1], "DC")
        except FileNotFoundError:
            self.skipTest("graph.json not found")


if __name__ == "__main__":
    unittest.main(verbosity=2)
