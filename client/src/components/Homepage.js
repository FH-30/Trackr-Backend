import React from 'react'
import Board from "../board.png"
import { Link } from 'react-router-dom';
import "./Home.css"

const Homepage = () => {
  return (
    <div>
      <div className="container">
        <div className="row">
          <div className="col s7 push-s5"> 
          </div>
          <div className="col s5 pull-s7">
            <h3 style={{color: "grey", fontSize: 60, fontFamily: "Palatino"}}>Organize <span style={{fontFamily: "Palatino"}}>your job search</span></h3>
            <p className="flow-text">No more messy spreadsheet. 
              Trackr keeps track of every detail on your job application.
              Integrate with your preferred job search engine for an even better experience.</p>
          </div>
        </div>
        <div className="row topMargin">
          <div className="col s4">
            <div className="card">
              <div className="card-image">
                <img src={Board} />
              </div>
              <div className="card-content">
                <h4 className="center">Interactive</h4>
                <p className="center">Organize your job search by using simple drag and drop features. 
                  Track them on each stage or switch to calendar view whenever needed.</p>
              </div>
              <div className="card-action">
                <Link to="/dashboard">Try it here!</Link>
              </div>
            </div>
          </div>
          <div className="col s4">
            <div className="card">
              <div className="card-image">
                <img src={Board} />
              </div>
              <div className="card-content">
                <h4 className="center">Reminders</h4>
                <p className="center">No more missed deadline on job application. Trackr sends you reminders
                  on approaching application deadline and interview schedule.</p>
              </div>
              <div className="card-action">
                <Link to="/dashboard">See it here!</Link>
              </div>
            </div>
          </div>
          <div className="col s4">
            <div className="card">
              <div className="card-image">
                <img src={Board} />
              </div>
              <div className="card-content">
                <h4 className="center">Integrate</h4>
                <p className="center">Integrate your LinkedIn account with Trackr. 
                This way, your bookmark on LinkedIn job search will be automatically added into your board. </p>
              </div>
              <div className="card-action">
                <Link to="/sign-up">Integrate it here!</Link>
              </div>
            </div>
          </div>
          </div>
        </div>
        </div>
  )
}

export default Homepage