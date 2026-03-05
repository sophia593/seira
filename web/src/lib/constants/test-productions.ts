export interface Production {
  id: string
  name: string
  status: string
  statusColor: string
}

export const TEST_PRODUCTIONS: Production[] = [
  { id: '1', name: 'Untitled Horror Short', status: 'Pre-Production', statusColor: '#F59E0B' },
  { id: '2', name: 'Senior Thesis Film', status: 'Production', statusColor: '#10B981' },
  { id: '3', name: 'Nike Commercial', status: 'Development', statusColor: '#3B82F6' },
]

export function getProductionById(id: string): Production | null {
  return TEST_PRODUCTIONS.find((p) => p.id === id) ?? null
}
