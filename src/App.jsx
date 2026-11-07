import { useState, useEffect } from "react";

import {
  Sprout,
  Search,
  ShoppingCart,
  Truck,
  ShieldCheck,
  Plus,
  Minus,
  Trash2,
  X,
  Package,
  CheckCircle,
  MapPin,
  Clock,
  User
} from "lucide-react";

import "./index.css";

import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate
} from "react-router-dom";

import FarmerAuth from "./FarmerAuth";
import FarmerDashboard from "./FarmerDashboard";
import CustomerAuth from "./CustomerAuth";
import CustomerDashboard from "./CustomerDashboard";
import Payment from "./Payment";

function TrackOrder() {
  const [language, setLanguage] = useState("en");
  const isTelugu = language === "te";

  const t = (english, telugu) =>
    isTelugu ? telugu : english;

  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

    useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const urlOrderId = params.get("orderId");

    const customerDetails =
      sessionStorage.getItem("customerDetails");

    if (urlOrderId) {
      setOrderId(urlOrderId);
    }

    if (customerDetails) {
      try {
        const customer = JSON.parse(customerDetails);

        if (customer.phone) {
          setPhone(customer.phone);
        }

        // Automatically track the order
        if (urlOrderId && customer.phone) {
          trackOrderAutomatically(
            urlOrderId,
            customer.phone
          );
        }

      } catch (error) {
        console.error(
          "Unable to read customer details",
          error
        );
      }
    }
  }, []);

    const trackOrderAutomatically = async (
    selectedOrderId,
    selectedPhone
  ) => {
    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch(
        `http://localhost:5000/api/orders/${selectedOrderId}?phone=${selectedPhone}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || t(
            "Unable to find order",
            "ఆర్డర్‌ను కనుగొనలేకపోయాము"
          )
        );
      }

      setOrder(data.order);

    } catch (err) {
      setError(err.message);

    } finally {
      setLoading(false);
    }
  };

  const trackOrder = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch(
        `http://localhost:5000/api/orders/${orderId}?phone=${phone}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          t(
            "Unable to find order",
            "ఆర్డర్‌ను కనుగొనలేకపోయాము"
          )
        );
      }

      setOrder(data.order);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      name: isTelugu ? "ఆర్డర్ నమోదు చేయబడింది" : "Order Placed",
      icon: Package,
      status: "Pending"
    },
    {
      name: isTelugu ? "ఆర్డర్ నిర్ధారించబడింది" : "Order Confirmed",
      icon: CheckCircle,
      status: "Confirmed"
    },
    {
      name: isTelugu ? "డెలివరీ కోసం బయలుదేరింది" : "Out for Delivery",
      icon: Truck,
      status: "Out for Delivery"
    },
    {
      name: isTelugu ? "డెలివరీ పూర్తయింది" : "Delivered",
      icon: MapPin,
      status: "Delivered"
    }
  ];

  const getStepStatus = (stepStatus) => {
    const statusOrder = {
      Pending: 0,
      Confirmed: 1,
      "Out for Delivery": 2,
      Delivered: 3
    };

    if (!order) return "waiting";

    if (statusOrder[stepStatus] < statusOrder[order.status]) {
      return "completed";
    }

    if (stepStatus === order.status) {
      return "current";
    }

    return "waiting";
  };

  return (
    <div className="track-order-page">
      <div className="track-order-container">

        <div className="track-order-header">
          <Package size={42} />
          <div style={{display:"flex", justifyContent:"flex-end", marginBottom:"15px"}}>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="te">తెలుగు</option>
            </select>
          </div>
          <h1>{t("Track My Order", "నా ఆర్డర్‌ను ట్రాక్ చేయండి")}</h1>
          <p>{t("Enter your Order ID and mobile number to track your rice order.", "మీ బియ్యం ఆర్డర్‌ను ట్రాక్ చేయడానికి ఆర్డర్ ఐడి మరియు మొబైల్ నంబర్ నమోదు చేయండి.")}</p>
        </div>

        <form onSubmit={trackOrder} className="track-order-form">

          <div className="track-input-group">
            <label>{t("Order ID", "ఆర్డర్ ఐడి")}</label>
            <input
              type="number"
              placeholder={t("Enter Order ID", "ఆర్డర్ ఐడి నమోదు చేయండి")}
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              required
            />
          </div>

          <div className="track-input-group">
            <label>{t("Mobile Number", "మొబైల్ నంబర్")}</label>
            <input
              type="tel"
              placeholder={t("Enter mobile number", "మొబైల్ నంబర్ నమోదు చేయండి")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? (t("Tracking...", "ట్రాక్ చేస్తోంది...")) : (t("Track Order", "ఆర్డర్‌ను ట్రాక్ చేయండి"))}
          </button>

        </form>

        {error && (
          <div className="track-error">
            {isTelugu
              ? (
                  error === "Unable to find order"
                    ? "ఆర్డర్‌ను కనుగొనలేకపోయాము"
                    : error
                )
              : error}
          </div>
        )}

        {order && (
          <div className="order-tracking-result">

            <div className="order-summary">

              <div>
                <span>{t("Order ID", "ఆర్డర్ ఐడి")}</span>
                <strong>#{order.order_id}</strong>
              </div>

              <div>
                <span>{t("Customer", "వినియోగదారు")}</span>
                <strong>{order.customer_name}</strong>
              </div>

              <div>
                <span>{t("Total Amount", "మొత్తం")}</span>
                <strong>₹{order.total_amount}</strong>
              </div>

              <div>
                <span>{t("Current Status", "ప్రస్తుత స్థితి")}</span>
                <strong>{order.status}</strong>
              </div>

            </div>

            <h2>{t("Order Status", "ఆర్డర్ స్థితి")}</h2>

            <div className="tracking-timeline">

              {steps.map((step, index) => {

                const Icon = step.icon;
                const stepState = getStepStatus(step.status);

                return (
                  <div
                    className={`tracking-step ${stepState}`}
                    key={step.status}
                  >

                    <div className="tracking-icon">
                      <Icon size={24} />
                    </div>

                    <div className="tracking-content">
                      <h3>{step.name}</h3>

                      {stepState === "completed" && (
                        <p>{isTelugu ? "పూర్తయింది" : "Completed"}</p>
                      )}

                      {stepState === "current" && (
                        <p>{t("Current Status", "ప్రస్తుత స్థితి")}</p>
                      )}

                      {stepState === "waiting" && (
                        <p>{isTelugu ? "వేచి ఉంది" : "Waiting"}</p>
                      )}
                    </div>

                    {index < steps.length - 1 && (
                      <div className="tracking-line"></div>
                    )}

                  </div>
                );
              })}

            </div>

            <div className="delivery-details">

              <h2>{t("Delivery Details", "డెలివరీ వివరాలు")}</h2>

              <p>
                <strong>{t("Address:", "చిరునామా:")}</strong>{" "}
                {order.delivery_address}
              </p>

              <p>
                <strong>{t("Village:", "గ్రామం:")}</strong>{" "}
                {order.village}
              </p>

              <p>
                <strong>{t("District:", "జిల్లా:")}</strong>{" "}
                {order.district}
              </p>

              <p>
                <strong>{t("Pincode:", "పిన్‌కోడ్:")}</strong>{" "}
                {order.pincode}
              </p>

            </div>

            <div className="ordered-items">

              <h2>{t("Ordered Rice", "ఆర్డర్ చేసిన బియ్యం")}</h2>

              {order.items.map((item, index) => (
                <div className="ordered-item" key={index}>

                  <div>
                    <strong>{item.rice_name}</strong>
                    <p>
                      {item.quantity_kg} kg × ₹{item.price_per_kg}
                    </p>
                  </div>

                  <strong>
                    ₹{item.subtotal}
                  </strong>

                </div>
              ))}

            </div>

          </div>
        )}

      </div>
    </div>
  );
}

function Home() {
  
  const navigate = useNavigate();
  const [language, setLanguage] = useState("en");
  const isTelugu = language === "te";
  const [search, setSearch] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);


  const slides = [
  {
    type: "about",
    title: isTelugu
      ? "తాజా బియ్యం. రైతుల నుండి నేరుగా మీ ఇంటికి."
      : "Fresh Rice. Direct From Farmers.",
    description: isTelugu
      ? "Farm to Family ద్వారా తెలంగాణ రైతులను కుటుంబాలతో నేరుగా కలుపుతూ, తాజా బియ్యాన్ని సులభంగా కొనుగోలు చేయవచ్చు."
      : "Farm to Family connects Telangana farmers directly with families, making fresh rice easier to find and buy.",
    button: isTelugu
      ? "బియ్యం చూడండి"
      : "Explore Rice"
  },

  {
    type: "farmer",
    title: isTelugu
      ? "మీ బియ్యాన్ని నేరుగా అమ్మండి"
      : "Sell Your Rice Directly",
    description: isTelugu
      ? "Farm to Familyలో చేరి మీ బియ్యాన్ని నేరుగా వినియోగదారులకు అమ్మండి మరియు మంచి అవకాశాలను పొందండి."
      : "Join Farm to Family and reach customers directly while getting better opportunities for your rice.",
    button: isTelugu
      ? "రైతుగా చేరండి"
      : "Join as a Farmer"
  },

  {
    type: "customer",
    title: isTelugu
      ? "మీ దగ్గర తాజా బియ్యాన్ని కనుగొనండి"
      : "Find Fresh Rice Near You",
    description: isTelugu
      ? "వివిధ రకాల బియ్యాన్ని చూడండి, ధరలను పోల్చండి మరియు రైతుల నుండి నేరుగా తాజా బియ్యాన్ని ఆర్డర్ చేయండి."
      : "Explore different rice varieties, compare prices and order fresh rice directly from farmers.",
    button: isTelugu
      ? "బియ్యం కొనండి"
      : "Shop Rice"
  }
];

useEffect(() => {
  const sliderTimer = setInterval(() => {
    setCurrentSlide((previousSlide) =>
      (previousSlide + 1) % slides.length
    );
  }, 5000);

  return () => clearInterval(sliderTimer);
}, []);


const [districtFilter, setDistrictFilter] = useState("all");
const [sortBy, setSortBy] = useState("default");
const [stockFilter, setStockFilter] = useState("available");

// Cart stores product and quantity
const [cart, setCart] = useState([]);

const [showCart, setShowCart] = useState(false);
const [showCheckout, setShowCheckout] = useState(false);
const [submittingOrder, setSubmittingOrder] = useState(false);
const [orderSuccess, setOrderSuccess] = useState(null);
const [checkoutError, setCheckoutError] = useState("");

const [customer, setCustomer] = useState({
  customer_name: "",
  customer_phone: "",
  delivery_address: "",
  village: "",
  district: "",
  pincode: ""
});

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState("");

  // Fetch products from backend
  useEffect(() => {

    fetch("http://localhost:5000/api/products")
      .then(response => {
        if (!response.ok) {
          throw new Error("Unable to fetch products");
        }
        return response.json();
      })
      .then(data => {
        setProducts(data.products || []);
      })
      .catch(error => {
        console.error("Product fetching error:", error);
        setProductError(isTelugu ? "బియ్యం ఉత్పత్తులను లోడ్ చేయడం సాధ్యం కాలేదు. మళ్లీ ప్రయత్నించండి." : "Unable to load rice products. Please try again.");
      })
      .finally(() => {
        setLoadingProducts(false);
      });

  }, []);

  // Search products
  // Search and filter products
      const districts = [
        ...new Set(
          products
            .map(product => product.district)
            .filter(Boolean)
        )
      ];

        const filtered = products.filter(product => {

          const searchText = `
            ${product.name}
            ${product.farmer}
            ${product.location}
          `.toLowerCase();

          const matchesSearch =
            searchText.includes(search.toLowerCase());

          const matchesDistrict =
            districtFilter === "all" ||
            product.district === districtFilter;

          const matchesStock =
            stockFilter === "all" ||
            Number(product.stock_kg) > 0;

          return (
            matchesSearch &&
            matchesDistrict &&
            matchesStock
          );

        });

        // Sort products by price
        if (sortBy === "low") {
          filtered.sort(
            (a, b) => Number(a.price) - Number(b.price)
          );
        }

        if (sortBy === "high") {
          filtered.sort(
            (a, b) => Number(b.price) - Number(a.price)
          );
        }

  // Total number of items in cart
  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // Total cart price
  const cartTotal = cart.reduce(
    (total, item) =>
      total + Number(item.product.price) * item.quantity,
    0
  );

  // Add product to cart
  const addToCart = (product) => {

    setCart(oldCart => {

      const existing = oldCart.find(
        item => item.product.id === product.id
      );

      if (existing) {

        if (existing.quantity >= Number(product.stock_kg)) {
          alert("You cannot add more than available stock.");
          return oldCart;
        }

        return oldCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );

      }

      if (Number(product.stock_kg) < 1) {
        alert("This product is out of stock.");
        return oldCart;
      }

      return [
        ...oldCart,
        {
          product,
          quantity: 1
        }
      ];

    });

  };

  // Increase quantity
  const increaseQuantity = (productId) => {

    setCart(oldCart =>
      oldCart.map(item => {

        if (item.product.id === productId) {

          if (item.quantity >= Number(item.product.stock_kg)) {
            alert("Available stock limit reached.");
            return item;
          }

          return {
            ...item,
            quantity: item.quantity + 1
          };

        }

        return item;

      })
    );

  };

  // Decrease quantity
  const decreaseQuantity = (productId) => {

    setCart(oldCart =>
      oldCart
        .map(item =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter(item => item.quantity > 0)
    );

  };

  // Remove product
  const removeFromCart = (productId) => {

    setCart(oldCart =>
      oldCart.filter(
        item => item.product.id !== productId
      )
    );

  };


const handleCustomerChange = (e) => {
  const { name, value } = e.target;

  setCustomer(old => ({
    ...old,
    [name]: value
  }));
};

const placeOrder = async (e) => {
  e.preventDefault();

  if (cart.length === 0) {
    setCheckoutError("Your shopping cart is empty.");
    return;
  }

  setSubmittingOrder(true);
  setCheckoutError("");

  try {
    const response = await fetch("http://localhost:5000/api/orders", {
      method: "POST",
      headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${sessionStorage.getItem("customerToken")}`
},
      body: JSON.stringify({
        ...customer,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        }))
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to place order.");
    }

    setOrderSuccess(data);
    setCart([]);
    setShowCheckout(false);

    // Refresh product stock from the backend
    const productsResponse = await fetch(
      "http://localhost:5000/api/products"
    );

    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      setProducts(productsData.products || []);
    }

  } catch (error) {
    setCheckoutError(error.message);
  } finally {
    setSubmittingOrder(false);
  }
};

  return (

    <div>

      {/* NAVBAR */}

      <nav className="navbar">

        <h2>
          <Sprout />
          Farm to Family
        </h2>

        <div className="nav-links">

          <a href="#home">
            {isTelugu ? "హోమ్" : "Home"}
          </a>

          <a href="#products">
            {isTelugu ? "బియ్యం" : "Rice Products"}
          </a>

          <a href="#farmers">
            {isTelugu ? "రైతుల కోసం" : "For Farmers"}
          </a>

        </div>

        <div className="nav-actions">

          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="te">తెలుగు</option>
          </select>

          <button
            className="cart-btn"
            onClick={() => setShowCart(true)}
          >
            <ShoppingCart size={18} />
            {cartCount}
          </button>

        </div>

      </nav>


      {/* HERO SECTION */}

      {/* HERO SLIDER */}

<section className="hero-slider" id="home">

  <div className={`hero-slide ${slides[currentSlide].type}`}>

    <div className="hero-slide-content">

      <span className="hero-slide-label">
        {slides[currentSlide].type === "about" && (isTelugu ? "🌾 ఫార్మ్ టు ఫ్యామిలీ" : "🌾 FARM TO FAMILY")}

        {slides[currentSlide].type === "farmer" && (isTelugu ? "👨‍🌾 రైతుల కోసం" : "👨‍🌾 FOR FARMERS")}

        {slides[currentSlide].type === "customer" && (isTelugu ? "👨‍👩‍👧 వినియోగదారుల కోసం" : "👨‍👩‍👧 FOR CUSTOMERS")}
      </span>

      <h1>
        {slides[currentSlide].title}
      </h1>

      <p>
        {slides[currentSlide].description}
      </p>

      {slides[currentSlide].type === "about" && (
        <a
          href="#products"
          className="hero-slide-btn"
        >
          {isTelugu ? "బియ్యం చూడండి" : "Explore Rice"}
        </a>
      )}

      {slides[currentSlide].type === "farmer" && (
        <Link
          to="/farmer-register"
          className="hero-slide-btn"
        >
          {isTelugu ? "రైతుగా చేరండి" : "Join as a Farmer"}
        </Link>
      )}

      {slides[currentSlide].type === "customer" && (
        <a
          href="#products"
          className="hero-slide-btn"
        >
          {isTelugu ? "బియ్యం కొనండి" : "Shop Rice"}
        </a>
      )}

    </div>


    {/* SLIDER CONTROLS */}

    <button
      className="hero-arrow hero-arrow-left"
      onClick={() =>
        setCurrentSlide(
          currentSlide === 0
            ? slides.length - 1
            : currentSlide - 1
        )
      }
    >
      ‹
    </button>

    <button
      className="hero-arrow hero-arrow-right"
      onClick={() =>
        setCurrentSlide(
          (currentSlide + 1) % slides.length
        )
      }
    >
      ›
    </button>


    {/* SLIDER DOTS */}

    <div className="hero-dots">

      {slides.map((slide, index) => (
        <button
          key={slide.type}
          className={
            currentSlide === index
              ? "hero-dot active"
              : "hero-dot"
          }
          onClick={() => setCurrentSlide(index)}
        />
      ))}

    </div>

  </div>

</section>


      {/* FEATURES */}

      <section className="features">

        <div>
          <Sprout />
          <h3>{isTelugu ? "రైతుల నుండి నేరుగా" : "Direct From Farmers"}</h3>
          <p>{isTelugu ? "అనవసరమైన మధ్యవర్తులు లేరు" : "No unnecessary middlemen"}</p>
        </div>

        <div>
          <ShieldCheck />
          <h3>{isTelugu ? "నాణ్యమైన బియ్యం" : "Quality Rice"}</h3>
          <p>{isTelugu ? "మీ బియ్యం రకాన్ని తెలుసుకోండి" : "Know your rice variety"}</p>
        </div>

        <div>
          <Truck />
          <h3>{isTelugu ? "నేరుగా డెలివరీ" : "Direct Delivery"}</h3>
          <p>{isTelugu ? "రైతుల ద్వారా డెలివరీ" : "Delivered by farmers"}</p>
        </div>

      </section>


      {/* RICE PRODUCTS */}

      <section className="products-section" id="products">

        <h2>
          {isTelugu
            ? "మా బియ్యం రకాలు"
            : "Available Rice Varieties"}
        </h2>

        <p>
          {isTelugu
            ? "తెలంగాణ రైతుల నుండి తాజా బియ్యాన్ని కనుగొనండి."
            : "Discover fresh rice from Telangana farmers."}
        </p>

        <div className="product-filters">

          {/* District Filter */}
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
          >
            <option value="all">
              {isTelugu ? "అన్ని జిల్లాలు" : "All Districts"}
            </option>

            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>

          {/* Price Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="default">
              {isTelugu ? "ధర ప్రకారం" : "Sort by Price"}
            </option>

            <option value="low">
              {isTelugu ? "తక్కువ ధర నుండి ఎక్కువ ధర" : "Low to High"}
            </option>

            <option value="high">
              {isTelugu ? "ఎక్కువ ధర నుండి తక్కువ ధర" : "High to Low"}
            </option>
          </select>

          {/* Stock Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
            >
              <option value="available">
                {isTelugu ? "అందుబాటులో ఉన్న బియ్యం" : "Available Rice"}
              </option>

              <option value="all">
                {isTelugu ? "అన్ని బియ్యం" : "All Rice"}
              </option>
            </select>

        </div>

        {loadingProducts && (
          <p>
              {isTelugu
                ? "బియ్యం ఉత్పత్తులను లోడ్ చేస్తోంది..."
                : "Loading rice products..."}
            </p>
        )}

        {!loadingProducts && productError && (
          <p>{productError}</p>
        )}

        {!loadingProducts && !productError && (

          <div className="product-grid">

            {filtered.map(product => (

              <div className="product-card" key={product.id}>

                {/* RICE IMAGE */}

                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="product-image"
                  />
                ) : (
                  <div className="rice-placeholder">
                    🌾
                  </div>
                )}

                {/* PRODUCT DETAILS */}

                <div className="product-info">

                  <h3>{product.name}</h3>

                  <div className="product-detail">
                    <span>🌾</span>
                    <span>{isTelugu ? "రైతు:" : "Farmer:"} {product.farmer}</span>
                  </div>

                  <div className="product-detail">
                    <span>📍</span>
                    <span>{product.location}</span>
                  </div>

                  <div className="product-price">
                    ₹{product.price}
                    <span> / kg</span>
                  </div>

                  <div className="product-stock">
                    <span>{isTelugu ? "అందుబాటులో ఉన్న నిల్వ" : "Available Stock"}</span>
                    <strong>{product.stock_kg} kg</strong>
                  </div>

                  <button
                    className="product-cart-btn"
                    disabled={Number(product.stock_kg) <= 0}
                    onClick={() => addToCart(product)}
                  >
                    🛒 {isTelugu ? "బాస్కెట్‌లో చేర్చండి" : "Add to Basket"}
                  </button>

                  <button
                    className="product-details-btn"
                    onClick={() => setSelectedProduct(product)}
                  >
                    👁️ {isTelugu ? "వివరాలు చూడండి" : "View Details"}
                  </button>

                </div>

              </div>

            ))}

          </div>
        )}

        {!loadingProducts &&
            !productError &&
            filtered.length === 0 && (
              <div className="no-products-message">
                <h3>
                  {isTelugu
                    ? "బియ్యం అందుబాటులో లేదు"
                    : "No rice products found"}
                </h3>

                <p>
                  {isTelugu
                    ? "మీ శోధన లేదా ఫిల్టర్‌లను మార్చి మళ్లీ ప్రయత్నించండి."
                    : "Try changing your search or filters."}
                </p>
              </div>
            )}

      </section>


      {/* FARMER SECTION */}

      {/* PRODUCT DETAILS MODAL */}

{selectedProduct && (
  <div
    className="product-modal-overlay"
    onClick={() => setSelectedProduct(null)}
  >

    <div
      className="product-modal"
      onClick={(e) => e.stopPropagation()}
    >

      <button
        className="product-modal-close"
        onClick={() => setSelectedProduct(null)}
      >
        ×
      </button>

      {selectedProduct.image ? (
        <img
          src={selectedProduct.image}
          alt={selectedProduct.name}
          className="product-modal-image"
        />
      ) : (
        <div className="product-modal-placeholder">
          🌾
        </div>
      )}

      <div className="product-modal-content">

        <h2>{selectedProduct.name}</h2>

        <p className="product-modal-description">
            {selectedProduct.description ||
              (isTelugu
                ? "స్థానిక రైతు నుండి నేరుగా లభించే తాజా బియ్యం."
                : "Fresh rice directly from a local farmer.")}
          </p>

        <div className="product-modal-info">
            <p>
              🌾 <strong>
                {isTelugu ? "రైతు:" : "Farmer:"}
              </strong>{" "}
              {selectedProduct.farmer}
            </p>

            <p>
              📍 <strong>
                {isTelugu ? "ప్రాంతం:" : "Location:"}
              </strong>{" "}
              {selectedProduct.location}
            </p>

            <p>
              💰 <strong>
                {isTelugu ? "ధర:" : "Price:"}
              </strong>{" "}
              ₹{selectedProduct.price} / kg
            </p>

            <p>
              📦 <strong>
                {isTelugu ? "అందుబాటులో ఉన్న నిల్వ:" : "Available Stock:"}
              </strong>{" "}
              {selectedProduct.stock_kg} kg
            </p>

          </div>

        <button
          className="product-cart-btn"
          disabled={Number(selectedProduct.stock_kg) <= 0}
          onClick={() => {
            addToCart(selectedProduct);
            setSelectedProduct(null);
          }}
        >
          🛒 {isTelugu ? "బాస్కెట్‌లో చేర్చండి" : "Add to Basket"}
        </button>

      </div>

    </div>

  </div>
)}

      {/* CUSTOMER & FARMER SECTION */}

<section className="customer-farmer-section" id="farmers">
  <div className="customer-farmer-container">

    {/* CUSTOMER PANEL */}
    <div className="customer-panel">

      <div className="panel-icon">👨‍👩‍👧</div>

      <h2>
        {isTelugu ? "వినియోగదారుల కోసం" : "For Customers"}
      </h2>

      <p>
        {isTelugu
          ? "తెలంగాణ రైతుల నుండి నేరుగా తాజా బియ్యాన్ని కొనుగోలు చేయండి."
          : "Buy fresh rice directly from Telangana farmers."}
      </p>

      <div className="panel-actions">

        <Link
          to="/track-order"
          className="panel-btn"
        >
          <Truck size={18} />
          {isTelugu
            ? "నా ఆర్డర్‌ను ట్రాక్ చేయండి"
            : "Track My Order"}
        </Link>

        <Link
          to="/customer-auth"
          className="panel-btn"
        >
          <User size={18} />
          {isTelugu
            ? "వినియోగదారుల లాగిన్"
            : "Customer Login"}
        </Link>

        <Link
          to="/customer-dashboard"
          className="panel-btn"
        >
          <Package size={18} />
          {isTelugu
            ? "నా ఆర్డర్లు"
            : "My Orders"}
        </Link>

        <a
          href="#products"
          className="panel-btn primary-panel-btn"
        >
          <ShoppingCart size={18} />
          {isTelugu
            ? "బియ్యం కొనండి"
            : "Shop Rice"}
        </a>

      </div>
    </div>


    {/* FARMER PANEL */}
    <div className="farmer-panel">

      <div className="panel-icon">🌾</div>

      <h2>
        {isTelugu ? "రైతుల కోసం" : "For Farmers"}
      </h2>

      <p>
        {isTelugu
          ? "మీ బియ్యాన్ని నేరుగా వినియోగదారులకు అమ్మి మెరుగైన లాభాలను పొందండి."
          : "Sell your rice directly to customers and earn better profits."}
      </p>

      <div className="panel-actions">

        <Link
          to="/farmer-register"
          className="panel-btn primary-panel-btn"
        >
          <Sprout size={18} />
          {isTelugu
            ? "రైతుగా చేరండి"
            : "Join as a Farmer"}
        </Link>

        <Link
          to="/farmer-dashboard"
          className="panel-btn"
        >
          <Package size={18} />
          {isTelugu
            ? "రైతు డాష్‌బోర్డ్"
            : "Farmer Dashboard"}
        </Link>

        <a
          href="#products"
          className="panel-btn"
        >
          <ShoppingCart size={18} />
          {isTelugu
            ? "మార్కెట్‌ప్లేస్ చూడండి"
            : "View Marketplace"}
        </a>

      </div>
    </div>
  </div>
  
</section>


      {/* FOOTER */}

      <footer>

        <h2>🌾 Farm to Family</h2>

        <p>
          Connecting Telangana farmers directly with families.
        </p>

        <p>© 2026 Farm to Family {isTelugu ? "— రైతు నుండి కుటుంబానికి" : "— From Farmer to Family"}</p>

      </footer>


      {/* SHOPPING CART */}

      {showCart && (

        <div className="cart-overlay">

          <div className="cart-panel">

            <div className="cart-header">

              <h2>
                <ShoppingCart size={23} />
                My Shopping Cart
              </h2>

              <button
                className="cart-close"
                onClick={() => setShowCart(false)}
              >
                <X />
              </button>

            </div>


            {cart.length === 0 ? (

              <div className="empty-cart">

                <ShoppingCart size={55} />

                <h3>{isTelugu ? "మీ బాస్కెట్ ఖాళీగా ఉంది!" : "Your basket is empty!"}</h3>

                <p>{isTelugu ? "కొంత తాజా బియ్యాన్ని మీ బాస్కెట్‌లో చేర్చండి." : "Add some fresh rice to your basket."}</p>

                <button
                  onClick={() => setShowCart(false)}
                >
                  {isTelugu ? "షాపింగ్ కొనసాగించండి" : "Continue Shopping"}
                </button>

              </div>

            ) : (

              <>

                <div className="cart-items">

                  {cart.map(item => (

                    <div
                      className="cart-item"
                      key={item.product.id}
                    >

                      <div className="cart-item-details">

                        <h3>{item.product.name}</h3>

                        <p>
                          {isTelugu ? "రైతు:" : "Farmer:"} {item.product.farmer}
                        </p>

                        <p>
                          ₹{item.product.price} / kg
                        </p>

                        <p>
                          {isTelugu ? "ఉపమొత్తం:" : "Subtotal:"} ₹
                          {(Number(item.product.price) * item.quantity).toFixed(2)}
                        </p>

                      </div>


                      <div className="quantity-controls">

                        <button
                          onClick={() => decreaseQuantity(item.product.id)}
                        >
                          <Minus size={15} />
                        </button>

                        <span>{item.quantity} kg</span>

                        <button
                          onClick={() => increaseQuantity(item.product.id)}
                        >
                          <Plus size={15} />
                        </button>

                      </div>


                      <button
                        className="remove-cart-item"
                        onClick={() => removeFromCart(item.product.id)}
                        title="Remove product"
                      >
                        <Trash2 size={18} />
                      </button>

                    </div>

                  ))}

                </div>


                <div className="cart-footer">

                  <div className="cart-total">

                    <span>{isTelugu ? "మొత్తం" : "Total Amount"}</span>

                    <h2>₹{cartTotal.toFixed(2)}</h2>

                  </div>

                  <button
                    className="checkout-btn"
                    onClick={() => {
                      setCheckoutError("");
                      setShowCart(false);
                      setShowCheckout(true);
                    }}
                  >
                    {isTelugu ? "చెక్‌అవుట్‌కు వెళ్లండి" : "Proceed to Checkout"}
                  </button>

                </div>

              </>

            )}

          </div>

        </div>

      )}
        
      {/* CUSTOMER CHECKOUT */}

      {showCheckout && (

        <div className="cart-overlay">

          <div className="cart-panel">

            <div className="cart-header">

              <h2>{isTelugu ? "వినియోగదారు చెక్‌అవుట్" : "Customer Checkout"}</h2>

              <button
                className="cart-close"
                onClick={() => setShowCheckout(false)}
                type="button"
              >
                <X />
              </button>

            </div>

            <form
  onSubmit={(e) => {
    e.preventDefault();

    if (cart.length === 0) {
      setCheckoutError("Your shopping cart is empty.");
      return;
    }

    setCheckoutError("");

    navigate("/payment", {
      state: {
        cart,
        customer
      }
    });
  }}
  className="checkout-form"
>

              <h3>{isTelugu ? "వినియోగదారు సమాచారం" : "Customer Information"}</h3>

              <label>{isTelugu ? "పూర్తి పేరు" : "Full Name"}</label>

              <input
                type="text"
                name="customer_name"
                placeholder={isTelugu ? "మీ పూర్తి పేరు నమోదు చేయండి" : "Enter your full name"}
                value={customer.customer_name}
                onChange={handleCustomerChange}
                required
              />

              <label>{isTelugu ? "మొబైల్ నంబర్" : "Mobile Number"}</label>

              <input
                type="tel"
                name="customer_phone"
                placeholder="10-digit mobile number"
                value={customer.customer_phone}
                onChange={handleCustomerChange}
                pattern="[6-9][0-9]{9}"
                maxLength="10"
                required
              />

              <h3>{isTelugu ? "డెలివరీ చిరునామా" : "Delivery Address"}</h3>

              <label>{isTelugu ? "ఇంటి నంబర్ మరియు వీధి" : "House Number and Street"}</label>

              <textarea
                name="delivery_address"
                placeholder="Enter house number, street and landmark"
                value={customer.delivery_address}
                onChange={handleCustomerChange}
                required
              />

              <label>{isTelugu ? "గ్రామం / పట్టణం" : "Village / Town"}</label>

              <input
                type="text"
                name="village"
                placeholder="Enter village or town"
                value={customer.village}
                onChange={handleCustomerChange}
                required
              />

              <label>{isTelugu ? "జిల్లా" : "District"}</label>

              <input
                type="text"
                name="district"
                placeholder="Enter district"
                value={customer.district}
                onChange={handleCustomerChange}
                required
              />

              <label>{isTelugu ? "పిన్‌కోడ్" : "Pincode"}</label>

              <input
                type="text"
                name="pincode"
                placeholder="6-digit pincode"
                value={customer.pincode}
                onChange={handleCustomerChange}
                pattern="[0-9]{6}"
                maxLength="6"
                required
              />

              <div className="checkout-summary">

                <h3>{isTelugu ? "ఆర్డర్ సారాంశం" : "Order Summary"}</h3>

                {cart.map(item => (

                  <p key={item.product.id}>
                    {item.product.name} × {item.quantity} kg
                    {" — "}
                    ₹{(
                      Number(item.product.price) * item.quantity
                    ).toFixed(2)}
                  </p>

                ))}

                <h2>{isTelugu ? "మొత్తం:" : "Total:"} ₹{cartTotal.toFixed(2)}</h2>

              </div>

              {checkoutError && (
                <p className="checkout-error">
                  {checkoutError}
                </p>
              )}

              <button
  type="submit"
  className="checkout-btn"
>
  {isTelugu ? "చెల్లింపుకు వెళ్లండి" : "Proceed to Payment"}
</button>

            </form>

          </div>

        </div>

      )}


      {/* ORDER SUCCESS MESSAGE */}

      {orderSuccess && (

        <div className="cart-overlay">

          <div className="cart-panel order-success">

            <h2>🎉 {isTelugu ? "ఆర్డర్ విజయవంతంగా నమోదు చేయబడింది!" : "Order Placed Successfully!"}</h2>

            <p>{isTelugu ? "మీ బియ్యం ఆర్డర్ అందింది." : "Your rice order has been received."}</p>

            <h3>
              {isTelugu ? "ఆర్డర్ ఐడి:" : "Order ID:"} #{orderSuccess.orderId}
            </h3>

            <h2>
              Amount: ₹{Number(orderSuccess.totalAmount).toFixed(2)}
            </h2>

            <p>{isTelugu ? "స్థితి:" : "Status:"} {orderSuccess.status}</p>

            <button
              className="checkout-btn"
              onClick={() => setOrderSuccess(null)}
            >
              {isTelugu ? "షాపింగ్ కొనసాగించండి" : "Continue Shopping"}
            </button>

          </div>

        </div>

      )}

    </div>

  );

}


// MAIN APP ROUTING

function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/farmer-register"
          element={<FarmerAuth />}
        />

        <Route
          path="/farmer-dashboard"
          element={<FarmerDashboard />}
        />

        <Route path="/track-order" element={<TrackOrder />} />

        <Route path="/customer-auth" element={<CustomerAuth />} />

        <Route path="/customer-dashboard" element={<CustomerDashboard />} />

        <Route path="/payment" element={<Payment />} />

      </Routes>

    </BrowserRouter>

  );

}

export default App;
