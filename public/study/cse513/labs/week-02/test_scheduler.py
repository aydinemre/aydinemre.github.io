import random
import unittest
from scheduler import simulate, realtime

class SchedulerChecks(unittest.TestCase):
    def test_hand_calculated_results(self):
        expected={'fcfs':([8,12,21,26],(8.75,15.25,8.75)), 'sjf':([8,12,26,17],(7.75,14.25,7.75)), 'srtf':([17,5,26,10],(6.5,13,4.25)), 'rr':([22,12,26,23],(12.75,19.25,2)), 'priority':([8,12,26,17],(7.75,14.25,7.75))}
        for algorithm,(completion,means) in expected.items():
            r=simulate(algorithm)
            self.assertEqual([j['completion'] for j in r['jobs']],completion)
            self.assertEqual(tuple(r['means'][k] for k in ('waiting','turnaround','response')),means)
    def test_rr_endpoint_and_no_same_job_cost(self):
        r=simulate('rr',[('A',0,4,0),('B',2,1,0)],quantum=2)
        self.assertEqual([(x['job'],x['start'],x['end']) for x in r['timeline']],[('A',0,2),('B',2,3),('A',3,5)])
        r=simulate('rr',[('A',3,5,0)],quantum=1,switch_cost=2)
        self.assertEqual(r['timeline'],[dict(job='IDLE',start=0,end=3),dict(job='A',start=3,end=8)])
    def test_srtf_current_wins_exact_tie(self):
        r=simulate('srtf',[('A',0,4,0),('B',1,3,0)])
        self.assertEqual(r['jobs'][0]['completion'],4)
    def test_dispatch_reserves_job_and_accounts_overhead(self):
        r=simulate('rr',[('A',0,3,0),('B',0,1,0),('C',2,1,0)],quantum=1,switch_cost=1)
        self.assertEqual(r['timeline'][:4],[dict(job='A',start=0,end=1),dict(job='SWITCH',start=1,end=2),dict(job='B',start=2,end=3),dict(job='SWITCH',start=3,end=4)])
    def test_conservation_and_release_constraints(self):
        rng=random.Random(513)
        for _ in range(40):
            jobs=[(f'J{i}',rng.randrange(10),rng.randrange(1,10),rng.randrange(5)) for i in range(5)]
            for algo in ('fcfs','sjf','srtf','rr','priority'):
                r=simulate(algo,jobs,quantum=3,switch_cost=1 if algo=='rr' else 0)
                original={n:(a,b) for n,a,b,p in jobs}
                for left,right in zip(r['timeline'],r['timeline'][1:]): self.assertEqual(left['end'],right['start'])
                for n,(arrival,burst) in original.items():
                    parts=[x for x in r['timeline'] if x['job']==n]
                    self.assertEqual(sum(x['end']-x['start'] for x in parts),burst)
                    self.assertTrue(all(x['start']>=arrival for x in parts))
                self.assertTrue(all(j['waiting']>=0 and j['response']>=0 for j in r['jobs']))
    def test_deadlines_and_finite_horizon(self):
        rm=realtime('rm'); edf=realtime('edf')
        self.assertEqual(rm['misses'],['P2@0']); self.assertEqual(edf['misses'],[])
        self.assertEqual(rm['jobs'][1]['completion'],85)
        harmonic=realtime('rm',tasks=(('A',1,2),('B',2,4)),until=20)
        self.assertEqual(harmonic['misses'],[])
        self.assertEqual(realtime('rm',until=79)['misses'],[])
        self.assertEqual(realtime('rm',until=80)['misses'],['P2@0'])
    def test_invalid_input(self):
        with self.assertRaises(ValueError): simulate('rr',quantum=0)
        with self.assertRaises(ValueError): simulate('sjf',switch_cost=1)
        with self.assertRaises(ValueError): simulate('rr',[('A',0,0,0)])
        with self.assertRaises(ValueError): simulate('rr',[('A',0,1.5,0)])
if __name__=='__main__': unittest.main()
