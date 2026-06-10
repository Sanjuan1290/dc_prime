import { RouterProvider, createBrowserRouter, createRoutesFromChildren, Route } from "react-router-dom"
import Login from "./auth/Login"
import MainLayout from "./layouts/MainLayout"
import SystemLayout from "./layouts/systemLayout"
import Dashboard from "./pages/Dashboard"
import Projects from "./pages/Projects"
import Listings from "./pages/Listings"
import Clients from "./pages/Clients"
import ClientProfile from "./pages/ClientProfile"
import AccredittedSellers from "./pages/AccredittedSellers"
import Documents from "./pages/Documents"
import Payments from "./pages/Payments"
import Commissions from "./pages/Commissions"
import Reports from "./pages/Reports"
import AuditLogs from "./pages/AuditLogs"
import Settings from "./pages/Settings"
import Employees from "./pages/Employees"
import Attendance from "./pages/Attendance"
import NotFound from "./pages/NotFound"
import CashAdvances from "./pages/CashAdvances"


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
        <Route path="client/:id" element={<ClientProfile/>} />
        <Route path="accreditted_sellers" element={<AccredittedSellers/>} />
        <Route path="documents" element={<Documents/>} />
        <Route path="payments" element={<Payments/>} />
        <Route path="commissions" element={<Commissions/>} />
        <Route path="cash-advances" element={<CashAdvances />} />
        <Route path="reports" element={<Reports/>} />
        <Route path="audit-logs" element={<AuditLogs/>} />
        <Route path="settings" element={<Settings/>} />
        <Route path="employees" element={<Employees/>} />
        <Route path="attendance" element={<Attendance/>} />
      </Route>

      <Route path="*" element={<NotFound />}/>
    </>
  ))

  return <RouterProvider router={router} />
}

export default App
