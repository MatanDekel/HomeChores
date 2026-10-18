import { useState, useEffect, useCallback } from "react";
import {
  signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut,
  onAuthStateChanged, updateProfile
} from "firebase/auth";
import {
  doc, collection, setDoc, getDoc, updateDoc, deleteDoc,
  onSnapshot, serverTimestamp, arrayUnion
} from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";

// ─── Constants ────────────────────────────────────────────────────────────────
const DEPTHS = [
  { label:"Quick Tidy",     emoji:"🧹", color:"#a8e6cf" },
  { label:"Light Clean",    emoji:"🫧", color:"#b8d4f0" },
  { label:"Thorough Clean", emoji:"🪣", color:"#f7c8e0" },
  { label:"Deep Clean",     emoji:"✨", color:"#ffd6a5" },
];
const UNITS = [
  { val:"days",   emoji:"📅", label:"Day(s)"    },
  { val:"weeks",  emoji:"📆", label:"Week(s)"   },
  { val:"months", emoji:"🗓️", label:"Month(s)"  },
  { val:"years",  emoji:"🎊", label:"Year(s)"   },
  { val:"once",   emoji:"1️⃣",  label:"Just Once" },
];
const TASK_EMOJIS  = ["🧹","🧺","🪣","🫧","🚿","🛁","🪥","🧽","🫙","🗑️","🪴","🛋️","🪟","🚪","🍽️","🥘","🧊","🧻","🛏️","🧸","📦","🪞","💡","🖼️","🏠","🌿","🌊","🧴","🪒","🫗","🧲","🪤"];
const AREA_EMOJIS  = ["🏠","🛋️","🍳","🛁","🛏️","🪴","🚗","📚","🎮","💼","🌿","🪟","🏡","🧺","🍵","🖥️"];
const TASK_TYPES = [
  { val: "daily",  emoji: "☀️", label: "Daily task"   },
  { val: "weekly", emoji: "📋", label: "Weekly task"  },
];
const TIME_OF_DAY = [
  { val: "anytime", emoji: "🕐", label: "Anytime"  },
  { val: "morning", emoji: "🌅", label: "Morning"  },
  { val: "evening", emoji: "🌙", label: "Evening"  },
];
const SUGGESTED_AREAS = [
  { name: "Kitchen",          emoji: "🍳", color: "#ffb3ba" },
  { name: "Living Room",      emoji: "🛋️", color: "#ffdfba" },
  { name: "Guest Bathroom",   emoji: "🚿", color: "#bae1ff" },
  { name: "Kids Bathroom",    emoji: "🧸", color: "#baffc9" },
  { name: "Parents Bathroom", emoji: "🛁", color: "#e8baff" },
  { name: "Office",           emoji: "🖥️", color: "#fff0ba" },
  { name: "Master Bedroom",   emoji: "🛏️", color: "#ffc8dd" },
  { name: "Printer Room",     emoji: "📦", color: "#c9c9c9" },
  { name: "Safe Room",        emoji: "🚪", color: "#c4a882" },
  { name: "Balcony",          emoji: "🪴", color: "#a8c5a0" },
  { name: "Laundry Room",     emoji: "🧺", color: "#d4b896" },
];
const PALETTE      = ["#ffb3ba","#ffdfba","#ffffba","#baffc9","#bae1ff","#e8baff","#ffd6e7","#c9f0ff","#d4f5d4","#fff0ba","#ffc8dd","#a2d2ff","#d4b896","#c9c9c9","#b5d5b5","#8fbc8f","#c4a882","#b0b0b0","#e8d5c4","#a8c5a0"];
const THEMES = {
  fun: {
    name: "Fun & Colorful",
    emoji: "🌈",
    // Header gradient
    headerBg: "linear-gradient(135deg,#ffd6e7 0%,#fff0ba 50%,#c9f0ff 100%)",
    // Page background
    pageBg: "radial-gradient(ellipse at 0% 0%,#ffe8f0 0%,#fff8e7 40%,#e8f4ff 100%)",
    // Auth background
    authBg: "radial-gradient(ellipse at 30% 0%,#ffe8f0,#fff8e7 50%,#e8f4ff)",
    // Primary accent
    primary: "#ff6b9d",
    primaryLight: "#ff85a1",
    primaryPale: "#ffd6e7",
    // Secondary
    secondary: "#5bbfdf",
    secondaryPale: "#c9f0ff",
    // Card backgrounds
    cardBg: "#fff",
    cardBorder: "#ffd6e7",
    cardShadow: "rgba(255,182,193,.22)",
    // Text
    textMain: "#444",
    textSub: "#bbb",
    textMuted: "#ccc",
    // Input
    inputBg: "#fff8f0",
    inputBorder: "#ffd6e7",
    // Progress bar
    progressBg: "linear-gradient(90deg,#ffb3ba,#bae1ff,#baffc9)",
    weekProgressBg: "linear-gradient(90deg,#bae1ff,#baffc9)",
    // Pill
    pillDefault: "#ffd6e7",
    // Tabs
    tabActiveBg: "#fff",
    tabActiveColor: "#ff6b9d",
    tabInactiveColor: "#c06080",
    // Btn
    btnGradient: "linear-gradient(135deg,#ffb3ba,#c9f0ff)",
    btnBigGradient: "linear-gradient(135deg,#ffb3ba,#ffd6a5,#c9f0ff)",
    // Sheet handle
    sheetHandle: "#ffd6e7",
    // Celebration
    celebBg: "linear-gradient(135deg,#d4f5d4,#c9f0ff)",
    celebBorder: "#a8e6cf",
    celebColor: "#5cb85c",
    weekCelebBg: "linear-gradient(135deg,#c9f0ff,#d4f5d4)",
    weekCelebBorder: "#bae1ff",
    weekCelebColor: "#5bbfdf",
    // Font
    fontFamily: "'Fredoka One',cursive",
  },
  mature: {
    name: "Calm & Natural",
    emoji: "🌿",
    headerBg: "linear-gradient(135deg,#c8b89a 0%,#d4c4a8 50%,#b8c4a8 100%)",
    pageBg: "radial-gradient(ellipse at 0% 0%,#f2ebe0 0%,#ede8dc 40%,#e8ede0 100%)",
    authBg: "radial-gradient(ellipse at 30% 0%,#f2ebe0,#ede8dc 50%,#e8ede0)",
    primary: "#8b6f47",
    primaryLight: "#a08060",
    primaryPale: "#e8ddd0",
    secondary: "#7a8c6e",
    secondaryPale: "#d4ddc8",
    cardBg: "#faf8f4",
    cardBorder: "#ddd5c4",
    cardShadow: "rgba(139,111,71,.12)",
    textMain: "#3d3028",
    textSub: "#9a8878",
    textMuted: "#b5a898",
    inputBg: "#f5f0e8",
    inputBorder: "#ddd5c4",
    progressBg: "linear-gradient(90deg,#c8b89a,#b8c4a8,#d4c4a8)",
    weekProgressBg: "linear-gradient(90deg,#b8c4a8,#c8d4b8)",
    pillDefault: "#e8ddd0",
    tabActiveBg: "#faf8f4",
    tabActiveColor: "#8b6f47",
    tabInactiveColor: "#a09080",
    btnGradient: "linear-gradient(135deg,#c8b89a,#b8c4a8)",
    btnBigGradient: "linear-gradient(135deg,#c8b89a,#d4c0a0,#b8c4a8)",
    sheetHandle: "#ddd5c4",
    celebBg: "linear-gradient(135deg,#d4ddc8,#e8ddd0)",
    celebBorder: "#b8c4a8",
    celebColor: "#7a8c6e",
    weekCelebBg: "linear-gradient(135deg,#d4ddc8,#c8d4b8)",
    weekCelebBorder: "#b8c4a8",
    weekCelebColor: "#7a8c6e",
    fontFamily: "'Nunito',sans-serif",
  }
};

// Theme context — read from localStorage for instant load
function getTheme(user) {
  const saved = user?.theme || localStorage.getItem("hc:theme") || "fun";
  return THEMES[saved] || THEMES.fun;
}
const DAY_SHORT    = ["S","M","T","W","T","F","S"];
const DAY_EMOJI    = ["🌟","🌸","🌻","🌈","🎉","🎊","🌙"];
const MONTH_NAMES  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const GOOGLE_AVATARS = ["🧑","👩","👨","🧑‍💼","👩‍💼"];

// ─── Utility ──────────────────────────────────────────────────────────────────
function uid()        { return Math.random().toString(36).slice(2,9); }
function dateKey(d)   { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function todayKey()   { return dateKey(new Date()); }
function sameDay(a,b) { return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate(); }
function weekKey(d) {
  const dt = d || new Date();
  const sunday = new Date(dt);
  sunday.setDate(dt.getDate() - dt.getDay());
  return `week-${dateKey(sunday)}`;
}
function initials(name) { return (name||"?").trim().split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2); }
function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

function repeatLabel(task) {
  if (task.repeatUnit==="once"||task.repeat==="once") return "Just once 1️⃣";
  const n=task.repeatEvery||1, u=task.repeatUnit||"weeks";
  return `Every ${n} ${n===1?u.replace(/s$/,""):u} ${UNITS.find(x=>x.val===u)?.emoji||""}`;
}
function isTaskDue(task, date) {
  const created=new Date(task.createdAt?.toDate?.()??task.createdAt);
  created.setHours(0,0,0,0);
  const target=new Date(date); target.setHours(0,0,0,0);
  if(target<created) return false;
  const unit=task.repeatUnit||(task.repeat==="once"?"once":task.repeat==="daily"?"days":task.repeat==="weekly"?"weeks":"months");
  const every=task.repeatEvery||1;
  if(unit==="once")   return dateKey(created)===dateKey(target);
  if(unit==="days")   return Math.round((target-created)/86400000)%every===0;
  if(unit==="weeks") {
    // If specific weekDays chosen, check if target day is in the list
    // and that it falls on the right week cycle
    const diffDays = Math.round((target-created)/86400000);
    if(task.weekDays&&task.weekDays.length>0) {
      if(!task.weekDays.includes(target.getDay())) return false;
      // Find first occurrence of this weekday >= created
      const dayOffset = ((target.getDay()-created.getDay())+7)%7;
      return diffDays>=dayOffset && (diffDays-dayOffset)%(every*7)===0;
    }
    return diffDays%(every*7)===0;
  }
  if(unit==="months") {
    const ym=(target.getFullYear()-created.getFullYear())*12+(target.getMonth()-created.getMonth());
    if(ym<0 || ym%every!==0) return false;
    if(task.monthMode==="weekday" && task.monthWeekDay!=null && task.monthWeekNum) {
      // e.g. 2nd Saturday: find the Nth occurrence of weekday in target month
      if(target.getDay()!==task.monthWeekDay) return false;
      // Count how many times this weekday has occurred in this month up to target date
      const firstOfMonth=new Date(target.getFullYear(),target.getMonth(),1);
      const firstOccurrence=((task.monthWeekDay-firstOfMonth.getDay()+7)%7)+1;
      const occurrence=Math.floor((target.getDate()-firstOccurrence)/7)+1;
      return occurrence===task.monthWeekNum;
    }
    const dayToCheck = task.monthDay || created.getDate();
    return target.getDate()===dayToCheck;
  }
  if(unit==="years")  { const yy=target.getFullYear()-created.getFullYear(); return yy%every===0&&target.getMonth()===created.getMonth()&&target.getDate()===created.getDate(); }
  return false;
}

// ════════════════════════════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════════════════════════════
export default function Root() {
  const [user, setUser]     = useState(undefined); // undefined = loading
  const [fbUser, setFbUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { setUser(null); return; }
      setFbUser(firebaseUser);
      // Load or create user doc in Firestore
      const userRef = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setUser({ id: firebaseUser.uid, ...snap.data() });
      } else {
        // First login — create user + household
        const hid = uid();
        const userData = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL || GOOGLE_AVATARS[Math.floor(Math.random()*GOOGLE_AVATARS.length)],
          householdId: hid,
          authMethod: firebaseUser.providerData[0]?.providerId==="google.com"?"google":"email",
          createdAt: serverTimestamp(),
        };
        await setDoc(userRef, userData);
        // Create household
        await setDoc(doc(db, "households", hid), {
          id: hid,
          name: `${userData.name.split(" ")[0]}'s Home`,
          members: [{ id: firebaseUser.uid, name: userData.name, email: userData.email, avatar: userData.avatar, role: "owner" }],
          createdAt: serverTimestamp(),
        });

        // Seed default areas
        const defaultAreas = [
          { name: "Kitchen",           emoji: "🍳", color: "#ffb3ba" },
          { name: "Living Room",       emoji: "🛋️", color: "#ffdfba" },
          { name: "Guest Bathroom",    emoji: "🚿", color: "#bae1ff" },
          { name: "Kids Bathroom",     emoji: "🧸", color: "#baffc9" },
          { name: "Parents Bathroom",  emoji: "🛁", color: "#e8baff" },
          { name: "Office",            emoji: "🖥️", color: "#fff0ba" },
          { name: "Master Bedroom",    emoji: "🛏️", color: "#ffc8dd" },
          { name: "Printer Room",      emoji: "📦", color: "#c9c9c9" },
          { name: "Safe Room",         emoji: "🚪", color: "#c4a882" },
          { name: "Balcony",           emoji: "🪴", color: "#a8c5a0" },
          { name: "Laundry Room",      emoji: "🧺", color: "#d4b896" },
        ];
        for (const area of defaultAreas) {
          const areaRef = doc(collection(db, "households", hid, "areas"));
          await setDoc(areaRef, { ...area, id: areaRef.id });
        }
        // Check for pending invite
        const inviteRef = doc(db, "invites", firebaseUser.email);
        const inviteSnap = await getDoc(inviteRef);
        if (inviteSnap.exists()) {
          const { householdId: invitedHid, invitedBy } = inviteSnap.data();
          // Join the inviting household instead
          userData.householdId = invitedHid;
          await updateDoc(userRef, { householdId: invitedHid });
          await updateDoc(doc(db, "households", invitedHid), {
            members: arrayUnion({ id: firebaseUser.uid, name: userData.name, email: userData.email, avatar: userData.avatar, role: "member" })
          });
          // Clean up own new household (empty anyway) and invite
          await setDoc(doc(db, "households", hid), { deleted: true }, { merge: true });
        }
        setUser({ ...userData, id: firebaseUser.uid });
      }
    });
    return unsub;
  }, []);

  const logout = () => signOut(auth);

  if (user === undefined) return <Splash/>;
  if (!user) return <AuthScreen/>;
  return <App user={user} fbUser={fbUser} onLogout={logout}/>;
}

// ── Splash ─────────────────────────────────────────────────────────────────────
function Splash() {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",
      background:"linear-gradient(135deg,#ffd6e7,#fff0ba,#c9f0ff)",fontFamily:"Nunito,sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:64,marginBottom:8}}>🏡</div>
        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:28,color:"#ff6b9d"}}>Happy Home</div>
        <div style={{fontSize:13,color:"#ffb3c6",marginTop:6}}>Loading…</div>
      </div>
    </div>
  );
}

// ── Auth Screen ────────────────────────────────────────────────────────────────
function AuthScreen() {
  const [mode,    setMode]    = useState("login");
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [pass,    setPass]    = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass,setShowPass]= useState(false);

  const handleGoogle = async () => {
    setLoading(true); setError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch(e) {
      setError("Google sign-in failed. Try again 🔄");
      setLoading(false);
    }
  };

  const handleEmail = async (e) => {
    e.preventDefault(); setError("");
    if(!validateEmail(email)) { setError("Please enter a valid email 📧"); return; }
    if(pass.length<6)         { setError("Password must be at least 6 characters 🔒"); return; }
    if(mode==="signup"&&!name.trim()) { setError("Please enter your name 👋"); return; }
    setLoading(true);
    try {
      if(mode==="login") {
        await signInWithEmailAndPassword(auth, email, pass);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(cred.user, { displayName: name.trim() });
      }
    } catch(e) {
      const msgs = {
        "auth/user-not-found":      "No account with this email 🤷",
        "auth/wrong-password":      "Wrong password 🔑",
        "auth/email-already-in-use":"Email already registered 😅",
        "auth/invalid-credential":  "Wrong email or password 🔑",
        "auth/too-many-requests":   "Too many attempts. Try later ⏳",
      };
      setError(msgs[e.code] || `Error: ${e.message}`);
      setLoading(false);
    }
  };

  const isLogin = mode==="login";
  return (
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 30% 0%,#ffe8f0,#fff8e7 50%,#e8f4ff)",
      fontFamily:"'Nunito','Segoe UI',sans-serif",display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",padding:20}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .bn{transition:transform .12s;cursor:pointer;}.bn:hover{transform:scale(1.04);}.bn:active{transform:scale(.97);}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp .3s ease forwards;}
        input{font-family:inherit;outline:none;}
        .fi:focus{border-color:#ff85a1!important;box-shadow:0 0 0 3px rgba(255,133,161,.15);}
      `}</style>
      <div className="fu" style={{textAlign:"center",marginBottom:28}}>
        <div style={{fontSize:54,marginBottom:6}}>🏡</div>
        <div style={{fontFamily:T.fontFamily,fontSize:26,color:T.primary}}>Happy Home</div>
        <div style={{fontSize:11,color:"#ffb3c6",fontWeight:800,letterSpacing:2,textTransform:"uppercase",marginTop:2}}>Chore Tracker ✨</div>
      </div>
      <div className="fu" style={{background:"#fff",borderRadius:28,padding:"28px 24px",width:"100%",maxWidth:400,
        boxShadow:"0 12px 48px rgba(255,182,193,.3)",border:"2px solid #ffd6e7"}}>
        <h2 style={{fontFamily:"'Fredoka One',cursive",fontSize:22,color:"#ff6b9d",marginBottom:4,textAlign:"center"}}>
          {isLogin?"Welcome back! 👋":"Create account 🌟"}
        </h2>
        <p style={{fontSize:13,color:"#bbb",textAlign:"center",marginBottom:22,fontWeight:600}}>
          {isLogin?"Sign in to your household":"Join or start a household"}
        </p>
        <button className="bn" onClick={handleGoogle} disabled={loading}
          style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,
            padding:"12px",borderRadius:16,border:"2px solid #e8e8e8",background:"#fff",
            fontSize:16,fontWeight:800,color:"#444",cursor:"pointer",marginBottom:16,fontFamily:"inherit",
            boxShadow:"0 2px 8px rgba(0,0,0,.06)",opacity:loading?.7:1}}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {loading?"Connecting…":"Continue with Google"}
        </button>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <div style={{flex:1,height:1,background:"#f0f0f0"}}/>
          <span style={{fontSize:12,color:"#ccc",fontWeight:700}}>or with email</span>
          <div style={{flex:1,height:1,background:"#f0f0f0"}}/>
        </div>
        <form onSubmit={handleEmail}>
          {!isLogin&&(
            <div style={{position:"relative",marginBottom:12}}>
              <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:16}}>👤</span>
              <input className="fi" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" type="text"
                style={{width:"100%",padding:"11px 12px 11px 40px",borderRadius:13,border:"2px solid #f0f0f0",background:"#fff8f0",fontSize:16,color:"#444"}}/>
            </div>
          )}
          <div style={{position:"relative",marginBottom:12}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:16}}>📧</span>
            <input className="fi" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" type="email"
              style={{width:"100%",padding:"11px 12px 11px 40px",borderRadius:13,border:"2px solid #f0f0f0",background:"#fff8f0",fontSize:16,color:"#444"}}/>
          </div>
          <div style={{position:"relative",marginBottom:14}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:16}}>🔒</span>
            <input className="fi" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Password" type={showPass?"text":"password"}
              style={{width:"100%",padding:"11px 40px 11px 40px",borderRadius:13,border:"2px solid #f0f0f0",background:"#fff8f0",fontSize:16,color:"#444"}}/>
            <button type="button" onClick={()=>setShowPass(!showPass)}
              style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#ccc",padding:0}}>
              {showPass?"🙈":"👁️"}
            </button>
          </div>
          {error&&(
            <div style={{background:"#fff0f3",border:"2px solid #ffb3ba",borderRadius:12,padding:"10px 14px",
              marginBottom:14,fontSize:13,fontWeight:700,color:"#e05080"}}>{error}</div>
          )}
          <button type="submit" disabled={loading} className="bn"
            style={{width:"100%",padding:"13px",borderRadius:16,border:"none",cursor:"pointer",fontFamily:"inherit",
              background:"linear-gradient(135deg,#ffb3ba,#ffd6a5,#c9f0ff)",fontSize:15,fontWeight:900,color:"#555",
              boxShadow:"0 6px 20px rgba(255,182,193,.45)",opacity:loading?.7:1}}>
            {loading?"Loading…":isLogin?"Sign In 🚀":"Create Account 🎉"}
          </button>
        </form>
        <p style={{textAlign:"center",marginTop:18,fontSize:13,color:"#bbb",fontWeight:700}}>
          {isLogin?"Don't have an account? ":"Already have an account? "}
          <span onClick={()=>{setMode(isLogin?"signup":"login");setError("");}}
            style={{color:"#ff6b9d",cursor:"pointer",textDecoration:"underline"}}>
            {isLogin?"Sign up":"Sign in"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════════════════════════
function App({ user, onLogout }) {
  const hid = user.householdId;

  const [tab,         setTab]         = useState("today");
  const [areas,       setAreas]       = useState([]);
  const [tasks,       setTasks]       = useState([]);
  const [done,        setDone]        = useState({});
  const [household,   setHousehold]   = useState(null);
  const [areaModal,   setAreaModal]   = useState(null);
  const [taskModal,   setTaskModal]   = useState(null);
  const [calView,     setCalView]     = useState("week");
  const [calDate,     setCalDate]     = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [showAccount, setShowAccount] = useState(false);
  const [filterArea,  setFilterArea]  = useState(null);
  const [weeklyDone,  setWeeklyDone]  = useState({});
  const [themeKey,    setThemeKey]    = useState(() => user?.theme || localStorage.getItem("hc:theme") || "fun");
  const T = THEMES[themeKey] || THEMES.fun;

  const changeTheme = async (key) => {
    setThemeKey(key);
    localStorage.setItem("hc:theme", key);
    await updateDoc(doc(db, "users", user.id), { theme: key });
  };

  // ── Real-time Firestore listeners ──
  useEffect(() => {
    if (!hid) return;
    const hhRef = doc(db, "households", hid);
    const u1 = onSnapshot(hhRef, snap => { if(snap.exists()) setHousehold(snap.data()); });
    const u2 = onSnapshot(collection(db, "households", hid, "areas"),  snap => setAreas(snap.docs.map(d=>({id:d.id,...d.data()}))));
    const u3 = onSnapshot(collection(db, "households", hid, "tasks"),  snap => setTasks(snap.docs.map(d=>({id:d.id,...d.data()}))));
    const u4 = onSnapshot(doc(db, "households", hid, "done", "state"), snap => { if(snap.exists()) setDone(snap.data()); });
      const u5 = onSnapshot(doc(db, "households", hid, "done", "weekly"), snap => { if(snap.exists()) setWeeklyDone(snap.data()); else setWeeklyDone({}); });
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, [hid]);

  // ── Write helpers ──
  const toggleWeeklyDone = async (taskId) => {
    const key = weekKey();
    const weekRef = doc(db, "households", hid, "done", "weekly");
    const current = weeklyDone[key] || {};
    const newVal = { ...weeklyDone, [key]: { ...current, [taskId]: !current[taskId] } };
    await setDoc(weekRef, newVal, { merge: true });
  };
  const saveArea = async (a) => {
    const ref = a.id
      ? doc(db, "households", hid, "areas", a.id)
      : doc(collection(db, "households", hid, "areas"));
    await setDoc(ref, { ...a, id: ref.id }, { merge: true });
    setAreaModal(null);
  };
  const deleteArea = async (id) => {
    await deleteDoc(doc(db, "households", hid, "areas", id));
    tasks.filter(t=>t.areaId===id).forEach(t => deleteDoc(doc(db, "households", hid, "tasks", t.id)));
  };
  const saveTask = async (t) => {
    const ref = t.id
      ? doc(db, "households", hid, "tasks", t.id)
      : doc(collection(db, "households", hid, "tasks"));
    await setDoc(ref, { ...t, id: ref.id, createdBy: user.id, createdAt: t.createdAt || serverTimestamp() }, { merge: true });
    setTaskModal(null);
  };
  const deleteTask = async (id) => {
    await deleteDoc(doc(db, "households", hid, "tasks", id));
  };
  const toggleDone = async (taskId, date) => {
    const key = dateKey(date || new Date());
    const doneRef = doc(db, "households", hid, "done", "state");
    const current = done[key] || {};
    const newVal = { ...done, [key]: { ...current, [taskId]: !current[taskId] } };
    await setDoc(doneRef, newVal, { merge: true });
  };
  const sendInvite = async (email) => {
    if(!validateEmail(email)) return "Invalid email 📧";
    if(household?.members?.find(m=>m.email===email)) return "Already a member 😊";
    await setDoc(doc(db, "invites", email.toLowerCase()), {
      householdId: hid, invitedBy: user.name, invitedAt: serverTimestamp()
    });
    return null;
  };
  const renameHousehold = async (name) => {
    await updateDoc(doc(db, "households", hid), { name });
    setHousehold(h=>({...h,name}));
  };

  const todayDone   = done[todayKey()]||{};
  const todayTasks  = tasks.filter(t=>isTaskDue(t,new Date()) && t.taskType!=="weekly");
  const morningTasks = todayTasks.filter(t=>t.timeOfDay==="morning");
  const eveningTasks = todayTasks.filter(t=>t.timeOfDay==="evening");
  const anytimeTasks = todayTasks.filter(t=>!t.timeOfDay||t.timeOfDay==="anytime");
  const doneCount   = todayTasks.filter(t=>todayDone[t.id]).length;
  const thisWeekDone = weeklyDone[weekKey()]||{};
  const weeklyTasks  = tasks.filter(t=>t.taskType==="weekly");
  const weeklyDoneCount = weeklyTasks.filter(t=>thisWeekDone[t.id]).length;

  const TABS = [
    {id:"today",emoji:"☀️",label:"Today"},
    {id:"calendar",emoji:"📅",label:"Calendar"},
    {id:"tasks",emoji:"📋",label:"Tasks"},
    {id:"areas",emoji:"🗂️",label:"Areas"},
  ];

  return (
    <div style={{minHeight:"100vh",background:T.pageBg,
      fontFamily:"'Nunito','Segoe UI',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:6px;}::-webkit-scrollbar-thumb{background:#ffd6e7;border-radius:10px;}
        .bn{transition:transform .12s;cursor:pointer;}.bn:hover{transform:scale(1.06);}.bn:active{transform:scale(.95);}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pop{0%{transform:scale(.7);opacity:0}65%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        .fu{animation:fadeUp .28s ease forwards;}
        .pu{animation:pop .25s ease forwards;}
        .su{animation:slideUp .26s cubic-bezier(.34,1.4,.64,1) forwards;}
        input,select,textarea{font-family:inherit;outline:none;}
        .trow{transition:transform .15s,box-shadow .15s;border-radius:18px;}
        .trow:hover{transform:translateX(4px);box-shadow:0 6px 20px rgba(255,182,193,.35)!important;}
        .fi:focus{border-color:#ff85a1!important;box-shadow:0 0 0 3px rgba(255,133,161,.15);}
      `}</style>

      {/* HEADER */}
      <div style={{background:T.headerBg,padding:"20px 18px 0",boxShadow:`0 4px 24px ${T.cardShadow}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:28}}>🏡</span>
            <div>
              <div style={{fontFamily:T.fontFamily,fontSize:20,color:T.primary,lineHeight:1}}>{household?.name||"Happy Home"}</div>
              <div style={{fontSize:10,color:T.primaryLight,fontWeight:800,letterSpacing:2,textTransform:"uppercase"}}>
                {household?.members?.length||1} member{(household?.members?.length||1)!==1?"s":""} ✨
              </div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {tab==="today"&&(
              <div style={{background:"rgba(255,255,255,.55)",borderRadius:14,padding:"5px 12px",textAlign:"center"}}>
                <div style={{fontFamily:T.fontFamily,fontSize:20,color:doneCount===todayTasks.length&&todayTasks.length>0?"#5cb85c":T.primary,lineHeight:1}}>{doneCount}/{todayTasks.length}</div>
                <div style={{fontSize:9,color:T.primaryLight,fontWeight:800,letterSpacing:1}}>DONE</div>
              </div>
            )}
            <div className="bn" onClick={()=>setShowAccount(true)}
              style={{width:38,height:38,borderRadius:12,background:"#fff",border:"2px solid #ffd6e7",
                display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 2px 8px ${T.cardShadow}`}}>
              {user.authMethod==="google"&&user.avatar?.startsWith("http")
                ? <img src={user.avatar} style={{width:28,height:28,borderRadius:8}} alt=""/>
                : <span style={{fontSize:user.authMethod==="google"?20:13,fontWeight:900,color:"#ff6b9d"}}>
                    {user.authMethod==="google"?user.avatar||"🧑":initials(user.name)}
                  </span>}
            </div>
          </div>
        </div>
        {household?.members?.length>1&&(
          <div style={{display:"flex",gap:4,marginBottom:10,overflowX:"auto"}}>
            {household.members.map(m=>(
              <div key={m.id} title={m.name}
                style={{width:26,height:26,borderRadius:8,background:"#fff",border:"1.5px solid #ffd6e7",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:"#ff6b9d",flexShrink:0}}>
                {initials(m.name)}
              </div>
            ))}
          </div>
        )}
        <div style={{display:"flex",gap:2}}>
          {TABS.map(t=>(
            <button key={t.id} className="bn" onClick={()=>setTab(t.id)}
              style={{flex:1,padding:"8px 4px",border:"none",borderRadius:"14px 14px 0 0",
                background:tab===t.id?T.tabActiveBg:"rgba(255,255,255,.35)",color:tab===t.id?T.tabActiveColor:T.tabInactiveColor,
                fontWeight:800,fontSize:11,fontFamily:"inherit",cursor:"pointer",
                boxShadow:tab===t.id?`0 -2px 12px ${T.cardShadow}`:"none",letterSpacing:.5}}>
              <div style={{fontSize:16,marginBottom:1}}>{t.emoji}</div>{t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{maxWidth:600,margin:"0 auto",padding:"18px 14px 100px"}}>

        {/* TODAY */}
        {tab==="today"&&(
          <div className="fu">
            <div style={{background:"#fff",borderRadius:24,padding:"18px 20px",marginBottom:16,
              boxShadow:`0 6px 28px ${T.cardShadow}`,border:`2px solid ${T.cardBorder}`,textAlign:"center"}}>
              <div style={{fontSize:40,marginBottom:4}}>{DAY_EMOJI[new Date().getDay()]}</div>
              <div style={{fontFamily:"'Fredoka One',cursive",fontSize:26,color:"#ff6b9d"}}>
                {new Date().toLocaleDateString("en-US",{weekday:"long"})}
              </div>
              <div style={{color:"#ccc",fontSize:13,fontWeight:700,marginBottom:todayTasks.length?12:0}}>
                {new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}
              </div>
              {todayTasks.length>0&&(<>
                <div style={{height:10,background:"#f5f5f5",borderRadius:20,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:20,transition:"width .55s cubic-bezier(.34,1.2,.64,1)",
                    background:T.progressBg,width:`${(doneCount/todayTasks.length)*100}%`}}/>
                </div>
                <div style={{fontSize:12,color:"#bbb",marginTop:5,fontWeight:700}}>{doneCount} of {todayTasks.length} done</div>
              </>)}
            </div>
            {doneCount===todayTasks.length&&todayTasks.length>0&&(
              <div className="pu" style={{textAlign:"center",background:T.celebBg,
                borderRadius:20,padding:"18px",marginBottom:16,border:`2px solid ${T.celebBorder}`}}>
                <div style={{fontSize:48}}>🎉</div>
                <div style={{fontFamily:T.fontFamily,fontSize:22,color:T.celebColor}}>All done! You rock!</div>
                <div style={{fontSize:13,color:"#7dc87d",marginTop:3}}>Cleaning superstar ⭐</div>
              </div>
            )}
            {todayTasks.length===0
              ?<Empty emoji="☀️" text="Nothing due today!" sub="Enjoy your free day 🌈"/>
              :<div style={{display:"flex",flexDirection:"column",gap:16}}>
                {morningTasks.length>0&&(
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                      <span style={{fontSize:20}}>🌅</span>
                      <div style={{fontFamily:T.fontFamily,fontSize:16,fontWeight:900,color:"#e8a020"}}>Morning</div>
                      <div style={{flex:1,height:1.5,background:"linear-gradient(90deg,#ffe4a0,transparent)",borderRadius:2}}/>
                      <div style={{fontSize:12,fontWeight:800,color:"#e8a020",background:"#fff4c2",borderRadius:8,padding:"2px 8px"}}>
                        {morningTasks.filter(t=>todayDone[t.id]).length}/{morningTasks.length}
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {morningTasks.map((task,i)=>(
                        <TaskRow key={task.id} task={task} isDone={!!todayDone[task.id]}
                          area={areas.find(a=>a.id===task.areaId)} delay={i*0.04}
                          onToggle={()=>toggleDone(task.id)} members={household?.members||[]}
                          accent="#ffe4a0"/>
                      ))}
                    </div>
                  </div>
                )}
                {anytimeTasks.length>0&&(
                  <div>
                    {(morningTasks.length>0||eveningTasks.length>0)&&(
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                        <span style={{fontSize:20}}>🕐</span>
                        <div style={{fontFamily:T.fontFamily,fontSize:16,fontWeight:900,color:"#888"}}>Anytime</div>
                        <div style={{flex:1,height:1.5,background:"linear-gradient(90deg,#e0e0e0,transparent)",borderRadius:2}}/>
                        <div style={{fontSize:12,fontWeight:800,color:"#888",background:"#f5f5f5",borderRadius:8,padding:"2px 8px"}}>
                          {anytimeTasks.filter(t=>todayDone[t.id]).length}/{anytimeTasks.length}
                        </div>
                      </div>
                    )}
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {anytimeTasks.map((task,i)=>(
                        <TaskRow key={task.id} task={task} isDone={!!todayDone[task.id]}
                          area={areas.find(a=>a.id===task.areaId)} delay={i*0.04}
                          onToggle={()=>toggleDone(task.id)} members={household?.members||[]}/>
                      ))}
                    </div>
                  </div>
                )}
                {eveningTasks.length>0&&(
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                      <span style={{fontSize:20}}>🌙</span>
                      <div style={{fontFamily:T.fontFamily,fontSize:16,fontWeight:900,color:"#7060b8"}}>Evening</div>
                      <div style={{flex:1,height:1.5,background:"linear-gradient(90deg,#c5cff5,transparent)",borderRadius:2}}/>
                      <div style={{fontSize:12,fontWeight:800,color:"#7060b8",background:"#e8e4f8",borderRadius:8,padding:"2px 8px"}}>
                        {eveningTasks.filter(t=>todayDone[t.id]).length}/{eveningTasks.length}
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {eveningTasks.map((task,i)=>(
                        <TaskRow key={task.id} task={task} isDone={!!todayDone[task.id]}
                          area={areas.find(a=>a.id===task.areaId)} delay={i*0.04}
                          onToggle={()=>toggleDone(task.id)} members={household?.members||[]}
                          accent="#c5cff5"/>
                      ))}
                    </div>
                  </div>
                )}
              </div>}

            {/* ── WEEKLY TASKS ── */}
            {weeklyTasks.length>0&&(
              <div style={{marginTop:24}}>
                {/* Weekly header */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:20}}>📋</span>
                    <div>
                      <div style={{fontFamily:T.fontFamily,fontSize:18,color:T.secondary,lineHeight:1}}>This Week</div>
                      <div style={{fontSize:11,color:"#aad4e8",fontWeight:700}}>Resets every Sunday</div>
                    </div>
                  </div>
                  <div style={{background:T.secondaryPale,borderRadius:10,padding:"4px 12px",fontSize:12,fontWeight:800,color:T.secondary}}>
                    {weeklyDoneCount}/{weeklyTasks.length} ✓
                  </div>
                </div>
                {/* Weekly progress */}
                <div style={{height:8,background:"#f5f5f5",borderRadius:20,overflow:"hidden",marginBottom:12}}>
                  <div style={{height:"100%",borderRadius:20,transition:"width .5s cubic-bezier(.34,1.2,.64,1)",
                    background:T.weekProgressBg,
                    width:`${weeklyTasks.length>0?(weeklyDoneCount/weeklyTasks.length)*100:0}%`}}/>
                </div>
                {weeklyDoneCount===weeklyTasks.length&&weeklyTasks.length>0&&(
                  <div className="pu" style={{textAlign:"center",background:T.weekCelebBg,
                    borderRadius:16,padding:"14px",marginBottom:12,border:`2px solid ${T.weekCelebBorder}`}}>
                    <div style={{fontSize:36}}>🌟</div>
                    <div style={{fontFamily:T.fontFamily,fontSize:18,color:T.weekCelebColor}}>Week complete!</div>
                  </div>
                )}
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {weeklyTasks.map((task,i)=>(
                    <TaskRow key={task.id} task={task} isDone={!!thisWeekDone[task.id]}
                      area={areas.find(a=>a.id===task.areaId)} delay={i*0.04}
                      onToggle={()=>toggleWeeklyDone(task.id)} members={household?.members||[]}
                      accent="#bae1ff"/>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CALENDAR */}
        {tab==="calendar"&&(
          <CalendarView tasks={tasks} done={done} areas={areas} members={household?.members||[]}
            calView={calView} setCalView={setCalView} calDate={calDate} setCalDate={setCalDate}
            selectedDay={selectedDay} setSelectedDay={setSelectedDay} onToggle={(id,d)=>toggleDone(id,d)}/>
        )}

        {/* TASKS */}
        {tab==="tasks"&&(
          <div className="fu">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontFamily:T.fontFamily,fontSize:22,color:T.primary}}>📋 All Tasks</div>
              <PastelBtn onClick={()=>setTaskModal({})} T={T}>＋ New Task</PastelBtn>
            </div>
            {/* Area filter chips */}
            <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:16,paddingBottom:4}}>
              <div className="bn" onClick={()=>setFilterArea(null)}
                style={{padding:"6px 14px",borderRadius:20,whiteSpace:"nowrap",flexShrink:0,
                  background:filterArea===null?"linear-gradient(135deg,#ffb3ba,#c9f0ff)":"#f5f5f5",
                  border:`2px solid ${filterArea===null?"#ff85a1":"transparent"}`,
                  fontSize:13,fontWeight:800,color:filterArea===null?"#ff6b9d":"#bbb"}}>
                🏠 All
              </div>
              <div className="bn" onClick={()=>setFilterArea("none")}
                style={{padding:"6px 14px",borderRadius:20,whiteSpace:"nowrap",flexShrink:0,
                  background:filterArea==="none"?"linear-gradient(135deg,#ffb3ba,#c9f0ff)":"#f5f5f5",
                  border:`2px solid ${filterArea==="none"?"#ff85a1":"transparent"}`,
                  fontSize:13,fontWeight:800,color:filterArea==="none"?"#ff6b9d":"#bbb"}}>
                ❓ No area
              </div>
              {areas.map(a=>(
                <div key={a.id} className="bn" onClick={()=>setFilterArea(a.id)}
                  style={{padding:"6px 14px",borderRadius:20,whiteSpace:"nowrap",flexShrink:0,
                    background:filterArea===a.id?a.color:"#f5f5f5",
                    border:`2px solid ${filterArea===a.id?a.color+"bb":"transparent"}`,
                    fontSize:13,fontWeight:800,color:filterArea===a.id?"#555":"#bbb"}}>
                  {a.emoji} {a.name}
                </div>
              ))}
            </div>
            {(() => {
              const filtered = tasks.filter(t =>
                filterArea===null ? true :
                filterArea==="none" ? !t.areaId :
                t.areaId===filterArea
              );
              return filtered.length===0
                ?<Empty emoji="🔍" text="No tasks here!" sub="Try a different filter"/>
                :<div style={{display:"flex",flexDirection:"column",gap:10}}>
                {filtered.map((task,i)=>{
                  const area=areas.find(a=>a.id===task.areaId);
                  const dep=DEPTHS.find(d=>d.label===task.depth)||DEPTHS[0];
                  return(
                    <div key={task.id} className="trow fu" style={{animationDelay:`${i*0.04}s`,background:"#fff",
                      border:`2.5px solid ${area?.color||"#ffd6e7"}`,padding:"12px 14px",
                      display:"flex",alignItems:"center",gap:12,boxShadow:`0 4px 14px ${area?.color||"#ffd6e7"}55`}}>
                      <span style={{fontSize:28,flexShrink:0}}>{task.emoji||"🏠"}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:800,color:"#444",fontSize:15,marginBottom:4}}>{task.title}</div>
                        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                          {area&&<Pill bg={area.color}>{area.emoji} {area.name}</Pill>}
                          <Pill bg={dep.color}>{dep.emoji} {dep.label}</Pill>
                          <Pill bg="#e8f4ff">{repeatLabel(task)}</Pill>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:5,flexShrink:0}}>
                        <button className="bn" onClick={()=>setTaskModal(task)}
                          style={{background:"#f5f5f5",border:"none",borderRadius:10,padding:"7px 10px",cursor:"pointer",fontSize:16}}>✏️</button>
                        <button className="bn" onClick={()=>deleteTask(task.id)}
                          style={{background:"#fff0f3",border:"none",borderRadius:10,padding:"7px 10px",cursor:"pointer",fontSize:16}}>🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>;
              })()}
          </div>
        )}

        {/* AREAS */}
        {tab==="areas"&&(
          <div className="fu">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div style={{fontFamily:T.fontFamily,fontSize:22,color:T.primary}}>🗂️ Areas</div>
              <PastelBtn onClick={()=>setAreaModal({})} T={T}>＋ New Area</PastelBtn>
            </div>
            {areas.length===0?<Empty emoji="🏡" text="No areas yet!" sub="Create Kitchen, Bathroom, Living Room…"/>
              :<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {areas.map((area,i)=>{
                  const count=tasks.filter(t=>t.areaId===area.id).length;
                  return(
                    <div key={area.id} className="fu bn" style={{animationDelay:`${i*0.05}s`,background:"#fff",
                      border:`3px solid ${area.color}`,borderRadius:22,padding:"16px",
                      boxShadow:`0 6px 22px ${area.color}55`,position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:-8,right:-8,fontSize:54,opacity:.1,userSelect:"none"}}>{area.emoji}</div>
                      <div style={{fontSize:34,marginBottom:6}}>{area.emoji||"🏠"}</div>
                      <div style={{fontWeight:900,color:"#444",fontSize:16,marginBottom:2}}>{area.name}</div>
                      <div style={{fontSize:12,color:"#bbb",marginBottom:10,fontWeight:700}}>{count} task{count!==1?"s":""}</div>
                      <div style={{display:"flex",gap:6}}>
                        <button className="bn" onClick={()=>setAreaModal(area)}
                          style={{flex:1,background:area.color+"44",border:"none",borderRadius:10,padding:"6px",
                            cursor:"pointer",fontSize:12,fontWeight:800,color:"#666",fontFamily:"inherit"}}>✏️ Edit</button>
                        <button className="bn" onClick={()=>deleteArea(area.id)}
                          style={{background:"#fff0f3",border:"none",borderRadius:10,padding:"6px 9px",cursor:"pointer",fontSize:16}}>🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>}
          </div>
        )}
      </div>

      {areaModal!==null&&<AreaModal area={areaModal.id?areaModal:null} onSave={saveArea} onClose={()=>setAreaModal(null)}/>}
      {taskModal!==null&&<TaskModal task={taskModal.id?taskModal:null} areas={areas} onSave={saveTask} onClose={()=>setTaskModal(null)}/>}
      {showAccount&&(
        <AccountSheet user={user} household={household} onInvite={sendInvite}
          onRename={renameHousehold} onLogout={onLogout} onClose={()=>setShowAccount(false)}
          themeKey={themeKey} onThemeChange={changeTheme} T={T}/>
      )}
    </div>
  );
}

// ── Task Row ───────────────────────────────────────────────────────────────────
function TaskRow({ task, isDone, area, delay=0, onToggle, members=[], accent=null }) {
  const dep=DEPTHS.find(d=>d.label===task.depth)||DEPTHS[0];
  const creator=members.find(m=>m.id===task.createdBy);
  const borderColor = isDone?"#e0e0e0": area?.color || accent || "#ffd6e7";
  return(
    <div className="trow fu" style={{animationDelay:`${delay}s`,background:isDone?"#f9f9f9":"#fff",
      border:`2.5px solid ${borderColor}`,
      padding:"12px 14px",display:"flex",alignItems:"center",gap:12,opacity:isDone?.68:1,
      boxShadow:isDone?"0 2px 6px #eee":`0 4px 16px ${area?.color||accent||"#ffd6e7"}44`}}>
      <div className="bn" onClick={onToggle}
        style={{width:32,height:32,borderRadius:10,flexShrink:0,
          border:`2.5px solid ${isDone?"#5cb85c":area?.color||accent||"#ffb3ba"}`,
          background:isDone?"#5cb85c":"transparent",display:"flex",alignItems:"center",
          justifyContent:"center",fontSize:16,color:"#fff",fontWeight:900,transition:"all .18s"}}>
        {isDone?"✓":""}
      </div>
      <span style={{fontSize:26,flexShrink:0,filter:isDone?"grayscale(1) opacity(.45)":"none"}}>{task.emoji||"🏠"}</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:800,color:isDone?"#bbb":"#444",fontSize:15,textDecoration:isDone?"line-through":"none",marginBottom:3}}>{task.title}</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
          {area&&<Pill bg={isDone?"#eee":area.color}>{area.emoji} {area.name}</Pill>}
          <Pill bg={isDone?"#eee":dep.color}>{dep.emoji} {dep.label}</Pill>
          {creator&&<Pill bg="#f5f5f5">👤 {creator.name.split(" ")[0]}</Pill>}
        </div>
      </div>
    </div>
  );
}

// ── Calendar View ──────────────────────────────────────────────────────────────
function CalendarView({ tasks, done, areas, members, calView, setCalView, calDate, setCalDate, selectedDay, setSelectedDay, onToggle }) {
  const selKey=dateKey(selectedDay),selDone=done[selKey]||{};
  const selTasks=tasks.filter(t=>isTaskDue(t,selectedDay));
  const selDoneN=selTasks.filter(t=>selDone[t.id]).length;
  const weekStart=new Date(calDate);weekStart.setDate(calDate.getDate()-calDate.getDay());
  const weekDays=Array.from({length:7},(_,i)=>{const d=new Date(weekStart);d.setDate(weekStart.getDate()+i);return d;});
  const monthFirst=new Date(calDate.getFullYear(),calDate.getMonth(),1);
  const monthLast=new Date(calDate.getFullYear(),calDate.getMonth()+1,0);
  const monthGrid=[];
  for(let i=0;i<monthFirst.getDay();i++){const d=new Date(monthFirst);d.setDate(d.getDate()-monthFirst.getDay()+i);monthGrid.push({d,out:true});}
  for(let i=1;i<=monthLast.getDate();i++)monthGrid.push({d:new Date(calDate.getFullYear(),calDate.getMonth(),i),out:false});
  while(monthGrid.length%7!==0){const d=new Date(monthGrid[monthGrid.length-1].d);d.setDate(d.getDate()+1);monthGrid.push({d,out:true});}
  const nav=(dir)=>{const d=new Date(calDate);if(calView==="week")d.setDate(d.getDate()+dir*7);else d.setMonth(d.getMonth()+dir);setCalDate(d);};
  const dotFor=(day)=>{const ts=tasks.filter(t=>isTaskDue(t,day));if(!ts.length)return null;const dk=dateKey(day);const dn=done[dk]||{};return ts.every(t=>dn[t.id])?"#5cb85c":"#ff85a1";};
  const DayChip=({day,small=false})=>{
    const isToday=sameDay(day,new Date()),isSel=sameDay(day,selectedDay),dot=dotFor(day),cnt=tasks.filter(t=>isTaskDue(t,day)).length;
    return(
      <div className="bn" onClick={()=>setSelectedDay(day)}
        style={{borderRadius:small?10:14,padding:small?"6px 2px":"8px 4px",textAlign:"center",
          background:isSel?"linear-gradient(135deg,#ffb3ba,#c9f0ff)":isToday?"#fff8e7":"transparent",
          border:`2px solid ${isSel?"#ff85a1":isToday?"#ffd6e7":"transparent"}`,
          boxShadow:isSel?"0 4px 14px rgba(255,133,161,.3)":"none"}}>
        {!small&&<div style={{fontSize:9,fontWeight:800,color:isSel?"rgba(255,255,255,.8)":"#ccc",marginBottom:2}}>{DAY_SHORT[day.getDay()]}</div>}
        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:small?13:16,color:isSel?"#fff":isToday?"#ff6b9d":"#555",lineHeight:1}}>{day.getDate()}</div>
        {dot&&<div style={{width:6,height:6,borderRadius:"50%",background:dot,margin:"3px auto 0"}}/>}
        {!small&&cnt>0&&<div style={{fontSize:9,color:isSel?"rgba(255,255,255,.7)":"#ddd",marginTop:1}}>{cnt}</div>}
      </div>
    );
  };
  return(
    <div className="fu">
      <div style={{background:"#fff",borderRadius:22,padding:"14px 16px",marginBottom:14,border:"2px solid #ffd6e7",boxShadow:"0 4px 18px rgba(255,182,193,.2)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <button className="bn" onClick={()=>nav(-1)} style={{background:"#ffd6e7",border:"none",borderRadius:12,width:36,height:36,fontSize:18,cursor:"pointer"}}>←</button>
          <div style={{fontFamily:"'Fredoka One',cursive",fontSize:17,color:"#ff6b9d",textAlign:"center"}}>
            {calView==="week"?`${weekDays[0].toLocaleDateString("en-US",{month:"short",day:"numeric"})} – ${weekDays[6].toLocaleDateString("en-US",{month:"short",day:"numeric"})}`:`${MONTH_NAMES[calDate.getMonth()]} ${calDate.getFullYear()}`}
          </div>
          <button className="bn" onClick={()=>nav(1)} style={{background:"#ffd6e7",border:"none",borderRadius:12,width:36,height:36,fontSize:18,cursor:"pointer"}}>→</button>
        </div>
        <div style={{display:"flex",gap:6,background:"#f5f5f5",borderRadius:14,padding:4}}>
          {["week","month"].map(v=>(
            <button key={v} className="bn" onClick={()=>setCalView(v)}
              style={{flex:1,padding:"7px",border:"none",borderRadius:10,fontWeight:800,fontSize:13,fontFamily:"inherit",cursor:"pointer",
                background:calView===v?"#fff":"transparent",color:calView===v?"#ff6b9d":"#bbb",
                boxShadow:calView===v?"0 2px 8px rgba(255,107,157,.18)":"none"}}>
              {v==="week"?"📅 Week":"🗓️ Month"}
            </button>
          ))}
        </div>
      </div>
      {calView==="week"&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:5,marginBottom:14,background:"#fff",borderRadius:18,padding:"10px 8px",border:"2px solid #ffd6e7",boxShadow:"0 4px 14px rgba(255,182,193,.15)"}}>
          {weekDays.map((day,i)=><DayChip key={i} day={day}/>)}
        </div>
      )}
      {calView==="month"&&(
        <div style={{background:"#fff",borderRadius:20,padding:"12px",marginBottom:14,border:"2px solid #ffd6e7",boxShadow:"0 4px 16px rgba(255,182,193,.15)"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:6}}>
            {DAY_SHORT.map(d=><div key={d} style={{textAlign:"center",fontSize:10,fontWeight:900,color:"#ffb3c6",padding:"3px 0"}}>{d}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
            {monthGrid.map(({d,out},i)=><div key={i} style={{opacity:out?.35:1}}><DayChip day={d} small/></div>)}
          </div>
        </div>
      )}
      <div style={{background:"#fff",borderRadius:22,padding:"16px",border:"2px solid #c9f0ff",boxShadow:"0 6px 20px rgba(186,225,255,.25)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontFamily:"'Fredoka One',cursive",fontSize:16,color:"#5bbfdf"}}>
            {DAY_EMOJI[selectedDay.getDay()]} {selectedDay.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}
          </div>
          <div style={{background:"#d4f5d4",borderRadius:10,padding:"3px 10px",fontSize:12,fontWeight:800,color:"#5cb85c"}}>{selDoneN}/{selTasks.length} ✓</div>
        </div>
        {selTasks.length===0?<div style={{textAlign:"center",padding:"18px",color:"#ccc",fontSize:16}}>🌈 Free day!</div>
          :<div style={{display:"flex",flexDirection:"column",gap:8}}>
            {selTasks.map((task,i)=>(
              <TaskRow key={task.id} task={task} isDone={!!selDone[task.id]}
                area={areas.find(a=>a.id===task.areaId)} delay={i*0.04}
                onToggle={()=>onToggle(task.id,selectedDay)} members={members}/>
            ))}
          </div>}
      </div>
    </div>
  );
}

// ── Account Sheet ──────────────────────────────────────────────────────────────
function AccountSheet({ user, household, onInvite, onRename, onLogout, onClose, themeKey, onThemeChange, T=THEMES.fun }) {
  const [inviteEmail,setInviteEmail]=useState("");
  const [inviteMsg,  setInviteMsg]  =useState("");
  const [inviteOk,   setInviteOk]   =useState(false);
  const [editName,   setEditName]   =useState(false);
  const [houseName,  setHouseName]  =useState(household?.name||"");
  const doInvite=async()=>{
    const err=await onInvite(inviteEmail.trim().toLowerCase());
    if(err){setInviteMsg(err);setInviteOk(false);}
    else{setInviteMsg(`Invite saved! When ${inviteEmail} signs up, they'll join your household 🎉`);setInviteOk(true);setInviteEmail("");}
  };
  return(
    <Sheet title="👤 My Account" onClose={onClose}>
      <div style={{background:"linear-gradient(135deg,#fff8f0,#f0f8ff)",border:"2px solid #ffd6e7",
        borderRadius:18,padding:"16px",marginBottom:18,display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:52,height:52,borderRadius:16,background:"linear-gradient(135deg,#ffb3ba,#c9f0ff)",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:"0 4px 12px rgba(255,182,193,.3)"}}>
          {user.authMethod==="google"&&user.avatar?.startsWith("http")
            ?<img src={user.avatar} style={{width:44,height:44,borderRadius:12}} alt=""/>
            :<span style={{fontWeight:900,fontSize:18,color:"#fff"}}>{initials(user.name)}</span>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:900,color:"#444",fontSize:16}}>{user.name}</div>
          <div style={{fontSize:12,color:"#aaa",fontWeight:700}}>{user.email}</div>
          <div style={{marginTop:4}}>
            <Pill bg={user.authMethod==="google"?"#e8f4ff":"#f5f5f5"}>{user.authMethod==="google"?"🟦 Google":"📧 Email"}</Pill>
          </div>
        </div>
      </div>
      <Label>🏠 Household Name</Label>
      {editName
        ?<div style={{display:"flex",gap:8,marginBottom:14}}>
          <input className="fi" value={houseName} onChange={e=>setHouseName(e.target.value)}
            style={{flex:1,padding:"9px 12px",borderRadius:12,border:"2px solid #ffd6e7",background:"#fff8f0",fontSize:16,color:"#444"}}/>
          <button className="bn" onClick={()=>{onRename(houseName);setEditName(false);}}
            style={{background:"#baffc9",border:"none",borderRadius:12,padding:"9px 14px",fontWeight:800,fontSize:13,color:"#555",fontFamily:"inherit",cursor:"pointer"}}>Save</button>
        </div>
        :<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,
          background:"#fff8f0",border:"2px solid #ffd6e7",borderRadius:12,padding:"10px 14px"}}>
          <span style={{fontWeight:700,color:"#444"}}>{household?.name}</span>
          <button className="bn" onClick={()=>setEditName(true)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16}}>✏️</button>
        </div>}
      <Label>👥 Members ({household?.members?.length||1})</Label>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
        {(household?.members||[]).map(m=>(
          <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,background:"#f9f9f9",borderRadius:12,padding:"10px 12px",border:"1.5px solid #f0f0f0"}}>
            <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#ffd6e7,#c9f0ff)",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#ff6b9d",flexShrink:0}}>
              {initials(m.name)}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,color:"#444",fontSize:16}}>{m.name} {m.id===user.id&&<span style={{fontSize:11,color:"#aaa"}}>(you)</span>}</div>
              <div style={{fontSize:11,color:"#bbb"}}>{m.email}</div>
            </div>
            <Pill bg={m.role==="owner"?"#fff0ba":"#f5f5f5"}>{m.role==="owner"?"👑 Owner":"👤 Member"}</Pill>
          </div>
        ))}
      </div>
      <Label>✉️ Invite Someone</Label>
      <div style={{background:"linear-gradient(135deg,#fff8f0,#f0fff8)",border:"2px solid #ffd6e7",borderRadius:16,padding:"14px",marginBottom:18}}>
        <p style={{fontSize:12,color:"#aaa",fontWeight:700,marginBottom:10,lineHeight:1.5}}>
          They'll automatically join your household when they sign up with this email 🏡
        </p>
        <div style={{display:"flex",gap:8}}>
          <input className="fi" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)}
            placeholder="friend@email.com" type="email" onKeyDown={e=>e.key==="Enter"&&doInvite()}
            style={{flex:1,padding:"9px 12px",borderRadius:12,border:"2px solid #ffd6e7",background:"#fff",fontSize:16,color:"#444",fontFamily:"inherit"}}/>
          <button className="bn" onClick={doInvite}
            style={{background:"linear-gradient(135deg,#ffb3ba,#c9f0ff)",border:"none",borderRadius:12,
              padding:"9px 14px",fontWeight:900,fontSize:13,color:"#555",fontFamily:"inherit",cursor:"pointer",whiteSpace:"nowrap"}}>
            Send 📨
          </button>
        </div>
        {inviteMsg&&(
          <div style={{marginTop:10,fontSize:13,fontWeight:700,color:inviteOk?"#5cb85c":"#e05080",
            background:inviteOk?"#f0fff4":"#fff0f3",borderRadius:10,padding:"8px 12px",
            border:`1.5px solid ${inviteOk?"#a8e6cf":"#ffb3ba"}`}}>{inviteMsg}</div>
        )}
      </div>
      <Label T={T}>🎨 App Theme</Label>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        {Object.entries(THEMES).map(([key,theme])=>(
          <div key={key} className="bn" onClick={()=>onThemeChange(key)}
            style={{padding:"14px 10px",borderRadius:16,textAlign:"center",cursor:"pointer",
              background:themeKey===key?theme.headerBg:"#f5f5f5",
              border:`2.5px solid ${themeKey===key?theme.primary:"#e0e0e0"}`,
              boxShadow:themeKey===key?`0 4px 14px ${theme.cardShadow}`:"none"}}>
            <div style={{fontSize:28,marginBottom:4}}>{theme.emoji}</div>
            <div style={{fontFamily:theme.fontFamily,fontSize:13,fontWeight:900,color:theme.primary}}>{theme.name}</div>
            <div style={{display:"flex",gap:4,justifyContent:"center",marginTop:6}}>
              {[theme.primary,theme.secondary,theme.primaryPale,theme.secondaryPale].map((c,i)=>(
                <div key={i} style={{width:14,height:14,borderRadius:"50%",background:c}}/>
              ))}
            </div>
            {themeKey===key&&<div style={{fontSize:11,fontWeight:800,color:theme.primary,marginTop:4}}>✓ Active</div>}
          </div>
        ))}
      </div>
      <button className="bn" onClick={onLogout}
        style={{width:"100%",padding:"13px",borderRadius:16,border:`2px solid ${T.primaryPale}`,background:T.inputBg,
          fontSize:16,fontWeight:900,color:"#e05080",cursor:"pointer",fontFamily:"inherit"}}>
        🚪 Sign Out
      </button>
    </Sheet>
  );
}

// ── Area Modal ─────────────────────────────────────────────────────────────────
function AreaModal({ area, onSave, onClose }) {
  const [name,setName]=useState(area?.name||"");
  const [color,setColor]=useState(area?.color||PALETTE[0]);
  const [emoji,setEmoji]=useState(area?.emoji||"🏠");
  const submit=()=>{if(!name.trim())return;onSave({...(area||{}),name:name.trim(),color,emoji});};
  return(
    <Sheet title={area?"✏️ Edit Area":"🏠 New Area"} onClose={onClose}>
      <Label>Pick an Emoji</Label>
      <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:16}}>
        {AREA_EMOJIS.map(e=>(
          <div key={e} className="bn" onClick={()=>setEmoji(e)}
            style={{width:40,height:40,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:22,cursor:"pointer",background:emoji===e?"#ffd6e7":"#f5f5f5",
              border:`2.5px solid ${emoji===e?"#ff85a1":"transparent"}`}}>{e}</div>
        ))}
      </div>
      <Label>Quick Pick</Label>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        {SUGGESTED_AREAS.map(s=>(
          <div key={s.name} className="bn" onClick={()=>{setName(s.name);setEmoji(s.emoji);setColor(s.color);}}
            style={{padding:"5px 11px",borderRadius:20,cursor:"pointer",fontSize:12,fontWeight:700,
              background: name===s.name ? s.color : "#f5f5f5",
              border:`2px solid ${name===s.name ? s.color+"bb" : "transparent"}`,
              color:"#555",display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
            {s.emoji} {s.name}
          </div>
        ))}
      </div>
      <Label>Area Name</Label>
      <FInput className="fi" value={name} onChange={e=>setName(e.target.value)} placeholder="Kitchen, Bathroom…" autoFocus onKeyDown={e=>e.key==="Enter"&&submit()}/>
      <Label>Color</Label>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
        {PALETTE.map(c=>(
          <div key={c} className="bn" onClick={()=>setColor(c)}
            style={{width:32,height:32,borderRadius:"50%",background:c,cursor:"pointer",
              border:`3px solid ${color===c?"#555":"transparent"}`,boxShadow:color===c?`0 0 0 3px ${c}88`:"none"}}/>
        ))}
      </div>
      <BigBtn onClick={submit}>{area?"Save Changes 💾":"Create Area 🎉"}</BigBtn>
    </Sheet>
  );
}

// ── Task Modal ─────────────────────────────────────────────────────────────────
function TaskModal({ task, areas, onSave, onClose }) {
  const [title,      setTitle]      =useState(task?.title||"");
  const [emoji,      setEmoji]      =useState(task?.emoji||"🧹");
  const [areaId,     setAreaId]     =useState(task?.areaId||areas[0]?.id||"");
  const [depth,      setDepth]      =useState(task?.depth||DEPTHS[0].label);
  const [repeatUnit, setRepeatUnit] =useState(task?.repeatUnit||(task?.repeat==="once"?"once":task?.repeat==="daily"?"days":task?.repeat==="monthly"?"months":"weeks"));
  const [repeatEvery,setRepeatEvery]=useState(task?.repeatEvery||1);
  const [weekDays,   setWeekDays]   =useState(task?.weekDays||[new Date().getDay()]);
  const [monthDay,   setMonthDay]   =useState(task?.monthDay||new Date().getDate());
  const [monthMode,  setMonthMode]  =useState(task?.monthMode||"date"); // "date" | "weekday"
  const [monthWeekDay,setMonthWeekDay]=useState(task?.monthWeekDay??6); // 0-6, default Sat=6
  const [monthWeekNum,setMonthWeekNum]=useState(task?.monthWeekNum||1); // 1-4
  const [taskType,   setTaskType]   =useState(task?.taskType||"daily");
  const [timeOfDay,  setTimeOfDay]  =useState(task?.timeOfDay||"anytime");
  const [notes,      setNotes]      =useState(task?.notes||"");
  const [showEM,     setShowEM]     =useState(false);
  const isOnce=repeatUnit==="once";
  const submit=()=>{if(!title.trim())return;onSave({...(task||{}),title:title.trim(),emoji,areaId,depth,taskType,timeOfDay,repeatUnit,repeatEvery:Number(repeatEvery),
    weekDays:repeatUnit==="weeks"?weekDays:null,
    monthDay:repeatUnit==="months"&&monthMode==="date"?Number(monthDay):null,
    monthMode:repeatUnit==="months"?monthMode:null,
    monthWeekDay:repeatUnit==="months"&&monthMode==="weekday"?monthWeekDay:null,
    monthWeekNum:repeatUnit==="months"&&monthMode==="weekday"?monthWeekNum:null,
    notes});};
  return(
    <Sheet title={task?"✏️ Edit Task":"📋 New Task"} onClose={onClose}>
      <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:14}}>
        <div>
          <Label>Emoji</Label>
          <div className="bn" onClick={()=>setShowEM(!showEM)}
            style={{width:54,height:54,borderRadius:16,background:"#fff8f0",border:"2.5px solid #ffd6e7",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,cursor:"pointer"}}>{emoji}</div>
        </div>
        <div style={{flex:1}}>
          <Label>What to do</Label>
          <FInput className="fi" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Mop the floor…" autoFocus/>
        </div>
      </div>
      {showEM&&(
        <div style={{display:"flex",gap:6,flexWrap:"wrap",background:"#fff8f0",borderRadius:16,padding:"10px",
          marginBottom:14,border:"2px solid #ffd6e7",maxHeight:130,overflowY:"auto"}}>
          {TASK_EMOJIS.map(e=>(
            <div key={e} className="bn" onClick={()=>{setEmoji(e);setShowEM(false);}}
              style={{width:36,height:36,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:20,cursor:"pointer",background:emoji===e?"#ffd6e7":"transparent"}}>{e}</div>
          ))}
        </div>
      )}
      <Label>Task Type</Label>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {TASK_TYPES.map(t=>(
          <div key={t.val} className="bn" onClick={()=>setTaskType(t.val)}
            style={{flex:1,padding:"9px 10px",borderRadius:13,cursor:"pointer",textAlign:"center",
              background:taskType===t.val?(t.val==="weekly"?"#c9f0ff":"#fff0ba"):"#f5f5f5",
              border:`2px solid ${taskType===t.val?(t.val==="weekly"?"#5bbfdf":"#ffcc44"):"transparent"}`,
              fontWeight:taskType===t.val?900:600,fontSize:14,color:"#555"}}>
            {t.emoji} {t.label}
          </div>
        ))}
      </div>
      <Label>Time of Day</Label>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {TIME_OF_DAY.map(t=>(
          <div key={t.val} className="bn" onClick={()=>setTimeOfDay(t.val)}
            style={{flex:1,padding:"9px 6px",borderRadius:13,cursor:"pointer",textAlign:"center",
              background:timeOfDay===t.val
                ?(t.val==="morning"?"linear-gradient(135deg,#fff4c2,#ffe4a0)"
                 :t.val==="evening"?"linear-gradient(135deg,#c5cff5,#b8b0e8)"
                 :"#f5f5f5")
                :"#f5f5f5",
              border:`2px solid ${timeOfDay===t.val
                ?(t.val==="morning"?"#f5c842"
                 :t.val==="evening"?"#8b7ec8"
                 :"#ddd")
                :"transparent"}`,
              fontWeight:timeOfDay===t.val?900:600,fontSize:13,color:"#555"}}>
            <div style={{fontSize:18,marginBottom:2}}>{t.emoji}</div>
            {t.label}
          </div>
        ))}
      </div>
      <Label>Area</Label>
      <select value={areaId} onChange={e=>setAreaId(e.target.value)}
        style={{width:"100%",background:"#fff8f0",border:"2px solid #ffd6e7",borderRadius:13,padding:"10px 12px",fontSize:16,marginBottom:14,color:"#555"}}>
        <option value="">— No area —</option>
        {areas.map(a=><option key={a.id} value={a.id}>{a.emoji} {a.name}</option>)}
      </select>
      <Label>Cleaning Depth</Label>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        {DEPTHS.map(d=>(
          <div key={d.label} className="bn" onClick={()=>setDepth(d.label)}
            style={{padding:"9px 10px",borderRadius:13,cursor:"pointer",textAlign:"center",
              background:depth===d.label?d.color:"#f5f5f5",border:`2px solid ${depth===d.label?d.color+"aa":"transparent"}`,
              fontWeight:depth===d.label?900:600,fontSize:13,color:"#555"}}>
            {d.emoji} {d.label}
          </div>
        ))}
      </div>
      {taskType==="daily"&&<>
      <Label>Repeat</Label>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
        {UNITS.map(u=>(
          <div key={u.val} className="bn" onClick={()=>setRepeatUnit(u.val)}
            style={{padding:"7px 12px",borderRadius:12,cursor:"pointer",textAlign:"center",
              background:repeatUnit===u.val?"#c9f0ff":"#f5f5f5",border:`2px solid ${repeatUnit===u.val?"#5bbfdf":"transparent"}`,
              fontWeight:repeatUnit===u.val?900:600,fontSize:13,color:"#555",whiteSpace:"nowrap"}}>
            {u.emoji} {u.label}
          </div>
        ))}
      </div>
      {!isOnce&&(
        <div style={{display:"flex",alignItems:"center",gap:10,background:"#fff8f0",border:"2px solid #ffd6e7",borderRadius:14,padding:"10px 14px",marginBottom:14}}>
          <span style={{fontSize:13,fontWeight:700,color:"#aaa",flex:1}}>Every</span>
          <button className="bn" onClick={()=>setRepeatEvery(Math.max(1,Number(repeatEvery)-1))}
            style={{width:32,height:32,borderRadius:10,background:"#ffd6e7",border:"none",fontSize:18,fontWeight:900,color:"#ff6b9d",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
          <input type="number" min="1" max="99" value={repeatEvery}
            onChange={e=>setRepeatEvery(Math.max(1,Math.min(99,Number(e.target.value)||1)))}
            style={{width:48,textAlign:"center",background:"#fff",border:"2px solid #ffd6e7",borderRadius:10,padding:"5px",fontSize:18,fontWeight:900,color:"#ff6b9d"}}/>
          <button className="bn" onClick={()=>setRepeatEvery(Math.min(99,Number(repeatEvery)+1))}
            style={{width:32,height:32,borderRadius:10,background:"#ffd6e7",border:"none",fontSize:18,fontWeight:900,color:"#ff6b9d",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>＋</button>
          <span style={{fontSize:13,fontWeight:700,color:"#aaa"}}>{Number(repeatEvery)===1?(repeatUnit||"weeks").replace(/s$/,""):repeatUnit}</span>
        </div>
      )}
      {repeatUnit==="weeks"&&(
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:900,color:"#ffb3c6",textTransform:"uppercase",letterSpacing:1.2,marginBottom:8}}>On which day(s)</div>
          <div style={{display:"flex",gap:6,justifyContent:"space-between"}}>
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d,i)=>{
              const on=weekDays.includes(i);
              return(
                <div key={d} className="bn" onClick={()=>setWeekDays(p=>on&&p.length>1?p.filter(x=>x!==i):[...p,i].sort())}
                  style={{flex:1,padding:"8px 2px",borderRadius:12,textAlign:"center",cursor:"pointer",
                    background:on?"linear-gradient(135deg,#ffb3ba,#c9f0ff)":"#f5f5f5",
                    border:`2px solid ${on?"#ff85a1":"transparent"}`,
                    fontSize:11,fontWeight:900,color:on?"#ff6b9d":"#bbb"}}>
                  {d}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {repeatUnit==="months"&&(
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:900,color:"#ffb3c6",textTransform:"uppercase",letterSpacing:1.2,marginBottom:8}}>Repeat on</div>
          {/* Mode toggle */}
          <div style={{display:"flex",gap:6,background:"#f5f5f5",borderRadius:14,padding:4,marginBottom:10}}>
            {[{val:"date",label:"📅 Specific date"},{ val:"weekday",label:"📆 Day of week"}].map(m=>(
              <div key={m.val} className="bn" onClick={()=>setMonthMode(m.val)}
                style={{flex:1,padding:"7px",borderRadius:10,textAlign:"center",fontWeight:800,fontSize:12,
                  background:monthMode===m.val?"#fff":"transparent",
                  color:monthMode===m.val?"#ff6b9d":"#bbb",
                  boxShadow:monthMode===m.val?"0 2px 8px rgba(255,107,157,.18)":"none",cursor:"pointer"}}>
                {m.label}
              </div>
            ))}
          </div>
          {/* Date mode */}
          {monthMode==="date"&&(
            <div style={{display:"flex",alignItems:"center",gap:10,background:"#fff8f0",border:"2px solid #ffd6e7",borderRadius:14,padding:"10px 14px"}}>
              <span style={{fontSize:13,fontWeight:700,color:"#aaa",flex:1}}>Day</span>
              <button className="bn" onClick={()=>setMonthDay(d=>Math.max(1,Number(d)-1))}
                style={{width:32,height:32,borderRadius:10,background:"#ffd6e7",border:"none",fontSize:18,fontWeight:900,color:"#ff6b9d",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
              <input type="number" min="1" max="31" value={monthDay}
                onChange={e=>setMonthDay(Math.max(1,Math.min(31,Number(e.target.value)||1)))}
                style={{width:48,textAlign:"center",background:"#fff",border:"2px solid #ffd6e7",borderRadius:10,padding:"5px",fontSize:18,fontWeight:900,color:"#ff6b9d"}}/>
              <button className="bn" onClick={()=>setMonthDay(d=>Math.min(31,Number(d)+1))}
                style={{width:32,height:32,borderRadius:10,background:"#ffd6e7",border:"none",fontSize:18,fontWeight:900,color:"#ff6b9d",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>＋</button>
              <span style={{fontSize:13,fontWeight:700,color:"#aaa"}}>of the month</span>
            </div>
          )}
          {/* Weekday mode */}
          {monthMode==="weekday"&&(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {/* Which occurrence */}
              <div style={{display:"flex",gap:6}}>
                {[1,2,3,4].map(n=>(
                  <div key={n} className="bn" onClick={()=>setMonthWeekNum(n)}
                    style={{flex:1,padding:"8px 4px",borderRadius:12,textAlign:"center",cursor:"pointer",
                      background:monthWeekNum===n?"linear-gradient(135deg,#ffb3ba,#c9f0ff)":"#f5f5f5",
                      border:`2px solid ${monthWeekNum===n?"#ff85a1":"transparent"}`,
                      fontSize:12,fontWeight:900,color:monthWeekNum===n?"#ff6b9d":"#bbb"}}>
                    {["1st","2nd","3rd","4th"][n-1]}
                  </div>
                ))}
              </div>
              {/* Which day */}
              <div style={{display:"flex",gap:5}}>
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d,i)=>(
                  <div key={d} className="bn" onClick={()=>setMonthWeekDay(i)}
                    style={{flex:1,padding:"8px 2px",borderRadius:12,textAlign:"center",cursor:"pointer",
                      background:monthWeekDay===i?"linear-gradient(135deg,#ffb3ba,#c9f0ff)":"#f5f5f5",
                      border:`2px solid ${monthWeekDay===i?"#ff85a1":"transparent"}`,
                      fontSize:11,fontWeight:900,color:monthWeekDay===i?"#ff6b9d":"#bbb"}}>
                    {d}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <div style={{background:"#f0fff4",border:"2px solid #a8e6cf",borderRadius:12,padding:"8px 14px",marginBottom:14,fontSize:13,fontWeight:700,color:"#5cb85c",textAlign:"center"}}>
        🔁 {isOnce?"Happens just once"
          :repeatUnit==="weeks"
            ?`Every ${repeatEvery} week${repeatEvery>1?"s":""} on ${weekDays.map(d=>["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d]).join(", ")}`
          :repeatUnit==="months"
            ?(monthMode==="weekday"
              ?`Every ${repeatEvery} month${repeatEvery>1?"s":""} on the ${["1st","2nd","3rd","4th"][monthWeekNum-1]} ${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][monthWeekDay]}`
              :`Every ${repeatEvery} month${repeatEvery>1?"s":""} on the ${monthDay}${["st","nd","rd"][((monthDay%100-11)%10>0&&(monthDay%100-11)%10<3)?(monthDay%100-11)%10-1:Math.min((monthDay%10)-1,2)]||"th"}`)
          :`Repeats every ${repeatEvery} ${Number(repeatEvery)===1?(repeatUnit||"weeks").replace(/s$/,""):repeatUnit}`}
      </div>
      </>}
      <Label>Notes (optional)</Label>
      <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="Any details… 📝"
        style={{width:"100%",background:"#fff8f0",border:"2px solid #ffd6e7",borderRadius:13,padding:"10px 12px",fontSize:16,resize:"vertical",marginBottom:16,color:"#555",fontFamily:"inherit"}}/>
      <BigBtn onClick={submit}>{task?"Save Changes 💾":"Add Task 🎉"}</BigBtn>
    </Sheet>
  );
}

// ── Sheet ──────────────────────────────────────────────────────────────────────
function Sheet({ title, onClose, children }) {
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(255,182,193,.35)",backdropFilter:"blur(4px)",
      zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="su" style={{background:"#fffbfe",borderRadius:"26px 26px 0 0",padding:"16px 18px 40px",
        width:"100%",maxWidth:520,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(255,182,193,.35)"}}>
        <div style={{width:38,height:5,background:"#ffd6e7",borderRadius:4,margin:"0 auto 16px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div style={{fontFamily:"'Fredoka One',cursive",fontSize:20,color:"#ff6b9d"}}>{title}</div>
          <button className="bn" onClick={onClose}
            style={{background:"#f5f5f5",border:"none",borderRadius:10,width:32,height:32,fontSize:16,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const Pill     =({children,bg})    =><span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 8px",borderRadius:20,background:bg||"#ffd6e7",fontSize:11,fontWeight:800,color:"#555"}}>{children}</span>;
const Label    =({children,T=THEMES.fun})=><div style={{fontSize:11,fontWeight:900,color:T.primaryLight,textTransform:"uppercase",letterSpacing:1.2,marginBottom:6,marginTop:2}}>{children}</div>;
const FInput   =(props)            =><input {...props} style={{width:"100%",background:"#fff8f0",border:"2px solid #ffd6e7",borderRadius:13,padding:"10px 12px",fontSize:16,marginBottom:14,color:"#555",...props.style}}/>;
const PastelBtn=({children,onClick,T=THEMES.fun})=><button className="bn" onClick={onClick} style={{background:T.btnGradient,border:"none",borderRadius:14,padding:"10px 16px",fontSize:13,fontWeight:900,color:T.textMain,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 14px ${T.cardShadow}`}}>{children}</button>;
const BigBtn   =({children,onClick,T=THEMES.fun})=><button className="bn" onClick={onClick} style={{width:"100%",background:T.btnBigGradient,border:"none",borderRadius:16,padding:"14px",fontSize:16,fontWeight:900,color:T.textMain,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 6px 22px ${T.cardShadow}`}}>{children}</button>;
const Empty    =({emoji,text,sub}) =><div style={{textAlign:"center",padding:"50px 20px"}}><div style={{fontSize:52,marginBottom:10}}>{emoji}</div><div style={{fontFamily:"'Fredoka One',cursive",fontSize:20,color:"#ddd",marginBottom:6}}>{text}</div><div style={{fontSize:13,color:"#ccc"}}>{sub}</div></div>;
