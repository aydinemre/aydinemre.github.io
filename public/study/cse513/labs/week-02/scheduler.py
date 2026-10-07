#!/usr/bin/env python3
"""Offline deterministic teaching simulator; integer ticks, one logical CPU, no I/O."""
import argparse
import json
from collections import deque

DEFAULT = [('P1', 0, 8, 3), ('P2', 1, 4, 1), ('P3', 2, 9, 4), ('P4', 3, 5, 2)]

def simulate(algorithm, specs=DEFAULT, quantum=2, switch_cost=0):
    if algorithm not in {'fcfs','sjf','srtf','rr','priority'}: raise ValueError('unknown algorithm')
    if quantum <= 0 or switch_cost < 0: raise ValueError('invalid quantum/cost')
    if switch_cost and algorithm != 'rr': raise ValueError('switch cost is modeled only for RR')
    if not specs or len({x[0] for x in specs}) != len(specs): raise ValueError('empty or duplicate jobs')
    if any(x[0] in ('IDLE','SWITCH') for x in specs): raise ValueError('IDLE and SWITCH are reserved timeline labels')
    jobs = [dict(name=n, arrival=a, burst=b, priority=p, remaining=b, start=None, completion=None, index=i) for i,(n,a,b,p) in enumerate(specs)]
    if any(not isinstance(j['name'],str) or any(type(j[k]) is not int for k in ('arrival','burst','priority')) or j['arrival']<0 or j['burst']<=0 for j in jobs): raise ValueError('names must be strings; arrival/burst/priority must be integers; arrival >= 0 and burst > 0')
    future = sorted(jobs,key=lambda j:(j['arrival'],j['index']))
    ready=deque(); time=0; timeline=[]; previous=None; done=0
    def segment(label,start,end):
        if end<=start: return
        if timeline and timeline[-1]['job']==label and timeline[-1]['end']==start: timeline[-1]['end']=end
        else: timeline.append(dict(job=label,start=start,end=end))
    def arrivals():
        while future and future[0]['arrival']<=time: ready.append(future.pop(0))
    while done<len(jobs):
        arrivals()
        if not ready:
            next_time=future[0]['arrival']; segment('IDLE',time,next_time); time=next_time; previous=None; continue
        if algorithm in {'fcfs','rr'}: job=ready.popleft()
        else:
            key = 'remaining' if algorithm=='srtf' else 'burst' if algorithm=='sjf' else 'priority'
            # On an exact SRTF tie, retain the previously executing job.
            job=min(ready,key=lambda j:(j[key],0 if algorithm=='srtf' and j['name']==previous else 1,j['arrival'],j['index']))
            ready.remove(job)
        if switch_cost and previous is not None and previous!=job['name']:
            segment('SWITCH',time,time+switch_cost); time+=switch_cost; arrivals()
            # Selected RR job is reserved during dispatch. Arrivals join the tail.
        if job['start'] is None: job['start']=time
        length=min(quantum,job['remaining']) if algorithm=='rr' else 1 if algorithm=='srtf' else job['remaining']
        segment(job['name'],time,time+length); time+=length; job['remaining']-=length
        arrivals()  # Arrival at quantum endpoint precedes requeue of unfinished job.
        if not job['remaining']: job['completion']=time; done+=1
        else: ready.append(job)
        previous=job['name']
    metrics=[]
    for j in jobs:
        turnaround=j['completion']-j['arrival']
        metrics.append(dict(job=j['name'],arrival=j['arrival'],burst=j['burst'],first_start=j['start'],completion=j['completion'],turnaround=turnaround,waiting=turnaround-j['burst'],response=j['start']-j['arrival']))
    means={k:sum(j[k] for j in metrics)/len(metrics) for k in ['waiting','turnaround','response']}
    return dict(algorithm=algorithm,quantum=quantum if algorithm=='rr' else None,switch_cost=switch_cost,timeline=timeline,jobs=metrics,means=means)

def realtime(algorithm, tasks=(('P1',25,50),('P2',35,80)), until=240):
    if until<=0: raise ValueError('until must be positive')
    jobs=[]; timeline=[]; previous=None
    for t in range(until):
        for order,(name,c,period) in enumerate(tasks):
            if t%period==0:
                jobs.append(dict(name=f'{name}@{t}',task=name,release=t,execution=c,period=period,deadline=t+period,remaining=c,completion=None,order=order))
        eligible=[j for j in jobs if j['remaining']]
        if eligible:
            key='period' if algorithm=='rm' else 'deadline'
            job=min(eligible,key=lambda j:(j[key],0 if j['name']==previous else 1,j['release'],j['order']))
            label=job['name']; job['remaining']-=1
            if not job['remaining']: job['completion']=t+1
        else: label='IDLE'
        if timeline and timeline[-1]['job']==label: timeline[-1]['end']=t+1
        else: timeline.append(dict(job=label,start=t,end=t+1))
        previous=label
    for j in jobs:
        j['deadline_missed']=(j['completion']>j['deadline']) if j['completion'] is not None else j['deadline']<=until
    return dict(algorithm=algorithm,until=until,utilization=sum(c/p for _,c,p in tasks),timeline=timeline,jobs=jobs,misses=[j['name'] for j in jobs if j['deadline_missed']],note='Finite trace, not a schedulability proof; unfinished deadlines beyond horizon are not judged.')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--algorithm',choices=['fcfs','sjf','srtf','rr','priority','rm','edf'],default='fcfs')
    parser.add_argument('--quantum',type=int,default=2)
    parser.add_argument('--switch-cost',type=int,default=0)
    parser.add_argument('--jobs',help='JSON array of [name,arrival,burst,priority] for non-real-time algorithms')
    parser.add_argument('--until',type=int,default=240)
    args=parser.parse_args()
    try:
        if args.algorithm in {'rm','edf'}:
            if args.jobs or args.switch_cost: raise ValueError('RM/EDF use the fixed Example B task set and zero overhead')
            result=realtime(args.algorithm,until=args.until)
        else: result=simulate(args.algorithm,json.loads(args.jobs) if args.jobs else DEFAULT,args.quantum,args.switch_cost)
    except (ValueError,TypeError,IndexError) as error: parser.error(str(error))
    print(json.dumps(result,indent=2,ensure_ascii=False))
if __name__=='__main__': main()
