import React, { useState, useEffect } from 'react';
import { fetchPayments, createPaymentIntent, confirmPaymentApi, fetchDefaultShippingAddress } from '../api/user';
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
    zipCode: '',
    country: 'United States'
  });

  const [hasSavedCard, setHasSavedCard] = useState(false);
  const [useSavedCard, setUseSavedCard] = useState(false);
  const [savedCardText, setSavedCardText] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    // 1. Check local registration context for saved card
    const reg = state.registration;
    if (reg.card_last_four) {
      setHasSavedCard(true);
      setUseSavedCard(true);
      setSavedCardText(`${reg.card_brand || 'Visa'} •••• ${reg.card_last_four}`);
    }

    if (clientId) {
      fetchDefaultShippingAddress(clientId).then((addr) => {
        if (addr && Object.keys(addr).length) {
          setFormData((prev) => ({
            ...prev,
            cardholderName: prev.cardholderName || reg.cardholder_name || `${reg.first_name || ''} ${reg.last_name || ''}`.trim() || 'Omiver User',
            streetAddress: addr?.street_address || reg.shipping_street || reg.billing_street || '',
            city: addr?.city || reg.shipping_city || reg.billing_city || '',
            state: addr?.state || reg.shipping_state || reg.billing_state || '',
            zipCode: addr?.zip_code || reg.shipping_zip || reg.billing_zip || '',
            country: addr?.country || reg.shipping_country || reg.billing_country || 'United States',
          }));
        } else {
          // Fallback to local context address
          setFormData((prev) => ({
            ...prev,
            cardholderName: prev.cardholderName || reg.cardholder_name || `${reg.first_name || ''} ${reg.last_name || ''}`.trim() || 'Omiver User',
            streetAddress: reg.shipping_street || reg.billing_street || '',
            city: reg.shipping_city || reg.billing_city || '',
            state: reg.shipping_state || reg.billing_state || '',
            zipCode: reg.shipping_zip || reg.billing_zip || '',
            country: reg.shipping_country || reg.billing_country || 'United States',
          }));

          fetchPayments(clientId).then((data) => {
            if (data && data.length > 0) {
              const latestPayment = data[0];
              setHasSavedCard(true);
              setUseSavedCard(true);
              setSavedCardText(`${latestPayment.card_brand || 'Visa'} •••• ${latestPayment.card_last_four}`);
              
              setFormData((prev) => ({
                ...prev,
                cardholderName: prev.cardholderName || latestPayment?.cardholder_name || '',
                streetAddress: prev.streetAddress || latestPayment?.billing_address?.street_address || reg.shipping_street || reg.billing_street || '',
                city: prev.city || latestPayment?.billing_address?.city || reg.shipping_city || reg.billing_city || '',
                state: prev.state || latestPayment?.billing_address?.state || reg.shipping_state || reg.billing_state || '',
                zipCode: prev.zipCode || latestPayment?.billing_address?.zip_code || reg.shipping_zip || reg.billing_zip || '',
              }));
            }
          }).catch((error) => console.error(error));
        }
      }).catch(() => {
        // Safe fallback if endpoint errors or offline
        setFormData((prev) => ({
          ...prev,
          cardholderName: prev.cardholderName || reg.cardholder_name || `${reg.first_name || ''} ${reg.last_name || ''}`.trim() || 'Omiver User',
          streetAddress: reg.shipping_street || reg.billing_street || '',
          city: reg.shipping_city || reg.billing_city || '',
          state: reg.shipping_state || reg.billing_state || '',
          zipCode: reg.shipping_zip || reg.billing_zip || '',
          country: reg.shipping_country || reg.billing_country || 'United States',
        }));

        fetchPayments(clientId).then((data) => {
          if (data && data.length > 0) {
            const latestPayment = data[0];
            setHasSavedCard(true);
            setUseSavedCard(true);
            setSavedCardText(`${latestPayment.card_brand || 'Visa'} •••• ${latestPayment.card_last_four}`);
            
            setFormData((prev) => ({
              ...prev,
              cardholderName: prev.cardholderName || latestPayment?.cardholder_name || '',
              streetAddress: prev.streetAddress || latestPayment?.billing_address?.street_address || reg.shipping_street || reg.billing_street || '',
              city: prev.city || latestPayment?.billing_address?.city || reg.shipping_city || reg.billing_city || '',
              state: prev.state || latestPayment?.billing_address?.state || reg.shipping_state || reg.billing_state || '',
              zipCode: prev.zipCode || latestPayment?.billing_address?.zip_code || reg.shipping_zip || reg.billing_zip || '',
            }));
          }
        }).catch((error) => console.error(error));
      });
    }
  }, [clientId, state.registration]);

  const handlePay = async (e: React.SubmitEvent) => {
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
            country: formData.country,
            cardholder_name: formData.cardholderName || 'N/A',
        });
        setLoading(false);
        navigate('/orders');
        return;
      }

      // Pay with card on file (development shortcut / one-click checkout)
      if (useSavedCard) {
        await confirmPaymentApi({
            payment_intent_id: 'saved_card_checkout',
            test_kit_id: kit.id || 1,
            quantity,
            street_address: formData.streetAddress,
            city: formData.city,
            state: formData.state,
            zip_code: formData.zipCode,
            country: formData.country,
            cardholder_name: formData.cardholderName,
        });
        setLoading(false);
        navigate('/orders');
        return;
      }

      // Paid order flow via Stripe Elements
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
            country: formData.country,
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
                
                {hasSavedCard && (
                  <div className="saved-card-checkout-toggle" style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }} onClick={() => setUseSavedCard(!useSavedCard)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 22 }}>💳</span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#2d3748' }}>Use Saved Card on File</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b9b8a', fontWeight: 600 }}>{savedCardText}</div>
                      </div>
                    </div>
                    <input type="checkbox" checked={useSavedCard} onChange={(e) => setUseSavedCard(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#6b9b8a' }} onClick={(e) => e.stopPropagation()} />
                  </div>
                )}

                <div className="input-group">
                  <input type="text" name="cardholderName" className="text-input" placeholder="Cardholder Name" value={formData.cardholderName} onChange={handleInputChange} required />
                </div>

                {!useSavedCard && (
                  <div className="input-group card-input-container" style={{ padding: '12px', border: '1px solid #ccc', borderRadius: '4px', background: 'white' }}>
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
                )}

                {useSavedCard && (
                  <div style={{ background: '#f0fff4', border: '1px solid #c6f6d5', color: '#22543d', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>✨</span> One-Click Checkout enabled with your saved card ({savedCardText})
                  </div>
                )}
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

              <div className="input-group">
                <input type="text" name="country" className="text-input" placeholder="Country" value={formData.country} onChange={handleInputChange} required />
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
