import React from 'react'
import NavBar from '../components/NavBar';


const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      {/* Navbar */}
      <NavBar />
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center mt-24 px-6 py-20 bg-gradient-to-b from-black to-gray-800 rounded-lg shadow-xl">
        <h1 className="text-5xl font-extrabold text-white">
          Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#50B498] to-[#9CDBA6]">CLOVER</span>
        </h1>
        <p className="mt-4 text-lg text-gray-300 max-w-2xl">
          CLOVER is an AI-powered code assistant designed to help beginner programmers improve their skills.
          Unlike traditional tools, CLOVER tracks mistakes, encourages reflection, and reduces over-reliance on AI-generated code. 
        </p>
        <button className="mt-6 px-6 py-3 bg-[#50B498] text-black text-lg font-semibold rounded-lg hover:bg-white hover:text-black transition">
          Try CLOVER Now
        </button>
      </section>

      {/* Features Section */}
      <section className=" px-10 py-16 bg-gradient-to-br from-gray-800 to-gray-700 text-white shadow-xl">
        <h2 className="text-3xl font-bold text-center text-[#50B498]">Why Choose CLOVER?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 text-center">
          <div className="p-6 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-[#9CDBA6]">Smart Inline Suggestions</h3>
            <p className="mt-2 text-gray-300">Get real-time coding suggestions, including correct and incorrect options to encourage critical thinking.</p>
          </div>
          <div className="p-6 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-[#9CDBA6]">AI-Powered Learning</h3>
            <p className="mt-2 text-gray-300">Ask questions about code snippets, get explanations, and track learning patterns in real time.</p>
          </div>
          <div className="p-6 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-[#9CDBA6]">Mistake Recognition & Insights</h3>
            <p className="mt-2 text-gray-300">Monitor response times, correctness, and frequently asked questions to track progress.</p>
          </div>
          <div className="p-6 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-[#9CDBA6]">Instructor Dashboard</h3>
            <p className="mt-2 text-gray-300">Instructors can review student progress, identify common errors, and provide targeted interventions.</p>
          </div>
          <div className="p-6 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-[#9CDBA6]">Seamless IDE Integration</h3>
            <p className="mt-2 text-gray-300">CLOVER works directly inside Visual Studio Code with minimal disruption to workflow.</p>
          </div>
          <div className="p-6 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-[#9CDBA6]">Statistics Portal</h3>
            <p className="mt-2 text-gray-300">Users can review their coding habits, improve performance, and refine problem-solving skills.</p>
          </div>
        </div>
      </section>

      {/* Call-to-Action */}
      <section className=" flex flex-col items-center justify-center text-center px-6 py-20 bg-gradient-to-b from-gray-800 to-black shadow-xl">
        <h2 className="text-4xl font-bold text-white">Start Learning with AI Today</h2>
        <p className="mt-4 text-lg text-gray-300 max-w-2xl">
          Whether you're a beginner learning to code or an instructor looking for insights, CLOVER is the perfect tool for guided AI-assisted learning.
        </p>
        <button className="mt-6 px-6 py-3 bg-[#50B498] text-black text-lg font-semibold rounded-lg hover:bg-white hover:text-black transition">
          Download CLOVER for VS Code
        </button>
      </section>

      {/* Footer */}
      <footer className=" py-6 bg-gradient-to-r from-black to-gray-900 text-center text-sm text-gray-400">
        <p>© 2025 CLOVER</p>
        <p className="text-[#50B498]">TEAM 22</p>
      </footer>
    </div>
  );
};

export default Landing