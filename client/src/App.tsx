import { RouterProvider, createBrowserRouter, createRoutesFromChildren, Route } from "react-router-dom"
import Login from "./components/Login"
import MainLayout from "./layouts/MainLayout"


const App = () => {
  const router = createBrowserRouter(createRoutesFromChildren(
    <Route path="/" element={<MainLayout />}>
      <Route index element={<Login />} />
    </Route>
  ))

  return <RouterProvider router={router} />
}

export default App
