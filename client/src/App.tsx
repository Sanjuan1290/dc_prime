import { RouterProvider, createBrowserRouter, createRoutesFromChildren, Route } from "react-router-dom"
import Login from "./auth/Login"
import MainLayout from "./layouts/MainLayout"
import SystemLayout from "./layouts/systemLayout"
import Dashboard from "./pages/Dashboard"
import Projects from "./pages/Projects"
import Listings from "./pages/Listings"
import Clients from "./pages/Clients"
import ClientListings from "./pages/ClientListings"
import AccredittedSellers from "./pages/AccredittedSellers"


const App = () => {
  const router = createBrowserRouter(createRoutesFromChildren(
    <>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Login />} />
      </Route>

      <Route element={<SystemLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="projects" element={<Projects/>} />
        <Route path="listings" element={<Listings/>} />
        <Route path="clients" element={<Clients/>} />
        <Route path="client/:id" element={<ClientListings/>} />
        <Route path="accreditted_sellers" element={<AccredittedSellers/>} />
      </Route>
    </>
  ))

  return <RouterProvider router={router} />
}

export default App
