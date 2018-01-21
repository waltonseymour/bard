// @flow

import * as React from 'react';
import './App.css';

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

  componentDidMount() {
    this.userID = window.localStorage.getItem('id') || '';

    if (!this.userID) {
      this.userID = uuidv4();
      window.localStorage.setItem('id', this.userID);
    }

    this.socket = new WebSocket('wss://' + window.location.host + '/websocket');
    this.socket.onmessage = (message) => {
      this.setState({paid: true, paymentRequest: ''});
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
      body = (
        <iframe
          width="560"
          height="315"
          src="https://www.youtube.com/embed/1JlRWdNAi7I?rel=0&amp;showinfo=0"
        />);
    } else {
      body = <button onClick={this.requestInvoice} >Pay</button>;
    }

    if (this.state.paymentRequest === '') {
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
        {body}
        {paymentRequest}
      </div>
    );
  }
}

export default App;
