'use client'

import { BusinessNameCard, SocialHandle } from '@/components/business-name-card'

export function ExamplesSection() {
  // Example data for the business name cards
  const exampleBusinessNames = [
    {
      name: "Luminary",
      available: true,
      pronunciation: "LOO-min-air-ee",
      description: "Evokes brightness, inspiration, and guidance – perfect for a creative agency or consultancy.",
      domains: [
        { name: "luminary.com", available: true, price: "$10.99" },
        { name: "luminary.io" },
        { name: "luminary.co" }
      ],
      socialHandles: [
        { platform: "twitter" as const, handle: "@luminary" },
        { platform: "instagram" as const, handle: "@luminary" },
        { platform: "facebook" as const, handle: "@luminaryofficial" }
      ]
    },
    {
      name: "Zephyr",
      available: false,
      pronunciation: "ZEF-er",
      description: "Suggests a gentle, refreshing breeze – ideal for wellness brands or sustainable products.",
      domains: [
        { name: "zephyr.com", available: false },
        { name: "zephyr.io" },
        { name: "zephyr.co" }
      ],
      socialHandles: [
        { platform: "twitter" as const, handle: "@zephyr" },
        { platform: "instagram" as const, handle: "@zephyr" },
        { platform: "facebook" as const, handle: "@zephyrhq" }
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 mt-16 mb-20">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-medium mb-3 text-center">Examples</h2>
        <p className="text-sm text-gray-400 mb-8 text-center">
          See how our AI generates creative business names with social media handles
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {exampleBusinessNames.map((business, index) => (
            <BusinessNameCard
              key={index}
              name={business.name}
              available={business.available}
              pronunciation={business.pronunciation}
              description={business.description}
              domains={business.domains}
              socialHandles={business.socialHandles}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
