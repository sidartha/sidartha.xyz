---
 title: Building a Podcast Website Using the Spotify API
 date: "2021-10-02T22:00:00.000Z"
 description: "Leveraging the Spotify API to build a website that dynamically updates the podcasts' episode list."
---

Last month, while I was speaking with my friend Jackson, he shared that he was considering setting up a website for [Overseas](https://open.spotify.com/show/5FhNDe0Tibe1iJOFc8KvFO). Overseas is a podcast by Dr. Tram Jones and Hannah Jones, an American couple living abroad in Port-au-Prince, Haiti. On the podcast, we hear about Haiti, its history and the wonderful people there.

I offered to help Jackson with the developing this site and we immediately got started with planning the site. 

When Jackson and I discussed creating this website, we identified the following goals that the website should achieve:

1. Serve as a way to connect future listeners to the podcasts' pages on Apple Podcasts and Spotify
1. Link to Light from Light for visitors to see the work that the organization
1. On a low budget (at most USD 15 a year)
1. There should be very minimal maintenance of the website.

Initially, we looked at using a hosted solution such as [Squarespace](https://www.squarespace.com/website-design) or [PodcastPage](https://podcastpage.io). We quickly realized that these solutions would not meet our budget of $15 a year, and a static-site generator (like Gatsby, Next or Jekyll) would be a better fit.

I decided to use [Gatsby](https://www.gatsbyjs.com) (just like this site) because I was familiar with it and knew that it could be deployed on Vercel, Cloudflare Pages or GitHub Pages without having to pay anything to host the site. This meant that our only cost would be the site's domain name. 

To satisfy the fourth goal of minimal maintenance, I started thinking how we could dynamically populate the list of podcast episodes on the homepage. After some quick research, I came across the Spotify API (specifically the [Get a Show's Episodes endpoint](https://developer.spotify.com/documentation/web-api/reference/#endpoint-get-a-shows-episodes)). This was exactly what I needed to dynamically populate the show's episodes. I created a new app on the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications), and began investigating how authorization works with the API.

## Authorization of Spotify API

Spotify provides four ways of authenticating with their API:

- Refreshable user authorization: Authorization Code Flow
- Refreshable user authorization: Authorization Code Flow With Proof Key for Code Exchange (PKCE)
- Temporary user authorization: Implicit Grant
- Refreshable app authorization: Client Credentials Flow

For the purposes of building this website, the **Client Credentials Flow** made most sense since there was no need for any user-specific information and these API calls were going to be made from a server (where the site was built).

The following snippet shows how to obtain an access token through the `client_credentials` flow.

```javascript
const axios = require("axios")
const qs = require("qs")

const SPOTIFY_API_CLIENT_ID = "idgoeshere"
const SPOTIFY_API_CLIENT_SECRET = "secretgoeshere"

// Retrieve auth token from Spotify using client_credentials mechanism
const authOptions = {
  url: "https://accounts.spotify.com/api/token",
  headers: {
    Authorization:
      "Basic " +
      Buffer.from(
        SPOTIFY_API_CLIENT_ID + ":" + SPOTIFY_API_CLIENT_SECRET,
        "utf-8"
      ).toString("base64"),
    "Content-Type": "application/x-www-form-urlencoded",
  },
  data: qs.stringify({
    grant_type: "client_credentials",
  }),
  method: "POST",
}
const authRes = await axios(authOptions)
if (!authRes || authRes.status != 200) {
  throw new Error("Spotify token request failed. Cancelling build.")
}
const accessToken = authRes.data.access_token
```

## Iterating through Pages of Show's Episodes

After getting the access token, calling the Shows API allows us to iterate through all pages of the show's episodes.

```javascript
// Get episodes from Spotify API
const episodes = []
let url = "https://api.spotify.com/v1/shows/{show_id}/episodes?market=US"

// Continue on this loop until pagination ends (i.e next URL is null)
while (url !== null) {
  const options = {
    url,
    headers: {
      Authorization: "Bearer " + accessToken,
    },
    method: "get",
  }
  const episodesRes = await axios(options)
  // append each episode to the episodes array
  episodesRes.data.items.map(episode => episodes.push(episode))
  // set url to the next page
  url = episodesRes.data.next
}
```

Here is what the JSON response from the API looks like:

```json
{
  "href": "https://api.spotify.com/v1/shows/5FhNDe0Tibe1iJOFc8KvFO/episodes?offset=4&limit=1&market=US",
  "items": [
    {
      "audio_preview_url": "https://p.scdn.co/mp3-preview/368c813bd82026b8419d28e826d985cb1ff592dc",
      "description": "In this episode we talk about how the Lespwa Timoun moved from paper to electronic.  And wait...before you tune out and think it is boring, remember that everything in Haiti is anything but mundane.",
      "duration_ms": 652617,
      "explicit": false,
      "external_urls": {
        "spotify": "https://open.spotify.com/episode/0p841lr0BDXqXD7zWvljwz"
      },
      "href": "https://api.spotify.com/v1/episodes/0p841lr0BDXqXD7zWvljwz",
      "html_description": "<p>In this episode we talk about how the Lespwa Timoun moved from paper to electronic.  And wait...before you tune out and think it is boring, remember that everything in Haiti is anything but mundane.</p>",
      "id": "0p841lr0BDXqXD7zWvljwz",
      "images": [
        {
          "height": 640,
          "url": "https://i.scdn.co/image/ab6765630000ba8afc492c0d699e4076e8e32ff7",
          "width": 640
        },
        {
          "height": 300,
          "url": "https://i.scdn.co/image/ab67656300005f1ffc492c0d699e4076e8e32ff7",
          "width": 300
        },
        {
          "height": 64,
          "url": "https://i.scdn.co/image/ab6765630000f68dfc492c0d699e4076e8e32ff7",
          "width": 64
        }
      ],
      "is_externally_hosted": false,
      "is_playable": true,
      "language": "en-US",
      "languages": ["en-US"],
      "name": "Going Electronic",
      "release_date": "2021-08-25",
      "release_date_precision": "day",
      "type": "episode",
      "uri": "spotify:episode:0p841lr0BDXqXD7zWvljwz"
    }
  ],
  "limit": 1,
  "next": "https://api.spotify.com/v1/shows/5FhNDe0Tibe1iJOFc8KvFO/episodes?offset=5&limit=1&market=US",
  "offset": 4,
  "previous": "https://api.spotify.com/v1/shows/5FhNDe0Tibe1iJOFc8KvFO/episodes?offset=3&limit=1&market=US",
  "total": 40
}
```

It's important to note that although the Spotify API documentation indicates that the `market` query parameter is optional, it is required when using the client credentials authorization flow since there isn't a user account associated with the request. Specifically, Spotify's documentation states "_If neither market or user country are provided, the content is considered unavailable for the client._"

## Creating Gatsby Nodes with data from API

After iterating through all the pages in the API's response, it's time to create a Gatsby Node for each of the episodes.

```javascript
// Create a node for each episode
episodes.map(episode => {
  const episodeData = {
    title: episode.name,
    description: episode.description,
    date: episode.release_date,
    link: episode.external_urls.spotify,
  }
  const episodeNode = {
    ...episodeData,
    // Required fields
    id: episode.uri,
    parent: `__SOURCE__`,
    internal: {
      type: `SpotifyPodcast`,
      contentDigest: createContentDigest(episodeData),
    },
    children: [],
  }
  createNode(episodeNode)
})
```

## Querying the Podcasts List

Now that the nodes have been created, we are able to query all the podcasts using GraphQL.

```javascript
export const query = graphql`
  query {
    allPodcast(sort: { fields: date, order: DESC }) {
      nodes {
        title
        description
        date(formatString: "MMMM Do, yyyy")
        link
      }
    }
  }
```

## The Result

The Overseas website has been deployed to https://overseaspodcast.com (using Vercel) and I have setup a cron job using GitHub Actions to trigger a new build once a day (leveraging [Vercel Deploy Hooks](https://vercel.com/docs/git/deploy-hooks)). This will refresh the podcasts list on the site once daily.

## Looking Ahead

In the future, I'll be looking to see if there's a way to trigger the build automatically after a new episode is published instead of running the check once a day. This would mean that the website could get updated within minutes of a new episode being published.

If you have any ideas on how I can improve this setup, please reach out by emailing sr@sidartha.xyz.  
