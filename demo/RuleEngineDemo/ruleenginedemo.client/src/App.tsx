import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import { AppLayout } from "@/components/AppLayout"
import Dashboard from "@/pages/Dashboard"
import RulesPage from "@/pages/RulesPage"
import EcommercePage from "@/pages/EcommercePage"
// Actually I'll use standard router setup
function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="nergora-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="rules" element={<RulesPage />} />
            <Route path="ecommerce" element={<EcommercePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
