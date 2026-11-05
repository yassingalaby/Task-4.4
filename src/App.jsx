import React,{useEffect,useMemo,useRef,useState} from 'react';

const STORE='acl-foundboard-v3';
// Fictional campus locations for this standalone teaching demo.
// A found report can exist before the item has been received by staff.
const seed=[
 {id:'f1',title:'Black backpack',category:'accessories',status:'lost',location:'Library - second floor',description:'Black backpack with a small red keychain. Left near the study desks.',owner:'you',created:'Oct 23',emoji:'🎒'},
 {id:'f2',title:'Dark backpack',category:'accessories',status:'found',location:'Library - main stairwell',description:'Found a dark backpack with a small red keychain near the library stairs.',owner:'other',created:'Oct 24',emoji:'🎒',collectionPoint:'Campus Security Desk',handoverStatus:'received'},
 {id:'f3',title:'Student ID card',category:'documents',status:'found',location:'Near Gate 3',description:'A student card was turned in. No personal details are published.',owner:'other',created:'Oct 24',emoji:'🪪',collectionPoint:'Student Services Office',handoverStatus:'received'},
 {id:'f4',title:'Wireless earbuds',category:'electronics',status:'lost',location:'Main cafeteria',description:'White earbuds in a distinctive blue case. Lost on Monday.',owner:'other',created:'Oct 24',emoji:'🎧'},
 {id:'f5',title:'Earbuds in blue case',category:'electronics',status:'found',location:'Cafeteria entrance',description:'White earbuds in a blue charging case found near the coffee counter.',owner:'other',created:'Oct 25',emoji:'🎧',collectionPoint:'',handoverStatus:'reported'},
 {id:'f6',title:'Blue sports bottle',category:'other',status:'lost',location:'Sports Hall - lockers',description:'Tall blue metal water bottle, possibly left after practice.',owner:'other',created:'Oct 25',emoji:'🥤'},
 {id:'f7',title:'Metal water bottle',category:'other',status:'found',location:'Sports Hall - benches',description:'Blue reusable metal bottle found after a basketball session.',owner:'other',created:'Oct 25',emoji:'🥤',collectionPoint:'Campus Security Desk',handoverStatus:'received'},
 {id:'f8',title:'Engineering lab coat',category:'clothing',status:'claimed',location:'Building C',description:'Owner verified the item and collected it from the reception desk.',owner:'you',created:'Oct 22',emoji:'🥼',collectionPoint:'Library Reception',handoverStatus:'released'},
 {id:'f9',title:'Small notebook',category:'other',status:'lost',location:'C7 lecture room',description:'Brown cover with handwritten engineering notes.',owner:'other',created:'Oct 25',emoji:'📒'},
 {id:'f10',title:'Scientific calculator',category:'electronics',status:'lost',location:'B2 lecture hall',description:'Black scientific calculator with a protective cover.',owner:'other',created:'Oct 26',emoji:'🧮'},
 {id:'f11',title:'Calculator',category:'electronics',status:'found',location:'B2 study area',description:'Scientific calculator with a black cover, found on a desk.',owner:'you',created:'Oct 26',emoji:'🧮',collectionPoint:'Library Reception',handoverStatus:'received'},
 {id:'f12',title:'Canvas tote bag',category:'accessories',status:'lost',location:'Main campus bus stop',description:'Beige tote with green writing on one side.',owner:'other',created:'Oct 26',emoji:'👜'},
 {id:'f13',title:'USB flash drive',category:'electronics',status:'found',location:'Building A computer lab',description:'A small black flash drive was found beside a workstation.',owner:'other',created:'Oct 27',emoji:'💾',collectionPoint:'',handoverStatus:'reported'},
];
const categories=['all','electronics','clothing','documents','accessories','other'];
const statuses=['lost','found','claimed'];
// Fictional collection points that appear in the example records.
const collectionPoints=['Campus Security Desk','Student Services Office','Library Reception'];
// Icon for new reports, chosen from the category instead of one generic pin.
const categoryEmoji={electronics:'📱',clothing:'👕',documents:'📄',accessories:'👜',other:'📦'};
const columns=[
  {key:'lost',title:'LOST',sub:'Searching for these things',icon:'↗'},
  {key:'found',title:'FOUND',sub:'Looking for the owners',icon:'⌁'},
  {key:'claimed',title:'CLAIMED',sub:'Back where they belong',icon:'✓'},
];
// holding/point are form-only helpers describing where a found item is now.
const clean={title:'',category:'',status:'',location:'',description:'',holding:'have',point:''};
function getSaved(){try{const s=JSON.parse(localStorage.getItem(STORE));return Array.isArray(s)?s:seed;}catch{return seed;}}
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);

// Once staff have confirmed receipt (or the owner collected it), the finder can no longer rewrite where it is.
const handoverEditable=ex=>!ex||!['received','released'].includes(ex.handoverStatus);
// What each handover state means for someone who is trying to recover an item.
function handoverInfo(item){
  if(item.handoverStatus==='released')return{tone:'done',label:'Collected',text:'The owner collected this item.'};
  if(item.handoverStatus==='received'&&item.collectionPoint)return{tone:'ok',label:'Held by staff',text:`Confirmed at ${item.collectionPoint}. Ownership is verified before it is released.`};
  if(item.handoverStatus==='dropped'&&item.collectionPoint)return{tone:'warn',label:'Not yet confirmed',text:`The finder says it was left at ${item.collectionPoint}. Staff have not confirmed receiving it.`};
  return{tone:'warn',label:'Reported only',text:'Nobody has confirmed this item is at a collection point. Do not assume staff are holding it.'};
}

// Returns an object keyed by field name, so each message can be shown next to
// the control that caused it. An empty object means the form is valid.
// The rules are unchanged from the original single-message validator.
function validate(f,arr,id){
  const errors={};
  if(!f.title.trim()||f.title.trim().length<2)errors.title='Title must be at least 2 characters.';
  if(!categories.slice(1).includes(f.category))errors.category='Choose a category.';
  if(!statuses.includes(f.status))errors.status='Choose lost, found or claimed.';
  if(!errors.title&&arr.some(r=>r.id!==id&&r.title.toLowerCase()===f.title.trim().toLowerCase()&&(r.location||'').toLowerCase()===(f.location||'').trim().toLowerCase()))
    errors.title='An item with the same title has already been reported at this location. Change the title or the location.';
  if(f.status==='found'&&handoverEditable(arr.find(r=>r.id===id))&&f.holding==='dropped'&&!collectionPoints.includes(f.point))
    errors.point='Choose the collection point where you left the item.';
  return errors;
}
// Order matches the visual order of the form so focus lands on the first problem.
const fieldOrder=['title','status','category','point'];

export default function App(){
  const [items,setItems]=useState(getSaved);
  const [page,setPage]=useState('board');
  const [q,setQ]=useState('');
  const [cat,setCat]=useState('all');
  const [filterStatus,setFilterStatus]=useState('all');
  const [current,setCurrent]=useState(null);
  const [form,setForm]=useState(clean);
  const [errors,setErrors]=useState({});
  const [message,setMessage]=useState('');
  const [openMenu,setOpenMenu]=useState(null);
  const resultsRef=useRef(null);

  useEffect(()=>localStorage.setItem(STORE,JSON.stringify(items)),[items]);
  // Opening the form (or returning to the board) always starts at the top of the page.
  useEffect(()=>{window.scrollTo(0,0);},[page]);
  // The options menu closes on outside click or Escape instead of staying open forever.
  useEffect(()=>{
    if(!openMenu)return undefined;
    const onDown=e=>{if(!e.target.closest('.menu-holder'))setOpenMenu(null);};
    const onKey=e=>{if(e.key==='Escape')setOpenMenu(null);};
    document.addEventListener('mousedown',onDown);
    document.addEventListener('keydown',onKey);
    return()=>{document.removeEventListener('mousedown',onDown);document.removeEventListener('keydown',onKey);};
  },[openMenu]);

  // Every word the user types must appear somewhere in the notice, in any order,
  // so "backpack black" finds "Black backpack". Category is searchable too.
  const tokens=useMemo(()=>q.toLowerCase().split(/\s+/).filter(Boolean),[q]);
  const filtered=useMemo(()=>items.filter(x=>{
    if(cat!=='all'&&x.category!==cat)return false;
    if(filterStatus!=='all'&&x.status!==filterStatus)return false;
    const hay=`${x.title} ${x.location} ${x.description} ${x.category}`.toLowerCase();
    return tokens.every(t=>hay.includes(t));
  }),[items,tokens,cat,filterStatus]);
  const filtersActive=tokens.length>0||cat!=='all'||filterStatus!=='all';
  // Which header shortcut matches the current view (null when a custom search/category is active).
  const view=page==='board'&&tokens.length===0&&cat==='all'?filterStatus:null;

  function clearFilters(){setQ('');setCat('all');setFilterStatus('all');}
  // Jump to browsing with a single predefined view, discarding stale search text/category.
  function browse(status){setQ('');setCat('all');setFilterStatus(status);setMessage('');setOpenMenu(null);setPage('board');}
  // From one of the user's own lost reports, show found notices in the same category.
  function findMatches(item){setQ('');setCat(item.category);setFilterStatus('found');setMessage('');}
  // Results already update as the user types; the Search button confirms and brings the results into view.
  function onSearch(e){
    e.preventDefault();
    const el=resultsRef.current;
    if(!el)return;
    const calm=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({behavior:calm?'auto':'smooth',block:'start'});
    el.focus({preventScroll:true});
  }

  function create(){setCurrent(null);setForm({...clean});setErrors({});setOpenMenu(null);setPage('form');}
  function edit(row){
    if(row.owner!=='you')return;
    setCurrent(row.id);
    setForm({title:row.title,category:row.category,status:row.status,location:row.location,description:row.description,holding:row.handoverStatus==='dropped'?'dropped':'have',point:row.handoverStatus==='dropped'?(row.collectionPoint||''):''});
    setOpenMenu(null);setErrors({});setPage('form');
  }
  // Update one field and clear only that field's error once the user starts fixing it.
  function setField(name,value){
    setForm(s=>({...s,[name]:value}));
    setErrors(e=>{if(!e[name])return e;const n={...e};delete n[name];return n;});
  }
  function submit(e){
    e.preventDefault();
    const v=validate(form,items,current);
    if(Object.keys(v).length){
      setErrors(v);
      const first=fieldOrder.find(k=>v[k]);
      // Move focus to the first invalid field so keyboard and screen-reader users land on the problem.
      setTimeout(()=>document.getElementById(`field-${first}`)?.focus(),0);
      return;
    }
    const {holding,point,...fields}=form;
    const existing=current?items.find(x=>x.id===current):null;
    // A finder's claim to have left the item somewhere is stored as 'dropped', never 'received':
    // only staff can confirm receipt. Confirmed/released records are left untouched when editing.
    const handover=handoverEditable(existing)
      ?(form.status==='found'&&holding==='dropped'?{collectionPoint:point,handoverStatus:'dropped'}:{collectionPoint:'',handoverStatus:'reported'})
      :{};
    const d={...fields,title:form.title.trim(),location:form.location.trim(),description:form.description.trim(),owner:'you',created:'Today',emoji:current?existing?.emoji:(categoryEmoji[form.category]||'📌'),...handover};
    if(current){setItems(items.map(x=>x.id===current?{...x,...d}:x));setMessage('Report updated.');}
    else{setItems([{id:`f-${Date.now()}`,...d},...items]);setMessage('Your report has been posted.');}
    // Clear filters so the report the user just saved is actually visible on the board.
    clearFilters();
    setPage('board');setCurrent(null);
  }
  function reset(){setItems(seed);setPage('board');clearFilters();setMessage('Example reports restored.');}

  const chips=[
    tokens.length>0&&{label:`Search: “${q.trim()}”`,clear:()=>setQ('')},
    cat!=='all'&&{label:`Category: ${cap(cat)}`,clear:()=>setCat('all')},
    filterStatus!=='all'&&{label:`Status: ${cap(filterStatus)}`,clear:()=>setFilterStatus('all')},
  ].filter(Boolean);
  const errorList=fieldOrder.filter(k=>errors[k]);
  // Shared props that connect a control to its inline error message.
  const fieldProps=name=>({id:`field-${name}`,'aria-invalid':errors[name]?'true':undefined,'aria-describedby':errors[name]?`error-${name}`:undefined});
  const fieldError=name=>errors[name]&&<span className="field-error" id={`error-${name}`}>{errors[name]}</span>;
  const navClass=key=>`nav-btn${view===key?' is-active':''}`;

  return <div className="notice-app">
  <header className="site-header">
    <div className="header-inner">
      <button onClick={()=>browse('all')} className="wordmark" aria-label="FOUND on campus - back to the noticeboard"><span className="sun" aria-hidden="true">✺</span><span className="wordmark-text">FOUND<span>on campus</span></span></button>
      <nav className="header-links" aria-label="Browse">
        <button className={navClass('all')} aria-current={view==='all'?'page':undefined} onClick={()=>browse('all')}>Noticeboard</button>
        <button className={navClass('lost')} aria-current={view==='lost'?'page':undefined} onClick={()=>browse('lost')}>Missing items</button>
        <button className={navClass('found')} aria-current={view==='found'?'page':undefined} onClick={()=>browse('found')}>Recently found</button>
      </nav>
      <button className="btn btn-accent report-button" onClick={create}>+ Post a report</button>
    </div>
  </header>

  {page==='board'?<main className="page">
    <section className="hero" aria-labelledby="hero-title">
      <p className="eyebrow">Your noticeboard</p>
      <h1 id="hero-title">Lost something? <em>You're in the right place.</em></h1>
      <p className="lead">Browse what the campus community has shared or post what you've lost or found.</p>
      <form className="searchbar" role="search" onSubmit={onSearch}>
        <label className="sr-only" htmlFor="search">Search items</label>
        <span className="search-icon" aria-hidden="true">🔍</span>
        <input id="search" type="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="What are you looking for? e.g. black backpack" autoComplete="off"/>
        <button type="submit" className="btn btn-primary btn-lg search-button">Search</button>
      </form>
      <div className="filter-row">
        <label>Item category<select id="filter-category" value={cat} onChange={e=>setCat(e.target.value)}><option value="all">All categories</option>{categories.slice(1).map(c=><option key={c} value={c}>{cap(c)}</option>)}</select></label>
        <label>Report status<select id="filter-status" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}><option value="all">All statuses</option>{statuses.map(s=><option key={s} value={s}>{cap(s)}</option>)}</select></label>
        <button className="btn btn-light clear-button" onClick={clearFilters}>Clear filters</button>
      </div>
      <p className="steps"><span>SEARCH</span> • <span>DISCOVER</span> • <span>REUNITE</span><i>Helping lost things find their way back.</i></p>
    </section>

    <section className="cta-band" aria-label="Post a report">
      <span className="cta-pin" aria-hidden="true">📍</span>
      <div><strong>Lost or found something?</strong><p>Every report gets us a little closer.</p></div>
      <button className="btn btn-accent btn-lg share-button" onClick={create}>Share your report →</button>
    </section>

    <section className="board" aria-label="Notices">
      <div className="board-top"><div><p className="eyebrow dark">Campus community</p><h2 ref={resultsRef} tabIndex={-1}>Latest notices <span>({filtered.length})</span></h2></div><span className="time-note">Updated today</span></div>
      {message&&<div className="message" role="status"><span>{message}</span><button className="message-close" onClick={()=>setMessage('')} aria-label="Dismiss message">✕</button></div>}
      <div className="result-bar"><p className="result-summary" role="status" aria-live="polite">{filtered.length===1?'1 notice':`${filtered.length} notices`}{filtersActive?' match your search and filters':' on the noticeboard'}</p>{chips.length>0&&<ul className="chips">{chips.map(ch=><li key={ch.label}><button onClick={ch.clear} aria-label={`Remove filter ${ch.label}`}>{ch.label} <span aria-hidden="true">✕</span></button></li>)}</ul>}</div>
      {filtered.length===0?<div className="no-results"><strong>No notices match{tokens.length>0?` “${q.trim()}”`:' these filters'}.</strong><p>Try fewer or different words, or remove a filter. If you still can't find it, post a report so someone can match it with theirs.</p><div className="no-results-actions">{filtersActive&&<button className="btn btn-light" onClick={clearFilters}>Clear filters</button>}<button className="btn btn-accent" onClick={create}>+ Post a report</button></div></div>
      :<div className="board-grid">{columns.map(col=>{
        const rows=filtered.filter(r=>r.status===col.key);
        return <div className={`board-column col-${col.key}`} key={col.key}>
          <div className="column-head"><span className={'col-icon '+col.key} aria-hidden="true">{col.icon}</span><div><strong>{col.title}</strong><small>{col.sub}</small></div><span className="col-count">{rows.length}</span></div>
          <div className="sticky-list">
            {rows.map(item=><article className={`sticky card-${item.status}`} key={item.id}>
              <div className="sticky-top">
                <span className="badge">{item.category}</span>
                <div className="menu-holder">
                  <button className="menu" aria-haspopup="true" aria-expanded={openMenu===item.id} onClick={()=>setOpenMenu(openMenu===item.id?null:item.id)} aria-label={`Options for ${item.title}`}><span aria-hidden="true">···</span> Options</button>
                  {openMenu===item.id&&<div className="menu-popup">{item.owner==='you'?<button onClick={()=>edit(item)}>Edit your report</button>:<span>Reported by another student</span>}</div>}
                </div>
              </div>
              <div className="sticky-emoji" aria-hidden="true">{item.emoji}</div>
              <h3>{item.title}</h3>
              <p>{item.description||'No additional description.'}</p>
              {item.status==='lost'&&item.owner==='you'&&<button className="match-button" onClick={()=>findMatches(item)}>Find possible matches</button>}
              {item.status!=='lost'&&(()=>{const h=handoverInfo(item);return <div className={`handover-note ${h.tone}`}><strong>{h.label}</strong> {h.text}</div>;})()}
              <div className="sticky-bottom"><span>📍 {item.location||'Location not provided'}</span><small>{item.created}</small></div>
            </article>)}
            {rows.length===0&&<div className="empty-column">Nothing here yet</div>}
          </div>
        </div>;})}
      </div>}
      <div className="board-tools"><button className="btn btn-light reset" onClick={reset}>Reset demo data</button><span>Restores the example reports and clears your changes.</span></div>
    </section>
  </main>:<main className="page report-page">
    <div className="crumbs"><button className="btn btn-light btn-sm" onClick={()=>setPage('board')}>← Noticeboard</button><span aria-hidden="true">/</span><span>Report an item</span></div>
    <div className="report-layout">
      <div className="report-intro"><span className="seal" aria-hidden="true">✺</span><p className="eyebrow dark">Help the community</p><h1>{current?'Update your report':'Tell us what happened.'}</h1><p>Small details can help someone recognize their belongings.</p><div className="paper-note">Your report will appear on the public campus noticeboard with the details you provide.</div></div>
      <section className="form-paper"><header><p>NEW NOTICE / FORM 01</p><h2>{current?'Edit report':'Report an item'}</h2></header>
      <form className="report-form" onSubmit={submit} noValidate>
        {errorList.length>0&&<div className="form-error" role="alert"><strong>{errorList.length===1?'1 problem needs fixing:':`${errorList.length} problems need fixing:`}</strong><ul>{errorList.map(k=><li key={k}><a href={`#field-${k}`} onClick={ev=>{ev.preventDefault();document.getElementById(`field-${k}`)?.focus();}}>{errors[k]}</a></li>)}</ul></div>}
        <label><span>Item title <b>*</b></span><input {...fieldProps('title')} value={form.title} onChange={e=>setField('title',e.target.value)} placeholder="e.g., Black backpack"/>{fieldError('title')}</label>
        <label><span>Status <b>*</b></span><select {...fieldProps('status')} value={form.status} onChange={e=>setField('status',e.target.value)}><option value="">Choose one</option>{statuses.map(s=><option key={s} value={s}>{cap(s)}</option>)}</select>{fieldError('status')}</label>
        <label><span>Category <b>*</b></span><select {...fieldProps('category')} value={form.category} onChange={e=>setField('category',e.target.value)}><option value="">Select item category</option>{categories.slice(1).map(s=><option key={s} value={s}>{cap(s)}</option>)}</select>{fieldError('category')}</label>
        {form.status==='found'&&(handoverEditable(current?items.find(x=>x.id===current):null)
          ?<fieldset className="handover-fieldset"><legend>Where is the item now?</legend>
            <label className="radio"><input type="radio" name="holding" checked={form.holding==='have'} onChange={()=>setField('holding','have')}/><span>I still have it<small>It will be shown as “Reported only”.</small></span></label>
            <label className="radio"><input type="radio" name="holding" checked={form.holding==='dropped'} onChange={()=>setField('holding','dropped')}/><span>I left it at a collection point<small>Shown as “Not yet confirmed” until staff confirm they received it.</small></span></label>
            {form.holding==='dropped'&&<label><span>Collection point <b>*</b></span><select {...fieldProps('point')} value={form.point} onChange={e=>setField('point',e.target.value)}><option value="">Choose a collection point</option>{collectionPoints.map(p=><option key={p} value={p}>{p}</option>)}</select>{fieldError('point')}</label>}
          </fieldset>
          :<div className="handover-locked">Staff have already handled this item, so where it is held can no longer be changed here.</div>)}
        <label><span>Last known location</span><input value={form.location} onChange={e=>setField('location',e.target.value)} placeholder="Location (optional)"/></label>
        <label><span>More details</span><textarea rows="6" value={form.description} onChange={e=>setField('description',e.target.value)} placeholder="Describe your item"/></label>
        <div className="form-actions"><button type="button" className="btn btn-light" onClick={()=>setPage('board')}>Go back</button><button className="btn btn-accent btn-lg" type="submit">{current?'Save report':'Publish notice'}</button></div>
      </form></section>
    </div>
  </main>}
  <footer className="pagefooter"><span>FOUND / Campus noticeboard</span><span>Community project • Demo only</span></footer>
  </div>;
}
