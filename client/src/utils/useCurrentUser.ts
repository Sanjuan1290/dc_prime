import { useQuery } from "@tanstack/react-query"

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

const useCurrentUser = () => {
    return useQuery({ 
        queryKey: ['token'], 
        queryFn: async () => {
        const res = await fetch(`${API_URL}/getCurrentUser`, {
            credentials: 'include'
        })

        if(!res.ok) {
            return null
        }

        return res.json()
    }, 
        retry: false
    })

}

export default useCurrentUser