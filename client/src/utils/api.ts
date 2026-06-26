export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"

export const getErrorMessage = async (response: Response) => {
  try {
    const data = await response.json()

    if (typeof data.message === "string") {
      return data.message
    }
  } catch {
    return "Request failed"
  }

  return "Request failed"
}

