import * as React from "react"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    
    return (
      <div
        ref={ref}
        className={`relative h-4 w-full overflow-hidden rounded-full bg-gray-200 ${className || ''}`}
        {...props}
      >
        <div
          className="h-full w-full flex-1 bg-gradient-to-r from-orange-500 to-red-500 transition-all"
          style={{
            transform: `translateX(-${100 - percentage}%)`
          }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }