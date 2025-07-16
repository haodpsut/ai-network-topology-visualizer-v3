
import React from 'react';
import { NodeType } from './types';

export const GEMINI_MODEL = 'gemini-2.5-flash';

export const OPENROUTER_MODELS = [
    "mistralai/mistral-7b-instruct:free",
    "google/gemma-7b-it:free",
    "nousresearch/nous-hermes-2-mixtral-8x7b-dpo:free",
    "openrouter/cinematika-7b:free",
    "gryphe/mythomist-7b:free"
];

export const ICONS: Record<NodeType, React.ReactNode> = {
  router: (
    <g transform="translate(-12, -12)">
      <path fill="#3b82f6" d="M19 13h-2V9h-2v4H5.83l1.59-1.59L16 10l-4-4-4 4 1.41 1.41L11 13H9v2h2l-1.41 1.41L11 18l4-4-4 4-1.59-1.59L7.83 15H13v4h2v-4h2v-2z" />
    </g>
  ),
  switch: (
    <g transform="translate(-12, -12)">
      <path fill="#10b981" d="M16 4h-2l-4 8H4v2h5l-4 8h2l4-8h6v-2h-5l4-8z" />
    </g>
  ),
  server: (
    <g transform="translate(-12, -12)">
      <path fill="#f97316" d="M4 2h16c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm0 14h16c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2zM5 5v2h2V5H5zm0 14v2h2v-2H5z" />
    </g>
  ),
  pc: (
    <g transform="translate(-12, -12)">
      <path fill="#8b5cf6" d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" />
    </g>
  ),
  cloud: (
     <g transform="translate(-12, -12)">
      <path fill="#0ea5e9" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
    </g>
  ),
  firewall: (
    <g transform="translate(-12, -12)">
      <path fill="#ef4444" d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3zm0 2.09L16.03 6.3l-2.12 2.12-1.41-1.41-2.12 2.12-1.41-1.41-2.12 2.12L5.97 6.3 12 4.09zm0 14.82c-1.89-1.21-3-3.79-3-6.91V8.12l3 3 3-3v4.81c0 3.12-1.11 5.7-3 6.91z" />
    </g>
  ),
  unknown: (
    <g transform="translate(-12, -12)">
      <path fill="#6b7280" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
    </g>
  ),
};
