import './index.css'

import React from 'react'; 
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router";
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from './context/AuthProvider.jsx';
import { ThemeProvider } from "./context/theme-provider"
import { Layout } from './layout/ProtectedLayout';
import NotFound from './main/not-found';

import HR2Dashboard from './hr2/db'
import HR2PersonalData from './hr2/personal_data.jsx'
import HR2RequestForms from './hr2/request_forms.jsx'
import HR2TrainingManagement from './hr2/T_catalog.jsx'
import HR2TrainingHistory from './hr2/T_history.jsx'
import HR2LearningCatalog from './hr2/L_catalog.jsx'
import HR2LearningHistory from './hr2/L_history.jsx'
import HR2TalentAnalytics from './hr2/talent_analytics.jsx'
import HR2LeadershipDevelopment from './hr2/leadership_dev.jsx'
import HR2CompetencyProfile from './hr2/comp_profile.jsx'
import HR2AssessmentDevelopment from './hr2/assess_dev.jsx'

//console.log('app: src/main.jsx loaded'); 
const baseUrl = import.meta.env.VITE_BASE_URL

createRoot(document.getElementById('root')).render(
  // basename = baseUrl jsut like base value inside vite.config.js
  // Tells BrowserRouter that this is the base URL
  <BrowserRouter basename={baseUrl ? baseUrl : '/'}>
    <AuthProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Toaster richColors />
        <Routes>

          <Route path="/" element={<Layout allowedRoles={['Super Admin', 'HR2 Admin', 'Trainer', 'Employee']} />}>
            <Route path="db" element={<HR2Dashboard />}/>
            {/* CMS */}
            <Route path="comp_profile" element={<HR2CompetencyProfile />}/>
            <Route path="assess_dev" element={<HR2AssessmentDevelopment />}/>
            {/* ESS */}
            <Route path="personal_data" element={<HR2PersonalData />}/>
            <Route path="request_forms" element={<HR2RequestForms />}/>
            {/* TMS */}
            <Route path="T_catalog" element={<HR2TrainingManagement />}/>
            <Route path="T_history" element={<HR2TrainingHistory />}/>
            {/* LMS */}
            <Route path="L_catalog" element={<HR2LearningCatalog />}/>
            <Route path="L_history" element={<HR2LearningHistory />}/>
            {/* SPS */}
            <Route path="talent_analytics" element={<HR2TalentAnalytics />}/>
            <Route path="leadership_dev" element={<HR2LeadershipDevelopment />}/>
          </Route>

          <Route path='*' element={<NotFound />} />
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  </BrowserRouter>
)
