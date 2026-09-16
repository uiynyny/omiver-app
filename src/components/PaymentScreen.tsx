import React, { useState, useEffect } from 'react';
import { createPaymentIntent, confirmPaymentApi, claimComplimentaryKit, fetchDefaultShippingAddress } from '../api/user';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Lock, ShieldCheck } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import './PaymentScreen.css';

/**
 * The publishable key is environment-driven. It is safe to expose (that is its
 * purpose) but it must not be hardcoded, or a test key ships to production.
 */
const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

/**
 * Styling for Stripe's hosted card field.
 *
 * These have to be literal colour values: the field renders inside a
 * cross-origin iframe, which cannot resolve our CSS custom properties. The
 * values mirror `--text`, `--text-tertiary`, `--accent` and `--risk` in
 * `src/styles/tokens.css` — if those change, change these too.
 */
const STRIPE_ELEMENT_STYLE = {
  base: {
    fontSize: '15px',
    color: '#0f1720',                            /* --text */
    fontFamily: 'Inter, system-ui, sans-serif',
    '::placeholder': { color: '#5d666e' },       /* --text-tertiary */
    iconColor: '#67997d',                        /* --accent */
  },
  invalid: { color: '#94261f', iconColor: '#94261f' }, /* --risk */
} as const;

/** Normalised shape the checkout renders, regardless of where the kit came from. */
type CheckoutKit = {
  id: number;
  name: string;
  blurb: string;
  price: number;
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') return parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
  return 0;
};

const formatUSD = (value: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

/**
 * KitsScreen forwards the API `Kit` (name/description/numeric price) while
 * older callers used title/badge/string price. Accept both so the summary
 * never renders "undefined".
 */
const normaliseKit = (raw: unknown): CheckoutKit | null => {
  if (!raw || typeof raw !== 'object') return null;
  const k = raw as Record<string, unknown>;
  const id = Number(k.id);
  if (!Number.isFinite(id) || id <= 0) return null;

  return {
    id,
    name: String(k.name ?? k.title ?? 'Test kit'),
    blurb: String(k.description ?? k.subtitle ?? k.badge ?? ''),
    price: toNumber(k.price),
  };
};

const PaymentScreen: React.FC = () => (
  // `Elements` tolerates a null `stripe` prop (it treats it as "still
  // loading"), which lets a $0 kit check out on a build with no publishable
  // key. The paid path reports the misconfiguration itself.
  <Elements stripe={stripePromise}>
    <PaymentForm />
  </Elements>
);

const PaymentForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAppContext();
  const clientId = state.auth.clientId;
  const numericClientId = Number(clientId ?? 0);
  const stripe = useStripe();
  const elements = useElements();

  const kit = normaliseKit((location.state as { kit?: unknown } | null)?.kit);

  /**
   * A $0.00 kit is settled without Stripe: the backend recomputes the price
   * and only agrees when it is genuinely zero, so this is a UI affordance, not
   * a trust decision. Free claims are capped at one unit server-side.
   */
  const isFree = !!kit && kit.price === 0;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState<number>(
    Number((location.state as { quantity?: number } | null)?.quantity) || 1,
  );
  const [formData, setFormData] = useState({
    cardholderName: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });

  // Prefill the shipping address from the saved default, if there is one.
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    fetchDefaultShippingAddress(clientId)
      .then((address) => {
        if (cancelled || !address) return;
        setFormData((prev) => ({
          ...prev,
          streetAddress: address.street_address ?? prev.streetAddress,
          city: address.city ?? prev.city,
          state: address.state ?? prev.state,
          zipCode: address.zip_code ?? prev.zipCode,
          country: address.country ?? prev.country,
        }));
      })
      .catch(() => {
        /* No saved address is a normal state, not an error. */
      });

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePay = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!numericClientId) {
        throw new Error('Missing client account. Please log in again.');
      }
      if (!kit) {
        throw new Error('No kit selected. Go back and choose a kit.');
      }

      // A free kit never touches Stripe. The server re-prices the kit and
      // rejects the request if it is not actually $0.00.
      if (isFree) {
        await claimComplimentaryKit({
          test_kit_id: kit.id,
          street_address: formData.streetAddress,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          country: formData.country,
        });

        setLoading(false);
        navigate('/orders');
        return;
      }

      // Every paid order is settled through a PaymentIntent. The amount is
      // derived server-side from test_kit_id, so the client cannot declare an
      // order free or reuse a saved card by sending a sentinel value.
      if (!publishableKey) {
        throw new Error('Payments are not configured. Set VITE_STRIPE_PUBLISHABLE_KEY and rebuild.');
      }
      if (!stripe || !elements) {
        throw new Error('Payment is still loading. Please try again in a moment.');
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Enter your card details to continue.');
      }

      const { clientSecret } = await createPaymentIntent(kit.id, numericClientId, quantity);

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
            },
          },
        },
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
        throw new Error(`Payment was not completed (${result.paymentIntent.status}).`);
      }
    } catch (err: unknown) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    }
  };

  const total = kit ? kit.price * quantity : 0;

  return (
    <div className="checkout">
      <div className="checkout__sheet fade-in">
        <header className="checkout__header">
          <span className="checkout__grabber" aria-hidden="true" />
          <h1 className="checkout__title">Checkout</h1>
          <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Close checkout">
            <X size={20} />
          </button>
        </header>

        <form id="checkout-form" className="checkout__body" onSubmit={handlePay}>
          {!kit && (
            <div className="error-banner" role="alert">
              No kit selected. Go back and choose a kit to continue.
            </div>
          )}

          {kit && (
            <section className="checkout__summary">
              <div className="checkout__summary-main">
                <h2 className="checkout__kit-name">{kit.name}</h2>
                {kit.blurb && <p className="checkout__kit-blurb">{kit.blurb}</p>}
              </div>
              <div className="checkout__summary-price">
                <span className="stat__value">{isFree ? 'Free' : formatUSD(kit.price)}</span>
                <span className="text-label text-tertiary">{isFree ? 'one per account' : 'per kit'}</span>
              </div>
            </section>
          )}

          {!isFree && (
            <section className="checkout__section">
              <div className="field">
                <label className="field__label" htmlFor="checkout-quantity">
                  Quantity
                </label>
                <input
                  id="checkout-quantity"
                  className="input"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={999}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                />
              </div>
            </section>
          )}

          {!isFree && (
            <section className="checkout__section">
              <h2 className="section-title">Payment</h2>
              <div className="stack">
                <div className="field">
                  <label className="field__label" htmlFor="checkout-cardholder">
                    Cardholder name
                  </label>
                  <input
                    id="checkout-cardholder"
                    name="cardholderName"
                    className="input"
                    type="text"
                    autoComplete="cc-name"
                    placeholder="Name as it appears on the card"
                    value={formData.cardholderName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="field">
                  <span className="field__label" id="checkout-card-label">
                    Card details
                  </span>
                  {/* Card data is entered inside Stripe's iframe and never touches
                      this application, which keeps us out of PCI-DSS scope. */}
                  <div className="checkout__card-element" aria-labelledby="checkout-card-label">
                    <CardElement options={{ style: STRIPE_ELEMENT_STYLE }} />
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="checkout__section">
            <h2 className="section-title">Shipping address</h2>
            <div className="stack">
              <div className="field">
                <label className="field__label" htmlFor="checkout-street">
                  Street address
                </label>
                <input
                  id="checkout-street"
                  name="streetAddress"
                  className="input"
                  type="text"
                  autoComplete="shipping street-address"
                  value={formData.streetAddress}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="checkout-city">
                  City
                </label>
                <input
                  id="checkout-city"
                  name="city"
                  className="input"
                  type="text"
                  autoComplete="shipping address-level2"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="checkout__grid">
                <div className="field">
                  <label className="field__label" htmlFor="checkout-state">
                    State
                  </label>
                  <input
                    id="checkout-state"
                    name="state"
                    className="input"
                    type="text"
                    autoComplete="shipping address-level1"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="checkout-zip">
                    ZIP code
                  </label>
                  <input
                    id="checkout-zip"
                    name="zipCode"
                    className="input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="shipping postal-code"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="field__label" htmlFor="checkout-country">
                  Country
                </label>
                <input
                  id="checkout-country"
                  name="country"
                  className="input"
                  type="text"
                  autoComplete="shipping country-name"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}

          <p className="checkout__secure">
            <Lock size={13} aria-hidden="true" />
            {isFree
              ? 'No payment is taken for this kit.'
              : <>Card details are encrypted by Stripe and never reach Omiver&apos;s servers.</>}
          </p>
        </form>

        <footer className="checkout__footer">
          <div className="checkout__total">
            <span className="text-label text-secondary">
              Total{!isFree && quantity > 1 ? ` · ${quantity} kits` : ''}
            </span>
            <span className="stat__value">{isFree ? 'Free' : formatUSD(total)}</span>
          </div>
          <button
            type="submit"
            form="checkout-form"
            className="btn btn--primary btn--block"
            // The free path does not use Stripe, so it must not wait for it.
            disabled={loading || !kit || (!isFree && !stripe)}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Processing
              </>
            ) : (
              <>
                <ShieldCheck size={18} aria-hidden="true" />
                {isFree ? 'Place free order' : `Pay ${formatUSD(total)}`}
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PaymentScreen;
