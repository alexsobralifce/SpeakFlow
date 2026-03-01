import React from 'react';
import Link from 'next/link';

export default function Page() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Welcome to SpeakFlow</h1>
      <p>This is the Web App interface.</p>
      <ul>
        <li>
          <Link href="/conversation/test-session">
            Go to Test Conversation
          </Link>
        </li>
      </ul>
    </div>
  );
}
