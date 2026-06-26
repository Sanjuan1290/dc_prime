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
import OfferToBuyPrint from "./pages/OfferToBuyPrint"
import StatementOfAccountPrint from "./pages/StatementOfAccountPrint"
import Users from "./pages/Users"
import TeamSales from "./pages/TeamSales"
import MyTeam from "./pages/MyTeam"
import AvailableUnits from "./pages/AvailableUnits"
import SellerDashboard from "./pages/SellerDashboard"
import ChangePassword from "./pages/ChangePassword"
import ProjectPriceListPrint from "./pages/ProjectPriceListPrint"
import Notifications from "./pages/Notifications"


const App = () => {
  const router = createBrowserRouter(createRoutesFromChildren(
    <>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Login />} />
      </Route>

      <Route element={<SystemLayout />}>
        <Route path="dashboard" element
        ={<Dashboard />} />
        <Route path="projects" element={<Projects/>} />
        <Route path="listings" element={<Listings/>} />
        <Route path="clients" element={<Clients/>} />
        <Route path="client/:id" element={<ClientProfile/>} />
        <Route path="accreditted_sellers" element={<AccredittedSellers/>} />
        <Route path="documents" element={<Documents/>} />
        <Route path="payments" element={<Payments/>} />
        <Route path="notifications" element={<Notifications/>} />
        <Route path="commissions" element={<Commissions/>} />
        <Route path="cash-advances" element={<CashAdvances />} />
        <Route path="reports" element={<Reports/>} />
        <Route path="audit-logs" element={<AuditLogs/>} />
        <Route path="settings" element={<Settings/>} />
        <Route path="users" element={<Users/>} />
        <Route path="employees" element={<Employees/>} />
        <Route path="attendance" element={<Attendance/>} />
        <Route path="change-password" element={<ChangePassword />} />
        <Route path="seller-dashboard" element={<SellerDashboard />} />
        <Route path="available-units" element={<AvailableUnits />} />
        <Route path="my-team" element={<MyTeam />} />
        <Route path="team-sales" element={<TeamSales />} />
      </Route>

      <Route path="client/:clientId/units/:clientUnitId/offer-to-buy/print" element={<OfferToBuyPrint />} />
      <Route path="client/:clientId/units/:clientUnitId/statement-of-account/print" element={<StatementOfAccountPrint />} />
      <Route path="projects/:projectId/price-list/print" element={<ProjectPriceListPrint />} />

      <Route path="*" element={<NotFound />}/>
    </>
  ))

  return <RouterProvider router={router} />
}

export default App

