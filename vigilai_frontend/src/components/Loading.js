// components/Loading.js
import React from 'react';
import { Spinner, Container } from 'react-bootstrap';

const Loading = ({ message = "Loading..." }) => {
  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="text-center">
        <Spinner animation="border" variant="primary" size="lg" className="mb-3" />
        <p className="text-muted">{message}</p>
      </div>
    </Container>
  );
};

export default Loading;