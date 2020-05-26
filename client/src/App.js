import React, { Component } from 'react';
import Login from './components/Login/Login.js';
import Home from './components/Home.js';
import './App.css';

class App extends Component {
  
  state = {
    loggedIn: true
  };

  changeState = () => {
    const { loggedIn } = this.state;
    this.setState({
      loggedIn: !loggedIn
    })
  }

  render() {
    return(this.state.loggedIn ?
      (<Home changeState={this.changeState}></Home>) :
      (<Login changeState={this.changeState}></Login>)
    )
  }
}

export default App

