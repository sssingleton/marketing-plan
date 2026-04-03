'use client'

import { ChevronRight, Loader2, X } from 'lucide-react'

export default function GoalPicker({ goals, isGenerating, generationProgress, onSelectGoal, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 border-2 border-[#2a2a2a] bg-[#0a0a0a] p-8">
        {/* Close */}
        {!isGenerating && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#6a6a69] hover:text-[#fafaf9] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {isGenerating ? (
          /* Generating State */
          <div className="flex flex-col items-center gap-6 py-8">
            <Loader2 className="w-10 h-10 text-rose-600 animate-spin" />
            <div className="text-center">
              <h3 className="text-lg font-black uppercase tracking-widest text-[#fafaf9] mb-2">
                Building Your Campaign
              </h3>
              <p className="text-xs uppercase tracking-widest text-[#6a6a69]">
                Generating 87 content slots across 3 platforms...
              </p>
            </div>
            <div className="w-full h-1.5 bg-[#1a1a1a] overflow-hidden">
              <div
                className="h-full bg-rose-600 transition-all duration-500"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
            <p className="text-xs text-[#6a6a69] uppercase tracking-widest">
              {generationProgress}% complete
            </p>
          </div>
        ) : (
          /* Goal Selection */
          <div>
            <h3 className="text-lg font-black uppercase tracking-widest text-[#fafaf9] mb-2">
              Campaign Goal
            </h3>
            <p className="text-xs uppercase tracking-widest text-[#6a6a69] mb-8">
              What should this campaign optimize for?
            </p>

            <div className="flex flex-col gap-3">
              {goals.map(goal => (
                <button
                  key={goal.id}
                  onClick={() => onSelectGoal(goal.id)}
                  className="w-full text-left px-5 py-4 border-2 border-[#2a2a2a] hover:border-rose-600 hover:bg-rose-600/5 transition-all flex items-center justify-between group"
                >
                  <div>
                    <span className="text-sm font-bold uppercase tracking-widest text-[#fafaf9]">
                      {goal.name}
                    </span>
                    <p className="text-xs text-[#6a6a69] mt-1 uppercase tracking-wide">
                      {goal.description}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#6a6a69] group-hover:text-rose-600 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
