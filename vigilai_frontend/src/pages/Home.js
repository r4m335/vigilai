import React from 'react';

const Home = () => {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Welcome to VigilAI</h1>
      <p style={styles.subtitle}>
        Empowering access to justice with streamlined case management and secure workflows.
      </p>
    </div>
  );
};

const styles = {
  container: {
    margin: '2rem auto',
    maxWidth: '600px',
    textAlign: 'center',
    padding: '1rem',
    fontFamily: 'Arial, sans-serif',
  },
  heading: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#555',
  },
};

export default Home;
