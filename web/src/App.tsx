import * as React from 'react';
import './App.css';

const logo = require('./logo.svg');

class App extends React.Component {

  state = {
    paid: false
  };
  
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
