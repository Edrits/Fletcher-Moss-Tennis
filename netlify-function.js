// Save this as: netlify/functions/noticeboard.js

exports.handler = async (event, context) => {
  const ADMIN_PASSWORD = 'Fletchertennis909';
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Stored securely in Netlify
  const GITHUB_USER = 'Edrits';
  const GITHUB_REPO = 'Fletcher-Moss-Tennis';
  const NOTICE_FILE = 'noticeboard.json';

  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const githubUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${NOTICE_FILE}`;

  try {
    // GET - Fetch current noticeboard
    if (event.httpMethod === 'GET') {
      const response = await fetch(githubUrl, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const content = Buffer.from(data.content, 'base64').toString('utf8');
        return {
          statusCode: 200,
          headers,
          body: content
        };
      } else if (response.status === 404) {
        // File doesn't exist yet
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: '', updated: null })
        };
      } else {
        throw new Error('Failed to fetch from GitHub');
      }
    }

    // POST - Update noticeboard
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      const { password, message } = body;

      // Verify password
      if (password !== ADMIN_PASSWORD) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Incorrect password' })
        };
      }

      // Get current file SHA (needed for updates)
      let sha = null;
      const getResponse = await fetch(githubUrl, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (getResponse.ok) {
        const getData = await getResponse.json();
        sha = getData.sha;
      }

      // Prepare new content
      const content = {
        message: message,
        updated: new Date().toISOString()
      };

      const encodedContent = Buffer.from(JSON.stringify(content)).toString('base64');

      // Save to GitHub
      const saveResponse = await fetch(githubUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Update noticeboard via function',
          content: encodedContent,
          sha: sha
        })
      });

      if (saveResponse.ok) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, content })
        };
      } else {
        const error = await saveResponse.json();
        throw new Error(error.message || 'Failed to save to GitHub');
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
};