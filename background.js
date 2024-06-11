// background.js

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchRevisionHistory") {
    // Get OAuth token and make an API request
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
      if (chrome.runtime.lastError || !token) {
        console.error(chrome.runtime.lastError);
        return;
      }

      console.log("OAuth token obtained:", token);

      // Make the authorized API request
      fetchRevisionHistory(message.fileId, token)
        .then(data => {
          // Send the revision history data back to the content script
          sendResponse({ success: true, data: data });
        })
        .catch(error => {
          console.error('Error fetching revision history:', error);
          sendResponse({ success: false, error: error.message });
        });
    });

    // Return true to indicate that sendResponse will be called asynchronously
    return true;
  }
});

// Function to fetch revision history using OAuth token
function fetchRevisionHistory(fileId, token) {
  return new Promise((resolve, reject) => {
    fetch(`https://docs.googleapis.com/v1/documents/${fileId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch revision history');
        }
        return response.json();
      })
      .then(data => {
        resolve(data);
      })
      .catch(error => {
        reject(error);
      });
  });
}

chrome.identity.getAuthToken({ interactive: true }, function (token) {
  if (chrome.runtime.lastError || !token) {
    console.error(chrome.runtime.lastError);
    return;
  }

  console.log("OAuth token obtained:", token);

  // Fetch user's email and profile information
  fetchUserInfo(token);
});

function fetchUserInfo(token) {
  fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('Authenticated User:', data);
    // Log the user's email address
    console.log('Email:', data.email);
  })
  .catch(error => console.error('Error fetching user info:', error));
}
