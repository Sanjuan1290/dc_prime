import { RouterProvider, createBrowserRouter, createRoutesFromChildren, Route } from "react-router-dom"
import MainLayout from './layouts/mainLayout'


const App = () => {
  const router = createBrowserRouter(createRoutesFromChildren(
    <Route path="/" element={<MainLayout />}>

    </Route>
  ))

  return <RouterProvider router={router} />
}

export default App