import { useEffect } from 'react'

let lockCount = 0

export function useScrollLock(locked) {
  useEffect(() => {
    if (!locked) return
    lockCount++
    document.body.style.overflow = 'hidden'
    return () => {
      lockCount--
      if (lockCount === 0) document.body.style.overflow = 'unset'
    }
  }, [locked])
}
