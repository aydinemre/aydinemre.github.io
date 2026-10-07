const CONFIG=JSON.parse(document.querySelector('#study-config').textContent);
try {
const [dataResponse,extraResponse,animationResponse]=await Promise.all([fetch(CONFIG.data),fetch(CONFIG.extra),fetch('/study/cse513/animations/manifest.json?v=20261008-matrix')]);
if(!dataResponse.ok||!extraResponse.ok||!animationResponse.ok)throw Error('Study data could not be loaded');
const DATA=await dataResponse.json();DATA.week=CONFIG.week;DATA.materialWeek=CONFIG.materialWeek;
const ANIMATIONS=await animationResponse.json();
const EXTRA=await extraResponse.json(),HERO=CONFIG.hero,SCHED=DATA.week===2?EXTRA.jobs:[];
const $=q=>document.querySelector(q), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let lang='tr',current=1;try{lang=localStorage.getItem('cse513-language')||'tr'}catch{}if(!['tr','en'].includes(lang))lang='tr';
const L=(tr,en)=>lang==='tr'?tr:en;
const state={sched:'FCFS',q:2,schedStep:0,race:0,queue:[],produced:0,consumed:0,queueMsg:'',bank:'initial',bankStep:0,cycle:0};
const saved={},openDetails=new Set();
function table(rows){return '<div class="tablewrap" tabindex="0"><table><thead><tr>'+rows[0].map(c=>'<th scope="col">'+esc(c)+'</th>').join('')+'</tr></thead><tbody>'+rows.slice(1).map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'}
function render(){
 document.documentElement.lang=lang;$('#language').value=lang;$('#study-title').textContent=DATA[lang].title;$('#course-back').textContent=L('Haftalar','Weeks');document.title=`CSE513 / ${L('Hafta','Week')} ${DATA.week} / ${DATA[lang].title}`;
 $('#brand').textContent=`CSE513 / ${L('HAFTA','WEEK')} ${DATA.week}`;$('#subtitle').textContent=DATA[lang].subtitle;
 $('#skip').textContent=L('İçeriğe geç','Skip to content');$('#contents-label').textContent=L('ÖĞRENME ROTASI','LEARNING ROUTE');$('#jump-label').textContent=L('Bölüm','Section');
 $('#nav').innerHTML=DATA.slides.map((s,i)=>`<a href="#s${i+1}" data-slide="${i+1}"><span>${String(i+1).padStart(2,'0')}</span>${esc(s[lang].title)}</a>`).join('');
 $('#jump').innerHTML=DATA.slides.map((s,i)=>`<option value="${i+1}">${String(i+1).padStart(2,'0')} · ${esc(s[lang].title)}</option>`).join('');
 $('#intro').innerHTML=`<p class="eyebrow">${L('KENDİ HIZINDA ÇALIŞ','LEARN AT YOUR OWN PACE')}</p><p>${L('Önce tahminini yaz. GIF’te adımların nasıl ilerlediğini izle, sonra cevabın gerekçesini karşılaştır. Dil değiştirince notların ve deney durumun korunur.','Write your prediction first. Watch the steps unfold in the GIF, then compare your reasoning with the answer. Notes and experiment state survive language changes.')}</p><p class="small">${L('Sunum Türkçe. Bu çalışma sayfasının tamamı Türkçe ve İngilizce kullanılabilir.','The slide deck is in Turkish. This entire study page is available in Turkish and English.')}</p>${DATA.sourceStatus==='scope-adaptation-pdf-forthcoming'?'<p class="boundary">'+L('Bu haftanın PDF’si kaynak sayfada henüz yayımlanmamıştı. Bu çalışma, yayımlanan haftalık kapsamın birincil kaynaklarla geliştirilmiş özgün anlatımıdır.','This week’s PDF was not yet published on the source page. This study independently develops the published scope using primary references.')+'</p>':''}`;
 $('#sections').innerHTML=DATA.slides.map((s,i)=>{
  const d=s[lang],n=i+1;
  let out=`<section id="s${n}" class="slide"><p class="eyebrow">${String(n).padStart(2,'0')} / ${DATA.slides.length}</p><h2>${esc(d.title)}</h2>`;
  if(s.kind==='cover'&&HERO)out+=`<figure class="hero"><img src="${HERO}" alt="${L('Mutfak analojisini gösteren kavramsal illüstrasyon','Conceptual illustration of the kitchen analogy')}"><figcaption class="small">${L('AI üretimi kavramsal illüstrasyon. Analojinin sınırlarını ilgili bölümde ele alıyoruz.','AI generated conceptual illustration. The relevant section explains the limits of the analogy.')}</figcaption></figure>`;
  if(s.kind==='image'&&s.image)out+=`<figure class=diagram><img src="/study/cse513/assets/week-01-${esc(s.image)}.webp" alt="${esc(d.title)}" loading=lazy></figure>`;
  if(d.body?.length)out+='<ul class="keypoints">'+d.body.map(b=>'<li>'+esc(b)+'</li>').join('')+'</ul>';
  if(d.table?.length)out+=table(d.table);
  if(d.columns?.length)out+='<div class="cols">'+d.columns.map(c=>'<div class="col"><h3>'+esc(c[0])+'</h3><p>'+esc(c[1]).replace(/\n/g,'<br>')+'</p></div>').join('')+'</div>';
  if(d.code)out+='<pre><code>'+esc(d.code)+'</code></pre>';
  if(d.aside)out+='<p class="boundary">'+esc(d.aside)+'</p>';
  if(d.realworld?.title){const r=d.realworld;out+='<div class="realworld"><p class="eyebrow">'+L('GERÇEK HAYAT','REAL WORLD')+'</p><h3>'+esc(r.title)+'</h3><p><strong>'+L('Ne görürsün? ','What do you observe? ')+'</strong>'+esc(r.observe)+'</p><p><strong>'+L('Teknik mekanizma: ','Mechanism: ')+'</strong>'+esc(r.mechanism)+'</p><p><strong>'+L('Nerede işe yarar? ','When is it useful? ')+'</strong>'+esc(r.use)+'</p></div>'}
  if(d.prompt||d.answer){out+='<div class="practice"><h3>'+L('Önce sen açıkla','Explain it first')+'</h3><p>'+esc(d.prompt||L('Sonucu ve teknik gerekçeyi kendi sözcüklerinle açıkla.','Explain the result and its mechanism in your own words.'))+'</p><label for="note-'+n+'">'+L('Tahminin ve gerekçen','Your prediction and reasoning')+'</label><textarea id="note-'+n+'" data-note="'+n+'" rows="3"></textarea>';if(d.answer)out+='<details data-detail="answer-'+n+'"'+(openDetails.has('answer-'+n)?' open':'')+'><summary>'+L('Gerekçeli cevabı aç','Show the reasoned answer')+'</summary><p>'+esc(d.answer)+'</p></details>';out+='</div>'}
  if(d.note)out+='<details data-detail="notes-'+n+'"'+(openDetails.has('notes-'+n)?' open':'')+'><summary>'+L('Ayrıntılı anlatımı oku','Read the explanation')+'</summary><p>'+esc(d.note).replace(/\n/g,'<br>')+'</p></details>';
  if(s.source?.length)out+='<p class="source">'+L('Özgün PDF sayfaları: ','Original PDF pages: ')+s.source.join(', ')+'.</p>';
  if(s.urls?.length)out+='<details data-detail="sources-'+n+'"><summary>'+L('Bölüm kaynakları','Section sources')+'</summary>'+s.urls.map((u,j)=>'<p><a href="'+esc(u)+'" target="_blank" rel="noopener">'+L('Kaynak ','Source ')+(j+1)+'</a> <span class="small">'+esc(u)+'</span></p>').join('')+'</details>';
  if([1,2,3,4,5,6,8,9,10].includes(DATA.week)&&n===experimentPosition(0))out+='<div id="experiment-primary" class="experiment"></div>';
  if([1,2,3,4,5,6,8,9,10].includes(DATA.week)&&n===experimentPosition(1))out+='<div id="experiment-secondary" class="experiment"></div>';
  return out+'</section>';
 }).join('');
 $('#footer').innerHTML=`<h2>${L('Dosyalar ve çalışma sırası','Files and study sequence')}</h2><p>${L('Soruların sonucunu ve teknik gerekçesini kendi sözcüklerinle açıkla. Anlamadığın ayrım için ilgili deneye ve anlatıma dön.','Explain the result and mechanism in your own words. Revisit the relevant experiment and explanation for any unclear distinction.')}</p><p><a href="/study/cse513/downloads/week-${String(DATA.materialWeek).padStart(2,'0')}.pptx">${L('PowerPoint sunumu','PowerPoint deck')}</a> ${[1,2,3,4,5,6,8,9,10].includes(DATA.week)?`· <a href="/study/cse513/labs/week-${String(DATA.materialWeek).padStart(2,'0')}/README.md">${L('Laboratuvar rehberi','Lab guide')}</a>`:''} · <a href="/yuksek-lisans/bil513/">${L('Bütün haftalar','All weeks')}</a></p><p class="small">${L('Notların yalnız bu tarayıcıda saklanır. Başka cihaza otomatik taşınmaz. Depolamayı engelleyen bir tarayıcıda notlarını ayrıca kopyala. Deneyler öğretim modelleridir, gerçek sistem performans ölçümü değildir.','Notes stay in this browser and do not transfer automatically to another device. Copy notes separately if storage is blocked. Experiments are teaching models, not measurements of a real system.')}</p>${HERO?`<p><a href="/study/cse513/assets/week-${String(DATA.materialWeek).padStart(2,'0')}-provenance.json">${L('Görsel kökeni ve üretim istemi','Image provenance and generation prompt')}</a></p>`:''}<p><a href="https://mehmetgokturk.com/cse513/index.html">${L('Resmî ders sayfası','Official course page')}</a></p>`;
 document.querySelectorAll('[data-note]').forEach(t=>{const id=t.dataset.note;let v=saved[id];if(v===undefined)try{v=localStorage.getItem(`cse513-w${DATA.week}-note${id}`)||''}catch{v=''}t.value=v;t.addEventListener('input',()=>{saved[id]=t.value;try{localStorage.setItem(`cse513-w${DATA.week}-note${id}`,t.value)}catch{}})});
 document.querySelectorAll('[data-detail]').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)openDetails.add(d.dataset.detail);else openDetails.delete(d.dataset.detail)}));
 renderExperiments();mountAnimations();active(current);
}
function experimentPosition(which){const positions={1:[10,22],5:[11,16],6:[14,17],8:[19,8],9:[17,15],10:[7,13]};if(positions[DATA.week])return positions[DATA.week][which];if(DATA.week===3&&!which)return 3;const targets=DATA.week===2?[/round robin|round-robin|RR:/i,/real.time|gerçek zaman/i]:DATA.week===3?[/kayıp|lost update|interleav/i,/producer.consumer|üretici.*tüketici|bounded/i]:[/wait.for|bekleme graf|resource.*graph|kaynak.*graf/i,/Banker|bankacı/i];const found=DATA.slides.findIndex(s=>targets[which].test(s.tr.title+' '+s.en.title));return found>=0?found+1:(which?20:10)}
function active(n){current=Math.max(1,Math.min(DATA.slides.length,n));document.querySelectorAll('#nav a').forEach(a=>a.setAttribute('aria-current',String(+a.dataset.slide===current)));$('#jump').value=current;$('#prev').href='#s'+Math.max(1,current-1);$('#next').href=current===DATA.slides.length?'#footer':'#s'+(current+1);$('#prev').textContent=current===1?L('Başlangıç','Start'):L('Önceki','Previous');$('#next').textContent=current===DATA.slides.length?L('Dosyalar','Files'):L('Sonraki','Next');$('.progress').style.width=current/DATA.slides.length*100+'%'}
$('#language').addEventListener('change',e=>{const n=current,el=$('#s'+n),offset=el?el.getBoundingClientRect().top:0;lang=e.target.value;try{localStorage.setItem('cse513-language',lang)}catch{}render();const target=$('#s'+n);if(target)window.scrollBy({top:target.getBoundingClientRect().top-offset,behavior:'instant'})});
$('#jump').addEventListener('change',e=>{active(+e.target.value);$('#s'+current).scrollIntoView()});
let scrollPending=false;window.addEventListener('scroll',()=>{if(scrollPending)return;scrollPending=true;requestAnimationFrame(()=>{let n=1;document.querySelectorAll('.slide').forEach(el=>{if(el.getBoundingClientRect().top<=150)n=+el.id.slice(1)});active(n);scrollPending=false})},{passive:true});
function btn(id,tr,en,disabled=false){return `<button data-act="${id}" ${disabled?'disabled':''}>${L(tr,en)}</button>`}
function renderExperiments(){if(DATA.week===1){renderProcessTrace();renderRace()}if(typeof renderExtendedExperiments==='function')renderExtendedExperiments();if(DATA.week===2){renderScheduler();renderRT()}if(DATA.week===3){renderRace();renderQueue()}if(DATA.week===4){renderCycle();renderBank()}}
function schedule(policy,q){
 const jobs=SCHED.map(j=>({...j,left:j.burst,first:null,finish:null})),queue=[],timeline=[];let time=0,complete=0,last=null;
 const incoming=jobs.slice().sort((a,b)=>a.arrival-b.arrival||a.id.localeCompare(b.id));let ptr=0;
 const admit=()=>{while(ptr<incoming.length&&incoming[ptr].arrival<=time)queue.push(incoming[ptr++])};
 while(complete<jobs.length){admit();if(!queue.length){time=incoming[ptr].arrival;admit()}if(policy==='SJF')queue.sort((a,b)=>a.left-b.left||a.arrival-b.arrival||a.id.localeCompare(b.id));const j=queue.shift();if(j.first===null)j.first=time;const run=policy==='RR'?Math.min(q,j.left):j.left;timeline.push({id:j.id,start:time,end:time+run});time+=run;j.left-=run;admit();if(j.left)queue.push(j);else{j.finish=time;complete++}last=j.id;}
 return {timeline,jobs:jobs.map(j=>({...j,turn:j.finish-j.arrival,wait:j.finish-j.arrival-j.burst,response:j.first-j.arrival}))};
}
function renderScheduler(){const r=schedule(state.sched,state.q);state.schedStep=Math.min(state.schedStep,r.timeline.length);const shown=r.timeline.slice(0,state.schedStep);$('#experiment-primary').innerHTML='<h3>'+L('Zamanlama laboratuvarı','Scheduling lab')+'</h3><p>'+L('Tek CPU, CPU burst’leri biliniyor, I/O ve geçiş maliyeti yok. RR’de aynı anda gelen işler, süresi dolan işten önce kuyruğa girer. Eşitlik: varış zamanı, sonra kimlik.','One CPU, known CPU bursts, no I/O or switching cost. In RR, arrivals at a slice endpoint enter before the expired job. Ties: arrival time, then ID.')+'</p>'+table([[L('İş','Job'),L('Varış','Arrival'),'CPU burst'],...SCHED.map(j=>[j.id,j.arrival,j.burst])])+'<div class="controls"><label>'+L('Politika','Policy')+' <select id="policy"><option'+(state.sched==='FCFS'?' selected':'')+'>FCFS</option><option'+(state.sched==='SJF'?' selected':'')+'>SJF</option><option'+(state.sched==='RR'?' selected':'')+'>RR</option></select></label><label>Quantum <select id="quantum">'+[1,2,4].map(n=>`<option ${n===state.q?'selected':''}>${n}</option>`).join('')+'</select></label></div><div class="controls">'+btn('sched-prev','Önceki adım','Previous step',state.schedStep===0)+btn('sched-next','Sonraki dispatch','Next dispatch',state.schedStep===r.timeline.length)+btn('sched-all','Tüm izi göster','Show full trace')+btn('sched-reset','Sıfırla','Reset')+'</div><div aria-live="polite"><p>'+L('Dispatch sayısı: ','Dispatch count: ')+state.schedStep+' / '+r.timeline.length+'</p><div class="timeline">'+shown.map(t=>`<span>${t.id} [${t.start}, ${t.end})</span>`).join('')+'</div>'+(state.schedStep===r.timeline.length?table([[L('İş','Job'),L('Bitiş','Finish'),'Turnaround',L('Bekleme','Waiting'),'Response'],...r.jobs.map(j=>[j.id,j.finish,j.turn,j.wait,j.response])])+`<p><strong>${L('Ortalamalar','Means')}:</strong> W=${mean(r.jobs,'wait')}, T=${mean(r.jobs,'turn')}, R=${mean(r.jobs,'response')}</p>`:'')+'</div>';
 $('#policy').addEventListener('change',e=>{state.sched=e.target.value;state.schedStep=0;renderScheduler()});$('#quantum').addEventListener('change',e=>{state.q=+e.target.value;state.schedStep=0;renderScheduler()});}
function mean(a,key){return(a.reduce((n,j)=>n+j[key],0)/a.length).toFixed(2)}
function renderRT(){ $('#experiment-secondary').innerHTML='<h3>'+L('Deadline hesabı','Deadline calculation')+'</h3><p>'+L('Ayrı bir harmonik örnek: utilization hesabı yapar. Sunumdaki RM/EDF zaman izinin simülatörü değildir.','A separate harmonic example calculating utilization. It does not simulate the RM/EDF timeline in the slides.')+'</p><p>'+L('Bağımsız periyodik işler, tek CPU, preemption, D=T, geçiş maliyeti 0. C yürütme bütçesi, T dönem.','Independent periodic tasks, one CPU, preemption, D=T, zero switching cost. C is execution budget, T is period.')+'</p><label>'+L('Görev B yürütme bütçesi C','Task B execution budget C')+' <input id="rt-c" type="range" min="1" max="8" value="'+(state.rtC||3)+'"></label><div id="rt-result" aria-live="polite"></div>';const update=()=>{state.rtC=+$('#rt-c').value;const u=2/5+state.rtC/10,bound=2*(Math.sqrt(2)-1);$('#rt-result').innerHTML=table([['Task','C','T','D'],['A',2,5,5],['B',state.rtC,10,10]])+'<p>U = 2/5 + '+state.rtC+'/10 = '+u.toFixed(2)+'. RM '+L('yeterli sınırı','sufficient bound')+' ≈ '+bound.toFixed(3)+'.</p><p>'+L(u<=1?'Bu varsayımlarla EDF’nin U≤1 testi sağlanır.':'U>1: bu talepleri tek CPU’da sürekli karşılamak mümkün değil.',u<=1?'EDF passes the U≤1 test under these assumptions.':'U>1: one CPU cannot sustain this demand.')+'</p><p>'+L(u<=bound?'RM yeterli sınırı da sağlanır.':'RM yeterli sınırının aşılması tek başına başarısızlık kanıtı değildir. Bu harmonik dönemler için response-time hesabını deneyebilirsin.',u<=bound?'The RM sufficient bound also holds.':'Exceeding the RM sufficient bound alone does not prove failure. Try response-time analysis for these harmonic periods.')+'</p>';};$('#rt-c').addEventListener('input',update);update();}
function renderRace(){const seqs={race:[['A','read'],['B','read'],['A','add'],['B','add'],['A','write'],['B','write']],locked:[['A','read'],['A','add'],['A','write'],['B','read'],['B','add'],['B','write']]};let out='<h3>'+L('İki artırımın izi','Trace of two increments')+'</h3><p>'+L('Bu deterministik model adım sırasını seçer. Gerçek C data race çıktısı için tahmin yürütmez. Kilitli sütunda lock tüm read-modify-write işlemini kapsar.','This deterministic model chooses an interleaving. It does not predict the output of a real C data race. In the locked column, the lock protects the entire read-modify-write operation.')+'</p><div class="controls">'+btn('race-prev','Önceki','Previous',state.race===0)+btn('race-next','Sonraki','Next',state.race===6)+btn('race-reset','Sıfırla','Reset')+'</div><div aria-live="polite"><p>'+L('Adım ','Step ')+state.race+'/6</p><div class="racecols">';for(const [key,seq]of Object.entries(seqs)){let counter=0,tmp={A:null,B:null},event=L('Başlangıç','Initial state');for(const [who,op]of seq.slice(0,state.race)){if(op==='read')tmp[who]=counter;if(op==='add')tmp[who]++;if(op==='write')counter=tmp[who];event=who+' '+op;}out+='<div class="racecol"><h3>'+L(key==='race'?'Kilitsiz model':'Kilitli model',key==='race'?'Unlocked model':'Locked model')+'</h3><p>'+event+'</p><p>A='+esc(tmp.A??'∅')+' · B='+esc(tmp.B??'∅')+'</p><p>counter=<strong class="value">'+counter+'</strong></p></div>'}$(DATA.week===1?'#experiment-secondary':'#experiment-primary').innerHTML=out+'</div></div>';}
function renderQueue(){$('#experiment-secondary').innerHTML='<h3>'+L('Üç yerlik kuyruk','Queue with three slots')+'</h3><p>'+L('Put için count<3, get için count>0 gerekir. Bu model bir mutex’in koruduğu atomik adımları gösterir. Bekleyen gerçek thread oluşturmaz.','Put needs count<3, get needs count>0. This model shows atomic steps protected by one mutex. It does not create real waiting threads.')+'</p><div class="controls">'+btn('queue-put','Üret / put','Produce / put')+btn('queue-get','Tüket / get','Consume / get')+btn('queue-signal','Sadece signal','Signal only')+btn('queue-reset','Sıfırla','Reset')+'</div><div aria-live="polite"><p>count = <strong>'+state.queue.length+'</strong> / 3</p><p>'+L('Kuyruk: ','Queue: ')+(state.queue.join(', ')||'∅')+'</p><p>'+queueMessage()+'</p><p>'+L('Bir signal count değerini değiştirmez. Uyanan thread, mutex’i yeniden aldıktan sonra predicate’i while içinde kontrol eder.','A signal does not change count. After reacquiring the mutex, an awakened thread checks the predicate in a while loop.')+'</p></div>';}
function queueMessage(){return({full:L('Put beklemeli: kuyruk dolu.','Put must wait: queue is full.'),empty:L('Get beklemeli: kuyruk boş.','Get must wait: queue is empty.'),put:L('Öğe eklendi. not_empty bildirimi yapılabilir.','Item added. A not_empty notification can follow.'),get:L('Öğe çıkarıldı. not_full bildirimi yapılabilir.','Item removed. A not_full notification can follow.'),signal:L('Bildirim verildi. Predicate ve kuyruk değişmedi.','Notification sent. Predicate and queue are unchanged.')}[state.queueMsg]||L('İlk öğeyi üret veya boş kuyruktan tüketmeyi dene.','Produce the first item or try consuming from the empty queue.'));}
function renderCycle(){const rows=[['P0','R_A',L('Serbest','Free')],['P0','R_A','R_B'],['P0','R_A',L('R_B (P1 tutuyor)','R_B (held by P1)')],['P1','R_B',L('R_A (P0 tutuyor)','R_A (held by P0)')]];$('#experiment-primary').innerHTML='<h3>'+L('Döngünün oluşması','Building the cycle')+'</h3><p>'+L('İki kaynak, her birinden tek instance. P0, A’yı; P1, B’yi alır. Ardından birbirlerinin tuttuğu kaynağı isterler.','Two resources, one instance of each. P0 takes A and P1 takes B. They then request the resource held by the other.')+'</p><div class="controls">'+btn('cycle-prev','Önceki','Previous',state.cycle===0)+btn('cycle-next','Sonraki','Next',state.cycle===4)+btn('cycle-reset','Sıfırla','Reset')+'</div><div aria-live="polite">'+table([[L('Adım','Step'),L('Olay','Event')],...[L('P0 A’yı alır','P0 acquires A'),L('P1 B’yi alır','P1 acquires B'),L('P0 B’yi ister ve bekler','P0 requests B and waits'),L('P1 A’yı ister ve bekler','P1 requests A and waits')].slice(0,state.cycle).map((s,i)=>[i+1,s])])+'<p>'+L('Wait-for kenarları: ','Wait-for edges: ')+(state.cycle<3?'∅':state.cycle===3?'P0 → P1':'P0 → P1, P1 → P0')+'</p><p>'+L(state.cycle===4?'Döngü tamamlandı. Bu tek-instance ve bloklanma modelinde deadlock var. Sabit A-sonra-B kilit sırası bu döngüyü önler.':'Henüz wait-for döngüsü yok. Bir sonraki olay sonucu değiştirebilir.',state.cycle===4?'The cycle is complete. This single-instance blocking model is deadlocked. A fixed A-before-B lock order prevents this cycle.':'There is no wait-for cycle yet. The next event can change the result.')+'</p></div>';}
function banker(mode){const alloc=[[1,0],[1,1],[1,1]],max=[[3,2],[2,1],[2,2]],avail=[1,1];if(mode==='unsafe'){alloc[0]=[2,1];avail[0]=avail[1]=0}if(mode==='safe'){alloc[1]=[2,1];avail[0]=0}const need=max.map((r,i)=>r.map((v,j)=>v-alloc[i][j])),work=avail.slice(),finished=new Set(),steps=[];let changed=true;while(changed){changed=false;for(let i=0;i<3;i++){if(!finished.has(i)&&need[i].every((v,j)=>v<=work[j])){const before=work.slice();work.forEach((v,j)=>work[j]+=alloc[i][j]);finished.add(i);steps.push({id:'P'+i,before,after:work.slice()});changed=true;break}}}return{alloc,max,avail,need,steps,safe:finished.size===3};}
function renderBank(){const r=banker(state.bank);state.bankStep=Math.min(state.bankStep,r.steps.length);$('#experiment-secondary').innerHTML='<h3>'+L('Banker: güvenli sıra arayışı','Banker: searching for a safe sequence')+'</h3><p>'+L('Total=(4,3). Max sözleşmesi ve kaynakların sonunda bırakılması varsayılır. Request seçenekleri önce tentative grant durumunu gösterir.','Total=(4,3). The model assumes declared Max claims and eventual resource release. Request options first show the tentative grant state.')+'</p><label>'+L('Durum','State')+' <select id="bank-mode"><option value="initial" '+(state.bank==='initial'?'selected':'')+'>'+L('Başlangıç','Initial')+'</option><option value="unsafe" '+(state.bank==='unsafe'?'selected':'')+'>P0 request (1,1)</option><option value="safe" '+(state.bank==='safe'?'selected':'')+'>P1 request (1,0)</option></select></label>'+table([['Process','Allocation','Max','Need'],...r.alloc.map((a,i)=>['P'+i,a.join(', '),r.max[i].join(', '),r.need[i].join(', ')])])+'<p>Available = ('+r.avail.join(', ')+')</p><div class="controls">'+btn('bank-next','Bir process tamamla','Complete one process',state.bankStep===r.steps.length)+btn('bank-all','Sonucu göster','Show result')+btn('bank-reset','İzi sıfırla','Reset trace')+'</div><div aria-live="polite">'+table([['Process','Work '+L('önce','before'),'Work '+L('sonra','after')],...r.steps.slice(0,state.bankStep).map(s=>[s.id,s.before.join(', '),s.after.join(', ')])])+'<p>'+L('Tamamlama sırası: ','Completion order: ')+(r.steps.slice(0,state.bankStep).map(s=>s.id).join(' → ')||'∅')+'</p>'+(state.bankStep===r.steps.length?'<p><strong>'+L(r.safe?'SAFE: güvenli tamamlama sırası bulundu.':'UNSAFE: güvenli sıra bulunamadı. Banker bu isteği ertelemeli.',r.safe?'SAFE: a safe completion sequence was found.':'UNSAFE: no safe sequence was found. Banker should defer this request.')+'</strong></p><p>'+L('Unsafe, şu anda deadlock olduğunu tek başına kanıtlamaz. Gelecekteki azami taleplerin tümüne güvenli bir bitiş garantisi veremiyoruz.','Unsafe alone does not prove a current deadlock. The state cannot guarantee completion for all declared future maximum demands.')+'</p>':'')+'</div>';$('#bank-mode').addEventListener('change',e=>{state.bank=e.target.value;state.bankStep=0;renderBank()});}
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;switch(b.dataset.act){case'process-prev':state.processStep=Math.max(0,(state.processStep||0)-1);break;case'process-next':state.processStep=Math.min(4,(state.processStep||0)+1);break;case'process-reset':state.processStep=0;break;case'sched-prev':state.schedStep--;break;case'sched-next':state.schedStep++;break;case'sched-all':state.schedStep=999;break;case'sched-reset':state.schedStep=0;break;case'race-prev':state.race--;break;case'race-next':state.race++;break;case'race-reset':state.race=0;break;case'queue-put':if(state.queue.length===3)state.queueMsg='full';else{state.queue.push(++state.produced);state.queueMsg='put'}break;case'queue-get':if(!state.queue.length)state.queueMsg='empty';else{state.queue.shift();state.consumed++;state.queueMsg='get'}break;case'queue-signal':state.queueMsg='signal';break;case'queue-reset':state.queue=[];state.produced=state.consumed=0;state.queueMsg='';break;case'cycle-prev':state.cycle--;break;case'cycle-next':state.cycle++;break;case'cycle-reset':state.cycle=0;break;case'bank-next':state.bankStep++;break;case'bank-all':state.bankStep=999;break;case'bank-reset':state.bankStep=0;break;}renderExperiments();});

function renderProcessTrace(){const frames=[['running','ready','A',L('A yürür; B ready.','A runs; B is ready.')],['waiting','ready','—',L('A disk verisinde bloklanır. Dispatch henüz gösterilmedi.','A blocks for disk data. Dispatch has not yet been shown.')],['waiting','running','B',L('Scheduler B’yi seçer.','The scheduler selects B.')],['ready','running','B',L('A’nın I/O’su bitti. A ready; CPU bu izde B’de kalır.','A’s I/O completes. A is ready; B retains the CPU in this trace.')],['running','waiting','A',L('B bloklanır, ardından A seçilir.','B blocks, then A is selected.')]],i=state.processStep||0,f=frames[i];$('#experiment-primary').innerHTML='<h3>'+L('CPU şu anda kimin?','Who owns the CPU now?')+'</h3><div class="controls">'+btn('process-prev','Önceki','Previous',i===0)+btn('process-next','Sonraki','Next',i===4)+btn('process-reset','Sıfırla','Reset')+'</div><div aria-live="polite">'+table([['Process A','Process B','CPU'],f.slice(0,3)])+'<p>'+f[3]+'</p></div>';}

/* Offline teaching models for weeks 5,6,8,9,10. No host operations. */
function extData(){return typeof EXTRA==='object'&&EXTRA?EXTRA:{}}
function extState(){const w=Number(DATA.week);state.extended=state.extended||{};if(!state.extended[w])state.extended[w]={};return state.extended[w]}
function extButton(id,tr,en,disabled=false){return `<button type="button" data-extra-act="${esc(id)}" ${disabled?'disabled':''}>${L(tr,en)}</button>`}
function extSelect(id,label,options,value){return `<label for="${id}">${label} <select id="${id}">${options.map(o=>`<option value="${esc(o[0])}" ${String(o[0])===String(value)?'selected':''}>${esc(o[1])}</option>`).join('')}</select></label>`}
function extRange(id,label,min,max,value){return `<label for="${id}">${label}: <strong>${esc(value)}</strong> <input id="${id}" type="range" min="${min}" max="${max}" step="1" value="${esc(value)}"></label>`}
function extListen(id,fn){const e=$('#'+id);if(e)e.addEventListener('change',fn)}
function extSet(primary,secondary){const a=$('#experiment-primary'),b=$('#experiment-secondary');if(a)a.innerHTML=primary;if(b)b.innerHTML=secondary}
function extNotice(tr,en){return `<p class="boundary">${L(tr,en)}</p>`}
function extTranslate(process,va,mode,cache,data){
 const size=data.page_size||256,limit=2**(data.va_bits||16),entries=cache.map(x=>({...x}));
 if(!Number.isInteger(va)||va<0||va>=limit)return{cache:entries,result:{status:'INVALID'}};
 const vpn=Math.floor(va/size),offset=va%size,key=process+':'+vpn,index=entries.findIndex(x=>x.key===key);
 const pte=index>=0?entries[index].pte:data.page_tables?.[process]?.[String(vpn)];
 const result={process,va,vpn,offset,hit:index>=0,status:'UNMAPPED'};
 if(!pte)return{cache:entries,result};
 if(!pte.present){result.status='PAGE_FAULT';return{cache:entries,result}}
 if(!pte[mode]){result.status='PROTECTION';return{cache:entries,result}}
 result.status='OK';result.frame=pte.frame;result.pa=pte.frame*size+offset;
 if(index>=0)entries.splice(index,1);entries.push({key,pte:{...pte}});while(entries.length>2)entries.shift();
 return{cache:entries,result};
}
function extReplacement(refs,capacity,policy){
 const slots=Array(capacity).fill(null),fifo=[],recent=[];let faults=0,hits=0;
 const snapshots=[{slots:slots.slice(),faults,hits,event:'INITIAL',page:null,evicted:null}];
 refs.forEach((page,i)=>{
  const found=slots.indexOf(page);let event='HIT',evicted=null;
  if(found>=0){hits++}else{
   faults++;event='FAULT';let slot=slots.indexOf(null);
   if(slot<0){
    if(policy==='fifo')slot=slots.indexOf(fifo[0]);
    else if(policy==='lru')slot=slots.indexOf(recent[0]);
    else{let far=-1;slots.forEach((p,j)=>{const next=refs.indexOf(p,i+1),distance=next<0?Infinity:next;if(distance>far){far=distance;slot=j}})}
    evicted=slots[slot];if(policy==='fifo')fifo.shift();
   }
   slots[slot]=page;if(policy==='fifo')fifo.push(page);
  }
  const old=recent.indexOf(page);if(old>=0)recent.splice(old,1);if(evicted!==null){const oldVictim=recent.indexOf(evicted);if(oldVictim>=0)recent.splice(oldVictim,1)}recent.push(page);
  snapshots.push({slots:slots.slice(),faults,hits,event,page,evicted});
 });return snapshots;
}
function extDecision(scope,role,path,action,data){const scopes=data.primary?.scopes||{},roles=data.primary?.roles||{},mount=scopes[scope]?.paths?.[path];if(!mount)return'HIDDEN';if(!(roles[role]||[]).includes(action))return'DENIED_ROLE';if(action==='write'&&mount!=='rw')return'DENIED_READ_ONLY';return'ALLOWED'}
function extCPU(quota,demand,period=100){const served=Math.min(quota,demand);return{served,unmet:demand-served,remaining:quota-served,period}}
function extMemory(used,request,maximum){const accepted=used+request<=maximum;return{accepted,after:accepted?used+request:used}}
function extRender5(){
 const d=extData(),s=extState();s.process??='P';s.va??=308;s.mode??='read';s.cache??=[];s.ratio??=Math.round((d.eat?.hit_ratio??.9)*100);
 const processes=Object.keys(d.page_tables||{}),r=s.translation;
 const result=r?`<div aria-live="polite"><p>VPN=${esc(r.vpn??'—')} · ${L('Offset','Offset')}=${esc(r.offset??'—')}</p><p>${L('TLB: ','TLB: ')}${r.status==='INVALID'?'—':L(r.hit?'hit':'miss',r.hit?'hit':'miss')}</p><p><strong>${({OK:L('Çeviri başarılı','Translation succeeds'),INVALID:L('VA aralık dışında veya tamsayı değil','VA is outside the range or not an integer'),UNMAPPED:L('Unmapped: PTE yok','Unmapped: no PTE'),PAGE_FAULT:L('Not present: page fault','Not present: page fault'),PROTECTION:L('Permission fault: erişim reddedildi','Permission fault: access denied')})[r.status]}</strong>${r.status==='OK'?` · frame=${r.frame} · PA=${r.pa}`:''}</p></div>`:`<p>${L('Önce sonucu tahmin et, sonra Çevir’e bas.','Predict first, then select Translate.')}</p>`;
 const rows=[[L('Process','Process'),'VPN','Frame','Present',L('İzin','Permissions')],...Object.entries(d.page_tables||{}).flatMap(([p,t])=>Object.entries(t).map(([vpn,pte])=>[p,vpn,pte.frame??'—',L(pte.present?'evet':'hayır',pte.present?'yes':'no'),(pte.read?'R':'')+(pte.write?'W':'')]))];
 const primary=`<h3>${L('Adres çevirisi ve iki-entry TLB','Address translation and a two-entry TLB')}</h3>${extNotice('16-bit VA; 256-byte page; process-tagged TLB, capacity2 LRU. Resident PTE izinleri de kontrol edilir. Gerçek MMU/TLB performans ölçümü değildir.','16-bit VA; 256-byte pages; process-tagged TLB, capacity2 LRU. Resident-PTE permissions are checked too. Not a real MMU/TLB benchmark.')}<div class="controls">${extSelect('ex-process','Process',processes.map(p=>[p,p]),s.process)}<label for="ex-va">VA (decimal) <input id="ex-va" type="number" min="0" max="65535" step="1" value="${esc(s.va)}"></label>${extSelect('ex-mode',L('Erişim','Access'),[['read',L('Oku / R','Read / R')],['write',L('Yaz / W','Write / W')]],s.mode)}${extButton('translate','Çevir','Translate')}${extButton('tlb-clear','TLB’yi temizle','Clear TLB')}</div>${result}<p>${L('TLB sırası LRU → MRU: ','TLB order LRU → MRU: ')}${s.cache.map(x=>esc(x.key)).join(', ')||'∅'}</p>${table(rows)}`;
 const tlb=d.eat?.tlb_ns??10,mem=d.eat?.memory_ns??100,levels=d.eat?.levels??1,h=s.ratio/100,hit=tlb+mem,miss=tlb+(levels+1)*mem,eat=h*hit+(1-h)*miss;
 const secondary=`<h3>${L('TLB effective access time','TLB effective access time')}</h3>${extRange('ex-ratio',L('Hit oranı (%)','Hit ratio (%)'),0,100,s.ratio)}<p>${L('Seri lookup modeli','Serial lookup model')}: hit=${hit} ns; miss=${miss} ns.</p><p>EAT = ${h.toFixed(2)}×${hit} + ${(1-h).toFixed(2)}×${miss} = <strong>${eat.toFixed(2)} ns</strong></p>${extNotice('Resident sayfa; cache/overlap/page fault yok. Miss maliyeti PTE walk ve son data erişimini içerir. Bu ortalama ölçülmüş CPU gecikmesi değildir.','Resident pages; no cache, overlap, or page faults. Miss cost includes the PTE walk and final data access. This mean is not measured CPU latency.')}`;
 extSet(primary,secondary);extListen('ex-process',e=>{s.process=e.target.value;s.translation=null;renderExtendedExperiments()});extListen('ex-va',e=>{s.va=Number(e.target.value);s.translation=null;renderExtendedExperiments()});extListen('ex-mode',e=>{s.mode=e.target.value;s.translation=null;renderExtendedExperiments()});extListen('ex-ratio',e=>{s.ratio=Number(e.target.value);renderExtendedExperiments()});
}
function extRender6(){
 const d=extData(),s=extState();s.policy??='fifo';s.frames??=d.frames||3;s.pageStep??=0;s.beladyStep??=0;
 const refs=d.references||[],trace=extReplacement(refs,s.frames,s.policy);s.pageStep=Math.min(s.pageStep,refs.length);const r=trace[s.pageStep];
 const primary=`<h3>${L('Page replacement: izi adım adım yürüt','Page replacement: step through the trace')}</h3><p>${L('Referanslar: ','References: ')}${esc(refs.join(', '))}</p><div class="controls">${extSelect('ex-page-policy',L('Politika','Policy'),['fifo','lru','opt'].map(x=>[x,x.toUpperCase()]),s.policy)}${extSelect('ex-frames',L('Frame sayısı','Frames'),[2,3,4].map(n=>[n,n]),s.frames)}${extButton('page-prev','Önceki','Previous',s.pageStep===0)}${extButton('page-next','Sonraki referans','Next reference',s.pageStep===refs.length)}${extButton('page-all','Tüm izi göster','Show full trace')}${extButton('page-reset','Sıfırla','Reset')}</div><div aria-live="polite"><p>${L('Adım ','Step ')}${s.pageStep}/${refs.length} · ${L('Referans: ','Reference: ')}${r.page??'—'} · ${r.event==='INITIAL'?L('Başlangıç','Initial state'):r.event}</p>${table([['Slot',...r.slots.map((_,i)=>i)],['Page',...r.slots.map(x=>x??'∅')]])}<p>${L('Çıkarılan: ','Evicted: ')}${r.evicted??'—'} · faults=<strong>${r.faults}</strong> · hits=${r.hits}</p></div>${extNotice('Boş frames, demand loads, atomic sequential references. OPT geleceği bilerek öğretici alt sınırdır; canlı sistem politikası değildir. OPT tie: en küçük slot. Gerçek I/O zamanını ölçmüyoruz.','Empty frames, demand loads, atomic sequential references. OPT knows the future and provides a teaching lower bound, not an implementable live policy. OPT ties choose the lowest slot. No real I/O time is measured.')}`;
 const br=d.belady?.references||[1,2,3,4,1,2,5,1,2,3,4,5];s.beladyStep=Math.min(s.beladyStep,br.length);const a=extReplacement(br,3,'fifo')[s.beladyStep],b=extReplacement(br,4,'fifo')[s.beladyStep];
 const secondary=`<h3>${L('Belady: FIFO üç ve dört frame','Belady: FIFO with three and four frames')}</h3><p>${esc(br.join(', '))}</p><div class="controls">${extButton('belady-next','Bir referans ilerlet','Advance one reference',s.beladyStep===br.length)}${extButton('belady-all','Sonucu karşılaştır','Compare the result')}${extButton('belady-reset','Sıfırla','Reset')}</div><div aria-live="polite">${table([[L('Frame sayısı','Frames'),'Slots','Faults'],[3,a.slots.map(x=>x??'∅').join(', '),a.faults],[4,b.slots.map(x=>x??'∅').join(', '),b.faults]])}<p>${L('Adım ','Step ')}${s.beladyStep}/${br.length}</p>${s.beladyStep===br.length?`<p>${L('Bu izde daha çok frame FIFO fault sayısını artırıyor; her iz için aynı sonuç iddia edilmez.','On this trace, more FIFO frames increase faults; this is not claimed for every trace.')}</p>`:''}</div>`;
 extSet(primary,secondary);extListen('ex-page-policy',e=>{s.policy=e.target.value;s.pageStep=0;renderExtendedExperiments()});extListen('ex-frames',e=>{s.frames=Number(e.target.value);s.pageStep=0;renderExtendedExperiments()});
}
function extClass(code){return({OLD:L('OLD: önceki dosya görünümü','OLD: previous file view'),NEW:L('NEW: hedef dosya görünümü','NEW: target file view'),ALLOCATION_LEAK:L('Allocation leak: referanssız allocated block','Allocation leak: allocated block has no reference'),REFERENCE_TO_FREE_BLOCK:L('Free block’a inode referansı','Inode reference to a free block'),CONSISTENT_METADATA_STALE_DATA:L('Metadata tutarlı; data stale','Consistent metadata; stale data')})[code]||esc(code)}
function extRender8(){
 const d=extData(),s=extState();s.crashMode??='naive';s.crashPrefix??=0;s.recovered??=false;s.producerRate??=6;s.consumerRate??=4;s.capacity??=10;s.bufferTime??=0;
 const p=d.primary||{},steps=p.steps?.[s.crashMode]||[],cases=p.cases||[];s.crashPrefix=Math.min(s.crashPrefix,steps.length);const c=cases.find(x=>x.mode===s.crashMode&&x.completedSteps===s.crashPrefix);
 let primary=`<h3>${L('Crash: hangi durable state kaldı?','Crash: which durable state remains?')}</h3><div class="controls">${extSelect('ex-crash-mode',L('Protokol','Protocol'),[['naive',L('Journalsız','No journal')],['journal',L('Redo journal','Redo journal')]],s.crashMode)}${extButton('crash-prev','Önceki durable adım','Previous durable step',s.crashPrefix===0)}${extButton('crash-next','Bir durable adım','One durable step',s.crashPrefix===steps.length)}${extButton('crash-recover','Crash + recovery','Crash + recovery',!c)}${extButton('crash-reset','Sıfırla','Reset')}</div><p>${L('Tamamlanan durable adım: ','Completed durable steps: ')}${s.crashPrefix}/${steps.length}</p><p>${steps.map((x,i)=>(i<s.crashPrefix?'✓ ':'· ')+esc(x)).join(' → ')}</p>`;
 if(c){const st=s.recovered?c.recovered:c.state,home=st.home;primary+=`<div aria-live="polite">${table([[L('Alan','Field'),L('Kalıcı değer','Persistent value')],['allocated',home.allocated.join(', ')],['inode',home.inode.join(', ')],['data[5]',home.data['5']],['journal payload',L(st.log.payload?'tam':'yok',st.log.payload?'complete':'absent')],['journal committed',L(st.log.committed?'evet':'hayır',st.log.committed?'yes':'no')]])}<p><strong>${extClass(s.recovered?c.after:c.before)}</strong></p><p>${L(s.recovered?'Recovery sonrası gösteriliyor.':'Crash anındaki home/log gösteriliyor.',s.recovered?'Showing the state after recovery.':'Showing home/log state at the crash point.')}</p></div>`}
 primary+=extNotice('Her adım atomik ve durable varsayılır; RAM crash’te kaybolur. Tam payload → commit → home → clear sırası. Gerçek filesystem, torn-write, device reorder veya fsync testi değildir. Naive modda repair algoritması yok.','Each step is assumed atomic and durable; a crash loses RAM. Complete payload → commit → home → clear order. Not a real filesystem, torn-write, reordering, or fsync test. Naive mode implements no repair algorithm.');
 const net=s.producerRate-s.consumerRate,offered=net*s.bufferTime,count=Math.min(s.capacity,Math.max(0,offered)),fill=net>0?s.capacity/net:null;
 const secondary=`<h3>${L('Sonlu buffer: hız farkını izle','Finite buffer: inspect the rate mismatch')}</h3>${extRange('ex-producer',L('Producer öğe/s','Producer items/s'),1,20,s.producerRate)}${extRange('ex-consumer',L('Consumer öğe/s','Consumer items/s'),0,20,s.consumerRate)}${extRange('ex-capacity',L('Kapasite','Capacity'),1,40,s.capacity)}${extRange('ex-buffer-time',L('Zaman (s)','Time (s)'),0,20,s.bufferTime)}<p>count = clamp((${s.producerRate}−${s.consumerRate})×${s.bufferTime}, 0, ${s.capacity}) = <strong>${count}</strong></p><p>${fill===null?L('Producer consumer’dan hızlı değil; bu empty-start modelde birikme yok.','The producer is no faster than the consumer; this empty-start model has no buildup.'):L('Doluya ulaşma zamanı: ','Time to fill: ')+fill.toFixed(2)+' s'}</p>${extNotice('Sürekli fluid model, başlangıç boş. Full sonrası count clamped; gerçek drop/backpressure implementasyonu yok. Consumer üretimden hızlıysa gerçek tüketim mevcut öğelerle sınırlıdır.','Continuous fluid model, initially empty. Count is clamped after full; no actual drop/backpressure policy is implemented. If consumption is faster, actual consumption is limited by available items.')}`;
 extSet(primary,secondary);extListen('ex-crash-mode',e=>{s.crashMode=e.target.value;s.crashPrefix=0;s.recovered=false;renderExtendedExperiments()});for(const[id,key]of[['ex-producer','producerRate'],['ex-consumer','consumerRate'],['ex-capacity','capacity'],['ex-buffer-time','bufferTime']])extListen(id,e=>{s[key]=Number(e.target.value);renderExtendedExperiments()});
}
function extRender9(){
 const d=extData(),s=extState(),p=d.primary||{},b=d.secondary||{};s.scope??='a';s.role??='viewer';s.path??='/app/config';s.action??='read';s.quota??=b.quota??50;s.demand??=b.demand??80;s.memoryUsed??=b.memoryUsed??192;s.memoryRequest??=b.memoryRequest??80;s.periodNumber??=1;
 const decision=extDecision(s.scope,s.role,s.path,s.action,d),identity=p.scopes?.[s.scope]||{},meanings={ALLOWED:L('İzinli','Allowed'),HIDDEN:L('Görünümde path yok','Path absent from this view'),DENIED_ROLE:L('Role bu operasyonu izinli kılmıyor','Role does not authorize this operation'),DENIED_READ_ONLY:L('Mount read-only: write reddedildi','Mount is read-only: write denied')};
 const primary=`<h3>${L('Görünürlük ve yetki: ayrı kararlar','Views and permissions: separate decisions')}</h3><div class="controls">${extSelect('ex-scope','Scope',Object.keys(p.scopes||{}).map(x=>[x,x.toUpperCase()]),s.scope)}${extSelect('ex-role',L('Rol','Role'),Object.keys(p.roles||{}).map(x=>[x,x]),s.role)}${extSelect('ex-path','Path',['/app/config','/app/data','/host/secret'].map(x=>[x,x]),s.path)}${extSelect('ex-action',L('Operasyon','Operation'),[['read',L('Oku','Read')],['write',L('Yaz','Write')]],s.action)}</div><div aria-live="polite"><p>local PID=${identity.local_pid??'—'} · host PID=${identity.host_pid??'—'}</p><p><strong>${meanings[decision]}</strong> (${decision})</p></div>${table([[L('Scope','Scope'),'Local PID','Host PID'],...Object.entries(p.scopes||{}).map(([name,x])=>[name,x.local_pid,x.host_pid])])}${extNotice('Model görünüm + role allowlist + mount mode denetler. Gerçek Linux enforcement veya exploit resistance testi değildir; hiçbir host path açılmaz. Eşit local PID aynı object veya erişim hakkı demek değildir.','The model checks view + role allowlist + mount mode. Not actual Linux enforcement or an exploit-resistance test; no host path is opened. Equal local PIDs do not imply the same object or access rights.')}`;
 const period=b.period||100,max=b.memoryMaximum||256,cpu=extCPU(s.quota,s.demand,period),mem=extMemory(s.memoryUsed,s.memoryRequest,max);
 const secondary=`<h3>${L('CPU ve memory budget modeli','CPU and memory budget model')}</h3>${extRange('ex-quota',L('Quota (ms/100ms)','Quota (ms/100ms)'),0,100,s.quota)}${extRange('ex-demand',L('Bu period demand (ms)','Demand this period (ms)'),0,150,s.demand)}<p>${L('Period ','Period ')}${s.periodNumber}: served=${cpu.served} ms; unmet=${cpu.unmet} ms; remaining=${cpu.remaining} ms</p><div class="controls">${extButton('budget-period','Yeni period: budget’i yenile','New period: replenish budget')}</div>${extRange('ex-memory-used',L('Başlangıç kullanılan MiB','Initially used MiB'),0,max,s.memoryUsed)}${extRange('ex-memory-request',L('İstenen ek MiB','Additional requested MiB'),0,128,s.memoryRequest)}<p>${s.memoryUsed}+${s.memoryRequest} ${mem.accepted?'≤':'>'} ${max} MiB · <strong>${L(mem.accepted?'Kabul':'Reddedildi',mem.accepted?'Accepted':'Denied')}</strong>; after=${mem.after} MiB</p>${extNotice('Quota üst sınır, minimum service/deadline garantisi değil. Tek CPU, her period yeniden başlar; backlog taşınmaz. Memory atomik admit/deny modeli gerçek memory.max reclaim/OOM davranışını emüle etmez. CPU budget değiştirmek file permission değiştirmez.','Quota is a ceiling, not minimum service or a deadline guarantee. One CPU; each period starts afresh, with no backlog. Atomic memory admission does not emulate actual memory.max reclaim/OOM behavior. Changing CPU budget does not change file permissions.')}`;
 extSet(primary,secondary);for(const[id,key]of[['ex-scope','scope'],['ex-role','role'],['ex-path','path'],['ex-action','action']])extListen(id,e=>{s[key]=e.target.value;renderExtendedExperiments()});for(const[id,key]of[['ex-quota','quota'],['ex-demand','demand'],['ex-memory-used','memoryUsed'],['ex-memory-request','memoryRequest']])extListen(id,e=>{s[key]=Number(e.target.value);renderExtendedExperiments()});
}
function extRPC(step,idempotent){let effects=0,record=false,reused=false;for(let i=1;i<=step;i++){if(i===2){effects++;record=idempotent}if(i===5){if(idempotent&&record)reused=true;else effects++}}return{effects,record,reused,clientDone:step>=6,uncertain:step>=3&&step<6}}
function extLamport(events){const clocks={},messages={},rows=[];events.forEach(e=>{clocks[e.process]??=0;const before=clocks[e.process];if(e.type==='receive'){if(messages[e.message]===undefined)throw Error('Lamport receive before modeled send');clocks[e.process]=Math.max(before,messages[e.message])+1}else{clocks[e.process]++;if(e.type==='send')messages[e.message]=clocks[e.process]}rows.push({process:e.process,type:e.type,message:e.message||'',before,after:clocks[e.process],received:e.type==='receive'?messages[e.message]:null,clocks:{...clocks}})});return rows}
function extRender10(){
 const s=extState();s.rpcMode??='idempotent';s.rpcStep??=0;s.lamportStep??=0;
 const rpc=extRPC(s.rpcStep,s.rpcMode==='idempotent'),eventLabels=[L('Başlangıç','Initial state'),L('Client request K17 gönderir','Client sends request K17'),s.rpcMode==='idempotent'?L('Server effect +1 uygular; K17 sonucunu kaydeder','Server applies effect +1; stores the K17 result'):L('Server effect +1 uygular; duplicate kaydı tutmaz','Server applies effect +1; stores no duplicate record'),L('Reply kaybolur; client sonucu bilmiyor','Reply is lost; client does not know the outcome'),L('Client aynı K17 ile retry gönderir','Client retries with the same K17'),s.rpcMode==='idempotent'?L('Server K17 sonucunu yeniden kullanır','Server reuses the K17 result'):L('Server ikinci effect +1 uygular','Server applies a second effect +1'),L('Reply client’a ulaşır','Reply reaches the client')];
 const primary=`<h3>${L('RPC retry: effect kaç kez uygulandı?','RPC retry: how many effects were applied?')}</h3><p>${L('Açık prescribed trace: counter0, requestK17, bir reply kaybı, bir retry. Gerçek network çalıştırılmıyor.','Explicit prescribed trace: counter0, requestK17, one lost reply, one retry. No real network is run.')}</p><div class="controls">${extSelect('ex-rpc-mode',L('Server protokolü','Server protocol'),[['naive',L('Naïve: her retry yeni effect','Naive: each retry applies a new effect')],['idempotent',L('Idempotency key + stored result','Idempotency key + stored result')]],s.rpcMode)}${extButton('rpc-prev','Önceki event','Previous event',s.rpcStep===0)}${extButton('rpc-next','Sonraki event','Next event',s.rpcStep===6)}${extButton('rpc-reset','Sıfırla','Reset')}</div><div aria-live="polite"><p>${L('Event ','Event ')}${s.rpcStep}/6: ${eventLabels[s.rpcStep]}</p><p>server counter = <strong>${rpc.effects}</strong> · ${L('Stored result: ','Stored result: ')}${rpc.record?'K17':'∅'}</p><p>${rpc.clientDone?L('Client completion gördü. Effect sayısı server protokolüne bağlı.','The client observed completion. Effect count depends on the server protocol.'):rpc.uncertain?L('Client açısından belirsizlik: timeout ilk effect’in yapılmadığını kanıtlamaz.','Client uncertainty: a timeout does not prove the first effect was absent.'):L('Client henüz completion görmedi.','The client has not observed completion yet.')}</p></div>${extNotice('Idempotency modeli effect ve key/result kaydını tek atomik işlem kabul eder, record retry boyunca saklanır. Gerçek exactly-once guarantee değildir; crash, retention, key scope ve concurrency için ayrı durable protokol gerekir.','The idempotency model treats effect plus key/result recording as atomic and retains the record across the retry. This is not a real exactly-once guarantee; crashes, retention, key scope, and concurrency need a separate durable protocol.')}`;
 const events=[{process:'A',type:'local'},{process:'A',type:'send',message:'m1'},{process:'B',type:'receive',message:'m1'},{process:'B',type:'local'},{process:'B',type:'send',message:'m2'},{process:'A',type:'receive',message:'m2'}],rows=extLamport(events);s.lamportStep=Math.min(s.lamportStep,rows.length);const shown=rows.slice(0,s.lamportStep),current=shown.at(-1)?.clocks||{A:0,B:0};
 const secondary=`<h3>${L('Lamport clock: mesaj ilişkisini izle','Lamport clock: trace message relations')}</h3><p>${L('Declared trace: A.local → A.send(m1) → B.receive(m1) → B.local → B.send(m2) → A.receive(m2). Her process ilk clock0.','Declared trace: A.local → A.send(m1) → B.receive(m1) → B.local → B.send(m2) → A.receive(m2). Each process starts at clock0.')}</p><div class="controls">${extButton('lamport-prev','Önceki event','Previous event',s.lamportStep===0)}${extButton('lamport-next','Sonraki event','Next event',s.lamportStep===rows.length)}${extButton('lamport-reset','Sıfırla','Reset')}</div><div aria-live="polite">${table([[L('Process','Process'),L('Event','Event'),'Message',L('Önce','Before'),L('Receive timestamp','Received timestamp'),'L'],...shown.map(r=>[r.process,L(r.type==='local'?'Yerel':r.type==='send'?'Gönder':'Al',r.type==='local'?'Local':r.type==='send'?'Send':'Receive'),r.message||'—',r.before,r.received??'—',r.after])])}<p>A=${current.A??0}; B=${current.B??0} · ${L('Adım ','Step ')}${s.lamportStep}/6</p></div>${extNotice('Local/send: L←L+1. Receive: L←max(local,message)+1. a→b ise L(a)<L(b); tersi tek başına causality kanıtı değil. Bu declared trace wall-clock zamanı veya network latency ölçmez.','Local/send: L←L+1. Receive: L←max(local,message)+1. If a→b then L(a)<L(b); the converse alone does not prove causality. This declared trace measures neither wall-clock time nor network latency.')}`;
 extSet(primary,secondary);extListen('ex-rpc-mode',e=>{s.rpcMode=e.target.value;s.rpcStep=0;renderExtendedExperiments()});
}
function renderExtendedExperiments(){const week=Number(DATA.week);if(![5,6,8,9,10].includes(week))return;if(!$('#experiment-primary')&&!$('#experiment-secondary'))return;({5:extRender5,6:extRender6,8:extRender8,9:extRender9,10:extRender10})[week]()}
document.addEventListener('click',event=>{
 const el=event.target.closest?.('[data-extra-act]');if(!el||el.disabled||![5,6,8,9,10].includes(Number(DATA.week)))return;
 const s=extState(),d=extData(),id=el.dataset.extraAct;
 const actions={
  'translate':()=>{const r=extTranslate(s.process,s.va,s.mode,s.cache||[],d);s.cache=r.cache;s.translation=r.result},
  'tlb-clear':()=>{s.cache=[];s.translation=null},
  'page-prev':()=>s.pageStep=Math.max(0,s.pageStep-1),
  'page-next':()=>s.pageStep=Math.min((d.references||[]).length,s.pageStep+1),
  'page-all':()=>s.pageStep=(d.references||[]).length,
  'page-reset':()=>s.pageStep=0,
  'belady-next':()=>s.beladyStep=Math.min((d.belady?.references||[]).length,s.beladyStep+1),
  'belady-all':()=>s.beladyStep=(d.belady?.references||[]).length,
  'belady-reset':()=>s.beladyStep=0,
  'crash-prev':()=>{s.crashPrefix=Math.max(0,s.crashPrefix-1);s.recovered=false},
  'crash-next':()=>{s.crashPrefix=Math.min(d.primary?.steps?.[s.crashMode]?.length||0,s.crashPrefix+1);s.recovered=false},
  'crash-recover':()=>s.recovered=true,
  'crash-reset':()=>{s.crashPrefix=0;s.recovered=false},
  'budget-period':()=>s.periodNumber++,
  'rpc-prev':()=>s.rpcStep=Math.max(0,s.rpcStep-1),
  'rpc-next':()=>s.rpcStep=Math.min(6,s.rpcStep+1),
  'rpc-reset':()=>s.rpcStep=0,
  'lamport-prev':()=>s.lamportStep=Math.max(0,s.lamportStep-1),
  'lamport-next':()=>s.lamportStep=Math.min(6,s.lamportStep+1),
  'lamport-reset':()=>s.lamportStep=0
 };
 if(!actions[id])return;actions[id]();renderExtendedExperiments();
});

const animationVersion='20261008-matrix';
const animationCapture=new URLSearchParams(location.search).has('capture');
const animationMotion=matchMedia('(prefers-reduced-motion: reduce)');
let animationObserver;
function mountAnimations(){
 if(animationCapture)return;
 animationObserver?.disconnect();
 animationObserver=new IntersectionObserver(entries=>{for(const e of entries){const box=e.target;box.dataset.inView=String(e.isIntersecting);updateAnimationImage(box)}},{rootMargin:'100px'});
 for(const slot of ['primary','secondary']){
  const lab=$('#experiment-'+slot),record=ANIMATIONS[String(DATA.week)]?.[slot],asset=themedAnimationAsset(record);
  if(!lab||!asset)continue;
  const box=document.createElement('div');box.className='animation-card';box.dataset.animation=slot;box.dataset.playing=String(!animationMotion.matches);box.dataset.inView='false';
  const title=lab.querySelector('h3')?.textContent||L('Kavramsal deney','Conceptual experiment');
  box.innerHTML=`<div class="animation-toolbar"><button class="subtle" data-animation-toggle>${L('Durdur ve başa dön','Stop and reset')}</button><button class="subtle" data-animation-replay>${L('Yeniden oynat','Replay')}</button><span class="animation-number">${L('Görsel','Visual')} ${record.index}/18</span></div><figure><picture><source media="(max-width:600px)" srcset="${asset.mobile.poster}" width="${asset.mobile.width}" height="${asset.mobile.height}"><img src="${asset.desktop.poster}" width="${asset.desktop.width}" height="${asset.desktop.height}" loading="lazy" decoding="async" alt="${esc(title)} — ${asset.frames} ${L('adımlık animasyon','step animation')}"></picture><figcaption class="small">${L('Adımlar otomatik ilerler ve tekrar eder. Sağ üstte görsel ve adım sırası görünür.','Steps advance automatically and loop. The visual number and current step appear at the top right.')} · <a href="${asset.desktop.gif}?v=${animationVersion}" data-animation-download download>${L('GIF indir','Download GIF')}</a></figcaption></figure><details class="animation-lab"><summary>${L('Metni oku veya kendin dene','Read the text or try it yourself')}</summary></details>`;
  lab.before(box);box.querySelector('details').append(lab);box.animationAsset=asset;box.animationRecord=record;
  box.querySelector('[data-animation-toggle]').addEventListener('click',()=>{box.dataset.playing=String(box.dataset.playing!=='true');updateAnimationImage(box)});
  box.querySelector('[data-animation-replay]').addEventListener('click',()=>{box.dataset.playing='true';box.dataset.replay=String(Date.now());updateAnimationImage(box)});
  animationObserver.observe(box);updateAnimationImage(box);
 }
}
function themedAnimationAsset(record){const localized=record?.languages[lang];if(!localized)return null;const theme=document.documentElement.dataset.theme||'light';return {...localized,...localized.themes?.[theme]};}
function updateAnimationImage(box){
 const asset=box.animationAsset;if(!asset)return;
 const playing=box.dataset.playing==='true',visible=box.dataset.inView==='true',kind=playing&&visible?'gif':'poster',suffix='?v='+animationVersion+(kind==='gif'&&box.dataset.replay?'&replay='+box.dataset.replay:'');
 const img=box.querySelector('img'),source=box.querySelector('source');img.width=asset.desktop.width;img.height=asset.desktop.height;source.setAttribute('width',asset.mobile.width);source.setAttribute('height',asset.mobile.height);const src=asset.desktop[kind]+suffix,mobile=asset.mobile[kind]+suffix;
 box.querySelector('[data-animation-download]').href=asset.desktop.gif+'?v='+animationVersion;
 if(img.getAttribute('src')!==src)img.src=src;if(source.getAttribute('srcset')!==mobile)source.srcset=mobile;
 const button=box.querySelector('[data-animation-toggle]');button.textContent=playing?L('Durdur ve başa dön','Stop and reset'):L('Oynat','Play');button.setAttribute('aria-pressed',String(playing));
}
animationMotion.addEventListener('change',e=>{for(const box of document.querySelectorAll('.animation-card')){box.dataset.playing=String(!e.matches);updateAnimationImage(box)}});

document.addEventListener('site-theme-change',()=>{for(const box of document.querySelectorAll('.animation-card')){box.animationAsset=themedAnimationAsset(box.animationRecord);updateAnimationImage(box)}});

// Preserve keyboard focus when an experiment replaces its controls while rendering.
(() => {
 const controlSelector='button[data-act],button[data-extra-act],select,input';
 const enabled=el=>el&&!el.disabled&&el.getAttribute('aria-disabled')!=='true'&&el.tabIndex>=0&&el.getClientRects().length>0;
 function preserveExperimentFocus(event){
  const target=event.target instanceof Element?event.target:null;
  const control=target?.closest(controlSelector);
  const experiment=control?.closest('.experiment');
  if(!experiment?.id||document.activeElement!==control)return;
  if(event.type==='click'&&!control.matches('button[data-act],button[data-extra-act]'))return;
  if(event.type!=='click'&&!control.matches('select,input'))return;
  const identity={id:control.id,act:control.dataset.act,extra:control.dataset.extraAct};
  const original=[...experiment.querySelectorAll(controlSelector)];
  const position=original.indexOf(control);
  // A timer runs after target and bubbling handlers have finished replacing HTML.
  setTimeout(()=>{
   if(control.isConnected)return;
   const active=document.activeElement;
   // Respect focus explicitly moved by another handler or by the user.
   if(active&&active!==document.body&&active!==document.documentElement)return;
   const replacement=document.getElementById(experiment.id);
   if(!replacement)return;
   const controls=[...replacement.querySelectorAll(controlSelector)];
   let next=controls.find(el=>identity.id?el.id===identity.id:identity.act?el.dataset.act===identity.act:identity.extra?el.dataset.extraAct===identity.extra:false);
   if(!enabled(next)){
    // At the end of a trace, prefer a nearby previous/reset action in this lab.
    const pivot=Math.max(0,controls.indexOf(next)>=0?controls.indexOf(next):position);
    next=null;
    for(let distance=1;distance<=controls.length;distance++){
     const before=controls[pivot-distance],after=controls[pivot+distance];
     if(enabled(before)){next=before;break;}
     if(enabled(after)){next=after;break;}
    }
    if(!next)next=controls.find(enabled);
   }
   next?.focus({preventScroll:true});
  },0);
 }
 for(const name of ['click','change','input'])document.addEventListener(name,preserveExperimentFocus,true);
})();

// Restore deep links after the reader replaces its server-rendered sections.
// This fragment shares the reader's DATA and active() bindings.
function restoreStudyHash() {
  if (new URLSearchParams(location.search).has('capture')) return;

  const hash = location.hash;
  let section;
  if (hash === '#footer') {
    section = DATA.slides.length;
  } else {
    const match = /^#s([1-9]\d*)$/.exec(hash);
    if (!match) return;
    section = Number(match[1]);
    if (!Number.isSafeInteger(section) || section > DATA.slides.length) return;
  }

  const target = document.getElementById(hash.slice(1));
  if (!target) return;
  const align = () => {
    if (location.hash !== hash || !target.isConnected) return;
    target.scrollIntoView({ behavior: 'instant', block: 'start' });
    active(section);
  };
  align();

  // A newly inserted illustration above the target can acquire its height
  // after the first alignment. Restore the same anchor once those images load.
  const pending = [...document.querySelectorAll('#sections img')].filter(image =>
    !image.complete && (image.compareDocumentPosition(target) & 4)
  );
  if (pending.length) {
    Promise.all(pending.map(image => image.decode().catch(() => {}))).then(() => {
      requestAnimationFrame(align);
    });
  }
}

window.addEventListener('hashchange', restoreStudyHash);

render();restoreStudyHash();document.body.dataset.studyReady='true';
}catch(error){console.error(error);document.querySelector('#intro').insertAdjacentHTML('beforeend','<p class=boundary>Deney verileri yüklenemedi. Sayfayı yenileyebilirsin. / Experiment data could not load. Please reload.</p>');}
