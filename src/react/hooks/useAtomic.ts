import { useContext } from 'react'
import { AtomicClient } from '@atomic/core'
import { AtomicContext } from '../context'

export const useAtomic = (): AtomicClient => {
    const { client } = useContext(AtomicContext)
    return client
}