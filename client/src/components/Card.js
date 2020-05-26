import React, { Component } from 'react'

class Card extends Component {
    dragStart = (e) => {
        const target = e.target;
        e.dataTransfer.setData('card_id', target.id)
        setTimeout(() => {
        target.style.display="none";
        }, 0);
    };

    dragOver = (e) => {
        e.stopPropagation();
    };
    render(){
        return (
            <div id={this.props.id} onDragStart={this.dragStart} draggable={this.props.draggable} onDragOver={this.dragOver} className={this.props.className}>
                { this.props.children }
            </div>
        );
    }
}

export default Card