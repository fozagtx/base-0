import { NextRequest, NextResponse } from 'next/server'
import { google } from '@ai-sdk/google'
import { generateText } from 'ai'

export async function POST(request: NextRequest) {
  try {
    const { prompt, baseObject, instruction, baseObjectFile } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Generate avatar descriptions using Gemini
    const variants = await generateAvatarVariants(prompt, baseObject, instruction, baseObjectFile)
    
    return NextResponse.json({
      imageUrl: variants[0], // Return single image instead of variants
      prompt: prompt
    })

  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
  }
}

async function generateAvatarVariants(prompt: string, baseObject?: string, instruction?: string, baseObjectFile?: string): Promise<string[]> {
  const variants = []
  
  // Enhanced prompt construction
  let enhancedPrompt = `Create an avatar: ${prompt}`
  if (baseObject && instruction) {
    enhancedPrompt += `. The avatar should ${instruction} with ${baseObject}.`
  }

  try {
    // Use Gemini to enhance avatar description
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: `${enhancedPrompt}
      
      Provide 3 different avatar style descriptions:
      1. Professional/business style
      2. Casual/friendly style  
      3. Creative/artistic style
      
      Each description should be detailed and focus on appearance, clothing, pose, and how they interact with any objects mentioned.`,
    })

    // Generate 3 variants based on AI descriptions
    const descriptions = text.split(/\d\./g).slice(1)
    const styles = [
      { bg: '#000000', fg: '#ffffff', name: 'professional' },
      { bg: '#ffffff', fg: '#000000', name: 'casual' },
      { bg: '#f8f8f8', fg: '#333333', name: 'creative' }
    ]

    for (let i = 0; i < 3; i++) {
      const style = styles[i]
      const description = descriptions[i]?.trim() || enhancedPrompt
      const svg = generateCleanAvatarSVG(description, style, i)
      variants.push(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`)
    }

  } catch (aiError) {
    console.log('Using fallback generation:', aiError)
    // Fallback to simple generation if AI fails
    const styles = [
      { bg: '#000000', fg: '#ffffff', name: 'professional' },
      { bg: '#ffffff', fg: '#000000', name: 'casual' },
      { bg: '#f8f8f8', fg: '#333333', name: 'creative' }
    ]

    for (let i = 0; i < 3; i++) {
      const style = styles[i]
      const svg = generateCleanAvatarSVG(enhancedPrompt, style, i)
      variants.push(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`)
    }
  }

  return variants
}

function generateCleanAvatarSVG(description: string, style: any, seed: number): string {
  const hash = Math.abs(description.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0) + seed)
  
  // Clean avatar characteristics based on description
  const faceShape = hash % 3 === 0 ? 'round' : hash % 3 === 1 ? 'oval' : 'square'
  const hairStyle = hash % 4 === 0 ? 'short' : hash % 4 === 1 ? 'long' : hash % 4 === 2 ? 'curly' : 'bob'
  const clothing = description.toLowerCase().includes('professional') ? 'suit' : 
                  description.toLowerCase().includes('doctor') ? 'coat' :
                  description.toLowerCase().includes('creative') ? 'casual' : 'shirt'
  
  // Clean, modern colors
  const skinTone = `hsl(${30 + (hash % 30)}, 25%, ${65 + (hash % 20)}%)`
  const hairColor = `hsl(${hash % 60}, 40%, ${25 + (hash % 30)}%)`
  const clothingColor = clothing === 'suit' ? '#2c3e50' : 
                       clothing === 'coat' ? '#ecf0f1' : 
                       `hsl(${hash % 360}, 30%, 50%)`
  
  const svg = `<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
    <rect width="256" height="256" fill="${style.bg}"/>
    
    <!-- Avatar Head -->
    <ellipse cx="128" cy="120" 
             rx="${faceShape === 'round' ? '55' : faceShape === 'oval' ? '50' : '52'}" 
             ry="${faceShape === 'oval' ? '65' : faceShape === 'round' ? '55' : '58'}" 
             fill="${skinTone}" stroke="${style.fg}" stroke-width="1" opacity="0.9"/>
    
    <!-- Hair -->
    ${hairStyle === 'short' ? 
      `<path d="M 75 85 Q 128 45 181 85 Q 181 105 165 115 Q 128 95 91 115 Q 75 105 75 85" fill="${hairColor}" stroke="${style.fg}" stroke-width="0.5"/>` :
      `<path d="M 70 80 Q 128 40 186 80 Q 190 120 170 130 Q 128 100 86 130 Q 66 120 70 80" fill="${hairColor}" stroke="${style.fg}" stroke-width="0.5"/>`
    }
    
    <!-- Eyes -->
    <ellipse cx="108" cy="110" rx="6" ry="4" fill="${style.fg}" opacity="0.8"/>
    <ellipse cx="148" cy="110" rx="6" ry="4" fill="${style.fg}" opacity="0.8"/>
    <circle cx="108" cy="110" r="2" fill="${style.bg}"/>
    <circle cx="148" cy="110" r="2" fill="${style.bg}"/>
    
    <!-- Nose -->
    <ellipse cx="128" cy="125" rx="2" ry="4" fill="${style.fg}" opacity="0.2"/>
    
    <!-- Mouth -->
    <path d="M 118 140 Q 128 148 138 140" stroke="${style.fg}" stroke-width="1.5" fill="none" opacity="0.7"/>
    
    <!-- Clothing -->
    <rect x="85" y="175" width="86" height="81" fill="${clothingColor}" rx="8"/>
    
    <!-- Clothing details -->
    ${clothing === 'suit' ? 
      `<rect x="90" y="180" width="76" height="71" fill="${style.bg}" rx="6" opacity="0.1"/>
       <line x1="128" y1="180" x2="128" y2="210" stroke="${style.fg}" stroke-width="1" opacity="0.3"/>` :
      clothing === 'coat' ?
      `<rect x="90" y="180" width="76" height="71" fill="#ffffff" rx="6"/>
       <circle cx="100" cy="200" r="3" fill="${style.fg}" opacity="0.4"/>
       <circle cx="100" cy="220" r="3" fill="${style.fg}" opacity="0.4"/>` :
      `<rect x="90" y="180" width="76" height="71" fill="${style.bg}" rx="6" opacity="0.1"/>`
    }
    
    <!-- Object in hand if specified -->
    ${description.toLowerCase().includes('medicine') || description.toLowerCase().includes('pill') ? 
      `<rect x="165" y="190" width="15" height="8" fill="#e74c3c" rx="2"/>
       <rect x="167" y="192" width="11" height="4" fill="#ffffff" rx="1"/>` : 
      description.toLowerCase().includes('tool') || description.toLowerCase().includes('stethoscope') ? 
      `<circle cx="170" cy="195" r="8" fill="#34495e" stroke="${style.fg}" stroke-width="1"/>
       <path d="M 162 195 Q 170 185 178 195" stroke="#34495e" stroke-width="2" fill="none"/>` :
      ''}
    
    <!-- Style indicator -->
    <text x="10" y="245" font-size="10" fill="${style.fg}" opacity="0.4" font-family="Arial, sans-serif">${style.name}</text>
  </svg>`
  
  return svg
}