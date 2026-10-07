#!/usr/bin/env python3
"""Deterministic abstract SC model; not a simulation of C undefined behavior."""
import argparse
from itertools import combinations


def run(schedule):
    shared = 0
    registers = {}
    trace = []
    for who in schedule:
        if who not in registers:
            registers[who] = shared
            action = f'{who}.read = {shared}'
        else:
            shared = registers[who] + 1
            action = f'{who}.write = {shared}'
        trace.append((action, shared))
    return shared, trace


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--trace', action='store_true', help='show each read/write step')
    args = parser.parse_args()
    schedules = sorted(''.join('A' if i in places else 'B' for i in range(4))
                       for places in combinations(range(4), 2))
    expected = {'AABB': 2, 'ABAB': 1, 'ABBA': 1,
                'BAAB': 1, 'BABA': 1, 'BBAA': 2}
    for schedule in schedules:
        result, trace = run(schedule)
        if result != expected[schedule]:
            raise RuntimeError('model result differs from its known trace')
        print(f'{schedule}: counter = {result}')
        if args.trace:
            for action, shared in trace:
                print(f'  {action}; shared={shared}')
    print('Verified 6 allowed schedules. Enumeration is not a probability model.')


if __name__ == '__main__':
    main()
