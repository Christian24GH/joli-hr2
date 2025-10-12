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
import HR2CompetencyManagement from './hr2/cms'
import HR2LearningManagement from './hr2/lms'
import HR2TrainingManagement from './hr2/tms'
import HR2SuccessionPlanning from './hr2/sps'
import HR2EmployeeSelfService from './hr2/ess'

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
            <Route index element={<HR2Dashboard />} />
            <Route path="cms" element={<HR2CompetencyManagement />} />
            <Route path="lms" element={<HR2LearningManagement />} />
            <Route path="tms" element={<HR2TrainingManagement />} />
            <Route path="sps" element={<HR2SuccessionPlanning />} />
            <Route path="ess" element={<HR2EmployeeSelfService />} />
          </Route>

          <Route path='*' element={<NotFound />} />
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  </BrowserRouter>
)
