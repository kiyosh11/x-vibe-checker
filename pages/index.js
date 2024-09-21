import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Home.module.css';

export default function Home() {
  const [username, setUsername] = useState('');
  const [vibe, setVibe] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
    
  const description = (
    <div className={styles.description}>
      <p>
        please do not spam the "Check Vibe" button, as it won't work faster. if you receive an error it's due to rate limiting from x.com. 
        to avoid this consider hosting the application yourself on vercel and using your own app tokens. this website will be deleted after some hours so check the repo to get the code. 
      </p>
    </div>
  );

  const checkVibe = async () => {
    setLoading(true);
    setVibe(''); 
    setError('');
    try {
      const userData = await axios.get(`/api/fetchUserData?username=${username}`);
      const analysis = await axios.post('/api/analyzeVibe', { userData: userData.data });
      setVibe(analysis.data.analysis);
    } catch (error) {
      console.error('Error:', error);
      setError('Error checking vibe. Please try again.');
    }
    setLoading(false);
  };

  useEffect(() => {
    const handleContextMenu = (event) => {
      event.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>X Vibe Checker</h1>
      {description}
      <input 
        type="text" 
        value={username} 
        onChange={(e) => setUsername(e.target.value)} 
        placeholder="Enter X.com username"
        className={styles.input}
      />
      <button onClick={checkVibe} disabled={loading} className={styles.button}>
        {loading ? 'Checking...' : 'Check Vibe'}
      </button>
      {loading && <div className={styles.loader}></div>}
      {error && <div className={styles.error}>{error}</div>}
      {vibe && <div className={`${styles.result} ${styles.fadeIn} ${styles.vibeAnimation}`}><h2>Vibe Analysis:</h2><p>{vibe}</p></div>}
      <a href="https://github.com/kiyosh11/x-vibe-checker" target="_blank" rel="noopener noreferrer">
        <button className={styles.repoButton}>View Repository</button>
      </a>
    </div>
  );
    }
