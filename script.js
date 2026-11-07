(function(){
var DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],ORDER=[1,2,3,4,5,6,0];
var S={profile:{},subjects:[],tasks:[],tt:[],sems:[],study:{}},TAB="home",ready=false;
var $=function(i){return document.getElementById(i)};
function e(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function p2(n){return(n<10?"0":"")+n}
function mins(t){var a=String(t||"00:00").split(":");return (+a[0])*60+(+a[1])}
function fmt(t){var m=mins(t),h=Math.floor(m/60);return(h%12||12)+":"+p2(m%60)+(h<12?" am":" pm")}
function key(d){return d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate())}
function gp(m){return m>=90?10:m>=80?9:m>=70?8:m>=60?7:m>=50?6:m>=45?5:m>=40?4:0}
var sb=window.supabase?window.supabase.createClient("https://qothjbzgvfthqbiccvxg.supabase.co","sb_publishable_XEqjgo-RbcarC818fwkvag_GQx-tpn-"):null, UID=null;
function save(k){
  if(!sb || !UID){banner("Changes cannot sync: not signed in.");return;}
  sb.from("student_data").upsert({user_id:UID,key:k,value:S[k]},{onConflict:"user_id,key"})
    .then(function(r){if(r.error){console.error("Save error:",r.error);banner("Could not save changes. Check database permissions and connection.");}});
}
function banner(t){$("banner").innerHTML=t?'<div class="banner">'+e(t)+'</div>':""}
function sgpa(){var c=0,s=0;S.subjects.forEach(function(x){if(x.marks!=null&&x.marks!==""){c+=+x.credits;s+=+x.credits*gp(+x.marks)}});return c?s/c:null}
function cgpa(){var c=0,s=0;S.sems.forEach(function(x){c+=+x.credits;s+=+x.sgpa*+x.credits});return c?s/c:null}
function att(x){return x.total?x.att/x.total*100:null}
function overall(){var a=0,t=0;S.subjects.forEach(function(x){a+=+x.att;t+=+x.total});return t?a/t*100:null}
function attNote(x){var a=+x.att,t=+x.total;if(!t)return"No classes logged";var p=a/t;
  if(p<.75)return"Attend next "+Math.ceil((.75*t-a)/.25)+" classes to reach 75%";
  var k=Math.floor(a/.75-t);return k>0?"Can miss "+k+" and stay above 75%":"On the 75% line"}

/* ---------- views ---------- */
function weekStudy(){var t=0,now=new Date(),o=[];for(var i=6;i>=0;i--){var d=new Date(now);d.setDate(now.getDate()-i);var v=S.study[key(d)]||0;t+=v;o.push([DAYS[d.getDay()].slice(0,3),v,i===0])}return{days:o,total:t}}
function home(){
  var sg=sgpa(),cg=cgpa(),ov=overall(),w=weekStudy(),mx=Math.max.apply(null,w.days.map(function(d){return d[1]}).concat([2]));
  var low=S.subjects.filter(function(x){var p=att(x);return p!==null&&p<75});
  var up=S.tasks.filter(function(t){return!t.x}).sort(function(a,b){return String(a.d).localeCompare(String(b.d))}).slice(0,5);
  return '<div class="grid">'+
  '<section class="card next s5"><h2>Next class</h2><div id="nName" style="font-size:1.25rem;font-weight:600">—</div><div class="mute" id="nMeta" style="margin-bottom:10px"></div><div class="big" id="cd">–</div></section>'+
  '<section class="card s7"><h2>Today</h2><div id="today"></div></section>'+
  '<section class="card s6"><h2>Academics</h2><div class="stats"><div><b>'+(sg==null?"–":sg.toFixed(2))+'</b><span class="mute sm">This semester SGPA</span></div><div><b>'+(cg==null?"–":cg.toFixed(2))+'</b><span class="mute sm">CGPA</span></div><div><b>'+(ov==null?"–":ov.toFixed(0)+"%")+'</b><span class="mute sm">Attendance</span></div></div>'+
   (low.length?'<p style="margin:12px 0 0"><span class="tag bad">Below 75%</span> '+low.map(function(x){return e(x.name)}).join(", ")+'</p>':'')+'</section>'+
  '<section class="card s6"><h2>Study hours, last 7 days</h2><div class="bars">'+w.days.map(function(d){return'<div class="'+(d[2]?'td':'')+'"><span>'+d[1].toFixed(1)+'</span><i style="height:'+(d[1]/mx*75)+'px"></i>'+d[0]+'</div>'}).join("")+'</div><p class="mute sm" style="margin:8px 0 0">Total '+w.total.toFixed(1)+' h</p></section>'+
  '<section class="card s5"><h2>Focus timer</h2><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div class="big" id="tm">25:00</div><button data-a="tgo" id="tgo">Start</button><button class="ghost" data-a="trs">Reset</button></div><p class="mute sm" style="margin:8px 0 0">Each finished 25 minute session is saved to today.</p></section>'+
  '<section class="card s7"><h2>Upcoming deadlines</h2>'+(up.length?up.map(taskRow).join(""):'<div class="empty">Nothing pending. Add work in the Tasks tab.</div>')+'</section></div>';
}
function dueTag(t){if(!t.d)return"";var parts=t.d.split("-").map(Number),due=new Date(parts[0],parts[1]-1,parts[2]),today=new Date();today.setHours(0,0,0,0);var n=Math.round((due-today)/864e5);
  return'<span class="tag'+(!t.x&&n<=1?' soon':'')+'">'+(n<0?"Overdue":n===0?"Due today":n===1?"Due tomorrow":"Due in "+n+" days")+'</span>'}
function taskRow(t){var i=S.tasks.indexOf(t);return'<div class="task'+(t.x?' done':'')+'"><input type="checkbox" data-a="tk" data-i="'+i+'"'+(t.x?' checked':'')+' aria-label="Done"><span class="n">'+e(t.n)+'</span><span class="tag">'+e(t.type)+'</span>'+dueTag(t)+'<button class="ghost sm" style="margin-left:auto" data-a="tdel" data-i="'+i+'" aria-label="Remove">✕</button></div>'}
function subjects(){
  return'<div class="card"><h2>Subjects, marks and attendance</h2><div class="form"><input id="sn" placeholder="Subject (e.g. Data Structures)"><input id="sc" placeholder="Code (CS201)" style="flex:0 1 110px"><input id="sk" type="number" min="1" max="6" placeholder="Credits" style="flex:0 1 90px"><button data-a="sadd">Add subject</button><button class="ghost" data-a="sample">Load sample data</button></div>'+
  (S.subjects.length?S.subjects.map(function(x,i){var p=att(x);
   return'<div class="subj"><div><b>'+e(x.name)+'</b><div class="mute sm">'+e(x.code)+' · '+e(x.credits)+' credits</div></div>'+
   '<div><label class="mute sm">Marks %</label><input type="number" min="0" max="100" value="'+e(x.marks)+'" data-a="mk" data-i="'+i+'"></div>'+
   '<div class="mute sm">Grade point<br><b style="color:var(--ink);font-size:1.2rem">'+(x.marks===""||x.marks==null?"–":gp(+x.marks))+'</b></div>'+
   '<div><div style="display:flex;gap:8px;align-items:center"><div class="track" style="flex:1"><div class="fill'+(p!==null&&p<75?' low':'')+'" style="width:'+(p||0)+'%"></div></div><b>'+(p==null?"–":p.toFixed(0)+"%")+'</b></div><div class="mute sm">'+x.att+' / '+x.total+' · '+attNote(x)+'</div></div>'+
   '<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="sm" data-a="pres" data-i="'+i+'">Present</button><button class="ghost sm" data-a="abs" data-i="'+i+'">Absent</button><button class="ghost sm" data-a="sdel" data-i="'+i+'" aria-label="Remove subject">✕</button></div></div>'}).join(""):'<div class="empty">No subjects yet. Add one above, or load sample data to explore.</div>')+'</div>';
}
function timetable(){
  return'<div class="card"><h2>Weekly timetable</h2><div class="form"><select id="td">'+ORDER.map(function(d){return'<option value="'+d+'">'+DAYS[d]+'</option>'}).join("")+'</select><input id="ts" type="time" value="09:00" style="flex:0 1 120px"><input id="te" type="time" value="10:00" style="flex:0 1 120px"><input id="tn" placeholder="Subject"><input id="tr" placeholder="Room / Lab" style="flex:0 1 130px"><button data-a="ttadd">Add slot</button></div>'+
  ORDER.map(function(d){var l=S.tt.map(function(x,i){return{x:x,i:i}}).filter(function(o){return+o.x.day===d}).sort(function(a,b){return a.x.s.localeCompare(b.x.s)});if(!l.length)return"";
   return'<h2 style="margin-top:14px">'+DAYS[d]+'</h2>'+l.map(function(o){return'<div class="row"><div>'+e(o.x.n)+' <span class="mute sm">'+e(o.x.r)+'</span></div><div class="t">'+fmt(o.x.s)+' – '+fmt(o.x.e)+' <button class="ghost sm" data-a="ttdel" data-i="'+o.i+'" aria-label="Remove slot">✕</button></div></div>'}).join("")}).join("")+
  (S.tt.length?"":'<div class="empty">No classes yet. Add your first slot above.</div>')+'</div>';
}
function tasks(){
  return'<div class="card"><h2>Assignments, labs and exams</h2><div class="form"><input id="kn" placeholder="e.g. DBMS lab record"><select id="kt"><option>Assignment</option><option>Lab</option><option>Exam</option><option>Project</option></select><input id="kd" type="date" style="flex:0 1 150px"><button data-a="kadd">Add</button></div>'+
  (S.tasks.length?S.tasks.slice().sort(function(a,b){return(a.x-b.x)||String(a.d).localeCompare(String(b.d))}).map(taskRow).join(""):'<div class="empty">Nothing here yet. Add your first deadline above.</div>')+'</div>';
}
function results(){var sg=sgpa(),cg=cgpa();
  return'<div class="grid"><section class="card s5"><h2>Result summary</h2><div class="stats"><div><b>'+(sg==null?"–":sg.toFixed(2))+'</b><span class="mute sm">Current SGPA (estimate)</span></div><div><b>'+(cg==null?"–":cg.toFixed(2))+'</b><span class="mute sm">CGPA, completed semesters</span></div></div><p class="mute sm">Uses the 10 point scale: 90+ = 10, 80+ = 9, 70+ = 8, 60+ = 7, 50+ = 6, 45+ = 5, 40+ = 4. Check your university scale and adjust if it differs.</p></section>'+
  '<section class="card s7"><h2>Completed semesters</h2><div class="form"><input id="rs" type="number" min="1" max="8" placeholder="Sem" style="flex:0 1 80px"><input id="rg" type="number" step="0.01" min="0" max="10" placeholder="SGPA"><input id="rc" type="number" min="1" placeholder="Total credits"><button data-a="radd">Save</button></div>'+
  (S.sems.length?S.sems.slice().sort(function(a,b){return a.sem-b.sem}).map(function(x){var i=S.sems.indexOf(x);return'<div class="row"><div>Semester '+e(x.sem)+'</div><div class="t">SGPA '+(+x.sgpa).toFixed(2)+' · '+e(x.credits)+' credits <button class="ghost sm" data-a="rdel" data-i="'+i+'" aria-label="Remove">✕</button></div></div>'}).join(""):'<div class="empty">Add each finished semester to track CGPA.</div>')+'</section></div>';
}
var TABS=[["home","Overview",home],["subj","Subjects",subjects],["tt","Timetable",timetable],["tasks","Tasks",tasks],["res","Results",results]];
function render(){
  var p=S.profile;
  $("who").textContent=p.name?(p.name+(p.branch?" · "+p.branch:"")+(p.sem?" · Semester "+p.sem:"")):"";
  $("nav").innerHTML=TABS.map(function(t){return'<button class="'+(t[0]===TAB?'on':'')+'" data-a="tab" data-t="'+t[0]+'">'+t[1]+'</button>'}).join("")+'<button class="ghost" data-a="prof">Edit profile</button>';
  if(!ready){$("view").innerHTML='<div class="card"><div class="empty">Loading your data…</div></div>';return}
  if(!p.name&&TAB!=="prof"){TAB="prof"}
  if(TAB==="prof"){$("view").innerHTML='<div class="card"><h2>Your profile</h2><div class="form"><input id="pn" placeholder="Name" value="'+e(p.name)+'"><input id="pb" placeholder="Branch (e.g. Computer Engg.)" value="'+e(p.branch)+'"><input id="ps" type="number" min="1" max="8" placeholder="Semester" value="'+e(p.sem)+'" style="flex:0 1 110px"><button data-a="psave">Save profile</button></div></div>';return}
  for(var i=0;i<TABS.length;i++)if(TABS[i][0]===TAB){$("view").innerHTML=TABS[i][2]();break}
  tick();if(TAB==="home")drawT();
}

/* ---------- live clock ---------- */
function tick(){
  var d=new Date(),h=d.getHours(),now=h*60+d.getMinutes();
  $("clock").textContent=p2(h)+":"+p2(d.getMinutes())+":"+p2(d.getSeconds());
  $("date").textContent=DAYS[d.getDay()]+", "+d.toLocaleDateString(undefined,{day:"numeric",month:"long",year:"numeric"});
  $("hello").textContent=(h<12?"Good morning":h<18?"Good afternoon":"Good evening")+(S.profile.name?", "+S.profile.name.split(" ")[0]:"");
  if(TAB!=="home"||!$("today"))return;
  var l=S.tt.filter(function(x){return+x.day===d.getDay()}).sort(function(a,b){return a.s.localeCompare(b.s)}),nx=null,html="";
  l.forEach(function(c){var cur=now>=mins(c.s)&&now<mins(c.e);if(!nx&&now<mins(c.e))nx=c;
    html+='<div class="row"><div'+(cur?' style="font-weight:600"':'')+'>'+e(c.n)+' <span class="mute sm">'+e(c.r)+'</span></div><div class="t">'+(cur?'In progress · ':'')+fmt(c.s)+' – '+fmt(c.e)+'</div></div>'});
  $("today").innerHTML=html||'<div class="empty">'+(S.tt.length?"No classes today.":"Add your timetable to see today's classes here.")+'</div>';
  if(nx){var cur=now>=mins(nx.s),sec=(cur?mins(nx.e):mins(nx.s))*60-(now*60+d.getSeconds());
    $("nName").textContent=nx.n;$("nMeta").textContent=(nx.r||"")+" · "+(cur?"ends in":"starts in");
    $("cd").textContent=(sec>=3600?Math.floor(sec/3600)+"h ":"")+p2(Math.floor(sec%3600/60))+"m "+p2(sec%60)+"s"}
  else{$("nName").textContent=l.length?"Classes are done":"No class scheduled";$("nMeta").textContent="";$("cd").textContent="–"}
}
setInterval(tick,1000);

/* ---------- focus timer ---------- */
var LEN=1500,left=LEN,iv=null,timerEnd=0;
function drawT(){var t=$("tm");if(t)t.textContent=p2(Math.floor(left/60))+":"+p2(left%60);var g=$("tgo");if(g)g.textContent=iv?"Pause":(left<LEN?"Resume":"Start")}

/* ---------- actions ---------- */
function num(id){return $(id).value.trim()}
var A={
 tab:function(el){TAB=el.dataset.t;render()},
 prof:function(){TAB="prof";render()},
 psave:function(){var n=num("pn");if(!n)return;S.profile={name:n,branch:num("pb"),sem:num("ps")};save("profile");TAB="home";render()},
 sadd:function(){var n=num("sn"),c=+num("sk")||3;if(!n)return;S.subjects.push({name:n,code:num("sc"),credits:c,marks:"",att:0,total:0});save("subjects");render()},
 sdel:function(el){S.subjects.splice(+el.dataset.i,1);save("subjects");render()},
 pres:function(el){var x=S.subjects[+el.dataset.i];x.att++;x.total++;save("subjects");render()},
 abs:function(el){S.subjects[+el.dataset.i].total++;save("subjects");render()},
 ttadd:function(){var n=num("tn");if(!n||!num("ts")||!num("te"))return;S.tt.push({day:num("td"),s:num("ts"),e:num("te"),n:n,r:num("tr")});save("tt");render()},
 ttdel:function(el){S.tt.splice(+el.dataset.i,1);save("tt");render()},
 kadd:function(){var n=num("kn");if(!n)return;S.tasks.push({n:n,type:num("kt"),d:num("kd")||null,x:false});save("tasks");render()},
 tdel:function(el){S.tasks.splice(+el.dataset.i,1);save("tasks");render()},
 tk:function(el){S.tasks[+el.dataset.i].x=el.checked;save("tasks");render()},
 radd:function(){var a=num("rs"),g=num("rg"),c=num("rc");if(!a||!g||!c)return;S.sems=S.sems.filter(function(x){return String(x.sem)!==a});S.sems.push({sem:a,sgpa:g,credits:c});save("sems");render()},
 rdel:function(el){S.sems.splice(+el.dataset.i,1);save("sems");render()},
 sample:function(){
  S.subjects=[["Data Structures","CS201",4,82,31,36],["Digital Electronics","EC203",3,74,22,32],["Engineering Maths III","MA201",4,68,24,34],["DBMS","CS205",3,88,28,33],["Object Oriented Programming","CS207",3,91,30,34]].map(function(a){return{name:a[0],code:a[1],credits:a[2],marks:a[3],att:a[4],total:a[5]}});
  S.tt=[[1,"09:00","10:00","Data Structures","Room 204"],[1,"10:15","11:15","DBMS","Room 110"],[2,"09:00","10:30","Digital Electronics","Lab 2"],[3,"09:00","10:00","Engineering Maths III","Room 305"],[4,"11:00","12:00","OOP","Room 12"],[5,"09:00","10:00","Data Structures","Room 204"]].map(function(a){return{day:a[0],s:a[1],e:a[2],n:a[3],r:a[4]}});
  var d=function(n){var x=new Date();x.setDate(x.getDate()+n);return key(x)};
  S.tasks=[{n:"DSA assignment 3",type:"Assignment",d:d(2),x:false},{n:"DBMS lab record",type:"Lab",d:d(5),x:false},{n:"Maths mid-sem",type:"Exam",d:d(9),x:false}];
  S.sems=[{sem:"1",sgpa:"8.1",credits:"22"},{sem:"2",sgpa:"8.4",credits:"24"}];
  ["subjects","tt","tasks","sems"].forEach(save);render()},
 tgo:function(){if(iv){clearInterval(iv);iv=null;drawT();return}
  iv=setInterval(function(){left--;drawT();if(left<=0){clearInterval(iv);iv=null;left=LEN;var k=key(new Date());S.study[k]=(S.study[k]||0)+LEN/3600;save("study");render()}},1000);drawT()},
 trs:function(){clearInterval(iv);iv=null;left=LEN;drawT()}
};
document.addEventListener("click",function(ev){var el=ev.target.closest("[data-a]");if(!el||el.tagName==="INPUT")return;var f=A[el.dataset.a];if(f)f(el)});
document.addEventListener("change",function(ev){var el=ev.target;if(el.dataset&&el.dataset.a==="tk")A.tk(el);
  if(el.dataset&&el.dataset.a==="mk"){var v=el.value;S.subjects[+el.dataset.i].marks=v===""?"":Math.max(0,Math.min(100,+v));save("subjects");render()}});

/* ---------- database connection ---------- */
render();
(async function(){
  try{
    var ses=(await sb.auth.getSession()).data.session;
    if(!ses){
      var em=prompt("Email"),pw=prompt("Password (at least 6 characters)");
      var r=await sb.auth.signInWithPassword({email:em,password:pw});
      if(r.error)r=await sb.auth.signUp({email:em,password:pw});
      if(r.error)throw r.error;
      ses=r.data.session;
    }
    UID=ses.user.id;
    var q=await sb.from("student_data").select("key,value");
    (q.data||[]).forEach(function(row){S[row.key]=row.value});
  }catch(x){banner("WELCOME TO STUDENT DASHBOARD.")}
  ready=true;render();
})();
})();
