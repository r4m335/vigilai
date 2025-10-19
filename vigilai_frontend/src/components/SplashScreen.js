// components/SplashScreen.js
import React from 'react';
import { Container, Spinner } from 'react-bootstrap';

const SplashScreen = () => {
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      minHeight: '100vh',
      color: 'white'
    }}>
      <Container className="d-flex flex-column justify-content-center align-items-center" style={{ height: '100vh' }}>
        <h1 className="fw-bold mb-3">VigilAI</h1>
        <p className="mb-4">Partner in Justice</p>
        <Spinner animation="border" variant="light" />
        <p className="mt-3">Loading...</p>
      </Container>
    </div>
  );
};

export default SplashScreen;