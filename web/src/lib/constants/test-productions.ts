export interface Production {
  id: string
  name: string
  status: string
}

export const TEST_PRODUCTIONS: Production[] = [
  { id: '1', name: 'Untitled Horror Short', status: 'pre_production' },
  { id: '2', name: 'Senior Thesis Film', status: 'production' },
  { id: '3', name: 'Nike Commercial', status: 'development' },
]

export function getProductionById(id: string): Production | null {
  return TEST_PRODUCTIONS.find((p) => p.id === id) ?? null
}
