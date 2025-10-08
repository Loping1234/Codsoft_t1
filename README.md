COMPONENT USAGE GUIDE
Background Layers (How to Stack)
tsx// In ANY page, backgrounds stack in this order (bottom to top):

<div className="relative min-h-screen">
  {/* Layer 1: Base background (covers entire viewport) */}
  <div className="fixed inset-0 z-0">
    <DarkVeil />
  </div>

  {/* Layer 2: Pattern overlay */}
  <div className="fixed inset-0 z-0">
    <DotGrid opacity={0.1} spacing={30} />
  </div>

  {/* Layer 3: Floating decorative elements */}
  <div className="fixed inset-0 z-0 pointer-events-none">
    <Orb position={{x: 20, y: 30}} size={300} color="#8b5cf6" />
    <Orb position={{x: 70, y: 60}} size={200} color="#3b82f6" />
  </div>

  {/* Layer 4: Your actual page content */}
  <div className="relative z-10">
    {/* All your UI goes here */}
  </div>
</div>

REVISED PROMPT 12: Landing Page (Step-by-Step)
Create src/pages/Landing.tsx following this EXACT structure:

1. CREATE CONSTANTS FILE FIRST:
Create src/constants/landingContent.ts:
typescriptexport const HERO_HEADLINE = "Transform Your Learning Experience"
export const HERO_SUBHEADLINE = "AI-powered study tools that adapt to you"
export const CTA_PRIMARY = "Get Started"
export const CTA_SECONDARY = "Learn More"

export const FEATURES = [
  { title: "AI-Powered Quizzes", description: "Generate personalized quizzes", icon: "Brain" },
  { title: "Smart Flashcards", description: "Spaced repetition learning", icon: "Layers" },
  { title: "AI Tutor", description: "24/7 personalized help", icon: "MessageSquare" }
]

export const STATS = [
  { number: 10000, label: "Active Students" },
  { number: 50000, label: "Quizzes Created" },
  { number: 95, label: "Success Rate" }
]

2. BUILD THE PAGE STRUCTURE:

import the components:
tsximport DarkVeil from '@/components/DarkVeil'
import DotGrid from '@/components/DotGrid'
import Orb from '@/components/Orb'
import SplitText from '@/components/SplitText'
import Typewriter from '@/components/Typewriter'
import GlassSurface from '@/components/GlassSurface'
import GradientText from '@/components/GradientText'
import SpotlightCard from '@/components/SpotlightCard'
import { HERO_HEADLINE, HERO_SUBHEADLINE, CTA_PRIMARY, FEATURES, STATS } from '@/constants/landingContent'

3. BACKGROUND SECTION (exactly like this):
tsx{/* Background layers - stacked */}
<div className="fixed inset-0 z-0">
  <DarkVeil />
</div>
<div className="fixed inset-0 z-0">
  <DotGrid opacity={0.15} />
</div>
<div className="fixed inset-0 z-0 pointer-events-none">
  <Orb position={{x: 20, y: 30}} size={400} color="#8b5cf6" />
  <Orb position={{x: 80, y: 70}} size={300} color="#3b82f6" />
</div>

4. HERO SECTION (exactly like this):
tsx<div className="relative z-10 min-h-screen flex items-center justify-center px-4">
  <div className="max-w-4xl mx-auto text-center space-y-8">
    
    {/* Animated headline - text splits into characters */}
    <SplitText 
      text={HERO_HEADLINE} 
      className="text-6xl md:text-8xl font-bold"
      delay={50}
    />
    
    {/* Typewriter subheadline - types out character by character */}
    <Typewriter 
      text={HERO_SUBHEADLINE}
      className="text-xl md:text-2xl text-gray-300"
      speed={50}
    />
    
    {/* CTA Buttons with spotlight effect */}
    <div className="flex gap-4 justify-center">
      <SpotlightCard>
        <button className="px-8 py-4 bg-purple-600 rounded-lg text-white font-semibold">
          {CTA_PRIMARY}
        </button>
      </SpotlightCard>
      
      <SpotlightCard>
        <button className="px-8 py-4 border border-purple-600 rounded-lg text-white font-semibold">
          {CTA_SECONDARY}
        </button>
      </SpotlightCard>
    </div>
  </div>
</div>

5. FEATURES SECTION (exactly like this):
tsx<div className="relative z-10 py-20 px-4">
  <div className="max-w-7xl mx-auto">
    
    {/* Section title with gradient */}
    <GradientText className="text-4xl font-bold text-center mb-12">
      Features
    </GradientText>
    
    {/* Feature cards grid */}
    <div className="grid md:grid-cols-3 gap-8">
      {FEATURES.map((feature, index) => (
        <SpotlightCard key={index}>
          <GlassSurface className="p-8 rounded-2xl h-full">
            <h3 className="text-2xl font-bold mb-4 text-white">
              {feature.title}
            </h3>
            <p className="text-gray-300">
              {feature.description}
            </p>
          </GlassSurface>
        </SpotlightCard>
      ))}
    </div>
  </div>
</div>

6. STATS SECTION (exactly like this):
tsx<div className="relative z-10 py-20 px-4">
  <div className="max-w-7xl mx-auto">
    <div className="grid md:grid-cols-3 gap-8">
      {STATS.map((stat, index) => (
        <GlassSurface key={index} className="p-8 rounded-2xl text-center">
          <CountUp 
            end={stat.number} 
            className="text-5xl font-bold text-purple-400"
          />
          <p className="text-gray-300 mt-2">{stat.label}</p>
        </GlassSurface>
      ))}
    </div>
  </div>
</div>

Follow this EXACT pattern. Don't improvise.