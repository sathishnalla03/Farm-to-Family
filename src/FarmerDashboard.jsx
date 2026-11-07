import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  User,
  LogOut,
  ShoppingBag,
  Menu,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API = "https://farm-to-family.onrender.com";

export default function FarmerDashboard() {
  const navigate = useNavigate();

  const [farmer, setFarmer] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [page, setPage] = useState("dashboard");

  // ==============================
  // LANGUAGE
  // ==============================

  const [language, setLanguage] = useState("en");
  const isTelugu = language === "te";

  const t = (english, telugu) =>
    isTelugu ? telugu : english;

  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [form, setForm] = useState({
    rice_name: "",
    description: "",
    price_per_kg: "",
    stock_kg: "",
    image_url: ""
  });

  const token = sessionStorage.getItem("farmerToken");

  // ==============================
  // LOAD FARMER DASHBOARD
  // ==============================

  async function loadDashboard() {
    if (!token) {
      navigate("/farmer-register");
      return;
    }

    try {
      const headers = {
        Authorization: `Bearer ${token}`
      };

      const [profileResponse, productsResponse] = await Promise.all([
        fetch(`${API}/api/farmers/profile`, { headers }),
        fetch(`${API}/api/products/my-products`, { headers })
      ]);

      if (!profileResponse.ok || !productsResponse.ok) {
        throw new Error(t("Session expired. Please login again.", "సెషన్ గడువు ముగిసింది. దయచేసి మళ్లీ లాగిన్ చేయండి."));
      }

      const profileData = await profileResponse.json();
      const productsData = await productsResponse.json();

      setFarmer(profileData.farmer);
      setProducts(productsData.products || []);
    } catch (error) {
      setMessage(error.message);

      sessionStorage.removeItem("farmerToken");
      sessionStorage.removeItem("farmerDetails");

      navigate("/farmer-register");
    } finally {
      setLoading(false);
    }
  }

  // ==============================
  // LOAD FARMER ORDERS
  // ==============================

  async function loadOrders() {
    if (!token) {
      return;
    }

    try {
      setOrdersLoading(true);

      const response = await fetch(`${API}/api/farmers/orders`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("Failed to load orders", "ఆర్డర్లను లోడ్ చేయడం విఫలమైంది"));
      }

      setOrders(data.orders || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setOrdersLoading(false);
    }
  }

  // ==============================
  // UPDATE ORDER STATUS
  // ==============================

  async function updateOrderStatus(orderItemId, status) {
    try {
      setMessage("");

      const response = await fetch(
        `${API}/api/farmers/orders/${orderItemId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("Failed to update order", "ఆర్డర్‌ను నవీకరించడం విఫలమైంది"));
      }

      setMessage(t(`Order status updated to ${status}.`, `ఆర్డర్ స్థితి ${status}గా నవీకరించబడింది.`));

      await loadOrders();
    } catch (error) {
      setMessage(error.message);
    }
  }

  // ==============================
  // INITIAL DASHBOARD LOAD
  // ==============================

  useEffect(() => {
    loadDashboard();
  }, []);

  // ==============================
  // LOAD ORDERS WHEN OPENING
  // ==============================

  useEffect(() => {
    if (page === "orders") {
      loadOrders();
    }
  }, [page]);

  // ==============================
  // ADD PRODUCT
  // ==============================

  async function addProduct(event) {
    event.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("Failed to add product", "ఉత్పత్తిని జోడించడం విఫలమైంది"));
      }

      setMessage(t("Rice product added successfully!", "బియ్యం ఉత్పత్తి విజయవంతంగా జోడించబడింది!"));

      setForm({
        rice_name: "",
        description: "",
        price_per_kg: "",
        stock_kg: "",
        image_url: ""
      });

      await loadDashboard();

      setPage("products");
    } catch (error) {
      setMessage(error.message);
    }
  }

  // ==============================
// EDIT PRODUCT
// ==============================

async function editProduct(product) {
  const rice_name = window.prompt(
    t("Rice Variety:", "బియ్యం రకం:"),
    product.rice_name
  );

  if (rice_name === null) return;

  const description = window.prompt(
    t("Description:", "వివరణ:"),
    product.description || ""
  );

  if (description === null) return;

  const price_per_kg = window.prompt(
    t("Price per kg (₹):", "కిలో ధర (₹):"),
    product.price_per_kg
  );

  if (price_per_kg === null) return;

  const stock_kg = window.prompt(
    t("Available stock (kg):", "అందుబాటులో ఉన్న నిల్వ (కిలోలు):"),
    product.stock_kg
  );

  if (stock_kg === null) return;

  const image_url = window.prompt(
    t("Rice image URL:", "బియ్యం చిత్ర URL:"),
    product.image_url || ""
  );

  if (image_url === null) return;

  try {
    setMessage("");

    const response = await fetch(
      `${API}/api/products/${product.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rice_name,
          description,
          price_per_kg,
          stock_kg,
          image_url
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || t("Failed to update product", "ఉత్పత్తిని నవీకరించడం విఫలమైంది")
      );
    }

    setMessage(
      t("Rice product updated successfully!", "బియ్యం ఉత్పత్తి విజయవంతంగా నవీకరించబడింది!")
    );

    await loadDashboard();

  } catch (error) {
    setMessage(error.message);
  }
}


// ==============================
// DELETE PRODUCT
// ==============================

async function deleteProduct(productId) {
  const confirmed = window.confirm(
    t("Are you sure you want to remove this rice product?", "ఈ బియ్యం ఉత్పత్తిని తొలగించాలనుకుంటున్నారా?")
  );

  if (!confirmed) return;

  try {
    setMessage("");

    const response = await fetch(
      `${API}/api/products/${productId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || t("Failed to remove product", "ఉత్పత్తిని తొలగించడం విఫలమైంది")
      );
    }

    setMessage(
      data.message || t("Rice product removed successfully!", "బియ్యం ఉత్పత్తి విజయవంతంగా తొలగించబడింది!")
    );

    await loadDashboard();

  } catch (error) {
    setMessage(error.message);
  }
}

async function reactivateProduct(productId) {
  const confirmed = window.confirm(
    t("Do you want to make this rice product available to customers again?", "ఈ బియ్యం ఉత్పత్తిని మళ్లీ వినియోగదారులకు అందుబాటులో ఉంచాలనుకుంటున్నారా?")
  );

  if (!confirmed) return;

  try {
    setMessage("");

    const response = await fetch(
      `${API}/api/products/${productId}/reactivate`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || t("Failed to reactivate product", "ఉత్పత్తిని మళ్లీ యాక్టివ్ చేయడం విఫలమైంది")
      );
    }

    setMessage(
      data.message ||
      t("Rice product is active again!", "బియ్యం ఉత్పత్తి మళ్లీ యాక్టివ్ అయింది!")
    );

    await loadDashboard();

  } catch (error) {
    setMessage(error.message);
  }
}

  // ==============================
  // LOGOUT
  // ==============================

  function logout() {
    sessionStorage.removeItem("farmerToken");
    sessionStorage.removeItem("farmerDetails");

    navigate("/farmer-register");
  }

  // ==============================
  // TOTAL STOCK
  // ==============================

  const totalStock = products.reduce(
    (total, item) => total + Number(item.stock_kg || 0),
    0
  );

  const groupedOrders = Object.values(
  orders.reduce((groups, item) => {
    if (!groups[item.order_id]) {
      groups[item.order_id] = {
        ...item,
        items: []
      };
    }

    groups[item.order_id].items.push(item);

    return groups;
  }, {})
);

  // ==============================
  // NAVIGATION
  // ==============================

  const navigation = [
    {
      id: "dashboard",
      label: t("Dashboard", "డాష్‌బోర్డ్"),
      icon: LayoutDashboard
    },
    {
      id: "products",
      label: t("My Products", "నా ఉత్పత్తులు"),
      icon: Package
    },
    {
      id: "add",
      label: t("Add Rice", "బియ్యం జోడించండి"),
      icon: PlusCircle
    },
    {
      id: "orders",
      label: t("My Orders", "నా ఆర్డర్లు"),
      icon: ShoppingBag
    },
    {
      id: "profile",
      label: t("My Profile", "నా ప్రొఫైల్"),
      icon: User
    }
  ];

  // ==============================
  // LOADING
  // ==============================

  if (loading) {
    return (
      <div className="fd-loading">
        {t("Loading your dashboard...", "మీ డాష్‌బోర్డ్‌ను లోడ్ చేస్తోంది...")}
      </div>
    );
  }

  // ==============================
  // DASHBOARD UI
  // ==============================

  return (
    <div className="fd-app">

      <style>{`
        * {
          box-sizing: border-box;
        }

        .fd-app {
          min-height: 100vh;
          display: flex;
          background: #f5f8f4;
          color: #24372a;
          font-family: Arial, sans-serif;
        }

        .fd-sidebar {
          width: 250px;
          background: #17472e;
          color: white;
          padding: 25px 16px;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }

        .fd-brand {
          font-size: 21px;
          font-weight: bold;
          padding: 5px 12px 35px;
        }

        .fd-nav {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 14px;
          margin-bottom: 7px;
          border: 0;
          border-radius: 9px;
          color: #dcebe0;
          background: transparent;
          text-align: left;
          cursor: pointer;
          font-size: 14px;
        }

        .fd-nav.active,
        .fd-nav:hover {
          background: #286344;
          color: white;
        }

        .fd-logout {
          margin-top: auto;
          color: white;
          border: 0;
          background: #286344;
          padding: 13px;
          border-radius: 9px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
        }

        .fd-main {
          flex: 1;
          min-width: 0;
        }

        .fd-header {
          background: white;
          padding: 20px 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e7eee7;
        }

        .fd-header h2 {
          margin: 0;
          font-size: 21px;
        }

        .fd-content {
          padding: 30px;
          max-width: 1250px;
          margin: auto;
        }

        .fd-welcome {
          background: linear-gradient(120deg, #17683b, #319454);
          color: white;
          padding: 30px;
          border-radius: 17px;
          margin-bottom: 25px;
        }

        .fd-welcome h1 {
          margin: 0 0 10px;
        }

        .fd-welcome p {
          margin: 0;
          opacity: 0.9;
        }

        .fd-cards {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 28px;
        }

        .fd-card {
          background: white;
          padding: 22px;
          border-radius: 13px;
          border: 1px solid #e9eee8;
        }

        .fd-card p {
          color: #758276;
          margin: 0 0 12px;
        }

        .fd-card h2 {
          margin: 0;
          color: #17683b;
          font-size: 28px;
        }

        .fd-panel {
          background: white;
          border: 1px solid #e8eee7;
          padding: 24px;
          border-radius: 14px;
          margin-bottom: 20px;
        }

        .fd-panel h2 {
          margin-top: 0;
        }

        .fd-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .fd-field {
          display: grid;
          gap: 7px;
        }

        .fd-field.full {
          grid-column: 1 / -1;
        }

        .fd-field label {
          font-size: 13px;
          font-weight: bold;
        }

        .fd-field input,
        .fd-field textarea {
          padding: 13px;
          border: 1px solid #dce5dc;
          border-radius: 8px;
          width: 100%;
          font-size: 14px;
        }

        .fd-field textarea {
          min-height: 90px;
          resize: vertical;
        }

        .fd-primary {
          background: #197341;
          color: white;
          border: 0;
          padding: 13px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        }

        .fd-primary:hover {
          background: #145c34;
        }
        
        .fd-danger {
          background: #c62828;
          color: white;
          border: 0;
          padding: 13px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        }

        .fd-danger:hover {
          background: #a61f1f;    
        }

        .fd-products {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .fd-product {
          background: white;
          border: 1px solid #e8eee7;
          border-radius: 12px;
          overflow: hidden;
        }

        .fd-product img {
          width: 100%;
          height: 160px;
          object-fit: cover;
          background: #e9f1e8;
        }

        .fd-product-info {
          padding: 16px;
        }

        .fd-product-info h3 {
          margin: 0 0 10px;
        }

        .fd-price {
          color: #197341;
          font-weight: bold;
          font-size: 20px;
        }

        .fd-message {
          background: #e8f5e9;
          color: #17683b;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 18px;
        }

        .fd-loading {
          padding: 60px;
          text-align: center;
          font-family: Arial, sans-serif;
        }

        .fd-mobile {
          display: none;
          border: 0;
          background: transparent;
          cursor: pointer;
        }

        .fd-order-card {
          background: white;
          border: 1px solid #e8eee7;
          padding: 24px;
          border-radius: 14px;
          margin-bottom: 20px;
        }

        .fd-order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .fd-order-header h3 {
          margin: 0;
        }

        .fd-status {
          padding: 7px 13px;
          border-radius: 20px;
          background: #e8f5e9;
          color: #17683b;
          font-weight: bold;
          font-size: 13px;
        }

        .fd-order-details {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(200px, 1fr)
          );
          gap: 16px;
        }

        .fd-order-detail {
          background: #f7faf6;
          padding: 13px;
          border-radius: 8px;
        }

        .fd-order-detail strong {
          display: block;
          font-size: 13px;
          color: #68766b;
          margin-bottom: 5px;
        }

        .fd-order-detail span {
          font-size: 15px;
        }

        .fd-delivery {
          margin-top: 18px;
          padding: 14px;
          background: #f5f8f4;
          border-radius: 8px;
        }

        .fd-delivery strong {
          display: block;
          margin-bottom: 5px;
        }

        .fd-order-actions {
          margin-top: 18px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .fd-empty-orders {
          text-align: center;
          padding: 35px;
        }

        .fd-empty-orders h3 {
          margin-top: 0;
        }

        @media(max-width: 850px) {
          .fd-sidebar {
            width: 205px;
          }

          .fd-products {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media(max-width: 600px) {
          .fd-app {
            display: block;
          }

          .fd-sidebar {
            display: none;
            width: 100%;
          }

          .fd-sidebar.open {
            display: flex;
          }

          .fd-mobile {
            display: block;
          }

          .fd-header {
            padding: 17px;
          }

          .fd-header > div {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .fd-content {
            padding: 16px;
          }

          .fd-cards {
            grid-template-columns: 1fr;
          }

          .fd-products {
            grid-template-columns: 1fr;
          }

          .fd-form {
            grid-template-columns: 1fr;
          }

          .fd-field.full {
            grid-column: auto;
          }

          .fd-order-details {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside
        className={`fd-sidebar ${
          mobileMenu ? "open" : ""
        }`}
      >
        <div className="fd-brand">
          🌾 Farm to Family
        </div>

        {navigation.map(item => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              className={`fd-nav ${
                page === item.id ? "active" : ""
              }`}
              onClick={() => {
                setPage(item.id);
                setMobileMenu(false);
                setMessage("");
              }}
            >
              <Icon size={19} />
              {item.label}
            </button>
          );
        })}

        <button
          className="fd-logout"
          onClick={logout}
        >
          <LogOut size={17} />
          {t("Logout", "లాగ్ అవుట్")}
        </button>
      </aside>

      {/* =========================
          MAIN AREA
      ========================= */}

      <main className="fd-main">

        {/* HEADER */}

        <header className="fd-header">

          <div>
            <button
              className="fd-mobile"
              onClick={() =>
                setMobileMenu(!mobileMenu)
              }
            >
              {mobileMenu ? <X /> : <Menu />}
            </button>

            <h2>{t("Farmer Dashboard", "రైతు డాష్‌బోర్డ్")}</h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Language"
              style={{
                padding: "8px 10px",
                border: "1px solid #dce5dc",
                borderRadius: "8px",
                background: "white",
                cursor: "pointer"
              }}
            >
              <option value="en">English</option>
              <option value="te">తెలుగు</option>
            </select>

            <span>
              🌱 {farmer?.name || t("Farmer", "రైతు")}
            </span>
          </div>

        </header>

        {/* CONTENT */}

        <section className="fd-content">

          {message && (
            <div className="fd-message">
              {message}
            </div>
          )}

          {/* =========================
              DASHBOARD
          ========================= */}

          {page === "dashboard" && (
            <>
              <div className="fd-welcome">
                <h1>
                  {t(`Welcome, ${farmer?.name}!`, `స్వాగతం, ${farmer?.name}!`)}
                </h1>

                <p>
                  {t(
                    "Manage your rice products and grow your farming business.",
                    "మీ బియ్యం ఉత్పత్తులను నిర్వహించి మీ వ్యవసాయ వ్యాపారాన్ని అభివృద్ధి చేసుకోండి."
                  )}
                </p>
              </div>

              <div className="fd-cards">

                <div className="fd-card">
                  <p>{t("Total Products", "మొత్తం ఉత్పత్తులు")}</p>
                  <h2>
                    {products.length}
                  </h2>
                </div>

                <div className="fd-card">
                  <p>{t("Available Stock", "అందుబాటులో ఉన్న నిల్వ")}</p>
                  <h2>
                    {totalStock} kg
                  </h2>
                </div>

                <div className="fd-card">
                  <p>{t("Customer Orders", "కస్టమర్ ఆర్డర్లు")}</p>
                  <h2>
                    {groupedOrders.length}
                  </h2>
                </div>

              </div>

              <div className="fd-panel">
                <h2>{t("Quick Actions", "త్వరిత చర్యలు")}</h2>

                <button
                  className="fd-primary"
                  onClick={() =>
                    setPage("add")
                  }
                >
                  {t("+ Add New Rice Product", "+ కొత్త బియ్యం ఉత్పత్తిని జోడించండి")}
                </button>
              </div>
            </>
          )}

          {/* =========================
              ADD RICE
          ========================= */}

          {page === "add" && (
            <>
              <div className="fd-panel">

                <h2>
                  {t("Add New Rice Product", "కొత్త బియ్యం ఉత్పత్తిని జోడించండి")}
                </h2>

                <p>
                  {t(
                    "Enter details about the rice you want to sell.",
                    "మీరు విక్రయించాలనుకుంటున్న బియ్యం వివరాలను నమోదు చేయండి."
                  )}
                </p>

                <form
                  className="fd-form"
                  onSubmit={addProduct}
                >

                  <div className="fd-field full">
                    <label>
                      {t("Rice Variety", "బియ్యం రకం")}
                    </label>

                    <input
                      required
                      value={form.rice_name}
                      onChange={e =>
                        setForm({
                          ...form,
                          rice_name:
                            e.target.value
                        })
                      }
                      placeholder={t("Example: Sona Masoori", "ఉదాహరణ: సోనా మసూరి")}
                    />
                  </div>

                  <div className="fd-field full">
                    <label>
                      {t("Description", "వివరణ")}
                    </label>

                    <textarea
                      value={form.description}
                      onChange={e =>
                        setForm({
                          ...form,
                          description:
                            e.target.value
                        })
                      }
                      placeholder={t("Describe your rice quality...", "మీ బియ్యం నాణ్యతను వివరించండి...")}
                    />
                  </div>

                  <div className="fd-field">

                    <label>
                      {t("Price per kg (₹)", "కిలో ధర (₹)")}
                    </label>

                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.price_per_kg}
                      onChange={e =>
                        setForm({
                          ...form,
                          price_per_kg:
                            e.target.value
                        })
                      }
                    />

                  </div>

                  <div className="fd-field">

                    <label>
                      {t("Available stock (kg)", "అందుబాటులో ఉన్న నిల్వ (కిలోలు)")}
                    </label>

                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.stock_kg}
                      onChange={e =>
                        setForm({
                          ...form,
                          stock_kg:
                            e.target.value
                        })
                      }
                    />

                  </div>

                  <div className="fd-field full">

                    <label>
                      {t("Rice image URL (optional)", "బియ్యం చిత్ర URL (ఐచ్ఛికం)")}
                    </label>

                    <input
                      type="url"
                      value={form.image_url}
                      onChange={e =>
                        setForm({
                          ...form,
                          image_url:
                            e.target.value
                        })
                      }
                      placeholder={t("Paste an image URL", "చిత్ర URL ను ఇక్కడ పేస్ట్ చేయండి")}
                    />

                  </div>

                  <div className="fd-field full">

                    <button
                      className="fd-primary"
                      type="submit"
                    >
                      {t("Add Rice Product", "బియ్యం ఉత్పత్తిని జోడించండి")}
                    </button>

                  </div>

                </form>

              </div>
            </>
          )}

          {/* =========================
              MY PRODUCTS
          ========================= */}

          {page === "products" && (
            <>
              <div className="fd-panel">

                <h2>
                  {t("My Rice Products", "నా బియ్యం ఉత్పత్తులు")}
                </h2>

                <button
                  className="fd-primary"
                  onClick={() =>
                    setPage("add")
                  }
                >
                  {t("+ Add Product", "+ ఉత్పత్తిని జోడించండి")}
                </button>

              </div>

              {products.length === 0 ? (

                <div className="fd-panel">
                  {t(
                    "You haven't added any rice products yet.",
                    "మీరు ఇంకా బియ్యం ఉత్పత్తులను జోడించలేదు."
                  )}
                </div>

              ) : (

                <div className="fd-products">

                  {products.map(product => (

                    <div
                      className="fd-product"
                      key={product.id}
                    >

                      {product.image_url ? (

                        <img
                          src={product.image_url}
                          alt={product.rice_name}
                        />

                      ) : (

                        <div
                          style={{
                            height: 160,
                            display: "grid",
                            placeItems: "center",
                            fontSize: 45,
                            background: "#eaf4e9"
                          }}
                        >
                          🌾
                        </div>

                      )}

                      <div className="fd-product-info">

                        <h3>
                          {product.rice_name}
                        </h3>

                        <p className="fd-price">
                          ₹{product.price_per_kg} / kg
                        </p>

                        <p>
                          {t("Stock", "నిల్వ")}: {product.stock_kg} kg
                        </p>

                        <p
                          style={{
                            color:
                              product.status === "inactive"
                                ? "#c62828"
                                : "#197341",
                            fontWeight: "bold"
                          }}
                        >
                          {product.status === "inactive"
                            ? "🔴 Inactive"
                            : "🟢 Active"}
                        </p>

                        <p>
                          {product.description ||
                            t("No description provided.", "వివరణ అందుబాటులో లేదు.")}
                        </p>

                        <div
                            style={{
                              display: "flex",
                              gap: "10px",
                              marginTop: "15px"
                            }}
                          >
                            {product.status === "inactive" ? (
                                <button
                                  className="fd-primary"
                                  onClick={() => reactivateProduct(product.id)}
                                >
                                  Reactivate
                                </button>
                              ) : (
                                <>
                                  <button
                                    className="fd-primary"
                                    onClick={() => editProduct(product)}
                                  >
                                    {t("Edit", "మార్చు")}
                                  </button>

                                  <button
                                    className="fd-danger"
                                    onClick={() => deleteProduct(product.id)}
                                  >
                                    Remove
                                  </button>
                                </>
                              )}
                          </div>

                      </div>

                    </div>

                  ))}

                </div>

              )}
            </>
          )}

          {/* =========================
              MY ORDERS
          ========================= */}

          {page === "orders" && (
            <>
              <div className="fd-panel">

                <h2>
                  {t("My Customer Orders", "నా కస్టమర్ ఆర్డర్లు")}
                </h2>

                <p>
                  {t(
                    "Orders received for your rice products.",
                    "మీ బియ్యం ఉత్పత్తులకు వచ్చిన ఆర్డర్లు."
                  )}
                </p>

              </div>

              {ordersLoading ? (

                <div className="fd-panel">
                  <p>
                    {t("Loading orders...", "ఆర్డర్లను లోడ్ చేస్తోంది...")}
                  </p>
                </div>

              ) : orders.length === 0 ? (

                <div className="fd-panel fd-empty-orders">

                  <h3>
                    {t("No Orders Yet", "ఇంకా ఆర్డర్లు లేవు")}
                  </h3>

                  <p>
                    {t(
                      "When customers purchase your rice, their orders will appear here.",
                      "కస్టమర్లు మీ బియ్యాన్ని కొనుగోలు చేసినప్పుడు వారి ఆర్డర్లు ఇక్కడ కనిపిస్తాయి."
                    )}
                  </p>

                </div>

              ) : (

                <div>

                  {groupedOrders.map(order => (

                    <div className="fd-order-card" key={order.order_id}>

                      {/* ORDER HEADER */}

                      <div className="fd-order-header">

                        <h3>
                          {t(`Order #${order.order_id}`, `ఆర్డర్ #${order.order_id}`)}
                        </h3>

                        <span className="fd-status">
                          {isTelugu
                            ? ({
                                Pending: "పెండింగ్",
                                Confirmed: "నిర్ధారించబడింది",
                                "Out for Delivery": "డెలివరీకి పంపబడింది",
                                Delivered: "డెలివరీ అయింది"
                              }[order.status] || order.status)
                            : order.status}
                        </span>

                      </div>

                      {/* ORDER DETAILS */}

                      <div className="fd-order-details">

                        <div className="fd-order-detail">
                          <strong>
                            {t("Customer", "కస్టమర్")}
                          </strong>

                          <span>
                            {order.customer_name}
                          </span>
                        </div>

                        <div className="fd-order-detail">
                          <strong>
                            {t("Phone", "ఫోన్")}
                          </strong>

                          <span>
                            {order.customer_phone}
                          </span>
                        </div>

                        <div className="fd-order-detail">
                          <strong>
                            {t("Rice", "బియ్యం")}
                          </strong>

                          <span>
                            {order.rice_name}
                          </span>
                        </div>

                        <div className="fd-order-detail">
                          <strong>
                            {t("Quantity", "పరిమాణం")}
                          </strong>

                          <span>
                            {order.quantity_kg} kg
                          </span>
                        </div>

                        <div className="fd-order-detail">
                          <strong>
                            {t("Price", "ధర")}
                          </strong>

                          <span>
                            ₹{order.price_per_kg} / kg
                          </span>
                        </div>

                        <div className="fd-order-detail">
                          <strong>
                            {t("Order Amount", "ఆర్డర్ మొత్తం")}
                          </strong>

                          <span
                            style={{
                              color: "#197341",
                              fontWeight: "bold"
                            }}
                          >
                            ₹{order.subtotal}
                          </span>
                        </div>

                        <div className="fd-order-detail">
                          <strong>
                            {t("Village", "గ్రామం")}
                          </strong>

                          <span>
                            {order.village}
                          </span>
                        </div>

                        <div className="fd-order-detail">
                          <strong>
                            {t("District", "జిల్లా")}
                          </strong>

                          <span>
                            {order.district}
                          </span>
                        </div>

                        <div className="fd-order-detail">
                          <strong>
                            {t("Pincode", "పిన్‌కోడ్")}
                          </strong>

                          <span>
                            {order.pincode}
                          </span>
                        </div>

                        <div className="fd-order-detail">
                          <strong>
                            {t("Order Date", "ఆర్డర్ తేదీ")}
                          </strong>

                          <span>
                            {new Date(
                              order.created_at
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>

                      </div>

                      {/* DELIVERY ADDRESS */}

                      <div className="fd-delivery">

                        <strong>
                          Delivery Address
                        </strong>

                        <span>
                          {order.delivery_address}
                        </span>

                      </div>

                      {/* STATUS BUTTONS */}

                      <div className="fd-order-actions">

                        {order.status === "Pending" && (
                          <button
                            className="fd-primary"
                            onClick={() =>
                              updateOrderStatus(
  order.items[0].order_item_id,
  "Confirmed"
)
                            }
                          >
                            {t("Confirm Order", "ఆర్డర్‌ను నిర్ధారించండి")}
                          </button>
                        )}

                        {order.status === "Confirmed" && (
                          <button
                            className="fd-primary"
                            onClick={() =>
                                updateOrderStatus(
  order.items[0].order_item_id,
  "Out for Delivery"
)
                            }
                          >
                            {t("Out for Delivery", "డెలివరీకి పంపండి")}
                          </button>
                        )}

                        {order.status === "Out for Delivery" && (
                          <button
                            className="fd-primary"
                            onClick={() =>
                              updateOrderStatus(
                                order.items[0].order_item_id,
                                "Delivered"
                              )
                            }
                          >
                            {t("Mark Delivered", "డెలివరీ పూర్తయినట్లు గుర్తించండి")}
                          </button>
                        )}

                        {order.status === "Delivered" && (
                          <span
                            style={{
                              padding: "13px 20px",
                              background: "#e8f5e9",
                              color: "#17683b",
                              borderRadius: "8px",
                              fontWeight: "bold"
                            }}
                          >
                            {t("✓ Order Delivered", "✓ ఆర్డర్ డెలివరీ అయింది")}
                          </span>
                        )}

                      </div>

                    </div>

                  ))}

                </div>

              )}

            </>
          )}

          {/* =========================
              PROFILE
          ========================= */}

          {page === "profile" && (
            <>
              <div className="fd-panel">

                <h2>
                  {t("My Farmer Profile", "నా రైతు ప్రొఫైల్")}
                </h2>

                <p>
                  <b>{t("Name:", "పేరు:")}</b>{" "}
                  {farmer?.name}
                </p>

                <p>
                  <b>{t("Mobile:", "మొబైల్:")}</b>{" "}
                  {farmer?.phone}
                </p>

                <p>
                  <b>{t("Village:", "గ్రామం:")}</b>{" "}
                  {farmer?.village}
                </p>

                <p>
                  <b>{t("District:", "జిల్లా:")}</b>{" "}
                  {farmer?.district}
                </p>

              </div>
            </>
          )}

        </section>

      </main>

    </div>
  );
}