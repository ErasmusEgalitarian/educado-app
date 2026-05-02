const API_URL = process.env.EXPO_PUBLIC_API_URL

if (!API_URL) {
  throw new Error(
    'EXPO_PUBLIC_API_URL is not set. Define it in .env for local dev or via `eas env:create` for EAS builds.'
  )
}

export const API_BASE_URL: string = API_URL
