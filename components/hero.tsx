// Hero section component for Name Check AI
'use client'

export function Hero() {
  return (
    <section className="container mx-auto px-4 flex flex-col items-center justify-center py-12 text-center">
      <div className="w-full max-w-3xl mx-auto">
        <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">
          AI Business Name Generator
        </h1>
        <p className="mt-4 text-gray-400 text-base max-w-[42rem] mx-auto">
          Generate creative business names with suggested social media<br />
          handles and check domain availability on-demand
        </p>
      </div>
    </section>
  )
}
