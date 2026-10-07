#!/usr/bin/env python3
"""Offline translation model; no actual memory access or kernel changes."""
import argparse,json
from collections import OrderedDict
from pathlib import Path

class Translator:
    def __init__(self, data, capacity=2):
        if capacity<1: raise ValueError('capacity must be positive')
        self.data=data; self.capacity=capacity; self.tlb=OrderedDict()
    def invalidate(self, process):
        self.tlb=OrderedDict((k,v) for k,v in self.tlb.items() if k[0]!=process)
    def access(self,process,va,mode='read'):
        if type(va) is not int or not 0<=va<2**self.data['va_bits']: raise ValueError('address outside modeled VA space')
        if mode not in ('read','write'): raise ValueError('mode must be read or write')
        vpn,offset=divmod(va,self.data['page_size']); key=(process,vpn)
        hit=key in self.tlb
        pte=self.tlb.get(key) if hit else self.data['page_tables'].get(process,{}).get(str(vpn))
        result=dict(process=process,va=va,vpn=vpn,offset=offset,tlb='hit' if hit else 'miss',mode=mode)
        if pte is None: result['status']='unmapped'; return result
        if not pte[mode]: result['status']='protection'; return result
        if not pte['present']: result['status']='not_present'; return result
        if hit: self.tlb.move_to_end(key)
        else:
            self.tlb[key]=dict(pte)
            if len(self.tlb)>self.capacity:self.tlb.popitem(last=False)
        result.update(status='ok',frame=pte['frame'],pa=pte['frame']*self.data['page_size']+offset)
        return result

def eat(tlb_ns,memory_ns,hit_ratio,levels=1):
    if not 0<=hit_ratio<=1 or min(tlb_ns,memory_ns)<0 or type(levels) is not int or levels<1:raise ValueError('invalid timing model')
    return hit_ratio*(tlb_ns+memory_ns)+(1-hit_ratio)*(tlb_ns+(levels+1)*memory_ns)

def table_bytes(va_bits,offset_bits,pte_bytes,leaf_tables,level_bits):
    if sum(level_bits)!=va_bits-offset_bits:raise ValueError('bad address split')
    return dict(flat=(2**(va_bits-offset_bits))*pte_bytes,multilevel=(2**level_bits[0])*pte_bytes+leaf_tables*(2**level_bits[1])*pte_bytes)

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--va',type=lambda s:int(s,0));p.add_argument('--process',default='P');p.add_argument('--mode',choices=['read','write'],default='read');args=p.parse_args()
    data=json.loads((Path(__file__).resolve().parent.parent/'build/experiment-data.json').read_text())
    tr=Translator(data)
    try:
        accesses=[dict(process=args.process,va=args.va,mode=args.mode)] if args.va is not None else data['accesses']
        output=[tr.access(**a) for a in accesses]
        print(json.dumps(dict(accesses=output,eat_ns=eat(10,100,.9),tables=table_bytes(32,12,4,2,[10,10])),indent=2))
    except ValueError as e:p.error(str(e))
if __name__=='__main__':main()
