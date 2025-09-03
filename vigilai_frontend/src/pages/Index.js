import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';


function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/register/', { username: email, password });
      setSuccess(true);
    } catch {
      setSuccess(false);
    }
  };

  return (
    <div className="container d-flex vh-100 justify-content-center align-items-center">
      <div className="w-100" style={{ maxWidth: '400px' }}>
        <div className="card p-4 shadow-sm">
          <h3 className="text-center mb-4">Create an Account</h3>

          {success === true && (
            <div className="alert alert-success">Registration successful! Please log in.</div>
          )}
          {success === false && (
            <div className="alert alert-danger">Registration failed. Try again.</div>
          )}

          <form onSubmit={handleRegister}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button className="btn btn-primary w-100 py-2" type="submit">Register</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
