import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as THREE from 'three';
import {chapters} from '../src/data/bil513-lesson.js';
// Exercise the real experiment handlers with immediate reduced-motion transitions.
// WebGL setup is substituted; all scene objects use the real Three.js classes.
class Element {
 constructor(){this.textContent='';this.children=[];this.dataset={};this.hidden=false;this.position={};}
 append(e){this.children.push(e);} replaceChildren(){this.children=[];}
 setAttribute(k,v){this[k]=v;} addEventListener(){} scrollIntoView(){}
 getContext(){return {fillStyle:'',font:'',textAlign:'',fillText(){},measureText(s){return {width:s.length*35};}};}
}
const elements=new Map();const missions=chapters.map((_,i)=>{const e=new Element();e.dataset.mission=i;return e;});
const canvas=new Element();canvas.parentElement=new Element();
const root=new Element();root.dataset.chapters=JSON.stringify(chapters);
root.querySelector=s=>s==='canvas'?canvas:elements.get(s)||elements.set(s,new Element()).get(s);
root.querySelectorAll=()=>missions;
const document={querySelector:s=>s==='.os-studio'?root:new Element(),querySelectorAll:()=>[],createElement:()=>new Element()};
let code=await readFile(new URL('../src/scripts/os-world.js',import.meta.url),'utf8');
code=code.replace(/^import .*\n/gm,'');
const start=code.indexOf(' try{');const end=code.indexOf(' function mat(',start);
code=code.slice(0,start)+' renderer={};scene=new THREE.Scene();camera=new THREE.PerspectiveCamera();controls={target:new THREE.Vector3()};\n'+code.slice(end);
vm.runInNewContext(code,{THREE,document,matchMedia:()=>({matches:true}),performance,console});
const click=label=>{const b=elements.get('.actions').children.find(b=>b.textContent===label);assert.ok(b,`Missing action ${label}`);b.onclick();};
const message=()=>elements.get('#event-text').textContent;
for(let i=0;i<13;i++){missions[i].onclick();assert.equal(elements.get('#mission-title').textContent,chapters[i].title);assert.ok(elements.get('.actions').children.length>=3);}
missions[3].onclick();click('A: disk oku');assert.match(message(),/Önce A/);click('Scheduler: A’yı seç');click('A: disk oku');click('Scheduler: B’yi seç');click('A: I/O tamamlandı');assert.match(message(),/CPU hâlâ B/);assert.equal(elements.get('#cpu-metric').textContent,'B');
missions[5].onclick();click('Child: x = 20');assert.match(message(),/Önce fork/);click('fork()');click('Child: x = 20');assert.match(message(),/Parent.x = 10/);click('exec /bin/echo');assert.match(message(),/PID 101 aynı/);
missions[6].onclick();click('Parent: waitpid');assert.match(message(),/henüz bitmedi/);click('Child: exit(0)');click('Parent: waitpid');assert.match(message(),/temizlendi/);
missions[9].onclick();for(let i=0;i<4;i++)click('Race: sonraki işlem');assert.match(message(),/Sonuç 1, beklenen 2/);click('Lock ile iki increment');assert.match(message(),/Sonuç 2/);
missions[10].onclick();click('alpha\\nbeta\\n gönder');for(let i=0;i<4;i++)click('Bir parça oku');assert.match(message(),/Newline sayısı = 2/);
missions[11].onclick();click('Buffer’a yaz');click('Buffer’a yaz');click('Buffer’a yaz');assert.match(message(),/Buffer dolu/);click('Child write-end kapat');click('Buffer’dan oku');click('Buffer’dan oku');click('Buffer’dan oku');assert.match(message(),/writer hâlâ açık/);click('Parent write-end kapat');assert.equal(message(),'read → EOF');
console.log('Verified all 13 scene factories and scheduler, fork/exec, wait, race, pipe and EOF behavior.');
