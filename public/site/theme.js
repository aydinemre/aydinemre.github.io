const controller=window.__emreTheme;
if(controller){
 const copies={label:['Tema','Theme'],system:['Sistem','System'],light:['Açık','Light'],dark:['Koyu','Dark']};
 function sync(){const en=document.documentElement.lang==='en';document.querySelectorAll('[data-theme-copy]').forEach(el=>el.textContent=copies[el.dataset.themeCopy][en?1:0]);document.querySelectorAll('select[data-theme-choice]').forEach(el=>{el.value=document.documentElement.dataset.themeChoice;el.setAttribute('aria-label',en?'Color theme':'Renk teması')});document.querySelectorAll('[data-theme-controls]').forEach(el=>el.hidden=false)}
 document.querySelectorAll('select[data-theme-choice]').forEach(el=>el.addEventListener('change',()=>{const choice=el.value;try{localStorage.setItem('emre-theme',choice)}catch{}controller.apply(choice);sync()}));
 controller.media.addEventListener('change',()=>{if(document.documentElement.dataset.themeChoice==='system')controller.apply('system')});
 new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});sync();
}
