import React, { ReactNode } from 'react';
import './Main.scss';

type MainProps = {
  id: string;
  children: ReactNode;
};

export default ({ id, children }: MainProps): JSX.Element => (
  <main id={id} className="main">
    <div className="main-container">{children}</div>
  </main>
);
