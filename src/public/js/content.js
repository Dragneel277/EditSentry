// content.js

// Function to send a message to the background script to fetch revision history
function fetchRevisionHistory(fileId) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: "fetchRevisionHistory", fileId: fileId }, response => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      } else if (response && response.success) {
        resolve(response.data);
      } else {
        reject(response.error || "Unknown error occurred");
      }
    });
  });
}

// Example usage:
// Replace the existing code that calls fetchRevisionHistory() with:
fetchRevisionHistory(fileId)
  .then(data => {
    console.log('Revision History:', data);
    // Process the revision history data as needed
  })
  .catch(error => {
    console.error('Error fetching revision history:', error);
    // Display an error message if needed
  });
