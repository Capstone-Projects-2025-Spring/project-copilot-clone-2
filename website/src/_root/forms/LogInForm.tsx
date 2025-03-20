import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Handle GitHub Login
  const handleGitHubLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: "https://localhost:5173" }, // Update redirect URL
    });

    if (error) {
      setError("GitHub login failed. Please try again.");
    }
  };

  // Handle Email + Password Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Invalid email or password.");
    } else if (!data.user) {
      navigate("/signup"); // Redirect if user not found
    } else {
      navigate("/dashboard"); // Redirect after login
    }
  };

  return (
    <div className="flex justify-center items-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center mb-6">Log In to CLOVER</h2>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {/* Email + Password Login */}
        <form onSubmit={handleLogin} className="flex flex-col">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 mb-4 border border-gray-600 rounded bg-gray-700 text-white"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 mb-4 border border-gray-600 rounded bg-gray-700 text-white"
            required
          />
          <button type="submit" className="w-full bg-[#50B498] text-black py-2 rounded hover:bg-[#468585] transition">
            Log In
          </button>
        </form>

        {/* GitHub OAuth Login */}
        <button
          onClick={handleGitHubLogin}
          className="mt-4 w-full bg-gray-700 text-white py-2 rounded hover:bg-gray-600 transition flex items-center justify-center space-x-2"
        >
          <img src="https://img.icons8.com/?size=100&id=62856&format=png&color=FFFFFF" alt="GitHub Logo" className="h-5 w-5" />
          <span>Sign in with GitHub</span>
        </button>

        <p className="mt-4 text-center text-gray-400">
          Don't have an account?{" "}
          <button onClick={() => navigate("/signup")} className="text-[#50B498] hover:underline">
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;