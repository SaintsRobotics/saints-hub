/* ---- Owner only: remove a person from the site ---- */
let rmId='',rmStep=0,rmMsg='',rmBusy=false;
function rmBox(){const m=me();if(m.r!='owner'||cur!=real)return '';const ppl=people.filter(p=>p.id!=real&&p.r!='owner'&&p.ti!='Head mentor').sort((a,b)=>a.n.localeCompare(b.n)),t=byId(rmId);
return `<section><h3>Remove a person</h3><p class="mut">Takes someone off the site for good. They are taken off tasks, check-in records, CAD groups, Stand-up items and notifications, and their login stops working for the site. The history log keeps the words that were already written there, and their sign-in account must also be deleted in Firebase (Authentication, Users) to be fully gone.</p>`+
(rmStep==0?`<div class="row"><select id="rmwho" aria-label="Person to remove"><option value="">Choose a person</option>${ppl.map(p=>`<option value="${p.id}" ${rmId==p.id?'selected':''}>${esc(p.n)} (${esc(label(p))})</option>`).join('')}</select><button data-rm0>Remove this person</button></div>`:
`<div class="card"><p><b>Remove ${esc(t?t.n:'this person')} for good?</b> This cannot be undone. Their tasks become unassigned and their check-in records are deleted. Type your own PIN to confirm.</p><label>Your PIN <input type="password" id="rmpin" autocomplete="current-password" ${rmBusy?'disabled':''}></label> <button class="sel" data-rm1 ${rmBusy?'disabled':''}>Remove for good</button> <button data-rmx ${rmBusy?'disabled':''}>Cancel</button></div>`)+(rmMsg?`<p><b>${esc(rmMsg)}</b></p>`:'')+`</section>`}
document.addEventListener('click',async e=>{const b=e.target.closest&&e.target.closest('[data-rm0],[data-rm1],[data-rmx]');if(!b)return;e.stopPropagation();e.preventDefault();const d=b.dataset,R=byId(real);if(!R||R.r!='owner'||cur!=real||rmBusy)return;okmsg='';msg='';
if('rmx' in d){rmStep=0;rmId='';rmMsg='';draw(1);return}
if('rm0' in d){const id=($('#rmwho')||{}).value||'',p=byId(id);if(!p||p.id==real||p.r=='owner'||p.ti=='Head mentor'){rmMsg='Choose a person first.';draw(1);return}rmId=id;rmStep=1;rmMsg='';draw(1);return}
const id=rmId,t=byId(id),pin=($('#rmpin')||{}).value||'';if(!t||t.id==real||t.r=='owner'||t.ti=='Head mentor'){rmStep=0;draw(1);return}
if(!pin){rmMsg='Type your own PIN to continue.';draw(1);return}
rmBusy=true;rmMsg='Checking your PIN...';draw(1);
try{await reauthenticateWithCredential(auth.currentUser,EmailAuthProvider.credential(auth.currentUser.email,pin));await auth.currentUser.getIdToken(true)}
catch(err){rmBusy=false;rmMsg=err.code=='auth/too-many-requests'?'Too many tries. Wait a few minutes. Nobody was removed.':'That PIN is not right. Nobody was removed.';draw(1);return}
rmMsg='Removing '+t.n+'. Do not close this page...';draw(1);
const nm=t.n,bad=[],tr=async(what,f)=>{try{await f()}catch(err){console.error(what,err);bad.push(what)}};
for(const k of tasks.filter(k=>k.who==id))await tr('a task',()=>updateDoc(doc(db,'tasks',k.id),{who:''}));
for(const k of tasks.filter(k=>k.who!=id&&(k.helpMap||{})[id]!==undefined))await tr('a help request',()=>updateDoc(doc(db,'tasks',k.id),{['helpMap.'+id]:deleteField()}));
for(const dd of Object.keys(att).filter(x=>(att[x]||[]).includes(id)||((attT[x]||{})[id])))await tr('check-in records',()=>updateDoc(doc(db,'attendance',dd),{present:arrayRemove(id),['times.'+id]:deleteField()}));
for(const s of cad.filter(s=>(s.mem||[]).includes(id)||((s.ans||{})[id])))await tr('a CAD group',()=>updateDoc(doc(db,'cadsub',s.id),{mem:arrayRemove(id),['ans.'+id]:deleteField()}));
for(const i of retro.ai.filter(i=>i.claim==id))await tr('a Stand-up item',()=>updateDoc(doc(db,'ritems',i.id),{claim:'',did:'',didOn:''}));
for(const dd of Object.keys(av).filter(x=>av[x]&&av[x][id]!==undefined))await tr('mentor availability',()=>updateDoc(doc(db,'avail',dd),{[id]:deleteField()}));
await tr('notifications',async()=>{const s=await getDocs(query(collection(db,'notes'),where('to','==',id)));for(const x of s.docs)await deleteDoc(x.ref)});
await tr('the username',async()=>{const s=await getDocs(query(collection(db,'usernames'),where('uid','==',id)));for(const x of s.docs)await deleteDoc(x.ref)});
let gone=false;await tr('the person record',async()=>{await deleteDoc(doc(db,'users',id));gone=true});
rmBusy=false;
if(gone){rmStep=0;rmId='';rmMsg='';okmsg=nm+' was removed from the site.'+(bad.length?' These could not be cleaned up: '+[...new Set(bad)].join(', ')+'.':'')+' Last step: delete their sign-in account in Firebase, under Authentication, Users.';secEv('Removed a person from the site',{n:nm});ev('Removed '+nm+' from the site')}
else rmMsg='Could not remove '+nm+'. Some of their records may already be cleaned up. Press Remove again to finish.';
draw(1)},true);
