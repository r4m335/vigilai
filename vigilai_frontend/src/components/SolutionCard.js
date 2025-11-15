import React from 'react';
import { Card } from 'react-bootstrap';

const SolutionCard = ({ icon, title, description }) => (
  <Col md={4}>
    <Card className="h-100 border-0 shadow-sm solution-card">
      <Card.Body className="p-3 text-center">
        <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-3 mb-2">
          <i className={`bi ${icon} text-primary fs-4`} aria-hidden="true"></i>
        </div>
        <Card.Title className="fw-bold mb-2 h5">{title}</Card.Title>
        <Card.Text className="text-muted small">
          {description}
        </Card.Text>
      </Card.Body>
    </Card>
  </Col>
);

export default SolutionCard;