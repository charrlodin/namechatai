'use client'

import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PricingTable() {
  const plans = [
    {
      name: 'Guest',
      description: 'No sign up needed',
      features: [
        { name: '5 daily generations', included: true },
        { name: '15 domain checks per day', included: true },
        { name: 'Social media handle suggestions', included: true },
        { name: 'Rate limited & protected', included: false }
      ],
      buttonText: 'Get Started',
      buttonVariant: 'outline' as const,
      popular: false
    },
    {
      name: 'Register',
      description: 'Sign up for more features',
      features: [
        { name: '15 daily generations', included: true },
        { name: '50 domain checks per day', included: true },
        { name: 'Custom handle suggestions', included: true },
        { name: 'Save favorite names', included: true }
      ],
      buttonText: 'Sign Up',
      buttonVariant: 'accent' as const,
      popular: false
    },
    {
      name: 'Subscribe',
      description: 'Premium features for professionals',
      features: [
        { name: 'Unlimited generations', included: true },
        { name: 'Unlimited domain checks', included: true },
        { name: 'Bulk domain checking', included: true },
        { name: 'Export to CSV/PDF', included: true },
        { name: 'Priority support', included: true }
      ],
      buttonText: 'Subscribe',
      buttonVariant: 'accent' as const,
      popular: true
    }
  ]

  return (
    <section id="pricing" className="py-16 bg-black" aria-labelledby="pricing-heading">
      <div className="container mx-auto px-4">
        <h2 id="pricing-heading" className="text-2xl font-medium text-center mb-2">Choose Your Plan</h2>
        <p className="text-gray-400 text-center mb-10">Select the perfect plan for your business naming needs</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`border rounded-lg p-6 flex flex-col relative ${
                plan.popular 
                  ? 'border-orange-500 bg-black shadow-lg shadow-orange-500/10' 
                  : 'border-gray-800 bg-black'
              }`}
              role="article"
              aria-labelledby={`plan-${plan.name.toLowerCase()}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-orange-500 text-xs font-medium rounded-full text-black">
                  Most Popular
                </div>
              )}
              <h3 id={`plan-${plan.name.toLowerCase()}`} className="text-xl font-medium mb-1">{plan.name}</h3>
              <p className="text-sm text-gray-400 mb-6">{plan.description}</p>
              
              <ul className="space-y-3 mb-8 flex-grow" aria-label={`${plan.name} plan features`}>
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" aria-hidden="true" />
                    ) : (
                      <X className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" aria-hidden="true" />
                    )}
                    <span className="text-sm">
                      {feature.included ? feature.name : <span className="opacity-60">{feature.name}</span>}
                      <span className="sr-only">{feature.included ? ' (included)' : ' (not included)'}</span>
                    </span>
                  </li>
                ))}
              </ul>
              
              <Button 
                variant={plan.buttonVariant} 
                className="w-full mt-auto"
                aria-label={`Select ${plan.name} plan`}
              >
                {plan.buttonText}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
