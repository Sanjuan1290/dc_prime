import { RouterProvider, createBrowserRouter, createRoutesFromChildren, Route } from "react-router-dom"
import Login from "./auth/Login"
import MainLayout from "./layouts/MainLayout"
import Dashboard from "./pages/Dashboard"


const App = () => {
  const router = createBrowserRouter(createRoutesFromChildren(
    <Route path="/" element={<MainLayout />}>
      <Route index element={<Login />} />

      <Route path="dashboard" element={<Dashboard />}/>
    </Route>
  ))

  return <RouterProvider router={router} />
}

export default App
