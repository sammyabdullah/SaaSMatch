'use client'

interface MultiSelectProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  minRequired?: number
}

export default function MultiSelect({
  options,
  selected,
  onChange,
  minRequired,
}: MultiSelectProps) {
  function toggle(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option))
    } else {
      onChange([...selected, option])
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
              selected.includes(option)
                ? 'bg-[#534AB7] text-white border-[#534AB7]'
                : 'border-gray-200 text-gray-600 hover:border-[#534AB7] hover:text-[#534AB7]'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      {minRequired !== undefined && selected.length < minRequired && (
        <p className="text-xs text-gray-400 mt-2">
          Select at least {minRequired}
        </p>
      )}
    </div>
  )
}
