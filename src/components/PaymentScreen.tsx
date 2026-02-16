import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Lock, CreditCard, ChevronRight } from 'lucide-react';
import './PaymentScreen.css';

const PaymentScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const kit = location.state?.kit || {
    title: 'Premium Test',
    price: '$499',
    badge: '150 biomarkers tested' // Fallback
  };

  const [loading, setLoading] = useState(false);

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // Navigate to order confirmation or orders list
      // For now, let's go to orders to show "it's done"
      navigate('/orders'); 
    }, 1500);
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
            <label className="form-label">Card Information</label>
            
            <div className="input-group">
              <input type="text" className="text-input" placeholder="Cardholder Name" required />
            </div>
            
            <div className="input-group card-input-container">
              <input type="text" className="text-input" placeholder="Card Number" required />
              <CreditCard className="card-icon" size={20} />
            </div>
            
            <div className="form-row">
              <div className="input-group">
                <input type="text" className="text-input" placeholder="Expiry Date (MM/YY)" required />
              </div>
              <div className="input-group">
                <input type="text" className="text-input" placeholder="CVV" required />
              </div>
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">Billing Address</label>
            
            <div className="input-group">
              <input type="text" className="text-input" placeholder="Street Address" required />
            </div>
            <div className="input-group">
              <input type="text" className="text-input" placeholder="City" required />
            </div>
            
            <div className="form-row">
              <div className="input-group">
                <input type="text" className="text-input" placeholder="State" required />
              </div>
              <div className="input-group">
                <input type="text" className="text-input" placeholder="Zip Code" required />
              </div>
            </div>
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
