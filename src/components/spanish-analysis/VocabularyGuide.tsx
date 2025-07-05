import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getEssentialVocabularyGuide, getScenarioVocabulary } from '@/lib/spanish-analysis/mexican-vocabulary'

interface VocabularyGuideProps {
  scenario?: string
  wordsUsed?: string[]
  className?: string
}

export function VocabularyGuide({ 
  scenario = 'taco_vendor', 
  wordsUsed = [],
  className = ""
}: VocabularyGuideProps) {
  // Use the same vocabulary source as the final report for consistency
  const scenarioVocab = getScenarioVocabulary(scenario)
  
  // Organize essential vocabulary into categories based on scenario
  const getScenarioGuide = () => {
    if (scenario === 'pharmacy') {
      return {
        symptoms: scenarioVocab.essential.filter(w => ['dolor', 'síntomas', 'me duele'].includes(w)),
        medicine: scenarioVocab.essential.filter(w => ['medicina', 'pastilla', 'tableta', 'jarabe', 'gotas'].includes(w)),
        medical: scenarioVocab.essential.filter(w => ['farmacéutico', 'receta', 'médico', 'dosis'].includes(w)),
        timing: scenarioVocab.essential.filter(w => ['cada', 'horas', 'cada cuánto'].includes(w)),
        general: scenarioVocab.essential.filter(w => !['dolor', 'síntomas', 'me duele', 'medicina', 'pastilla', 'tableta', 'jarabe', 'gotas', 'farmacéutico', 'receta', 'médico', 'dosis', 'cada', 'horas', 'cada cuánto'].includes(w))
      }
    } else if (scenario === 'restaurant') {
      return {
        ordering: scenarioVocab.essential.filter(w => ['mesa', 'menú', 'orden', 'cuenta'].includes(w)),
        food: scenarioVocab.essential.filter(w => ['platillo', 'bebida', 'agua', 'refresco'].includes(w)),
        service: scenarioVocab.essential.filter(w => ['mesero', 'mesera', 'propina'].includes(w)),
        general: scenarioVocab.essential.filter(w => !['mesa', 'menú', 'orden', 'cuenta', 'platillo', 'bebida', 'agua', 'refresco', 'mesero', 'mesera', 'propina'].includes(w))
      }
    } else {
      // Default taco vendor categories
      return {
        ordering: scenarioVocab.essential.filter(w => ['quiero', 'me da', 'quisiera', 'deme', 'cuánto cuesta', 'cuánto es'].includes(w)),
        meats: scenarioVocab.essential.filter(w => ['pastor', 'carnitas', 'suadero', 'bistec', 'pollo'].includes(w)),
        items: scenarioVocab.essential.filter(w => ['tacos', 'quesadillas', 'tortas'].includes(w)),
        toppings: scenarioVocab.essential.filter(w => ['con todo', 'sin cebolla', 'sin cilantro', 'salsa verde', 'salsa roja'].includes(w)),
        numbers: scenarioVocab.essential.filter(w => ['uno', 'dos', 'tres', 'cuatro', 'cinco'].includes(w)),
        payment: scenarioVocab.essential.filter(w => ['pesos', 'dinero', 'cambio', 'cuesta'].includes(w)),
        service: scenarioVocab.essential.filter(w => ['para llevar', 'para aquí', 'gracias', 'por favor'].includes(w))
      }
    }
  }
  
  const guide = getScenarioGuide()
  
  const checkWordUsed = (word: string) => {
    const allUsedText = wordsUsed.join(' ').toLowerCase()
    
    // Handle multi-word phrases
    if (word.includes(' ')) {
      return allUsedText.includes(word.toLowerCase())
    }
    
    // Handle individual words with word boundaries
    const wordRegex = new RegExp(`\\b${word.toLowerCase()}\\b`, 'i')
    return wordRegex.test(allUsedText)
  }

  const renderWordList = (words: string[], category: string, emoji: string) => (
    <div className="mb-3">
      <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
        <span>{emoji}</span>
        {category}
      </h5>
      <div className="flex flex-wrap gap-1">
        {words.map((word, i) => {
          const isUsed = checkWordUsed(word)
          return (
            <Badge
              key={i}
              variant={isUsed ? "default" : "outline"}
              className={`text-xs ${
                isUsed 
                  ? "bg-green-100 text-green-800 border-green-200" 
                  : "bg-gray-50 text-gray-600 border-gray-200"
              }`}
            >
              {word}
              {isUsed && " ✓"}
            </Badge>
          )
        })}
      </div>
    </div>
  )

  const totalWords = scenarioVocab.essential.length
  const usedWords = scenarioVocab.essential.filter(checkWordUsed).length
  const coveragePercent = Math.round((usedWords / totalWords) * 100)
  
  // Get scenario-specific title and rendering
  const getScenarioTitle = () => {
    if (scenario === 'pharmacy') return 'Essential Pharmacy Vocabulary'
    if (scenario === 'restaurant') return 'Essential Restaurant Vocabulary'
    if (scenario === 'hotel_checkin') return 'Essential Hotel Vocabulary'
    if (scenario === 'taxi_ride') return 'Essential Taxi Vocabulary'
    if (scenario === 'market') return 'Essential Market Vocabulary'
    return 'Essential Taco Vendor Vocabulary'
  }
  
  const renderScenarioGuide = () => {
    if (scenario === 'pharmacy') {
      return (
        <>
          {renderWordList(guide.symptoms || [], "Symptoms", "🤒")}
          {renderWordList(guide.medicine || [], "Medicine", "💊")}
          {renderWordList(guide.medical || [], "Medical Terms", "👨‍⚕️")}
          {renderWordList(guide.timing || [], "Timing", "⏰")}
          {renderWordList(guide.general || [], "General", "🗣️")}
        </>
      )
    } else if (scenario === 'restaurant') {
      return (
        <>
          {renderWordList(guide.ordering || [], "Ordering", "🗣️")}
          {renderWordList(guide.food || [], "Food & Drink", "🍽️")}
          {renderWordList(guide.service || [], "Service", "🤝")}
          {renderWordList(guide.general || [], "General", "💬")}
        </>
      )
    } else {
      // Default taco vendor
      return (
        <>
          {renderWordList(guide.ordering || [], "Ordering", "🗣️")}
          {renderWordList(guide.meats || [], "Meats", "🥩")}
          {renderWordList(guide.items || [], "Items", "🌮")}
          {renderWordList(guide.toppings || [], "Toppings", "🥗")}
          {renderWordList(guide.numbers || [], "Numbers", "🔢")}
          {renderWordList(guide.payment || [], "Payment", "💰")}
          {renderWordList(guide.service || [], "Service", "🤝")}
        </>
      )
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          {getScenarioTitle()}
          <Badge variant="outline" className="text-xs">
            {usedWords}/{totalWords} ({coveragePercent}%)
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-xs">
        {renderScenarioGuide()}
        
        <div className="pt-2 border-t text-xs text-gray-600">
          <p><strong>Tip:</strong> Try using words without ✓ to improve your vocabulary coverage!</p>
        </div>
      </CardContent>
    </Card>
  )
}