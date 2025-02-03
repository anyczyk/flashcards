import React from "react";

export const parseCardText = (text) => {
    const regex = /\[(b|i)\](.*?)\[\/\1\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }

        if (match[1] === 'b') {
            parts.push(<strong key={`strong-${key++}`}>{match[2]}</strong>);
        } else if (match[1] === 'i') {
            parts.push(<em key={`italic-${key++}`}>{match[2]}</em>);
        }

        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return parts;
};

export const stripFormattingTags = (text) => {
    return text
        .replace(/\[\/?(b|i)\]/g, '') // Usuwa tagi [b], [/b], [i], [/i]
        .replace(/\//g, '');          // Usuwa wszystkie znaki "/"
};

// export const stripFormattingTags = (text) => {
//     return text.replace(/\[\/?(b|i)\]/g, '');
// };
