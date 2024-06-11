document.getElementById("See_data").addEventListener('click', function () {
  console.log("View Changes button clicked");
  fetchRevisionHistory(openNewWindow);
});

document.getElementById("Save_data").addEventListener('click', function () {
  console.log("Save Data button clicked");
  fetchRevisionHistory(downloadCSV);
});

function fetchRevisionHistory(callback) {
  // Retrieve the active tab's URL
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var currentTab = tabs[0];
    var currentUrl = currentTab.url;

    // Extract the file ID from the URL
    var fileId = getFileIdFromUrl(currentUrl);

    if (fileId) {
      chrome.identity.getAuthToken({ interactive: true }, function (token) {
        if (chrome.runtime.lastError || !token) {
          console.error("Error obtaining OAuth token:", chrome.runtime.lastError);
          return;
        }

        // Fetch revision history using Google Drive API
        fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/revisions`, {
          headers: {
            'Authorization': 'Bearer ' + token
          }
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch revision history');
          }
          return response.json();
        })
        .then(data => {
          console.log('Full Revision Data:', data); // Log the full response data
          console.log('Revisions:', data.revisions);
          // Call the callback function with the fetched data
          callback(data.revisions);
        })
        .catch(error => {
          console.error('Error fetching revision history:', error);
          // Display an error message in the extension's popup
        });
      });
    } else {
      console.error("Failed to extract fileId from URL.");
      // Display an error message in the extension's popup
    }
  });
}

function getFileIdFromUrl(url) {
  // Match the fileId from the URL using a regular expression
  var match = /\/document\/d\/([^/]+)\//.exec(url);
  if (match && match.length > 1) {
    // The fileId is captured in the first capturing group
    return match[1];
  } else {
    // URL doesn't match the expected pattern
    return null;
  }
}

function openNewWindow(revisions) {
  // Construct the content to be displayed in the new window
  var content = revisions.map(revision => {
    console.log('Revision Details:', revision); // Log each revision's details
    var user = revision.lastModifyingUser?.displayName || revision.lastModifyingUser?.emailAddress || 'Unknown User';
    var email = revision.lastModifyingUser?.emailAddress || 'Unknown Email';
    var modifiedTime = new Date(revision.modifiedTime);
    var time = modifiedTime.toLocaleTimeString();
    var date = modifiedTime.toLocaleDateString();
    return { user, email, time, date };
  });

  var contentString = JSON.stringify(content, null, 2);

  // Open a new window and write the content to it
  var newWindow = window.open("", "Revision History", "width=600,height=400");
  newWindow.document.write(`<pre>${contentString}</pre>`);
}

function downloadCSV(revisions) {
  // Construct CSV content from the fetched data
  var csvContent = "User,Email,Time,Date\n";
  revisions.forEach(revision => {
    var user = revision.lastModifyingUser?.displayName || revision.lastModifyingUser?.emailAddress || 'Unknown User';
    var email = revision.lastModifyingUser?.emailAddress || 'Unknown Email';
    var modifiedTime = new Date(revision.modifiedTime);
    var time = modifiedTime.toLocaleTimeString();
    var date = modifiedTime.toLocaleDateString();
    csvContent += `${user},${email},${time},${date}\n`;
  });

  // Create a Blob containing the CSV data
  var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });

  // Create a URL for the Blob
  var url = URL.createObjectURL(blob);

  // Create a temporary <a> element to trigger the download
  var a = document.createElement('a');
  a.href = url;
  a.download = 'revision_history.csv';
  document.body.appendChild(a);

  // Click the <a> element to initiate the download
  a.click();

  // Clean up: remove the <a> element and revoke the URL
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
