import { BrowserRouter, Route, Routes } from "react-router-dom";

// Pages
import LandingPage from "./components/LandingPage_1";
import AboutUs from "./components/AboutPage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";

// Authentication
import PatientLogin from "./components/PatientLogin";
import DoctorLogin from "./components/DoctorLogin";
import DiagnosticLogin from "./components/DiagnosticLogin";

// Registration
import PatientRegistry from "./components/PatientRegistration";
import DoctorRegistry from "./components/DoctorRegistration";
import DiagnosticRegistry from "./components/DiagnosticsRegistration";

// Dashboards
import PatientDashBoard from "./components/PatientDashBoard";
import DoctorDashBoard from "./components/DoctorDashBoard";
import DiagnosticDashBoard from "./components/DiagnosticDashBoard";

// Patient Features
import ViewProfile from "./components/ViewProfile";
import ViewPatientRecords from "./components/ViewPatientRecords";
import UploadPastRecords from "./components/UploadPastRecords";

// Doctor Features
import ViewDoctorProfile from "./components/ViewDoctorProfile";
import ViewPatientList from "./components/ViewPatientList";
import DoctorViewPatientRecords from "./components/DoctorViewPatientRecords";

// Diagnostic Features
import ViewDiagnosticProfile from "./components/ViewDiagnosticProfile";
import DiagnosticForm from "./components/DiagnosticForm";

// Layout
import Footer from "./components/Footer";

const BrowseRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Authentication Routes */}
        <Route path="/patient_login" element={<PatientLogin />} />
        <Route path="/doctor_login" element={<DoctorLogin />} />
        <Route path="/diagnostic_login" element={<DiagnosticLogin />} />

        {/* Registration Routes */}
        <Route path="/patient_registration" element={<PatientRegistry />} />
        <Route path="/doctor_registration" element={<DoctorRegistry />} />
        <Route path="/diagnostic_registration" element={<DiagnosticRegistry />} />

        {/* Patient Routes */}
        <Route path="/patient/:hhNumber" element={<PatientDashBoard />} />
        <Route path="/patient/:hhNumber/viewprofile" element={<ViewProfile />} />
        <Route path="/patient/:hhNumber/viewrecords" element={<ViewPatientRecords />} />
        <Route path="/patient/:hhNumber/upload" element={<UploadPastRecords />} />

        {/* Doctor Routes */}
        <Route path="/doctor/:hhNumber" element={<DoctorDashBoard />} />
        <Route path="/doctor/:hhNumber/viewdoctorprofile" element={<ViewDoctorProfile />} />
        <Route path="/doctor/:hhNumber/patientlist" element={<ViewPatientList />} />
        <Route path="/doctor/:hhNumber/patient/:patientHhNumber/records" element={<DoctorViewPatientRecords />} />

        {/* Diagnostic Routes */}
        <Route path="/diagnostic/:hhNumber" element={<DiagnosticDashBoard />} />
        <Route path="/diagnostic/:hhNumber/viewdiagnosticprofile" element={<ViewDiagnosticProfile />} />
        <Route path="/diagnostic/:hhNumber/diagnosticform" element={<DiagnosticForm />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
};

export default BrowseRouter;
