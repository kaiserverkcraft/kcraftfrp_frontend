interface AppConfig {
  apiBaseUrl: string
  wsBaseUrl: string
}

const DEFAULT_CONFIG: AppConfig = {
  apiBaseUrl: '/api',
  wsBaseUrl: '',
}

let config: AppConfig = { ...DEFAULT_CONFIG }

export async function loadConfig(): Promise<AppConfig> {
  try {
    const response = await fetch('/config.json')
    if (response.ok) {
      const data = await response.json()
      config = { ...DEFAULT_CONFIG, ...data }
    }
  } catch {
  }
  return config
}

export function getConfig(): AppConfig {
  return config
}

export function getApiBaseUrl(): string {
  return config.apiBaseUrl
}

export function getWsBaseUrl(): string {
  return config.wsBaseUrl
}
