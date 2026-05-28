import { Heart } from 'lucide-react'

export default function HeartIcon({ activated }) {
  return (
    <Heart
      size={32}
      className={activated ? 'animate-heart-pop-shake' : ''}
      style={{ color: '#89CFF0', fill: activated ? '#89CFF0' : 'none' }}
    />
  )
}
