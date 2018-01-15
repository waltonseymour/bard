import * as React from 'react';
import './App.css';

const logo = require('./logo.svg');

const uuidv4 = require('uuid/v4');

const getMessage = (method: string, value: string) => {
  return JSON.stringify({
    method,
    value
  });
};

class App extends React.Component {

  state = {
    paid: false
  };

  componentDidMount() {
    let userID = window.localStorage.getItem('id') || '';

    if (!userID) {
      userID = uuidv4();
      window.localStorage.setItem('id', userID);
    }

    const socket = new WebSocket('ws://localhost:8000/websocket');
    socket.onmessage = (message) => {
      console.log(message);
    };
    socket.onopen = () => {
      // allows for pairing identiy with websocket
      socket.send(getMessage('setUserID', userID));
    };
  }

  render() {
    let body;

    if (this.state.paid) {
      body = (
        <iframe
          width="560"
          height="315"
          src="https://www.youtube.com/embed/1JlRWdNAi7I?rel=0&amp;showinfo=0"
        />);
    } else {
      body = <button onClick={() => this.setState({paid: true})} >Pay</button>;
    }

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Bard</h1>
        </header>
        {body}
      </div>
    );
  }
}

export default App;
