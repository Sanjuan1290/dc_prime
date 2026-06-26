import { useQuery } from "@tanstack/react-query"
import { API_URL } from "./api"

const useCurrentUser = () => {
  return useQuery({
    queryKey: ["token"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/getCurrentUser`, {
        credentials: "include",
      })

      if (!res.ok) {
        return null
      }

      return res.json()
    },
    retry: false,
  })
}

export default useCurrentUser

