import React from "react";

/**
 * SafeHtmlRenderer
 * Renders HTML content safely from the VisualEditor.
 * Applies proper styling to HTML elements with XSS protection.
 */
export const SafeHtmlRenderer = ({ html, className = "" }) => {
  if (!html) return null;

  // Create a temporary DOM to parse and sanitize HTML
  const sanitizeHtml = (dirtyHtml) => {
    const temp = document.createElement("div");
    temp.innerHTML = dirtyHtml;

    // List of allowed tags
    const allowedTags = [
      "p",
      "div",
      "span",
      "strong",
      "em",
      "u",
      "del",
      "br",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "a",
      "blockquote",
    ];

    // List of allowed attributes
    const allowedAttributes = {
      a: ["href", "target", "rel", "class"],
      "*": ["class"],
    };

    const sanitizeNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();

        // Remove disallowed tags
        if (!allowedTags.includes(tagName)) {
          // Replace tag with just its text content
          const textNode = document.createTextNode(node.textContent);
          while (node.firstChild) {
            node.removeChild(node.firstChild);
          }
          node.appendChild(textNode);
          return node;
        }

        // Remove disallowed attributes
        const allowedAttrs =
          allowedAttributes[tagName] || allowedAttributes["*"] || [];
        const attributes = Array.from(node.attributes);
        attributes.forEach((attr) => {
          if (!allowedAttrs.includes(attr.name)) {
            node.removeAttribute(attr.name);
          } else if (attr.name === "href" && !attr.value.startsWith("http")) {
            // Ensure links are safe
            if (
              !attr.value.startsWith("#") &&
              !attr.value.startsWith("mailto:")
            ) {
              node.removeAttribute(attr.name);
            }
          }
        });

        // Recursively sanitize children
        Array.from(node.childNodes).forEach((child) => {
          sanitizeNode(child);
        });
      }

      return node;
    };

    sanitizeNode(temp);
    return temp.innerHTML;
  };

  const cleanHtml = sanitizeHtml(html);

  return (
    <>
      <style>{`
                .safe-html-renderer h1 {
                    font-size: 1.875rem;
                    font-weight: 800;
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                    color: #fff;
                    line-height: 1.2;
                }
                .safe-html-renderer h2 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-top: 1.25rem;
                    margin-bottom: 0.5rem;
                    color: #fff;
                    line-height: 1.3;
                }
                .safe-html-renderer h3 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin-top: 1rem;
                    margin-bottom: 0.5rem;
                    color: #fff;
                    line-height: 1.4;
                }
                .safe-html-renderer h4,
                .safe-html-renderer h5,
                .safe-html-renderer h6 {
                    font-weight: 600;
                    color: #fff;
                    margin-top: 0.75rem;
                    margin-bottom: 0.5rem;
                }
                .safe-html-renderer strong {
                    color: #fff;
                    font-weight: 700;
                }
                .safe-html-renderer em {
                    font-style: italic;
                    color: #e0e7ff;
                }
                .safe-html-renderer u {
                    text-decoration: underline;
                    text-decoration-color: #818cf8;
                    text-decoration-thickness: 2px;
                }
                .safe-html-renderer del {
                    text-decoration: line-through;
                    color: #9ca3af;
                }
                .safe-html-renderer a {
                    color: #818cf8;
                    text-decoration: underline;
                    cursor: pointer;
                    transition: color 0.2s;
                }
                .safe-html-renderer a:hover {
                    color: #a5b4fc;
                    text-decoration: none;
                }
                .safe-html-renderer ul {
                    list-style-type: disc;
                    margin-left: 1.5rem;
                    margin-top: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                .safe-html-renderer ol {
                    list-style-type: decimal;
                    margin-left: 1.5rem;
                    margin-top: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                .safe-html-renderer li {
                    margin-bottom: 0.25rem;
                    line-height: 1.6;
                }
                .safe-html-renderer blockquote {
                    border-left: 4px solid #818cf8;
                    padding-left: 1rem;
                    color: #d1d5db;
                    font-style: italic;
                    margin-left: 0;
                    margin-top: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                .safe-html-renderer p {
                    margin-top: 0.5rem;
                    margin-bottom: 0.5rem;
                    line-height: 1.6;
                }
                .safe-html-renderer br {
                    display: block;
                    height: 0.5rem;
                    content: '';
                }
            `}</style>
      <div
        className={`safe-html-renderer max-w-none text-white/90 leading-relaxed ${className}`}
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    </>
  );
};
