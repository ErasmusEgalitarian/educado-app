import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode } from 'react'

type ProvidersProps = {
  children: ReactNode
}

const queryClient = new QueryClient()

const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

export default Providers
