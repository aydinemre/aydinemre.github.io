#!/usr/bin/env python3
"""Bounded offline RPC retry model. No network or external side effects."""
import argparse
import json

class Server:
    def __init__(self, dedupe=False):
        self.dedupe = dedupe
        self.counter = 0
        self.results = {}

    def handle(self, operation_id, amount):
        if not isinstance(operation_id, str) or not operation_id:
            raise ValueError('nonempty operation ID required')
        if type(amount) is not int or amount <= 0:
            raise ValueError('positive integer amount required')
        if self.dedupe and operation_id in self.results:
            old_amount, result = self.results[operation_id]
            if old_amount != amount:
                raise ValueError('same operation ID with a different payload')
            return {'result': result, 'applied': False, 'reason': 'retained-result'}
        self.counter += amount
        result = self.counter
        if self.dedupe:
            # A single sequential transition; no crash interleaving modeled here.
            self.results[operation_id] = (amount, result)
        return {'result': result, 'applied': True, 'reason': 'new-application'}


def simulate(mode):
    if mode not in ('naive', 'dedupe', 'reset'):
        raise ValueError('unknown mode')
    server = Server(dedupe=mode != 'naive')
    events = [{'time': 0, 'event': 'client-send', 'operation_id': 'op-7', 'amount': 1}]
    first = server.handle('op-7', 1)
    events.append({'time': 4, 'event': 'server-handle-first-reply-lost', **first,
                   'counter': server.counter})
    events.append({'time': 8, 'event': 'client-timeout', 'known': 'no reply observed',
                   'unknown': 'whether operation was applied'})
    if mode == 'reset':
        server.results.clear()
        events.append({'time': 9, 'event': 'dedupe-record-lost-state-retained',
                       'counter': server.counter})
    events.append({'time': 10, 'event': 'client-retry', 'operation_id': 'op-7', 'amount': 1})
    retry = server.handle('op-7', 1)
    events.append({'time': 11, 'event': 'server-handle-retry', **retry,
                   'counter': server.counter})
    events.append({'time': 16, 'event': 'client-observes-reply', 'result': retry['result']})
    return {'mode': mode, 'events': events, 'final_counter': server.counter,
            'applied_count': sum(bool(x.get('applied')) for x in events),
            'limit': 'Sequential finite model. No exactly-once network guarantee. Retained dedupe record is an assumption.'}


def self_test():
    assert simulate('naive')['final_counter'] == 2
    assert simulate('dedupe')['final_counter'] == 1
    assert simulate('reset')['final_counter'] == 2
    assert simulate('dedupe')['applied_count'] == 1
    server = Server(True)
    assert server.handle('key', 3)['result'] == 3
    assert server.handle('key', 3) == {'result': 3, 'applied': False, 'reason': 'retained-result'}
    try:
        server.handle('key', 4)
    except ValueError:
        pass
    else:
        raise AssertionError('mismatched duplicate was accepted')
    assert server.counter == 3
    assert server.handle('second-key', 1)['result'] == 4
    for op, amount in [('', 1), ('bad', -1), ('bad', True)]:
        try:
            server.handle(op, amount)
        except ValueError:
            pass
        else:
            raise AssertionError('invalid payload accepted')
    assert server.counter == 4
    print('PASS: naive/dedupe/reset, duplicate results, payload conflict, and validation')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mode', choices=['naive', 'dedupe', 'reset'], default='dedupe')
    parser.add_argument('--self-test', action='store_true')
    args = parser.parse_args()
    if args.self_test:
        self_test()
    else:
        print(json.dumps(simulate(args.mode), indent=2))

if __name__ == '__main__':
    main()
