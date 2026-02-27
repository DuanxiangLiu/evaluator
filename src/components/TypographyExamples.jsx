import React from 'react';
import { typographyClasses, weightClasses, lineHeightClasses, letterSpacingClasses } from '../utils/typography';

const TypographyExamples = () => {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className={typographyClasses.display}>Typography System Examples</h1>
      
      <section className="mt-12">
        <h2 className={typographyClasses.headline}>Display and Headline Text</h2>
        <p className={typographyClasses.body}>
          These styles are used for hero sections, landing pages, and major announcements.
        </p>
        
        <div className="mt-6 space-y-4">
          <div className="border-b pb-4">
            <h1 className={typographyClasses.display}>Display Text (5xl)</h1>
            <p className={typographyClasses.caption}>Used for hero headlines and major announcements</p>
          </div>
          
          <div className="border-b pb-4">
            <h2 className={typographyClasses.headline}>Headline Text (4xl)</h2>
            <p className={typographyClasses.caption}>Used for section headers and major content divisions</p>
          </div>
          
          <div className="border-b pb-4">
            <h3 className={typographyClasses.title}>Title Text (3xl)</h3>
            <p className={typographyClasses.caption}>Used for content titles and card headers</p>
          </div>
          
          <div className="border-b pb-4">
            <h4 className={typographyClasses.subtitle}>Subtitle Text (2xl)</h4>
            <p className={typographyClasses.caption}>Used for subsections and secondary headers</p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className={typographyClasses.headline}>Body Text Styles</h2>
        <p className={typographyClasses.body}>
          These styles are used for different types of body text throughout the application.
        </p>
        
        <div className="mt-6 space-y-6">
          <div className="border-l-4 border-primary-500 pl-4">
            <p className={typographyClasses.bodyLarge}>
              <strong>Large Body Text:</strong> This is an example of large body text. 
              It's perfect for introductory paragraphs or content that needs extra emphasis.
              The increased font size and relaxed line height improve readability for longer passages.
            </p>
          </div>
          
          <div className="border-l-4 border-primary-500 pl-4">
            <p className={typographyClasses.body}>
              <strong>Regular Body Text:</strong> This is an example of regular body text. 
              It's the default style for most content in your application. The optimal line height 
              and character count (65ch) ensure comfortable reading across different devices.
            </p>
          </div>
          
          <div className="border-l-4 border-primary-500 pl-4">
            <p className={typographyClasses.bodySmall}>
              <strong>Small Body Text:</strong> This is an example of small body text. 
              It's useful for secondary content, footnotes, or information that needs to be 
              presented more compactly while maintaining readability.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className={typographyClasses.headline}>UI Element Text</h2>
        <p className={typographyClasses.body}>
          These styles are used for buttons, labels, captions, and other UI elements.
        </p>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border rounded-lg">
            <h3 className={typographyClasses.title}>Labels</h3>
            <div className="mt-4 space-y-2">
              <label className={typographyClasses.label}>Form Label</label>
              <input 
                type="text" 
                placeholder="Enter text..." 
                className="w-full p-2 border rounded"
              />
              <label className={typographyClasses.label}>Another Label</label>
              <select className="w-full p-2 border rounded">
                <option>Option 1</option>
                <option>Option 2</option>
              </select>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className={typographyClasses.title}>Buttons</h3>
            <div className="mt-4 space-y-2">
              <button className={`${typographyClasses.button} ${weightClasses.medium} px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700`}>
                Primary Button
              </button>
              <button className={`${typographyClasses.button} ${weightClasses.medium} px-4 py-2 border border-primary-600 text-primary-600 rounded hover:bg-primary-50`}>
                Secondary Button
              </button>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className={typographyClasses.title}>Captions</h3>
            <div className="mt-4">
              <img 
                src="https://via.placeholder.com/400x200" 
                alt="Example image" 
                className="w-full rounded"
              />
              <p className={`${typographyClasses.caption} mt-2`}>
                Figure 1: Example image with caption text demonstrating the caption style.
              </p>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className={typographyClasses.title}>Links</h3>
            <div className="mt-4 space-y-2">
              <a href="#" className={typographyClasses.link}>This is a standard link</a>
              <p className={typographyClasses.body}>
                This is a paragraph with an <a href="#" className={typographyClasses.link}>inline link</a> in it.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className={typographyClasses.headline}>Font Weights</h2>
        <p className={typographyClasses.body}>
          Different font weights create visual hierarchy and emphasis.
        </p>
        
        <div className="mt-6 space-y-3">
          <p className={weightClasses.thin}>Thin (100) - Lightest weight for artistic display</p>
          <p className={weightClasses.extralight}>Extralight (200) - Very light for large headings</p>
          <p className={weightClasses.light}>Light (300) - Light weight for subheadings</p>
          <p className={weightClasses.normal}>Normal (400) - Default weight for body text</p>
          <p className={weightClasses.medium}>Medium (500) - Medium weight for emphasis</p>
          <p className={weightClasses.semibold}>Semibold (600) - Semibold for subheadings</p>
          <p className={weightClasses.bold}>Bold (700) - Bold for headings and emphasis</p>
          <p className={weightClasses.extrabold}>Extrabold (800) - Extra bold for large headings</p>
          <p className={weightClasses.black}>Black (900) - Heaviest weight for display text</p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className={typographyClasses.headline}>Line Heights</h2>
        <p className={typographyClasses.body}>
          Line height affects readability and visual rhythm.
        </p>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border rounded-lg">
            <h3 className={typographyClasses.title}>Tight (1.25)</h3>
            <p className={`${lineHeightClasses.tight} ${typographyClasses.body}`}>
              This text has tight line height. It's best used for headings and display text where vertical space is limited.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className={typographyClasses.title}>Normal (1.5)</h3>
            <p className={`${lineHeightClasses.normal} ${typographyClasses.body}`}>
              This text has normal line height. It's the default for body text and provides good readability.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className={typographyClasses.title}>Relaxed (1.625)</h3>
            <p className={`${lineHeightClasses.relaxed} ${typographyClasses.body}`}>
              This text has relaxed line height. It's ideal for longer passages and improves reading comfort.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className={typographyClasses.title}>Loose (2.0)</h3>
            <p className={`${lineHeightClasses.loose} ${typographyClasses.body}`}>
              This text has loose line height. It's used for special cases where maximum readability is needed.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className={typographyClasses.headline}>Letter Spacing</h2>
        <p className={typographyClasses.body}>
          Letter spacing affects character density and readability.
        </p>
        
        <div className="mt-6 space-y-4">
          <div className="p-4 border rounded-lg">
            <p className={`${letterSpacingClasses.tighter} ${typographyClasses.body}`}>
              Tighter (-0.05em) - Used for large bold headings to create tight, impactful text
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <p className={`${letterSpacingClasses.normal} ${typographyClasses.body}`}>
              Normal (0em) - Default spacing for most body text and standard content
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <p className={`${letterSpacingClasses.wide} ${typographyClasses.body}`}>
              Wide (0.025em) - Slightly increased spacing for improved readability
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <p className={`${letterSpacingClasses.widest} ${typographyClasses.body}`}>
              Widest (0.1em) - Maximum spacing for labels, captions, and accessibility
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className={typographyClasses.headline}>Code Text</h2>
        <p className={typographyClasses.body}>
          Code text uses a monospace font family for technical content.
        </p>
        
        <div className="mt-6 space-y-4">
          <div className="p-4 border rounded-lg bg-gray-50">
            <h3 className={typographyClasses.title}>Inline Code</h3>
            <p className={typographyClasses.body}>
              You can use inline code like <code className={typographyClasses.codeInline}>const variable = 'value'</code> 
              within paragraphs.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg bg-gray-50">
            <h3 className={typographyClasses.title}>Code Block</h3>
            <pre className={`${typographyClasses.code} p-4 bg-gray-900 text-white rounded overflow-x-auto`}>
              <code>{`function example() {
  const message = 'Hello, World!';
  console.log(message);
  return message;
}`}
              </code>
            </pre>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className={typographyClasses.headline}>Readability Classes</h2>
        <p className={typographyClasses.body}>
          These classes control the maximum width of text for optimal reading experience.
        </p>
        
        <div className="mt-6 space-y-6">
          <div className="p-4 border rounded-lg">
            <h3 className={typographyClasses.title}>Narrow (45ch)</h3>
            <p className={`${typographyClasses.body} text-readable-narrow`}>
              This text has a narrow maximum width of 45 characters. It's ideal for sidebars, 
              narrow columns, or content that needs to be presented in a compact format.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className={typographyClasses.title}>Normal (65ch)</h3>
            <p className={`${typographyClasses.body} text-readable`}>
              This text has a normal maximum width of 65 characters. This is the optimal line length 
              for body text according to readability research. It provides the best balance between 
              reading speed and comprehension for most users.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className={typographyClasses.title}>Wide (85ch)</h3>
            <p className={`${typographyClasses.body} text-readable-wide`}>
              This text has a wide maximum width of 85 characters. It can be used for content that 
              needs to utilize more horizontal space, though it may require slightly larger font sizes 
              or increased line height to maintain optimal readability.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className={typographyClasses.headline}>Text Alignment</h2>
        <p className={typographyClasses.body}>
          Text alignment classes control the horizontal positioning of text.
        </p>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border rounded-lg">
            <h3 className={typographyClasses.title}>Left</h3>
            <p className={`${typographyClasses.body} text-left`}>
              Left-aligned text is the default and most readable for most content.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className={typographyClasses.title}>Center</h3>
            <p className={`${typographyClasses.body} text-center`}>
              Centered text is used for headings, captions, and short decorative text.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className={typographyClasses.title}>Right</h3>
            <p className={`${typographyClasses.body} text-right`}>
              Right-aligned text is used for specific design purposes or RTL languages.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className={typographyClasses.headline}>Text Transforms</h2>
        <p className={typographyClasses.body}>
          Text transform classes control the capitalization of text.
        </p>
        
        <div className="mt-6 space-y-4">
          <div className="p-4 border rounded-lg">
            <p className={`${typographyClasses.body} uppercase`}>
              UPPERCASE TEXT - Used for labels, buttons, and emphasis
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <p className={`${typographyClasses.body} lowercase`}>
              LOWERCASE TEXT - Used for specific design requirements
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <p className={`${typographyClasses.body} capitalize`}>
              Capitalized Text - Used For Titles And Headings
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className={typographyClasses.headline}>Accessibility Features</h2>
        <p className={typographyClasses.body}>
          The typography system includes several accessibility features.
        </p>
        
        <div className="mt-6 space-y-4">
          <div className="p-4 border rounded-lg">
            <h3 className={typographyClasses.title}>Skip Link</h3>
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            <p className={`${typographyClasses.bodySmall} mt-2`}>
              Press Tab to see the skip link appear. This helps keyboard users navigate quickly to main content.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className={typographyClasses.title}>Focus Indicators</h3>
            <button className={`${typographyClasses.button} px-4 py-2 bg-primary-600 text-white rounded`}>
              Focus me (Tab to test)
            </button>
            <p className={`${typographyClasses.bodySmall} mt-2`}>
              All interactive elements have visible focus indicators for keyboard navigation.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className={typographyClasses.title}>Visually Hidden Text</h3>
            <button className={`${typographyClasses.button} px-4 py-2 bg-primary-600 text-white rounded`}>
              <span className="visually-hidden">Download </span>
              PDF
            </button>
            <p className={`${typographyClasses.bodySmall} mt-2`}>
              Screen readers will announce "Download PDF" while visual users see only "PDF".
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className={typographyClasses.headline}>Responsive Behavior</h2>
        <p className={typographyClasses.body}>
          Resize your browser to see how typography scales smoothly across different viewport sizes.
        </p>
        
        <div className="mt-6 p-4 border rounded-lg">
          <h1 className={typographyClasses.display}>Responsive Display Text</h1>
          <h2 className={typographyClasses.headline}>Responsive Headline Text</h2>
          <h3 className={typographyClasses.title}>Responsive Title Text</h3>
          <p className={typographyClasses.body}>
            This body text will scale smoothly as you resize the browser window. 
            The fluid typography system uses CSS clamp() functions to ensure optimal 
            readability at all viewport sizes.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className={typographyClasses.headline}>Font Optimization</h2>
        <p className={typographyClasses.body}>
          Different rendering modes for performance vs. legibility.
        </p>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border rounded-lg">
            <h3 className={typographyClasses.title}>Optimized Rendering</h3>
            <p className={`${typographyClasses.body} font-optimized`}>
              This text uses optimized rendering with kerning, ligatures, and contextual alternates 
              enabled. Best for headings and static content where legibility is paramount.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className={typographyClasses.title}>Fast Rendering</h3>
            <p className={`${typographyClasses.body} font-fast`}>
              This text uses fast rendering with advanced typography features disabled. 
              Best for animations, scrolling content, and performance-critical areas.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12 mb-8">
        <h2 className={typographyClasses.headline}>Complete Example</h2>
        <p className={typographyClasses.body}>
          Here's a complete example showing how all typography elements work together.
        </p>
        
        <article className="mt-6 p-6 border rounded-lg">
          <header>
            <span className={typographyClasses.label}>Article</span>
            <h1 className={`${typographyClasses.display} mt-2`}>
              The Art of Typography in Modern Web Design
            </h1>
            <p className={`${typographyClasses.caption} mt-2`}>
              Published on February 27, 2026 • 5 min read
            </p>
          </header>
          
          <div className="mt-6">
            <h2 className={typographyClasses.title}>Introduction</h2>
            <p className={`${typographyClasses.body} mt-2`}>
              Typography is more than just choosing fonts. It's about creating a visual hierarchy 
              that guides users through content, enhances readability, and reinforces brand identity.
            </p>
          </div>
          
          <div className="mt-6">
            <h2 className={typographyClasses.title}>Key Principles</h2>
            <p className={`${typographyClasses.body} mt-2`}>
              Effective typography follows several key principles:
            </p>
            <ul className={`${typographyClasses.body} mt-2 list-disc list-inside`}>
              <li>Establish a clear hierarchy with consistent font sizes</li>
              <li>Use appropriate line heights for readability</li>
              <li>Apply letter spacing thoughtfully based on font weight</li>
              <li>Ensure adequate contrast for accessibility</li>
              <li>Implement responsive scaling for all devices</li>
            </ul>
          </div>
          
          <div className="mt-6">
            <h2 className={typographyClasses.title}>Technical Implementation</h2>
            <p className={`${typographyClasses.body} mt-2`}>
              Modern CSS provides powerful tools for typography optimization:
            </p>
            <pre className={`${typographyClasses.code} mt-2 p-4 bg-gray-900 text-white rounded overflow-x-auto`}>
              <code>{`:root {
  --font-size-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --line-height-normal: 1.5;
  --letter-spacing-normal: 0;
}`}
              </code>
            </pre>
          </div>
          
          <div className="mt-6">
            <h2 className={typographyClasses.title}>Conclusion</h2>
            <p className={`${typographyClasses.body} mt-2`}>
              By following these principles and using the right tools, you can create typography 
              that not only looks beautiful but also enhances user experience and accessibility.
            </p>
          </div>
          
          <footer className="mt-6 pt-6 border-t">
            <button className={`${typographyClasses.button} ${weightClasses.medium} px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700`}>
              Share Article
            </button>
          </footer>
        </article>
      </section>
    </div>
  );
};

export default TypographyExamples;
