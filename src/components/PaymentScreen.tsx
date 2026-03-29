import React, { useState, useEffect } from 'react';
import { fetchPayments, checkout } from '../api/user';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Lock, CreditCard, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './PaymentScreen.css';

const PaymentScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAppContext();
  const clientId = state.auth.clientId;
  
  const kit = location.state?.kit || {
    title: 'Premium Test',
    price: '$499',
    badge: '150 biomarkers tested' // Fallback
  };

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
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
            cardholderName: latestPayment.cardholder_name || '',
            streetAddress: latestPayment.billing_address?.street_address || '',
            city: latestPayment.billing_address?.city || '',
            state: latestPayment.billing_address?.state || '',
            zipCode: latestPayment.billing_address?.zip_code || '',
            // We don't store full card number or cvv, so leave them empty
          }));
        }
      }).catch((error) => console.error(error));
    }
  }, [clientId]);

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      client_id: clientId,
      test_kit_id: kit.id || 1, // Fallback to 1 if missing for testing
      cardholder_name: formData.cardholderName,
      card_number: formData.cardNumber,
      expiry_date: formData.expiryDate,
      cvv: formData.cvv,
      street_address: formData.streetAddress,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zipCode,
    };

    checkout(payload).then((data) => {
      setLoading(false);
      navigate('/orders');
    }).catch((error) => {
      setLoading(false);
      console.error(error);
      alert(error.message || 'Payment failed');
    });
  };

  return (
    <div className="payment-root">
      {/* Background overlay click to close? Optional */}
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
              <h3>Card Information</h3>
              <div className="input-group">
                <input type="text" name="cardholderName" className="text-input" placeholder="Cardholder Name" autoComplete='cc-name' value={formData.cardholderName} onChange={handleInputChange} required />
              </div>

              <div className="input-group card-input-container">
                <input type="text" name="cardNumber" className="text-input" placeholder="Card Number" autoComplete='cc-number' inputMode="numeric" pattern="[0-9]*" value={formData.cardNumber} onChange={handleInputChange} required />
                <CreditCard className="card-icon" size={20} />
              </div>

              <div className="form-row">
                <div className="input-group">
                  <input type="text" name="expiryDate" className="text-input" placeholder="Expiry Date (MM/YY)" autoComplete='cc-exp' value={formData.expiryDate} onChange={handleInputChange} required />
                </div>
                <div className="input-group">
                  <input type="text" name="cvv" className="text-input" placeholder="CVV" autoComplete='cc-csc' inputMode="numeric" pattern="[0-9]*" value={formData.cvv} onChange={handleInputChange} required />
                </div>
              </div>
            </label>
          </div>

          <div className="form-section">
            <label className="form-label">
              <h3>Billing Address</h3>

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

          <div className="security-note">
            <Lock size={12} />
            <span>Your payment information is encrypted and secure</span>
          </div>

          <div className="payment-footer">
            <button type="submit" className="pay-btn" disabled={loading}>
              {loading ? 'Processing...' : `Pay ${kit.price}`}
              {!loading && <ChevronRight size={20} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentScreen;
