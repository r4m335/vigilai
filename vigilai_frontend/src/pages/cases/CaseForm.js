// src/pages/CaseForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Container, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';

export default function CaseForm() {
  const { id } = useParams();               // Captures case ID from route, if editing
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: '',
  });
  const [loading, setLoading] = useState(isEdit); // Load existing data only if editing
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch existing case data if in edit mode
  useEffect(() => {
    if (isEdit) {
      axios.get(`/api/cases/${id}/`)
        .then(res => {
          setFormData({
            title: res.data.title || '',
            description: res.data.description || '',
            status: res.data.status || '',
          });
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError('Failed to load case data.');
          setLoading(false);
        });
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    const request = isEdit
      ? axios.put(`/api/cases/${id}/`, formData)
      : axios.post('/api/cases/', formData);

    request
      .then(() => navigate('/'))
      .catch(err => {
        console.error(err);
        setError('Submission failed. Please try again.');
      })
      .finally(() => setSubmitting(false));
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="mt-5" style={{ maxWidth: '600px' }}>
      <h3>{isEdit ? 'Edit Case' : 'Add New Case'}</h3>
      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="caseTitle" className="mb-3">
          <Form.Label>Title</Form.Label>
          <Form.Control
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group controlId="caseDescription" className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            name="description"
            as="textarea"
            rows={4}
            value={formData.description}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group controlId="caseStatus" className="mb-3">
          <Form.Label>Status</Form.Label>
          <Form.Control
            name="status"
            type="text"
            value={formData.status}
            onChange={handleChange}
          />
        </Form.Group>

        <Button type="submit" disabled={submitting}>
          {submitting ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Case' : 'Create Case')}
        </Button>
      </Form>
    </Container>
  );
}
