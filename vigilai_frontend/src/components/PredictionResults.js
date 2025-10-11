// src/components/PredictionResults.js
import React from 'react';
import { Container, Row, Col, Card, Navbar, Button, Table, ProgressBar, Alert } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';

function PredictionResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const { prediction, caseData } = location.state || {};

  if (!prediction) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
        <Navbar bg="white" expand="lg" className="shadow-sm">
          <Container>
            <Navbar.Brand className="fw-bold text-primary">VigilAI</Navbar.Brand>
            <div className="ms-auto">
              <Button variant="outline-secondary" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </Container>
        </Navbar>
        <Container className="py-5">
          <Alert variant="danger" className="text-center">
            No prediction data found. Please go back and try again.
          </Alert>
        </Container>
      </div>
    );
  }

  const suspects = prediction.suspects || [];
  const caseInfo = caseData || {};

  return (
    <div style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
      <Navbar bg="white" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand className="fw-bold text-primary">VigilAI</Navbar.Brand>
          <div className="ms-auto">
            <Button variant="outline-secondary" onClick={() => navigate('/dashboard')} className="me-2">
              Back to Dashboard
            </Button>
            <Button variant="primary" onClick={() => navigate('/cases')}>
              View All Cases
            </Button>
          </div>
        </Container>
      </Navbar>

      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={10}>
            <div className="text-center mb-4">
              <h2 className="fw-bold text-dark">Suspect Prediction Results</h2>
              <p className="text-muted">
                AI-powered suspect analysis for Case #{caseInfo.crime_id}
              </p>
            </div>

            {/* Case Information */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                <h5 className="fw-bold mb-3">Case Details</h5>
                <Row>
                  <Col md={6}>
                    <p><strong>Case ID:</strong> {caseInfo.crime_id}</p>
                    <p><strong>Title:</strong> {caseInfo.title}</p>
                    <p><strong>Location:</strong> {caseInfo.location}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Date:</strong> {new Date(caseInfo.date).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> {caseInfo.status}</p>
                    <p><strong>Investigator:</strong> {caseInfo.investigator}</p>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Prediction Results */}
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <h5 className="fw-bold mb-4">Top 5 Suspect Predictions</h5>
                
                {suspects.length > 0 ? (
                  <Table striped bordered hover responsive>
                    <thead className="table-dark">
                      <tr>
                        <th>Rank</th>
                        <th>Suspect Name</th>
                        <th>Probability Score</th>
                        <th>Confidence Level</th>
                        <th>Previous Offenses</th>
                        <th>Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suspects.map((suspect, index) => (
                        <tr key={index}>
                          <td className="fw-bold">#{index + 1}</td>
                          <td className="fw-semibold">{suspect.name}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="me-2">{(suspect.probability * 100).toFixed(1)}%</span>
                              <ProgressBar 
                                now={suspect.probability * 100} 
                                variant={getVariant(suspect.probability)}
                                style={{ width: '100px', height: '8px' }}
                              />
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${getConfidenceBadge(suspect.probability)}`}>
                              {getConfidenceLevel(suspect.probability)}
                            </span>
                          </td>
                          <td>{suspect.previous_offenses || 'Unknown'}</td>
                          <td>
                            <span className={`badge ${getRiskBadge(suspect.risk_level)}`}>
                              {suspect.risk_level || 'Medium'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <Alert variant="info" className="text-center">
                    No suspect predictions available for this case.
                  </Alert>
                )}

                {/* Additional Analysis */}
                {prediction.analysis && (
                  <div className="mt-4">
                    <h6 className="fw-bold">AI Analysis</h6>
                    <p className="text-muted">{prediction.analysis}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="d-flex gap-2 mt-4">
                  <Button variant="primary" onClick={() => navigate('/dashboard')}>
                    Back to Dashboard
                  </Button>
                  <Button variant="outline-secondary" onClick={() => navigate(`/cases/edit/${caseInfo.id}`)}>
                    Edit Case
                  </Button>
                  <Button variant="success" onClick={() => window.print()}>
                    Print Report
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

// Helper functions
function getVariant(probability) {
  if (probability >= 0.8) return 'danger';
  if (probability >= 0.6) return 'warning';
  if (probability >= 0.4) return 'info';
  return 'success';
}

function getConfidenceLevel(probability) {
  if (probability >= 0.8) return 'High';
  if (probability >= 0.6) return 'Medium-High';
  if (probability >= 0.4) return 'Medium';
  return 'Low';
}

function getConfidenceBadge(probability) {
  if (probability >= 0.8) return 'bg-danger';
  if (probability >= 0.6) return 'bg-warning';
  if (probability >= 0.4) return 'bg-info';
  return 'bg-success';
}

function getRiskBadge(riskLevel) {
  const risk = riskLevel?.toLowerCase() || 'medium';
  if (risk === 'high') return 'bg-danger';
  if (risk === 'medium') return 'bg-warning';
  return 'bg-success';
}

export default PredictionResults;