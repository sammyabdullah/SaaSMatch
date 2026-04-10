'use client'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

export default function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 group"
    >
      <div
        className={`relative w-10 h-5 rounded-full transition-colors ${
          checked ? 'bg-[#534AB7]' : 'bg-gray-200'
        }`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
      <span className="text-sm text-gray-700 group-hover:text-gray-900">
        {label}
      </span>
    </button>
  )
}
