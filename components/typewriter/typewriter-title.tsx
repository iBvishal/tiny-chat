"use client";

import * as React from "react";
import { TITLE_WORDS, TYPEWRITER_SPEED, BLINK_INTERVAL } from "@/lib/constants";

/**
 * Animated title component for the home page
 * Uses a typewriter effect to cycle through different words
 */
export const TypewriterTitle = React.memo(function TypewriterTitle() {
    const words = React.useMemo(() => TITLE_WORDS, []);
    const [index, setIndex] = React.useState(() => Math.floor(Math.random() * words.length));
    const [subIndex, setSubIndex] = React.useState(0);
    const [reverse, setReverse] = React.useState(false);
    const [blink, setBlink] = React.useState(true);

    // Typewriter effect logic
    React.useEffect(() => {
        if (subIndex === words[index].length + 1 && !reverse) {
            const timeout = setTimeout(() => setReverse(true), TYPEWRITER_SPEED.PAUSE_AT_WORD);
            return () => clearTimeout(timeout);
        }

        if (subIndex === 0 && reverse) {
            setReverse(false);
            setIndex((prev) => {
                let next;
                do {
                    next = Math.floor(Math.random() * words.length);
                } while (next === prev && words.length > 1);
                return next;
            });
            return;
        }

        const timeout = setTimeout(() => {
            setSubIndex((prev) => prev + (reverse ? -1 : 1));
        }, reverse ? TYPEWRITER_SPEED.REVERSE : TYPEWRITER_SPEED.FORWARD);

        return () => clearTimeout(timeout);
    }, [subIndex, index, reverse, words]);

    // Cursor blink logic
    React.useEffect(() => {
        const timeout = setTimeout(() => {
            setBlink((prev) => !prev);
        }, BLINK_INTERVAL.TITLE);
        return () => clearTimeout(timeout);
    }, [blink]);

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="text-2xl md:text-4xl font-bold flex items-center">
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                    tiny-
                </span>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {words[index].substring(0, subIndex)}
                </span>
                <span className={`${blink ? "opacity-100" : "opacity-0"} transition-opacity duration-100 inline-block w-1 h-10 md:h-12 bg-gradient-to-b from-purple-600 to-pink-600 align-middle mb-1 ml-0.5`} />
            </div>
        </div>
    );
});
