import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./index.css";
import {
  User,
  Package,
  MapPin,
  Clock,
  Truck,
  CheckCircle,
  LogOut,
  ArrowLeft
} from "lucide-react";

function CustomerDashboard() {
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==============================
  // LANGUAGE
  // ==============================

  const [language, setLanguage] = useState("en");
  const isTelugu = language === "te";

  const t = (english, telugu) =>
    isTelugu ? telugu : english;

  useEffect(() => {
    const token = sessionStorage.getItem("customerToken");
    const customerDetails =
      sessionStorage.getItem("customerDetails");

    if (!token || !customerDetails) {
      navigate("/customer-auth");
      return;
    }

    try {
      setCustomer(JSON.parse(customerDetails));
    } catch {
      sessionStorage.removeItem("customerDetails");
      navigate("/customer-auth");
      return;
    }

    fetchOrders(token);
  }, [navigate]);

  const fetchOrders = async (token) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "https://farm-to-family.onrender.com/api/customers/orders",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            t(
              "Unable to fetch orders",
              "ఆర్డర్లను పొందడం సాధ్యం కాలేదు"
            )
        );
      }

      setOrders(data.orders || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("customerToken");
    sessionStorage.removeItem("customerDetails");

    navigate("/");
  };

  const getStatusText = (status) => {
    if (!isTelugu) return status;

    const statusMap = {
      Pending: "పెండింగ్",
      Confirmed: "నిర్ధారించబడింది",
      "Out for Delivery": "డెలివరీకి పంపబడింది",
      Delivered: "డెలివరీ అయింది"
    };

    return statusMap[status] || status;
  };

  const getStatusIcon = (status) => {
    if (status === "Delivered") {
      return <CheckCircle size={20} />;
    }

    if (status === "Out for Delivery") {
      return <Truck size={20} />;
    }

    if (status === "Confirmed") {
      return <Package size={20} />;
    }

    return <Clock size={20} />;
  };

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

  return (
    <div className="customer-dashboard">

      {/* Header */}
      <header className="customer-dashboard-header">

        <div>
          <button
            className="customer-dashboard-back"
            onClick={() => navigate("/")}
          >
            <ArrowLeft size={18} />
            {t("Back to Home", "హోమ్‌కు తిరిగి వెళ్లండి")}
          </button>

          <h1>{t("My Orders", "నా ఆర్డర్లు")}</h1>

          {customer && (
            <p>
              {t("Welcome", "స్వాగతం")},{" "}
              <strong>{customer.name}</strong>
            </p>
          )}
        </div>

        <div className="customer-dashboard-actions">

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Language"
            style={{
              padding: "8px 10px",
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

          <button
            className="customer-dashboard-home"
            onClick={() => navigate("/")}
          >
            <Package size={18} />
            {t("Shop Rice", "బియ్యం కొనండి")}
          </button>

          <button
            className="customer-dashboard-logout"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            {t("Logout", "లాగ్ అవుట్")}
          </button>

        </div>

      </header>

      {/* Customer Information */}
      {customer && (
        <div className="customer-profile-card">

          <div className="customer-profile-icon">
            <User size={28} />
          </div>

          <div>
            <h2>{customer.name}</h2>

            <p>
              📱 {customer.phone}
            </p>

            <p>
              <MapPin size={15} />
              {customer.village}, {customer.district}
            </p>
          </div>

        </div>
      )}

      {/* Main Content */}
      <main className="customer-orders-container">

        <div className="customer-orders-title">

          <div>
            <h2>{t("Your Orders", "మీ ఆర్డర్లు")}</h2>

            <p>
              {t(
                "View and track all your Farm to Family orders",
                "మీ Farm to Family ఆర్డర్లన్నింటినీ చూడండి మరియు ట్రాక్ చేయండి"
              )}
            </p>
          </div>

          <div className="customer-order-count">
            {orders.length}{" "}
            {orders.length === 1
              ? t("Order", "ఆర్డర్")
              : t("Orders", "ఆర్డర్లు")}
          </div>

        </div>

        {/* Loading */}
        {loading && (
          <div className="customer-orders-message">
            <div className="customer-loading">
              {t(
                "Loading your orders...",
                "మీ ఆర్డర్లను లోడ్ చేస్తోంది..."
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="customer-orders-error">
            {error}
          </div>
        )}

        {/* No Orders */}
        {!loading && !error && orders.length === 0 && (
          <div className="customer-no-orders">

            <Package size={60} />

            <h2>
              {t("No Orders Yet", "ఇంకా ఆర్డర్లు లేవు")}
            </h2>

            <p>
              {t(
                "You haven't placed any orders yet.",
                "మీరు ఇంకా ఎలాంటి ఆర్డర్లు చేయలేదు."
              )}
            </p>

            <button
              onClick={() => navigate("/")}
              className="customer-shop-button"
            >
              {t("Start Shopping", "షాపింగ్ ప్రారంభించండి")}
            </button>

          </div>
        )}

        {/* Orders */}
        {!loading && !error && orders.length > 0 && (

          <div className="customer-orders-list">

            {groupedOrders.map((order) => (

              <div
                className="customer-order-card"
                key={order.order_id}
              >

                {/* Order Header */}
                <div className="customer-order-header">

                  <div>
                    <span>
                      {t("Order ID", "ఆర్డర్ ID")}
                    </span>

                    <strong>
                      #{order.order_id}
                    </strong>
                  </div>

                  <div
                    className={`customer-order-status status-${order.status
                      .toLowerCase()
                      .replaceAll(" ", "-")}`}
                  >
                    {getStatusIcon(order.status)}
                    {getStatusText(order.status)}
                  </div>

                </div>

                {/* Order Details */}
                <div className="customer-order-info">

                  <div>
                    <span>
                      {t("Order Date", "ఆర్డర్ తేదీ")}
                    </span>

                    <strong>
                      {new Date(
                        order.created_at
                      ).toLocaleDateString("en-IN")}
                    </strong>
                  </div>

                  <div>
                    <span>
                      {t("Total Amount", "మొత్తం మొత్తం")}
                    </span>

                    <strong>
                      ₹{Number(
                        order.total_amount
                      ).toFixed(2)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      {t("Delivery", "డెలివరీ")}
                    </span>

                    <strong>
                      {order.village}, {order.district}
                    </strong>
                  </div>

                </div>

                {/* Items */}
                <div className="customer-order-items">

                  <h3>
                    {t("Rice Items", "బియ్యం ఉత్పత్తులు")}
                  </h3>

                  {order.items.map((item) => (

                    <div
                      className="customer-order-item"
                      key={item.order_item_id}
                    >

                      <div className="customer-order-item-icon">
                        🌾
                      </div>

                      <div className="customer-order-item-details">

                        <strong>
                          {item.rice_name}
                        </strong>

                        <span>
                          ₹{Number(
                            item.price_per_kg
                          ).toFixed(2)} / {t("kg", "కిలో")}
                        </span>

                      </div>

                      <div className="customer-order-item-quantity">
                        {item.quantity_kg} {t("kg", "కిలోలు")}
                      </div>

                      <div className="customer-order-item-price">
                        ₹{Number(
                          item.subtotal
                        ).toFixed(2)}
                      </div>

                    </div>

                  ))}

                </div>

                {/* Delivery Address */}
                <div className="customer-delivery-address">

                  <MapPin size={18} />

                  <div>
                    <strong>
                      {t(
                        "Delivery Address",
                        "డెలివరీ చిరునామా"
                      )}
                    </strong>

                    <p>
                      {order.delivery_address},{" "}
                      {order.village},{" "}
                      {order.district} -{" "}
                      {order.pincode}
                    </p>
                  </div>

                </div>

                {/* Track Order */}
                <button
                  className="customer-track-button"
                  onClick={() =>
                    navigate(
                      `/track-order?orderId=${order.order_id}`
                    )
                  }
                >
                  <Truck size={18} />
                  {t("Track Order", "ఆర్డర్‌ను ట్రాక్ చేయండి")}
                </button>

              </div>

            ))}

          </div>

        )}

      </main>

    </div>
  );
}

export default CustomerDashboard;
