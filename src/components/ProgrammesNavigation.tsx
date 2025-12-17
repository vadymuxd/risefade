'use client';

import type { Programme } from '../../lib/supabase'

interface ProgrammesNavigationProps {
  programmes: Programme[]
  activeProgrammeId: number
  onProgrammeChange: (programmeId: number) => void
}

export default function ProgrammesNavigation({ programmes, activeProgrammeId, onProgrammeChange }: ProgrammesNavigationProps) {
  if (!programmes || programmes.length <= 1) {
    return null
  }

  const currentIndex = programmes.findIndex(p => p.id === activeProgrammeId)
  const currentProgramme = programmes[currentIndex]
  
  const goToPrevious = () => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : programmes.length - 1
    onProgrammeChange(programmes[prevIndex].id)
  }

  const goToNext = () => {
    const nextIndex = currentIndex < programmes.length - 1 ? currentIndex + 1 : 0
    onProgrammeChange(programmes[nextIndex].id)
  }

  return (
    <div className="w-full bg-black py-3 px-4">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <button
          onClick={goToPrevious}
          className="text-white p-2 hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Попередня програма"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        
        <div className="text-white text-center flex-1">
          <div className="text-2xl font-bold">{currentProgramme?.name}</div>
        </div>

        <button
          onClick={goToNext}
          className="text-white p-2 hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Наступна програма"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  )
}
