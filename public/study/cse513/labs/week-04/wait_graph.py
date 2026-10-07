#!/usr/bin/env python3
"""Single-instance exclusive wait-for graph; not a multi-instance detector."""
import argparse
import json

CASES = {'cycle': {'A': ['B'], 'B': ['A']},
         'chain': {'A': ['B'], 'B': ['C'], 'C': []},
         'dependent': {'A': ['B'], 'B': ['A'], 'C': ['A']}}

def find_cycle(graph):
    """Return one directed cycle, repeating the start node, or an empty list."""
    if not isinstance(graph, dict) or any(not isinstance(v, list) for v in graph.values()):
        raise ValueError('graph must map node labels to lists of holder labels')
    state, stack, position = {}, [], {}
    def visit(node):
        state[node] = 1
        position[node] = len(stack)
        stack.append(node)
        for other in graph.get(node, []):
            if state.get(other, 0) == 1:
                return stack[position[other]:] + [other]
            if state.get(other, 0) == 0:
                cycle = visit(other)
                if cycle:
                    return cycle
        stack.pop()
        position.pop(node)
        state[node] = 2
        return []
    for node in graph:
        if state.get(node, 0) == 0:
            result = visit(node)
            if result:
                return result
    return []


def self_test():
    assert find_cycle(CASES['cycle']) == ['A', 'B', 'A']
    assert find_cycle(CASES['dependent']) == ['A', 'B', 'A']
    assert find_cycle(CASES['chain']) == []
    assert find_cycle({}) == []
    assert find_cycle({'X': ['X']}) == ['X', 'X']
    assert find_cycle({'A': ['B']}) == []  # holder-only node
    assert find_cycle({'A': [], 'X': ['Y'], 'Y': ['X']}) == ['X', 'Y', 'X']
    assert find_cycle({'A': ['B', 'C'], 'B': ['D'], 'C': ['D'], 'D': []}) == []
    print('PASS: cycles, self-loop, DAG, disconnected component, and holder-only node')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--case', choices=CASES, default='cycle')
    parser.add_argument('--self-test', action='store_true')
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    graph = CASES[args.case]
    cycle = find_cycle(graph)
    print(json.dumps({'case': args.case, 'graph': graph, 'cycle': cycle,
                      'cycle_members': sorted(set(cycle)),
                      'limit': 'One cycle only. Nonmembers can be indirectly blocked. Single-instance exclusive-lock model.'}, indent=2))

if __name__ == '__main__':
    main()
