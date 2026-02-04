import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const dimensions = {
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 40, height: 40 },
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="https://images.squarespace-cdn.com/content/v1/6639598e07b0a31d4e7592da/0a032d6f-035d-40d5-a489-7a9a539003e3/stagefylogo-removebg-preview.png?format=1000w"
        alt="Stagefy Logo"
        width={dimensions[size].width}
        height={dimensions[size].height}
        className="object-contain"
      />
      <span className={`font-bold text-slate-900 ${size === 'sm' ? 'text-sm' : size === 'md' ? 'text-xl' : 'text-2xl'}`}>
        Stagefy
      </span>
    </div>
  )
}
