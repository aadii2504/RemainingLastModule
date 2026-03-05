import React from "react";

/**
 * A simple, safe markdown renderer for basic formatting.
 * Handles Bold (**), Italic (*), Strikethrough (~~), Headings (#, ##), and Links.
 */
export const SafeMarkdown = ({ text, className = "" }) => {
    if (!text) return null;

    const renderMarkdown = (str) => {
        // Escape HTML to prevent XSS (basic)
        let html = str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // Headings
        html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-5 mb-2">$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>');

        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Strikethrough
        html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

        // Links [text](url)
        html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline hover:text-blue-300 transition-colors">$1</a>');

        // Lists
        html = html.replace(/^\- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>');

        // Line breaks
        html = html.replace(/\n/g, '<br />');

        return html;
    };

    return (
        <div
            className={`markdown-body ${className}`}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
        />
    );
};
