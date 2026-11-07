import { useState, useEffect, useRef, useCallback } from "react";
import {
  signInWithPopup, signInWithRedirect, getRedirectResult, signInWithEmailAndPassword,
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
    fontFamily: "'Fredoka One','Rubik',cursive",
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
    fontFamily: "'Nunito','Rubik',sans-serif",
  }
};

// Theme context — read from localStorage for instant load
function getTheme(user) {
  const saved = user?.theme || localStorage.getItem("hc:theme") || "fun";
  return THEMES[saved] || THEMES.fun;
}
const DAY_SHORT    = ["S","M","T","W","T","F","S"];
// ─── i18n ─────────────────────────────────────────────────────────────────────
const HE = {
  // Nav / general
  "Today":"היום","Calendar":"לוח שנה","Tasks":"משימות","Areas":"אזורים","DONE":"בוצע",
  "Happy Home":"בית שמח","Happy Home 🏡":"בית שמח 🏡","Chore Tracker ✨":"מעקב מטלות ✨","Loading…":"טוען…",
  "Save":"שמור","1 member":"חבר/ה אחד/ת","{n} members":"{n} חברים","Taking longer than usual…":"זה לוקח יותר זמן מהרגיל…","Something went wrong":"משהו השתבש",
  "Check your internet connection and try again.":"בדקו את החיבור לאינטרנט ונסו שוב.","Try again":"לנסות שוב",
  "Sign out and sign in again":"להתנתק ולהתחבר מחדש","✏️ Edit":"✏️ עריכה","(you)":"(את/ה)",
  // Auth
  "Welcome back! 👋":"ברוכים השבים! 👋","Create account 🌟":"יצירת חשבון 🌟",
  "Sign in to your household":"התחברות למשק הבית","Join or start a household":"הצטרפות או פתיחת משק בית",
  "Continue with Google":"המשך עם Google","Connecting…":"מתחבר…","or with email":"או עם אימייל",
  "Your name":"השם שלך","Email address":"כתובת אימייל","Password":"סיסמה",
  "Sign In 🚀":"התחברות 🚀","Create Account 🎉":"יצירת חשבון 🎉",
  "Don't have an account? ":"אין לך חשבון? ","Already have an account? ":"כבר יש לך חשבון? ",
  "Sign up":"הרשמה","Sign in":"התחברות",
  "Google sign-in failed. Try again 🔄":"ההתחברות עם Google נכשלה. נסו שוב 🔄",
  "Please enter a valid email 📧":"נא להזין אימייל תקין 📧",
  "Password must be at least 6 characters 🔒":"הסיסמה חייבת להכיל לפחות 6 תווים 🔒",
  "Please enter your name 👋":"נא להזין שם 👋",
  "No account with this email 🤷":"אין חשבון עם האימייל הזה 🤷","Wrong password 🔑":"סיסמה שגויה 🔑",
  "Email already registered 😅":"האימייל כבר רשום 😅","Wrong email or password 🔑":"אימייל או סיסמה שגויים 🔑",
  "Too many attempts. Try later ⏳":"יותר מדי ניסיונות. נסו מאוחר יותר ⏳",
  "💌 You've been invited to a household! Sign in or sign up to join.":"💌 הוזמנת למשק בית! התחברו או הירשמו כדי להצטרף.",
  // Join prompt
  "You've been invited!":"הוזמנת!",
  "Join this family's household? You'll see and share all of their tasks. You'll leave your current household.":"להצטרף למשק הבית של המשפחה? תראו ותשתפו את כל המשימות. תעזבו את משק הבית הנוכחי.",
  "Join household 🏡":"הצטרפות 🏡","Joining…":"מצטרף…","Not now":"לא עכשיו",
  "This invite link isn't valid anymore 😕":"קישור ההזמנה כבר לא בתוקף 😕",
  // Today
  "All done! You rock!":"הכל בוצע! כל הכבוד!","Cleaning superstar ⭐":"כוכב/ת ניקיון ⭐",
  "Nothing due today!":"אין משימות להיום!","Enjoy your free day 🌈":"תהנו מיום חופשי 🌈",
  "Morning":"בוקר","Evening":"ערב","Anytime":"כל שעה",
  "This Week":"השבוע","Resets every Sunday":"מתאפס בכל יום ראשון","Week complete!":"השבוע הושלם!",
  "{done} of {total} done":"{done} מתוך {total} בוצעו",
  // Tasks tab
  "📋 All Tasks":"📋 כל המשימות","＋ New Task":"＋ משימה חדשה","🏠 All":"🏠 הכל","❓ No area":"❓ ללא אזור",
  "No tasks here!":"אין כאן משימות!","Try a different filter":"נסו סינון אחר","📋 Weekly":"📋 שבועית",
  "No tasks yet!":"אין עדיין משימות!","Tap + New Task to get started":"לחצו על + משימה חדשה כדי להתחיל",
  // Areas tab
  "🗂️ Areas":"🗂️ אזורים","＋ New Area":"＋ אזור חדש","No areas yet!":"אין עדיין אזורים!",
  "Create Kitchen, Bathroom, Living Room…":"צרו מטבח, מקלחת, סלון…","{n} tasks":"{n} משימות","1 task":"משימה אחת",
  // Calendar
  "📅 Week":"📅 שבוע","🗓️ Month":"🗓️ חודש","🌈 Free day!":"🌈 יום חופשי!",
  // Account
  "👤 My Account":"👤 החשבון שלי","🏠 Household Name":"🏠 שם משק הבית","👥 Members":"👥 חברים",
  "👑 Owner":"👑 מנהל/ת","👤 Member":"👤 חבר/ה","🟦 Google":"🟦 Google","📧 Email":"📧 אימייל",
  "🔗 Family Invite Link":"🔗 קישור הזמנה למשפחה",
  "Send this link to family members — when they open it and sign in, they join your household 🏡":"שלחו את הקישור לבני המשפחה — כשיפתחו אותו ויתחברו, הם יצטרפו למשק הבית 🏡",
  "📋 Copy":"📋 העתקה","✓ Copied!":"✓ הועתק!","📤 Share":"📤 שיתוף",
  "✉️ Invite by Email":"✉️ הזמנה באימייל",
  "They'll automatically join your household when they sign up with this email 🏡":"הם יצטרפו אוטומטית כשיירשמו עם האימייל הזה 🏡",
  "Send 📨":"שליחה 📨","Invalid email 📧":"אימייל לא תקין 📧","Already a member 😊":"כבר חבר/ה במשק הבית 😊",
  "Invite saved! When {email} signs up, they'll join your household 🎉":"ההזמנה נשמרה! כש-{email} יירשם/תירשם, הוא/היא יצטרפו למשק הבית 🎉",
  "Join our household \"{name}\" on Happy Home!":"הצטרפו למשק הבית \"{name}\" באפליקציית בית שמח!",
  "🎨 App Theme":"🎨 עיצוב","✓ Active":"✓ פעיל","🚪 Sign Out":"🚪 התנתקות","🌐 Language":"🌐 שפה",
  "Fun & Colorful":"צבעוני ושמח","Calm & Natural":"רגוע וטבעי",
  // Area modal
  "✏️ Edit Area":"✏️ עריכת אזור","🏠 New Area":"🏠 אזור חדש","Pick an Emoji":"בחרו אימוג׳י","Quick Pick":"בחירה מהירה",
  "Area Name":"שם האזור","Kitchen, Bathroom…":"מטבח, מקלחת…","Color":"צבע",
  "Save Changes 💾":"שמירת שינויים 💾","Create Area 🎉":"יצירת אזור 🎉",
  // Task modal
  "✏️ Edit Task":"✏️ עריכת משימה","📋 New Task":"📋 משימה חדשה","Emoji":"אימוג׳י","What to do":"מה לעשות",
  "Mop the floor…":"לשטוף את הרצפה…","Task Type":"סוג משימה","Daily task":"משימה יומית","Weekly task":"משימה שבועית",
  "Who does it?":"מי עושה?","👨‍👩‍👧 Anyone":"👨‍👩‍👧 כל אחד",
  "Invite family from settings to assign tasks to them":"הזמינו את המשפחה מההגדרות כדי לשייך להם משימות",
  "Time of Day":"זמן ביום","Area":"אזור","— No area —":"— ללא אזור —","Cleaning Depth":"עומק ניקיון",
  "Quick Tidy":"סידור מהיר","Light Clean":"ניקיון קל","Thorough Clean":"ניקיון יסודי","Deep Clean":"ניקיון עמוק",
  "Repeat":"חזרה","Day(s)":"ימים","Week(s)":"שבועות","Month(s)":"חודשים","Year(s)":"שנים","Just Once":"פעם אחת",
  "Every":"כל","On which day(s)":"באילו ימים","Repeat on":"לחזור ב","📅 Specific date":"📅 תאריך קבוע",
  "📆 Day of week":"📆 יום בשבוע","Day":"יום","of the month":"בחודש",
  "Happens just once":"פעם אחת בלבד","Just once 1️⃣":"פעם אחת 1️⃣",
  "Notes (optional)":"הערות (לא חובה)","Any details… 📝":"פרטים נוספים… 📝","Add Task 🎉":"הוספת משימה 🎉",
  // Suggested / default area names
  "Kitchen":"מטבח","Living Room":"סלון","Guest Bathroom":"שירותי אורחים","Kids Bathroom":"שירותי ילדים",
  "Parents Bathroom":"שירותי הורים","Office":"משרד","Master Bedroom":"חדר הורים","Printer Room":"חדר מדפסת",
  "Safe Room":"ממ״ד","Balcony":"מרפסת","Laundry Room":"חדר כביסה",
};
let LANG = (typeof localStorage!=="undefined" && localStorage.getItem("hc:lang")) || "en";
function applyLang(l) {
  LANG = l==="he" ? "he" : "en";
  try { localStorage.setItem("hc:lang", LANG); } catch {}
  document.documentElement.dir  = LANG==="he" ? "rtl" : "ltr";
  document.documentElement.lang = LANG;
}
applyLang(LANG);
const tr  = (s) => (LANG==="he" && HE[s]) || s;
const trf = (s, vars={}) => Object.entries(vars).reduce((acc,[k,v])=>acc.split(`{${k}}`).join(v), tr(s));
const LOCALE   = () => LANG==="he" ? "he-IL" : "en-US";
const DAY_SHORT_L = () => LANG==="he" ? ["א","ב","ג","ד","ה","ו","ש"] : ["S","M","T","W","T","F","S"];
const DAY_NAMES   = () => LANG==="he" ? ["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"] : ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAY_FULL    = () => LANG==="he" ? ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"] : ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const ORDINALS    = () => LANG==="he" ? ["ה-1","ה-2","ה-3","ה-4"] : ["1st","2nd","3rd","4th"];
const UNIT_WORDS = {
  en:{ days:["day","days"], weeks:["week","weeks"], months:["month","months"], years:["year","years"] },
  he:{ days:["יום","ימים"], weeks:["שבוע","שבועות"], months:["חודש","חודשים"], years:["שנה","שנים"] },
};
const unitWord  = (n,u) => (UNIT_WORDS[LANG][u]||UNIT_WORDS[LANG].weeks)[Number(n)===1?0:1];
const everyText = (n,u) => Number(n)===1
  ? (LANG==="he" ? `כל ${unitWord(1,u)}` : `Every ${unitWord(1,u)}`)
  : (LANG==="he" ? `כל ${n} ${unitWord(n,u)}` : `Every ${n} ${unitWord(n,u)}`);
const ordEn = (d) => d + (["th","st","nd","rd"][((d%100-20)%10+10)%10<4 && !(d%100>=11&&d%100<=13) ? ((d%100-20)%10+10)%10 : 0]);
function repeatSummary({ unit, every, weekDays, monthMode, monthDay, monthWeekNum, monthWeekDay }) {
  if (unit==="once") return tr("Happens just once");
  const base = everyText(every, unit);
  if (unit==="weeks" && weekDays?.length) {
    const days = weekDays.map(d=>DAY_FULL()[d]).join(", ");
    return LANG==="he" ? `${base}, בימים: ${days}` : `${base} on ${days}`;
  }
  if (unit==="months") {
    if (monthMode==="weekday" && monthWeekNum) {
      return LANG==="he"
        ? `${base}, ביום ${DAY_FULL()[monthWeekDay]} ${ORDINALS()[monthWeekNum-1]} בחודש`
        : `${base} on the ${ORDINALS()[monthWeekNum-1]} ${DAY_FULL()[monthWeekDay]}`;
    }
    if (monthDay) return LANG==="he" ? `${base}, ב-${monthDay} לחודש` : `${base} on the ${ordEn(monthDay)}`;
  }
  return base;
}

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
  if (task.repeatUnit==="once"||task.repeat==="once") return tr("Just once 1️⃣");
  const u=task.repeatUnit||"weeks";
  return `${repeatSummary({unit:u,every:task.repeatEvery||1,weekDays:task.weekDays,monthMode:task.monthMode,monthDay:task.monthDay,monthWeekNum:task.monthWeekNum,monthWeekDay:task.monthWeekDay})} ${UNITS.find(x=>x.val===u)?.emoji||""}`;
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
  const [user, setUser]         = useState(undefined); // undefined = loading
  const [fbUser, setFbUser]     = useState(null);
  const [joinOffer, setJoinOffer] = useState(null);   // household id an existing user was invited to
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [bootError, setBootError] = useState(null);
  const bootStep = useRef("auth");

  useEffect(() => {
    // Capture ?join=<householdId> from an invite link, then clean the URL
    const p = new URLSearchParams(window.location.search).get("join");
    if (p) {
      localStorage.setItem("hc:join", p);
      window.history.replaceState({}, "", window.location.pathname);
    }

    const timeout = setTimeout(() => setBootError(e => e || `timeout:${bootStep.current}`), 10000);
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
     try {
      if (!firebaseUser) { clearTimeout(timeout); setUser(null); return; }
      bootStep.current = "profile";
      setFbUser(firebaseUser);
      const userRef = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(userRef);
      const pendingJoin = localStorage.getItem("hc:join");

      if (snap.exists()) {
        const existing = { id: firebaseUser.uid, ...snap.data() };
        setUser(existing);
        if (pendingJoin && pendingJoin !== existing.householdId) setJoinOffer(pendingJoin);
        else localStorage.removeItem("hc:join");
        return;
      }

      // ── First login ──
      bootStep.current = "new-user";
      const email = (firebaseUser.email || "").toLowerCase();
      let target = pendingJoin;
      if (!target) {
        try {
          const inv = await getDoc(doc(db, "invites", email));
          if (inv.exists()) target = inv.data().householdId;
        } catch {}
      }
      const userData = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || email.split("@")[0],
        email,
        avatar: firebaseUser.photoURL || GOOGLE_AVATARS[Math.floor(Math.random()*GOOGLE_AVATARS.length)],
        householdId: target || uid(),
        authMethod: firebaseUser.providerData[0]?.providerId==="google.com"?"google":"email",
        createdAt: serverTimestamp(),
      };
      await setDoc(userRef, userData);

      if (target) {
        const ok = await addSelfToHousehold(userData, target);
        localStorage.removeItem("hc:join");
        if (ok) { setUser(userData); return; }
        // Bad link — fall back to a fresh household
        userData.householdId = uid();
        await updateDoc(userRef, { householdId: userData.householdId });
      }
      await createHousehold(userData);
      setUser(userData);
     } catch (err) {
      console.error("Startup failed:", err);
      setBootError(err?.code || err?.message || String(err));
     } finally {
      clearTimeout(timeout);
     }
    });
    return () => { clearTimeout(timeout); unsub(); };
  }, []);

  const acceptJoin = async () => {
    setJoinBusy(true); setJoinError("");
    const oldHid = user.householdId;
    // 1. Leave the current household (allowed while we still belong to it)
    try {
      const oldSnap = await getDoc(doc(db, "households", oldHid));
      if (oldSnap.exists()) {
        await updateDoc(doc(db, "households", oldHid), {
          members: (oldSnap.data().members||[]).filter(m=>m.id!==user.id)
        });
      }
    } catch {}
    // 2. Switch + join the new one
    await updateDoc(doc(db, "users", user.id), { householdId: joinOffer });
    const ok = await addSelfToHousehold(user, joinOffer);
    if (!ok) {
      await updateDoc(doc(db, "users", user.id), { householdId: oldHid });
      try {
        await updateDoc(doc(db, "households", oldHid), {
          members: arrayUnion({ id:user.id, name:user.name, email:user.email, avatar:user.avatar||"", role:"owner" })
        });
      } catch {}
      setJoinError(tr("This invite link isn't valid anymore 😕"));
      setJoinBusy(false);
      return;
    }
    localStorage.removeItem("hc:join");
    setUser(u => ({ ...u, householdId: joinOffer }));
    setJoinOffer(null);
    setJoinBusy(false);
  };
  const declineJoin = () => { localStorage.removeItem("hc:join"); setJoinOffer(null); };

  const logout = () => signOut(auth);

  if (user === undefined) return bootError ? <BootError error={bootError}/> : <Splash/>;
  if (!user) return <AuthScreen/>;
  if (joinOffer) return <JoinPrompt busy={joinBusy} error={joinError} onAccept={acceptJoin} onDecline={declineJoin}/>;
  return <App user={user} fbUser={fbUser} onLogout={logout}/>;
}

// Adds the user to a household's members list. Requires the user doc to already point at it.
async function addSelfToHousehold(u, hid) {
  try {
    const ref = doc(db, "households", hid);
    const hs = await getDoc(ref);
    if (!hs.exists() || hs.data().deleted) return false;
    const members = (hs.data().members||[]).filter(m=>m.id!==u.id);
    members.push({ id:u.id, name:u.name, email:u.email, avatar:u.avatar||"", role:"member" });
    await updateDoc(ref, { members });
    return true;
  } catch { return false; }
}

async function createHousehold(u) {
  const hid = u.householdId;
  await setDoc(doc(db, "households", hid), {
    id: hid,
    name: `${u.name.split(" ")[0]}'s Home`,
    members: [{ id:u.id, name:u.name, email:u.email, avatar:u.avatar||"", role:"owner" }],
    createdAt: serverTimestamp(),
  });
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
}

// ── Join prompt (existing user opened an invite link) ──────────────────────────
function JoinPrompt({ busy, error, onAccept, onDecline }) {
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,
      background:"radial-gradient(ellipse at 30% 0%,#ffe8f0,#fff8e7 50%,#e8f4ff)",fontFamily:"'Nunito','Rubik','Segoe UI',sans-serif"}}>
      <div style={{background:"#fff",borderRadius:28,padding:"28px 24px",width:"100%",maxWidth:400,textAlign:"center",
        boxShadow:"0 12px 48px rgba(255,182,193,.3)",border:"2px solid #ffd6e7"}}>
        <div style={{fontSize:54,marginBottom:8}}>💌</div>
        <div style={{fontFamily:"'Fredoka One','Rubik',cursive",fontSize:22,color:"#ff6b9d",marginBottom:8}}>{tr("You've been invited!")}</div>
        <p style={{fontSize:14,color:"#888",fontWeight:600,lineHeight:1.6,marginBottom:20}}>
          {tr("Join this family's household? You'll see and share all of their tasks. You'll leave your current household.")}
        </p>
        {error&&<div style={{background:"#fff0f3",border:"2px solid #ffb3ba",borderRadius:12,padding:"10px",marginBottom:14,fontSize:13,fontWeight:700,color:"#e05080"}}>{error}</div>}
        <button onClick={onAccept} disabled={busy}
          style={{width:"100%",padding:"13px",borderRadius:16,border:"none",cursor:"pointer",fontFamily:"inherit",marginBottom:10,
            background:"linear-gradient(135deg,#ffb3ba,#ffd6a5,#c9f0ff)",fontSize:16,fontWeight:900,color:"#555",opacity:busy?.6:1}}>
          {busy?tr("Joining…"):tr("Join household 🏡")}
        </button>
        <button onClick={onDecline} disabled={busy}
          style={{width:"100%",padding:"12px",borderRadius:16,border:"2px solid #eee",background:"#fff",cursor:"pointer",
            fontFamily:"inherit",fontSize:15,fontWeight:800,color:"#aaa"}}>
          {tr("Not now")}
        </button>
      </div>
    </div>
  );
}

// ── Startup error (instead of an endless loading screen) ─────────────────────
function BootError({ error }) {
  const isTimeout = String(error).startsWith("timeout");
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:24,
      background:"linear-gradient(135deg,#ffd6e7,#fff0ba,#c9f0ff)",fontFamily:"'Nunito','Rubik',system-ui,sans-serif"}}>
      <div style={{background:"#fff",borderRadius:24,padding:"24px 20px",maxWidth:380,width:"100%",textAlign:"center",
        boxShadow:"0 12px 40px rgba(255,182,193,.3)",border:"2px solid #ffd6e7"}}>
        <div style={{fontSize:48,marginBottom:6}}>{isTimeout?"⏳":"😕"}</div>
        <div style={{fontSize:20,fontWeight:900,color:"#ff6b9d",marginBottom:8}}>
          {isTimeout?tr("Taking longer than usual…"):tr("Something went wrong")}
        </div>
        <p style={{fontSize:14,color:"#999",fontWeight:600,lineHeight:1.5,marginBottom:14}}>
          {tr("Check your internet connection and try again.")}
        </p>
        <div style={{fontSize:11,color:"#bbb",fontFamily:"monospace",wordBreak:"break-all",marginBottom:14}}>{error}</div>
        <button onClick={()=>window.location.reload()}
          style={{width:"100%",padding:"13px",borderRadius:14,border:"none",cursor:"pointer",fontFamily:"inherit",marginBottom:10,
            background:"linear-gradient(135deg,#ffb3ba,#ffd6a5,#c9f0ff)",fontSize:16,fontWeight:900,color:"#555"}}>
          🔄 {tr("Try again")}
        </button>
        <button onClick={async()=>{ try{ await signOut(auth); }catch{} window.location.reload(); }}
          style={{width:"100%",padding:"12px",borderRadius:14,border:"2px solid #eee",background:"#fff",cursor:"pointer",
            fontFamily:"inherit",fontSize:15,fontWeight:800,color:"#aaa"}}>
          🚪 {tr("Sign out and sign in again")}
        </button>
      </div>
    </div>
  );
}

// ── Splash ─────────────────────────────────────────────────────────────────────
const APP_VERSION = "1107-d";
function Splash() {
  const [slow, setSlow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setSlow(true), 6000); return () => clearTimeout(t); }, []);
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",
      background:"linear-gradient(135deg,#ffd6e7,#fff0ba,#c9f0ff)",fontFamily:"'Nunito','Rubik',system-ui,sans-serif"}}>
      <div style={{textAlign:"center",padding:20}}>
        <div style={{fontSize:64,marginBottom:8}}>🏡</div>
        <div style={{fontFamily:"'Fredoka One','Rubik',system-ui,sans-serif",fontWeight:800,fontSize:28,color:"#ff6b9d"}}>{tr("Happy Home")}</div>
        <div style={{fontSize:13,color:"#ffb3c6",marginTop:6}}>{tr("Loading…")}</div>
        {slow&&(
          <div style={{marginTop:24}}>
            <button onClick={()=>window.location.reload()}
              style={{display:"block",width:240,margin:"0 auto 10px",padding:"11px",borderRadius:14,border:"none",cursor:"pointer",
                background:"#fff",fontSize:15,fontWeight:800,color:"#ff6b9d",fontFamily:"inherit"}}>🔄 {tr("Try again")}</button>
            <button onClick={async()=>{ try{ await signOut(auth); }catch{} try{ localStorage.clear(); indexedDB.deleteDatabase("firebaseLocalStorageDb"); }catch{} window.location.reload(); }}
              style={{display:"block",width:240,margin:"0 auto",padding:"11px",borderRadius:14,border:"2px solid #fff",cursor:"pointer",
                background:"transparent",fontSize:14,fontWeight:800,color:"#c06080",fontFamily:"inherit"}}>🚪 {tr("Sign out and sign in again")}</button>
          </div>
        )}
        <div style={{fontSize:10,color:"#d8b8c8",marginTop:18}}>v{APP_VERSION}</div>
      </div>
    </div>
  );
}

// ── Auth Screen ────────────────────────────────────────────────────────────────
function AuthScreen() {
  const T = THEMES[localStorage.getItem("hc:theme")] || THEMES.fun;
  const [, forceLang] = useState(LANG);
  const [mode,    setMode]    = useState("login");
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [pass,    setPass]    = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass,setShowPass]= useState(false);

  // Surface errors coming back from a redirect sign-in
  useEffect(() => {
    getRedirectResult(auth).catch(e => {
      console.error("Redirect sign-in failed:", e);
      setError(`${tr("Google sign-in failed. Try again 🔄")} (${e.code||e.message})`);
    });
  }, []);

  const handleGoogle = async () => {
    setLoading(true); setError("");
    // Home-screen apps (and iPhone in general) can't use popups reliably → full-page redirect
    const isStandalone = window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1);
    try {
      if (isStandalone || isIOS) {
        await signInWithRedirect(auth, googleProvider);
        return; // page navigates away
      }
      await signInWithPopup(auth, googleProvider);
    } catch(e) {
      console.error("Google sign-in failed:", e);
      setError(`${tr("Google sign-in failed. Try again 🔄")} (${e.code||e.message})`);
      setLoading(false);
    }
  };

  const handleEmail = async (e) => {
    e.preventDefault(); setError("");
    if(!validateEmail(email)) { setError(tr("Please enter a valid email 📧")); return; }
    if(pass.length<6)         { setError(tr("Password must be at least 6 characters 🔒")); return; }
    if(mode==="signup"&&!name.trim()) { setError(tr("Please enter your name 👋")); return; }
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
        "auth/user-not-found":      tr("No account with this email 🤷"),
        "auth/wrong-password":      tr("Wrong password 🔑"),
        "auth/email-already-in-use":tr("Email already registered 😅"),
        "auth/invalid-credential":  tr("Wrong email or password 🔑"),
        "auth/too-many-requests":   tr("Too many attempts. Try later ⏳"),
      };
      setError(msgs[e.code] || `Error: ${e.message}`);
      setLoading(false);
    }
  };

  const isLogin = mode==="login";
  return (
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 30% 0%,#ffe8f0,#fff8e7 50%,#e8f4ff)",
      fontFamily:"'Nunito','Rubik','Segoe UI',sans-serif",display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",padding:20}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&family=Rubik:wght@400;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .bn{transition:transform .12s;cursor:pointer;}.bn:hover{transform:scale(1.04);}.bn:active{transform:scale(.97);}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp .3s ease forwards;}
        input{font-family:inherit;outline:none;}
        .fi:focus{border-color:#ff85a1!important;box-shadow:0 0 0 3px rgba(255,133,161,.15);}
      `}</style>
      <div style={{display:"flex",gap:4,background:"rgba(255,255,255,.7)",borderRadius:12,padding:3,marginBottom:16}}>
        {[{key:"en",label:"EN"},{key:"he",label:"עב"}].map(l=>(
          <button key={l.key} onClick={()=>{applyLang(l.key);forceLang(l.key);}}
            style={{border:"none",borderRadius:9,padding:"5px 12px",cursor:"pointer",fontFamily:"inherit",fontWeight:900,fontSize:13,
              background:LANG===l.key?"#fff":"transparent",color:LANG===l.key?"#ff6b9d":"#bbb",
              boxShadow:LANG===l.key?"0 2px 6px rgba(255,133,161,.2)":"none"}}>{l.label}</button>
        ))}
      </div>
      <div className="fu" style={{textAlign:"center",marginBottom:28}}>
        <div style={{fontSize:54,marginBottom:6}}>🏡</div>
        <div style={{fontFamily:T.fontFamily,fontSize:26,color:T.primary}}>{tr("Happy Home")}</div>
        <div style={{fontSize:11,color:"#ffb3c6",fontWeight:800,letterSpacing:2,textTransform:"uppercase",marginTop:2}}>{tr("Chore Tracker ✨")}</div>
      </div>
      <div className="fu" style={{background:"#fff",borderRadius:28,padding:"28px 24px",width:"100%",maxWidth:400,
        boxShadow:"0 12px 48px rgba(255,182,193,.3)",border:"2px solid #ffd6e7"}}>
        {localStorage.getItem("hc:join")&&(
          <div style={{background:"linear-gradient(135deg,#fff0ba,#ffd6e7)",borderRadius:14,padding:"10px 14px",marginBottom:16,
            textAlign:"center",fontSize:13,fontWeight:800,color:"#c06080"}}>
            {tr("💌 You've been invited to a household! Sign in or sign up to join.")}
          </div>
        )}
        <h2 style={{fontFamily:"'Fredoka One','Rubik',cursive",fontSize:22,color:"#ff6b9d",marginBottom:4,textAlign:"center"}}>
          {isLogin?tr("Welcome back! 👋"):tr("Create account 🌟")}
        </h2>
        <p style={{fontSize:13,color:"#bbb",textAlign:"center",marginBottom:22,fontWeight:600}}>
          {isLogin?tr("Sign in to your household"):tr("Join or start a household")}
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
          {loading?tr("Connecting…"):tr("Continue with Google")}
        </button>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <div style={{flex:1,height:1,background:"#f0f0f0"}}/>
          <span style={{fontSize:12,color:"#ccc",fontWeight:700}}>{tr("or with email")}</span>
          <div style={{flex:1,height:1,background:"#f0f0f0"}}/>
        </div>
        <form onSubmit={handleEmail}>
          {!isLogin&&(
            <div style={{position:"relative",marginBottom:12}}>
              <span style={{position:"absolute",insetInlineStart:12,top:"50%",transform:"translateY(-50%)",fontSize:16}}>👤</span>
              <input className="fi" value={name} onChange={e=>setName(e.target.value)} placeholder={tr("Your name")} type="text"
                style={{width:"100%",paddingBlock:11,paddingInlineStart:40,paddingInlineEnd:12,borderRadius:13,border:"2px solid #f0f0f0",background:"#fff8f0",fontSize:16,color:"#444"}}/>
            </div>
          )}
          <div style={{position:"relative",marginBottom:12}}>
            <span style={{position:"absolute",insetInlineStart:12,top:"50%",transform:"translateY(-50%)",fontSize:16}}>📧</span>
            <input className="fi" value={email} onChange={e=>setEmail(e.target.value)} placeholder={tr("Email address")} type="email"
              style={{width:"100%",paddingBlock:11,paddingInlineStart:40,paddingInlineEnd:12,borderRadius:13,border:"2px solid #f0f0f0",background:"#fff8f0",fontSize:16,color:"#444"}}/>
          </div>
          <div style={{position:"relative",marginBottom:14}}>
            <span style={{position:"absolute",insetInlineStart:12,top:"50%",transform:"translateY(-50%)",fontSize:16}}>🔒</span>
            <input className="fi" value={pass} onChange={e=>setPass(e.target.value)} placeholder={tr("Password")} type={showPass?"text":"password"}
              style={{width:"100%",paddingBlock:11,paddingInline:40,borderRadius:13,border:"2px solid #f0f0f0",background:"#fff8f0",fontSize:16,color:"#444"}}/>
            <button type="button" onClick={()=>setShowPass(!showPass)}
              style={{position:"absolute",insetInlineEnd:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#ccc",padding:0}}>
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
            {loading?tr("Loading…"):isLogin?tr("Sign In 🚀"):tr("Create Account 🎉")}
          </button>
        </form>
        <p style={{textAlign:"center",marginTop:18,fontSize:13,color:"#bbb",fontWeight:700}}>
          {isLogin?tr("Don't have an account? "):tr("Already have an account? ")}
          <span onClick={()=>{setMode(isLogin?"signup":"login");setError("");}}
            style={{color:"#ff6b9d",cursor:"pointer",textDecoration:"underline"}}>
            {isLogin?tr("Sign up"):tr("Sign in")}
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

  const [lang, setLangState] = useState(() => {
    if (user?.lang && user.lang!==LANG) applyLang(user.lang);
    return LANG;
  });
  const changeLang = async (l) => {
    applyLang(l); setLangState(l);
    try { await updateDoc(doc(db, "users", user.id), { lang: l }); } catch {}
  };
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
    if(!validateEmail(email)) return tr("Invalid email 📧");
    if(household?.members?.find(m=>m.email===email)) return tr("Already a member 😊");
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
    {id:"today",emoji:"☀️",label:tr("Today")},
    {id:"calendar",emoji:"📅",label:tr("Calendar")},
    {id:"tasks",emoji:"📋",label:tr("Tasks")},
    {id:"areas",emoji:"🗂️",label:tr("Areas")},
  ];

  return (
    <div style={{minHeight:"100vh",background:T.pageBg,
      fontFamily:"'Nunito','Rubik','Segoe UI',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&family=Rubik:wght@400;600;700;800;900&display=swap');
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
                {(household?.members?.length||1)===1?tr("1 member"):trf("{n} members",{n:household.members.length})} ✨
              </div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {tab==="today"&&(
              <div style={{background:"rgba(255,255,255,.55)",borderRadius:14,padding:"5px 12px",textAlign:"center"}}>
                <div style={{fontFamily:T.fontFamily,fontSize:20,color:doneCount===todayTasks.length&&todayTasks.length>0?"#5cb85c":T.primary,lineHeight:1}}>{doneCount}/{todayTasks.length}</div>
                <div style={{fontSize:9,color:T.primaryLight,fontWeight:800,letterSpacing:1}}>{tr("DONE")}</div>
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
              <div style={{fontSize:16,marginBottom:1}}>{t.emoji}</div>{tr(t.label)}
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
              <div style={{fontFamily:"'Fredoka One','Rubik',cursive",fontSize:26,color:"#ff6b9d"}}>
                {new Date().toLocaleDateString(LOCALE(),{weekday:"long"})}
              </div>
              <div style={{color:"#ccc",fontSize:13,fontWeight:700,marginBottom:todayTasks.length?12:0}}>
                {new Date().toLocaleDateString(LOCALE(),{month:"long",day:"numeric",year:"numeric"})}
              </div>
              {todayTasks.length>0&&(<>
                <div style={{height:10,background:"#f5f5f5",borderRadius:20,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:20,transition:"width .55s cubic-bezier(.34,1.2,.64,1)",
                    background:T.progressBg,width:`${(doneCount/todayTasks.length)*100}%`}}/>
                </div>
                <div style={{fontSize:12,color:"#bbb",marginTop:5,fontWeight:700}}>{trf("{done} of {total} done",{done:doneCount,total:todayTasks.length})}</div>
              </>)}
            </div>
            {doneCount===todayTasks.length&&todayTasks.length>0&&(
              <div className="pu" style={{textAlign:"center",background:T.celebBg,
                borderRadius:20,padding:"18px",marginBottom:16,border:`2px solid ${T.celebBorder}`}}>
                <div style={{fontSize:48}}>🎉</div>
                <div style={{fontFamily:T.fontFamily,fontSize:22,color:T.celebColor}}>{tr("All done! You rock!")}</div>
                <div style={{fontSize:13,color:"#7dc87d",marginTop:3}}>{tr("Cleaning superstar ⭐")}</div>
              </div>
            )}
            {todayTasks.length===0
              ?<Empty emoji="☀️" text={tr("Nothing due today!")} sub={tr("Enjoy your free day 🌈")}/>
              :<div style={{display:"flex",flexDirection:"column",gap:16}}>
                {morningTasks.length>0&&(
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                      <span style={{fontSize:20}}>🌅</span>
                      <div style={{fontFamily:T.fontFamily,fontSize:16,fontWeight:900,color:"#e8a020"}}>{tr("Morning")}</div>
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
                        <div style={{fontFamily:T.fontFamily,fontSize:16,fontWeight:900,color:"#888"}}>{tr("Anytime")}</div>
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
                      <div style={{fontFamily:T.fontFamily,fontSize:16,fontWeight:900,color:"#7060b8"}}>{tr("Evening")}</div>
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
                      <div style={{fontFamily:T.fontFamily,fontSize:18,color:T.secondary,lineHeight:1}}>{tr("This Week")}</div>
                      <div style={{fontSize:11,color:"#aad4e8",fontWeight:700}}>{tr("Resets every Sunday")}</div>
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
                    <div style={{fontFamily:T.fontFamily,fontSize:18,color:T.weekCelebColor}}>{tr("Week complete!")}</div>
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
              <div style={{fontFamily:T.fontFamily,fontSize:22,color:T.primary}}>{tr("📋 All Tasks")}</div>
              <PastelBtn onClick={()=>setTaskModal({})} T={T}>{tr("＋ New Task")}</PastelBtn>
            </div>
            {/* Area filter chips */}
            <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:16,paddingBottom:4}}>
              <div className="bn" onClick={()=>setFilterArea(null)}
                style={{padding:"6px 14px",borderRadius:20,whiteSpace:"nowrap",flexShrink:0,
                  background:filterArea===null?"linear-gradient(135deg,#ffb3ba,#c9f0ff)":"#f5f5f5",
                  border:`2px solid ${filterArea===null?"#ff85a1":"transparent"}`,
                  fontSize:13,fontWeight:800,color:filterArea===null?"#ff6b9d":"#bbb"}}>
                {tr("🏠 All")}
              </div>
              <div className="bn" onClick={()=>setFilterArea("none")}
                style={{padding:"6px 14px",borderRadius:20,whiteSpace:"nowrap",flexShrink:0,
                  background:filterArea==="none"?"linear-gradient(135deg,#ffb3ba,#c9f0ff)":"#f5f5f5",
                  border:`2px solid ${filterArea==="none"?"#ff85a1":"transparent"}`,
                  fontSize:13,fontWeight:800,color:filterArea==="none"?"#ff6b9d":"#bbb"}}>
                {tr("❓ No area")}
              </div>
              {areas.map(a=>(
                <div key={a.id} className="bn" onClick={()=>setFilterArea(a.id)}
                  style={{padding:"6px 14px",borderRadius:20,whiteSpace:"nowrap",flexShrink:0,
                    background:filterArea===a.id?a.color:"#f5f5f5",
                    border:`2px solid ${filterArea===a.id?a.color+"bb":"transparent"}`,
                    fontSize:13,fontWeight:800,color:filterArea===a.id?"#555":"#bbb"}}>
                  {a.emoji} {tr(a.name)}
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
                ?<Empty emoji="🔍" text={tr("No tasks here!")} sub={tr("Try a different filter")}/>
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
                          {area&&<Pill bg={area.color}>{area.emoji} {tr(area.name)}</Pill>}
                          <Pill bg={dep.color}>{dep.emoji} {tr(dep.label)}</Pill>
                          <Pill bg="#e8f4ff">{task.taskType==="weekly"?tr("📋 Weekly"):repeatLabel(task)}</Pill>
                          {(task.assignedTo||[]).length>0&&<Pill bg="#fff0ba">👤 {(task.assignedTo||[]).map(id=>household?.members?.find(m=>m.id===id)?.name.split(" ")[0]).filter(Boolean).join(", ")}</Pill>}
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
              <div style={{fontFamily:T.fontFamily,fontSize:22,color:T.primary}}>{tr("🗂️ Areas")}</div>
              <PastelBtn onClick={()=>setAreaModal({})} T={T}>{tr("＋ New Area")}</PastelBtn>
            </div>
            {areas.length===0?<Empty emoji="🏡" text={tr("No areas yet!")} sub={tr("Create Kitchen, Bathroom, Living Room…")}/>
              :<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {areas.map((area,i)=>{
                  const count=tasks.filter(t=>t.areaId===area.id).length;
                  return(
                    <div key={area.id} className="fu bn" style={{animationDelay:`${i*0.05}s`,background:"#fff",
                      border:`3px solid ${area.color}`,borderRadius:22,padding:"16px",
                      boxShadow:`0 6px 22px ${area.color}55`,position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:-8,right:-8,fontSize:54,opacity:.1,userSelect:"none"}}>{area.emoji}</div>
                      <div style={{fontSize:34,marginBottom:6}}>{area.emoji||"🏠"}</div>
                      <div style={{fontWeight:900,color:"#444",fontSize:16,marginBottom:2}}>{tr(area.name)}</div>
                      <div style={{fontSize:12,color:"#bbb",marginBottom:10,fontWeight:700}}>{count===1?tr("1 task"):trf("{n} tasks",{n:count})}</div>
                      <div style={{display:"flex",gap:6}}>
                        <button className="bn" onClick={()=>setAreaModal(area)}
                          style={{flex:1,background:area.color+"44",border:"none",borderRadius:10,padding:"6px",
                            cursor:"pointer",fontSize:12,fontWeight:800,color:"#666",fontFamily:"inherit"}}>{tr("✏️ Edit")}</button>
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
      {taskModal!==null&&<TaskModal task={taskModal.id?taskModal:null} areas={areas} members={household?.members||[]} onSave={saveTask} onClose={()=>setTaskModal(null)}/>}
      {showAccount&&(
        <AccountSheet user={user} household={household} onInvite={sendInvite}
          onRename={renameHousehold} onLogout={onLogout} onClose={()=>setShowAccount(false)}
          themeKey={themeKey} onThemeChange={changeTheme} T={T}
          lang={lang} onLangChange={changeLang}/>
      )}
    </div>
  );
}

// ── Task Row ───────────────────────────────────────────────────────────────────
function TaskRow({ task, isDone, area, delay=0, onToggle, members=[], accent=null }) {
  const dep=DEPTHS.find(d=>d.label===task.depth)||DEPTHS[0];
  const assignees=(task.assignedTo||[]).map(id=>members.find(m=>m.id===id)).filter(Boolean);
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
          {area&&<Pill bg={isDone?"#eee":area.color}>{area.emoji} {tr(area.name)}</Pill>}
          <Pill bg={isDone?"#eee":dep.color}>{dep.emoji} {tr(dep.label)}</Pill>
          {assignees.length>0&&<Pill bg={isDone?"#eee":"#fff0ba"}>👤 {assignees.map(m=>m.name.split(" ")[0]).join(", ")}</Pill>}
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
        {!small&&<div style={{fontSize:9,fontWeight:800,color:isSel?"rgba(255,255,255,.8)":"#ccc",marginBottom:2}}>{DAY_SHORT_L()[day.getDay()]}</div>}
        <div style={{fontFamily:"'Fredoka One','Rubik',cursive",fontSize:small?13:16,color:isSel?"#fff":isToday?"#ff6b9d":"#555",lineHeight:1}}>{day.getDate()}</div>
        {dot&&<div style={{width:6,height:6,borderRadius:"50%",background:dot,margin:"3px auto 0"}}/>}
        {!small&&cnt>0&&<div style={{fontSize:9,color:isSel?"rgba(255,255,255,.7)":"#ddd",marginTop:1}}>{cnt}</div>}
      </div>
    );
  };
  return(
    <div className="fu">
      <div style={{background:"#fff",borderRadius:22,padding:"14px 16px",marginBottom:14,border:"2px solid #ffd6e7",boxShadow:"0 4px 18px rgba(255,182,193,.2)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <button className="bn" onClick={()=>nav(-1)} style={{background:"#ffd6e7",border:"none",borderRadius:12,width:36,height:36,fontSize:18,cursor:"pointer"}}>{LANG==="he"?"→":"←"}</button>
          <div style={{fontFamily:"'Fredoka One','Rubik',cursive",fontSize:17,color:"#ff6b9d",textAlign:"center"}}>
            {calView==="week"?`${weekDays[0].toLocaleDateString(LOCALE(),{month:"short",day:"numeric"})} – ${weekDays[6].toLocaleDateString(LOCALE(),{month:"short",day:"numeric"})}`:calDate.toLocaleDateString(LOCALE(),{month:"long",year:"numeric"})}
          </div>
          <button className="bn" onClick={()=>nav(1)} style={{background:"#ffd6e7",border:"none",borderRadius:12,width:36,height:36,fontSize:18,cursor:"pointer"}}>{LANG==="he"?"←":"→"}</button>
        </div>
        <div style={{display:"flex",gap:6,background:"#f5f5f5",borderRadius:14,padding:4}}>
          {["week","month"].map(v=>(
            <button key={v} className="bn" onClick={()=>setCalView(v)}
              style={{flex:1,padding:"7px",border:"none",borderRadius:10,fontWeight:800,fontSize:13,fontFamily:"inherit",cursor:"pointer",
                background:calView===v?"#fff":"transparent",color:calView===v?"#ff6b9d":"#bbb",
                boxShadow:calView===v?"0 2px 8px rgba(255,107,157,.18)":"none"}}>
              {v==="week"?tr("📅 Week"):tr("🗓️ Month")}
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
            {DAY_SHORT_L().map((d,di)=><div key={di} style={{textAlign:"center",fontSize:10,fontWeight:900,color:"#ffb3c6",padding:"3px 0"}}>{d}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
            {monthGrid.map(({d,out},i)=><div key={i} style={{opacity:out?.35:1}}><DayChip day={d} small/></div>)}
          </div>
        </div>
      )}
      <div style={{background:"#fff",borderRadius:22,padding:"16px",border:"2px solid #c9f0ff",boxShadow:"0 6px 20px rgba(186,225,255,.25)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontFamily:"'Fredoka One','Rubik',cursive",fontSize:16,color:"#5bbfdf"}}>
            {DAY_EMOJI[selectedDay.getDay()]} {selectedDay.toLocaleDateString(LOCALE(),{weekday:"long",month:"short",day:"numeric"})}
          </div>
          <div style={{background:"#d4f5d4",borderRadius:10,padding:"3px 10px",fontSize:12,fontWeight:800,color:"#5cb85c"}}>{selDoneN}/{selTasks.length} ✓</div>
        </div>
        {selTasks.length===0?<div style={{textAlign:"center",padding:"18px",color:"#ccc",fontSize:16}}>{tr("🌈 Free day!")}</div>
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
function AccountSheet({ user, household, onInvite, onRename, onLogout, onClose, themeKey, onThemeChange, T=THEMES.fun, lang, onLangChange }) {
  const [inviteEmail,setInviteEmail]=useState("");
  const [inviteMsg,  setInviteMsg]  =useState("");
  const [inviteOk,   setInviteOk]   =useState(false);
  const [editName,   setEditName]   =useState(false);
  const [houseName,  setHouseName]  =useState(household?.name||"");
  const [linkCopied, setLinkCopied]=useState(false);
  const inviteLink=`${window.location.origin}/?join=${user.householdId}`;
  const copyLink=async()=>{
    try{ await navigator.clipboard.writeText(inviteLink); }catch{
      const ta=document.createElement("textarea"); ta.value=inviteLink; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
    }
    setLinkCopied(true); setTimeout(()=>setLinkCopied(false),2000);
  };
  const shareLink=async()=>{
    if(navigator.share){
      try{ await navigator.share({title:tr("Happy Home 🏡"),text:trf("Join our household \"{name}\" on Happy Home!",{name:household?.name||""}),url:inviteLink}); }catch{}
    } else copyLink();
  };
  const doInvite=async()=>{
    const err=await onInvite(inviteEmail.trim().toLowerCase());
    if(err){setInviteMsg(err);setInviteOk(false);}
    else{setInviteMsg(trf("Invite saved! When {email} signs up, they'll join your household 🎉",{email:inviteEmail}));setInviteOk(true);setInviteEmail("");}
  };
  return(
    <Sheet title={tr("👤 My Account")} onClose={onClose}>
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
            <Pill bg={user.authMethod==="google"?"#e8f4ff":"#f5f5f5"}>{user.authMethod==="google"?tr("🟦 Google"):tr("📧 Email")}</Pill>
          </div>
        </div>
      </div>
      <Label>{tr("🏠 Household Name")}</Label>
      {editName
        ?<div style={{display:"flex",gap:8,marginBottom:14}}>
          <input className="fi" value={houseName} onChange={e=>setHouseName(e.target.value)}
            style={{flex:1,padding:"9px 12px",borderRadius:12,border:"2px solid #ffd6e7",background:"#fff8f0",fontSize:16,color:"#444"}}/>
          <button className="bn" onClick={()=>{onRename(houseName);setEditName(false);}}
            style={{background:"#baffc9",border:"none",borderRadius:12,padding:"9px 14px",fontWeight:800,fontSize:13,color:"#555",fontFamily:"inherit",cursor:"pointer"}}>{tr("Save")}</button>
        </div>
        :<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,
          background:"#fff8f0",border:"2px solid #ffd6e7",borderRadius:12,padding:"10px 14px"}}>
          <span style={{fontWeight:700,color:"#444"}}>{household?.name}</span>
          <button className="bn" onClick={()=>setEditName(true)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16}}>✏️</button>
        </div>}
      <Label>{tr("👥 Members")} ({household?.members?.length||1})</Label>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
        {(household?.members||[]).map(m=>(
          <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,background:"#f9f9f9",borderRadius:12,padding:"10px 12px",border:"1.5px solid #f0f0f0"}}>
            <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#ffd6e7,#c9f0ff)",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#ff6b9d",flexShrink:0}}>
              {initials(m.name)}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,color:"#444",fontSize:16}}>{m.name} {m.id===user.id&&<span style={{fontSize:11,color:"#aaa"}}>{tr("(you)")}</span>}</div>
              <div style={{fontSize:11,color:"#bbb"}}>{m.email}</div>
            </div>
            <Pill bg={m.role==="owner"?"#fff0ba":"#f5f5f5"}>{m.role==="owner"?tr("👑 Owner"):tr("👤 Member")}</Pill>
          </div>
        ))}
      </div>
      <Label>{tr("🔗 Family Invite Link")}</Label>
      <div style={{background:"linear-gradient(135deg,#f0f8ff,#fff8f0)",border:"2px solid #c9f0ff",borderRadius:16,padding:"14px",marginBottom:18}}>
        <p style={{fontSize:12,color:"#aaa",fontWeight:700,marginBottom:10,lineHeight:1.5}}>
          {tr("Send this link to family members — when they open it and sign in, they join your household 🏡")}
        </p>
        <div style={{background:"#fff",border:"1.5px solid #e8e8e8",borderRadius:10,padding:"8px 10px",fontSize:12,color:"#888",
          wordBreak:"break-all",marginBottom:10,fontFamily:"monospace"}}>{inviteLink}</div>
        <div style={{display:"flex",gap:8}}>
          <button className="bn" onClick={copyLink}
            style={{flex:1,background:linkCopied?"#d4f5d4":"#f5f5f5",border:"none",borderRadius:12,padding:"10px",
              fontWeight:900,fontSize:14,color:linkCopied?"#5cb85c":"#666",fontFamily:"inherit",cursor:"pointer"}}>
            {linkCopied?tr("✓ Copied!"):tr("📋 Copy")}
          </button>
          <button className="bn" onClick={shareLink}
            style={{flex:1,background:"linear-gradient(135deg,#ffb3ba,#c9f0ff)",border:"none",borderRadius:12,padding:"10px",
              fontWeight:900,fontSize:14,color:"#555",fontFamily:"inherit",cursor:"pointer"}}>
            {tr("📤 Share")}
          </button>
        </div>
      </div>
      <Label>{tr("✉️ Invite by Email")}</Label>
      <div style={{background:"linear-gradient(135deg,#fff8f0,#f0fff8)",border:"2px solid #ffd6e7",borderRadius:16,padding:"14px",marginBottom:18}}>
        <p style={{fontSize:12,color:"#aaa",fontWeight:700,marginBottom:10,lineHeight:1.5}}>
          {tr("They'll automatically join your household when they sign up with this email 🏡")}
        </p>
        <div style={{display:"flex",gap:8}}>
          <input className="fi" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)}
            placeholder="friend@email.com" type="email" onKeyDown={e=>e.key==="Enter"&&doInvite()}
            style={{flex:1,padding:"9px 12px",borderRadius:12,border:"2px solid #ffd6e7",background:"#fff",fontSize:16,color:"#444",fontFamily:"inherit"}}/>
          <button className="bn" onClick={doInvite}
            style={{background:"linear-gradient(135deg,#ffb3ba,#c9f0ff)",border:"none",borderRadius:12,
              padding:"9px 14px",fontWeight:900,fontSize:13,color:"#555",fontFamily:"inherit",cursor:"pointer",whiteSpace:"nowrap"}}>
            {tr("Send 📨")}
          </button>
        </div>
        {inviteMsg&&(
          <div style={{marginTop:10,fontSize:13,fontWeight:700,color:inviteOk?"#5cb85c":"#e05080",
            background:inviteOk?"#f0fff4":"#fff0f3",borderRadius:10,padding:"8px 12px",
            border:`1.5px solid ${inviteOk?"#a8e6cf":"#ffb3ba"}`}}>{inviteMsg}</div>
        )}
      </div>
      <Label T={T}>{tr("🌐 Language")}</Label>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        {[{key:"en",flag:"🇬🇧",label:"English"},{key:"he",flag:"🇮🇱",label:"עברית"}].map(l=>(
          <div key={l.key} className="bn" onClick={()=>onLangChange(l.key)}
            style={{padding:"12px 10px",borderRadius:16,textAlign:"center",cursor:"pointer",
              background:lang===l.key?T.primaryPale:"#f5f5f5",
              border:`2.5px solid ${lang===l.key?T.primary:"#e0e0e0"}`}}>
            <div style={{fontSize:26,marginBottom:2}}>{l.flag}</div>
            <div style={{fontSize:15,fontWeight:900,color:lang===l.key?T.primary:"#888"}}>{l.label}</div>
          </div>
        ))}
      </div>
      <Label T={T}>{tr("🎨 App Theme")}</Label>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        {Object.entries(THEMES).map(([key,theme])=>(
          <div key={key} className="bn" onClick={()=>onThemeChange(key)}
            style={{padding:"14px 10px",borderRadius:16,textAlign:"center",cursor:"pointer",
              background:themeKey===key?theme.headerBg:"#f5f5f5",
              border:`2.5px solid ${themeKey===key?theme.primary:"#e0e0e0"}`,
              boxShadow:themeKey===key?`0 4px 14px ${theme.cardShadow}`:"none"}}>
            <div style={{fontSize:28,marginBottom:4}}>{theme.emoji}</div>
            <div style={{fontFamily:theme.fontFamily,fontSize:13,fontWeight:900,color:theme.primary}}>{tr(theme.name)}</div>
            <div style={{display:"flex",gap:4,justifyContent:"center",marginTop:6}}>
              {[theme.primary,theme.secondary,theme.primaryPale,theme.secondaryPale].map((c,i)=>(
                <div key={i} style={{width:14,height:14,borderRadius:"50%",background:c}}/>
              ))}
            </div>
            {themeKey===key&&<div style={{fontSize:11,fontWeight:800,color:theme.primary,marginTop:4}}>{tr("✓ Active")}</div>}
          </div>
        ))}
      </div>
      <button className="bn" onClick={onLogout}
        style={{width:"100%",padding:"13px",borderRadius:16,border:`2px solid ${T.primaryPale}`,background:T.inputBg,
          fontSize:16,fontWeight:900,color:"#e05080",cursor:"pointer",fontFamily:"inherit"}}>
        {tr("🚪 Sign Out")}
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
    <Sheet title={area?tr("✏️ Edit Area"):tr("🏠 New Area")} onClose={onClose}>
      <Label>{tr("Pick an Emoji")}</Label>
      <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:16}}>
        {AREA_EMOJIS.map(e=>(
          <div key={e} className="bn" onClick={()=>setEmoji(e)}
            style={{width:40,height:40,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:22,cursor:"pointer",background:emoji===e?"#ffd6e7":"#f5f5f5",
              border:`2.5px solid ${emoji===e?"#ff85a1":"transparent"}`}}>{e}</div>
        ))}
      </div>
      <Label>{tr("Quick Pick")}</Label>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        {SUGGESTED_AREAS.map(s=>(
          <div key={s.name} className="bn" onClick={()=>{setName(tr(s.name));setEmoji(s.emoji);setColor(s.color);}}
            style={{padding:"5px 11px",borderRadius:20,cursor:"pointer",fontSize:12,fontWeight:700,
              background: name===tr(s.name) ? s.color : "#f5f5f5",
              border:`2px solid ${name===tr(s.name) ? s.color+"bb" : "transparent"}`,
              color:"#555",display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
            {s.emoji} {tr(s.name)}
          </div>
        ))}
      </div>
      <Label>{tr("Area Name")}</Label>
      <FInput className="fi" value={name} onChange={e=>setName(e.target.value)} placeholder={tr("Kitchen, Bathroom…")} autoFocus onKeyDown={e=>e.key==="Enter"&&submit()}/>
      <Label>{tr("Color")}</Label>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
        {PALETTE.map(c=>(
          <div key={c} className="bn" onClick={()=>setColor(c)}
            style={{width:32,height:32,borderRadius:"50%",background:c,cursor:"pointer",
              border:`3px solid ${color===c?"#555":"transparent"}`,boxShadow:color===c?`0 0 0 3px ${c}88`:"none"}}/>
        ))}
      </div>
      <BigBtn onClick={submit}>{area?tr("Save Changes 💾"):tr("Create Area 🎉")}</BigBtn>
    </Sheet>
  );
}

// ── Task Modal ─────────────────────────────────────────────────────────────────
function TaskModal({ task, areas, members=[], onSave, onClose }) {
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
  const [assignedTo, setAssignedTo] =useState(task?.assignedTo||[]); // [] = everyone
  const toggleAssignee=(id)=>setAssignedTo(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const [notes,      setNotes]      =useState(task?.notes||"");
  const [showEM,     setShowEM]     =useState(false);
  const isOnce=repeatUnit==="once";
  const submit=()=>{if(!title.trim())return;onSave({...(task||{}),title:title.trim(),emoji,areaId,depth,taskType,timeOfDay,assignedTo,repeatUnit,repeatEvery:Number(repeatEvery),
    weekDays:repeatUnit==="weeks"?weekDays:null,
    monthDay:repeatUnit==="months"&&monthMode==="date"?Number(monthDay):null,
    monthMode:repeatUnit==="months"?monthMode:null,
    monthWeekDay:repeatUnit==="months"&&monthMode==="weekday"?monthWeekDay:null,
    monthWeekNum:repeatUnit==="months"&&monthMode==="weekday"?monthWeekNum:null,
    notes});};
  return(
    <Sheet title={task?tr("✏️ Edit Task"):tr("📋 New Task")} onClose={onClose}>
      <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:14}}>
        <div>
          <Label>{tr("Emoji")}</Label>
          <div className="bn" onClick={()=>setShowEM(!showEM)}
            style={{width:54,height:54,borderRadius:16,background:"#fff8f0",border:"2.5px solid #ffd6e7",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,cursor:"pointer"}}>{emoji}</div>
        </div>
        <div style={{flex:1}}>
          <Label>{tr("What to do")}</Label>
          <FInput className="fi" value={title} onChange={e=>setTitle(e.target.value)} placeholder={tr("Mop the floor…")} autoFocus/>
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
      <Label>{tr("Task Type")}</Label>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {TASK_TYPES.map(t=>(
          <div key={t.val} className="bn" onClick={()=>setTaskType(t.val)}
            style={{flex:1,padding:"9px 10px",borderRadius:13,cursor:"pointer",textAlign:"center",
              background:taskType===t.val?(t.val==="weekly"?"#c9f0ff":"#fff0ba"):"#f5f5f5",
              border:`2px solid ${taskType===t.val?(t.val==="weekly"?"#5bbfdf":"#ffcc44"):"transparent"}`,
              fontWeight:taskType===t.val?900:600,fontSize:14,color:"#555"}}>
            {t.emoji} {tr(t.label)}
          </div>
        ))}
      </div>
      {members.length>0&&<>
      <Label>{tr("Who does it?")}</Label>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        <div className="bn" onClick={()=>setAssignedTo([])}
          style={{padding:"7px 12px",borderRadius:20,cursor:"pointer",fontSize:13,fontWeight:800,
            background:assignedTo.length===0?"linear-gradient(135deg,#ffb3ba,#c9f0ff)":"#f5f5f5",
            border:`2px solid ${assignedTo.length===0?"#ff85a1":"transparent"}`,color:"#555"}}>
          {tr("👨‍👩‍👧 Anyone")}
        </div>
        {members.map(m=>{
          const on=assignedTo.includes(m.id);
          return(
            <div key={m.id} className="bn" onClick={()=>toggleAssignee(m.id)}
              style={{padding:"5px 12px 5px 5px",borderRadius:20,cursor:"pointer",fontSize:13,fontWeight:800,
                display:"flex",alignItems:"center",gap:6,
                background:on?"#fff0ba":"#f5f5f5",border:`2px solid ${on?"#f5c842":"transparent"}`,color:"#555"}}>
              <span style={{width:24,height:24,borderRadius:"50%",background:"linear-gradient(135deg,#ffd6e7,#c9f0ff)",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:"#ff6b9d"}}>
                {initials(m.name)}
              </span>
              {m.name.split(" ")[0]}
            </div>
          );
        })}
      </div>
      {members.length===1&&(
        <div style={{fontSize:12,color:"#aaa",fontWeight:700,marginTop:-6,marginBottom:14}}>
          💡 {tr("Invite family from settings to assign tasks to them")}
        </div>
      )}
      </>}
      <Label>{tr("Time of Day")}</Label>
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
            {tr(t.label)}
          </div>
        ))}
      </div>
      <Label>{tr("Area")}</Label>
      <select value={areaId} onChange={e=>setAreaId(e.target.value)}
        style={{width:"100%",background:"#fff8f0",border:"2px solid #ffd6e7",borderRadius:13,padding:"10px 12px",fontSize:16,marginBottom:14,color:"#555"}}>
        <option value="">{tr("— No area —")}</option>
        {areas.map(a=><option key={a.id} value={a.id}>{a.emoji} {tr(a.name)}</option>)}
      </select>
      <Label>{tr("Cleaning Depth")}</Label>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        {DEPTHS.map(d=>(
          <div key={tr(d.label)} className="bn" onClick={()=>setDepth(d.label)}
            style={{padding:"9px 10px",borderRadius:13,cursor:"pointer",textAlign:"center",
              background:depth===d.label?d.color:"#f5f5f5",border:`2px solid ${depth===d.label?d.color+"aa":"transparent"}`,
              fontWeight:depth===d.label?900:600,fontSize:13,color:"#555"}}>
            {d.emoji} {tr(d.label)}
          </div>
        ))}
      </div>
      {taskType==="daily"&&<>
      <Label>{tr("Repeat")}</Label>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
        {UNITS.map(u=>(
          <div key={u.val} className="bn" onClick={()=>setRepeatUnit(u.val)}
            style={{padding:"7px 12px",borderRadius:12,cursor:"pointer",textAlign:"center",
              background:repeatUnit===u.val?"#c9f0ff":"#f5f5f5",border:`2px solid ${repeatUnit===u.val?"#5bbfdf":"transparent"}`,
              fontWeight:repeatUnit===u.val?900:600,fontSize:13,color:"#555",whiteSpace:"nowrap"}}>
            {u.emoji} {tr(u.label)}
          </div>
        ))}
      </div>
      {!isOnce&&(
        <div style={{display:"flex",alignItems:"center",gap:10,background:"#fff8f0",border:"2px solid #ffd6e7",borderRadius:14,padding:"10px 14px",marginBottom:14}}>
          <span style={{fontSize:13,fontWeight:700,color:"#aaa",flex:1}}>{tr("Every")}</span>
          <button className="bn" onClick={()=>setRepeatEvery(Math.max(1,Number(repeatEvery)-1))}
            style={{width:32,height:32,borderRadius:10,background:"#ffd6e7",border:"none",fontSize:18,fontWeight:900,color:"#ff6b9d",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
          <input type="number" min="1" max="99" value={repeatEvery}
            onChange={e=>setRepeatEvery(Math.max(1,Math.min(99,Number(e.target.value)||1)))}
            style={{width:48,textAlign:"center",background:"#fff",border:"2px solid #ffd6e7",borderRadius:10,padding:"5px",fontSize:18,fontWeight:900,color:"#ff6b9d"}}/>
          <button className="bn" onClick={()=>setRepeatEvery(Math.min(99,Number(repeatEvery)+1))}
            style={{width:32,height:32,borderRadius:10,background:"#ffd6e7",border:"none",fontSize:18,fontWeight:900,color:"#ff6b9d",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>＋</button>
          <span style={{fontSize:13,fontWeight:700,color:"#aaa"}}>{unitWord(repeatEvery,repeatUnit)}</span>
        </div>
      )}
      {repeatUnit==="weeks"&&(
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:900,color:"#ffb3c6",textTransform:"uppercase",letterSpacing:1.2,marginBottom:8}}>{tr("On which day(s)")}</div>
          <div style={{display:"flex",gap:6,justifyContent:"space-between"}}>
            {DAY_NAMES().map((d,i)=>{
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
          <div style={{fontSize:11,fontWeight:900,color:"#ffb3c6",textTransform:"uppercase",letterSpacing:1.2,marginBottom:8}}>{tr("Repeat on")}</div>
          {/* Mode toggle */}
          <div style={{display:"flex",gap:6,background:"#f5f5f5",borderRadius:14,padding:4,marginBottom:10}}>
            {[{val:"date",label:tr("📅 Specific date")},{ val:"weekday",label:tr("📆 Day of week")}].map(m=>(
              <div key={m.val} className="bn" onClick={()=>setMonthMode(m.val)}
                style={{flex:1,padding:"7px",borderRadius:10,textAlign:"center",fontWeight:800,fontSize:12,
                  background:monthMode===m.val?"#fff":"transparent",
                  color:monthMode===m.val?"#ff6b9d":"#bbb",
                  boxShadow:monthMode===m.val?"0 2px 8px rgba(255,107,157,.18)":"none",cursor:"pointer"}}>
                {tr(m.label)}
              </div>
            ))}
          </div>
          {/* Date mode */}
          {monthMode==="date"&&(
            <div style={{display:"flex",alignItems:"center",gap:10,background:"#fff8f0",border:"2px solid #ffd6e7",borderRadius:14,padding:"10px 14px"}}>
              <span style={{fontSize:13,fontWeight:700,color:"#aaa",flex:1}}>{tr("Day")}</span>
              <button className="bn" onClick={()=>setMonthDay(d=>Math.max(1,Number(d)-1))}
                style={{width:32,height:32,borderRadius:10,background:"#ffd6e7",border:"none",fontSize:18,fontWeight:900,color:"#ff6b9d",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
              <input type="number" min="1" max="31" value={monthDay}
                onChange={e=>setMonthDay(Math.max(1,Math.min(31,Number(e.target.value)||1)))}
                style={{width:48,textAlign:"center",background:"#fff",border:"2px solid #ffd6e7",borderRadius:10,padding:"5px",fontSize:18,fontWeight:900,color:"#ff6b9d"}}/>
              <button className="bn" onClick={()=>setMonthDay(d=>Math.min(31,Number(d)+1))}
                style={{width:32,height:32,borderRadius:10,background:"#ffd6e7",border:"none",fontSize:18,fontWeight:900,color:"#ff6b9d",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>＋</button>
              <span style={{fontSize:13,fontWeight:700,color:"#aaa"}}>{tr("of the month")}</span>
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
                    {ORDINALS()[n-1]}
                  </div>
                ))}
              </div>
              {/* Which day */}
              <div style={{display:"flex",gap:5}}>
                {DAY_NAMES().map((d,i)=>(
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
        🔁 {repeatSummary({unit:repeatUnit,every:repeatEvery,weekDays,monthMode,monthDay,monthWeekNum,monthWeekDay})}
      </div>
      </>}
      <Label>{tr("Notes (optional)")}</Label>
      <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder={tr("Any details… 📝")}
        style={{width:"100%",background:"#fff8f0",border:"2px solid #ffd6e7",borderRadius:13,padding:"10px 12px",fontSize:16,resize:"vertical",marginBottom:16,color:"#555",fontFamily:"inherit"}}/>
      <BigBtn onClick={submit}>{task?tr("Save Changes 💾"):tr("Add Task 🎉")}</BigBtn>
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
          <div style={{fontFamily:"'Fredoka One','Rubik',cursive",fontSize:20,color:"#ff6b9d"}}>{title}</div>
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
const Empty    =({emoji,text,sub}) =><div style={{textAlign:"center",padding:"50px 20px"}}><div style={{fontSize:52,marginBottom:10}}>{emoji}</div><div style={{fontFamily:"'Fredoka One','Rubik',cursive",fontSize:20,color:"#ddd",marginBottom:6}}>{text}</div><div style={{fontSize:13,color:"#ccc"}}>{sub}</div></div>;
