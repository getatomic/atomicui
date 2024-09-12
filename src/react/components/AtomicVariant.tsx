'use client'
import React, { useCallback, useEffect, useRef } from 'react'
import { useAtomic } from '../hooks'

interface AtomicVariantProps {
  children: React.ReactNode;
  variantId: string;
  featureFlag: string;
  experimentEpoch: number;
  trackableButtonIds?: string[];
  visibilityObserverOptions?: IntersectionObserverInit;
  trackInteraction?: boolean;
  trackView?: boolean;
}

export function AtomicVariant({ 
  children, 
  variantId, 
  featureFlag, 
  experimentEpoch,
  trackableButtonIds = [],
  visibilityObserverOptions,
  trackInteraction = true,
  trackView = true,
  ...props
}: AtomicVariantProps) {
  const client = useAtomic()
  const ref = useRef<HTMLDivElement>(null)
  const viewTrackedRef = useRef(false)
  const interactionTrackedRef = useRef(false)

  const track = useCallback((type: string, metadata?: any) => {
    if (!client) {
      console.error('AtomicClient not found')
      return
    }

    client.capture({
      type,
      featureFlag,
      experimentEpoch,
      variantId,
      metadata,
    })
  }, [client, featureFlag, experimentEpoch, variantId])

  const trackExposure = useCallback(() => {
    if (!viewTrackedRef.current && trackView) {
      track('exposure')
      viewTrackedRef.current = true
    }
  }, [track, trackView])

  const trackInteractionEvent = useCallback(() => {
    if (!interactionTrackedRef.current && trackInteraction) {
      track('interaction')
      interactionTrackedRef.current = true
    }
  }, [track, trackInteraction])

  useEffect(() => {
    if (ref.current === null || !trackView) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackExposure()
        }
      },
      {
        threshold: 0.1,
        ...visibilityObserverOptions,
      }
    )

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [trackView, trackExposure, visibilityObserverOptions])

  useEffect(() => {
    if (!trackInteraction) return

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const buttonId = trackableButtonIds.find(id => target.closest(`#${id}`))
      if (buttonId) {
        track('click', { buttonId })
      }
      trackInteractionEvent()
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [trackInteraction, trackableButtonIds, track, trackInteractionEvent])

  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  )
}