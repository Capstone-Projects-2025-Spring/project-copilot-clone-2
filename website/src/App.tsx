import { Routes, Route } from "react-router-dom";
import './index.css'
import RootLayout from "./_root/RootLayout";
import Dashboard from "./_root/pages/Dashboard";
import Quiz from "./_root/pages/Quiz";
import Landing from "./_root/pages/Landing";
import LogIn from "./_root/pages/LogIn";
import SignUp from "./_root/pages/SignUp";
import About from "./_root/pages/About";

const App = () => {
  return (
    <main className="flex h-screen w-full ">
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/about" element={<About />} />
        </Route>
      </Routes>
    </main>
  )
}

export default App
