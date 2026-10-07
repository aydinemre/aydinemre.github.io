import random,unittest
from functools import lru_cache
from replacement import simulate
REF=[7,0,1,2,0,3,0,4,2,3,0,3,2]
class ReplacementChecks(unittest.TestCase):
    def test_known_counts(self):
        for p,c in [('fifo',10),('lru',9),('opt',7)]:
            r=simulate(REF,3,p);self.assertEqual(r['faults'],c);self.assertEqual(r['hits'],len(REF)-c)
    def test_belady(self):
        refs=[1,2,3,4,1,2,5,1,2,3,4,5]
        self.assertEqual([simulate(refs,n,'fifo')['faults'] for n in (3,4)],[9,10])
    def test_fifo_hit_does_not_refresh_and_lru_does(self):
        refs=[1,2,1,3]
        self.assertEqual(simulate(refs,2,'fifo')['trace'][-1]['victim'],1)
        self.assertEqual(simulate(refs,2,'lru')['trace'][-1]['victim'],2)
    def test_dirty_preservation_and_no_final_flush(self):
        refs=[{'page':1,'write':True},2,1,3]
        r=simulate(refs,2,'fifo');self.assertEqual(r['writebacks'],1);self.assertTrue(r['trace'][-1]['writeback'])
        self.assertEqual(simulate([{'page':1,'write':True}],2)['writebacks'],0)
    def test_working_set_window(self):
        r=simulate(REF);self.assertEqual(r['trace'][7]['working_set'],[0,3,4]);self.assertEqual(r['trace'][8]['working_set'],[0,2,3,4])
    def test_residency_invariants_and_stack_property(self):
        rng=random.Random(513)
        for _ in range(50):
            refs=[rng.randrange(6) for _ in range(20)]
            for p in ('fifo','lru','opt'):
                r=simulate(refs,3,p)
                for event in r['trace']:
                    present=[x for x in event['slots'] if x is not None]
                    self.assertEqual(len(present),len(set(present)));self.assertIn(event['page'],present)
                    if event['victim'] is not None:self.assertNotIn(event['victim'],present)
            counts=[simulate(refs,n,'lru')['faults'] for n in range(1,7)]
            self.assertEqual(counts,sorted(counts,reverse=True))
    def test_opt_matches_independent_exhaustive_minimum(self):
        refs=(0,1,2,0,3,1,2)
        @lru_cache(None)
        def best(i,resident):
            if i==len(refs):return 0
            page=refs[i];current=set(resident)
            if page in current:return best(i+1,tuple(sorted(current)))
            if len(current)<2:return 1+best(i+1,tuple(sorted(current|{page})))
            return min(1+best(i+1,tuple(sorted((current-{v})|{page}))) for v in current)
        self.assertEqual(simulate(list(refs),2,'opt')['faults'],best(0,()))
    def test_invalid_capacity(self):
        with self.assertRaises(ValueError):simulate(REF,0)
        with self.assertRaises(ValueError):simulate([{'page':1,'write':'yes'}])
if __name__=='__main__':unittest.main()
