// Super simple in-memory "database" for local dev
let users: any[] = []
let sessions: any[] = []
let conversations: any[] = []

export const mockDB = {
  user: {
    create: async (data: any) => {
      const user = { id: Date.now().toString(), ...data.data }
      users.push(user)
      return user
    },
    findUnique: async (query: any) => {
      return users.find(u => u.email === query.where.email)
    },
    update: async (query: any) => {
      const user = users.find(u => u.id === query.where.id)
      Object.assign(user, query.data)
      return user
    }
  },
  conversation: {
    create: async (data: any) => {
      const convo = { id: Date.now().toString(), ...data.data }
      conversations.push(convo)
      return convo
    },
    findMany: async () => conversations,
    findUnique: async (query: any) => {
      return conversations.find(c => c.id === query.where.id)
    }
  },
  progress: {
    upsert: async (query: any) => {
      // Simplified progress tracking
      return { id: '1', ...query.create, ...query.update }
    },
    findUnique: async () => ({
      id: '1',
      vocabulary: ['hola', 'tacos', 'gracias'],
      pronunciation: 25,
      grammar: 30,
      fluency: 20,
      culturalKnowledge: 35,
      totalMinutes: 15,
      wordsLearned: 3
    })
  }
}