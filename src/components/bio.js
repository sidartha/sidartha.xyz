/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.com/docs/use-static-query/
 */

import * as React from "react"
import { useStaticQuery, graphql } from "gatsby"
import { StaticImage } from "gatsby-plugin-image"

const Bio = () => {
  const data = useStaticQuery(graphql`
    query BioQuery {
      site {
        siteMetadata {
          author {
            name
            summary
          }
          social {
            twitter
          }
        }
      }
    }
  `)

  // Set these values by editing "siteMetadata" in gatsby-config.js
  const author = data.site.siteMetadata?.author
  // const social = data.site.siteMetadata?.social

  return (
    <div className="bio">
      <StaticImage
        className="bio-avatar"
        layout="fixed"
        formats={["AUTO", "WEBP", "AVIF"]}
        src="../images/profile-pic.jpg"
        width={80}
        height={80}
        quality={95}
        alt="Profile picture"
      />
      {author?.name && (
        <p>
          <span role="img" aria-label="Wave">👋</span> Hello! I am a <strong>software engineer</strong> from Petaling Jaya, Malaysia and I graduated from <strong>Georgia Tech <span role="img" aria-label="Yellow Jacket">🐝</span></strong> in May 2021. I plan on sharing my thoughts on computers, photography, and more here. 
          {/* {` `}
          <a href={`https://twitter.com/${social?.twitter || ``}`}>
            You should follow them on Twitter
          </a> */}
        </p>
      )}
    </div>
  )
}

export default Bio
