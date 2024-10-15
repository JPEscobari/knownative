import { useState } from 'react';
import './LoginPage.css';

export default function LoginPage() {
  const [inputValue, setInputValue] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputValue({
      ...inputValue,
      [name]: value
    });
  };

  //
  return (
    <main className="login-page-login-form-container">
      <form className="login-page-login-form">
        <label>Email/Username:</label>
        <input type="text" name="email" value={inputValue.email} onChange={handleChange} />
        <label>Password:</label>
        <input
          type="password"
          name="password"
          value={inputValue.password}
          onChange={handleChange}
        />
        <button type="submit" className="login-page-login-button">
          Login
        </button>
      </form>
    </main>
  );
}
