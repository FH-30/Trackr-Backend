import React from 'react'
import Board from "./Board.js"
import Card from "./Card.js"
import "./Board.css"

const Dashboard= () => {
  return (
    <div>
      <div className="container">
        <h4 className="center teal lighten-2" style={{color: 'white', fontSize: 24}} >Dashboard</h4>
        <div className="flexbox">
          <Board id="board-1" className="board">
            <h5 className="center" style={{color: "blue"}}>To Apply</h5>
            <Card id="card-1" className="card" draggable="true">
              <p> Card 1</p>
            </Card>
          </Board>
          <span className="divider"></span>
          <Board id="board-2" className="board">
            <h5 className="center" style={{color: "teal"}}>Applied</h5>
            <Card id="card-2" className="card" draggable="true">
              <p> Card 2</p>
            </Card>
          </Board>
          <span className="divider"></span>
          <Board id="board-3" className="board">
            <h5 className="center" style={{color: "purple"}}>Interview</h5>
            <Card id="card-3" className="card" draggable="true">
              <p> Card 3 </p>
            </Card>
          </Board>
          <span className="divider"></span>
          <Board id="board-4" className="board">
          <h5 className="center" style={{color: "green"}}>Offer</h5>
            <Card id="card-4" className="card" draggable="true">
              <p> Card 4</p>
            </Card>
          </Board>
        </div>
     </div>
    </div>
  )
}

export default Dashboard