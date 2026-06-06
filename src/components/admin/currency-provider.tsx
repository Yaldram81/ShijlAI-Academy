'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { CURRENCIES, DEFAULT_CURRENCY, STORAGE_KEY_CURRENCY } from './constants'
import type { CurrencyConfig } from './types'

function getInitialCurrency(): CurrencyConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENCY)
    if (saved) {
      const found = CURRENCIES.find(c => c.code === saved)
      if (found) return found
    }
  } catch {
    // Ignore localStorage errors
  }
  return CURRENCIES.find(c => c.code === DEFAULT_CURRENCY)!
}

interface CurrencyContextValue {
  currency: CurrencyConfig
  setCurrency: (code: string) => void
  formatAmount: (amount: number) => string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyConfig>(getInitialCurrency)

  const setCurrency = useCallback((code: string) => {
    const found = CURRENCIES.find(c => c.code === code)
    if (found) {
      setCurrencyState(found)
      try {
        localStorage.setItem(STORAGE_KEY_CURRENCY, found.code)
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [])

  const formatAmount = useCallback((amount: number): string => {
    const converted = Math.round(amount * currency.rate * 100) / 100
    return `${currency.symbol}${converted.toLocaleString(undefined, {
      minimumFractionDigits: converted < 100 ? 2 : 0,
      maximumFractionDigits: 2,
    })}`
  }, [currency])

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}
