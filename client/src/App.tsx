import { RouterProvider, createBrowserRouter, createRoutesFromChildren, Route } from "react-router-dom"
import Login from "./auth/Login"
import MainLayout from "./layouts/MainLayout"
import SystemLayout from "./layouts/systemLayout"
import Dashboard from "./pages/Dashboard"


const App = () => {
  const router = createBrowserRouter(createRoutesFromChildren(
    <>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Login />} />
      </Route>

      <Route element={<SystemLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
      </Route>
    </>
  ))

  return <RouterProvider router={router} />
}

export default App
