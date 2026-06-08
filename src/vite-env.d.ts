/// <reference types="vite/client" />

// Fixes TSX/JSX typing issues like:
// TS7026: "JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists."
// Some environments may miss @types/react JSX globals.
import 'react';

