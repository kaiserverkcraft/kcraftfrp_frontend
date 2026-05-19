import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SidebarProvider } from './components/ui/sidebar'
import { Toaster } from './components/ui/sonner'
import { ThemeProvider } from './components/theme/ThemeProvider'
import App from './App'
import { loadConfig } from './lib/config'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
})

async function bootstrap() {
  await loadConfig()
  
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <SidebarProvider>
              <App />
              <Toaster />
            </SidebarProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </React.StrictMode>
  )
}

bootstrap()
