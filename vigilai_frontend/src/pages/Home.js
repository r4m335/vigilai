import React, { useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './HeroPage.css';
import './QuestionLayout.css';

const Home = () => {
  // State for FAQ items
  const [faqItems, setFaqItems] = useState([
    {
      id: 1,
      question: "What is VigilAI and how does it assist in criminal investigations?",
      answer: "VigilAI is an intelligent crime investigation system that predicts probable suspects using data-driven machine learning models. It compiles and analyzes data from cases, evidence, and criminal records to provide actionable insights that help investigators make faster and more accurate decisions.",
      isOpen: true
    },
    {
      id: 2,
      question: "How does VigilAI use machine learning to predict suspects?",
      answer: "VigilAI's ML model analyzes structured crime data — including case details, previous criminal patterns, and behavioral correlations — to identify individuals most likely involved in a given case. The algorithm assigns probabilities to potential suspects, reducing manual workload and human bias.",
      isOpen: false
    },
    {
      id: 3,
      question: "Why is VigilAI more efficient than traditional investigation methods?",
      answer: "Traditional investigations rely heavily on manual analysis, paperwork, and intuition. VigilAI automates these processes, enabling real-time data analysis, centralized record management, and faster suspect prediction. This reduces investigation time, minimizes human error, and ensures consistent, data-backed outcomes.",
      isOpen: false
    }
  ]);

  // Toggle FAQ item
  const toggleFaq = (id) => {
    setFaqItems(faqItems.map(item => 
      item.id === id 
        ? { ...item, isOpen: !item.isOpen }
        : item
    ));
  };

  // Scroll to section functions
  const scrollToQuestions = () => {
    const questionsSection = document.getElementById('questions-section');
    if (questionsSection) {
      questionsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToStatistics = () => {
    const statsSection = document.getElementById('statistics-section');
    if (statsSection) {
      statsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToFAQ = () => {
    const faqSection = document.getElementById('faq-section');
    if (faqSection) {
      faqSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToFooter = () => {
    const footer = document.getElementById('footer');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      {/* Header */}
      <header className="navbar navbar-expand-lg navbar-light bg-white shadow-sm fixed-top">
        <Container>
          <div className="navbar-brand fw-bold text-primary fs-3">VigilAI</div>
          
          <nav className="navbar-nav mx-auto" aria-label="Main navigation">
            <button onClick={scrollToQuestions} className="nav-link px-3 border-0 bg-transparent">
              Solutions For
            </button>
            <button onClick={scrollToStatistics} className="nav-link px-3 border-0 bg-transparent">
              Resources
            </button>
            <button onClick={scrollToFAQ} className="nav-link px-3 border-0 bg-transparent">
              FAQ
            </button>
            <button onClick={scrollToFooter} className="nav-link px-3 border-0 bg-transparent">
              About
            </button>
          </nav>

          <div className="navbar-nav ms-auto">
            <Link to="/login" className="btn btn-outline-primary me-2">Sign In</Link>
            <Link to="/register" className="btn btn-primary">Sign Up</Link>
          </div>
        </Container>
      </header>

      {/* Full-Width Hero Section with Background Image */}
      <div 
        className="position-relative d-flex align-items-center justify-content-center text-white"
        style={{
          minHeight: '100vh',
          backgroundImage: 'url("/media/future.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'scroll',
        }}
      >
        {/* Semi-transparent dark layer for text contrast */}
        <div 
          className="position-absolute top-0 start-0 w-100 h-100" 
          style={{
            backgroundColor: 'rgba(0,0,0,0.55)',
            zIndex: 1
          }}
        ></div>

        {/* Content layer above overlay */}
        <Container className="position-relative text-center" style={{ zIndex: 2 }}>
          <Row className="justify-content-center">
            <Col lg={8} xl={6}>
              <h1 className="fw-bold display-4 mb-4 text-white">
                Simplify Manual and Recurring Tasks with Intelligent Automation
              </h1>
              <p className=" mb-4 fs-5 text-white" style={{ textShadow: '0 1px 3px rgba(255, 255, 255, 0.3)' }}>
                Build custom workflows, automate investigative processes, and digitize case management for faster, more accurate outcomes.
              </p>
              <Link 
                to="/login" 
                className="btn btn-primary btn-lg px-5 py-3 fw-bold fs-5"
              >
                TOUR OUR INVESTIGATION AUTOMATION SOFTWARE
              </Link>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Hero Section with Background Image - Questions Section */}
      <div 
        id="questions-section"
        className="position-relative d-flex align-items-center justify-content-center"
        style={{
          minHeight: '100vh',
          backgroundImage: 'url("/media/Hero.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'scroll',
        }}
      >
        {/* Semi-transparent dark layer for text contrast */}
        <div 
          className="position-absolute top-0 start-0 w-100 h-100" 
          style={{
            backgroundColor: 'rgba(0,0,0,0.55)',
            zIndex: 1
          }}
        ></div>

        {/* Content layer above overlay */}
        <Container className="position-relative py-5" style={{ zIndex: 2 }}>
          <Row className="justify-content-center text-center py-5">
            <Col lg={10}>
              <h1 className="fw-bold display-4 mb-4 text-white">
                Overcome the Burden of Manual Investigation Processes
              </h1>
              <p className="text-white mb-5 fs-5" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                Intelligent suspect prediction and automated workflows for faster, more accurate criminal investigations.
              </p>
              
              {/* Question Layout */}
              <div className="layout-container position-relative mt-5">
                {/* Central Image */}
                <div className="central-image-container">
                  <img
                    src="/media/guy.png"
                    alt="Law enforcement professional"
                    className="central-image"
                  />
                </div>

                {/* Question Cards */}
                <Card className="question-card top-card">
                  <Card.Body className="p-3">
                    <Card.Text className="question-text">
                      Do you provide investigators with intelligent suspect prediction capabilities?
                    </Card.Text>
                  </Card.Body>
                </Card>

                <Card className="question-card right-card">
                  <Card.Body className="p-3">
                    <Card.Text className="question-text">
                      Does your investigative team have tools for automated analysis and approvals?
                    </Card.Text>
                  </Card.Body>
                </Card>

                <Card className="question-card bottom-card">
                  <Card.Body className="p-3">
                    <Card.Text className="question-text">
                      Are your case management systems integrated seamlessly across departments?
                    </Card.Text>
                  </Card.Body>
                </Card>

                <Card className="question-card left-card">
                  <Card.Body className="p-3">
                    <Card.Text className="question-text">
                      Are you able to consistently deliver timely and accurate investigative outcomes?
                    </Card.Text>
                  </Card.Body>
                </Card>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Solution Section with Background Image */}
      <div 
        className="position-relative d-flex align-items-center justify-content-center"
        style={{
          minHeight: '60vh',
          backgroundImage: 'url("/media/solution.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'scroll',
        }}
      >
        {/* Semi-transparent dark layer for text contrast */}
        <div 
          className="position-absolute top-0 start-0 w-100 h-100" 
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1
          }}
        ></div>

        {/* Content layer above overlay */}
        <Container className="position-relative py-5 solution-section" style={{ zIndex: 2 }}>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="fw-bold mb-3 text-white">Our Intelligent Solution</h2>
              <p className="text-white fs-5" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                Transforming criminal investigations with AI-powered workflows
              </p>
            </Col>
          </Row>
          
          <Row className="g-3">
            <Col md={4}>
              <Card className="h-100 border-0 shadow solution-card">
                <Card.Body className="p-4 text-center">
                  <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3">
                    <i className="bi bi-cpu text-primary fs-4"></i>
                  </div>
                  <Card.Title className="fw-bold mb-3 text-dark">Suspect Prediction Algorithm</Card.Title>
                  <Card.Text className="text-muted">
                    Machine learning models analyze case details and past behavior to predict likely suspects.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="h-100 border-0 shadow solution-card">
                <Card.Body className="p-4 text-center">
                  <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3">
                    <i className="bi bi-diagram-3 text-primary fs-4"></i>
                  </div>
                  <Card.Title className="fw-bold mb-3 text-dark">Integrated Case Management</Card.Title>
                  <Card.Text className="text-muted">
                    Unified digital platform for case files, evidence and inter-departmental collaboration.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="h-100 border-0 shadow solution-card">
                <Card.Body className="p-4 text-center">
                  <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3">
                    <i className="bi bi-graph-up-arrow text-primary fs-4"></i>
                  </div>
                  <Card.Title className="fw-bold mb-3 text-dark">Real-Time Data Processing</Card.Title>
                  <Card.Text className="text-muted">
                    Instant updates, automated analysis, and decision-ready insights for investigators.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Statistics Section with Background Image */}
      <div 
        id="statistics-section"
        className="position-relative d-flex align-items-center justify-content-center"
        style={{
          minHeight: '80vh',
          backgroundImage: 'url("/media/stats.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'scroll',
        }}
      >
        {/* Semi-transparent dark layer for text contrast */}
        <div 
          className="position-absolute top-0 start-0 w-100 h-100" 
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1
          }}
        ></div>

        {/* Content layer above overlay */}
        <div className="position-relative py-5" style={{ zIndex: 2, width: '100%' }}>
          <Container>
            <Row className="text-center mb-5">
              <Col>
                <h2 className="fw-bold mb-3 text-white">Why Civil Force Partner with VigilAI for Government Optimization</h2>
                <p className="text-white fs-5" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                  Our scalable software suite of intelligent investigation tools, predictive analytics, 
                  and integrated systems enables law enforcement agencies to create custom digital 
                  solutions to meet their unique investigative needs.
                </p>
                <p className="text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                  By automating investigative processes and offering AI-powered suspect prediction, 
                  you become the hero that gives investigators time back in their day.
                </p>
              </Col>
            </Row>
            
            <Row className="g-4">
              <Col md={4}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body className="text-center p-4">
                    <h2 className="fw-bold display-4 text-primary mb-3">40%</h2>
                    <p className="text-muted mb-2 fw-semibold">Average increase in process efficiency</p>
                    <p className="text-muted small">
                      Saving investigator time and improving case resolution rates
                    </p>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={4}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body className="text-center p-4">
                    <h2 className="fw-bold display-4 text-primary mb-3">0%</h2>
                    <p className="text-muted mb-2 fw-semibold">Licensing costs with open-source</p>
                    <p className="text-muted small">
                      Providing flexibility to align with any department's technology stack
                    </p>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={4}>
                <Card className="border-0 shadow-sm h-100">
                  <Card.Body className="text-center p-4">
                    <h2 className="fw-bold display-4 text-primary mb-3">100%</h2>
                    <p className="text-muted mb-2 fw-semibold">Paperless workflow adoption</p>
                    <p className="text-muted small">
                      Ideal platform for digital evidence management and case automation
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
      </div>

      {/* FAQ Section with Background Image */}
      <div 
        id="faq-section"
        className="position-relative d-flex align-items-center justify-content-center"
        style={{
          minHeight: '80vh',
          backgroundImage: 'url("/media/faq.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'scroll',
        }}
      >
        {/* Semi-transparent dark layer for text contrast */}
        <div 
          className="position-absolute top-0 start-0 w-100 h-100" 
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1
          }}
        ></div>

        {/* Content layer above overlay */}
        <div className="position-relative py-5" style={{ zIndex: 2, width: '100%' }}>
          <Container>
            <Row className="text-center mb-5">
              <Col>
                <h2 className="fw-bold mb-4 text-white">Frequently Asked Questions</h2>
              </Col>
            </Row>
            
            <Row className="justify-content-center">
              <Col lg={8}>
                {faqItems.map((faq) => (
                  <div key={faq.id} className="faq-item mb-4">
                    <Card className="border-0 shadow-sm">
                      <Card.Body className="p-4">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h5 className="fw-bold mb-3 text-dark">{faq.question}</h5>
                            {faq.isOpen && (
                              <p className="text-muted mb-0">{faq.answer}</p>
                            )}
                          </div>
                          <button 
                            className="btn btn-link text-decoration-none p-0 ms-3"
                            onClick={() => toggleFaq(faq.id)}
                            aria-label={faq.isOpen ? "Collapse answer" : "Expand answer"}
                          >
                            <i className={`bi ${faq.isOpen ? 'bi-dash-circle' : 'bi-plus-circle'} fs-4 text-primary`}></i>
                          </button>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                ))}
              </Col>
            </Row>
          </Container>
        </div>
      </div>

      {/* Enhanced CTA Section */}
      <div className="py-5 text-white position-relative overflow-hidden" style={{ 
        background: 'linear-gradient(135deg, rgba(13,110,253,0.95) 0%, rgba(10,88,202,0.95) 100%), url("/media/tech_pattern.png")',
        backgroundSize: '200% 200%, cover',
        backgroundBlendMode: 'overlay',
        animation: 'gradientFlow 10s ease infinite'
      }}>
        {/* Tech Pattern Overlay for Depth */}
        <div className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            backgroundImage: 'url("/media/circuit_pattern.svg")',
            backgroundSize: '300px',
            opacity: '0.1',
            pointerEvents: 'none'
          }}
        ></div>
        
        {/* Wave SVG */}
        <div className="position-absolute bottom-0 start-0 w-100">
          <svg 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none" 
            className="w-100" 
            style={{ height: '60px' }}
            aria-hidden="true"
          >
            <path 
              d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
              opacity=".25" 
              fill="white"
            ></path>
            <path 
              d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" 
              opacity=".5" 
              fill="white"
            ></path>
            <path 
              d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" 
              fill="white"
            ></path>
          </svg>
        </div>
        
        <Container className="position-relative">
          <Row className="text-center">
            <Col>
              <h2 
                className="fw-bold mb-4 display-4 text-shadow" 
                style={{
                  textShadow: '0 2px 6px rgba(0,0,0,0.3)'
                }}
              >
                Ready to Modernize Your Investigation Services?
              </h2>
              <Link 
                to="/register" 
                className="btn btn-light btn-lg px-5 py-3 fw-bold text-uppercase"
                style={{
                  fontSize: '1.1rem',
                  letterSpacing: '0.5px'
                }}
              >
                Let's Get Started
              </Link>
            </Col>
          </Row>
        </Container>

        {/* CSS Styles */}
        <style>
          {`
            @keyframes gradientFlow {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            
            .text-shadow {
              text-shadow: 0 2px 6px rgba(0,0,0,0.3);
            }
            
            @media (max-width: 768px) {
              .position-absolute svg {
                height: 40px !important;
              }
              .display-4 {
                font-size: calc(1.475rem + 2.7vw);
              }
            }
          `}
        </style>
      </div>

      {/* Footer */}
      <footer id="footer" className="bg-dark text-white py-4">
        <Container>
          <Row>
            <Col md={4}>
              <h5 className="fw-bold mb-3">VigilAI</h5>
              <p className="text-light">Intelligent suspect-prediction system for modern law enforcement agencies.</p>
              <p className="text-light mb-0">
                <i className="bi bi-geo-alt me-2"></i>
                302 South 4th Street, Suite 500<br />
                Manhattan, Kansas 66502
              </p>
              <p className="text-light mt-2">
                <i className="bi bi-telephone me-2"></i>
                888-228-2233
              </p>
            </Col>
            <Col md={2}>
              <h6 className="fw-bold">PRODUCTS</h6>
              <ul className="list-unstyled">
                <li><a href="#" className="text-light text-decoration-none">Suspect Prediction</a></li>
                <li><a href="#" className="text-light text-decoration-none">Case Management</a></li>
                <li><a href="#" className="text-light text-decoration-none">Evidence Tracking</a></li>
              </ul>
            </Col>
            <Col md={2}>
              <h6 className="fw-bold">SOLUTIONS</h6>
              <ul className="list-unstyled">
                <li><a href="#" className="text-light text-decoration-none">Police Departments</a></li>
                <li><a href="#" className="text-light text-decoration-none">Law Enforcement</a></li>
                <li><a href="#" className="text-light text-decoration-none">Government Agencies</a></li>
              </ul>
            </Col>
            <Col md={2}>
              <h6 className="fw-bold">RESOURCES</h6>
              <ul className="list-unstyled">
                <li><a href="#" className="text-light text-decoration-none">Documentation</a></li>
                <li><a href="#" className="text-light text-decoration-none">Case Studies</a></li>
                <li><a href="#" className="text-light text-decoration-none">API Docs</a></li>
              </ul>
            </Col>
            <Col md={2}>
              <h6 className="fw-bold">COMPANY</h6>
              <ul className="list-unstyled">
                <li><a href="#" className="text-light text-decoration-none">About Us</a></li>
                <li><a href="#" className="text-light text-decoration-none">Contact</a></li>
                <li><a href="#" className="text-light text-decoration-none">Careers</a></li>
              </ul>
            </Col>
          </Row>
          <hr className="my-4" />
          <Row>
            <Col md={6}>
              <p className="mb-0">© 2025 VigilAI. The Suspect Predictor. All rights reserved.</p>
            </Col>
            <Col md={6} className="text-md-end">
              <a href="#" className="text-decoration-none text-light me-3">Privacy Policy</a>
              <a href="#" className="text-decoration-none text-light me-3">Terms of Service</a>
              <a href="#" className="text-decoration-none text-light">Security</a>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
};

export default Home;