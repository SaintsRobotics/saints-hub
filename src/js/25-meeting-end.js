/* ---- meeting end = the latest time a mentor said they can stay ---- */
let coAsk=false,aoFail={};
const meetEnd=d=>{let mx='';Object.values(av[d]||{}).forEach(x=>{if(x&&x.to&&x.to>mx)mx=x.to});if(!mx)return 0;const t=new Date(d+'T'+mx+':00').getTime();return isNaN(t)?0:t};
const LATE_MS=3600000;
/* When someone is signed out automatically: at the meeting end, or one hour after they arrived if they arrived after the meeting end. 0 = not automatic. */
const cutOf=(d,t)=>{const e=meetEnd(d);return t&&t.i&&e?(e>=t.i?e:t.i+LATE_MS):0};
const effOut=(d,id)=>{const t=(attT[d]||{})[id]||{};if(t.o)return t.o;const c=cutOf(d,t);return c&&Date.now()>=c?c:0};
const effTimes=d=>{const o={};Object.keys(attT[d]||{}).forEach(i=>{const t=attT[d][i]||{},z=effOut(d,i);o[i]={i:t.i,o:z||undefined}});return o};
function autoOut(){if(screen!='app'||!real||!db)return;const r0=byId(real);if(!r0)return;const tt=attT[TODAY]||{},leader=['mentor','owner','core','admin','lead','captain'].includes(r0.r),now=Date.now(),
ids=(att[TODAY]||[]).filter(i=>{const t=tt[i],c=cutOf(TODAY,t);return t&&t.i&&!t.o&&c&&now>=c&&!aoFail[i]&&(leader||i==real)});if(!ids.length)return;
const up={},was={};ids.forEach(i=>{const c=cutOf(TODAY,tt[i]);up['times.'+i+'.o']=c;tt[i].o=c});updateDoc(doc(db,'attendance',TODAY),up).catch(err=>{console.error(err);ids.forEach(i=>{aoFail[i]=1;if(tt[i])delete tt[i].o});draw(2)});draw(2)}
setInterval(autoOut,30000);setTimeout(autoOut,4000);
const coModal=()=>`<div class="mdbk" role="dialog" aria-modal="true" aria-labelledby="comt"><div class="mdl"><h3 id="comt" style="margin-top:0">Did you fill out your tasks for the day?</h3><p class="mut">Update the status of what you worked on in My tasks before you sign out.</p><div class="mdb"><button class="sel" data-coyes>Yes, sign me out</button><button data-cono>No, take me to my tasks</button></div><p style="margin-bottom:0"><button class="lnk" data-cocancel>Cancel</button></p></div></div>`;
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-coyes],[data-cono],[data-cocancel]');if(!b)return;e.stopPropagation();e.preventDefault();const d=b.dataset;coAsk=false;
if('coyes' in d){if((att[TODAY]||[]).includes(cur))clockOut(cur,false);else draw(1)}
else if('cono' in d){tab='My tasks';render()}
else draw(1)},true);

