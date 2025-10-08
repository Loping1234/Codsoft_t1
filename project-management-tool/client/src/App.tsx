import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Dashboard from './pages/Dashboard';

const App = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" exact component={Dashboard} />
      </Switch>
    </Router>
  );
};

export default App;