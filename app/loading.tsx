export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="h-0.5 w-full overflow-hidden">
        <div className="h-full bg-[#534AB7] animate-progress-bar" />
      </div>
    </div>
  )
}
