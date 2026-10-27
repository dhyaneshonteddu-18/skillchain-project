import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import FormInput from '../components/FormInput';
import Alert from '../components/Alert';
import { registerSchema } from '../utils/validation';
import { formatError } from '../utils/formatting';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setErrors({});

    try {
      // Validate
      const validated = registerSchema.parse({
        email: formData.email,
        fullName: formData.fullName,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      setLoading(true);
      const response = await authAPI.register(
        validated.email,
        validated.password,
        validated.fullName,
        formData.role
      );

      if (response.data.success) {
        setSuccess('Registration successful! Logging you in...');
        login(response.data.user, response.data.token);
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        setError(response.data.message || 'Registration failed');
      }
    } catch (err) {
      if (err.errors) {
        // Zod validation errors
        const fieldErrors = {};
        err.errors.forEach(error => {
          fieldErrors[error.path[0]] = error.message;
        });
        setErrors(fieldErrors);
      } else {
        setError(formatError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8 animate-slide-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">SC</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Join SkillChain</h1>
            <p className="text-gray-600 mt-2">Create your skill passport today</p>
          </div>

          {/* Alerts */}
          {error && (
            <Alert
              type="error"
              title="Registration Error"
              message={error}
              onClose={() => setError(null)}
              className="mb-4"
            />
          )}
          {success && (
            <Alert
              type="success"
              title="Success"
              message={success}
              className="mb-4"
            />
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Full Name"
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              error={errors.fullName}
              placeholder="John Doe"
              required
              autoComplete="name"
            />

            <FormInput
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type <span className="text-red-600">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-input"
              >
                <option value="student">Student</option>
                <option value="verifier">Verifier</option>
                <option value="employer">Employer</option>
              </select>
            </div>

            <FormInput
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="At least 8 characters"
              required
              autoComplete="new-password"
            />

            <FormInput
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="Re-enter your password"
              required
              autoComplete="new-password"
            />

            {/* Password requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700">
              <p className="font-medium mb-2">Password Requirements:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>At least 8 characters</li>
                <li>Passwords must match</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-medium hover:underline">
                Login here
              </Link>
            </p>
          </div>

          {/* Terms */}
          <div className="mt-4 text-xs text-gray-500 text-center border-t pt-4">
            <p>
              By registering, you agree to our{' '}
              <Link to="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
