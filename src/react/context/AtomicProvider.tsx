import React, { useMemo } from 'react'
import { AtomicClient } from '@atomic/core'
import { AtomicContext } from './AtomicContext'

interface AtomicProviderProps {
  client: AtomicClient
  children: React.ReactNode
}

export function AtomicProvider({ client, children }: AtomicProviderProps) {
  const atomicClient = useMemo(() => {
    if (client) {
      return client
    }
  }, [client])

  if (!atomicClient || typeof window === 'undefined') {
    return <>{children}</>
  }

  return <AtomicContext.Provider value={{ client: atomicClient }}>{children}</AtomicContext.Provider>
}
