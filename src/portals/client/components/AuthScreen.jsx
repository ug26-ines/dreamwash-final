import { useState } from "react";

export default function AuthScreen({ onLoginSuccess, toast }) {

  const [tab, setTab] = useState("login"); // 'login' or 'register'
  const [regType, setRegType] = useState("ind"); // 'ind' or 'biz'
  
  const [error, setError] = useState("");
  
  // Form Data State
  const [formData, setFormData] = useState({
    email: "", password: "", pass2: "",
    name: "", phone: "", area: "", ref: "",
    bizname: "", mgrname: "", mgrphone: "", empname: "", empphone: "",
    wkweight: "", clothtype: "", priceexp: "", expect: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setError(""); // Clear error on typing
  };

  // ─── HANDLERS ───
  const doLogin = (e) => {
    e?.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Please enter email and password.");
      return;
    }
    
    // TODO: Replace with your Firebase or backend login logic
    console.log("Logging in with:", formData.email, formData.password);
    
    // If successful:
    // toast("Welcome back!", "success");
    // onLoginSuccess(userData);
  };

  const doRegister = (e) => {
    e?.preventDefault();
    if (formData.password !== formData.pass2) {
      setError("Passwords do not match.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (regType === "ind") {
      if (!formData.name || !formData.phone || !formData.email) {
        setError("Please fill all required fields.");
        return;
      }
      console.log("Registering Individual:", formData);
      // TODO: Firebase create user logic here
      
    } else {
      if (!formData.bizname || !formData.mgrname || !formData.mgrphone || !formData.email) {
        setError("Please fill all required fields.");
        return;
      }
      console.log("Registering Business:", formData);
      // TODO: Firebase create user logic here
    }
  };

  return (
    <div id="auth-screen">
      <div className="auth-brand">
        <div className="auth-logo">Dream Wash</div>
        <div className="auth-tagline">Musanze's professional laundry service</div>
      </div>

      <div className="auth-card">
        {/* ── TABS ── */}
        <div className="auth-tabs">
          <div 
            className={`auth-tab ${tab === "login" ? "active" : ""}`} 
            onClick={() => { setTab("login"); setError(""); }}
          >
            Sign In
          </div>
          <div 
            className={`auth-tab ${tab === "register" ? "active" : ""}`} 
            onClick={() => { setTab("register"); setError(""); }}
          >
            Register
          </div>
        </div>

        {/* ── LOGIN FORM ── */}
        {tab === "login" && (
          <form id="login-form" onSubmit={doLogin}>
            <div className="fg">
              <label className="fl">Email</label>
              <input type="email" className="fi" id="email" placeholder="your@email.com" value={formData.email} onChange={handleChange} />
            </div>
            <div className="fg">
              <label className="fl">Password</label>
              <input type="password" className="fi" id="password" placeholder="••••••••" value={formData.password} onChange={handleChange} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: "4px" }}>Sign In →</button>
            {error && <div className="auth-err">{error}</div>}
            
            <div className="demo-hint">
              Demo: <strong>diane.uwimana@email.com</strong> / <strong>Diane2026</strong><br/>Active 10k Club member
            </div>
          </form>
        )}

        {/* ── REGISTER FORM ── */}
        {tab === "register" && (
          <form id="reg-form" onSubmit={doRegister}>
            <div className="scroll-form">
              <div className="reg-label">Register as</div>
              <div className="reg-type-row">
                <div 
                  className={`reg-type-btn ${regType === "ind" ? "active" : ""}`} 
                  onClick={() => setRegType("ind")}
                >
                  <span className="reg-type-icon">👤</span>Individual
                </div>
                <div 
                  className={`reg-type-btn ${regType === "biz" ? "active" : ""}`} 
                  onClick={() => setRegType("biz")}
                >
                  <span className="reg-type-icon">🏢</span>Business
                </div>
              </div>

              {/* INDIVIDUAL FIELDS */}
              {regType === "ind" && (
                <div id="form-ind">
                  <div className="fg"><label className="fl">Full Name</label>
                    <input type="text" className="fi" id="name" placeholder="Your full name" value={formData.name} onChange={handleChange} /></div>
                  <div className="fg"><label className="fl">Phone Number</label>
                    <input type="tel" className="fi" id="phone" placeholder="07X XXX XXXX" value={formData.phone} onChange={handleChange} /></div>
                  <div className="fg"><label className="fl">Email</label>
                    <input type="email" className="fi" id="email" placeholder="your@email.com" value={formData.email} onChange={handleChange} /></div>
                  <div className="fg"><label className="fl">Neighbourhood / Hostel <span className="opt">(optional)</span></label>
                    <input type="text" className="fi" id="area" placeholder="e.g. INES Campus Block B..." value={formData.area} onChange={handleChange} /></div>
                  <div className="fg"><label className="fl">Referred by Dorm Boss <span className="opt">(optional)</span></label>
                    <input type="text" className="fi" id="ref" placeholder="Dorm Boss name or code" value={formData.ref} onChange={handleChange} />
                    <div className="fh">Enter if a Dorm Boss introduced you to Dream Wash</div></div>
                </div>
              )}

              {/* BUSINESS FIELDS */}
              {regType === "biz" && (
                <div id="form-biz">
                  <div className="fg"><label className="fl">Business Name</label>
                    <input type="text" className="fi" id="bizname" placeholder="e.g. Hotel Virunga Lodge" value={formData.bizname} onChange={handleChange} /></div>
                  <div className="fg"><label className="fl">Manager / Contact Name</label>
                    <input type="text" className="fi" id="mgrname" placeholder="Manager full name" value={formData.mgrname} onChange={handleChange} /></div>
                  <div className="fg"><label className="fl">Manager Phone</label>
                    <input type="tel" className="fi" id="mgrphone" placeholder="07X XXX XXXX" value={formData.mgrphone} onChange={handleChange} /></div>
                  <div className="fg"><label className="fl">Laundry Employee Name</label>
                    <input type="text" className="fi" id="empname" placeholder="Person handling laundry" value={formData.empname} onChange={handleChange} /></div>
                  <div className="fg"><label className="fl">Laundry Employee Phone</label>
                    <input type="tel" className="fi" id="empphone" placeholder="07X XXX XXXX" value={formData.empphone} onChange={handleChange} /></div>
                  <div className="fg"><label className="fl">Business Email</label>
                    <input type="email" className="fi" id="email" placeholder="info@yourbusiness.com" value={formData.email} onChange={handleChange} /></div>
                  
                  <div className="fsep">
                    <div className="fsep-title">📊 Service Requirements</div>
                    <div className="fh" style={{ marginBottom: "14px" }}>Helps us prepare capacity and set your contract pricing.</div>
                    <div className="fg"><label className="fl">Expected Weight per Week (kg)</label>
                      <input type="number" className="fi" id="wkweight" placeholder="e.g. 50" min="1" value={formData.wkweight} onChange={handleChange} /></div>
                    <div className="fg"><label className="fl">Type of Clothes / Linen</label>
                      <select className="fi" id="clothtype" value={formData.clothtype} onChange={handleChange}>
                        <option value="">Select type...</option>
                        <option value="mixed">Mixed (uniforms + linen)</option>
                        <option value="bed_linen">Bed Linen & Towels</option>
                        <option value="uniforms">Staff Uniforms</option>
                        <option value="other">Other</option>
                      </select></div>
                    <div className="fg"><label className="fl">Special Requirements</label>
                      <textarea className="fi" id="expect" placeholder="e.g. Same-day pickup..." value={formData.expect} onChange={handleChange}></textarea></div>
                  </div>
                </div>
              )}

              {/* COMMON PASSWORD FIELDS */}
              <div className="fg"><label className="fl">Password</label>
                <input type="password" className="fi" id="password" placeholder="Minimum 6 characters" value={formData.password} onChange={handleChange} /></div>
              <div className="fg"><label className="fl">Confirm Password</label>
                <input type="password" className="fi" id="pass2" placeholder="Repeat password" value={formData.pass2} onChange={handleChange} /></div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: "6px" }}>Create Account →</button>
              {error && <div className="auth-err">{error}</div>}
              <div style={{ height: "16px" }}></div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
