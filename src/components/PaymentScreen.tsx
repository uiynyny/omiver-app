import React, { useState, useEffect } from 'react';
import { fetchPayments, createPaymentIntent, confirmPaymentApi } from '../api/user';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Lock, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import './PaymentScreen.css';

const stripePromise = loadStripe('pk_test_placeholder');

const PaymentScreen: React.FC = () => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm />
    </Elements>
  );
};

const PaymentForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAppContext();
  const clientId = state.auth.clientId;
  const numericClientId = Number(clientId ?? 0);
  const stripe = useStripe();
  const elements = useElements();

  const kit = location.state?.kit || {
    title: 'Premium Test',
    price: '$499',
    badge: '150 biomarkers tested' // Fallback
  };

  // Parse price to determine if free
  const parsePrice = (): number => {
    if (typeof kit.price === 'number') return kit.price;
    if (typeof kit.price === 'string') {
      const numStr = kit.price.replace(/[^0-9.]/g, '');
      return parseFloat(numStr) || 0;
    }
    return 0;
  };
  const isFreeOrder = parsePrice() === 0;

  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(location.state?.quantity || 1);
  const [formData, setFormData] = useState({
    cardholderName: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (clientId) {
      fetchPayments(clientId).then((data) => {
        if (data && data.length > 0) {
          const latestPayment = data[0]; // Most recent payment
          setFormData((prev) => ({
            ...prev,
            cardholderName: latestPayment?.cardholder_name || '',
            streetAddress: latestPayment?.billing_address?.street_address || '',
            city: latestPayment?.billing_address?.city || '',
            state: latestPayment?.billing_address?.state || '',
            zipCode: latestPayment?.billing_address?.zip_code || '',
          }));
        }
      }).catch((error) => console.error(error));
    }
  }, [clientId]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!numericClientId) {
        throw new Error('Missing client account. Please log in again.');
      }

      // For free orders, skip Stripe and just confirm with shipping address
      if (isFreeOrder) {
        await confirmPaymentApi({
            payment_intent_id: 'free_order',
            test_kit_id: kit.id || 1,
            quantity,
            street_address: formData.streetAddress,
            city: formData.city,
            state: formData.state,
            zip_code: formData.zipCode,
            cardholder_name: formData.cardholderName || 'N/A',
        });
        setLoading(false);
        navigate('/orders');
        return;
      }

      // Paid order flow
      if (!stripe || !elements) {
        setLoading(false);
        return;
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setLoading(false);
        return;
      }

      const { clientSecret } = await createPaymentIntent(kit.id || 1, numericClientId, quantity);

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: formData.cardholderName,
            address: {
              line1: formData.streetAddress,
              city: formData.city,
              state: formData.state,
              postal_code: formData.zipCode,
            }
          }
        }
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.paymentIntent.status === 'succeeded') {
        await confirmPaymentApi({
            payment_intent_id: result.paymentIntent.id,
            street_address: formData.streetAddress,
            city: formData.city,
            state: formData.state,
            zip_code: formData.zipCode,
            cardholder_name: formData.cardholderName,
        });

        setLoading(false);
        navigate('/orders');
      } else {
        throw new Error('Payment status: ' + result.paymentIntent.status);
      }
    } catch (error: unknown) {
      setLoading(false);
      console.error(error);
      alert(error instanceof Error ? error.message : 'Payment failed');
    }
  };

  return (
    <div className="payment-root">
      <div className="payment-modal">
        <header className="payment-header">
          <div className="payment-drag-handle"></div>
          <h2>Complete your Purchase</h2>
          <button className="payment-close-btn" onClick={() => navigate(-1)}>
            <X size={24} />
          </button>
        </header>

        <form className="payment-content" onSubmit={handlePay}>

          <div className="order-summary-card">
            <div className="order-summary-info">
              <h3>{kit.title}</h3>
              <div className="order-summary-sub">{kit.badge || 'Test Kit'}</div>
            </div>
            <div className="order-price">{kit.price}</div>
          </div>

          <div className="form-section">
            <label className="form-label">
              <h3>Quantity</h3>
              <div className="input-group">
                <input 
                  type="number" 
                  min="1" 
                  max="999" 
                  value={quantity} 
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-input"
                />
              </div>
              <div className="quantity-note">Volume discounts may apply for larger orders</div>
            </label>
          </div>

          {!isFreeOrder && (
            <div className="form-section">
              <label className="form-label">
                <h3>Card Information</h3>
                <div className="input-group">
                  <input type="text" name="cardholderName" className="text-input" placeholder="Cardholder Name" value={formData.cardholderName} onChange={handleInputChange} required />
                </div>

                <div className="input-group card-input-container" style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '4px' }}>
                  <CardElement options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                      invalid: {
                        color: '#9e2146',
                      },
                    },
                  }} />
                </div>
              </label>
            </div>
          )}

          <div className="form-section">
            <label className="form-label">
              <h3>Shipping Address</h3>

              <div className="input-group">
                <input type="text" name="streetAddress" className="text-input" placeholder="Street Address" value={formData.streetAddress} onChange={handleInputChange} required />
              </div>
              <div className="input-group">
                <input type="text" name="city" className="text-input" placeholder="City" value={formData.city} onChange={handleInputChange} required />
              </div>

              <div className="form-row">
                <div className="input-group">
                  <input type="text" name="state" className="text-input" placeholder="State" value={formData.state} onChange={handleInputChange} required />
                </div>
                <div className="input-group">
                  <input type="text" name="zipCode" className="text-input" placeholder="Zip Code" value={formData.zipCode} onChange={handleInputChange} required />
                </div>
              </div>
            </label>
          </div>

          {!isFreeOrder && (
            <div className="security-note">
              <Lock size={12} />
              <span>Your payment information is encrypted and secure</span>
            </div>
          )}

          <div className="payment-footer">
            <button type="submit" className="pay-btn" disabled={loading}>
              {loading ? 'Processing...' : (isFreeOrder ? 'Complete Free Order' : `Pay ${kit.price}`)}
              {!loading && <ChevronRight size={20} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentScreen;
