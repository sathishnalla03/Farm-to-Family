import { useState } from "react";
import { useNavigate } from "react-router-dom";

const districts = [
  "Adilabad", "Bhadradri Kothagudem", "Hanamkonda", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem Asifabad", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal–Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal", "Yadadri Bhuvanagiri"
];

export default function App() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("register");
  const [language, setLanguage] = useState("en");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", village: "", district: "", password: "", confirmPassword: "" });
  const te = language === "te";
  const copy = {
    en: { eyebrow: "TELANGANA FARMER COMMUNITY", title: "Sell your rice directly. Earn a fair price.", subtitle: "Join Farm to Family and connect with customers looking for quality rice from local farmers.", register: "Create farmer account", login: "Farmer login", name: "Full name", phone: "Mobile number", village: "Village / Town", district: "District", password: "Password", confirm: "Confirm password", create: "Create account", signIn: "Login", have: "Already registered?", noAccount: "New to Farm to Family?", switchLogin: "Login here", switchRegister: "Create an account", note: "Your details are used to create your farmer profile and access your farmer dashboard.", benefit1: "Reach more customers", benefit2: "Set your own selling price", benefit3: "Manage orders in one place" },
    te: { eyebrow: "తెలంగాణ రైతుల సమూహం", title: "మీ బియ్యాన్ని నేరుగా అమ్మండి. సరైన ధర పొందండి.", subtitle: "ఫార్మ్ టు ఫ్యామిలీలో చేరి, నాణ్యమైన బియ్యం కోసం చూస్తున్న వినియోగదారులతో నేరుగా కలవండి.", register: "రైతు ఖాతా సృష్టించండి", login: "రైతు లాగిన్", name: "పూర్తి పేరు", phone: "మొబైల్ నంబర్", village: "గ్రామం / పట్టణం", district: "జిల్లా", password: "పాస్‌వర్డ్", confirm: "పాస్‌వర్డ్ నిర్ధారించండి", create: "ఖాతా సృష్టించండి", signIn: "లాగిన్", have: "ఇప్పటికే ఖాతా ఉందా?", noAccount: "ఫార్మ్ టు ఫ్యామిలీకి కొత్తగా వచ్చారా?", switchLogin: "ఇక్కడ లాగిన్ చేయండి", switchRegister: "ఖాతా సృష్టించండి", note: "మీ వివరాలను రైతు ప్రొఫైల్ సృష్టించడానికి మరియు రైతు డాష్‌బోర్డ్‌ను ఉపయోగించడానికి ఉపయోగిస్తాము.", benefit1: "మరిన్ని వినియోగదారులను చేరుకోండి", benefit2: "మీ అమ్మకపు ధరను మీరే నిర్ణయించండి", benefit3: "ఆర్డర్లను ఒకేచోట నిర్వహించండి" }
  }[language];

  function update(field, value) { setForm(current => ({ ...current, [field]: value })); }
  
async function submit(event) {
  event.preventDefault();
  setNotice("");

  if (!/^[6-9]\d{9}$/.test(form.phone)) {
    setNotice(te ? "చెల్లుబాటు అయ్యే 10 అంకెల మొబైల్ నంబర్‌ను నమోదు చేయండి." : "Enter a valid 10-digit mobile number.");
    return;
  }

  if (form.password.length < 8) {
    setNotice(te ? "పాస్‌వర్డ్‌లో కనీసం 8 అక్షరాలు ఉండాలి." : "Password must contain at least 8 characters.");
    return;
  }

  if (mode === "register" &&
      form.password !== form.confirmPassword) {
    setNotice(te ? "పాస్‌వర్డ్‌లు సరిపోలడం లేదు." : "Passwords do not match.");
    return;
  }

  try {
    const endpoint = mode === "register"
  ? "http://localhost:5000/api/farmers/register"
  : "http://localhost:5000/api/farmers/login";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        phone: form.phone,
        password: form.password,
        ...(mode === "register" && {
          name: form.name,
          village: form.village,
          district: form.district
        })
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || (te ? "ఏదో సమస్య ఏర్పడింది." : "Something went wrong"));
    }

    sessionStorage.setItem("farmerToken", data.token);
    sessionStorage.setItem(
      "farmerDetails",
      JSON.stringify(data.farmer)
    );

    setNotice(
      mode === "register"
        ? (te ? "ఖాతా విజయవంతంగా సృష్టించబడింది! ఇప్పుడు లాగిన్ చేయవచ్చు." : "Account created successfully! You can now log in.")
        : (te ? "లాగిన్ విజయవంతమైంది! తిరిగి స్వాగతం." : "Login successful! Welcome back.")
    );

    if (mode === "login") {
  navigate("/farmer-dashboard");
}

  } catch (error) {
    setNotice(error.message || (te ? "సర్వర్‌కు కనెక్ట్ కాలేకపోయాము." : "Cannot connect to server."));
  }
}


  return (
    <div className="app-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Noto+Sans+Telugu:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box} body{margin:0;background:#f5f8f3;color:#1c3024;font-family:'DM Sans','Noto Sans Telugu',sans-serif}
        button,input,select{font:inherit} button{cursor:pointer}
        .topbar{height:76px;background:#fff;border-bottom:1px solid #e8eee7;display:flex;align-items:center;justify-content:space-between;padding:0 max(5vw,22px);gap:16px}
        .brand{display:flex;align-items:center;gap:11px;color:#176b3a;font-size:20px;font-weight:800;letter-spacing:-.5px}.brand-mark{width:42px;height:42px;border-radius:13px;background:#e8f4e9;display:grid;place-items:center;font-size:24px}
        .top-actions{display:flex;align-items:center;gap:12px}.lang{border:1px solid #dce6dc;background:#fff;border-radius:10px;padding:10px 12px;color:#24432e}
        .page{max-width:1160px;margin:0 auto;padding:48px 24px 64px;display:grid;grid-template-columns:1fr 470px;gap:64px;align-items:center;min-height:calc(100vh - 76px)}
        .intro{padding:12px 0}.eyebrow{display:inline-flex;align-items:center;gap:8px;background:#e7f3e8;color:#176b3a;padding:9px 13px;border-radius:30px;font-size:12px;font-weight:800;letter-spacing:1px}
        .intro h1{font-size:clamp(36px,5vw,58px);line-height:1.08;letter-spacing:-2px;margin:22px 0 18px;max-width:600px}.intro>p{font-size:17px;line-height:1.75;color:#647568;max-width:560px;margin:0}
        .benefits{display:grid;gap:17px;margin-top:34px}.benefit{display:flex;align-items:center;gap:13px;color:#334b39;font-weight:600}.check{width:30px;height:30px;border-radius:50%;background:#e5f2e6;color:#18703d;display:grid;place-items:center;font-weight:800}
        .form-card{background:#fff;border:1px solid #e7eee6;border-radius:24px;padding:32px;box-shadow:0 18px 55px rgba(30,70,40,.09)}.form-head{margin-bottom:24px}.form-head h2{font-size:25px;margin:0 0 8px;letter-spacing:-.6px}.form-head p{margin:0;color:#78867a;font-size:14px}
        .tabs{display:grid;grid-template-columns:1fr 1fr;background:#f1f5f0;padding:5px;border-radius:12px;margin-bottom:23px}.tab{border:0;border-radius:9px;padding:11px;background:transparent;color:#68766a;font-weight:700}.tab.active{background:#fff;color:#176b3a;box-shadow:0 2px 8px #183b2012}
        .fields{display:grid;gap:15px}.field{display:grid;gap:7px}.field label{font-size:13px;font-weight:700;color:#344b39}.field input,.field select{width:100%;height:47px;border:1px solid #dce6dc;border-radius:10px;padding:0 13px;outline:none;background:#fff;color:#23382a}.field input:focus,.field select:focus{border-color:#31965a;box-shadow:0 0 0 3px #31965a18}.two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .submit{width:100%;border:0;background:#197341;color:#fff;height:50px;border-radius:11px;font-weight:800;margin-top:5px;box-shadow:0 7px 16px #19734125}.submit:hover{background:#125d33}.switch{font-size:13px;text-align:center;color:#718073;margin:20px 0 0}.switch button{border:0;background:none;color:#176b3a;font-weight:800;padding:0 3px}
        .notice{font-size:13px;line-height:1.5;padding:11px 13px;border-radius:10px;background:#edf7ed;color:#176b3a;margin-top:14px}.fineprint{font-size:11px;color:#929d93;line-height:1.5;margin:17px 0 0;text-align:center}.footer{padding:18px 24px;text-align:center;color:#8a978b;font-size:12px}
        @media(max-width:900px){.page{grid-template-columns:1fr;gap:28px;max-width:620px;padding-top:38px}.intro{text-align:center}.intro>p{margin:auto}.benefits{display:inline-grid;text-align:left;margin-top:24px}.form-card{padding:26px}}
        @media(max-width:520px){.topbar{height:68px;padding:0 16px}.brand{font-size:17px}.brand-mark{width:36px;height:36px}.page{padding:30px 15px 40px}.intro h1{font-size:38px}.intro>p{font-size:15px}.form-card{padding:21px;border-radius:18px}.two-col{grid-template-columns:1fr;gap:15px}}
      `}</style>
      <header className="topbar">
        <div className="brand"><span className="brand-mark">🌾</span>Farm to Family</div>
        <div className="top-actions"><select className="lang" value={language} onChange={e => setLanguage(e.target.value)} aria-label="Select language"><option value="en">English</option><option value="te">తెలుగు</option></select></div>
      </header>
      <main className="page">
        <section className="intro">
          <span className="eyebrow">🌱 {copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.subtitle}</p>
          <div className="benefits">{[copy.benefit1, copy.benefit2, copy.benefit3].map(item => <div className="benefit" key={item}><span className="check">✓</span>{item}</div>)}</div>
        </section>
        <section className="form-card">
          <div className="form-head"><h2>{mode === "register" ? copy.register : copy.login}</h2><p>{te ? "మీ Farm to Family రైతు ఖాతాను సురక్షితంగా నిర్వహించండి." : "Access your farmer account on Farm to Family."}</p></div>
          <div className="tabs"><button className={`tab ${mode === "register" ? "active" : ""}`} onClick={() => {setMode("register");setNotice("");}}>{te ? "రిజిస్టర్" : "Register"}</button><button className={`tab ${mode === "login" ? "active" : ""}`} onClick={() => {setMode("login");setNotice("");}}>{te ? "లాగిన్" : "Login"}</button></div>
          <form className="fields" onSubmit={submit}>
            {mode === "register" && <>
              <div className="field"><label>{copy.name}</label><input required value={form.name} onChange={e => update("name", e.target.value)} placeholder={te ? "మీ పూర్తి పేరు" : "Enter your full name"} /></div>
              <div className="field"><label>{copy.phone}</label><input required inputMode="numeric" maxLength={10} value={form.phone} onChange={e => update("phone", e.target.value.replace(/\D/g,""))} placeholder={te ? "10 అంకెల మొబైల్ నంబర్" : "10-digit mobile number"} /></div>
              <div className="two-col"><div className="field"><label>{copy.village}</label><input required value={form.village} onChange={e => update("village", e.target.value)} placeholder={te ? "మీ గ్రామం" : "Your village"} /></div><div className="field"><label>{copy.district}</label><select required value={form.district} onChange={e => update("district", e.target.value)}><option value="">{te ? "జిల్లాను ఎంచుకోండి" : "Select district"}</option>{districts.map(d => <option key={d}>{d}</option>)}</select></div></div>
            </>}
            {mode === "login" && <div className="field"><label>{copy.phone}</label><input required inputMode="numeric" maxLength={10} value={form.phone} onChange={e => update("phone", e.target.value.replace(/\D/g,""))} placeholder={te ? "10 అంకెల మొబైల్ నంబర్" : "10-digit mobile number"} /></div>}
            <div className="field"><label>{copy.password}</label><input required type="password" minLength={8} value={form.password} onChange={e => update("password", e.target.value)} placeholder={te ? "కనీసం 8 అక్షరాలు" : "Minimum 8 characters"} /></div>
            {mode === "register" && <div className="field"><label>{copy.confirm}</label><input required type="password" value={form.confirmPassword} onChange={e => update("confirmPassword", e.target.value)} placeholder={te ? "మీ పాస్‌వర్డ్‌ను మళ్లీ నమోదు చేయండి" : "Re-enter your password"} /></div>}
            <button className="submit" type="submit">{mode === "register" ? copy.create : copy.signIn} →</button>
          </form>
          {notice && <div className="notice" role="status">{notice}</div>}
          <p className="switch">{mode === "register" ? copy.have : copy.noAccount} <button onClick={() => {setMode(mode === "register" ? "login" : "register");setNotice("");}}>{mode === "register" ? copy.switchLogin : copy.switchRegister}</button></p>
          <p className="fineprint">{copy.note}</p>
        </section>
      </main>
      <footer className="footer">{te ? "© 2026 Farm to Family · తెలంగాణ రైతులను కుటుంబాలతో నేరుగా కలుపుతోంది" : "© 2026 Farm to Family · Connecting Telangana farmers directly with families"}</footer>
    </div>
  );
}
