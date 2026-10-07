#!/usr/bin/env python3
"""In-memory durable-step model. No filesystem/device I/O is performed."""
import argparse
from copy import deepcopy
from itertools import combinations
import json

INITIAL = {'allocated': [4], 'inode': [4], 'data': {'4': 'OLD', '5': 'STALE'}}
TARGET = {'allocated': [4, 5], 'inode': [4, 5], 'data': {'4': 'OLD', '5': 'NEW'}}
NAIVE = ['D', 'B', 'I']
JOURNAL = ['payload', 'commit', 'D', 'B', 'I', 'clear']


def apply(home, operation):
    if operation == 'D':
        home['data']['5'] = 'NEW'
    elif operation == 'B':
        home['allocated'] = [4, 5]
    elif operation == 'I':
        home['inode'] = [4, 5]
    else:
        raise ValueError('unknown home operation')


def classify(home):
    refs, allocated = set(home['inode']), set(home['allocated'])
    if refs - allocated:
        return 'REFERENCE_TO_FREE_BLOCK'
    if allocated - refs:
        return 'ALLOCATION_LEAK'
    if 5 in refs and home['data']['5'] != 'NEW':
        return 'CONSISTENT_METADATA_STALE_DATA'
    return 'NEW' if 5 in refs else 'OLD'


def execute(mode, count):
    steps = NAIVE if mode == 'naive' else JOURNAL
    if not 0 <= count <= len(steps):
        raise ValueError(f'crash-after must be 0..{len(steps)} for {mode}')
    state = {'home': deepcopy(INITIAL), 'log': {'payload': None, 'committed': False}}
    trace = []
    for operation in steps[:count]:
        if operation == 'payload':
            state['log']['payload'] = deepcopy(TARGET)
        elif operation == 'commit':
            state['log']['committed'] = True
        elif operation == 'clear':
            state['log'] = {'payload': None, 'committed': False}
        else:
            apply(state['home'], operation)
        trace.append({'durable_step': operation, 'state': deepcopy(state)})
    return state, trace


def recover(state, interrupt_after=None):
    """Redo target-value writes. Log remains committed until every home write persists."""
    out = deepcopy(state)
    log = out['log']
    if not log['committed']:
        # No home write can precede commit in this journal protocol.
        out['log'] = {'payload': None, 'committed': False}
        return out
    if log['payload'] != TARGET:
        raise ValueError('invalid committed payload; refusing ambiguous recovery')
    limit = 4 if interrupt_after is None else interrupt_after
    if not 0 <= limit <= 4:
        raise ValueError('recovery interruption must be 0..4')
    for operation in ['D', 'B', 'I', 'clear'][:limit]:
        if operation == 'clear':
            out['log'] = {'payload': None, 'committed': False}
        else:
            apply(out['home'], operation)
    return out


def self_test():
    checks = 0
    def check(condition):
        nonlocal checks
        if not condition:
            raise RuntimeError('model check failed')
        checks += 1
    expected = {
        '': 'OLD', 'D': 'OLD', 'B': 'ALLOCATION_LEAK',
        'I': 'REFERENCE_TO_FREE_BLOCK', 'DB': 'ALLOCATION_LEAK',
        'DI': 'REFERENCE_TO_FREE_BLOCK', 'BI': 'CONSISTENT_METADATA_STALE_DATA', 'DBI': 'NEW'
    }
    for length in range(4):
        for subset in combinations(NAIVE, length):
            home = deepcopy(INITIAL)
            for op in subset:
                apply(home, op)
            check(classify(home) == expected[''.join(subset)])
    for prefix in range(7):
        state, _ = execute('journal', prefix)
        result = recover(state)
        check(classify(result['home']) == ('OLD' if prefix < 2 else 'NEW'))
        check(recover(result) == result)
        if 2 <= prefix < 6:
            for interrupted in range(5):
                partial = recover(state, interrupted)
                check(recover(partial) == result)
    bad, _ = execute('journal', 0)
    bad['log']['committed'] = True
    try:
        recover(bad)
    except ValueError:
        checks += 1
    else:
        raise RuntimeError('early commit was not rejected')
    # Never acknowledge before durable commit in this modeled protocol.
    for prefix in range(2):
        state, _ = execute('journal', prefix)
        check(not state['log']['committed'])
    print(f'PASS: {checks} checks; 8 naive subsets, 7 journal prefixes, interrupted recovery, invalid commit.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mode', choices=['naive', 'journal'], default='journal')
    parser.add_argument('--crash-after', type=int, default=2)
    parser.add_argument('--self-test', action='store_true')
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    try:
        state, trace = execute(args.mode, args.crash_after)
        recovered = recover(state) if args.mode == 'journal' else state
    except ValueError as error:
        parser.error(str(error))
    print(json.dumps({'mode': args.mode, 'crash_after': args.crash_after,
                      'durable_trace': trace, 'crash_state': state,
                      'before': classify(state['home']), 'after_recovery': recovered,
                      'after': classify(recovered['home']),
                      'boundary': 'atomic durable steps; no torn writes, devices, concurrency, or host I/O'}, indent=2))


if __name__ == '__main__':
    main()
