#!/usr/bin/env python3
"""Offline Banker safety model. Max is a bound, not a current request."""
import argparse
import copy
import json

BASELINE = {
    'total': [4, 3], 'available': [1, 1],
    'allocation': [[1, 0], [1, 1], [1, 1]],
    'maximum': [[3, 2], [2, 1], [2, 2]],
}

def validate(state):
    total, available = state['total'], state['available']
    alloc, maximum = state['allocation'], state['maximum']
    if not total or len(available) != len(total) or len(alloc) != len(maximum):
        raise ValueError('inconsistent dimensions')
    rows = [total, available] + alloc + maximum
    if any(len(row) != len(total) for row in rows):
        raise ValueError('inconsistent row dimensions')
    if any(type(v) is not int or v < 0 for row in rows for v in row):
        raise ValueError('resources must be nonnegative integers')
    for a, m in zip(alloc, maximum):
        if any(x > y for x, y in zip(a, m)):
            raise ValueError('allocation exceeds maximum')
        if any(x > y for x, y in zip(m, total)):
            raise ValueError('maximum exceeds total')
    for k in range(len(total)):
        if available[k] + sum(a[k] for a in alloc) != total[k]:
            raise ValueError('resource conservation violated')


def safety(state):
    validate(state)
    work = state['available'][:]
    need = [[m-a for m, a in zip(mx, al)]
            for mx, al in zip(state['maximum'], state['allocation'])]
    finished, trace = set(), []
    while len(finished) < len(need):
        progressed = False
        for i, row in enumerate(need):
            if i not in finished and all(n <= w for n, w in zip(row, work)):
                before = work[:]
                work = [w+a for w, a in zip(work, state['allocation'][i])]
                finished.add(i)
                trace.append({'process': f'P{i}', 'need': row,
                              'work_before': before, 'work_after': work[:]})
                progressed = True
                break  # restart scan so the witness matches the teaching trace
        if not progressed:
            break
    return {'safe': len(finished) == len(need), 'need': need,
            'sequence': [x['process'] for x in trace], 'trace': trace,
            'unfinished': [f'P{i}' for i in range(len(need)) if i not in finished]}


def tentative_request(state, process, request):
    """Return a trial and decision without ever mutating the caller's state."""
    validate(state)
    if type(process) is not int or not 0 <= process < len(state['allocation']):
        raise ValueError('invalid process index')
    if len(request) != len(state['total']) or any(type(x) is not int or x < 0 for x in request):
        raise ValueError('invalid request vector')
    remaining = [m-a for m, a in zip(state['maximum'][process], state['allocation'][process])]
    if any(r > n for r, n in zip(request, remaining)):
        return {'decision': 'invalid-exceeds-need', 'accepted': False}
    if any(r > a for r, a in zip(request, state['available'])):
        return {'decision': 'defer-unavailable', 'accepted': False}
    trial = copy.deepcopy(state)
    trial['available'] = [a-r for a, r in zip(trial['available'], request)]
    trial['allocation'][process] = [a+r for a, r in zip(trial['allocation'][process], request)]
    result = safety(trial)
    return {'decision': 'grant-safe' if result['safe'] else 'defer-unsafe',
            'accepted': result['safe'], 'trial': trial, 'safety': result}


def self_test():
    original = copy.deepcopy(BASELINE)
    result = safety(BASELINE)
    assert result['safe']
    # Deterministic restart scan matches the teaching witness.
    assert result['sequence'] == ['P1', 'P0', 'P2']
    assert result['trace'][-1]['work_after'] == [4, 3]
    for process, request, decision in [(1, [1, 0], 'grant-safe'),
                                        (0, [1, 1], 'defer-unsafe'),
                                        (0, [2, 2], 'defer-unavailable'),
                                        (1, [2, 0], 'invalid-exceeds-need')]:
        assert tentative_request(BASELINE, process, request)['decision'] == decision
        assert BASELINE == original
    unsafe = tentative_request(BASELINE, 0, [1, 1])
    assert unsafe['safety']['unfinished'] == ['P0', 'P1', 'P2']
    assert unsafe['trial']['available'] == [0, 0]
    for bad in [[-1, 0], [1], [True, 0]]:
        try:
            tentative_request(BASELINE, 0, bad)
        except ValueError:
            pass
        else:
            raise AssertionError('invalid request accepted')
    malformed = copy.deepcopy(BASELINE)
    malformed['available'] = [0, 1]
    try:
        safety(malformed)
    except ValueError:
        pass
    else:
        raise AssertionError('conservation error missed')
    # A process with zero remaining need finishes even with no available resource.
    terminal = {'total': [1], 'available': [0], 'allocation': [[1]], 'maximum': [[1]]}
    assert safety(terminal)['safe']
    print('PASS: safety, requests, conservation, validation, and no mutation')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--case', choices=['baseline', 'safe-request', 'unsafe-request'], default='baseline')
    parser.add_argument('--self-test', action='store_true')
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    result = safety(BASELINE) if args.case == 'baseline' else tentative_request(
        BASELINE, 1 if args.case == 'safe-request' else 0,
        [1, 0] if args.case == 'safe-request' else [1, 1])
    print(json.dumps({'case': args.case, 'baseline': BASELINE, 'result': result,
                      'limit': 'Unsafe is not proof of current deadlock.'}, indent=2))

if __name__ == '__main__':
    main()
