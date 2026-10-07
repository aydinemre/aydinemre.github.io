#!/usr/bin/env python3
"""Offline Lamport clock trace. Clock order does not prove causality."""
import argparse
import json

class Clock:
    def __init__(self):
        self.value = 0

    def event(self):
        self.value += 1
        return self.value

    def receive(self, received):
        if type(received) is not int or received < 0:
            raise ValueError('nonnegative integer timestamp required')
        self.value = max(self.value, received) + 1
        return self.value


def trace():
    a, b = Clock(), Clock()
    events = [{'id': 'a_local', 'process': 'A', 'kind': 'local', 'clock': a.event()}]
    stamp = a.event()
    events.append({'id': 'a_send', 'process': 'A', 'kind': 'send m', 'clock': stamp})
    events.append({'id': 'b_local', 'process': 'B', 'kind': 'independent local', 'clock': b.event()})
    events.append({'id': 'b_receive', 'process': 'B', 'kind': 'receive m', 'clock': b.receive(stamp)})
    events.append({'id': 'b_after', 'process': 'B', 'kind': 'local', 'clock': b.event()})
    edges = [['a_local', 'a_send'], ['a_send', 'b_receive'],
             ['b_local', 'b_receive'], ['b_receive', 'b_after']]
    return {'events': events, 'happens_before_edges': edges,
            'concurrent_pair': ['b_local', 'a_send'],
            'limit': 'a→b implies L(a)<L(b); the converse does not hold. Row order is simulator order, not a global causal order.'}


def reaches(edges, start, target):
    todo, visited = [start], set()
    while todo:
        node = todo.pop()
        if node == target:
            return True
        if node in visited:
            continue
        visited.add(node)
        todo.extend(v for u, v in edges if u == node)
    return False


def self_test():
    data = trace()
    clocks = {e['id']: e['clock'] for e in data['events']}
    assert list(clocks.values()) == [1, 2, 1, 3, 4]
    for a, b in data['happens_before_edges']:
        assert clocks[a] < clocks[b]
    assert reaches(data['happens_before_edges'], 'a_local', 'b_after')
    assert clocks['b_local'] < clocks['a_send']
    assert not reaches(data['happens_before_edges'], 'b_local', 'a_send')
    assert not reaches(data['happens_before_edges'], 'a_send', 'b_local')
    clock = Clock()
    for _ in range(8):
        clock.event()
    assert clock.receive(2) == 9
    for bad in [-1, True, '2']:
        try:
            clock.receive(bad)
        except ValueError:
            pass
        else:
            raise AssertionError('invalid timestamp accepted')
    print('PASS: clock updates, causal edges, transitivity, converse counterexample, validation')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--self-test', action='store_true')
    args = parser.parse_args()
    if args.self_test:
        self_test()
    else:
        print(json.dumps(trace(), indent=2))

if __name__ == '__main__':
    main()
