import copy,json,unittest
from pathlib import Path
from translation import Translator,eat,table_bytes
DATA=json.loads((Path(__file__).resolve().parent.parent/'build/experiment-data.json').read_text())
class TranslationChecks(unittest.TestCase):
    def test_worked_addresses_and_boundaries(self):
        tr=Translator(copy.deepcopy(DATA))
        for va,vpn,offset,pa in [(308,1,52,1844),(256,1,0,1792),(511,1,255,2047),(784,3,16,1296)]:
            r=tr.access('P',va);self.assertEqual((r['vpn'],r['offset'],r['pa']),(vpn,offset,pa))
    def test_miss_not_fault_and_process_identity(self):
        tr=Translator(copy.deepcopy(DATA))
        self.assertEqual(tr.access('P',308)['status'],'ok')
        self.assertEqual(tr.access('P',511)['tlb'],'hit')
        self.assertEqual(tr.access('Q',308)['pa'],2356)
        self.assertEqual(tr.access('P',308)['pa'],1844)
    def test_protection_cached_and_missing(self):
        tr=Translator(copy.deepcopy(DATA));tr.access('P',308)
        r=tr.access('P',256,'write');self.assertEqual((r['tlb'],r['status']),('hit','protection'));self.assertNotIn('pa',r)
        self.assertEqual(tr.access('P',512)['status'],'not_present')
        self.assertEqual(tr.access('P',1024)['status'],'unmapped')
    def test_tlb_lru_and_invalidation(self):
        tr=Translator(copy.deepcopy(DATA),2);tr.access('P',308);tr.access('P',0);tr.access('P',308);tr.access('P',784)
        self.assertNotIn(('P',0),tr.tlb)
        tr.data['page_tables']['P']['1']['frame']=10
        self.assertEqual(tr.access('P',308)['pa'],1844)
        tr.invalidate('P');self.assertEqual(tr.access('P',308)['pa'],2612)
    def test_timing_and_table_model(self):
        self.assertEqual(eat(10,100,.9),120)
        self.assertAlmostEqual(eat(10,100,.9,2),130)
        self.assertEqual(eat(10,100,1),110);self.assertEqual(eat(10,100,0),210)
        self.assertEqual(table_bytes(32,12,4,2,[10,10]),{'flat':4194304,'multilevel':12288})
    def test_invalid_addresses(self):
        tr=Translator(DATA)
        for va in (-1,65536,1.5):
            with self.assertRaises(ValueError):tr.access('P',va)
        with self.assertRaises(ValueError):eat(10,100,1.1)
if __name__=='__main__':unittest.main()
