import React, { Component } from 'react';
import Navbar from './Navbar'
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Dashboard from './Dashboard'
import Activity from './Activity'
import Homepage from './Homepage'
import './Home.css'

class Home extends Component {
  render() {
    return (
      <Router>
        <div>
          <Navbar changeState={this.props.changeState}/>
          <Route exact path="/" component={Homepage}/>
          <Route path="/dashboard" component={Dashboard}/>
          <Route path="/activity" component={Activity}/>
        </div>
      </Router>
    );
  }
}

export default Home