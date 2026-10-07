#!/usr/bin/env python3
"""Offline page replacement; cold start, sequential references, no prefetch."""
import argparse,json
from pathlib import Path

def simulate(refs,frames=3,policy='fifo',window=4):
    if type(frames) is not int or frames<=0 or policy not in ('fifo','lru','opt') or window<1:raise ValueError('invalid model')
    normalized=[dict(page=r,write=False) if type(r) is int else dict(r) for r in refs]
    if any(type(r.get('page')) is not int or type(r.get('write',False)) is not bool for r in normalized):raise ValueError('reference must be integer page or {page:int,write:bool}')
    slots=[None]*frames;loaded={};last={};dirty={};trace=[];faults=0;writebacks=0
    for t,ref in enumerate(normalized):
        page=ref['page'];hit=page in slots;victim=None;writeback=False
        if not hit:
            faults+=1
            if None in slots:slot=slots.index(None)
            elif policy=='fifo':slot=min(range(frames),key=lambda i:(loaded[slots[i]],i))
            elif policy=='lru':slot=min(range(frames),key=lambda i:(last[slots[i]],i))
            else:
                def next_use(p):
                    return next((i for i in range(t+1,len(normalized)) if normalized[i]['page']==p),float('inf'))
                slot=max(range(frames),key=lambda i:(next_use(slots[i]),-i))
            victim=slots[slot]
            if victim is not None:
                writeback=dirty[victim];writebacks+=int(writeback)
                del loaded[victim];del last[victim];del dirty[victim]
            slots[slot]=page;loaded[page]=t;dirty[page]=False
        last[page]=t;dirty[page]=dirty[page] or ref.get('write',False)
        working=sorted({r['page'] for r in normalized[max(0,t-window+1):t+1]})
        trace.append(dict(step=t+1,page=page,write=ref.get('write',False),hit=hit,slots=list(slots),victim=victim,writeback=writeback,working_set=working))
    return dict(policy=policy,frames=frames,faults=faults,hits=len(refs)-faults,writebacks=writebacks,trace=trace,note='No final dirty flush is counted; writebacks count only dirty evictions. No I/O durations modeled.')

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--policy',choices=['fifo','lru','opt'],default='fifo');p.add_argument('--frames',type=int,default=3);p.add_argument('--references',help='JSON integer list or page/write objects');p.add_argument('--belady',action='store_true');p.add_argument('--dirty',action='store_true');args=p.parse_args()
    d=json.loads((Path(__file__).resolve().parent.parent/'build/experiment-data.json').read_text())
    try:
        refs=json.loads(args.references) if args.references else d['dirty_example']['references'] if args.dirty else d['belady']['references'] if args.belady else d['references']
        print(json.dumps(simulate(refs,args.frames,args.policy),indent=2))
    except (ValueError,TypeError) as e:p.error(str(e))
if __name__=='__main__':main()
