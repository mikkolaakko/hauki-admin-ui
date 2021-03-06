import React from 'react';
import { LoadingSpinner } from 'hds-react';
import './LoadingIndicator.scss';

export default function LoadingIndicator({
  text,
  readyText,
}: {
  text: string;
  readyText: string;
}): JSX.Element {
  return (
    <div className="loading-indicator" data-test="loading-indicator">
      <LoadingSpinner
        small
        loadingText={text}
        loadingFinishedText={readyText}
      />
      <span className="loading-indicator-text">{text}</span>
    </div>
  );
}
