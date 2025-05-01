// filepath: c:\Users\DELL\Documents\NextLevel-V4.6\src\pages\_document.js
import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* Multiple favicon formats for better browser compatibility */}
          <link rel="shortcut icon" href="/favicon.ico" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/favicon-32x32.png" />
          <meta name="theme-color" content="#ffffff" />
          
          {/* AI Study Assistant metadata */}
          <meta name="description" content="AI-powered study plans and advice assistant" />
          <meta name="keywords" content="AI, study assistant, learning, education" />
          
          {/* Make the API key available to client-side code from env variable */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.GEMINI_API_KEY = "${process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''}";
                console.log("Gemini API key loaded from environment:", !!window.GEMINI_API_KEY);
              `
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument