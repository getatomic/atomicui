'use client'
import { createContext } from 'react'
import { AtomicClient } from '@atomic/core'

export const AtomicContext = createContext<{ client: AtomicClient } >({ client: new AtomicClient() })