import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Phone, MapPin, Sprout } from "lucide-react";

function CustomerAuth() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [language, setLanguage] = useState("en");
  const isTelugu = language === "te";

  const t = (english, telugu) =>
    isTelugu ? telugu : english;

  const [form, setForm] = useState({
    name: "",
    phone: "",
    village: "",
    district: "",
    password: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const endpoint = isLogin
        ? "https://farm-to-family.onrender.com/api/customers/login"
        : "https://farm-to-family.onrender.com/api/customers/register";

      const body = isLogin
        ? {
            phone: form.phone,
            password: form.password
          }
        : form;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            t(
              "Something went wrong",
              "ఏదో సమస్య ఏర్పడింది"
            )
        );
      }

      sessionStorage.setItem("customerToken", data.token);
      sessionStorage.setItem(
        "customerDetails",
        JSON.stringify(data.customer)
      );

      setMessage(
        isLogin
          ? t("Login successful!", "లాగిన్ విజయవంతమైంది!")
          : t("Registration successful!", "రిజిస్ట్రేషన్ విజయవంతమైంది!")
      );

      setTimeout(() => {
        navigate("/");
      }, 700);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-auth-page">

      <div className="customer-auth-card">

        <div className="customer-auth-header">

          <div className="customer-auth-logo">
            <Sprout size={32} />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "10px"
            }}
          >
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Language"
              style={{
                padding: "7px 10px",
                border: "1px solid #dce5dc",
                borderRadius: "8px",
                background: "white",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              <option value="en">English</option>
              <option value="te">తెలుగు</option>
            </select>
          </div>

          <h1>
            {isLogin
              ? t("Customer Login", "కస్టమర్ లాగిన్")
              : t(
                  "Create Customer Account",
                  "కస్టమర్ ఖాతాను సృష్టించండి"
                )}
          </h1>

          <p>
            {isLogin
              ? t(
                  "Login to manage your Farm to Family orders",
                  "మీ Farm to Family ఆర్డర్లను నిర్వహించడానికి లాగిన్ చేయండి"
                )
              : t(
                  "Create your account and buy rice directly from farmers",
                  "మీ ఖాతాను సృష్టించి రైతుల నుండి నేరుగా బియ్యం కొనండి"
                )}
          </p>

        </div>

        <form onSubmit={handleSubmit}>

          {!isLogin && (
            <>
              <div className="customer-auth-input">
                <User size={18} />

                <input
                  type="text"
                  name="name"
                  placeholder={t("Full Name", "పూర్తి పేరు")}
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="customer-auth-input">
                <MapPin size={18} />

                <input
                  type="text"
                  name="village"
                  placeholder={t("Village", "గ్రామం")}
                  value={form.village}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="customer-auth-input">
                <MapPin size={18} />

                <input
                  type="text"
                  name="district"
                  placeholder={t("District", "జిల్లా")}
                  value={form.district}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}

          <div className="customer-auth-input">
            <Phone size={18} />

            <input
              type="tel"
              name="phone"
              placeholder={t("Mobile Number", "మొబైల్ నంబర్")}
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="customer-auth-input">
            <Lock size={18} />

            <input
              type="password"
              name="password"
              placeholder={t("Password", "పాస్‌వర్డ్")}
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {error && (
            <div className="customer-auth-error">
              {error}
            </div>
          )}

          {message && (
            <div className="customer-auth-success">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="customer-auth-submit"
            disabled={loading}
          >
            {loading
              ? t("Please wait...", "దయచేసి వేచి ఉండండి...")
              : isLogin
              ? t("Login", "లాగిన్")
              : t("Create Account", "ఖాతాను సృష్టించండి")}
          </button>

        </form>

        <div className="customer-auth-switch">

          {isLogin ? (
            <>
              <span>
                {t(
                  "Don't have an account?",
                  "ఖాతా లేదా?"
                )}
              </span>

              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setError("");
                  setMessage("");
                }}
              >
                {t("Create Account", "ఖాతాను సృష్టించండి")}
              </button>
            </>
          ) : (
            <>
              <span>
                {t(
                  "Already have an account?",
                  "ఇప్పటికే ఖాతా ఉందా?"
                )}
              </span>

              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError("");
                  setMessage("");
                }}
              >
                {t("Login", "లాగిన్")}
              </button>
            </>
          )}

        </div>

        <button
          className="customer-back-home"
          onClick={() => navigate("/")}
        >
          ← {t(
            "Back to Farm to Family",
            "Farm to Familyకి తిరిగి వెళ్లండి"
          )}
        </button>

      </div>

    </div>
  );
}

export default CustomerAuth;
