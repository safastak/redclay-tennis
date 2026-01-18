'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface PackageFormData {
  name: string
  description: string
  sport: 'tennis' | 'pickleball'
  court_only_sessions: number
  trainer_sessions: number
  price: number
  validity_days: number
  is_active: boolean
  peak_hour_restriction: boolean
}

export default function PackageFormDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PackageFormData) => void
  initialData?: Partial<PackageFormData>
}) {
  const [formData, setFormData] = useState<PackageFormData>({
    name: '',
    description: '',
    sport: 'tennis',
    court_only_sessions: 0,
    trainer_sessions: 0,
    price: 0,
    validity_days: 90,
    is_active: true,
    peak_hour_restriction: false,
  })

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }))
    } else {
      setFormData({
        name: '',
        description: '',
        sport: 'tennis',
        court_only_sessions: 0,
        trainer_sessions: 0,
        price: 0,
        validity_days: 90,
        is_active: true,
        peak_hour_restriction: false,
      })
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Package' : 'Create Package'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <form onSubmit={handleSubmit} className="space-y-4 pr-4">
            <div className="space-y-2">
              <Label htmlFor="package-name">Package Name</Label>
              <Input
                id="package-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sport">Sport</Label>
              <Select
                value={formData.sport}
                onValueChange={(value) =>
                  setFormData({ ...formData, sport: value as 'tennis' | 'pickleball' })
                }
              >
                <SelectTrigger id="sport">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tennis">Tennis</SelectItem>
                  <SelectItem value="pickleball">Pickleball</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="court-sessions">Court-Only Sessions</Label>
                <Input
                  id="court-sessions"
                  type="number"
                  min="0"
                  value={formData.court_only_sessions}
                  onChange={(e) =>
                    setFormData({ ...formData, court_only_sessions: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trainer-sessions">Trainer Sessions</Label>
                <Input
                  id="trainer-sessions"
                  type="number"
                  min="0"
                  value={formData.trainer_sessions}
                  onChange={(e) =>
                    setFormData({ ...formData, trainer_sessions: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validity">Validity (days)</Label>
                <Input
                  id="validity"
                  type="number"
                  min="1"
                  required
                  value={formData.validity_days}
                  onChange={(e) =>
                    setFormData({ ...formData, validity_days: parseInt(e.target.value) || 90 })
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked as boolean })
                  }
                />
                <Label htmlFor="is-active" className="cursor-pointer">
                  Active
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="peak-restriction"
                  checked={formData.peak_hour_restriction}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, peak_hour_restriction: checked as boolean })
                  }
                />
                <Label htmlFor="peak-restriction" className="cursor-pointer">
                  Peak Hour Restriction
                </Label>
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            {initialData ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
