import { Routes, Route } from "react-router-dom";
import AuthLayout from "./_auth/AuthLayout";
import SignUpForm from "./_auth/forms/SignUpForm";
import LogInForm from "./_auth/forms/LogInForm";
import './index.css'
import RootLayout from "./_root/RootLayout";
import Dashboard from "./_root/pages/Dashboard";
import Quiz from "./_root/pages/Quiz";
import Landing from "./_root/pages/Landing";
import LogIn from "./_root/pages/LogIn";

const App = () => {
  return (
    <main className="flex h-screen w-full v ">
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/signup" element={<SignUpForm />} />
          <Route path="/login" element={<LogInForm />} />
        </Route>

        <Route element={<RootLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/login" element={<LogIn />} />
        </Route>
      </Routes>
    </main>
  )
}

export default App
