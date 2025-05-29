import { ConversationAnalysis, LessonPlan, Level } from '@/types'

export class OpenAIAnalyticsService {
  private apiKey: string
  private baseURL = 'https://api.openai.com/v1'
  private isDummy: boolean

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.isDummy = apiKey === 'dummy-key'
  }

  async analyzeConversation(
    transcript: string, 
    userLevel: Level
  ): Promise<ConversationAnalysis> {
    // Return mock data for local dev
    if (this.isDummy) {
      return {
        pronunciation_notes: ["Great attempt at rolling your R's!", "Try to soften the 'j' sound"],
        grammar_successes: ["Correct use of 'quiero'", "Good verb conjugation"],
        cultural_appropriateness: ["Nice use of 'por favor'", "Remember to use diminutives like 'taquitos'"],
        next_lesson_focus: ["Practice ordering different types of tacos", "Learn more food vocabulary"],
        progress_indicators: {
          vocabulary_growth: 15,
          fluency_improvement: 10,
          cultural_understanding: 20
        }
      }
    }
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Analiza esta conversación en español mexicano. Nivel del usuario: ${userLevel}.
            
            Devuelve un JSON con el siguiente formato:
            {
              "pronunciation_notes": ["lista de observaciones sobre pronunciación"],
              "grammar_successes": ["lista de aciertos gramaticales"],
              "cultural_appropriateness": ["lista de observaciones culturales"],
              "next_lesson_focus": ["lista de temas para la próxima lección"],
              "progress_indicators": {
                "vocabulary_growth": número del 0-100,
                "fluency_improvement": número del 0-100,
                "cultural_understanding": número del 0-100
              }
            }`
          },
          {
            role: 'user',
            content: transcript
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return JSON.parse(data.choices[0].message.content)
  }

  async generateLessonPlan(
    userProgress: any,
    focusAreas: string[]
  ): Promise<LessonPlan> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Crea un plan de lección personalizado de español mexicano.
            
            Devuelve un JSON con el siguiente formato:
            {
              "title": "título de la lección",
              "objectives": ["lista de objetivos"],
              "scenarios": [
                {
                  "name": "nombre del escenario",
                  "description": "descripción",
                  "vocabulary": ["lista de vocabulario"]
                }
              ],
              "estimatedDuration": duración en minutos
            }`
          },
          {
            role: 'user',
            content: `Progreso del usuario: ${JSON.stringify(userProgress)}
            Áreas de enfoque: ${focusAreas.join(', ')}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return JSON.parse(data.choices[0].message.content)
  }

  async getKeyLearnings(transcript: string): Promise<string[]> {
    if (this.isDummy) {
      return [
        "You learned how to greet in Mexican Spanish",
        "You practiced ordering tacos politely",
        "You used the correct pronunciation for 'quiero'"
      ]
    }
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Extrae exactamente 3 aprendizajes clave de esta conversación en español mexicano.
            Devuelve un JSON con el formato: {"learnings": ["aprendizaje 1", "aprendizaje 2", "aprendizaje 3"]}`
          },
          {
            role: 'user',
            content: transcript
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const result = JSON.parse(data.choices[0].message.content)
    return result.learnings || []
  }
}