import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Smartphone,
  CreditCard,
  Banknote,
  ShieldCheck,
  CheckCircle
} from "lucide-react";

function Payment() {
  const navigate = useNavigate();
  const location = useLocation();

  const cart = location.state?.cart || [];
  const customer = location.state?.customer || null;

  const [paymentMethod, setPaymentMethod] = useState("upi");
const [processing, setProcessing] = useState(false);
const [success, setSuccess] = useState(false);
const [orderData, setOrderData] = useState(null);
const [paymentError, setPaymentError] = useState("");

  // Calculate total using your existing cart structure
  const totalAmount = cart.reduce(
    (total, item) =>
      total +
      Number(item.product.price || 0) * Number(item.quantity || 0),
    0
  );

  const handlePayment = async () => {
  if (!cart.length || !customer) {
    alert(t("Order information is missing.", "ఆర్డర్ సమాచారం అందుబాటులో లేదు."));
    navigate("/");
    return;
  }

  const token = sessionStorage.getItem("customerToken");

  if (!token) {
    alert(t("Please login as a customer first.", "ముందుగా కస్టమర్‌గా లాగిన్ అవ్వండి."));
    navigate("/customer-auth");
    return;
  }

  setProcessing(true);
  setPaymentError("");

  try {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Create the actual order in the backend
    const response = await fetch(
      "http://localhost:5000/api/orders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...customer,
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity
          }))
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || t("Unable to create order.", "ఆర్డర్ సృష్టించలేకపోయాము.")
      );
    }

    // Payment + order successful
    setOrderData(data);
    setSuccess(true);

  } catch (error) {
    console.error("Payment / order error:", error);
    setPaymentError(error.message);
  } finally {
    setProcessing(false);
  }
};

  const continueAfterPayment = () => {
    navigate("/", {
      state: {
        paymentSuccess: true
      }
    });
  };

  // Payment success screen
  if (success) {
    return (
    <div className="payment-page">
        <div className="payment-success-card">

          <div className="payment-success-icon">
            <CheckCircle size={70} />
          </div>

          <h1>{t("Payment Successful!", "చెల్లింపు విజయవంతమైంది!")}</h1>

          <p>
            Your payment of{" "}
            <strong>₹{totalAmount.toFixed(2)}</strong>{" "}
            has been completed successfully.
          </p>

          {orderData && (
            <div className="payment-order-confirmation">

              <h2>{t("Order Confirmed 🎉", "ఆర్డర్ నిర్ధారించబడింది 🎉")}</h2>

              <p>
                <strong>{t("Order ID:", "ఆర్డర్ ID:")}</strong>{" "}
                #{orderData.orderId}
              </p>

              <p>
                <strong>{t("Amount:", "మొత్తం:")}</strong>{" "}
                ₹{Number(orderData.totalAmount).toFixed(2)}
              </p>

              <p>
                <strong>{t("Status:", "స్థితి:")}</strong>{" "}
                {orderData.status}
              </p>

            </div>
          )}

          <div className="payment-success-details">

            <p>
              <strong>{t("Payment Method:", "చెల్లింపు విధానం:")}</strong>{" "}
              {getPaymentMethodText()}
            </p>

            <p>
              <strong>Status:</strong> {t("Payment Completed", "చెల్లింపు పూర్తయింది")}
            </p>

          </div>

          <button
            className="payment-continue-button"
            onClick={continueAfterPayment}
          >
            {t("Continue", "కొనసాగించండి")}
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">

      <div className="payment-container">

        {/* HEADER */}
        <div className="payment-header">

          <button
            className="payment-back-button"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
            {t("Back", "వెనక్కి")}
          </button>

          <div>
            <h1>{t("Payment", "చెల్లింపు")}</h1>
            <p>{t("Complete your rice order securely", "మీ బియ్యం ఆర్డర్‌ను సురక్షితంగా పూర్తి చేయండి")}</p>
          </div>

          <div className="payment-secure">
            <ShieldCheck size={18} />
            {t("Secure Checkout", "సురక్షిత చెక్అవుట్")}
          </div>

        </div>

        <div className="payment-content">

          {/* PAYMENT METHODS */}
          <div className="payment-method-section">

            <h2>{t("Select Payment Method", "చెల్లింపు విధానాన్ని ఎంచుకోండి")}</h2>

            {/* UPI */}
            <div
              className={`payment-method ${
                paymentMethod === "upi"
                  ? "payment-method-active"
                  : ""
              }`}
              onClick={() => setPaymentMethod("upi")}
            >

              <div className="payment-method-icon">
                <Smartphone size={25} />
              </div>

              <div className="payment-method-info">
                <h3>UPI</h3>
                <p>
                  {t(
                    "Google Pay, PhonePe, Paytm and other UPI apps",
                    "Google Pay, PhonePe, Paytm మరియు ఇతర UPI యాప్‌లు"
                  )}
                </p>
              </div>

              <input
                type="radio"
                checked={paymentMethod === "upi"}
                onChange={() => setPaymentMethod("upi")}
              />

            </div>

            {/* CARD */}
            <div
              className={`payment-method ${
                paymentMethod === "card"
                  ? "payment-method-active"
                  : ""
              }`}
              onClick={() => setPaymentMethod("card")}
            >

              <div className="payment-method-icon">
                <CreditCard size={25} />
              </div>

              <div className="payment-method-info">
                <h3>{t("Debit / Credit Card", "డెబిట్ / క్రెడిట్ కార్డ్")}</h3>
                <p>
                  {t(
                    "Visa, Mastercard, RuPay and other cards",
                    "Visa, Mastercard, RuPay మరియు ఇతర కార్డులు"
                  )}
                </p>
              </div>

              <input
                type="radio"
                checked={paymentMethod === "card"}
                onChange={() => setPaymentMethod("card")}
              />

            </div>

            {/* COD */}
            <div
              className={`payment-method ${
                paymentMethod === "cod"
                  ? "payment-method-active"
                  : ""
              }`}
              onClick={() => setPaymentMethod("cod")}
            >

              <div className="payment-method-icon">
                <Banknote size={25} />
              </div>

              <div className="payment-method-info">
                <h3>{t("Cash on Delivery", "క్యాష్ ఆన్ డెలివరీ")}</h3>
                <p>
                  {t(
                    "Pay when your rice is delivered",
                    "మీ బియ్యం డెలివరీ అయినప్పుడు చెల్లించండి"
                  )}
                </p>
              </div>

              <input
                type="radio"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
              />

            </div>

            {/* UPI DETAILS */}
            {paymentMethod === "upi" && (
              <div className="payment-input-box">

                <label>{t("UPI ID", "UPI ID")}</label>

                <input
                  type="text"
                  placeholder={t("example@upi", "example@upi")}
                />

                <p>
                  {t(
                    "Demo payment only. No real payment will be processed.",
                    "ఇది డెమో చెల్లింపు మాత్రమే. నిజమైన చెల్లింపు ప్రాసెస్ చేయబడదు."
                  )}
                </p>

              </div>
            )}

            {/* CARD DETAILS */}
            {paymentMethod === "card" && (
              <div className="payment-input-box">

                <label>{t("Card Number", "కార్డ్ నంబర్")}</label>

                <input
                  type="text"
                  placeholder="XXXX XXXX XXXX XXXX"
                  maxLength="19"
                />

                <div className="card-row">

                  <div>
                    <label>{t("Expiry Date", "గడువు తేదీ")}</label>

                    <input
                      type="text"
                      placeholder="MM/YY"
                      maxLength="5"
                    />
                  </div>

                  <div>
                    <label>{t("CVV", "CVV")}</label>

                    <input
                      type="password"
                      placeholder="XXX"
                      maxLength="3"
                    />
                  </div>

                </div>

                <p>
                  {t(
                    "Demo only — do not enter real card details.",
                    "డెమో కోసం మాత్రమే — నిజమైన కార్డ్ వివరాలను నమోదు చేయవద్దు."
                  )}
                </p>

              </div>
            )}

            {/* COD DETAILS */}
            {paymentMethod === "cod" && (
              <div className="payment-input-box cod-message">

                <Banknote size={30} />

                <div>
                  <strong>{t("Cash on Delivery", "క్యాష్ ఆన్ డెలివరీ")}</strong>

                  <p>
                    {t(
                      "Pay the farmer when your rice order reaches you.",
                      "మీ బియ్యం ఆర్డర్ మీకు చేరుకున్నప్పుడు రైతుకు చెల్లించండి."
                    )}
                  </p>
                </div>

              </div>
            )}

          </div>

          {/* ORDER SUMMARY */}
          <div className="payment-summary">

            <h2>{t("Order Summary", "ఆర్డర్ సారాంశం")}</h2>

            {cart.map((item) => {

              const price = Number(item.product.price || 0);
              const quantity = Number(item.quantity || 0);
              const subtotal = price * quantity;

              return (
                <div
                  className="payment-product"
                  key={item.product.id}
                >

                  <div>

                    <strong>
                      {item.product.name}
                    </strong>

                    <p>
                      {quantity} kg × ₹
                      {price.toFixed(2)}
                    </p>

                  </div>

                  <strong>
                    ₹{subtotal.toFixed(2)}
                  </strong>

                </div>
              );
            })}

            <div className="payment-total">

              <span>{t("Total Amount", "మొత్తం మొత్తం")}</span>

              <strong>
                ₹{totalAmount.toFixed(2)}
              </strong>

            </div>

            {paymentError && (
  <div className="payment-error">
    {paymentError}
  </div>
)}

            <button
              className="pay-now-button"
              onClick={handlePayment}
              disabled={processing}
            >
              {processing
                ? t("Processing...", "ప్రాసెస్ అవుతోంది...")
                : paymentMethod === "cod"
                ? t("Place Order", "ఆర్డర్ చేయండి")
                : `${t("Pay", "చెల్లించండి")} ₹${totalAmount.toFixed(2)}`}
            </button>

            <div className="payment-security">

              <ShieldCheck size={18} />

              <span>
                {t(
                  "Your payment information is secure.",
                  "మీ చెల్లింపు సమాచారం సురక్షితంగా ఉంది."
                )}
              </span>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Payment;