"use client";

import { useTradingStore } from '@/lib/store/trading-store';
import { useState, useEffect } from 'react';
import { X, Check, Zap, Shield, TrendingUp, Star, Crown, Sparkles } from 'lucide-react';

interface Plan {
  id: 'free' | 'basic' | 'premium' | 'vip';
  name: string;
  tagline: string;
  slippageMode: 'high' | 'medium' | 'low' | 'zero';
  slippage: string;
  price: number;
  icon: any;
  gradient: string;
  description: string;
  features: string[];
  popular?: boolean;
  recommended?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Starter',
    tagline: 'Perfect for beginners',
    slippageMode: 'high',
    slippage: '5-10 pips',
    price: 0,
    icon: Sparkles,
    gradient: 'from-gray-500 to-gray-700',
    description: 'Get started with basic trading features',
    features: [
      'High slippage (5-10 pips)',
      'Basic chart features',
      'Community support',
      'Standard execution',
      'Mobile app access'
    ]
  },
  {
    id: 'basic',
    name: 'Trader',
    tagline: 'For active traders',
    slippageMode: 'medium',
    slippage: '3-5 pips',
    price: 100,
    icon: TrendingUp,
    gradient: 'from-blue-500 to-cyan-600',
    description: 'Enhanced features for serious traders',
    features: [
      'Medium slippage (3-5 pips)',
      'Advanced charting tools',
      'Email support',
      'Priority execution',
      'Trading signals',
      'Risk management tools'
    ],
    popular: true
  },
  {
    id: 'premium',
    name: 'Professional',
    tagline: 'For professional traders',
    slippageMode: 'low',
    slippage: '1-2 pips',
    price: 500,
    icon: Shield,
    gradient: 'from-purple-500 to-pink-600',
    description: 'Professional-grade trading experience',
    features: [
      'Low slippage (1-2 pips)',
      'Real-time analytics',
      'Priority support 24/7',
      'Advanced API access',
      'Custom indicators',
      'Automated trading',
      'Portfolio analytics'
    ],
    recommended: true
  },
  {
    id: 'vip',
    name: 'Elite',
    tagline: 'Ultimate trading power',
    slippageMode: 'zero',
    slippage: '0 pips',
    price: 1000,
    icon: Crown,
    gradient: 'from-yellow-400 via-yellow-500 to-yellow-600',
    description: 'Zero slippage with exclusive benefits',
    features: [
      'Zero slippage (0 pips)',
      'Dedicated account manager',
      'VIP support hotline',
      'Institutional-grade execution',
      'Custom strategy development',
      'White-label solutions',
      'Exclusive market insights',
      'Early access to new features'
    ]
  }
];

interface SubscriptionPlansPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionPlansPage({ isOpen, onClose }: SubscriptionPlansPageProps) {
  const { subscription, setSubscription } = useTradingStore();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const currentPlan = subscription?.planType || 'free';

  useEffect(() => {
    if (isOpen) {
      loadSubscription();
    }
  }, [isOpen]);

  async function loadSubscription() {
    try {
      const res = await fetch('/api/subscriptions?userId=default_user');
      const data = await res.json();
      if (data.success && data.data) {
        setSubscription({
          planType: data.data.plan_type,
          slippageMode: data.data.slippage_mode,
          price: data.data.price,
          status: data.data.status,
          expiresAt: data.data.expires_at
        });
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  }

  async function subscribeToPlan(plan: Plan) {
    setLoading(true);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'default_user',
          planType: plan.id,
          slippageMode: plan.slippageMode,
          price: plan.price
        })
      });

      const data = await res.json();
      if (data.success) {
        setSubscription({
          planType: data.data.plan_type,
          slippageMode: data.data.slippage_mode,
          price: data.data.price,
          status: data.data.status,
          expiresAt: data.data.expires_at
        });
        alert(`✅ Successfully subscribed to ${plan.name} plan!`);
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('❌ Subscription failed. Please try again.');
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
                Choose Your Trading Plan
              </h1>
              <p className="text-text-secondary text-lg">
                Unlock better slippage rates and premium features
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-bg-tertiary hover:bg-bg-hover transition-colors"
            >
              <X className="w-5 h-5 text-text-primary" />
            </button>
          </div>

          {/* Current Plan Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 rounded-lg">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-sm text-text-primary">
              Current Plan: <span className="font-bold text-accent">
                {PLANS.find(p => p.id === currentPlan)?.name}
              </span>
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isActive = currentPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`
                  relative rounded-xl border-2 transition-all duration-300 min-h-[500px] flex flex-col
                  ${isActive 
                    ? 'border-accent bg-gradient-to-br from-accent/20 to-accent/5 shadow-2xl shadow-accent/30' 
                    : 'border-border-primary bg-bg-secondary hover:border-accent/50 hover:shadow-xl hover:scale-[1.02]'
                  }
                `}
              >
                {/* Popular/Recommended Badge */}
                {plan.popular && !isActive && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                    POPULAR
                  </div>
                )}
                {plan.recommended && !isActive && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">
                    RECOMMENDED
                  </div>
                )}
                {isActive && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-bg-primary text-xs font-bold rounded-full">
                    CURRENT PLAN
                  </div>
                )}

                <div className="p-4 flex flex-col flex-1">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Name & Tagline */}
                  <h3 className="text-xl font-bold text-text-primary mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-text-tertiary mb-3">
                    {plan.tagline}
                  </p>

                  {/* Price */}
                  <div className="mb-3">
                    {plan.price === 0 ? (
                      <div className="text-2xl font-bold text-text-primary">
                        Free
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-text-primary">
                          ${plan.price}
                        </span>
                        <span className="text-xs text-text-tertiary">/mo</span>
                      </div>
                    )}
                  </div>

                  {/* Slippage */}
                  <div className="mb-4 p-2 bg-bg-tertiary/50 rounded-lg border border-border-primary">
                    <div className="text-[10px] text-text-tertiary mb-0.5">Slippage Rate</div>
                    <div className="text-base font-bold text-accent">{plan.slippage}</div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-text-secondary mb-4">
                    {plan.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2 mb-4 flex-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-xs">
                        <Check className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-text-secondary">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => isActive ? null : setSelectedPlan(plan)}
                    disabled={isActive || loading}
                    className={`
                      w-full py-2.5 rounded-lg font-semibold transition-all text-sm
                      ${isActive
                        ? 'bg-bg-tertiary text-text-tertiary cursor-not-allowed'
                        : 'bg-gradient-to-r ' + plan.gradient + ' text-white hover:shadow-lg hover:scale-[1.02]'
                      }
                      ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {isActive ? 'Current Plan' : plan.price === 0 ? 'Downgrade' : 'Upgrade Now'}
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid gap-4">
            {[
              {
                q: 'What is slippage?',
                a: 'Slippage is the difference between the expected price and the actual execution price. Lower slippage means more accurate pricing.'
              },
              {
                q: 'Can I change plans anytime?',
                a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.'
              },
              {
                q: 'Is there a free trial?',
                a: 'The Starter plan is free forever. You can upgrade to paid plans anytime to unlock better slippage rates.'
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards, PayPal, and cryptocurrency payments.'
              }
            ].map((faq, index) => (
              <div key={index} className="p-4 bg-bg-secondary rounded-lg border border-border-primary">
                <h3 className="font-semibold text-text-primary mb-2">{faq.q}</h3>
                <p className="text-sm text-text-secondary">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-secondary border border-border-primary rounded-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${selectedPlan.gradient} flex items-center justify-center mx-auto mb-4`}>
                {(() => {
                  const Icon = selectedPlan.icon;
                  return <Icon className="w-10 h-10 text-white" />;
                })()}
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">
                Confirm Subscription
              </h3>
              <p className="text-text-secondary">
                Subscribe to {selectedPlan.name} plan?
              </p>
            </div>

            <div className="bg-bg-tertiary rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Plan:</span>
                <span className="font-semibold text-text-primary">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Slippage:</span>
                <span className="font-semibold text-accent">{selectedPlan.slippage}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Price:</span>
                <span className="font-bold text-text-primary text-lg">
                  {selectedPlan.price === 0 ? 'Free' : `$${selectedPlan.price}/month`}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedPlan(null)}
                disabled={loading}
                className="flex-1 py-3 bg-bg-tertiary hover:bg-bg-hover text-text-primary rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => subscribeToPlan(selectedPlan)}
                disabled={loading}
                className={`flex-1 py-3 bg-gradient-to-r ${selectedPlan.gradient} text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50`}
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
