"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Search, X } from "lucide-react"

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void
  onClose?: () => void
}

export interface SearchFilters {
  query: string
  maxPrice: number
  minCapacity: number
  dateRange: {
    start?: string
    end?: string
  }
}

export function AdvancedSearch({ onSearch, onClose }: AdvancedSearchProps) {
  const [query, setQuery] = useState("")
  const [maxPrice, setMaxPrice] = useState(50)
  const [minCapacity, setMinCapacity] = useState(1)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const handleSearch = () => {
    onSearch({
      query,
      maxPrice,
      minCapacity,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find the perfect parking space</CardDescription>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded">
            <X className="w-5 h-5" />
          </button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Search Location or Title</label>
          <Input
            type="text"
            placeholder="Downtown, Airport, etc."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Max Price per Hour: ₹{maxPrice}</label>
          <Slider
            value={[maxPrice]}
            onValueChange={(value) => setMaxPrice(value[0])}
            min={1}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Min Capacity: {minCapacity} spot(s)</label>
          <Slider
            value={[minCapacity]}
            onValueChange={(value) => setMinCapacity(value[0])}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <Button onClick={handleSearch} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </CardContent>
    </Card>
  )
}
