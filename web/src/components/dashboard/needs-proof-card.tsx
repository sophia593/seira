'use client'

import { Camera } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function NeedsProofCard() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Camera className="w-5 h-5 text-muted-foreground" />
          Needs Proof
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <p>Proof tracking coming in v1.2</p>
          <p className="text-sm mt-1">
            Upload photos and links to prove deliverable completion
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
