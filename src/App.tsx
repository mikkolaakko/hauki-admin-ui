import React, { ReactElement, useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Switch,
  RouteComponentProps,
} from 'react-router-dom';
import 'hds-core';
import {
  AuthTokens,
  storeTokens,
  getTokens,
  removeTokens,
  parseAuthParams,
  AuthContext,
} from './auth/auth-context';
import api from './common/utils/api/api';
import Main from './components/main/Main';
import NavigationAndFooterWrapper from './components/navigation-and-footer-wrapper/NavigationAndFooterWrapper';
import './App.scss';
import ResourcePage from './resource/page/ResourcePage';

type OptionalAuthTokens = AuthTokens | undefined;

export default function App(): JSX.Element {
  const [isLoading, setLoading] = useState<boolean>(true);
  const [authTokens, setAuthTokens] = useState<OptionalAuthTokens>();

  const saveAuthTokes = (tokens: OptionalAuthTokens): void => {
    storeTokens(tokens);
    setAuthTokens(tokens);
  };

  const onAuthFail = (message: string): void => {
    // eslint-disable-next-line no-console
    console.error(`Authentication failed: ${message}`);
    setAuthTokens(undefined);
    setLoading(false);
  };

  useEffect(() => {
    const authTokensFromQuery: OptionalAuthTokens = parseAuthParams(
      window.location.search
    );
    const storedAuthTokens: OptionalAuthTokens = getTokens();

    if (storedAuthTokens) {
      removeTokens();
    }

    if (authTokensFromQuery) {
      api
        .testAuthCredentials(authTokensFromQuery)
        .then(() => {
          saveAuthTokes(authTokensFromQuery);
          setLoading(false);
        })
        .catch((e: Error) => onAuthFail(e.message));
    } else if (storedAuthTokens) {
      api
        .testAuthCredentials(storedAuthTokens)
        .then(() => {
          saveAuthTokes(storedAuthTokens);
          setLoading(false);
        })
        .catch((e: Error) => onAuthFail(e.message));
    } else {
      onAuthFail('Missing auth tokens');
    }
  }, []);

  return (
    <div className="App">
      <AuthContext.Provider value={{ authTokens }}>
        <Router>
          <NavigationAndFooterWrapper>
            <Main id="main">
              {isLoading ? (
                <div>
                  <h1>Sovellus käynnistyy..</h1>
                </div>
              ) : (
                <Switch>
                  <Route exact path="/">
                    <h1>Etusivu</h1>
                  </Route>
                  <Route
                    id="resource-route"
                    exact
                    path="/resource/:id"
                    render={({
                      match,
                    }: RouteComponentProps<{ id: string }>): ReactElement => (
                      <ResourcePage id={match.params.id} />
                    )}
                  />
                </Switch>
              )}
            </Main>
          </NavigationAndFooterWrapper>
        </Router>
      </AuthContext.Provider>
    </div>
  );
}
