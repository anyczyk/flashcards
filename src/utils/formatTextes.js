import React from "react";

export const parseCardText = (text) => {
    const regex = /\[b\](.*?)\[\/b\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }
        parts.push(<strong key={`strong-${key++}`}>{match[1]}</strong>);
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return parts;
};

export const stripBoldTags = (text) => {
    return text.replace(/\[\/?b\]/g, '');
};