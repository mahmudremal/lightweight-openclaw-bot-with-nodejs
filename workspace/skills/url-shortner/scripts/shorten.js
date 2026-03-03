const https = require("https");

const args = process.argv.slice(2);
const longUrl = args[0];

if (!longUrl) {
  console.log("Usage: node scripts/shorten.js <url>");
  process.exit(1);
}

const data = JSON.stringify({ url: longUrl });

const options = {
  hostname: "ulvis.net",
  port: 443,
  path: "/api/v1/shorten",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length,
  },
};

const req = https.request(options, (res) => {
  let body = "";
  res.on("data", (chunk) => (body += chunk));
  res.on("end", () => {
    try {
      const json = JSON.parse(body);
      console.log(`\n🔗 Short URL: ${json.shortUrl}`);
    } catch (e) {
      console.error("❌ Failed to parse response");
    }
  });
});

req.on("error", (err) => {
  console.error(`❌ Error: ${err.message}`);
});

req.write(data);
req.end();

/*
https://publicapi.dev/free-url-shortener-api

Free Url Shortener API Documentation
The Free Url Shortener API allows users to shorten long URLs into more manageable and shareable links. Users can generate short links programmatically through API endpoints provided below.

Overview
Base URL: https://ulvis.net/api/v1
Authentication: No authentication is required to use this API.
Endpoints
Shorten URL
POST /shorten

Create a shortened URL from a long URL.

Parameters
url (string, required): The long URL to shorten.
Example
fetch('https://ulvis.net/api/v1/shorten', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
},
body: JSON.stringify({
url: 'https://example.com/very-long-url-that-needs-shortening',
}),
})
.then(response => response.json())
.then(data => console.log(data));
Response
{
"shortUrl": "https://ulvis.net/abc123"
}
Retrieve URL
GET /urls/{shortCode}

Retrieve the original long URL associated with a given short code.

Parameters
shortCode (string, required): The short code generated for the URL.
Example
fetch('https://ulvis.net/api/v1/urls/abc123')
.then(response => response.json())
.then(data => console.log(data));
Response
{
"originalUrl": "https://example.com/very-long-url-that-needs-shortening"
}
Delete URL
DELETE /urls/{shortCode}

Delete a shortened URL based on the short code.

Parameters
shortCode (string, required): The short code of the URL to delete.
Example
fetch('https://ulvis.net/api/v1/urls/abc123', {
method: 'DELETE',
})
.then(response => console.log('URL deleted successfully'))
.catch(error => console.error('Error deleting URL:', error));
Response
{
"message": "URL deleted successfully"
}
Rate Limiting
The Free Url Shortener API has a rate limit of 100 requests per hour per IP address.

For more information and usage guidelines, please visit the developer page.

*/
