import { useState, useEffect, useRef } from "react";

const MASTER_KEY = "DARKTRUTH9X4K";

function generateKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let k = "";
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) k += chars[Math.floor(Math.random() * chars.length)];
    if (i < 3) k += "-";
  }
  return k;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + "B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + "KB";
  return (bytes / 1048576).toFixed(1) + "MB";
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
  if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago";
  return Math.floor(diff / 86400000) + "d ago";
}

const STORE_KEY = "truths_data_v2";

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        currentKey: parsed.currentKey || MASTER_KEY,
        photos: parsed.photos || [],
        videos: parsed.videos || [],
        files: parsed.files || [],
        chat: parsed.chat || [],
      };
    }
  } catch(e) {}
  return { currentKey: MASTER_KEY, photos: [], videos: [], files: [], chat: [] };
}

function saveStore(data) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch(e) {}
}

function normalize(s) {
  return (s || "").toUpperCase().replace(/[\s\-]/g, "");
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Crimson+Pro:wght@300;400;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#0a0806;color:#f0ebe0;font-family:'Crimson Pro',serif;font-size:17px;min-height:100vh;}
  :root{
    --bg:#0a0806;--smoke:#1c1712;--border:#2e2820;--gold:#c9a84c;--gold-dim:#7a6228;
    --red:#8b1a1a;--red-bright:#c0392b;--parchment:#f0ebe0;--muted:#706050;--faint:#403830;
  }
  .root{min-height:100vh;background:var(--bg);position:relative;overflow-x:hidden;}
  .root::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 20% 0%,rgba(201,168,76,0.04),transparent 60%),radial-gradient(ellipse at 80% 100%,rgba(139,26,26,0.05),transparent 60%);pointer-events:none;z-index:0;}

  /* AGE GATE */
  .age-gate{position:fixed;inset:0;background:#060402;display:flex;align-items:center;justify-content:center;z-index:200;flex-direction:column;text-align:center;padding:2rem;}
  .age-seal{width:100px;height:100px;border:2px solid var(--red);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2.6rem;margin:0 auto 2rem;color:var(--red);animation:pulsered 2.5s ease infinite;}
  @keyframes pulsered{0%,100%{box-shadow:0 0 30px rgba(139,26,26,0.3)}50%{box-shadow:0 0 60px rgba(192,57,43,0.6)}}
  .age-title{font-family:'Playfair Display',serif;font-size:2rem;margin-bottom:.5rem;letter-spacing:.1em;}
  .age-sub{color:var(--muted);font-size:.95rem;max-width:300px;line-height:1.7;margin-bottom:1.5rem;}
  .age-warn{color:var(--red);font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;margin-bottom:2rem;}
  .age-btns{display:flex;gap:1rem;flex-wrap:wrap;justify-content:center;}
  .btn-enter{background:var(--red);color:#fff;border:none;padding:.85rem 2rem;font-family:'Crimson Pro',serif;font-size:1rem;letter-spacing:.08em;cursor:pointer;transition:all .3s;}
  .btn-enter:hover{background:var(--red-bright);transform:translateY(-2px);}
  .btn-leave{background:transparent;color:var(--faint);border:1px solid var(--faint);padding:.85rem 2rem;font-family:'Crimson Pro',serif;font-size:1rem;cursor:pointer;transition:all .3s;}
  .btn-leave:hover{color:var(--parchment);}

  /* MODAL */
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:300;display:flex;align-items:center;justify-content:center;padding:2rem;}
  .modal-box{background:var(--smoke);border:1px solid var(--border);padding:2.5rem;max-width:380px;width:100%;text-align:center;}
  .modal-title{font-family:'Playfair Display',serif;font-size:1.4rem;margin-bottom:.5rem;color:var(--gold);}
  .modal-sub{color:var(--muted);font-size:.9rem;margin-bottom:1.5rem;line-height:1.6;}
  .key-display{font-family:'Playfair Display',serif;font-size:1.5rem;letter-spacing:.2em;color:var(--parchment);background:var(--bg);border:1px solid var(--gold-dim);padding:1rem 1.5rem;margin-bottom:1.5rem;user-select:all;word-break:break-all;}
  .modal-btn{background:var(--gold);color:#000;border:none;padding:.85rem 2rem;font-family:'Crimson Pro',serif;font-size:1rem;letter-spacing:.08em;cursor:pointer;width:100%;transition:all .3s;}
  .modal-btn:hover{background:#e0b855;}
  .login-icon{font-size:3rem;margin-bottom:1.5rem;opacity:.4;}
  .login-title{font-family:'Playfair Display',serif;font-size:1.8rem;letter-spacing:.12em;margin-bottom:.4rem;}
  .login-sub{color:var(--muted);font-size:.9rem;margin-bottom:2rem;}
  .login-input{background:#14110e;border:1px solid var(--border);color:var(--parchment);font-family:'Crimson Pro',serif;font-size:1.2rem;letter-spacing:.15em;padding:.85rem 1.2rem;width:100%;text-align:center;outline:none;transition:border-color .3s;margin-bottom:.8rem;}
  .login-input:focus{border-color:var(--gold-dim);}
  .login-err{color:var(--red-bright);font-size:.85rem;margin-top:.5rem;letter-spacing:.05em;}
  .cancel-link{background:none;border:none;color:var(--faint);cursor:pointer;font-size:.85rem;letter-spacing:.05em;margin-top:1rem;}
  .cancel-link:hover{color:var(--muted);}

  /* HEADER */
  .site-header{text-align:center;padding:3rem 1.5rem 1.5rem;position:relative;z-index:1;}
  .site-header::after{content:'';display:block;width:180px;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);margin:1.5rem auto 0;}
  .site-title{font-family:'Playfair Display',serif;font-size:clamp(3rem,10vw,5.5rem);font-weight:700;letter-spacing:.15em;text-shadow:0 0 80px rgba(201,168,76,0.15);}
  .site-tagline{font-style:italic;color:var(--gold-dim);font-size:.95rem;letter-spacing:.2em;margin-top:.3rem;}
  .admin-badge{display:inline-flex;align-items:center;gap:.4rem;background:rgba(201,168,76,0.08);border:1px solid var(--gold-dim);color:var(--gold);font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;padding:.3rem .8rem;margin-top:1rem;cursor:pointer;transition:all .3s;}
  .admin-badge:hover{background:rgba(201,168,76,0.15);}

  /* TABS */
  .tabs{display:flex;justify-content:center;max-width:540px;margin:1.5rem auto;border:1px solid var(--border);overflow:hidden;position:relative;z-index:1;}
  .tab-btn{flex:1;padding:.9rem .3rem;background:transparent;color:var(--faint);font-family:'Crimson Pro',serif;font-size:.9rem;letter-spacing:.08em;text-transform:uppercase;border:none;border-right:1px solid var(--border);cursor:pointer;transition:all .3s;}
  .tab-btn:last-child{border-right:none;}
  .tab-btn.active{background:var(--smoke);color:var(--gold);}
  .tab-btn.chat-tab.active{color:#6ab0d4;}
  .tab-btn:hover:not(.active){background:#14110e;color:var(--parchment);}

  /* SECTION */
  .section{display:none;padding:1.5rem;max-width:900px;margin:0 auto;position:relative;z-index:1;}
  .section.active{display:block;animation:fadein .35s ease;}
  @keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  .sec-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:.5rem;}
  .sec-label{font-family:'Playfair Display',serif;font-size:1.3rem;color:var(--gold);letter-spacing:.08em;}
  .sec-count{color:var(--faint);font-size:.8rem;letter-spacing:.05em;}

  /* UPLOAD */
  .upload-zone{border:1px dashed var(--border);padding:1.8rem;text-align:center;cursor:pointer;transition:all .3s;margin-bottom:1.5rem;background:rgba(255,255,255,.01);position:relative;}
  .upload-zone:hover,.upload-zone.drag{border-color:var(--gold-dim);background:rgba(201,168,76,.04);}
  .upload-zone input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;}
  .upload-icon-big{font-size:2.2rem;opacity:.35;margin-bottom:.5rem;}
  .upload-hint{color:var(--muted);font-size:.9rem;line-height:1.6;}
  .upload-hint strong{color:var(--parchment);}

  /* GRID */
  .media-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:1rem;}
  .empty-msg{text-align:center;padding:3rem 1rem;color:var(--faint);font-style:italic;}

  /* CARD */
  .media-card{background:var(--smoke);border:1px solid var(--border);position:relative;overflow:hidden;transition:transform .2s,border-color .2s;animation:fadein .3s ease;}
  .media-card:hover{transform:translateY(-3px);border-color:var(--gold-dim);}
  .card-thumb{width:100%;aspect-ratio:1;object-fit:cover;display:block;cursor:pointer;}
  .card-video{width:100%;aspect-ratio:16/9;object-fit:cover;background:#000;}
  .card-file-icon{width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:2.8rem;background:#14110e;color:#503828;cursor:pointer;}
  .card-info{padding:.55rem .65rem;border-top:1px solid var(--border);}
  .card-name{font-size:.75rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .card-size{font-size:.68rem;color:var(--faint);margin-top:.15rem;}
  .card-del{position:absolute;top:5px;right:5px;width:26px;height:26px;background:rgba(0,0,0,.8);border:1px solid #3a1a1a;color:#c04040;font-size:.75rem;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;border-radius:2px;}
  .media-card:hover .card-del{opacity:1;}

  /* LIGHTBOX */
  .lightbox{position:fixed;inset:0;background:rgba(0,0,0,.93);z-index:400;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:1rem;}
  .lb-close{position:fixed;top:1.2rem;right:1.2rem;background:none;border:1px solid var(--border);color:var(--muted);font-size:1.3rem;cursor:pointer;padding:.35rem .75rem;transition:all .2s;}
  .lb-close:hover{color:var(--parchment);}
  .lb-img{max-width:95vw;max-height:80vh;object-fit:contain;border:1px solid var(--border);}
  .lb-name{margin-top:1rem;color:var(--faint);font-size:.85rem;letter-spacing:.05em;}
  .lb-download{display:inline-block;margin-top:.8rem;padding:.5rem 1.2rem;border:1px solid var(--gold-dim);color:var(--gold);text-decoration:none;font-family:'Crimson Pro',serif;font-size:.9rem;letter-spacing:.08em;transition:all .3s;}
  .lb-download:hover{background:rgba(201,168,76,.08);}

  /* CHAT */
  .chat-wrap{display:flex;flex-direction:column;height:65vh;max-width:700px;margin:0 auto;}
  .chat-msgs{flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:.8rem;background:var(--smoke);border:1px solid var(--border);border-bottom:none;}
  .chat-msgs::-webkit-scrollbar{width:4px;}
  .chat-msgs::-webkit-scrollbar-thumb{background:var(--border);}
  .chat-msg{display:flex;flex-direction:column;gap:.2rem;}
  .chat-msg-meta{display:flex;align-items:center;gap:.6rem;}
  .chat-msg-name{font-size:.8rem;color:var(--gold-dim);letter-spacing:.05em;}
  .chat-msg-name.is-admin{color:var(--gold);}
  .chat-msg-time{font-size:.7rem;color:var(--faint);}
  .chat-msg-text{color:var(--parchment);font-size:.95rem;line-height:1.5;padding:.5rem .7rem;background:#1a1510;border-left:2px solid var(--border);max-width:85%;}
  .chat-msg-text.is-admin{border-left-color:var(--gold-dim);background:#1f1a10;}
  .chat-del-btn{background:none;border:none;color:var(--red);font-size:.7rem;cursor:pointer;opacity:0;padding:.1rem .3rem;transition:opacity .2s;}
  .chat-msg:hover .chat-del-btn{opacity:1;}
  .chat-input-row{display:flex;border:1px solid var(--border);}
  .chat-name-in{background:var(--smoke);border:none;border-right:1px solid var(--border);color:var(--muted);font-family:'Crimson Pro',serif;font-size:.9rem;padding:.75rem .9rem;width:110px;outline:none;}
  .chat-text-in{flex:1;background:var(--smoke);border:none;color:var(--parchment);font-family:'Crimson Pro',serif;font-size:1rem;padding:.75rem .9rem;outline:none;}
  .chat-send{background:var(--smoke);border:none;border-left:1px solid var(--border);color:var(--gold-dim);font-size:1.1rem;padding:.75rem 1rem;cursor:pointer;transition:all .3s;}
  .chat-send:hover{color:var(--gold);background:#1f1a10;}
  .chat-empty{text-align:center;padding:3rem 1rem;color:var(--faint);font-style:italic;}

  @media(max-width:480px){
    .media-grid{grid-template-columns:repeat(auto-fill,minmax(120px,1fr));}
    .tabs .tab-btn{font-size:.75rem;padding:.8rem .2rem;}
    .chat-name-in{width:80px;}
  }
`;

export default function Truths() {
  const [store, setStore] = useState(loadStore);
  const [ageOk, setAgeOk] = useState(() => sessionStorage.getItem("t_age") === "1");
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem("t_admin") === "1");
  const [showLogin, setShowLogin] = useState(false);
  const [loginVal, setLoginVal] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [logoutModal, setLogoutModal] = useState(false);
  const [nextKey, setNextKey] = useState("");
  const [tab, setTab] = useState("photos");
  const [lightbox, setLightbox] = useState(null);
  const [chatName, setChatName] = useState(() => localStorage.getItem("t_cname") || "");
  const [chatInput, setChatInput] = useState("");
  const [drag, setDrag] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => { saveStore(store); }, [store]);
  useEffect(() => {
    if (tab === "chat") setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [store.chat.length, tab]);

  // AGE GATE
  if (!ageOk) return (
    <div className="root">
      <style>{css}</style>
      <div className="age-gate">
        <div className="age-seal">⚠</div>
        <div className="age-title">Age Verification</div>
        <div className="age-sub">This site contains adult content. You must be 18 or older to enter.</div>
        <div className="age-warn">By entering you confirm you are 18+</div>
        <div className="age-btns">
          <button className="btn-enter" onClick={() => { sessionStorage.setItem("t_age","1"); setAgeOk(true); }}>I am 18 or older — Enter</button>
          <button className="btn-leave" onClick={() => { document.body.innerHTML='<div style="height:100vh;display:flex;align-items:center;justify-content:center;background:#060402;color:#403830;font-family:serif;letter-spacing:.1em;">Access denied.</div>'; }}>I am under 18 — Leave</button>
        </div>
      </div>
    </div>
  );

  // LOGIN
  const handleLogin = () => {
    const typed = normalize(loginVal);
    const stored = normalize(store.currentKey);
    const master = normalize(MASTER_KEY);
    if (typed === master || typed === stored) {
      sessionStorage.setItem("t_admin","1");
      setIsAdmin(true);
      setShowLogin(false);
      setLoginVal("");
      setLoginErr("");
    } else {
      setLoginErr("Invalid key — try again.");
    }
  };

  // LOGOUT
  const handleLogout = () => {
    const nk = generateKey();
    setNextKey(nk);
    setStore(s => ({ ...s, currentKey: nk }));
    setLogoutModal(true);
  };

  const confirmLogout = () => {
    sessionStorage.removeItem("t_admin");
    setIsAdmin(false);
    setLogoutModal(false);
  };

  // FILES
  const readFile = (file, section) => {
    const reader = new FileReader();
    reader.onload = e => {
      const item = { id: Date.now() + Math.random(), name: file.name, size: formatSize(file.size), type: file.type, data: e.target.result, ts: Date.now() };
      setStore(s => ({ ...s, [section]: [...s[section], item] }));
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e, section) => {
    e.preventDefault();
    setDrag("");
    Array.from(e.dataTransfer.files).forEach(f => readFile(f, section));
  };

  const handleFileInput = (e, section) => {
    Array.from(e.target.files).forEach(f => readFile(f, section));
    e.target.value = "";
  };

  const deleteItem = (id, section) => setStore(s => ({ ...s, [section]: s[section].filter(i => i.id !== id) }));

  // CHAT
  const sendMsg = () => {
    const text = chatInput.trim();
    if (!text) return;
    const name = chatName.trim() || "Anonymous";
    localStorage.setItem("t_cname", name);
    setStore(s => ({ ...s, chat: [...s.chat, { id: Date.now(), name, text, ts: Date.now(), isAdmin }] }));
    setChatInput("");
  };

  const deleteMsg = id => setStore(s => ({ ...s, chat: s.chat.filter(m => m.id !== id) }));

  // CARD
  const Card = ({ item, section }) => {
    const isImg = item.type?.startsWith("image/");
    const isVid = item.type?.startsWith("video/");
    const ext = item.name?.split(".").pop()?.toUpperCase() || "";
    const icons = { PDF:"📄",DOC:"📝",DOCX:"📝",XLS:"📊",XLSX:"📊",ZIP:"📦",RAR:"📦",TXT:"📃",MP3:"🎵",WAV:"🎵" };
    return (
      <div className="media-card">
        {isImg && <img className="card-thumb" src={item.data} alt={item.name} onClick={() => setLightbox(item)} />}
        {isVid && <video className="card-video" src={item.data} controls />}
        {!isImg && !isVid && <div className="card-file-icon" onClick={() => setLightbox(item)}>{icons[ext] || "📁"}</div>}
        <div className="card-info">
          <div className="card-name" title={item.name}>{item.name}</div>
          <div className="card-size">{item.size}</div>
        </div>
        {isAdmin && <button className="card-del" onClick={() => deleteItem(item.id, section)}>✕</button>}
      </div>
    );
  };

  // MEDIA SECTION
  const MediaSection = ({ section, label }) => {
    const items = store[section] || [];
    return (
      <div>
        <div className="sec-header">
          <span className="sec-label">{label}</span>
          <span className="sec-count">{items.length} item{items.length !== 1 ? "s" : ""}</span>
        </div>
        {isAdmin && (
          <div className={`upload-zone${drag === section ? " drag" : ""}`}
            onDragOver={e => { e.preventDefault(); setDrag(section); }}
            onDragLeave={() => setDrag("")}
            onDrop={e => handleDrop(e, section)}>
            <input type="file" multiple onChange={e => handleFileInput(e, section)} />
            <div className="upload-icon-big">＋</div>
            <div className="upload-hint"><strong>Tap or drag to upload</strong><br />{label} go here</div>
          </div>
        )}
        {items.length === 0
          ? <div className="empty-msg">Nothing here yet{isAdmin ? " — upload above" : ""}.</div>
          : <div className="media-grid">{items.map(i => <Card key={i.id} item={i} section={section} />)}</div>}
      </div>
    );
  };

  return (
    <div className="root">
      <style>{css}</style>

      {/* LOGOUT MODAL */}
      {logoutModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-title">Your Next Key</div>
            <div className="modal-sub">Copy this before leaving — you'll need it to log in as admin next time.</div>
            <div className="key-display">{nextKey}</div>
            <button className="modal-btn" onClick={confirmLogout}>I've copied it — Log out</button>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {showLogin && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="login-icon">🔑</div>
            <div className="login-title">Admin Access</div>
            <div className="login-sub">Enter your access key</div>
            <input className="login-input" placeholder="Enter key" value={loginVal}
              onChange={e => setLoginVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()} autoFocus />
            <button className="modal-btn" onClick={handleLogin}>Enter</button>
            {loginErr && <div className="login-err">{loginErr}</div>}
            <div><button className="cancel-link" onClick={() => { setShowLogin(false); setLoginVal(""); setLoginErr(""); }}>Cancel</button></div>
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <button className="lb-close" onClick={() => setLightbox(null)}>✕</button>
          {lightbox.type?.startsWith("image/")
            ? <img className="lb-img" src={lightbox.data} alt={lightbox.name} onClick={e => e.stopPropagation()} />
            : lightbox.type?.startsWith("audio/")
              ? <audio controls src={lightbox.data} style={{width:"300px",marginTop:"2rem"}} onClick={e => e.stopPropagation()} />
              : <div style={{color:"var(--muted)",textAlign:"center",padding:"2rem"}} onClick={e => e.stopPropagation()}>
                  <div style={{fontSize:"4rem",marginBottom:"1rem"}}>📁</div>
                  <div style={{marginBottom:"1.2rem",color:"var(--parchment)"}}>{lightbox.name}</div>
                  <a className="lb-download" href={lightbox.data} download={lightbox.name}>Download</a>
                </div>}
          <div className="lb-name">{lightbox.name}</div>
        </div>
      )}

      {/* HEADER */}
      <header className="site-header">
        <div className="site-title">TRUTHS</div>
        <div className="site-tagline">a place for everything</div>
        <div style={{marginTop:"1rem"}}>
          {isAdmin
            ? <button className="admin-badge" onClick={handleLogout}>👑 Admin — Log out</button>
            : <button className="admin-badge" onClick={() => setShowLogin(true)}>🔑 Admin login</button>}
        </div>
      </header>

      {/* TABS */}
      <div className="tabs">
        {[["photos","📷 Photos"],["videos","🎬 Videos"],["files","📁 Files"],["chat","💬 Chat"]].map(([id,label]) => (
          <button key={id} className={`tab-btn${id==="chat"?" chat-tab":""}${tab===id?" active":""}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* CONTENT */}
      <div className={`section${tab==="photos"?" active":""}`}><MediaSection section="photos" label="Photos" /></div>
      <div className={`section${tab==="videos"?" active":""}`}><MediaSection section="videos" label="Videos" /></div>
      <div className={`section${tab==="files"?" active":""}`}><MediaSection section="files" label="Files" /></div>

      <div className={`section${tab==="chat"?" active":""}`}>
        <div className="sec-header">
          <span className="sec-label" style={{color:"#6ab0d4"}}>Public Chat</span>
          <span className="sec-count">{store.chat.length} message{store.chat.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="chat-wrap">
          <div className="chat-msgs">
            {store.chat.length === 0
              ? <div className="chat-empty">No messages yet.</div>
              : store.chat.map(m => (
                <div className="chat-msg" key={m.id}>
                  <div className="chat-msg-meta">
                    <span className={`chat-msg-name${m.isAdmin?" is-admin":""}`}>{m.name}{m.isAdmin?" 👑":""}</span>
                    <span className="chat-msg-time">{timeAgo(m.ts)}</span>
                    {isAdmin && <button className="chat-del-btn" onClick={() => deleteMsg(m.id)}>✕</button>}
                  </div>
                  <div className={`chat-msg-text${m.isAdmin?" is-admin":""}`}>{m.text}</div>
                </div>
              ))}
            <div ref={chatEndRef} />
          </div>
          <div className="chat-input-row">
            <input className="chat-name-in" placeholder="Name" value={chatName} onChange={e => setChatName(e.target.value)} maxLength={20} />
            <input className="chat-text-in" placeholder="Write a message…" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key==="Enter" && sendMsg()} maxLength={500} />
            <button className="chat-send" onClick={sendMsg}>➤</button>
          </div>
        </div>
      </div>
    </div>
  );
}
