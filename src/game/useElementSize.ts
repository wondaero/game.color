import { useEffect, useRef, useState } from 'react'

export interface ElementSize {
  width: number
  height: number
}

/** Tracks an element's content-box size via ResizeObserver (device rotation, layout changes, etc). */
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new ResizeObserver(([entry]) => {
      const box = entry.contentBoxSize?.[0]
      if (box) {
        setSize({ width: box.inlineSize, height: box.blockSize })
      } else {
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
      }
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, size }
}
