#!/usr/bin/env python3
"""Original policy/budget model; does not create containers or enforce OS isolation."""
import argparse
import json

SCOPES = {
    'a': {'host_pid': 410, 'local_pid': 1, 'paths': {'/app/config': 'ro', '/app/data': 'rw'}},
    'b': {'host_pid': 520, 'local_pid': 1, 'paths': {'/app/config': 'ro', '/app/data': 'rw'}}
}
ROLES = {'viewer': {'read'}, 'editor': {'read', 'write'}}


def access(scope, role, path, action):
    if scope not in SCOPES or role not in ROLES or action not in {'read', 'write'}:
        raise ValueError('unknown scope, role, or action')
    mounts = SCOPES[scope]['paths']
    if path not in mounts:
        return 'HIDDEN'
    if action not in ROLES[role]:
        return 'DENIED_ROLE'
    if action == 'write' and mounts[path] != 'rw':
        return 'DENIED_READ_ONLY'
    return 'ALLOWED'


def cpu_period(quota, demand, period=100):
    if any(type(x) is not int for x in (quota, demand, period)) or period <= 0 or not 0 <= quota <= period or demand < 0:
        raise ValueError('model requires integer period>0, 0<=quota<=period, demand>=0')
    served = min(quota, demand)
    return {'period_ms': period, 'quota_ms': quota, 'demand_ms': demand,
            'served_ms': served, 'unmet_ms': demand - served, 'remaining_budget_ms': quota - served}


def memory_request(used, request, maximum=256):
    if any(type(x) is not int for x in (used, request, maximum)) or maximum < 0 or not 0 <= used <= maximum or request < 0:
        raise ValueError('model requires integer 0<=used<=maximum and request>=0')
    accepted = used + request <= maximum
    return {'maximum_mib': maximum, 'used_before_mib': used, 'request_mib': request,
            'accepted': accepted, 'used_after_mib': used + request if accepted else used}


def self_test():
    checks = 0
    def check(condition):
        nonlocal checks
        if not condition:
            raise RuntimeError('model check failed')
        checks += 1
    check(SCOPES['a']['local_pid'] == SCOPES['b']['local_pid'])
    check(SCOPES['a']['host_pid'] != SCOPES['b']['host_pid'])
    check(access('a', 'viewer', '/app/config', 'read') == 'ALLOWED')
    check(access('a', 'viewer', '/app/data', 'write') == 'DENIED_ROLE')
    check(access('a', 'editor', '/app/data', 'write') == 'ALLOWED')
    check(access('a', 'editor', '/app/config', 'write') == 'DENIED_READ_ONLY')
    check(access('a', 'editor', '/host/secret', 'read') == 'HIDDEN')
    for quota in [0, 25, 50, 100]:
        for demand in [0, 20, 80, 150]:
            r = cpu_period(quota, demand)
            check(r['served_ms'] + r['unmet_ms'] == demand)
            check(0 <= r['served_ms'] <= quota)
            check(r['remaining_budget_ms'] + r['served_ms'] == quota)
    check(cpu_period(50, 80)['served_ms'] == 50)
    periods = [cpu_period(50, d) for d in [80, 20]]
    check([p['served_ms'] for p in periods] == [50, 20])
    check([p['remaining_budget_ms'] for p in periods] == [0, 30])
    check(memory_request(192, 80)['used_after_mib'] == 192)
    check(not memory_request(192, 80)['accepted'])
    check(memory_request(192, 64)['used_after_mib'] == 256)
    check(memory_request(256, 0)['accepted'])
    check(not memory_request(256, 1)['accepted'])
    for args in [(-1, 20), (101, 20), (50, -1)]:
        try:
            cpu_period(*args)
        except ValueError:
            checks += 1
        else:
            raise RuntimeError('invalid CPU argument accepted')
    for args in [(-1, 0), (257, 0), (192, -1)]:
        try:
            memory_request(*args)
        except ValueError:
            checks += 1
        else:
            raise RuntimeError('invalid memory argument accepted')
    print(f'PASS: {checks} checks; identity, permission, budgets, memory boundaries, invalid input.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--self-test', action='store_true')
    parser.add_argument('--scope', choices=SCOPES, default='a')
    parser.add_argument('--role', choices=ROLES, default='viewer')
    parser.add_argument('--path', default='/app/config')
    parser.add_argument('--action', choices=['read', 'write'], default='read')
    parser.add_argument('--quota', type=int, default=50)
    parser.add_argument('--demand', type=int, default=80)
    parser.add_argument('--memory-used', type=int, default=192)
    parser.add_argument('--memory-request', type=int, default=80)
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    try:
        report = {'scope': args.scope, 'identity': {k: v for k, v in SCOPES[args.scope].items() if k != 'paths'},
                  'access': {'role': args.role, 'path': args.path, 'action': args.action,
                             'decision': access(args.scope, args.role, args.path, args.action)},
                  'cpu': cpu_period(args.quota, args.demand),
                  'memory': memory_request(args.memory_used, args.memory_request),
                  'boundary': 'toy view/allowlist/period accounting; no Linux enforcement or real scheduler/OOM simulation'}
    except ValueError as error:
        parser.error(str(error))
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
