import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom"; 
import zxcvbn from "zxcvbn";
import { toast } from 'react-toastify';
import { useAuth } from "../contexts/AuthContext";

const PasswordStrengthMeter = ({ password }) => {
  const testResult = zxcvbn(password);
  const score = testResult.score;

  const strengthLabel = () => {
    switch (score) {
      case 0:
        return "Very Weak";
      case 1:
        return "Weak";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Strong";
      default:
        return "";
    }
  };

  const strengthColor = () => {
    switch (score) {
      case 0:
        return "bg-red-500"; 
      case 1:
        return "bg-orange-500"; 
      case 2:
        return "bg-yellow-500"; 
      case 3:
        return "bg-lime-500"; 
      case 4:
        return "bg-green-500"; 
      default:
        return "bg-gray-200";
    }
  };

  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>Password Strength:</span>
        <span
          className={`font-semibold ${
            score <= 1
              ? "text-red-600"
              : score <= 2
              ? "text-yellow-600"
              : "text-green-600"
          }`}
        >
          {strengthLabel()}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${strengthColor()}`}
          style={{ width: `${(score / 4) * 100}%` }}
        ></div>
      </div>
      {password && testResult.feedback.suggestions.length > 0 && (
        <ul className="text-xs text-gray-500 mt-1 list-disc list-inside">
          {testResult.feedback.suggestions.map((suggestion, index) => (
            <li key={index}>{suggestion}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

const SignUpPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const { signupUser, loading, setLoading, user } = useAuth();
  const navigate = useNavigate(); 
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const from =
        location.state?.from?.pathname ||
        (user.isProfileComplete ? "/dashboard" : "/complete-profile");
      navigate(from, { replace: true });
    }
  }, [user, navigate, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (username.length < 3) {
      toast.error("Username must be at least 3 characters long.");
      return;
    }

    setLoading(true);
    try {
      const signedUpUser = await signupUser(username, password);
      if (signedUpUser) {
        navigate("/complete-profile");
      }
    } catch (err) {
      const errorMessage =
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : "An unexpected error occurred. Please try again.";
      toast.error(errorMessage);
      console.error("Signup error:", err.response ? err.response.data : err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {" "}
      <div className="max-w-md w-full space-y-8 p-10 bg-white shadow-xl rounded-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-black">
            Create your account
          </h2>
        </div>
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username_signup_page" className="sr-only">
                Username
              </label>
              <input
                id="username_signup_page"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-black focus:border-black focus:z-10 sm:text-sm"
                placeholder="Username (min 3 chars)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password_signup_page" className="sr-only">
                Password
              </label>
              <input
                id="password_signup_page" 
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-black focus:border-black focus:z-10 sm:text-sm"
                placeholder="Password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password_signup_page" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirm-password_signup_page" 
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-black focus:border-black focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {password && <PasswordStrengthMeter password={password} />}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </div>
        </form>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            to="/signin"
            className="font-medium text-black hover:text-gray-700"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
