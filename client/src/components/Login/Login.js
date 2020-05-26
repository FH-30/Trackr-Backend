import React, { Component } from 'react';
import { BrowserRouter as Router, Route, NavLink} from 'react-router-dom';
import SignUpForm from './SignUpForm';
import SignInForm from './SignInForm';
import Logo from './logo.png';
import '../../App.css';

class Login extends Component {

    render() {
      return (
      <Router>
      <div className="App">
        <div className="App__Aside">
          <img className="centerLogo" src={Logo} height="375" width="500"/>
        </div>
        <div className="App__Form">
  
          <div className="PageSwitcher">
            <NavLink exact to="/" activeClassName="PageSwitcher__Item--Active" className="PageSwitcher__Item">Sign In</NavLink>
            <NavLink to="/sign-up" activeClassName="PageSwitcher__Item--Active" className="PageSwitcher__Item">Sign Up</NavLink>
          </div>
  
          <div className="FormTitle">
            <NavLink exact to="/" activeClassName="FormTitle__Link--Active" className="FormTitle__Link"> Sign In</NavLink> or 
            <NavLink to="/sign-up" activeClassName="FormTitle__Link--Active" className="FormTitle__Link"> Sign Up</NavLink>
          </div>
  
          <Route path="/sign-up" render={(props) => <SignUpForm {...props} changeState = {this.props.changeState} />}>
          </Route>
          
          <Route exact path="/" render={(props) => <SignInForm {...props} changeState = {this.props.changeState} />}>
          </Route>

        </div>
      </div>
      </Router>
    );
  }
  }
  
  export default Login;
  