'use client';

import { useState, useEffect } from 'react';

interface ExerciseCardProps {
  id: string;
  name: string;
  reps?: string;
  desc: string;
  video?: string;
  isUtility?: boolean;
  onCompletionChange?: (id: string, completed: boolean) => void;
}

export default function ExerciseCard({ 
  id, 
  name, 
  reps, 
  desc, 
  video, 
  isUtility = false,
  onCompletionChange 
}: ExerciseCardProps) {
  const [isCompleted, setIsCompleted] = useState(false);

  // Load completion state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(id);
      setIsCompleted(saved === 'true');
    }
  }, [id]);

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const completed = event.target.checked;
    setIsCompleted(completed);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(id, completed.toString());
    }
    
    if (onCompletionChange) {
      onCompletionChange(id, completed);
    }
  };

  return (
    <div className={`rounded-xl p-4 mb-3 transition-colors ${
      isCompleted ? '' : 'bg-white'
    }`} style={isCompleted ? { backgroundColor: '#DCDFE5' } : {}}>
      <div className={`${isUtility ? 'grid-cols-1' : 'grid grid-cols-1 sm:grid-cols-[1fr_300px]'} gap-4 items-center`}>
        <div>
          <h3 className="text-lg font-bold mb-1">{name}</h3>
          {reps && (
            <>
              <p className="text-sm text-gray-700 mb-2">{reps}</p>
              <hr className="border-t border-gray-300 mb-2 opacity-50" />
            </>
          )}
          <p className="text-sm text-gray-600">{desc}</p>
        </div>
        
        {video && !isUtility && (
          <div className="w-full aspect-video rounded-lg overflow-hidden">
            <iframe
              src={video}
              title={name}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </div>
      
  <div className="flex items-center gap-2 pt-3 mt-3">
        <input 
          type="checkbox" 
          id={id}
          className="w-5 h-5 cursor-pointer"
          checked={isCompleted}
          onChange={handleCheckboxChange}
        />
        <label htmlFor={id} className="text-base cursor-pointer">Виконано</label>
      </div>
    </div>
  );
}