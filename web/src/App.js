// @flow

import * as React from 'react';
import './App.css';
import Visualizer from "./Visualizer";

const uuidv4 = require('uuid/v4');

const getMessage = (method: string, value: string) => {
  return JSON.stringify({
    method,
    value
  });
};

type State = {
  paid: boolean,
  paymentRequest: string,
}

class App extends React.Component<void, State> {

  socket: WebSocket;
  userID: string;
  audioElement: HTMLAudioElement;

  state = {
    paid: false,
    paymentRequest: "",
  };

  requestInvoice = () => {
    fetch(`/invoice?userID=${this.userID}`, {
      method: 'POST'
    }).then((response) => {
      return response.json();
    }).then((data) => {
      console.log(data);
      this.setState({ paymentRequest: data.payment_request });
    }).catch((err) => {
      console.error(err);
    });
  }


  onPayment = () => {
    this.setState({paid: true, paymentRequest: ''}, () => {
      const v = new Visualizer({
        canvasElement: document.getElementById('canvas'),
        musicElement: document.getElementById('music'),
        height: 600,
        width: 800
      });
      v.draw();
      this.audioElement.play();
    });
  }

  componentDidMount() {
    this.userID = window.localStorage.getItem('id') || '';

    if (!this.userID) {
      this.userID = uuidv4();
      window.localStorage.setItem('id', this.userID);
    }

    this.socket = new WebSocket('wss://' + window.location.host + '/websocket');
    this.socket.onmessage = () => {
      this.onPayment();
    };
    this.socket.onopen = () => {
      // allows for pairing identiy with websocket
      this.socket.send(getMessage('setUserID', this.userID));
    };
  }

  render() {
    let body;
    let paymentRequest;

    if (this.state.paid) {
      body = <canvas height={600} width={800} id="canvas"/>;
    } else {
      body = <button onClick={this.requestInvoice} >Please pay $0.01</button>;
    }

    if (this.state.paymentRequest !== '') {
      paymentRequest = (
      <div className="payment-request">
        {this.state.paymentRequest}
      </div>);
    }

    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Bard</h1>
        </header>
        <audio ref={(elt) => this.audioElement = elt} id="music" crossOrigin="anonymous"
          src="https://cdn.plyr.io/static/demo/Kishi_Bashi_-_It_All_Began_With_a_Burst.mp3" type="audio/mp3" />
        {body}
        {paymentRequest}
      </div>
    );
  }
}

export default App;
