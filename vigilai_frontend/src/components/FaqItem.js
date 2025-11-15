import React from 'react';

const FaqItem = ({ faq, onToggle }) => (
  <div className="faq-item mb-4">
    <div className="d-flex justify-content-between align-items-start">
      <div className="flex-grow-1">
        <h3 className="h5 fw-bold mb-2">{faq.question}</h3>
        {faq.isOpen && (
          <p className="text-muted mb-0">{faq.answer}</p>
        )}
      </div>
      <button 
        className="btn btn-link text-decoration-none p-0 ms-3 border-0 shadow-none"
        onClick={() => onToggle(faq.id)}
        aria-label={faq.isOpen ? "Collapse answer" : "Expand answer"}
      >
        <i 
          className={`bi ${faq.isOpen ? 'bi-dash-circle' : 'bi-plus-circle'} fs-4 text-primary`}
          aria-hidden="true"
        ></i>
      </button>
    </div>
  </div>
);

export default FaqItem;