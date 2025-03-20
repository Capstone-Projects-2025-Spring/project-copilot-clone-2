import React from "react";
import NavBar from "../components/NavBar";

const About: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full bg-gradient-to-b from-black to-gray-900 min-h-full text-white px-6">
    <NavBar /> 
      <h1 className="mt-20 text-3xl md:text-4xl font-bold mb-6 h-[200px]">About CLOVER</h1>
      <p className="text-lg text-gray-300 max-w-3xl text-center mb-6">
        Clover is an AI-powered code assistant, similar to Copilot that helps new developers learn and improve their coding skills. 
        Below, you can explore our documentation for more details.
      </p>

      {/* Embedded Docusaurus Site */}
      <div className="w-full max-w-5xl h-[1000px] border border-gray-700 bg-white rounded-lg shadow-lg">
        <iframe
          src="https://capstone-projects-2025-spring.github.io/project-copilot-clone-2/"
          className="w-full h-full rounded-lg"
          title="CLOVER documentation">
        </iframe>
        </div>
    </div>
  );
};

export default About;